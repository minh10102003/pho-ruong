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
  useBlockRounding: z.boolean().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

const updateUserSchema = z.object({
  displayName: z.string().min(1).optional(),
  phone: z.string().min(9).optional(),
  password: z.string().min(6).optional(),
  isActive: z.boolean().optional(),
  hourlyRate: z.number().positive().optional(),
  useBlockRounding: z.boolean().optional(),
});

router.post('/login', validateBody(loginSchema), authController.login);
router.get('/me', authenticate, authController.me);
router.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  authController.changePassword
);
router.get('/users', authenticate, requireRoles('ADMIN'), authController.listUsers);
router.patch(
  '/users/:id',
  authenticate,
  requireRoles('ADMIN'),
  validateBody(updateUserSchema),
  authController.updateUser
);
router.delete(
  '/users/:id',
  authenticate,
  requireRoles('ADMIN'),
  authController.deleteUser
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
  requireRoles('MANAGER', 'ADMIN'),
  validateBody(createStaffSchema),
  authController.createStaff
);

export default router;
