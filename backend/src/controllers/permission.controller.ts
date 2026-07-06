import { Request, Response, NextFunction } from 'express';
import { AppRole } from '@prisma/client';
import { permissionService } from '../services/permission.service';

export class PermissionController {
  getRoleFeatures = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await permissionService.getRoleFeaturesForAdmin();
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  updateRoleFeatures = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await permissionService.updateRoleFeatures(req.body.updates ?? []);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  getMyFeatures = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const features = await permissionService.getEnabledFeatures(req.user!.role as AppRole);
      res.json({ success: true, data: features });
    } catch (e) {
      next(e);
    }
  };
}

export const permissionController = new PermissionController();
