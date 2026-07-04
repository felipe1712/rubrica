const express = require('express');
const router = express.Router();
const proxy = require('express-http-proxy');
const { authenticateUser } = require('../middlewares/auth');
const usageService = require('../services/usage.service');
require('dotenv').config();

const STIRLING_URL = process.env.STIRLING_INTERNAL_URL || 'http://stirling-pdf:8080';

router.use(authenticateUser);

// Middleware to check plan-specific features (e.g. OCR is Pro/Enterprise only)
const checkPdfPlanLimits = (req, res, next) => {
  const plan = req.user.Tenant.plan;
  const path = req.path;

  // Block OCR for Esencial plan
  if (path.includes('/ocr') && plan === 'esencial') {
    return res.status(403).json({ error: 'La función OCR (Reconocimiento Óptico de Caracteres) no está incluida en su plan. Actualice a Profesional o Empresarial.' });
  }

  next();
};

router.use('/', checkPdfPlanLimits, proxy(STIRLING_URL, {
  proxyReqPathResolver: function (req) {
    // Resolved directly to Stirling PDF internal URL
    return req.url;
  },
  userResDecorator: async function (proxyRes, proxyResData, userReq, userRes) {
    if (proxyRes.statusCode >= 200 && proxyRes.statusCode < 300) {
      // Increment PDF operations usage counter
      usageService.incrementStat(userReq.tenantId, 'pdfOperations').catch(err => 
        console.error('Failed to increment pdfOperations stat:', err)
      );
    }
    return proxyResData;
  }
}));

module.exports = router;
