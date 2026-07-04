export const TABLE_COUNT = 11;

/** Bếp / không gắn số bàn */
export const COUNTER_TABLE_NUMBER = 0;
export const COUNTER_TABLE_LABEL = 'Bếp';
/** Đơn cũ lưu nhãn này trước khi đổi tên */
export const LEGACY_COUNTER_TABLE_LABEL = 'Quầy';

export function isCounterTable(tableNumber?: string): boolean {
  return (
    tableNumber === COUNTER_TABLE_LABEL || tableNumber === LEGACY_COUNTER_TABLE_LABEL
  );
}

export function getTableDisplayLabel(table: number): string {
  return table === COUNTER_TABLE_NUMBER ? 'Bếp' : `Bàn ${table}`;
}

/** Giá trị tableNumber gửi/lưu API cho bàn đang chọn */
export function getTableOrderKey(table: number): string {
  return table === COUNTER_TABLE_NUMBER ? COUNTER_TABLE_LABEL : String(table);
}

export function orderMatchesTable(
  order: { tableNumber?: string },
  table: number
): boolean {
  if (!order.tableNumber) return false;
  if (table === COUNTER_TABLE_NUMBER) {
    return isCounterTable(order.tableNumber);
  }
  return order.tableNumber === String(table);
}

export function formatOrderTableLabel(tableNumber?: string): string {
  if (!tableNumber) return 'Không có bàn';
  if (isCounterTable(tableNumber)) return 'Bếp';
  return `Bàn ${tableNumber}`;
}

/** Hai đơn có cùng bàn (kể cả Bếp / nhãn cũ Quầy) */
export function ordersShareTable(
  a: { tableNumber?: string },
  b: { tableNumber?: string }
): boolean {
  if (!a.tableNumber || !b.tableNumber) return false;
  if (isCounterTable(a.tableNumber) && isCounterTable(b.tableNumber)) return true;
  return a.tableNumber === b.tableNumber;
}

/** Sơ đồ bàn trong nhà: null = ô trống */
export const INDOOR_TABLE_LAYOUT: (number | null)[][] = [
  [1, 5, null],
  [2, 6, 9],
  [3, 7, 10],
  [4, 8, null],
];

export const OUTDOOR_TABLES = [11] as const;

export const INDOOR_COLUMNS = 3;
