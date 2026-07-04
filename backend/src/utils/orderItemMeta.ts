const ORDER_ITEM_META_PREFIX = '__item_meta__:';

export interface OrderItemMetaInput {
  selection?: string;
  note?: string;
}

function normalize(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function encodeOrderItemMeta({ selection, note }: OrderItemMetaInput): string | undefined {
  const normalizedSelection = normalize(selection);
  const normalizedNote = normalize(note);

  if (!normalizedSelection && !normalizedNote) {
    return undefined;
  }

  return `${ORDER_ITEM_META_PREFIX}${JSON.stringify({
    ...(normalizedSelection ? { selection: normalizedSelection } : {}),
    ...(normalizedNote ? { note: normalizedNote } : {}),
  })}`;
}
