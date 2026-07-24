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

const ALLOWED_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/msword',                                                        // doc
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',        // xlsx
  'application/vnd.ms-excel',                                                  // xls
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
  'application/vnd.ms-powerpoint',                                             // ppt
  'text/plain',                                                                 // txt
];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato no permitido. Sube PDF, Word, Excel, PowerPoint o TXT.'), false);
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
