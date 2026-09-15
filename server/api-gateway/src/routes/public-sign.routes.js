const express = require('express');
const router = express.Router();
const publicSignCtrl = require('../controllers/public-sign.controller');
const { Document } = require('../models');
const fs = require('fs');

router.get('/sign/:token', publicSignCtrl.getSignerData);
router.post('/sign/:token', publicSignCtrl.submitSignature);

// Serve document file publicly for signing portal
router.get('/documents/:id/file', async (req, res) => {
  try {
    const doc = await Document.findByPk(req.params.id);
    if (!doc || !fs.existsSync(doc.filePath)) {
      return res.status(404).json({ error: 'Documento no encontrado o archivo no disponible.' });
    }
    res.setHeader('Content-Type', doc.mimeType || 'application/pdf');
    res.sendFile(doc.filePath);
  } catch (error) {
    console.error('Error al servir archivo público:', error);
    res.status(500).json({ error: 'Error al servir el documento.' });
  }
});

module.exports = router;
