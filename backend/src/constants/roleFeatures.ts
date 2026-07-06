import { AppRole } from '@prisma/client';

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

export function getAllFeatureKeys(): { role: AppRole; featureKey: string }[] {
  return (Object.keys(ROLE_FEATURE_DEFINITIONS) as AppRole[]).flatMap((role) =>
    ROLE_FEATURE_DEFINITIONS[role].map((f) => ({ role, featureKey: f.key }))
  );
}

export function isValidFeatureKey(role: AppRole, featureKey: string): boolean {
  return ROLE_FEATURE_DEFINITIONS[role].some((f) => f.key === featureKey);
}

export function isLockedFeature(role: AppRole, featureKey: string): boolean {
  return ROLE_FEATURE_DEFINITIONS[role].find((f) => f.key === featureKey)?.locked === true;
}
