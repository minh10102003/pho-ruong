import { AppRole } from '../types/auth';

export interface RoleFeatureDefinition {
  key: string;
  label: string;
  description: string;
  locked?: boolean;
}

export const ROLE_FEATURE_DEFINITIONS: Record<AppRole, RoleFeatureDefinition[]> = {
  STAFF: [
    { key: 'pos', label: 'Menu / POS', description: 'Chọn bàn và gọi món' },
    { key: 'orders', label: 'Đơn hàng', description: 'Xem và xử lý đơn, thanh toán' },
    { key: 'inventory', label: 'Kho', description: 'Xem tồn kho và tạo phiếu nhập' },
    { key: 'profile', label: 'Cá nhân', description: 'Chấm công và bảng lương cá nhân' },
    { key: 'settings', label: 'Cài đặt', description: 'Thông tin tài khoản và đăng xuất' },
  ],
  MANAGER: [
    { key: 'pos', label: 'Menu / POS', description: 'Chọn bàn và gọi món' },
    { key: 'orders', label: 'Đơn hàng', description: 'Quản lý đơn và thanh toán' },
    { key: 'inventory', label: 'Kho', description: 'Quản lý kho và phiếu nhập' },
    { key: 'employees', label: 'Nhân viên', description: 'Chấm công, duyệt ca, bảng lương' },
    { key: 'reports', label: 'Báo cáo', description: 'Thống kê doanh thu, nhập hàng, thuế' },
    { key: 'settings', label: 'Cài đặt', description: 'Cài đặt món ăn và tài khoản' },
  ],
  ADMIN: [
    { key: 'menu', label: 'Món ăn', description: 'Quản lý thực đơn (thêm/sửa/xóa)' },
    { key: 'inventory', label: 'Kho', description: 'Hạng mục, nguyên liệu, lịch sử nhập' },
    { key: 'orders', label: 'Đơn hàng', description: 'Lịch sử đơn và xóa đơn' },
    { key: 'employees', label: 'Nhân viên', description: 'Chấm công, lương, duyệt ca' },
    { key: 'reports', label: 'Báo cáo', description: 'Toàn bộ thống kê' },
    { key: 'accounts', label: 'Tài khoản', description: 'Quản lý tài khoản đăng nhập' },
    { key: 'profile', label: 'Cá nhân', description: 'Thông tin và đổi mật khẩu' },
    {
      key: 'permissions',
      label: 'Phân quyền',
      description: 'Bật/tắt màn hình theo vai trò',
      locked: true,
    },
  ],
};

const HOME_PRIORITY: Record<AppRole, string[]> = {
  STAFF: ['pos', 'orders', 'inventory', 'profile'],
  MANAGER: ['pos', 'orders', 'inventory', 'employees', 'reports', 'settings'],
  ADMIN: ['menu', 'inventory', 'orders', 'employees', 'reports', 'accounts', 'profile', 'permissions'],
};

const FEATURE_HOME_PATH: Record<AppRole, Record<string, string>> = {
  STAFF: {
    pos: '/staff',
    orders: '/staff/orders',
    inventory: '/staff/inventory',
    profile: '/staff/employees',
  },
  MANAGER: {
    pos: '/manager',
    orders: '/manager/orders',
    inventory: '/manager/inventory',
    employees: '/manager/employees',
    reports: '/manager/reports',
    settings: '/manager/settings',
  },
  ADMIN: {
    menu: '/admin/menu',
    inventory: '/admin/inventory',
    orders: '/admin/orders',
    employees: '/admin/employees',
    reports: '/admin/reports',
    accounts: '/admin/accounts',
    profile: '/admin/profile',
    permissions: '/admin/permissions',
  },
};

const ROUTE_FEATURE_MAP: Record<AppRole, Record<string, string>> = {
  STAFF: {
    '(pos)': 'pos',
    orders: 'orders',
    inventory: 'inventory',
    employees: 'profile',
    settings: 'settings',
  },
  MANAGER: {
    '(pos)': 'pos',
    orders: 'orders',
    inventory: 'inventory',
    employees: 'employees',
    reports: 'reports',
    settings: 'settings',
  },
  ADMIN: {
    menu: 'menu',
    inventory: 'inventory',
    orders: 'orders',
    employees: 'employees',
    reports: 'reports',
    accounts: 'accounts',
    profile: 'profile',
    permissions: 'permissions',
  },
};

export function hasRoleFeature(features: string[] | undefined, key: string): boolean {
  if (!features || features.length === 0) return true;
  return features.includes(key);
}

export function getRoleHomePath(role: AppRole, features?: string[]): string {
  const priority = HOME_PRIORITY[role];
  const paths = FEATURE_HOME_PATH[role];
  const enabled = features && features.length > 0 ? features : priority;
  const first = priority.find((key) => enabled.includes(key)) ?? priority[0];
  return paths[first] ?? paths[HOME_PRIORITY[role][0]];
}

export function getRouteFeatureKey(role: AppRole, screen: string | undefined): string | null {
  if (!screen) return null;
  return ROUTE_FEATURE_MAP[role][screen] ?? null;
}

export function isRouteAllowed(
  role: AppRole,
  area: string,
  screen: string | undefined,
  features?: string[]
): boolean {
  const expectedArea = role === 'ADMIN' ? 'admin' : role === 'MANAGER' ? 'manager' : 'staff';
  if (area !== expectedArea) return true;
  if (!screen || screen === 'index') return true;
  const featureKey = getRouteFeatureKey(role, screen);
  if (!featureKey) return true;
  return hasRoleFeature(features, featureKey);
}

export interface RoleFeatureGroup {
  role: AppRole;
  features: {
    key: string;
    label: string;
    description: string;
    locked: boolean;
    enabled: boolean;
  }[];
}
