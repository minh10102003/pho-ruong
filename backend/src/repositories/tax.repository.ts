import prisma from '../config/database';

// Repository - cấu hình thuế
export class TaxRepository {
  async getActiveTaxConfig() {
    return prisma.taxConfig.findFirst({ where: { isActive: true } });
  }
}

export const taxRepository = new TaxRepository();
