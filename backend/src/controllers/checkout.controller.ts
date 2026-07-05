import { Request, Response, NextFunction } from 'express';
import { checkOutService } from '../services/checkout.service';

export class CheckOutController {
  requestCheckOut = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const { timesheetId } = req.body as { timesheetId: string };
      const employeeId = user.employeeId;
      if (!employeeId) {
        res.status(403).json({ success: false, error: 'Tài khoản chưa gắn nhân viên' });
        return;
      }
      const data = await checkOutService.requestCheckOut(employeeId, timesheetId);
      res.status(201).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  getPendingRequests = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await checkOutService.getPendingRequests();
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  getMyPendingRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      if (!user.employeeId) {
        res.status(403).json({ success: false, error: 'Tài khoản chưa gắn nhân viên' });
        return;
      }
      const data = await checkOutService.getMyPendingRequest(user.employeeId);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  approveRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await checkOutService.approveRequest(req.params.id, req.user!.id);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  rejectRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await checkOutService.rejectRequest(
        req.params.id,
        req.user!.id,
        req.body.rejectReason
      );
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  cancelMyRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      if (!user.employeeId) {
        res.status(403).json({ success: false, error: 'Tài khoản chưa gắn nhân viên' });
        return;
      }
      const data = await checkOutService.cancelMyRequest(user.employeeId);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };
}

export const checkOutController = new CheckOutController();
