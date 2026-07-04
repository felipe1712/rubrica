const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PlanConfig = sequelize.define('PlanConfig', {
  plan: {
    type: DataTypes.STRING(50),
    primaryKey: true
  },
  maxUsers: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'max_users'
  },
  maxDocsMonth: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'max_docs_month'
  },
  maxStorageGb: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'max_storage_gb'
  },
  hasApiAccess: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'has_api_access'
  },
  hasOcr: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'has_ocr'
  },
  hasBulkSend: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'has_bulk_send'
  },
  eddProductId: {
    type: DataTypes.INTEGER,
    field: 'edd_product_id'
  },
  priceUsdMonth: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'price_usd_month'
  }
}, {
  tableName: 'plan_config',
  timestamps: true
});

module.exports = PlanConfig;
