// Cấu hình API và theme ứng dụng
export { API_BASE_URL, API_ORIGIN, WS_URL } from './apiConfig';

// Bảng màu: xanh lá · vàng nhạt · cam (summer / fresh)
export const COLORS = {
  primary: '#468432',
  primaryDark: '#356628',
  secondary: '#9AD872',
  accent: '#FFA02E',
  highlight: '#FFEF91',
  background: '#FFFDF5',
  surface: '#FFFFFF',
  selected: '#E8F8DC',
  occupied: '#FFF4D6',
  text: '#2D4A24',
  textSecondary: '#5A6F52',
  placeholder: '#000000',
  border: '#C5E0B4',
  onPrimary: '#FFFFFF',
  onAccent: '#FFFFFF',
  success: '#468432',
  warning: '#FFA02E',
  error: '#D84315',
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ',
  PREPARING: 'Đang làm',
  SERVED: 'Đã ra món',
  PAID: 'Đã thanh toán',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Tiền mặt',
  TRANSFER: 'Chuyển khoản',
};

export const CATEGORY_LABELS: Record<string, string> = {
  pho: 'Phở',
  side: 'Món thêm',
  drink: 'Đồ uống',
};

export const CATEGORY_ORDER = ['pho', 'side', 'drink'] as const;

export const MENU_CATEGORY_OPTIONS = [
  { value: 'pho_size', label: 'Phở (loại tô)' },
  { value: 'side', label: 'Món thêm' },
  { value: 'drink', label: 'Đồ uống' },
] as const;

export const MENU_CATEGORY_LABELS: Record<string, string> = {
  pho_size: 'Phở (loại tô)',
  side: 'Món thêm',
  drink: 'Đồ uống',
};

export const MENU_ADMIN_CATEGORY_ORDER = ['pho_size', 'side', 'drink'] as const;
