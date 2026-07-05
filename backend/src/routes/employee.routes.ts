import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate';
import { requireRoles } from '../middleware/auth';
import { employeeController } from '../controllers/employee.controller';

const router = Router();

const employeeSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().optional(),
  hourlyRate: z.number().positive(),
});

const checkInSchema = z.object({
  employeeId: z.string().uuid(),
  note: z.string().optional(),
});

const checkOutSchema = z.object({
  timesheetId: z.string().uuid(),
});

const updateEmployeeSchema = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  hourlyRate: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

router.get('/employees', requireRoles('MANAGER', 'ADMIN'), employeeController.getEmployees);
router.get(
  '/employees/open-timesheets',
  requireRoles('MANAGER', 'ADMIN'),
  employeeController.getOpenTimesheets
);
router.get('/employees/:id/open-timesheet', employeeController.getOpenTimesheet);
router.post(
  '/employees',
  requireRoles('MANAGER', 'ADMIN'),
  validateBody(employeeSchema),
  employeeController.createEmployee
);
router.patch(
  '/employees/:id',
  requireRoles('MANAGER', 'ADMIN'),
  validateBody(updateEmployeeSchema),
  employeeController.updateEmployee
);
router.post('/timesheets/check-in', validateBody(checkInSchema), employeeController.checkIn);
router.post('/timesheets/check-out', validateBody(checkOutSchema), employeeController.checkOut);
router.get('/payroll', employeeController.getPayroll);

export default router;
