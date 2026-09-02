const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');

router.post('/edd', webhookController.handleEddWebhook);
router.post('/nufi', webhookController.handleNufiWebhook);

module.exports = router;
