import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useEmployeeStore } from '../store/employeeStore';

/** Tải lại dữ liệu cá nhân nhân viên khi màn hình được focus */
export function useStaffProfileRefresh(
  employeeId: string,
  payrollYear: number,
  payrollMonth: number
) {
  const syncCurrentTimesheet = useEmployeeStore((s) => s.syncCurrentTimesheet);
  const fetchMyPendingCheckInRequest = useEmployeeStore((s) => s.fetchMyPendingCheckInRequest);
  const fetchPayroll = useEmployeeStore((s) => s.fetchPayroll);

  useFocusEffect(
    useCallback(() => {
      if (!employeeId) return;
      void syncCurrentTimesheet(employeeId);
      void fetchMyPendingCheckInRequest();
      void fetchPayroll(payrollYear, payrollMonth, employeeId);
    }, [
      employeeId,
      payrollYear,
      payrollMonth,
      syncCurrentTimesheet,
      fetchMyPendingCheckInRequest,
      fetchPayroll,
    ])
  );
}
