const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticateSuperAdmin } = require('../middlewares/auth');

router.use(authenticateSuperAdmin);

router.get('/stats', adminController.getStats);
router.get('/health', adminController.getPlatformHealth);

router.get('/tenants', adminController.getTenants);
router.get('/tenants/:id', adminController.getTenant);
router.put('/tenants/:id', adminController.updateTenant);
router.delete('/tenants/:id', adminController.deleteTenant);

module.exports = router;
