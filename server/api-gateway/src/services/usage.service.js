const { UsageStat } = require('../models');

exports.incrementStat = async (tenantId, metric, amount = 1) => {
  const yearMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  try {
    const [stat, created] = await UsageStat.findOrCreate({
      where: { tenantId, yearMonth },
      defaults: {
        docsSigned: 0,
        pdfOperations: 0,
        nom151Stamps: 0,
        storageUsedGb: 0.0
      }
    });

    if (metric === 'docsSigned') {
      stat.docsSigned += amount;
    } else if (metric === 'pdfOperations') {
      stat.pdfOperations += amount;
    } else if (metric === 'nom151Stamps') {
      stat.nom151Stamps += amount;
    } else if (metric === 'storageUsedGb') {
      stat.storageUsedGb = parseFloat(stat.storageUsedGb) + parseFloat(amount);
    }

    await stat.save();
    return stat;
  } catch (error) {
    console.error(`Error incrementing usage stats for tenant ${tenantId}:`, error);
  }
};

exports.checkLimits = async (tenant, metric) => {
  const yearMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  const stat = await UsageStat.findOne({
    where: { tenantId: tenant.id, yearMonth }
  });

  if (!stat) return true; // No usage yet

  if (metric === 'docsSigned' && tenant.maxDocsMonth !== -1) {
    if (stat.docsSigned >= tenant.maxDocsMonth) {
      return false;
    }
  }

  return true;
};
