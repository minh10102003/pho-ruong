import { useCallback, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert } from 'react-native';
import { WS_URL } from '../constants';
import { connectCheckInSocket } from '../services/checkInSocket';
import { CheckInSocketPayload } from '../types';
import { refreshEmployeeData, useEmployeeStore } from '../store/employeeStore';
import { useAuthStore } from '../store/authStore';

function showCheckInAlert(payload: CheckInSocketPayload) {
  if (!payload.message) return;
  const title =
    payload.action === 'approved'
      ? 'Check-in đã duyệt'
      : payload.action === 'rejected'
        ? 'Check-in bị từ chối'
        : payload.action === 'requested'
          ? 'Yêu cầu check-in mới'
          : 'Cập nhật check-in';
  Alert.alert(title, payload.message);
}

/** Socket.IO + WebSocket fallback cho duyệt check-in realtime */
export function useCheckInRealtime(
  selectedEmployeeId?: string,
  payrollYear?: number,
  payrollMonth?: number
) {
  const user = useAuthStore((s) => s.user);
  const refreshPending = useEmployeeStore((s) => s.fetchPendingCheckInRequests);
  const refreshMine = useEmployeeStore((s) => s.fetchMyPendingCheckInRequest);

  const refreshAll = useCallback(async () => {
    if (user?.role === 'MANAGER' || user?.role === 'ADMIN') {
      await refreshEmployeeData(selectedEmployeeId, payrollYear, payrollMonth);
      await refreshPending();
      return;
    }
    if (user?.role === 'STAFF' && user.employeeId) {
      await refreshMine();
      await useEmployeeStore.getState().syncCurrentTimesheet(user.employeeId);
      if (payrollYear && payrollMonth) {
        await useEmployeeStore.getState().fetchPayroll(payrollYear, payrollMonth, user.employeeId);
      }
    }
  }, [selectedEmployeeId, payrollYear, payrollMonth, refreshPending, refreshMine, user]);

  const handlePayload = useCallback(
    (payload: CheckInSocketPayload) => {
      void refreshAll();
      if (user?.role === 'STAFF' && payload.employeeId === user.employeeId) {
        if (payload.action === 'approved' || payload.action === 'rejected') {
          showCheckInAlert(payload);
        }
      }
      if ((user?.role === 'MANAGER' || user?.role === 'ADMIN') && payload.action === 'requested') {
        showCheckInAlert(payload);
      }
    },
    [refreshAll, user]
  );

  useFocusEffect(
    useCallback(() => {
      void refreshAll();
    }, [refreshAll])
  );

  useEffect(() => {
    if (!user) return;

    const disconnectSocket = connectCheckInSocket({
      role: user.role,
      employeeId: user.employeeId ?? undefined,
      onUpdate: handlePayload,
    });

    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(WS_URL);
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'CHECKIN_UPDATE' || msg.type === 'EMPLOYEE_UPDATE') {
          void refreshAll();
        }
      };
    } catch {
      // ignore
    }

    return () => {
      disconnectSocket();
      ws?.close();
    };
  }, [user, handlePayload, refreshAll]);
}
