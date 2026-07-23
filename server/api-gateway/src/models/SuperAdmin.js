const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const SuperAdmin = sequelize.define('SuperAdmin', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'password_hash'
  }
}, {
  tableName: 'super_admins',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

SuperAdmin.prototype.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

SuperAdmin.hashPassword = async function (password) {
  return bcrypt.hash(password, 10);
};

module.exports = SuperAdmin;
