const { Sequelize } = require('sequelize');
require('dotenv').config();

const dbName = process.env.POSTGRES_DB || 'rubrica_prod';
const dbUser = process.env.POSTGRES_USER || 'rubrica_user';
const dbPassword = process.env.POSTGRES_PASSWORD || '';
const dbHost = process.env.POSTGRES_HOST || 'postgres';

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    underscored: true,
    timestamps: true
  }
});

// Middleware helper to set local session tenant ID for Row Level Security (RLS)
sequelize.setTenantContext = async (transaction, tenantId) => {
  if (tenantId) {
    await sequelize.query(
      `SET LOCAL app.current_tenant_id = :tenantId`,
      {
        replacements: { tenantId },
        transaction
      }
    );
  }
};

module.exports = sequelize;
