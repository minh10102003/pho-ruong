import { create } from 'zustand';
import { Order, PaymentMethod } from '../types';
import { api } from '../services/api';

// Store quản lý đơn hàng (đang xử lý + đã ra món + lịch sử)
interface OrderManageState {
  /** Tất cả đơn chưa thanh toán — dùng cho POS (bàn, menu) */
  activeOrders: Order[];
  processingOrders: Order[];
  servedOrders: Order[];
  paidOrders: Order[];
  loading: boolean;
  error: string | null;

  fetchActiveOrders: () => Promise<void>;
  fetchPaidOrders: () => Promise<void>;
  fetchAll: () => Promise<void>;
  updateOrderStatus: (
    orderId: string,
    status: string,
    paymentMethod?: PaymentMethod
  ) => Promise<Order | null>;
  removeOrderItem: (orderId: string, itemId: string) => Promise<Order | null>;
  deleteOrder: (orderId: string) => Promise<void>;
}

export const useOrderManageStore = create<OrderManageState>((set, get) => ({
  activeOrders: [],
  processingOrders: [],
  servedOrders: [],
  paidOrders: [],
  loading: false,
  error: null,

  fetchActiveOrders: async () => {
    try {
      const orders = await api.getOrders();
      const activeOrders = orders.filter((o) => o.status !== 'PAID');
      set({
        activeOrders,
        processingOrders: activeOrders.filter(
          (o) => o.status === 'PENDING' || o.status === 'PREPARING'
        ),
        servedOrders: activeOrders.filter((o) => o.status === 'SERVED'),
      });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  fetchPaidOrders: async () => {
    try {
      const orders = await api.getOrders('PAID');
      set({ paidOrders: orders });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      await Promise.all([get().fetchActiveOrders(), get().fetchPaidOrders()]);
      set({ loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  updateOrderStatus: async (orderId, status, paymentMethod) => {
    set({ loading: true, error: null });
    try {
      const order = await api.updateOrderStatus(orderId, status, paymentMethod);
      await get().fetchAll();
      set({ loading: false });
      return order;
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      return null;
    }
  },

  removeOrderItem: async (orderId, itemId) => {
    set({ loading: true, error: null });
    try {
      const order = await api.removeOrderItem(orderId, itemId);
      await get().fetchAll();
      set({ loading: false });
      return order;
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      return null;
    }
  },

  deleteOrder: async (orderId) => {
    set({ loading: true, error: null });
    try {
      await api.deleteOrder(orderId);
      await get().fetchAll();
      set({ loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },
}));
