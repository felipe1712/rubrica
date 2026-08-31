const jwt = require('jsonwebtoken');
const { User, SuperAdmin, Tenant } = require('../models');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_key';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'admin_jwt_secret_key';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios.' });
    }

    // Since we support multiple tenants, email is unique within (tenant_id, email).
    // The user might be trying to log in. We look for a user matching the email.
    // In our system, if an email exists across multiple tenants (e.g. support), they can choose
    // or we can select the first active user.
    let user = await User.findOne({
      where: { email, isActive: true },
      include: [{ model: Tenant }]
    });

    if (!user) {
      // Check if SuperAdmin is logging in from main portal
      const admin = await SuperAdmin.findOne({ where: { email } });
      if (admin) {
        const isValidAdmin = await admin.comparePassword(password);
        if (isValidAdmin) {
          const token = jwt.sign(
            { id: admin.id, email: admin.email, role: 'admin', isSuperAdmin: true },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRY }
          );
          return res.json({
            token,
            user: {
              id: admin.id,
              name: 'Administrador Principal',
              email: admin.email,
              role: 'admin',
              plan: 'enterprise'
            }
          });
        }
      }
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    if (user.Tenant.status === 'suspended') {
      return res.status(403).json({ error: 'La cuenta de su organización se encuentra suspendida.' });
    }

    if (user.Tenant.status === 'expired' || (user.Tenant.expiresAt && new Date(user.Tenant.expiresAt) < new Date())) {
      return res.status(403).json({ error: 'La licencia de su organización ha expirado.' });
    }

    // Generate Token
    const token = jwt.sign(
      {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        plan: user.Tenant.plan
      }
    });
  } catch (error) {
    console.error('Error en login de usuario:', error);
    res.status(500).json({ error: 'Error al iniciar sesión.' });
  }
};

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios.' });
    }

    const admin = await SuperAdmin.findOne({ where: { email } });
    if (!admin) {
      return res.status(401).json({ error: 'Credenciales de administrador inválidas.' });
    }

    const isValid = await admin.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales de administrador inválidas.' });
    }

    // Generate Admin Token
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        isSuperAdmin: true
      },
      ADMIN_JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email
      }
    });
  } catch (error) {
    console.error('Error en login de admin:', error);
    res.status(500).json({ error: 'Error al iniciar sesión administrativa.' });
  }
};

exports.registerTenant = async (req, res) => {
  try {
    const { companyName, userName, email, password } = req.body;
    if (!companyName || !email || !password) {
      return res.status(400).json({ error: 'Nombre de la empresa, correo y contraseña son obligatorios.' });
    }

    // Verificar si ya existe una empresa o usuario registrado con este correo
    const existingTenant = await Tenant.findOne({ where: { email } });
    const existingUser = await User.findOne({ where: { email } });
    if (existingTenant || existingUser) {
      return res.status(400).json({ error: 'Ya existe una cuenta registrada con este correo electrónico.' });
    }

    const licenseKey = `RUBRIC-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Crear Tenant en Plan Gratuito (Freemium: 3 docs/mes, 1 usuario)
    const tenant = await Tenant.create({
      name: companyName,
      email,
      plan: 'free',
      status: 'active',
      licenseKey,
      maxUsers: 1,
      maxDocsMonth: 3,
      maxStorageGb: 1
    });

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      tenantId: tenant.id,
      name: userName || companyName,
      email,
      passwordHash,
      role: 'admin',
      isActive: true
    });

    // Enviar correo transaccional de bienvenida vía Brevo
    try {
      const mailer = require('../utils/mailer');
      await mailer.sendWelcomeEmail({
        to: email,
        name: user.name,
        companyName: tenant.name
      });
    } catch (mailErr) {
      console.warn('Advertencia: No se pudo enviar el correo de bienvenida vía Brevo:', mailErr.message);
    }

    // Generar Token JWT para autenticación inmediata
    const token = jwt.sign(
      { id: user.id, tenantId: tenant.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    res.status(201).json({
      message: 'Empresa creada exitosamente.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: tenant.id,
        plan: tenant.plan
      }
    });
  } catch (error) {
    console.error('Error en registro de empresa:', error);
    res.status(500).json({ error: 'Error al registrar la empresa.' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = req.user;
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      plan: user.Tenant ? user.Tenant.plan : 'free'
    });
  } catch (error) {
    console.error('Error en getMe:', error);
    res.status(500).json({ error: 'Error al obtener información de usuario.' });
  }
};
