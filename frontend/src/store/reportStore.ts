import { create } from 'zustand';
import { RevenueDataPoint, TaxReport } from '../types';
import { api } from '../services/api';

// Store Zustand quản lý state Báo cáo
interface ReportState {
  revenue: RevenueDataPoint[];
  taxReport: TaxReport | null;
  period: 'day' | 'month' | 'year';
  loading: boolean;
  error: string | null;

  setPeriod: (period: 'day' | 'month' | 'year') => void;
  fetchRevenue: (date?: string) => Promise<void>;
  fetchTaxReport: (date?: string) => Promise<void>;
  exportTax: (date?: string) => Promise<string>;
}

export const useReportStore = create<ReportState>((set, get) => ({
  revenue: [],
  taxReport: null,
  period: 'month',
  loading: false,
  error: null,

  setPeriod: (period) => set({ period }),

  fetchRevenue: async (date) => {
    set({ loading: true });
    try {
      const revenue = await api.getRevenue(get().period, date);
      set({ revenue, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  fetchTaxReport: async (date) => {
    set({ loading: true });
    try {
      const taxReport = await api.getTaxReport(get().period, date);
      set({ taxReport, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  exportTax: async (date) => {
    const result = await api.exportTaxReport(get().period, date);
    return JSON.stringify(result.data, null, 2);
  },
}));
