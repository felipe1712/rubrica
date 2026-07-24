const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { Document } = require('../models');

const ONLYOFFICE_JWT_SECRET = process.env.ONLYOFFICE_JWT_SECRET || 'onlyoffice_secret';
const API_URL = process.env.API_PUBLIC_URL || 'https://api.rubricalo.com';
const DOCS_URL = process.env.DOCS_PUBLIC_URL || 'https://docs.rubricalo.com';

const MIME_TO_TYPE = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/pdf': 'pdf',
  'text/plain': 'txt',
};

// GET /documents/:id/editor-config
// Devuelve la configuración firmada con JWT para inicializar el editor OnlyOffice
exports.getEditorConfig = async (req, res) => {
  try {
    const doc = await Document.findOne({
      where: { id: req.params.id, tenantId: req.tenantId }
    });
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado.' });

    const fileType = MIME_TO_TYPE[doc.mimeType] || path.extname(doc.originalName).replace('.', '') || 'docx';
    const documentKey = `${doc.id}-${new Date(doc.updatedAt).getTime()}`;

    const config = {
      document: {
        fileType,
        key: documentKey,
        title: doc.name,
        url: `${API_URL}/documents/${doc.id}/file?token=${req.headers.authorization?.split(' ')[1]}`,
        permissions: {
          edit: true,
          download: true,
          print: true,
        }
      },
      documentType: getDocumentType(fileType),
      editorConfig: {
        callbackUrl: `${API_URL}/documents/${doc.id}/callback`,
        user: {
          id: req.user.id,
          name: req.user.name || req.user.email,
        },
        customization: {
          autosave: true,
          forcesave: false,
          logo: {
            image: 'https://app.rubricalo.com/logo192.png',
            imageDark: 'https://app.rubricalo.com/logo192.png',
            url: 'https://app.rubricalo.com',
          },
          features: {
            spellcheck: { mode: false }
          }
        }
      }
    };

    // Firmar la configuración con JWT para OnlyOffice
    const token = jwt.sign(config, ONLYOFFICE_JWT_SECRET);
    config.token = token;

    res.json({
      config,
      docsUrl: DOCS_URL
    });
  } catch (error) {
    console.error('Error generando config de editor:', error);
    res.status(500).json({ error: 'Error al generar la configuración del editor.' });
  }
};

// POST /documents/:id/callback
// OnlyOffice llama a este endpoint cuando el usuario guarda el documento
exports.handleCallback = async (req, res) => {
  try {
    const { status, url } = req.body;

    // Status 2 = documento listo para guardar (usuario cerró o forzó guardado)
    // Status 6 = documento guardado por error anterior (forcesave)
    if (status === 2 || status === 6) {
      const doc = await Document.findByPk(req.params.id);
      if (!doc) return res.json({ error: 0 }); // OnlyOffice espera { error: 0 } como OK

      // Descargar el archivo modificado desde OnlyOffice
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      fs.writeFileSync(doc.filePath, response.data);

      // Actualizar tamaño y timestamp
      const stats = fs.statSync(doc.filePath);
      await doc.update({ fileSizeBytes: stats.size });

      console.log(`[OnlyOffice] Documento guardado: ${doc.id}`);
    }

    // OnlyOffice SIEMPRE requiere { error: 0 } para confirmar que recibimos el callback
    res.json({ error: 0 });
  } catch (error) {
    console.error('Error en callback de OnlyOffice:', error);
    res.json({ error: 1 });
  }
};

// GET /documents/:id/file  (acceso público con token query param para OnlyOffice)
exports.serveFile = async (req, res) => {
  try {
    // El token puede venir como query param (OnlyOffice lo necesita así)
    const token = req.query.token || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token requerido.' });

    let decoded;
    try {
      decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'jwt_secret_key');
    } catch (e) {
      return res.status(401).json({ error: 'Token inválido.' });
    }

    const { User } = require('../models');
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado.' });

    const doc = await Document.findOne({
      where: { id: req.params.id, tenantId: user.tenantId }
    });
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado.' });
    if (!fs.existsSync(doc.filePath)) return res.status(404).json({ error: 'Archivo no disponible.' });

    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${doc.originalName}"`);
    res.sendFile(path.resolve(doc.filePath));
  } catch (error) {
    console.error('Error sirviendo archivo:', error);
    res.status(500).json({ error: 'Error al servir el archivo.' });
  }
};

function getDocumentType(fileType) {
  const wordTypes = ['doc', 'docx', 'odt', 'rtf', 'txt'];
  const cellTypes = ['xls', 'xlsx', 'ods', 'csv'];
  const slideTypes = ['ppt', 'pptx', 'odp'];
  if (wordTypes.includes(fileType)) return 'word';
  if (cellTypes.includes(fileType)) return 'cell';
  if (slideTypes.includes(fileType)) return 'slide';
  return 'word';
}
