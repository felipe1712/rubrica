const docusealService = require('../services/docuseal.service');
const { TenantTemplate } = require('../models');
const usageService = require('../services/usage.service');

// Get all templates mapped to current tenant
exports.getTemplates = async (req, res) => {
  try {
    const mappings = await TenantTemplate.findAll({
      where: { tenantId: req.tenantId }
    });
    const templateIds = mappings.map(m => m.docusealTemplateId);

    if (templateIds.length === 0) {
      return res.json([]);
    }

    const allTemplates = await docusealService.getTemplates();
    const filteredTemplates = allTemplates.filter(t => templateIds.includes(t.id));

    res.json(filteredTemplates);
  } catch (error) {
    console.error('Error fetching templates:', error.message);
    res.status(500).json({ error: 'Error al obtener las plantillas de firma.' });
  }
};

// Get single template if owned by current tenant
exports.getTemplate = async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    const mapping = await TenantTemplate.findOne({
      where: { tenantId: req.tenantId, docusealTemplateId: templateId }
    });

    if (!mapping) {
      return res.status(403).json({ error: 'No tiene permiso para acceder a esta plantilla.' });
    }

    const template = await docusealService.getTemplate(templateId);
    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error.message);
    res.status(500).json({ error: 'Error al obtener la plantilla de firma.' });
  }
};

// Create a template and map it to current tenant
exports.createTemplate = async (req, res) => {
  try {
    const template = await docusealService.createTemplate(req.body);

    // Save the mapping
    await TenantTemplate.create({
      tenantId: req.tenantId,
      docusealTemplateId: template.id
    });

    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error al crear la plantilla de firma.' });
  }
};

// Delete template if owned
exports.deleteTemplate = async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    const mapping = await TenantTemplate.findOne({
      where: { tenantId: req.tenantId, docusealTemplateId: templateId }
    });

    if (!mapping) {
      return res.status(403).json({ error: 'No tiene permiso para eliminar esta plantilla.' });
    }

    await docusealService.deleteTemplate(templateId);
    await mapping.destroy();

    res.json({ success: true, message: 'Plantilla eliminada correctamente.' });
  } catch (error) {
    console.error('Error deleting template:', error.message);
    res.status(500).json({ error: 'Error al eliminar la plantilla de firma.' });
  }
};

// Submissions
exports.getSubmissions = async (req, res) => {
  try {
    const mappings = await TenantTemplate.findAll({
      where: { tenantId: req.tenantId }
    });
    const templateIds = mappings.map(m => m.docusealTemplateId);

    if (templateIds.length === 0) {
      return res.json([]);
    }

    const allSubmissions = await docusealService.getSubmissions();
    const filteredSubmissions = allSubmissions.filter(s => templateIds.includes(s.template_id));

    res.json(filteredSubmissions);
  } catch (error) {
    console.error('Error fetching submissions:', error.message);
    res.status(500).json({ error: 'Error al obtener los documentos enviados.' });
  }
};

exports.createSubmission = async (req, res) => {
  try {
    const templateId = parseInt(req.body.template_id);
    const mapping = await TenantTemplate.findOne({
      where: { tenantId: req.tenantId, docusealTemplateId: templateId }
    });

    if (!mapping) {
      return res.status(403).json({ error: 'No tiene permiso para usar esta plantilla.' });
    }

    // Check plan limits for signed documents
    const canSign = await usageService.checkLimits(req.user.Tenant, 'docsSigned');
    if (!canSign) {
      return res.status(403).json({ error: 'Ha alcanzado el límite mensual de documentos firmados para su plan.' });
    }

    const submission = await docusealService.createSubmission(req.body);

    // Track usage
    await usageService.incrementStat(req.tenantId, 'docsSigned');

    res.status(201).json(submission);
  } catch (error) {
    console.error('Error creating submission:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error al enviar la solicitud de firma.' });
  }
};

exports.getSubmission = async (req, res) => {
  try {
    const submissionId = parseInt(req.params.id);
    const submission = await docusealService.getSubmission(submissionId);

    const mapping = await TenantTemplate.findOne({
      where: { tenantId: req.tenantId, docusealTemplateId: submission.template_id }
    });

    if (!mapping) {
      return res.status(403).json({ error: 'No tiene permiso para acceder a esta solicitud de firma.' });
    }

    res.json(submission);
  } catch (error) {
    console.error('Error fetching submission:', error.message);
    res.status(500).json({ error: 'Error al obtener el documento.' });
  }
};
