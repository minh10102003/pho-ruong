import { useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert } from 'react-native';
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

/** Socket.IO realtime cho duyệt check-in */
export function useCheckInRealtime(payrollYear?: number, payrollMonth?: number) {
  const user = useAuthStore((s) => s.user);
  const refreshPending = useEmployeeStore((s) => s.fetchPendingCheckInRequests);
  const refreshMine = useEmployeeStore((s) => s.fetchMyPendingCheckInRequest);
  const userRef = useRef(user);
  userRef.current = user;

  const refreshAll = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser) return;

    if (currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN') {
      await refreshEmployeeData(undefined, payrollYear, payrollMonth, true);
      await refreshPending();
      return;
    }

    if (currentUser.role === 'STAFF' && currentUser.employeeId) {
      await refreshMine();
      await useEmployeeStore.getState().syncCurrentTimesheet(currentUser.employeeId);
      if (payrollYear && payrollMonth) {
        await useEmployeeStore.getState().fetchPayroll(payrollYear, payrollMonth, currentUser.employeeId, true);
      }
    }
  }, [payrollYear, payrollMonth, refreshPending, refreshMine]);

  const refreshAllRef = useRef(refreshAll);
  refreshAllRef.current = refreshAll;

  useFocusEffect(
    useCallback(() => {
      void refreshAllRef.current();
    }, [])
  );

  useEffect(() => {
    if (!user) return;

    const onUpdate = (payload: CheckInSocketPayload) => {
      void refreshAllRef.current();

      const currentUser = userRef.current;
      if (currentUser?.role === 'STAFF' && payload.employeeId === currentUser.employeeId) {
        if (payload.action === 'approved' || payload.action === 'rejected') {
          showCheckInAlert(payload);
        }
      }
      if (
        (currentUser?.role === 'MANAGER' || currentUser?.role === 'ADMIN') &&
        payload.action === 'requested'
      ) {
        showCheckInAlert(payload);
      }
    };

    return connectCheckInSocket({
      role: user.role,
      employeeId: user.employeeId ?? undefined,
      onUpdate,
    });
  }, [user?.role, user?.employeeId, user?.id]);

  return refreshAll;
}
