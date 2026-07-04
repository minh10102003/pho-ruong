/** Chuyển tồn kho / số lượng từ API (string | number) sang number an toàn */
export function parseQuantity(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Cảnh báo "Sắp hết" chỉ khi đã cấu hình tồn tối thiểu (> 0)
 * và tồn hiện tại <= ngưỡng đó.
 */
export function isLowStock(
  stockQty: string | number,
  minStock: string | number
): boolean {
  const stock = parseQuantity(stockQty);
  const min = parseQuantity(minStock);
  if (min <= 0) return false;
  return stock <= min;
}

export function formatQuantity(value: string | number): string {
  const n = parseQuantity(value);
  if (Number.isInteger(n)) return String(n);
  return String(n).replace(/\.?0+$/, '');
}
