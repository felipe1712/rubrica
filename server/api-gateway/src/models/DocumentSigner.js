const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DocumentSigner = sequelize.define('DocumentSigner', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  documentId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'document_id'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'Firmante',
    allowNull: false
  },
  signingOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'signing_order'
  },
  status: {
    type: DataTypes.ENUM('pending', 'viewed', 'signed', 'rejected'),
    defaultValue: 'pending',
    allowNull: false
  },
  signingToken: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'signing_token'
  },
  signedAt: {
    type: DataTypes.DATE,
    field: 'signed_at'
  },
  ipAddress: {
    type: DataTypes.STRING,
    field: 'ip_address'
  }
}, {
  tableName: 'document_signers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = DocumentSigner;
