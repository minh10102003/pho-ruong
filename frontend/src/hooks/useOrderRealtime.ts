import { useCallback, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { Platform } from 'react-native';
import { useOrderManageStore } from '../store/orderManageStore';
import { useAuthStore } from '../store/authStore';
import { subscribeOrderUpdates } from '../services/checkInSocket';
import { WS_URL } from '../constants';

/** Tải đơn đang xử lý khi màn hình focus + lắng nghe realtime */
export function useOrderRealtime() {
  const activeOrders = useOrderManageStore((s) => s.activeOrders);
  const fetchActiveOrders = useOrderManageStore((s) => s.fetchActiveOrders);
  const user = useAuthStore((s) => s.user);
  const role = user?.role === 'STAFF' ? 'STAFF' : 'MANAGER';

  useFocusEffect(
    useCallback(() => {
      fetchActiveOrders();
    }, [fetchActiveOrders])
  );

  useEffect(() => {
    if (!user) return;

    let ws: WebSocket | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;

    const refresh = () => {
      fetchActiveOrders();
    };

    const startPolling = () => {
      if (!interval) {
        interval = setInterval(refresh, 8000);
      }
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    if (Platform.OS === 'web') {
      const unsubscribe = subscribeOrderUpdates(refresh, role);
      return () => {
        unsubscribe();
      };
    }

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

    const unsubscribe = subscribeOrderUpdates(refresh, role);

    return () => {
      ws?.close();
      stopPolling();
      unsubscribe();
    };
  }, [fetchActiveOrders, role, user]);

  return {
    activeOrders,
    hasActiveOrders: activeOrders.length > 0,
  };
}
