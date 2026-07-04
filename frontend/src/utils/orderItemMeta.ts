const ORDER_ITEM_META_PREFIX = '__item_meta__:';

export interface DecodedOrderItemMeta {
  selection?: string;
  note?: string;
}

export function decodeOrderItemMeta(raw?: string | null): DecodedOrderItemMeta {
  if (!raw) return {};

  if (!raw.startsWith(ORDER_ITEM_META_PREFIX)) {
    return { note: raw };
  }

  try {
    const parsed = JSON.parse(raw.slice(ORDER_ITEM_META_PREFIX.length)) as {
      selection?: string;
      note?: string;
    };

    return {
      selection: parsed.selection?.trim() || undefined,
      note: parsed.note?.trim() || undefined,
    };
  } catch {
    return { note: raw };
  }
}

export function getOrderItemDisplayName(name: string, selection?: string) {
  return selection ? `${name} (${selection})` : name;
}
