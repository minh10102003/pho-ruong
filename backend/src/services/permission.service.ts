import { AppRole } from '@prisma/client';
import {
  getAllFeatureKeys,
  isLockedFeature,
  isValidFeatureKey,
  ROLE_FEATURE_DEFINITIONS,
} from '../constants/roleFeatures';
import { permissionRepository } from '../repositories/permission.repository';

type FeatureMap = Record<AppRole, Record<string, boolean>>;

class PermissionCache {
  private map: FeatureMap = { ADMIN: {}, MANAGER: {}, STAFF: {} };
  private loaded = false;

  async reload() {
    const rows = await permissionRepository.findAll();
    const next: FeatureMap = { ADMIN: {}, MANAGER: {}, STAFF: {} };
    for (const row of rows) {
      next[row.role][row.featureKey] = row.enabled;
    }
    for (const { role, featureKey } of getAllFeatureKeys()) {
      if (next[role][featureKey] === undefined) {
        next[role][featureKey] = true;
      }
    }
    this.map = next;
    this.loaded = true;
  }

  async ensureLoaded() {
    if (!this.loaded) await this.reload();
  }

  isEnabled(role: AppRole, featureKey: string): boolean {
    return this.map[role]?.[featureKey] !== false;
  }

  getEnabledKeys(role: AppRole): string[] {
    return Object.entries(this.map[role] ?? {})
      .filter(([, enabled]) => enabled)
      .map(([key]) => key);
  }

  snapshot(): FeatureMap {
    return JSON.parse(JSON.stringify(this.map)) as FeatureMap;
  }
}

const cache = new PermissionCache();

export class PermissionService {
  async initDefaults() {
    await permissionRepository.ensureDefaults(getAllFeatureKeys());
    await cache.reload();
  }

  async getRoleFeaturesForAdmin() {
    await cache.ensureLoaded();
    const snapshot = cache.snapshot();
    return (Object.keys(ROLE_FEATURE_DEFINITIONS) as AppRole[]).map((role) => ({
      role,
      features: ROLE_FEATURE_DEFINITIONS[role].map((def) => ({
        key: def.key,
        label: def.label,
        description: def.description,
        locked: def.locked ?? false,
        enabled: snapshot[role][def.key] !== false,
      })),
    }));
  }

  async getEnabledFeatures(role: AppRole): Promise<string[]> {
    await cache.ensureLoaded();
    return cache.getEnabledKeys(role);
  }

  async isFeatureEnabled(role: AppRole, featureKey: string): Promise<boolean> {
    await cache.ensureLoaded();
    if (!isValidFeatureKey(role, featureKey)) return false;
    return cache.isEnabled(role, featureKey);
  }

  async updateRoleFeatures(
    updates: { role: AppRole; featureKey: string; enabled: boolean }[]
  ) {
    for (const item of updates) {
      if (!isValidFeatureKey(item.role, item.featureKey)) {
        throw new Error(`Chức năng không hợp lệ: ${item.role}/${item.featureKey}`);
      }
      if (isLockedFeature(item.role, item.featureKey)) {
        continue;
      }
      await permissionRepository.upsertFeature(item.role, item.featureKey, item.enabled);
    }
    await cache.reload();
    return this.getRoleFeaturesForAdmin();
  }
}

export const permissionService = new PermissionService();
