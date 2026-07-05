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
      return { title: 'Yêu cầu check-in đã hủy', type: 'info' };
    case 'checkout_requested':
      return { title: 'Yêu cầu check-out mới', type: 'info' };
    case 'checkout_approved':
      return { title: 'Check-out đã duyệt', type: 'success' };
    case 'checkout_rejected':
      return { title: 'Check-out bị từ chối', type: 'warning' };
    case 'checkout_cancelled':
      return { title: 'Yêu cầu check-out đã hủy', type: 'info' };
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
    (isManager &&
      (payload.action === 'requested' ||
        payload.action === 'cancelled' ||
        payload.action === 'checkout_requested' ||
        payload.action === 'checkout_cancelled')) ||
    (isOwnStaffEvent &&
      (payload.action === 'approved' ||
        payload.action === 'rejected' ||
        payload.action === 'checkout_approved' ||
        payload.action === 'checkout_rejected'));

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
