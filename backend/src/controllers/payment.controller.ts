import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/payment.service';

export class PaymentController {
  getConfig = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const config = await paymentService.getConfig();
      res.json({ success: true, data: config });
    } catch (e) {
      next(e);
    }
  };
}

export const paymentController = new PaymentController();
