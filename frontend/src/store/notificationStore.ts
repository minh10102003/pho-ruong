import { create } from 'zustand';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: ToastType;
}

interface NotificationState {
  toast: ToastMessage | null;
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  hideToast: () => void;
}

let hideTimer: ReturnType<typeof setTimeout> | null = null;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  toast: null,

  showToast: (toast) => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }

    const item: ToastMessage = {
      ...toast,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };
    set({ toast: item });

    hideTimer = setTimeout(() => {
      if (get().toast?.id === item.id) {
        set({ toast: null });
      }
      hideTimer = null;
    }, 5000);
  },

  hideToast: () => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    set({ toast: null });
  },
}));
