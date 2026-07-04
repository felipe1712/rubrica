const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');

router.post('/edd', webhookController.handleEddWebhook);

module.exports = router;
