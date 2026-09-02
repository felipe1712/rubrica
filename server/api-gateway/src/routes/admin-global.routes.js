const express = require('express');
const router = express.Router();
const adminGlobalController = require('../controllers/admin-global.controller');
const { authenticateUser } = require('../middlewares/auth');

// Permite acceso si el token es válido (para desarrollo/pruebas)
const verifyAdminAccess = (req, res, next) => {
  if (req.user) {
    return next();
  }
  return res.status(403).json({ error: 'Acceso restringido a Administradores de la Plataforma.' });
};

// 1. Estadísticas Globales (MRR, Usuarios, Documentos)
router.get('/stats', authenticateUser, verifyAdminAccess, adminGlobalController.getStats);

// 2. Usuarios y Licencias
router.get('/users', authenticateUser, verifyAdminAccess, adminGlobalController.getUsers);
router.put('/users/:id/license', authenticateUser, verifyAdminAccess, adminGlobalController.updateUserLicense);

// 3. Configuración de Correo Brevo
router.get('/email-config', authenticateUser, verifyAdminAccess, adminGlobalController.getEmailConfig);
router.post('/email-config', authenticateUser, verifyAdminAccess, adminGlobalController.updateEmailConfig);

// 4. Salud de Infraestructura Docker
router.get('/containers', authenticateUser, verifyAdminAccess, adminGlobalController.getContainers);

// 5. Integración con Stripe
router.get('/stripe-config', authenticateUser, verifyAdminAccess, adminGlobalController.getStripeConfig);

// 6. Documentos Legales (Términos y Privacidad)
router.put('/legal', authenticateUser, verifyAdminAccess, adminGlobalController.updateLegalTerms);

module.exports = router;
