import { paymentRepository } from '../repositories/payment.repository';

export class PaymentService {
  async getConfig() {
    const config = await paymentRepository.getConfig();
    return {
      shopName: config?.shopName ?? 'RUỘNG',
      shopAddress: config?.shopAddress ?? null,
      shopPhone: config?.shopPhone ?? null,
      logoUrl: config?.logoUrl ?? null,
      transferQrUrl: config?.transferQrUrl ?? null,
    };
  }
}

export const paymentService = new PaymentService();
