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
