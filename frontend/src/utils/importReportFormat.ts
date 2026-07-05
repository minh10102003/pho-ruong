import { ImportReportTimelinePoint } from '../types';
import { shortenPeriodLabel } from './chartFormat';

export type ImportChartDatum = {
  label: string;
  shortLabel: string;
  totalCost: number;
  receiptCount: number;
  totalQuantity: number;
};

export function toImportChartData(
  timeline: ImportReportTimelinePoint[],
  period: 'day' | 'month' | 'year'
): ImportChartDatum[] {
  return timeline.map((item) => ({
    label: item.label,
    shortLabel:
      period === 'month'
        ? item.label.slice(0, 5)
        : shortenPeriodLabel(item.label, period === 'year' ? 'month' : 'day'),
    totalCost: Number(item.totalCost),
    receiptCount: Number(item.receiptCount),
    totalQuantity: Number(item.totalQuantity),
  }));
}

export function formatReportPeriodLabel(period: 'day' | 'month' | 'year'): string {
  const now = new Date();
  if (period === 'day') {
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(now);
  }
  if (period === 'month') {
    return new Intl.DateTimeFormat('vi-VN', {
      month: 'long',
      year: 'numeric',
    }).format(now);
  }
  return `Năm ${now.getFullYear()}`;
}
