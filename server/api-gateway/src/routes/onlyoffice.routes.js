const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middlewares/auth');
const ooCtrl = require('../controllers/onlyoffice.controller');

// Ruta pública: OnlyOffice descarga el archivo directamente (con token en query)
router.get('/:id/file', ooCtrl.serveFile);

// Ruta pública: OnlyOffice hace POST al callback cuando el usuario guarda
router.post('/:id/callback', ooCtrl.handleCallback);

// Rutas protegidas
router.get('/:id/editor-config', authenticateUser, ooCtrl.getEditorConfig);

module.exports = router;
