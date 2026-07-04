const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const webhookRoutes = require('./webhook.routes');
const docusealRoutes = require('./docuseal.routes');
const stirlingRoutes = require('./stirling.routes');
const adminRoutes = require('./admin.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/docuseal', docusealRoutes);
router.use('/pdf', stirlingRoutes);
router.use('/admin', adminRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

module.exports = router;
