const provisioningService = require('../services/provisioning.service');
const sequelize = require('../config/database');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const EDD_WEBHOOK_SECRET = process.env.EDD_WEBHOOK_SECRET || 'edd_webhook_secret_key';

exports.handleEddWebhook = async (req, res) => {
  const secret = req.headers['x-edd-webhook-secret'] || req.query.secret;

  if (secret !== EDD_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Webhook secret no autorizado.' });
  }

  const payload = req.body;
  const event = payload.event; // purchase_complete | license_renewed | license_expired | refund

  console.log(`EDD Webhook received: ${event}`, payload);

  // Log Webhook to database
  try {
    await sequelize.query(
      `INSERT INTO edd_webhooks_log (event_type, license_key, payload, processed, received_at) 
       VALUES (:event, :licenseKey, :payload, false, NOW())`,
      {
        replacements: {
          event,
          licenseKey: payload.license_key || null,
          payload: JSON.stringify(payload)
        }
      }
    );
  } catch (logErr) {
    console.error('Error logging EDD webhook to database:', logErr);
  }

  try {
    switch (event) {
      case 'purchase_complete':
      case 'license_renewed':
        await provisioningService.provisionTenant({
          licenseKey: payload.license_key,
          customerEmail: payload.customer_email,
          customerName: payload.customer_name,
          productId: payload.product_id,
          expiresAt: payload.expires
        });
        break;

      case 'license_expired':
        await provisioningService.expireTenant(payload.customer_email);
        break;

      case 'refund':
        await provisioningService.refundTenant(payload.customer_email);
        break;

      default:
        console.warn(`Event type ${event} not explicitly handled by provisioning.`);
    }

    res.status(200).json({ success: true, message: `Evento ${event} procesado.` });
  } catch (error) {
    console.error(`Error processing EDD webhook event ${event}:`, error);
    res.status(500).json({ error: 'Error interno al procesar el webhook.' });
  }
};

// Webhook para recibir firma y constancia NOM-151 procesada por Nufi
exports.handleNufiWebhook = async (req, res) => {
  try {
    const payload = req.body || {};
    console.log('[NUFI WEBHOOK RECEIVED]', JSON.stringify(payload, null, 2));

    const transactionId = payload.id || payload.transaccion_id || payload.data?.id || payload.transaction_id;
    const base64SignedDoc = payload.base64_archivo || payload.data?.base64_archivo || payload.signed_pdf_base64;
    const status = payload.status || payload.estado || 'signed';

    if (transactionId) {
      const { Document, Nom151Record } = require('../models');
      const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads';

      const doc = await Document.findOne({ where: { nufiTransactionId: String(transactionId) } });
      if (doc) {
        let signedFilePath = doc.filePath;

        // Si Nufi devuelve el PDF firmado en Base64, guardarlo en disco
        if (base64SignedDoc) {
          const cleanBase64 = base64SignedDoc.replace(/^data:application\/pdf;base64,/, '');
          const buffer = Buffer.from(cleanBase64, 'base64');
          signedFilePath = path.join(UPLOADS_DIR, `nufi-signed-${doc.id}.pdf`);
          fs.writeFileSync(signedFilePath, buffer);
        }

        await doc.update({
          status: 'signed',
          nufiStatus: status,
          filePath: signedFilePath,
          signedAt: new Date()
        });

        // Registrar expediente NOM-151
        try {
          if (Nom151Record) {
            await Nom151Record.create({
              tenantId: doc.tenantId,
              documentId: doc.id,
              status: 'signed',
              nom151Hash: String(transactionId),
              signedAt: new Date()
            });
          }
        } catch (e) {
          console.error('Error registrando expediente Nom151Record:', e);
        }
      }
    }

    res.status(200).json({ status: 'success', message: 'Webhook de Nufi recibido y procesado.' });
  } catch (error) {
    console.error('Error procesando webhook de Nufi:', error);
    res.status(500).json({ error: 'Error procesando webhook de Nufi.' });
  }
};

// Webhook para gestionar el ciclo de vida automático de suscripciones de Stripe
exports.handleStripeWebhook = async (req, res) => {
  try {
    const payload = req.body || {};
    const eventType = payload.type || payload.event;
    const dataObject = payload.data?.object || payload;

    console.log(`[STRIPE WEBHOOK] Evento recibido: ${eventType}`);

    const { Tenant, User } = require('../models');
    const mailer = require('../utils/mailer');

    const customerEmail = dataObject.customer_email || 
                          dataObject.customer_details?.email || 
                          dataObject.email;

    if (!customerEmail) {
      console.log('[STRIPE WEBHOOK] Evento sin correo asociado, procesado limpiamente.');
      return res.status(200).json({ received: true });
    }

    // Buscar el tenant por el correo del contacto
    const tenant = await Tenant.findOne({ where: { email: customerEmail } });
    const user = await User.findOne({ where: { email: customerEmail } });

    switch (eventType) {
      case 'checkout.session.completed':
      case 'invoice.paid':
      case 'invoice.payment_succeeded': {
        const amountPaidCents = dataObject.amount_paid || dataObject.amount_total || 0;
        const amountPaidMxn = amountPaidCents / 100;
        const isAnnualPaid = amountPaidMxn >= 1500;

        let detectedPlan = 'standard';
        if (amountPaidMxn >= 4500 || (dataObject.lines?.data?.[0]?.description || '').toLowerCase().includes('pro annual')) {
          detectedPlan = 'pro';
        } else if (amountPaidMxn >= 400 && amountPaidMxn < 1500) {
          detectedPlan = 'pro';
        } else if (amountPaidMxn >= 8000) {
          detectedPlan = 'enterprise';
        }

        if (tenant) {
          await tenant.update({
            plan: detectedPlan,
            status: 'active'
          });

          // Enviar correo transaccional de confirmación de pago
          await mailer.sendPaymentReceiptEmail({
            to: customerEmail,
            name: user?.name || tenant.name,
            companyName: tenant.name,
            planName: `${detectedPlan} ${isAnnualPaid ? '(ANUAL)' : '(MENSUAL)'}`,
            amount: amountPaidMxn > 0 ? amountPaidMxn : (detectedPlan === 'pro' ? (isAnnualPaid ? 4990 : 499) : (isAnnualPaid ? 1990 : 199)),
            nextBillingDate: isAnnualPaid ? 'En 1 año (Facturación Anual)' : 'En 30 días (Facturación Mensual)'
          }).catch(e => console.error('Error enviando correo de pago:', e));
        }
        break;
      }

      case 'invoice.payment_failed': {
        if (tenant) {
          await tenant.update({ status: 'suspended' });

          await mailer.sendPaymentFailedEmail({
            to: customerEmail,
            name: user?.name || tenant.name,
            companyName: tenant.name,
            updatePaymentUrl: 'https://app.rubricalo.com/settings'
          }).catch(e => console.error('Error enviando correo de fallo de pago:', e));
        }
        break;
      }

      case 'customer.subscription.deleted': {
        if (tenant) {
          await tenant.update({ plan: 'free', status: 'active' });
        }
        break;
      }

      default:
        console.log(`[STRIPE WEBHOOK] Evento no relevante para provisión: ${eventType}`);
    }

    res.status(200).json({ received: true, event: eventType });
  } catch (error) {
    console.error('Error procesando webhook de Stripe:', error);
    res.status(500).json({ error: 'Error interno en webhook de Stripe.' });
  }
};
