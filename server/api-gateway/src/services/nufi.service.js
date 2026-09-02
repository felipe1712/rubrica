const axios = require('axios');
require('dotenv').config();

const NUFI_API_URL = process.env.NUFI_API_URL || 'https://nufi.azure-api.net';
const NUFI_API_KEY = process.env.NUFI_API_KEY || process.env.NUFI_SUBSCRIPTION_KEY || '';
const DEFAULT_WEBHOOK = process.env.NUFI_WEBHOOK_URL || 'https://api.rubricalo.com/webhooks/nufi';

const client = axios.create({
  baseURL: NUFI_API_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

/**
 * Alta de Constancia PDF para Firma Digital NOM-151
 * @param {Object} params
 * @param {string} params.base64File - Archivo PDF en formato Base64 sin prefijo data:
 * @param {string} [params.webhookUrl] - URL opcional para recibir el webhook
 * @param {string} [params.apiKey] - API Key de Nufi opcional
 */
exports.altaConstanciaPdf = async ({ base64File, webhookUrl, apiKey }) => {
  try {
    const key = apiKey || NUFI_API_KEY;
    const cleanBase64 = base64File.replace(/^data:application\/pdf;base64,/, '');

    const payload = {
      webhook: webhookUrl || DEFAULT_WEBHOOK,
      data: {
        base64_archivo: cleanBase64
      }
    };

    console.log('[NUFI SERVICE] Enviando alta_constancia_pdf a Nufi...');
    const response = await client.post('/nom-151/v2/alta_constancia_pdf', payload, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(key ? { 'NUFI-API-KEY': key, 'Ocp-Apim-Subscription-Key': key } : {})
      }
    });

    console.log('[NUFI SERVICE] Respuesta de Nufi:', response.status, response.data);
    return response.data;
  } catch (error) {
    console.error('[NUFI SERVICE ERROR] Error en alta_constancia_pdf:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.response?.data?.error || error.message || 'Error al conectar con Nufi.');
  }
};

/**
 * Consulta del estado y descarga de la constancia firmada por UUID en Nufi
 * @param {string} uuid - Folio o UUID de la transacción Nufi
 * @param {string} [apiKey] - API Key de Nufi opcional
 */
exports.consultarPorUuid = async (uuid, apiKey) => {
  try {
    const key = apiKey || NUFI_API_KEY;
    console.log(`[NUFI SERVICE] Consultando estado Nufi para UUID: ${uuid}`);

    const response = await client.get('/nom-151/v2/consultar_por_uuid', {
      params: { uuid },
      headers: {
        'Accept': 'application/json',
        ...(key ? { 'NUFI-API-KEY': key, 'Ocp-Apim-Subscription-Key': key } : {})
      }
    });

    console.log('[NUFI SERVICE] Respuesta consultar_por_uuid:', response.data);
    return response.data;
  } catch (error) {
    console.error('[NUFI SERVICE ERROR] Error en consultar_por_uuid:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.response?.data?.error || error.message || 'Error al consultar estado en Nufi.');
  }
};
