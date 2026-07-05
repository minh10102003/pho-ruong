import { Router } from 'express';
import { requireRoles } from '../middleware/auth';
import { reportController } from '../controllers/report.controller';

const router = Router();

router.use(requireRoles('MANAGER', 'ADMIN'));

router.get('/revenue', reportController.getRevenue);
router.get('/imports', reportController.getImportReport);
router.get('/tax', reportController.getTaxReport);
router.get('/tax/export', reportController.exportTaxReport);

export default router;
