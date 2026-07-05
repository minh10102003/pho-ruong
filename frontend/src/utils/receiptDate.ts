export type ReceiptDateMode = 'today' | 'custom';

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function isSameDay(left: Date, right: Date): boolean {
  return startOfDay(left).getTime() === startOfDay(right).getTime();
}

export function isFutureDay(date: Date): boolean {
  return startOfDay(date).getTime() > startOfDay(new Date()).getTime();
}

export function toReceivedAtIso(mode: ReceiptDateMode, customDate: Date): string {
  const base = mode === 'today' ? new Date() : customDate;
  const normalized = startOfDay(base);
  normalized.setHours(12, 0, 0, 0);
  return normalized.toISOString();
}

export function formatReceiptDayLabel(date: Date): string {
  const today = startOfDay(new Date());
  const target = startOfDay(date);

  if (target.getTime() === today.getTime()) {
    return 'Hôm nay';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatMonthYear(year: number, month: number): string {
  return new Intl.DateTimeFormat('vi-VN', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month, 1));
}

export function buildCalendarCells(viewYear: number, viewMonth: number): Array<Date | null> {
  const firstDay = new Date(viewYear, viewMonth, 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(viewYear, viewMonth, 1 - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const cell = new Date(gridStart);
    cell.setDate(gridStart.getDate() + index);
    return cell;
  });
}

export function shiftMonth(year: number, month: number, delta: number) {
  const date = new Date(year, month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

export function clampToToday(date: Date): Date {
  const today = startOfDay(new Date());
  const target = startOfDay(date);
  return target.getTime() > today.getTime() ? today : target;
}

export const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
