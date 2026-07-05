import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate';
import { authenticate, requireRoles } from '../middleware/auth';
import { authController } from '../controllers/auth.controller';

const router = Router();

const loginSchema = z.object({
  phone: z.string().min(9),
  password: z.string().min(6),
});

const createManagerSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(9),
  password: z.string().min(6),
});

const createStaffSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(9),
  password: z.string().min(6),
  hourlyRate: z.number().positive(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

router.post('/login', validateBody(loginSchema), authController.login);
router.get('/me', authenticate, authController.me);
router.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  authController.changePassword
);
router.post(
  '/managers',
  authenticate,
  requireRoles('ADMIN'),
  validateBody(createManagerSchema),
  authController.createManager
);
router.post(
  '/staff',
  authenticate,
  requireRoles('MANAGER'),
  validateBody(createStaffSchema),
  authController.createStaff
);

export default router;
