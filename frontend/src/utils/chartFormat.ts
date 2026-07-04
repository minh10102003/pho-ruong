import { RevenueDataPoint } from '../types';

export function shortenPeriodLabel(
  period: string,
  view: 'day' | 'month' | 'year'
): string {
  if (view === 'month') {
    const match = period.match(/Tháng\s*(\d+)/i);
    if (match) return `T${match[1]}`;
  }

  if (view === 'year') {
    const match = period.match(/Năm\s*(\d+)/i);
    if (match) return match[1];
  }

  if (view === 'day') {
    const parts = period.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  }

  return period.length > 10 ? `${period.slice(0, 10)}…` : period;
}

export function formatCompactAxis(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}tỷ`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}tr`;
  if (abs >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(Math.round(value));
}

export type RevenueChartDatum = {
  label: string;
  shortLabel: string;
  revenue: number;
  orderCount: number;
};

export function toRevenueChartData(
  revenue: RevenueDataPoint[],
  period: 'day' | 'month' | 'year'
): RevenueChartDatum[] {
  return revenue.map((item) => ({
    label: item.period,
    shortLabel: shortenPeriodLabel(item.period, period),
    revenue: Number(item.revenue),
    orderCount: Number(item.orderCount),
  }));
}
