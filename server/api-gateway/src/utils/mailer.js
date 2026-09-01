const axios = require('axios');
require('dotenv').config();

/**
 * Enviar correo transaccional utilizando Brevo (Sendinblue) REST API v3
 * @param {Object} options
 * @param {string} options.to Email del destinatario
 * @param {string} [options.name] Nombre del destinatario
 * @param {string} options.subject Asunto del correo
 * @param {string} options.htmlContent Contenido HTML del mensaje
 */
exports.sendEmail = async ({ to, name, subject, htmlContent }) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'notificaciones@rubricalo.com';
  const senderName = process.env.BREVO_SENDER_NAME || 'Rubrícalo';

  if (!apiKey) {
    console.log(`[MAILER MOCK] No hay BREVO_API_KEY configurada. Correo a <${to}>: "${subject}"`);
    return { success: true, mock: true };
  }

  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to, name: name || to.split('@')[0] }],
        subject,
        htmlContent
      },
      {
        headers: {
          'accept': 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json'
        }
      }
    );

    console.log(`[MAILER] Correo enviado exitosamente a <${to}> vía Brevo (MessageId: ${response.data?.messageId})`);
    return { success: true, messageId: response.data?.messageId };
  } catch (error) {
    console.error('[MAILER ERROR] Error al enviar correo vía Brevo:', error.response?.data || error.message);
    throw new Error('No se pudo enviar el correo transaccional.');
  }
};

/**
 * Plantilla de Bienvenida para Registro de Empresa (Tenant)
 */
exports.sendWelcomeEmail = async ({ to, name, companyName, loginUrl }) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #3d4ed8; margin: 0;">RUBRÍCALO</h2>
        <p style="color: #666; font-size: 14px; margin-top: 5px;">Gestión Documental y Firma Digital Legal</p>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <h3 style="color: #333;">¡Bienvenido a Rubrícalo, ${name}!</h3>
      <p style="color: #555; line-height: 1.6;">
        Tu cuenta para la empresa <strong>${companyName}</strong> ha sido creada exitosamente en nuestro <strong>Plan Gratuito</strong>.
      </p>
      <p style="color: #555; line-height: 1.6;">
        Ya puedes ingresar a la plataforma para editar documentos en la nube (Word, Excel), utilizar las herramientas PDF y enviar contratos para firma digital con validez legal <strong>NOM-151</strong>.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl || 'https://app.rubricalo.com/login'}" style="background-color: #3d4ed8; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
          Ingresar al Dashboard
        </a>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #888; font-size: 12px; text-align: center;">
        Rubrícalo México — Firma Digital y Gestión Documental Legal<br />
        Si tienes dudas, contáctanos en soporte@rubricalo.com
      </p>
    </div>
  `;

  return exports.sendEmail({
    to,
    name,
    subject: `¡Bienvenido a Rubrícalo! Tu cuenta para ${companyName} está lista`,
    htmlContent
  });
};
