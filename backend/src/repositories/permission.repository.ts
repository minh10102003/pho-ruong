import { AppRole } from '@prisma/client';
import prisma from '../config/database';

export class PermissionRepository {
  async findAll() {
    return prisma.roleFeature.findMany({ orderBy: [{ role: 'asc' }, { featureKey: 'asc' }] });
  }

  async findEnabledByRole(role: AppRole) {
    return prisma.roleFeature.findMany({
      where: { role, enabled: true },
      select: { featureKey: true },
    });
  }

  async upsertFeature(role: AppRole, featureKey: string, enabled: boolean) {
    return prisma.roleFeature.upsert({
      where: { role_featureKey: { role, featureKey } },
      create: { role, featureKey, enabled },
      update: { enabled },
    });
  }

  async ensureDefaults(items: { role: AppRole; featureKey: string }[]) {
    for (const item of items) {
      await prisma.roleFeature.upsert({
        where: { role_featureKey: { role: item.role, featureKey: item.featureKey } },
        create: { role: item.role, featureKey: item.featureKey, enabled: true },
        update: {},
      });
    }
  }
}

export const permissionRepository = new PermissionRepository();
