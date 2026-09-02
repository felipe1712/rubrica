const axios = require('axios');
require('dotenv').config();

const NUFI_API_URL = process.env.NUFI_API_URL || 'https://nufi.azure-api.net';
const NUFI_SUBSCRIPTION_KEY = process.env.NUFI_SUBSCRIPTION_KEY || '';
const DEFAULT_WEBHOOK = process.env.NUFI_WEBHOOK_URL || 'https://api.rubricalo.com/webhooks/nufi';

const client = axios.create({
  baseURL: NUFI_API_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(NUFI_SUBSCRIPTION_KEY ? { 'Ocp-Apim-Subscription-Key': NUFI_SUBSCRIPTION_KEY } : {})
  }
});

/**
 * Alta de Constancia PDF para Firma Digital NOM-151
 * @param {Object} params
 * @param {string} params.base64File - Archivo PDF en formato Base64 sin prefijo data:
 * @param {string} [params.webhookUrl] - URL opcional para recibir el webhook
 */
exports.altaConstanciaPdf = async ({ base64File, webhookUrl }) => {
  try {
    // Asegurar que el string base64 no lleve prefijo tipo data:application/pdf;base64,
    const cleanBase64 = base64File.replace(/^data:application\/pdf;base64,/, '');

    const payload = {
      webhook: webhookUrl || DEFAULT_WEBHOOK,
      data: {
        base64_archivo: cleanBase64
      }
    };

    console.log('[NUFI SERVICE] Enviando alta_constancia_pdf a Nufi...');
    const response = await client.post('/nom-151/v2/alta_constancia_pdf', payload);
    console.log('[NUFI SERVICE] Respuesta de Nufi:', response.status, response.data);
    
    return response.data;
  } catch (error) {
    console.error('[NUFI SERVICE ERROR] Error en alta_constancia_pdf:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.response?.data?.error || error.message || 'Error al conectar con Nufi.');
  }
};
