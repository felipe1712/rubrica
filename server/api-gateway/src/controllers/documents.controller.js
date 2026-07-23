const path = require('path');
const fs = require('fs');
const { Document } = require('../models');
const docusealService = require('../services/docuseal.service');

const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads';

// Asegura que el directorio de uploads exista
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// GET /documents — listar documentos del tenant
exports.listDocuments = async (req, res) => {
  try {
    const docs = await Document.findAll({
      where: { tenantId: req.tenantId },
      order: [['created_at', 'DESC']],
      attributes: ['id', 'name', 'originalName', 'status', 'fileSizeBytes', 'signerEmail', 'signerName', 'signedAt', 'createdAt']
    });
    res.json(docs);
  } catch (error) {
    console.error('Error listando documentos:', error);
    res.status(500).json({ error: 'Error al obtener los documentos.' });
  }
};

// GET /documents/:id — detalle de un documento
exports.getDocument = async (req, res) => {
  try {
    const doc = await Document.findOne({
      where: { id: req.params.id, tenantId: req.tenantId }
    });
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado.' });
    res.json(doc);
  } catch (error) {
    console.error('Error obteniendo documento:', error);
    res.status(500).json({ error: 'Error al obtener el documento.' });
  }
};

// POST /documents/upload — subir PDF
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo.' });
    }

    const { name } = req.body;
    const doc = await Document.create({
      tenantId: req.tenantId,
      uploadedBy: req.user.id,
      name: name || req.file.originalname,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSizeBytes: req.file.size,
      mimeType: req.file.mimetype,
      status: 'uploaded'
    });

    res.status(201).json(doc);
  } catch (error) {
    console.error('Error subiendo documento:', error);
    res.status(500).json({ error: 'Error al subir el documento.' });
  }
};

// POST /documents/:id/send-for-signature — enviar a DocuSeal
exports.sendForSignature = async (req, res) => {
  try {
    const doc = await Document.findOne({
      where: { id: req.params.id, tenantId: req.tenantId }
    });
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado.' });

    const { signerName, signerEmail } = req.body;
    if (!signerEmail) return res.status(400).json({ error: 'El email del firmante es obligatorio.' });

    // Leer el archivo PDF y convertirlo a base64
    const fileBuffer = fs.readFileSync(doc.filePath);
    const base64File = fileBuffer.toString('base64');

    // 1. Crear plantilla en DocuSeal con el PDF
    const templatePayload = {
      name: doc.name,
      documents: [{
        name: doc.name,
        file: `data:application/pdf;base64,${base64File}`
      }]
    };
    const template = await docusealService.createTemplate(templatePayload);

    // 2. Crear submission (solicitud de firma)
    const submissionPayload = {
      template_id: template.id,
      send_email: true,
      submitters: [{
        role: 'First Party',
        email: signerEmail,
        name: signerName || signerEmail
      }]
    };
    const submission = await docusealService.createSubmission(submissionPayload);

    // 3. Actualizar documento con estado y referencias de DocuSeal
    await doc.update({
      status: 'pending_signature',
      docusealTemplateId: template.id,
      docusealSubmissionId: submission.id,
      signerEmail,
      signerName: signerName || signerEmail
    });

    res.json({
      message: 'Documento enviado para firma correctamente.',
      submissionId: submission.id,
      document: doc
    });
  } catch (error) {
    console.error('Error enviando para firma:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error al enviar el documento para firma.' });
  }
};

// DELETE /documents/:id
exports.deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findOne({
      where: { id: req.params.id, tenantId: req.tenantId }
    });
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado.' });

    // Eliminar archivo del disco
    if (fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
    }

    await doc.destroy();
    res.json({ message: 'Documento eliminado correctamente.' });
  } catch (error) {
    console.error('Error eliminando documento:', error);
    res.status(500).json({ error: 'Error al eliminar el documento.' });
  }
};

// GET /documents/:id/download — descargar PDF
exports.downloadDocument = async (req, res) => {
  try {
    const doc = await Document.findOne({
      where: { id: req.params.id, tenantId: req.tenantId }
    });
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado.' });
    if (!fs.existsSync(doc.filePath)) return res.status(404).json({ error: 'Archivo no disponible.' });

    res.download(doc.filePath, doc.originalName);
  } catch (error) {
    console.error('Error descargando documento:', error);
    res.status(500).json({ error: 'Error al descargar el documento.' });
  }
};
