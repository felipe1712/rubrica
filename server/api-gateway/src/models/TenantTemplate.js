const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TenantTemplate = sequelize.define('TenantTemplate', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
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
  docusealTemplateId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    field: 'docuseal_template_id'
  }
}, {
  tableName: 'tenant_templates',
  timestamps: true
});

module.exports = TenantTemplate;
