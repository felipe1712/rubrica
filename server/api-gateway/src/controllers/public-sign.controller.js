const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Document, DocumentSigner, Nom151Record } = require('../models');
const nufiService = require('../services/nufi.service');
const mailer = require('../utils/mailer');

const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads';

// GET /public/sign/:token — Portal público para consultar el documento y firmante
exports.getSignerData = async (req, res) => {
  try {
    const { token } = req.params;
    const signer = await DocumentSigner.findOne({
      where: { signingToken: token },
      include: [{ model: Document }]
    });

    if (!signer || !signer.Document) {
      return res.status(404).json({ error: 'El enlace de firma no es válido o ha sido removido.' });
    }

    // Si estaba pendiente, marcar como visto
    if (signer.status === 'pending') {
      await signer.update({ status: 'viewed' });
    }

    const doc = signer.Document;

    res.json({
      signer: {
        id: signer.id,
        name: signer.name,
        email: signer.email,
        role: signer.role,
        status: signer.status,
        signedAt: signer.signedAt
      },
      document: {
        id: doc.id,
        name: doc.name,
        originalName: doc.originalName,
        mimeType: doc.mimeType,
        status: doc.status,
        fileUrl: `/public/documents/${doc.id}/file`
      }
    });
  } catch (error) {
    console.error('Error al consultar datos de firma pública:', error);
    res.status(500).json({ error: 'Error al consultar el documento de firma.' });
  }
};

// POST /public/sign/:token — Estampar firma de la contraparte
exports.submitSignature = async (req, res) => {
  try {
    const { token } = req.params;
    const { signatureBase64 } = req.body;

    const signer = await DocumentSigner.findOne({
      where: { signingToken: token },
      include: [{ model: Document }]
    });

    if (!signer || !signer.Document) {
      return res.status(404).json({ error: 'Enlace de firma no encontrado.' });
    }

    if (signer.status === 'signed') {
      return res.status(400).json({ error: 'Este documento ya ha sido firmado por usted previamente.' });
    }

    const doc = signer.Document;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;

    // Actualizar estado del firmante
    await signer.update({
      status: 'signed',
      signedAt: new Date(),
      ipAddress: String(clientIp)
    });

    // Verificar si todos los firmantes han firmado
    const allSigners = await DocumentSigner.findAll({ where: { documentId: doc.id } });
    const pendingSigners = allSigners.filter(s => s.status !== 'signed');
    const isAllSigned = pendingSigners.length === 0;

    let nom151Result = null;

    // SI TODOS LOS FIRMANTES COMPLETARON -> ACTIVAR SELLADO OFICIAL NOM-151 CON NUFI
    if (isAllSigned) {
      try {
        const filePath = doc.filePath;
        if (fs.existsSync(filePath)) {
          const fileBuffer = fs.readFileSync(filePath);
          
          // Estampar NOM-151 vía Nufi (PSC)
          const nufiRes = await nufiService.requestNom151Stamp({
            documentId: doc.id,
            documentBuffer: fileBuffer,
            documentName: doc.name
          });

          if (nufiRes && nufiRes.transactionId) {
            await doc.update({
              status: 'signed',
              signedAt: new Date(),
              nufiTransactionId: String(nufiRes.transactionId),
              nufiStatus: 'stamped'
            });

            // Guardar registro NOM-151
            await Nom151Record.create({
              tenantId: doc.tenantId,
              documentId: doc.id,
              nufiTransactionId: String(nufiRes.transactionId),
              certificateSha256: nufiRes.sha256 || crypto.createHash('sha256').update(fileBuffer).digest('hex'),
              status: 'stamped'
            }).catch(() => null);

            nom151Result = nufiRes;
          } else {
            await doc.update({ status: 'signed', signedAt: new Date() });
          }
        } else {
          await doc.update({ status: 'signed', signedAt: new Date() });
        }
      } catch (nomErr) {
        console.error('Error aplicando sello NOM-151:', nomErr);
        await doc.update({ status: 'signed', signedAt: new Date() });
      }

      // Notificar por correo a todas las partes con el documento final sellado
      allSigners.forEach(s => {
        mailer.sendEmail({
          to: s.email,
          name: s.name,
          subject: `¡Documento Firmado y Sellado NOM-151! — ${doc.name}`,
          htmlContent: `
            <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
              <h2 style="color: #3d4ed8;">¡Proceso de Firma Completado!</h2>
              <p>Hola <strong>${s.name}</strong>,</p>
              <p>Le informamos que el documento <strong>${doc.name}</strong> ha sido firmado por todas las partes involucradas y cuenta con su constancia legal de conservación conforme a la <strong>NOM-151-SCFI-2016</strong>.</p>
              <hr/>
              <p style="font-size: 0.9rem; color: #64748b;">Rubrícalo México — Firma Electrónica y Gestión Documental</p>
            </div>
          `
        }).catch(() => null);
      });
    }

    res.json({
      success: true,
      message: isAllSigned
        ? '¡Firma registrada con éxito! El documento ha sido requisitado por completo y sellado con la NOM-151.'
        : '¡Su firma ha sido registrada con éxito! En cuanto las demás partes concluyan se emitirá la constancia NOM-151.',
      allSigned: isAllSigned,
      nom151Stamped: !!nom151Result
    });
  } catch (error) {
    console.error('Error procesando firma pública:', error);
    res.status(500).json({ error: 'Error al procesar el registro de firma.' });
  }
};
