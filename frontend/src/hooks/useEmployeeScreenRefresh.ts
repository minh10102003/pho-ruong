import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { refreshEmployeeData, useEmployeeStore } from '../store/employeeStore';

/** Tải lại dữ liệu nhân viên khi màn hình được focus */
export function useEmployeeScreenRefresh(payrollYear?: number, payrollMonth?: number) {
  const fetchPending = useEmployeeStore((s) => s.fetchPendingCheckInRequests);
  const fetchPendingCheckOut = useEmployeeStore((s) => s.fetchPendingCheckOutRequests);

  useFocusEffect(
    useCallback(() => {
      void refreshEmployeeData(undefined, payrollYear, payrollMonth, true);
      void fetchPending();
      void fetchPendingCheckOut();
    }, [payrollYear, payrollMonth, fetchPending, fetchPendingCheckOut])
  );
}
