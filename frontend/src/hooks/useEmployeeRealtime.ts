import { useCallback, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { WS_URL } from '../constants';
import { refreshEmployeeData } from '../store/employeeStore';

/** Tải dữ liệu nhân viên khi màn hình focus + lắng nghe WebSocket realtime */
export function useEmployeeRealtime(
  selectedEmployeeId?: string,
  payrollYear?: number,
  payrollMonth?: number
) {
  const refresh = useCallback(() => {
    return refreshEmployeeData(selectedEmployeeId, payrollYear, payrollMonth);
  }, [selectedEmployeeId, payrollYear, payrollMonth]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  useEffect(() => {
    let ws: WebSocket | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (!interval) {
        interval = setInterval(refresh, 10000);
      }
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    try {
      ws = new WebSocket(WS_URL);
      ws.onopen = () => stopPolling();
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'EMPLOYEE_UPDATE') {
          refresh();
        }
      };
      ws.onerror = startPolling;
      ws.onclose = startPolling;
    } catch {
      startPolling();
    }

    return () => {
      ws?.close();
      stopPolling();
    };
  }, [refresh]);
}
