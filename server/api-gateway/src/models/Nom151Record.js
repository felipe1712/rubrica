const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Nom151Record = sequelize.define('Nom151Record', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'tenant_id',
    references: {
      model: 'tenants',
      key: 'id'
    }
  },
  documentName: {
    type: DataTypes.STRING(500),
    field: 'document_name'
  },
  docusealSubId: {
    type: DataTypes.STRING,
    field: 'docuseal_sub_id'
  },
  pdfHashSha256: {
    type: DataTypes.STRING(64),
    allowNull: false,
    field: 'pdf_hash_sha256'
  },
  pscToken: {
    type: DataTypes.TEXT,
    field: 'psc_token'
  },
  pscTimestamp: {
    type: DataTypes.DATE,
    field: 'psc_timestamp'
  },
  pscProvider: {
    type: DataTypes.STRING(50),
    field: 'psc_provider'
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending',
    allowNull: false
  },
  errorMsg: {
    type: DataTypes.TEXT,
    field: 'error_msg'
  }
}, {
  tableName: 'nom151_records'
});

module.exports = Nom151Record;
