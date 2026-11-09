const { sequelize, Tenant, CreditTransaction } = require('../models');

class CreditService {
  /**
   * Obtiene el saldo actual y métricas de créditos del tenant
   */
  async getTenantBalance(tenantId) {
    const tenant = await Tenant.findByPk(tenantId, {
      attributes: ['id', 'name', 'plan', 'status', 'signatureCredits', 'totalCreditsPurchased', 'expiresAt']
    });

    if (!tenant) {
      throw new Error('Tenant no encontrado');
    }

    const lastTransactions = await CreditTransaction.findAll({
      where: { tenantId },
      order: [['created_at', 'DESC']],
      limit: 10
    });

    return {
      tenantId: tenant.id,
      tenantName: tenant.name,
      plan: tenant.plan,
      status: tenant.status,
      creditsAvailable: tenant.signatureCredits,
      totalPurchased: tenant.totalCreditsPurchased,
      recentTransactions: lastTransactions
    };
  }

  /**
   * Añade créditos al saldo de un tenant (Compra de paquete de saldo)
   */
  async addCredits(tenantId, amount, concept, referenceId = null) {
    if (!amount || amount <= 0) {
      throw new Error('La cantidad de créditos a recargar debe ser mayor a 0');
    }

    return await sequelize.transaction(async (t) => {
      const tenant = await Tenant.findByPk(tenantId, {
        lock: t.LOCK.UPDATE,
        transaction: t
      });

      if (!tenant) {
        throw new Error('Tenant no encontrado para acreditar saldo');
      }

      const newBalance = tenant.signatureCredits + amount;
      const newTotalPurchased = (tenant.totalCreditsPurchased || 0) + amount;

      await tenant.update({
        signatureCredits: newBalance,
        totalCreditsPurchased: newTotalPurchased
      }, { transaction: t });

      const record = await CreditTransaction.create({
        tenantId,
        amount,
        balanceAfter: newBalance,
        concept,
        referenceId
      }, { transaction: t });

      return {
        success: true,
        creditsAdded: amount,
        balance: newBalance,
        transactionId: record.id
      };
    });
  }

  /**
   * Descuenta 1 crédito por envío de documento a firmar (Atómico con Lock)
   */
  async deductCredit(tenantId, concept = 'dispatch_envelope', referenceId = null) {
    return await sequelize.transaction(async (t) => {
      const tenant = await Tenant.findByPk(tenantId, {
        lock: t.LOCK.UPDATE,
        transaction: t
      });

      if (!tenant) {
        throw new Error('Tenant no encontrado');
      }

      if (tenant.signatureCredits < 1) {
        const error = new Error('Saldo insuficiente para enviar el documento a firmar. Por favor recarga un paquete en nuestro sitio web.');
        error.code = 'INSUFFICIENT_CREDITS';
        error.creditsAvailable = tenant.signatureCredits;
        throw error;
      }

      const newBalance = tenant.signatureCredits - 1;

      await tenant.update({
        signatureCredits: newBalance
      }, { transaction: t });

      const record = await CreditTransaction.create({
        tenantId,
        amount: -1,
        balanceAfter: newBalance,
        concept,
        referenceId
      }, { transaction: t });

      return {
        success: true,
        remainingCredits: newBalance,
        transactionId: record.id
      };
    });
  }
}

module.exports = new CreditService();
