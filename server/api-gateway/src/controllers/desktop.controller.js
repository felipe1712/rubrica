const { Document, DocumentSigner, Tenant, User } = require('../models');
const creditService = require('../services/credit.service');
const mailer = require('../utils/mailer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const SIGNING_PORTAL_URL = process.env.SIGNING_PORTAL_URL || 'https://firmar.rubrica.com.mx';

/**
 * Consulta de saldo y estado de cuenta para la app de escritorio
 */
exports.getBalance = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId || req.tenant?.id;
    if (!tenantId) {
      return res.status(401).json({ error: 'Sesión no identificada.' });
    }

    const data = await creditService.getTenantBalance(tenantId);
    return res.json({
      success: true,
      ...data,
      checkoutUrl: 'https://rubrica.com.mx/paquetes'
    });
  } catch (err) {
    console.error('Error al consultar saldo de créditos:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Despacho de documento para firma remota desde la App Desktop
 * Descuenta 1 crédito atómicamente y genera URLs para cada firmante
 */
exports.dispatchEnvelope = async (req, res) => {
  const tenantId = req.user?.tenantId || req.tenant?.id;
  const userId = req.user?.id;

  if (!tenantId) {
    return res.status(401).json({ error: 'No autorizado.' });
  }

  const { title, signers: signersRaw } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'Se requiere adjuntar el archivo PDF a firmar.' });
  }

  let signers = [];
  try {
    signers = typeof signersRaw === 'string' ? JSON.parse(signersRaw) : signersRaw;
  } catch (e) {
    return res.status(400).json({ error: 'Formato inválido de firmantes (se esperaba array JSON).' });
  }

  if (!Array.isArray(signers) || signers.length === 0) {
    return res.status(400).json({ error: 'Debe especificar al menos un firmante para el documento.' });
  }

  try {
    // 1. Descuento atómico del saldo (si no hay saldo, arroja INSUFFICIENT_CREDITS)
    const creditResult = await creditService.deductCredit(tenantId, 'dispatch_envelope', null);

    // 2. Registrar el documento principal
    const doc = await Document.create({
      tenantId,
      uploadedBy: userId || tenantId,
      name: title || file.originalname,
      originalName: file.originalname,
      filePath: file.path,
      fileSizeBytes: file.size,
      mimeType: file.mimetype,
      status: 'pending_signature'
    });

    // 3. Crear firmantes y sus tokens seguros para la URL remota
    const createdSigners = [];
    for (let i = 0; i < signers.length; i++) {
      const s = signers[i];
      const token = uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, ''); // 64 caracteres hex

      const signerRecord = await DocumentSigner.create({
        documentId: doc.id,
        name: s.name,
        email: s.email,
        role: s.role || 'Firmante',
        signingOrder: s.order || i + 1,
        status: 'pending',
        signingToken: token
      });

      const signingUrl = `${SIGNING_PORTAL_URL}/s/${token}`;
      createdSigners.push({
        id: signerRecord.id,
        name: signerRecord.name,
        email: signerRecord.email,
        signingUrl
      });

      // 4. Enviar notificación por correo con el link de tu dominio
      try {
        if (mailer && mailer.sendSignatureInvitation) {
          await mailer.sendSignatureInvitation({
            to: s.email,
            signerName: s.name,
            documentTitle: doc.name,
            signingUrl
          });
        }
      } catch (mailErr) {
        console.warn(`Aviso: No se pudo enviar el correo a ${s.email}:`, mailErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      documentId: doc.id,
      title: doc.name,
      remainingCredits: creditResult.remainingCredits,
      signers: createdSigners
    });

  } catch (err) {
    if (err.code === 'INSUFFICIENT_CREDITS') {
      return res.status(402).json({
        error: err.message,
        code: 'INSUFFICIENT_CREDITS',
        creditsAvailable: err.creditsAvailable,
        checkoutUrl: 'https://rubrica.com.mx/paquetes'
      });
    }

    console.error('Error al despachar sobre para firma:', err);
    return res.status(500).json({ error: 'Error al procesar el envío del documento.' });
  }
};

/**
 * Consulta del estado del documento y de los firmantes
 */
exports.getEnvelopeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId || req.tenant?.id;

    const doc = await Document.findOne({
      where: { id, tenantId },
      include: [{
        model: DocumentSigner,
        as: 'signers',
        attributes: ['id', 'name', 'email', 'role', 'status', 'signingOrder', 'signedAt', 'ipAddress']
      }]
    });

    if (!doc) {
      return res.status(404).json({ error: 'Documento no encontrado.' });
    }

    return res.json({
      success: true,
      document: {
        id: doc.id,
        title: doc.name,
        status: doc.status,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
        signers: doc.signers
      }
    });
  } catch (err) {
    console.error('Error al consultar estado del sobre:', err);
    return res.status(500).json({ error: err.message });
  }
};
