import { create } from 'zustand';
import { CartItem, MenuItem, Order } from '../types';
import { api } from '../services/api';
import { COUNTER_TABLE_LABEL, COUNTER_TABLE_NUMBER } from '../constants/tables';
import { getCartLineKey } from '../constants/menu';

function normalizeNote(note?: string) {
  const trimmed = note?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeSelection(selection?: string) {
  const trimmed = selection?.trim();
  return trimmed ? trimmed : undefined;
}

// Store Zustand quản lý state POS / Giỏ hàng
interface PosState {
  menuItems: MenuItem[];
  cart: CartItem[];
  selectedTable: number | null;
  isCartOpen: boolean;
  loading: boolean;
  error: string | null;

  fetchMenu: () => Promise<void>;
  setSelectedTable: (table: number) => void;
  clearTableSession: () => void;
  addToCart: (
    item: MenuItem,
    options?: { note?: string; selection?: string; quantity?: number }
  ) => void;
  removeFromCart: (lineKey: string) => void;
  removeMenuItemFromCart: (menuItemId: string) => void;
  updateQuantity: (lineKey: string, quantity: number) => void;
  updateCartItemNote: (lineKey: string, note?: string) => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
  submitOrder: () => Promise<Order | null>;
}

export const usePosStore = create<PosState>((set, get) => ({
  menuItems: [],
  cart: [],
  selectedTable: null,
  isCartOpen: false,
  loading: false,
  error: null,

  setSelectedTable: (table) => {
    const { selectedTable, cart } = get();
    if (selectedTable !== table && cart.length > 0) {
      set({ cart: [], isCartOpen: false });
    }
    set({ selectedTable: table });
  },

  clearTableSession: () => set({ selectedTable: null, cart: [], isCartOpen: false }),

  fetchMenu: async () => {
    set({ loading: true, error: null });
    try {
      const items = await api.getMenu();
      const menuItems = items.filter((item) => item.isActive);
      set({ menuItems, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  addToCart: (item, options) => {
    const quantity = options?.quantity ?? 1;
    if (quantity <= 0) return;

    const normalizedNote = normalizeNote(options?.note);
    const normalizedSelection = normalizeSelection(options?.selection);
    const lineKey = getCartLineKey(item.id, normalizedNote, normalizedSelection);
    const { cart } = get();
    const existing = cart.find((c) => c.lineKey === lineKey);
    if (existing) {
      set({
        cart: cart.map((c) =>
          c.lineKey === lineKey ? { ...c, quantity: c.quantity + quantity } : c
        ),
      });
    } else {
      set({
        cart: [
          ...cart,
          {
            menuItem: item,
            quantity,
            selection: normalizedSelection,
            note: normalizedNote,
            lineKey,
          },
        ],
      });
    }
  },

  removeFromCart: (lineKey) => {
    set({ cart: get().cart.filter((c) => c.lineKey !== lineKey) });
  },

  removeMenuItemFromCart: (menuItemId) => {
    set({ cart: get().cart.filter((c) => c.menuItem.id !== menuItemId) });
  },

  updateQuantity: (lineKey, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(lineKey);
      return;
    }
    set({
      cart: get().cart.map((c) =>
        c.lineKey === lineKey ? { ...c, quantity } : c
      ),
    });
  },

  updateCartItemNote: (lineKey, note) => {
    const normalizedNote = normalizeNote(note);
    const cart = get().cart;
    const source = cart.find((item) => item.lineKey === lineKey);
    if (!source) return;

    const nextLineKey = getCartLineKey(
      source.menuItem.id,
      normalizedNote,
      source.selection
    );
    if (nextLineKey === lineKey) {
      set({
        cart: cart.map((item) =>
          item.lineKey === lineKey ? { ...item, note: normalizedNote } : item
        ),
      });
      return;
    }

    const mergeTarget = cart.find((item) => item.lineKey === nextLineKey);
    if (mergeTarget) {
      set({
        cart: cart
          .filter((item) => item.lineKey !== lineKey)
          .map((item) =>
            item.lineKey === nextLineKey
              ? { ...item, quantity: item.quantity + source.quantity }
              : item
          ),
      });
      return;
    }

    set({
      cart: cart.map((item) =>
        item.lineKey === lineKey
          ? { ...item, note: normalizedNote, lineKey: nextLineKey }
          : item
      ),
    });
  },

  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

  clearCart: () => set({ cart: [], isCartOpen: false }),

  getSubtotal: () =>
    get().cart.reduce(
      (sum, c) => sum + Number(c.menuItem.price) * c.quantity,
      0
    ),

  getTotal: () => get().getSubtotal(),

  submitOrder: async () => {
    const { cart, selectedTable } = get();
    if (!cart.length || selectedTable === null) return null;

    set({ loading: true, error: null });
    try {
      const order = await api.createOrder({
        items: cart.map((c) => ({
          menuItemId: c.menuItem.id,
          quantity: c.quantity,
          selection: c.selection,
          note: c.note,
        })),
        tableNumber:
          selectedTable === COUNTER_TABLE_NUMBER
            ? COUNTER_TABLE_LABEL
            : String(selectedTable),
      });
      get().clearCart();
      set({ loading: false });
      return order;
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      return null;
    }
  },
}));
