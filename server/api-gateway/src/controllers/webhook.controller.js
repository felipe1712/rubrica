const provisioningService = require('../services/provisioning.service');
const sequelize = require('../config/database');
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
