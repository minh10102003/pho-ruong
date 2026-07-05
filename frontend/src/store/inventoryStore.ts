import { create } from 'zustand';
import { Ingredient, InventoryReceipt } from '../types';
import { api } from '../services/api';

// Store Zustand quản lý state Kho
interface InventoryState {
  ingredients: Ingredient[];
  receipts: InventoryReceipt[];
  loading: boolean;
  error: string | null;

  fetchIngredients: () => Promise<void>;
  fetchReceipts: () => Promise<void>;
  createIngredient: (data: {
    category: string;
    name: string;
    unit: string;
    minStock?: number;
  }) => Promise<void>;
  updateIngredient: (
    id: string,
    data: { category?: string; name?: string; unit?: string; minStock?: number }
  ) => Promise<void>;
  deleteIngredient: (id: string) => Promise<void>;
  createReceipt: (data: {
    ingredientId: string;
    quantity: number;
    unitPrice: number;
    supplier: string;
    note?: string;
    receivedAt?: string;
  }) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  ingredients: [],
  receipts: [],
  loading: false,
  error: null,

  fetchIngredients: async () => {
    set({ loading: true });
    try {
      const ingredients = await api.getIngredients();
      set({ ingredients, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  fetchReceipts: async () => {
    try {
      const receipts = await api.getReceipts();
      set({ receipts });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  createIngredient: async (data) => {
    set({ loading: true });
    try {
      await api.createIngredient(data);
      await get().fetchIngredients();
      set({ loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  updateIngredient: async (id, data) => {
    set({ loading: true });
    try {
      await api.updateIngredient(id, data);
      await get().fetchIngredients();
      set({ loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  deleteIngredient: async (id) => {
    set({ loading: true });
    try {
      await api.deleteIngredient(id);
      await get().fetchIngredients();
      await get().fetchReceipts();
      set({ loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  createReceipt: async (data) => {
    set({ loading: true });
    try {
      await api.createReceipt(data);
      await get().fetchIngredients();
      await get().fetchReceipts();
      set({ loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },
}));
