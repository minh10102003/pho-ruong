import { useCallback, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { useOrderManageStore } from '../store/orderManageStore';
import { WS_URL } from '../constants';

/** Tải đơn đang xử lý khi màn hình focus + lắng nghe WebSocket realtime */
export function useOrderRealtime() {
  const activeOrders = useOrderManageStore((s) => s.activeOrders);
  const fetchActiveOrders = useOrderManageStore((s) => s.fetchActiveOrders);

  useFocusEffect(
    useCallback(() => {
      fetchActiveOrders();
    }, [fetchActiveOrders])
  );

  useEffect(() => {
    let ws: WebSocket | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;

    const refresh = () => {
      fetchActiveOrders();
    };

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
        if (msg.type === 'ORDER_UPDATE') {
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
  }, [fetchActiveOrders]);

  return {
    activeOrders,
    hasActiveOrders: activeOrders.length > 0,
  };
}
