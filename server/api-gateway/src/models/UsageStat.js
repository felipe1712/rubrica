const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UsageStat = sequelize.define('UsageStat', {
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
  yearMonth: {
    type: DataTypes.CHAR(7),
    allowNull: false,
    field: 'year_month'
  },
  docsSigned: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: 'docs_signed'
  },
  pdfOperations: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: 'pdf_operations'
  },
  nom151Stamps: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: 'nom151_stamps'
  },
  storageUsedGb: {
    type: DataTypes.DECIMAL(10, 3),
    defaultValue: 0.0,
    allowNull: false,
    field: 'storage_used_gb'
  }
}, {
  tableName: 'usage_stats',
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'year_month']
    }
  ]
});

module.exports = UsageStat;
