const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'tenant_id'
  },
  uploadedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'uploaded_by'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  originalName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'original_name'
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'file_path'
  },
  fileSizeBytes: {
    type: DataTypes.INTEGER,
    field: 'file_size_bytes'
  },
  mimeType: {
    type: DataTypes.STRING,
    defaultValue: 'application/pdf',
    field: 'mime_type'
  },
  status: {
    type: DataTypes.ENUM('uploaded', 'pending_signature', 'signed', 'rejected', 'expired'),
    defaultValue: 'uploaded',
    allowNull: false
  },
  docusealSubmissionId: {
    type: DataTypes.INTEGER,
    field: 'docuseal_submission_id'
  },
  docusealTemplateId: {
    type: DataTypes.INTEGER,
    field: 'docuseal_template_id'
  },
  signerEmail: {
    type: DataTypes.STRING,
    field: 'signer_email'
  },
  signerName: {
    type: DataTypes.STRING,
    field: 'signer_name'
  },
  signedAt: {
    type: DataTypes.DATE,
    field: 'signed_at'
  },
  expiresAt: {
    type: DataTypes.DATE,
    field: 'expires_at'
  }
}, {
  tableName: 'documents',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Document;
