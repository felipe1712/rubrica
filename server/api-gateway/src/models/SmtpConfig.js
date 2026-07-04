const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SmtpConfig = sequelize.define('SmtpConfig', {
  id: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    primaryKey: true
  },
  host: {
    type: DataTypes.STRING,
    defaultValue: 'smtp-relay.brevo.com',
    allowNull: false
  },
  port: {
    type: DataTypes.INTEGER,
    defaultValue: 587,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING
  },
  password: {
    type: DataTypes.STRING
  },
  fromEmail: {
    type: DataTypes.STRING,
    defaultValue: 'noreply@rubricalo.com',
    field: 'from_email'
  },
  fromName: {
    type: DataTypes.STRING,
    defaultValue: 'Rubricalo',
    field: 'from_name'
  }
}, {
  tableName: 'smtp_config',
  timestamps: true
});

module.exports = SmtpConfig;
