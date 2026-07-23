const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticateUser } = require('../middlewares/auth');
const docsCtrl = require('../controllers/documents.controller');

const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads';

// Configuración de multer — solo PDFs, máx 20MB
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20 MB
});

// Todas las rutas requieren autenticación
router.use(authenticateUser);

router.get('/',           docsCtrl.listDocuments);
router.get('/:id',        docsCtrl.getDocument);
router.get('/:id/download', docsCtrl.downloadDocument);
router.post('/upload',    upload.single('file'), docsCtrl.uploadDocument);
router.post('/:id/send-for-signature', docsCtrl.sendForSignature);
router.delete('/:id',     docsCtrl.deleteDocument);

module.exports = router;
