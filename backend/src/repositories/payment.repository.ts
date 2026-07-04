import prisma from '../config/database';

export class PaymentRepository {
  async getConfig() {
    return prisma.paymentConfig.findUnique({
      where: { id: 'default-payment' },
    });
  }

  async upsertConfig(data: {
    shopName?: string;
    shopAddress?: string | null;
    shopPhone?: string | null;
    logoUrl?: string | null;
    transferQrUrl?: string | null;
  }) {
    return prisma.paymentConfig.upsert({
      where: { id: 'default-payment' },
      update: data,
      create: {
        id: 'default-payment',
        shopName: data.shopName ?? 'RUỘNG',
        shopAddress: data.shopAddress ?? null,
        shopPhone: data.shopPhone ?? null,
        logoUrl: data.logoUrl ?? null,
        transferQrUrl: data.transferQrUrl ?? null,
      },
    });
  }
}

export const paymentRepository = new PaymentRepository();
