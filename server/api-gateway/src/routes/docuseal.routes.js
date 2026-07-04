const express = require('express');
const router = express.Router();
const docusealController = require('../controllers/docuseal.controller');
const { authenticateUser } = require('../middlewares/auth');

router.use(authenticateUser);

router.get('/templates', docusealController.getTemplates);
router.get('/templates/:id', docusealController.getTemplate);
router.post('/templates', docusealController.createTemplate);
router.delete('/templates/:id', docusealController.deleteTemplate);

router.get('/submissions', docusealController.getSubmissions);
router.get('/submissions/:id', docusealController.getSubmission);
router.post('/submissions', docusealController.createSubmission);

module.exports = router;
