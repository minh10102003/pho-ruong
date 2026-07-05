import { create } from 'zustand';
import { MenuItem } from '../types';
import { api } from '../services/api';
import { usePosStore } from './posStore';

interface MenuSettingsState {
  items: MenuItem[];
  loading: boolean;
  error: string | null;

  fetchItems: () => Promise<void>;
  createItem: (data: { name: string; price: number; category: string }) => Promise<void>;
  updateItem: (
    id: string,
    data: { name?: string; price?: number; category?: string; isActive?: boolean }
  ) => Promise<void>;
  toggleActive: (id: string, isActive: boolean) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export const useMenuSettingsStore = create<MenuSettingsState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchItems: async () => {
    set({ loading: true, error: null });
    try {
      const items = await api.getAllMenuItems();
      set({ items, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  createItem: async (data) => {
    set({ loading: true, error: null });
    try {
      await api.createMenuItem(data);
      await get().fetchItems();
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  updateItem: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await api.updateMenuItem(id, data);
      await get().fetchItems();
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  toggleActive: async (id, isActive) => {
    const prev = get().items;
    set({
      items: prev.map((item) => (item.id === id ? { ...item, isActive } : item)),
      error: null,
    });
    try {
      await api.updateMenuItem(id, { isActive });
      void usePosStore.getState().fetchMenu();
    } catch (e) {
      set({ items: prev, error: (e as Error).message });
      throw e;
    }
  },

  deleteItem: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.deleteMenuItem(id);
      await get().fetchItems();
      void usePosStore.getState().fetchMenu();
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },
}));
