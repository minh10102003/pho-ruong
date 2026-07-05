import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate';
import { requireRoles } from '../middleware/auth';
import { employeeController } from '../controllers/employee.controller';
import { checkInController } from '../controllers/checkin.controller';

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

const requestCheckInSchema = z.object({
  employeeId: z.string().uuid(),
});

const checkOutSchema = z.object({
  timesheetId: z.string().uuid(),
});

const rejectCheckInSchema = z.object({
  rejectReason: z.string().optional(),
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
router.post(
  '/timesheets/request-check-in',
  validateBody(requestCheckInSchema),
  checkInController.requestCheckIn
);
router.get(
  '/timesheets/check-in-requests/pending',
  requireRoles('MANAGER', 'ADMIN'),
  checkInController.getPendingRequests
);
router.get('/timesheets/check-in-requests/mine', checkInController.getMyPendingRequest);
router.post(
  '/timesheets/check-in-requests/:id/approve',
  requireRoles('MANAGER', 'ADMIN'),
  checkInController.approveRequest
);
router.post(
  '/timesheets/check-in-requests/:id/reject',
  requireRoles('MANAGER', 'ADMIN'),
  validateBody(rejectCheckInSchema),
  checkInController.rejectRequest
);
router.post('/timesheets/check-in-requests/mine/cancel', checkInController.cancelMyRequest);
router.post(
  '/timesheets/check-in',
  requireRoles('MANAGER', 'ADMIN'),
  validateBody(checkInSchema),
  employeeController.checkIn
);
router.post('/timesheets/check-out', validateBody(checkOutSchema), employeeController.checkOut);
router.get('/payroll', employeeController.getPayroll);

export default router;
