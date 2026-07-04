import { CartDraftLine, CartItem, Order } from '../types';
import { getCartLineKey } from '../constants/menu';

export function isProcessingOrder(order: Order) {
  return order.status === 'PENDING' || order.status === 'PREPARING';
}

export function buildCartDraftLines(
  processingOrders: Order[],
  cart: CartItem[]
): CartDraftLine[] {
  const rows = new Map<string, CartDraftLine>();

  for (const order of processingOrders) {
    for (const item of order.items) {
      const lineKey = getCartLineKey(item.menuItem.id, item.note, item.selection);
      const existing = rows.get(lineKey);
      if (existing) {
        existing.existingQty += item.quantity;
      } else {
        rows.set(lineKey, {
          lineKey,
          menuItem: item.menuItem,
          selection: item.selection,
          note: item.note,
          existingQty: item.quantity,
          pendingQty: 0,
        });
      }
    }
  }

  for (const item of cart) {
    const existing = rows.get(item.lineKey);
    if (existing) {
      existing.pendingQty += item.quantity;
    } else {
      rows.set(item.lineKey, {
        lineKey: item.lineKey,
        menuItem: item.menuItem,
        selection: item.selection,
        note: item.note,
        existingQty: 0,
        pendingQty: item.quantity,
      });
    }
  }

  return Array.from(rows.values());
}
