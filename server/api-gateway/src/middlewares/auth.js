const jwt = require('jsonwebtoken');
const { User, SuperAdmin, Tenant } = require('../models');
const sequelize = require('../config/database');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_key';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'admin_jwt_secret_key';

// Middleware for normal multi-tenant users
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Acceso no autorizado. Token faltante o inválido.' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido o expirado.' });
    }

    const user = await User.findByPk(decoded.id, {
      include: [{ model: Tenant, attributes: ['plan', 'status', 'expiresAt', 'docusealOrgId'] }]
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Usuario inactivo o no encontrado.' });
    }

    if (user.Tenant.status === 'suspended') {
      return res.status(403).json({ error: 'La cuenta de su organización se encuentra suspendida. Contacte soporte.' });
    }

    if (user.Tenant.status === 'expired' || (user.Tenant.expiresAt && new Date(user.Tenant.expiresAt) < new Date())) {
      return res.status(403).json({ error: 'La licencia de su organización ha expirado.' });
    }

    // Attach to request
    req.user = user;
    req.tenantId = user.tenantId;

    // Set Row Level Security context for postgres
    await sequelize.query(`SET app.current_tenant_id = '${user.tenantId}'`);

    next();
  } catch (error) {
    console.error('Error en autenticación de usuario:', error);
    res.status(500).json({ error: 'Error interno de autenticación.' });
  }
};

// Middleware for Super-Admin
const authenticateSuperAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Acceso denegado. Token administrativo faltante.' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, ADMIN_JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Token administrativo inválido.' });
    }

    if (!decoded.isSuperAdmin) {
      return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador de plataforma.' });
    }

    const admin = await SuperAdmin.findByPk(decoded.id);
    if (!admin) {
      return res.status(401).json({ error: 'Administrador de plataforma no encontrado.' });
    }

    req.superAdmin = admin;
    next();
  } catch (error) {
    console.error('Error en autenticación de Super-Admin:', error);
    res.status(500).json({ error: 'Error interno de autenticación.' });
  }
};

module.exports = {
  authenticateUser,
  authenticateSuperAdmin
};
