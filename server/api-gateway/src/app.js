const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const sequelize = require('./config/database');
const routes = require('./routes');
const { SuperAdmin } = require('./models');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// Security and Logging Middlewares
app.use(helmet());
app.use(cors({
  origin: '*', // Adjust this to allow only specific domains (like app.rubricalo.com) in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('combined'));
app.use(express.json());

// Routes
app.use('/', routes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Manejador de error global:', err.stack);
  res.status(500).json({ error: 'Ha ocurrido un error en el servidor.' });
});

// Automatic seeding of SuperAdmin on startup
async function seedSuperAdmin() {
  try {
    const adminCount = await SuperAdmin.count();
    if (adminCount === 0) {
      const email = process.env.ADMIN_EMAIL || 'admin@rubricalo.com';
      const rawPassword = process.env.ADMIN_PASSWORD || 'rubricaloadmin123';
      const passwordHash = await SuperAdmin.hashPassword(rawPassword);

      await SuperAdmin.create({
        email,
        passwordHash
      });
      console.log(`[SEED] Super-Admin creado por defecto: ${email}`);
    }
  } catch (error) {
    console.error('Error al sembrar el Super-Admin:', error);
  }
}

// Database Connection & Server Initialization
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connection established successfully.');

    // Sync database models (does not overwrite existing tables, only alters if needed)
    await sequelize.sync();
    console.log('Database synchronized.');

    // Seed default admin
    await seedSuperAdmin();

    app.listen(PORT, () => {
      console.log(`API Gateway running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database or start the server:', error);
    process.exit(1);
  }
}

startServer();
