const sequelize = require('../config/database');
const Tenant = require('./Tenant');
const User = require('./User');
const SuperAdmin = require('./SuperAdmin');
const UsageStat = require('./UsageStat');
const Nom151Record = require('./Nom151Record');
const SmtpConfig = require('./SmtpConfig');
const PlanConfig = require('./PlanConfig');
const TenantTemplate = require('./TenantTemplate');

// Relationships
Tenant.hasMany(User, { foreignKey: 'tenant_id', onDelete: 'CASCADE' });
User.belongsTo(Tenant, { foreignKey: 'tenant_id' });

Tenant.hasMany(UsageStat, { foreignKey: 'tenant_id', onDelete: 'CASCADE' });
UsageStat.belongsTo(Tenant, { foreignKey: 'tenant_id' });

Tenant.hasMany(Nom151Record, { foreignKey: 'tenant_id', onDelete: 'CASCADE' });
Nom151Record.belongsTo(Tenant, { foreignKey: 'tenant_id' });

Tenant.hasMany(TenantTemplate, { foreignKey: 'tenant_id', onDelete: 'CASCADE' });
TenantTemplate.belongsTo(Tenant, { foreignKey: 'tenant_id' });

module.exports = {
  sequelize,
  Tenant,
  User,
  SuperAdmin,
  UsageStat,
  Nom151Record,
  SmtpConfig,
  PlanConfig,
  TenantTemplate
};
