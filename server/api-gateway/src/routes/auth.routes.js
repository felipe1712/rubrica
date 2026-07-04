const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateUser } = require('../middlewares/auth');

router.post('/login', authController.loginUser);
router.post('/admin/login', authController.loginAdmin);
router.get('/me', authenticateUser, authController.getMe);

module.exports = router;
