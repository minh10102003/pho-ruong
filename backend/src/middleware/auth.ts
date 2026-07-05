import { Request, Response, NextFunction } from 'express';
import { AppRole } from '@prisma/client';
import { verifyAuthToken } from '../utils/jwt';

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
  } catch {
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
