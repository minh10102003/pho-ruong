import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate';
import { requireRoles } from '../middleware/auth';
import { permissionController } from '../controllers/permission.controller';

const router = Router();

const updateFeaturesSchema = z.object({
  updates: z.array(
    z.object({
      role: z.enum(['ADMIN', 'MANAGER', 'STAFF']),
      featureKey: z.string().min(1),
      enabled: z.boolean(),
    })
  ),
});

router.get('/me', permissionController.getMyFeatures);
router.get('/roles', requireRoles('ADMIN'), permissionController.getRoleFeatures);
router.patch(
  '/roles',
  requireRoles('ADMIN'),
  validateBody(updateFeaturesSchema),
  permissionController.updateRoleFeatures
);

export default router;
