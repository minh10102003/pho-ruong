import { useEffect } from 'react';
import { connectCheckInSocket } from '../services/checkInSocket';
import { useAuthStore } from '../store/authStore';
import { useEmployeeStore } from '../store/employeeStore';
import { notifyCheckInEvent, requestBrowserNotificationPermission } from '../utils/checkInNotifications';
import AppToastHost from '../components/AppToastHost';

/** Lắng nghe check-in realtime trên toàn app (mọi tab) + hiển thị toast */
export function CheckInNotificationLayer() {
  const user = useAuthStore((s) => s.user);
  const fetchPending = useEmployeeStore((s) => s.fetchPendingCheckInRequests);
  const fetchMine = useEmployeeStore((s) => s.fetchMyPendingCheckInRequest);
  const fetchOpenTimesheets = useEmployeeStore((s) => s.fetchOpenTimesheets);
  const syncCurrentTimesheet = useEmployeeStore((s) => s.syncCurrentTimesheet);

  useEffect(() => {
    void requestBrowserNotificationPermission();
    if (!user) return;
    if (user.role === 'MANAGER' || user.role === 'ADMIN') {
      void fetchPending();
    }
    if (user.role === 'STAFF' && user.employeeId) {
      void fetchMine();
      void syncCurrentTimesheet(user.employeeId);
    }
  }, [user, fetchPending, fetchMine, syncCurrentTimesheet]);

  useEffect(() => {
    if (!user) return;

    const refreshData = async (employeeId: string) => {
      if (user.role === 'MANAGER' || user.role === 'ADMIN') {
        await fetchPending();
        await fetchOpenTimesheets();
        return;
      }
      if (user.role === 'STAFF' && user.employeeId === employeeId) {
        await fetchMine();
        await syncCurrentTimesheet(user.employeeId);
      }
    };

    return connectCheckInSocket({
      role: user.role,
      employeeId: user.employeeId ?? undefined,
      onUpdate: (payload) => {
        notifyCheckInEvent(payload, user);
        void refreshData(payload.employeeId);
      },
    });
  }, [
    user,
    fetchPending,
    fetchMine,
    fetchOpenTimesheets,
    syncCurrentTimesheet,
  ]);

  return <AppToastHost />;
}
