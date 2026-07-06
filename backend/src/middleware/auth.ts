import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppRole } from '@prisma/client';
import { verifyAuthToken } from '../utils/jwt';
import { permissionService } from '../services/permission.service';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Chưa đăng nhập' });
    return;
  }

  try {
    const token = header.slice(7);
    const payload = verifyAuthToken(token);
    req.user = {
      id: payload.userId,
      role: payload.role,
      employeeId: payload.employeeId,
      displayName: payload.displayName,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      });
      return;
    }
    res.status(401).json({ success: false, error: 'Phiên đăng nhập không hợp lệ' });
  }
}

export function requireRoles(...roles: AppRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Chưa đăng nhập' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Không có quyền truy cập' });
      return;
    }
    next();
  };
}

export function requireFeature(featureKey: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Chưa đăng nhập' });
      return;
    }
    const enabled = await permissionService.isFeatureEnabled(req.user.role, featureKey);
    if (!enabled) {
      res.status(403).json({ success: false, error: 'Chức năng này đã bị tắt cho vai trò của bạn' });
      return;
    }
    next();
  };
}
