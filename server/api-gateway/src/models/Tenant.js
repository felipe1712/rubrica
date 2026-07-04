const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tenant = sequelize.define('Tenant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  plan: {
    type: DataTypes.STRING,
    defaultValue: 'esencial',
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active',
    allowNull: false
  },
  licenseKey: {
    type: DataTypes.STRING,
    unique: true,
    field: 'license_key'
  },
  eddProductId: {
    type: DataTypes.INTEGER,
    field: 'edd_product_id'
  },
  expiresAt: {
    type: DataTypes.DATE,
    field: 'expires_at'
  },
  maxUsers: {
    type: DataTypes.INTEGER,
    defaultValue: 3,
    field: 'max_users'
  },
  maxDocsMonth: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
    field: 'max_docs_month'
  },
  maxStorageGb: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    field: 'max_storage_gb'
  },
  docusealOrgId: {
    type: DataTypes.STRING,
    field: 'docuseal_org_id'
  }
}, {
  tableName: 'tenants'
});

module.exports = Tenant;
