const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CreditTransaction = sequelize.define('CreditTransaction', {
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
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  balanceAfter: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'balance_after'
  },
  concept: {
    type: DataTypes.STRING,
    allowNull: false
  },
  referenceId: {
    type: DataTypes.STRING,
    field: 'reference_id'
  }
}, {
  tableName: 'credit_transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = CreditTransaction;
