import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

export class AuthController {
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await authService.login(req.body.phone, req.body.password);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await authService.getMe(req.user!.id);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  createManager = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await authService.createManager(req.body, req.user!.id);
      res.status(201).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  createStaff = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await authService.createStaffAccount(req.body, req.user!.id);
      res.status(201).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.changePassword(
        req.user!.id,
        req.body.currentPassword,
        req.body.newPassword
      );
      res.json({ success: true, data: { message: 'Đã đổi mật khẩu thành công' } });
    } catch (e) {
      next(e);
    }
  };
}

export const authController = new AuthController();
