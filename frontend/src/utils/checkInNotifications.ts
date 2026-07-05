import { Platform } from 'react-native';
import { CheckInSocketPayload } from '../types';
import { AuthUser } from '../types/auth';
import { useNotificationStore, ToastType } from '../store/notificationStore';

function getToastMeta(action: CheckInSocketPayload['action']): { title: string; type: ToastType } {
  switch (action) {
    case 'requested':
      return { title: 'Yêu cầu check-in mới', type: 'info' };
    case 'approved':
      return { title: 'Check-in đã duyệt', type: 'success' };
    case 'rejected':
      return { title: 'Check-in bị từ chối', type: 'warning' };
    case 'cancelled':
      return { title: 'Yêu cầu đã hủy', type: 'info' };
    default:
      return { title: 'Chấm công', type: 'info' };
  }
}

function tryBrowserNotification(title: string, body: string) {
  if (Platform.OS !== 'web' || typeof document === 'undefined' || !document.hidden) {
    return;
  }
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return;
  }
  try {
    new Notification(title, { body });
  } catch {
    // ignore
  }
}

export function notifyCheckInEvent(
  payload: CheckInSocketPayload,
  user: Pick<AuthUser, 'role' | 'employeeId'>
) {
  const isManager = user.role === 'MANAGER' || user.role === 'ADMIN';
  const isStaff = user.role === 'STAFF';
  const isOwnStaffEvent = isStaff && payload.employeeId === user.employeeId;

  const shouldNotify =
    (isManager && (payload.action === 'requested' || payload.action === 'cancelled')) ||
    (isOwnStaffEvent && (payload.action === 'approved' || payload.action === 'rejected'));

  if (!shouldNotify || !payload.message) return;

  const { title, type } = getToastMeta(payload.action);
  useNotificationStore.getState().showToast({
    title,
    message: payload.message,
    type,
  });
  tryBrowserNotification(title, payload.message);
}

export async function requestBrowserNotificationPermission() {
  if (Platform.OS !== 'web' || typeof Notification === 'undefined') return;
  if (Notification.permission === 'default') {
    try {
      await Notification.requestPermission();
    } catch {
      // ignore
    }
  }
}
