const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const webhookRoutes = require('./webhook.routes');
const docusealRoutes = require('./docuseal.routes');
const stirlingRoutes = require('./stirling.routes');
const adminRoutes = require('./admin.routes');
const adminGlobalRoutes = require('./admin-global.routes');
const documentsRoutes = require('./documents.routes');
const onlyofficeRoutes = require('./onlyoffice.routes');

const usersRoutes = require('./users.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/docuseal', docusealRoutes);
router.use('/pdf', stirlingRoutes);
router.use('/admin/global', adminGlobalRoutes);
router.use('/admin', adminRoutes);
router.use('/documents', documentsRoutes);
router.use('/editor', onlyofficeRoutes);
router.use('/users', usersRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

module.exports = router;
