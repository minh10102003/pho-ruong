import { Request, Response, NextFunction } from 'express';
import { checkInService } from '../services/checkin.service';

export class CheckInController {
  requestCheckIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const employeeId = req.body.employeeId as string;
      if (user.role === 'STAFF' && user.employeeId !== employeeId) {
        res.status(403).json({ success: false, error: 'Chỉ được gửi yêu cầu cho chính mình' });
        return;
      }
      const data = await checkInService.requestCheckIn(employeeId);
      res.status(201).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  getPendingRequests = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await checkInService.getPendingRequests();
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
      const data = await checkInService.getMyPendingRequest(user.employeeId);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  approveRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await checkInService.approveRequest(req.params.id, req.user!.id);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  rejectRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await checkInService.rejectRequest(
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
      const data = await checkInService.cancelMyRequest(user.employeeId);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };
}

export const checkInController = new CheckInController();
