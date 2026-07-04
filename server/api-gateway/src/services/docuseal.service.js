const axios = require('axios');
require('dotenv').config();

const DOCUSEAL_URL = process.env.DOCUSEAL_INTERNAL_URL || 'http://docuseal:3000';
const DOCUSEAL_API_KEY = process.env.DOCUSEAL_API_KEY || '';

const client = axios.create({
  baseURL: DOCUSEAL_URL,
  headers: {
    'X-Auth-Token': DOCUSEAL_API_KEY,
    'Content-Type': 'application/json'
  }
});

// Templates
exports.getTemplates = async () => {
  const response = await client.get('/api/templates');
  return response.data;
};

exports.getTemplate = async (templateId) => {
  const response = await client.get(`/api/templates/${templateId}`);
  return response.data;
};

exports.createTemplate = async (data) => {
  const response = await client.post('/api/templates', data);
  return response.data;
};

exports.deleteTemplate = async (templateId) => {
  const response = await client.delete(`/api/templates/${templateId}`);
  return response.data;
};

// Submissions
exports.getSubmissions = async (query = {}) => {
  const response = await client.get('/api/submissions', { params: query });
  return response.data;
};

exports.getSubmission = async (submissionId) => {
  const response = await client.get(`/api/submissions/${submissionId}`);
  return response.data;
};

exports.createSubmission = async (data) => {
  const response = await client.post('/api/submissions', data);
  return response.data;
};
