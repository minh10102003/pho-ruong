import { useEffect, useRef } from 'react';
import { connectCheckInSocket } from '../services/checkInSocket';
import { useAuthStore } from '../store/authStore';
import { refreshCheckInRealtimeData } from '../store/employeeStore';
import { notifyCheckInEvent, requestBrowserNotificationPermission } from '../utils/checkInNotifications';
import AppToastHost from '../components/AppToastHost';

/** Lắng nghe check-in realtime trên toàn app (mọi tab) + hiển thị toast */
export function CheckInNotificationLayer() {
  const user = useAuthStore((s) => s.user);
  const userRef = useRef(user);
  userRef.current = user;

  const role = user?.role;
  const employeeId = user?.employeeId ?? undefined;
  const userId = user?.id;

  useEffect(() => {
    void requestBrowserNotificationPermission();
    if (!role || !userId) return;
    void refreshCheckInRealtimeData({ role, employeeId });
  }, [role, employeeId, userId]);

  useEffect(() => {
    if (!role || !userId) return;

    const onUpdate = (payload: Parameters<typeof notifyCheckInEvent>[0]) => {
      const current = userRef.current;
      if (!current) return;

      notifyCheckInEvent(payload, current);
      void refreshCheckInRealtimeData({
        role: current.role,
        employeeId: current.employeeId ?? undefined,
        eventEmployeeId: payload.employeeId,
      });
    };

    return connectCheckInSocket({
      role,
      employeeId,
      onUpdate,
    });
  }, [role, employeeId, userId]);

  return <AppToastHost />;
}
