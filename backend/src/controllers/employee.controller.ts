import { Request, Response, NextFunction } from 'express';
import { employeeService } from '../services/employee.service';

// Controller - xử lý HTTP request cho module Nhân viên
export class EmployeeController {
  getEmployees = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await employeeService.getEmployees();
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  getOpenTimesheets = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await employeeService.getOpenTimesheets();
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  getOpenTimesheet = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      if (user.role === 'STAFF' && user.employeeId !== req.params.id) {
        res.status(403).json({ success: false, error: 'Không có quyền truy cập' });
        return;
      }
      const data = await employeeService.getOpenTimesheet(req.params.id);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  createEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await employeeService.createEmployee(req.body);
      res.status(201).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  updateEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await employeeService.updateEmployee(req.params.id, req.body);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  checkIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      if (user.role === 'STAFF') {
        res.status(403).json({
          success: false,
          error: 'Nhân viên cần gửi yêu cầu check-in để quản lý duyệt',
        });
        return;
      }
      const data = await employeeService.checkIn(req.body);
      res.status(201).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  checkOut = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const sheet = await employeeService.getTimesheetById(req.body.timesheetId);
      if (!sheet) {
        res.status(404).json({ success: false, error: 'Không tìm thấy ca làm' });
        return;
      }
      if (user.role === 'STAFF' && user.employeeId !== sheet.employeeId) {
        res.status(403).json({ success: false, error: 'Chỉ được check-out ca của chính mình' });
        return;
      }
      const data = await employeeService.checkOut(req.body);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  getPayroll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      const employeeId = req.query.employeeId as string | undefined;

      if (user.role === 'STAFF') {
        if (!user.employeeId) {
          res.status(403).json({ success: false, error: 'Tài khoản chưa gắn nhân viên' });
          return;
        }
        const data = await employeeService.getPayrollForEmployee(user.employeeId, year, month);
        res.json({ success: true, data });
        return;
      }

      const data = employeeId
        ? await employeeService.getPayrollForEmployee(employeeId, year, month)
        : await employeeService.getMonthlyPayroll(year, month);

      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };
}

export const employeeController = new EmployeeController();
