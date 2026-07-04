const { Tenant, User, PlanConfig } = require('../models');
const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

// Generate a random temporary password
function generateTempPassword() {
  return crypto.randomBytes(8).toString('hex'); // 16 characters
}

// Send welcome email via Brevo HTTP API
async function sendWelcomeEmail(email, name, tempPassword) {
  const brevoKey = process.env.BREVO_SMTP_KEY;
  const mailFrom = process.env.MAIL_FROM || 'hola@rubricalo.com';
  const mailFromName = process.env.MAIL_FROM_NAME || 'Rubricalo';

  if (!brevoKey) {
    console.warn('Brevo API key missing. Email welcome not sent.');
    return;
  }

  try {
    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { name: mailFromName, email: mailFrom },
      to: [{ email, name }],
      subject: '¡Bienvenido a Rubricalo! - Credenciales de Acceso',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #3f51b5; text-align: center;">¡Gracias por tu compra en Rubricalo!</h2>
          <p>Hola <strong>${name}</strong>,</p>
          <p>Tu cuenta ha sido creada y configurada con éxito en nuestra plataforma multi-tenant de gestión documental y firma electrónica.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Tus credenciales de acceso:</strong></p>
            <p style="margin: 5px 0;"><strong>Enlace de acceso:</strong> <a href="https://app.rubricalo.com">https://app.rubricalo.com</a></p>
            <p style="margin: 5px 0;"><strong>Email / Usuario:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Contraseña temporal:</strong> <span style="font-family: monospace; font-size: 1.1em; background: #ddd; padding: 2px 6px; border-radius: 3px;">${tempPassword}</span></p>
          </div>

          <p style="color: #ff5722;">⚠️ Por seguridad, te recomendamos cambiar tu contraseña temporal inmediatamente después de iniciar sesión por primera vez.</p>
          
          <p>Si tienes alguna duda o necesitas soporte, no dudes en responder a este correo.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 0.8em; color: #888; text-align: center;">© 2026 Rubricalo. Todos los derechos reservados.</p>
        </div>
      `
    }, {
      headers: {
        'api-key': brevoKey,
        'Content-Type': 'application/json'
      }
    });
    console.log(`Welcome email successfully sent to ${email}`);
  } catch (error) {
    console.error('Error sending welcome email via Brevo API:', error.response?.data || error.message);
  }
}

exports.provisionTenant = async ({ licenseKey, customerEmail, customerName, productId, expiresAt }) => {
  const transaction = await Tenant.sequelize.transaction();
  try {
    // 1. Look up plan limits by mapping the EDD product ID
    let plan = 'esencial';
    let planConfig = await PlanConfig.findOne({ where: { eddProductId: productId } });
    
    // Fallback based on env vars if planConfig mapping isn't set up yet
    if (!planConfig) {
      if (productId === parseInt(process.env.EDD_PRODUCT_ID_EMPRESARIAL)) {
        plan = 'empresarial';
      } else if (productId === parseInt(process.env.EDD_PRODUCT_ID_PROFESIONAL)) {
        plan = 'profesional';
      }
      planConfig = await PlanConfig.findByPk(plan);
    } else {
      plan = planConfig.plan;
    }

    const limits = planConfig || {
      maxUsers: 3,
      maxDocsMonth: 30,
      maxStorageGb: 5
    };

    // 2. Create the Tenant
    const [tenant, created] = await Tenant.findOrCreate({
      where: { email: customerEmail },
      defaults: {
        name: customerName || customerEmail.split('@')[0],
        email: customerEmail,
        plan,
        status: 'active',
        licenseKey,
        eddProductId: productId,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxUsers: limits.maxUsers,
        maxDocsMonth: limits.maxDocsMonth,
        maxStorageGb: limits.maxStorageGb
      },
      transaction
    });

    if (!created) {
      // Tenant already exists, update license, product and dates
      tenant.licenseKey = licenseKey;
      tenant.eddProductId = productId;
      tenant.plan = plan;
      tenant.expiresAt = expiresAt ? new Date(expiresAt) : null;
      tenant.status = 'active';
      tenant.maxUsers = limits.maxUsers;
      tenant.maxDocsMonth = limits.maxDocsMonth;
      tenant.maxStorageGb = limits.maxStorageGb;
      await tenant.save({ transaction });
      
      await transaction.commit();
      return { tenant, created: false };
    }

    // 3. Create the Owner User
    const tempPassword = generateTempPassword();
    const passwordHash = await User.hashPassword(tempPassword);

    const user = await User.create({
      tenantId: tenant.id,
      email: customerEmail,
      name: customerName || customerEmail.split('@')[0],
      role: 'owner',
      passwordHash,
      isActive: true
    }, { transaction });

    await transaction.commit();

    // 4. Send Welcome Email out of band
    sendWelcomeEmail(customerEmail, user.name, tempPassword).catch(err => 
      console.error('Welcome email async failure:', err)
    );

    return { tenant, user, created: true };
  } catch (error) {
    await transaction.rollback();
    console.error('Error provisioning tenant:', error);
    throw error;
  }
};

exports.suspendTenant = async (customerEmail) => {
  try {
    const tenant = await Tenant.findOne({ where: { email: customerEmail } });
    if (tenant) {
      tenant.status = 'suspended';
      await tenant.save();
      console.log(`Tenant ${customerEmail} suspended successfully.`);
      return tenant;
    }
  } catch (error) {
    console.error('Error suspending tenant:', error);
    throw error;
  }
};

exports.expireTenant = async (customerEmail) => {
  try {
    const tenant = await Tenant.findOne({ where: { email: customerEmail } });
    if (tenant) {
      tenant.status = 'expired';
      await tenant.save();
      console.log(`Tenant ${customerEmail} expired successfully.`);
      return tenant;
    }
  } catch (error) {
    console.error('Error expiring tenant:', error);
    throw error;
  }
};

exports.refundTenant = async (customerEmail) => {
  try {
    const tenant = await Tenant.findOne({ where: { email: customerEmail } });
    if (tenant) {
      tenant.status = 'suspended';
      // Optionally block all users
      await User.update({ isActive: false }, { where: { tenantId: tenant.id } });
      console.log(`Tenant ${customerEmail} refunded & users deactivated.`);
      return tenant;
    }
  } catch (error) {
    console.error('Error refunding tenant:', error);
    throw error;
  }
};
