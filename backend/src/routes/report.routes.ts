import { Router } from 'express';
import { reportController } from '../controllers/report.controller';

const router = Router();

router.get('/revenue', reportController.getRevenue);
router.get('/tax', reportController.getTaxReport);
router.get('/tax/export', reportController.exportTaxReport);

export default router;
