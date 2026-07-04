export const PHO_MEATS = ['tái', 'nạm', 'gầu', 'gân', 'bò viên'] as const;
export type PhoMeat = (typeof PHO_MEATS)[number];

export const SIDE_CATEGORY = 'side';

/** Thứ tự hiển thị thịt phở (ưu tiên món cổ điển trước) */
export const PHO_MEAT_ORDER = [
  ...PHO_MEATS,
  'nước tiết',
  'trứng chần',
  'quẩy',
] as const;

export function sortPhoMeatItems<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ai = PHO_MEAT_ORDER.findIndex((m) => m === a.name.toLowerCase());
    const bi = PHO_MEAT_ORDER.findIndex((m) => m === b.name.toLowerCase());
    const aOrder = ai === -1 ? 999 : ai;
    const bOrder = bi === -1 ? 999 : bi;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.name.localeCompare(b.name, 'vi');
  });
}

/** Chỉ các loại thịt chọn trong popup phở (không gồm nước tiết, trứng chần, quẩy...) */
export function filterPhoToppingItems<T extends { name: string }>(items: T[]): T[] {
  return items.filter((item) =>
    PHO_MEATS.some((meat) => meat === item.name.toLowerCase())
  );
}

export function formatPhoMeatSummary(items: { name: string }[]): string {
  return sortPhoMeatItems(items)
    .map((item) => item.name.toLowerCase())
    .join(', ');
}

export const PHO_SIZES = [
  { key: 'small', label: 'Tô nhỏ', price: 40000, maxMeats: 2 },
  { key: 'regular', label: 'Tô thường', price: 45000, maxMeats: 2 },
  { key: 'large', label: 'Tô lớn (thập cẩm)', price: 50000, maxMeats: 5 },
] as const;

export type PhoSizeKey = (typeof PHO_SIZES)[number]['key'];

const PHO_SIZE_MENU_NAMES: Record<PhoSizeKey, string> = {
  small: 'Phở tô nhỏ',
  regular: 'Phở tô thường',
  large: 'Phở tô lớn (thập cẩm)',
};

export function getPhoSizeMeta(name: string): { label: string; maxMeats: number } {
  const config = PHO_SIZES.find(
    (size) => PHO_SIZE_MENU_NAMES[size.key] === name || name.includes(size.label)
  );
  if (config) {
    return { label: config.label, maxMeats: config.maxMeats };
  }
  const isLarge = name.toLowerCase().includes('lớn') || name.toLowerCase().includes('thập cẩm');
  return { label: name.replace(/^Phở\s*/i, ''), maxMeats: isLarge ? 5 : 2 };
}

export function formatPhoSizeSummary(
  items: { name: string; price: string | number }[]
): string {
  return items
    .map((item) => {
      const { label } = getPhoSizeMeta(item.name);
      const priceK = Math.round(Number(item.price) / 1000);
      return `${label} ${priceK}k`;
    })
    .join(' · ');
}

export const PHO_SIZE_CATEGORY = 'pho_size';

export function formatPhoMeatNote(meats: string[]): string {
  return meats.join(', ');
}

export function getCartLineKey(menuItemId: string, note?: string, selection?: string): string {
  const selectionPart = selection?.trim() ? `sel=${selection.trim()}` : '';
  const notePart = note?.trim() ? `note=${note.trim()}` : '';
  const suffix = [selectionPart, notePart].filter(Boolean).join('||');
  return suffix ? `${menuItemId}::${suffix}` : menuItemId;
}

export function getCartDisplayName(name: string, selection?: string): string {
  return selection ? `${name} (${selection})` : name;
}
