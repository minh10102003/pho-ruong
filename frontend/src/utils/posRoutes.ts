import { AppRole } from '../types/auth';

/** Màn chọn bàn trong tab Menu */
export function getPosTablePath(role: AppRole | null | undefined): string {
  if (role === 'STAFF') return '/staff';
  return '/manager';
}

/** Màn chọn món của bàn */
export function getPosMenuPath(role: AppRole | null | undefined): string {
  if (role === 'STAFF') return '/staff/menu';
  return '/manager/menu';
}
