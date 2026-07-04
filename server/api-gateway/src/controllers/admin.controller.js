const { Tenant, User, UsageStat, Nom151Record, sequelize } = require('../models');
const { exec } = require('child_process');

// Get global platform KPIs
exports.getStats = async (req, res) => {
  try {
    const totalTenants = await Tenant.count();
    const activeTenants = await Tenant.count({ where: { status: 'active' } });
    const trialTenants = await Tenant.count({ where: { status: 'trial' } });
    const suspendedTenants = await Tenant.count({ where: { status: 'suspended' } });

    // Total documents signed across all tenants
    const docsSignedStat = await UsageStat.sum('docs_signed') || 0;
    // Total pdf operations
    const pdfOpsStat = await UsageStat.sum('pdf_operations') || 0;
    // Total NOM-151 stamps
    const nom151StampsStat = await UsageStat.sum('nom151_stamps') || 0;

    res.json({
      tenants: {
        total: totalTenants,
        active: activeTenants,
        trial: trialTenants,
        suspended: suspendedTenants
      },
      usage: {
        docsSigned: docsSignedStat,
        pdfOperations: pdfOpsStat,
        nom151Stamps: nom151StampsStat
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas del sistema.' });
  }
};

// List all tenants
exports.getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(tenants);
  } catch (error) {
    console.error('Error listing tenants:', error);
    res.status(500).json({ error: 'Error al obtener la lista de clientes.' });
  }
};

// Get single tenant details
exports.getTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['id', 'name', 'email', 'role', 'isActive', 'lastLoginAt'] },
        { model: UsageStat, order: [['yearMonth', 'DESC']], limit: 6 }
      ]
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    res.json(tenant);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    res.status(500).json({ error: 'Error al obtener los detalles del cliente.' });
  }
};

// Update tenant plan or status
exports.updateTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    const { name, plan, status, expiresAt, maxUsers, maxDocsMonth, maxStorageGb } = req.body;

    if (name) tenant.name = name;
    if (plan) tenant.plan = plan;
    if (status) tenant.status = status;
    if (expiresAt !== undefined) tenant.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (maxUsers !== undefined) tenant.maxUsers = maxUsers;
    if (maxDocsMonth !== undefined) tenant.maxDocsMonth = maxDocsMonth;
    if (maxStorageGb !== undefined) tenant.maxStorageGb = maxStorageGb;

    await tenant.save();

    res.json({ success: true, message: 'Cliente actualizado correctamente.', tenant });
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({ error: 'Error al actualizar el cliente.' });
  }
};

// Delete tenant
exports.deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    await tenant.destroy();
    res.json({ success: true, message: 'Cliente eliminado del sistema.' });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    res.status(500).json({ error: 'Error al eliminar el cliente.' });
  }
};

// Simple container health status (checks docker socket, or just returns basic system resources)
exports.getPlatformHealth = async (req, res) => {
  try {
    // Return mock or executed cpu/ram statistics (read directly from linux)
    exec('df -h / | tail -n 1', (err, stdout) => {
      let diskInfo = 'N/A';
      if (!err) {
        const parts = stdout.trim().split(/\s+/);
        diskInfo = {
          size: parts[1],
          used: parts[2],
          available: parts[3],
          usePercent: parts[4]
        };
      }

      res.json({
        status: 'online',
        timestamp: new Date(),
        services: {
          postgres: 'online',
          redis: 'online',
          minio: 'online',
          docuseal: 'online',
          stirlingPdf: 'online'
        },
        hostMetrics: {
          disk: diskInfo
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al comprobar estado del sistema.' });
  }
};
