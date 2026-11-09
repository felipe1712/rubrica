const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const desktopController = require('../controllers/desktop.controller');
const { authenticateUser } = require('../middlewares/auth');

// Configuración de almacenamiento local para uploads
const uploadsDir = path.join(__dirname, '../../uploads/envelopes');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten documentos en formato PDF.'));
    }
  }
});

// Rutas protegidas para la App de Escritorio
router.get('/balance', authenticateUser, desktopController.getBalance);
router.post('/envelopes/dispatch', authenticateUser, upload.single('file'), desktopController.dispatchEnvelope);
router.get('/envelopes/:id/status', authenticateUser, desktopController.getEnvelopeStatus);

module.exports = router;
