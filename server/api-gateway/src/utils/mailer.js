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
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'soporte@rubricalo.com';
  const senderName = process.env.BREVO_SENDER_NAME || 'Rubrícalo México';

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
    return { success: false, error: error.message };
  }
};

/**
 * 1. Plantilla de Bienvenida para Registro de Empresa (Tenant)
 */
exports.sendWelcomeEmail = async ({ to, name, companyName, loginUrl }) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 25px;">
        <h2 style="color: #3d4ed8; font-weight: 800; font-size: 26px; margin: 0; letter-spacing: -0.5px;">RUBRÍCALO</h2>
        <p style="color: #64748b; font-size: 13px; margin-top: 5px; font-weight: 600;">Gestión Documental, Edición Nube y Firma Digital NOM-151</p>
      </div>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
      <h3 style="color: #0f172a; margin-bottom: 15px;">¡Bienvenido a Rubrícalo, ${name || 'usuario'}!</h3>
      <p style="color: #475569; line-height: 1.6; font-size: 15px;">
        Tu cuenta para la empresa <strong>${companyName || 'tu organización'}</strong> ha sido creada exitosamente en nuestro <strong>Plan Gratuito</strong> (3 documentos/mes sin costo).
      </p>
      <p style="color: #475569; line-height: 1.6; font-size: 15px;">
        Ya puedes ingresar a la plataforma para editar documentos en la nube (Word, Excel), utilizar las herramientas PDF y enviar contratos para firma digital con validez legal conforme a la norma <strong>NOM-151-SCFI-2016</strong>.
      </p>
      <div style="text-align: center; margin: 35px 0;">
        <a href="${loginUrl || 'https://app.rubricalo.com/login'}" style="background-color: #3d4ed8; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(61, 78, 216, 0.3);">
          Ingresar a Mi Cuenta
        </a>
      </div>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 25px 0;" />
      <p style="color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.5;">
        Rubrícalo México — Firma Digital y Gestión Documental Legal<br />
        ¿Necesitas ayuda? Escríbenos a soporte@rubricalo.com
      </p>
    </div>
  `;

  return exports.sendEmail({
    to,
    name,
    subject: `¡Bienvenido a Rubrícalo! Tu cuenta para ${companyName || 'tu empresa'} está lista`,
    htmlContent
  });
};

/**
 * 2. Plantilla de Confirmación de Pago y Renovación Exitosa de Membresía
 */
exports.sendPaymentReceiptEmail = async ({ to, name, companyName, planName, amount, nextBillingDate }) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #3d4ed8; font-weight: 800; font-size: 26px; margin: 0;">RUBRÍCALO</h2>
        <p style="color: #10b981; font-size: 14px; margin-top: 5px; font-weight: 700;">✓ Pago Procesado Correctamente</p>
      </div>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
      <h3 style="color: #0f172a;">Hola, ${name || 'Cliente'}</h3>
      <p style="color: #475569; line-height: 1.6; font-size: 15px;">
        Hemos recibido exitosamente el pago para la suscripción de <strong>${companyName}</strong>. Tu membresía ha sido renovada correctamente.
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Plan Contratado:</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #3d4ed8;">Plan ${planName ? planName.toUpperCase() : 'ESTÁNDAR'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Monto Cobrado:</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold;">$${amount || '199'} MXN</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Estado de la Cuenta:</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #10b981;">ACTIVA</td>
          </tr>
          ${nextBillingDate ? `
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Próxima Renovación:</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold;">${nextBillingDate}</td>
          </tr>` : ''}
        </table>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://app.rubricalo.com/facturas" style="background-color: #3d4ed8; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
          Ver Recibo / Facturas
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 25px 0;" />
      <p style="color: #94a3b8; font-size: 12px; text-align: center;">
        Rubrícalo México — Gracias por confiar en nosotros.
      </p>
    </div>
  `;

  return exports.sendEmail({
    to,
    name,
    subject: `✓ Recibo de Pago: Membresía ${planName ? planName.toUpperCase() : ''} activa en Rubrícalo`,
    htmlContent
  });
};

/**
 * 3. Plantilla de Alerta por Fallo de Pago en Suscripción (Tarjeta Rechazada / Vencida)
 */
exports.sendPaymentFailedEmail = async ({ to, name, companyName, updatePaymentUrl }) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #fecdd3; border-radius: 10px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #3d4ed8; font-weight: 800; font-size: 26px; margin: 0;">RUBRÍCALO</h2>
        <p style="color: #e11d48; font-size: 14px; margin-top: 5px; font-weight: 700;">⚠ Alerta: Fallo en el Cobro de la Membresía</p>
      </div>
      <hr style="border: none; border-top: 1px solid #ffe4e6; margin: 20px 0;" />
      <h3 style="color: #0f172a;">Estimado(a) ${name || 'Administrador'},</h3>
      <p style="color: #475569; line-height: 1.6; font-size: 15px;">
        Intentamos procesar el cobro automático de la membresía para <strong>${companyName}</strong>, pero el pago fue rechazado por la institución bancaria.
      </p>

      <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 18px; margin: 20px 0; color: #9f1239; font-size: 14px; line-height: 1.5;">
        <strong>¿Qué sucede ahora?</strong><br />
        Para evitar la suspensión temporal del servicio y continuar firmando documentos con validez NOM-151, por favor actualiza tu tarjeta o método de pago lo antes posible.
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${updatePaymentUrl || 'https://app.rubricalo.com/settings'}" style="background-color: #e11d48; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
          Actualizar Método de Pago
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #ffe4e6; margin: 25px 0;" />
      <p style="color: #94a3b8; font-size: 12px; text-align: center;">
        Si ya realizaste el pago o crees que es un error, por favor comunícate con soporte@rubricalo.com
      </p>
    </div>
  `;

  return exports.sendEmail({
    to,
    name,
    subject: `⚠ Acción requerida: Fallo en el pago de la membresía de ${companyName}`,
    htmlContent
  });
};

/**
 * 4. Plantilla de Alerta de Límite de Documentos Alcanzado
 */
exports.sendUsageAlertEmail = async ({ to, name, companyName, docsUsed, docsLimit, planName }) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #3d4ed8; font-weight: 800; font-size: 26px; margin: 0;">RUBRÍCALO</h2>
        <p style="color: #d97706; font-size: 14px; margin-top: 5px; font-weight: 700;">📊 Alerta de Cupo Documental</p>
      </div>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
      <h3 style="color: #0f172a;">Hola, ${name || 'usuario'}</h3>
      <p style="color: #475569; line-height: 1.6; font-size: 15px;">
        Tu empresa <strong>${companyName}</strong> ha utilizado <strong>${docsUsed} de ${docsLimit} documentos</strong> asignados para este mes en tu <strong>Plan ${planName ? planName.toUpperCase() : 'GRATUITO'}</strong>.
      </p>

      <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 18px; margin: 20px 0; color: #92400e; font-size: 14px;">
        Para evitar interrupciones al firmar contratos o subir archivos, puedes hacer upgrade a un plan superior en cualquier momento.
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://app.rubricalo.com/settings" style="background-color: #3d4ed8; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
          Aumentar Mi Cupo de Documentos
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 25px 0;" />
      <p style="color: #94a3b8; font-size: 12px; text-align: center;">
        Rubrícalo México — Firma Digital Legal NOM-151.
      </p>
    </div>
  `;

  return exports.sendEmail({
    to,
    name,
    subject: `📊 Has utilizado ${docsUsed}/${docsLimit} documentos del mes en Rubrícalo`,
    htmlContent
  });
};
