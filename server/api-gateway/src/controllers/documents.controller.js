const path = require('path');
const fs = require('fs');
const { Document, User } = require('../models');
const docusealService = require('../services/docuseal.service');
const { verifyFileType } = require('../services/magika.service');

const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads';

// Asegura que el directorio de uploads exista
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// GET /documents/dashboard-stats — estadísticas para el Dashboard del tenant
exports.getDashboardStats = async (req, res) => {
  let tenantId = req.tenantId || req.user?.tenantId || req.user?.tenant_id;
  if (!tenantId) {
    const firstTenant = await Tenant.findOne();
    if (firstTenant) tenantId = firstTenant.id;
  }

  if (!tenantId) {
    return res.json({
      stats: { totalDocs: 0, pendingDocs: 0, totalSigned: 0, activeUsers: 0 },
      recentActivity: []
    });
  }

  let totalDocs = 0;
  let pendingDocs = 0;
  let totalSigned = 0;
  let activeUsers = 0;
  let recentActivity = [];

  try {
    totalDocs = await Document.count({ where: { tenantId } });
  } catch (e) {
    console.error('[Dashboard Stats Error] totalDocs count failed:', e.message);
  }

  try {
    pendingDocs = await Document.count({ where: { tenantId, status: 'pending_signature' } });
  } catch (e) {
    console.error('[Dashboard Stats Error] pendingDocs count failed:', e.message);
  }

  try {
    totalSigned = await Document.count({ where: { tenantId, status: 'signed' } });
  } catch (e) {
    console.error('[Dashboard Stats Error] totalSigned count failed:', e.message);
  }

  try {
    if (User) {
      activeUsers = await User.count({ where: { tenantId, isActive: true } });
    }
  } catch (e) {
    console.error('[Dashboard Stats Error] activeUsers count failed:', e.message);
  }

  try {
    recentActivity = await Document.findAll({
      where: { tenantId },
      order: [['createdAt', 'DESC']],
      limit: 5
    });
  } catch (e) {
    console.error('[Dashboard Stats Error] recentActivity query failed:', e.message);
  }

  res.json({
    stats: {
      totalDocs,
      pendingDocs,
      totalSigned,
      activeUsers
    },
    recentActivity: recentActivity || []
  });
};

// GET /documents — listar documentos del tenant
exports.listDocuments = async (req, res) => {
  try {
    let tenantId = req.tenantId || req.user?.tenantId || req.user?.tenant_id;
    if (!tenantId) {
      const firstTenant = await Tenant.findOne();
      if (firstTenant) tenantId = firstTenant.id;
    }

    if (!tenantId) {
      return res.json([]);
    }

    const docs = await Document.findAll({
      where: { tenantId },
      order: [['createdAt', 'DESC']]
    });
    res.json(docs || []);
  } catch (error) {
    console.error('Error listando documentos:', error);
    res.status(500).json({ error: error.message || 'Error al obtener los documentos.' });
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

// POST /documents/upload — subir documento con verificación Magika
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo.' });
    }

    // ── Verificación de tipo real con Google Magika ──────────────────────────
    const verification = await verifyFileType(req.file.path, req.file.mimetype);

    if (!verification.ok) {
      // Eliminar el archivo del disco — no lo guardamos si es sospechoso
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      const msg = verification.isDangerous
        ? `Archivo rechazado por seguridad: el contenido detectado es '${verification.detectedLabel}'. No se permiten archivos ejecutables o scripts.`
        : `Tipo de archivo no permitido. Se detectó '${verification.detectedLabel}'. Solo se aceptan PDF, Word, Excel, PowerPoint y TXT.`;

      return res.status(400).json({
        error: msg,
        detectedType: verification.detectedLabel,
        confidence: `${(verification.score * 100).toFixed(1)}%`
      });
    }
    // ────────────────────────────────────────────────────────────────────────

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
    // Si quedó un archivo huérfano, limpiarlo
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
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
