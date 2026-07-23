const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const sequelize = require('./config/database');
const routes = require('./routes');
const { SuperAdmin, Tenant, User } = require('./models');
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

// Automatic seeding of SuperAdmin & Demo Tenant on startup
async function seedDefaults() {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@rubricalo.com';
    const rawPassword = process.env.ADMIN_PASSWORD || 'rubricaloadmin123';
    const passwordHash = await SuperAdmin.hashPassword(rawPassword);

    const [admin, createdAdmin] = await SuperAdmin.findOrCreate({
      where: { email },
      defaults: { email, passwordHash }
    });
    if (!createdAdmin) {
      admin.passwordHash = passwordHash;
      await admin.save();
    }
    console.log(`[SEED] Super-Admin verificado: ${email}`);

    const [tenant] = await Tenant.findOrCreate({
      where: { email: 'demo@rubricalo.com' },
      defaults: {
        name: 'Organización Demo',
        email: 'demo@rubricalo.com',
        licenseKey: 'DEMO-LICENSE-KEY',
        status: 'active',
        plan: 'enterprise'
      }
    });

    const userEmail = 'demo@rubricalo.com';
    const userPass = await User.hashPassword('rubricalo123');

    const [user, createdUser] = await User.findOrCreate({
      where: { tenantId: tenant.id, email: userEmail },
      defaults: {
        tenantId: tenant.id,
        name: 'Usuario Demo',
        email: userEmail,
        passwordHash: userPass,
        role: 'admin',
        isActive: true
      }
    });

    if (!createdUser) {
      user.passwordHash = userPass;
      user.isActive = true;
      await user.save();
    }
    console.log(`[SEED] Usuario Demo verificado: ${userEmail} / rubricalo123`);
  } catch (error) {
    console.error('Error en seedDefaults:', error);
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

    // Seed default admin and demo tenant
    await seedDefaults();

    app.listen(PORT, () => {
      console.log(`API Gateway running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database or start the server:', error);
    process.exit(1);
  }
}

startServer();
