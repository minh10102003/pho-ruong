import { create } from 'zustand';
import { RevenueDataPoint, TaxReport, ImportReport } from '../types';
import { api } from '../services/api';

interface ReportState {
  revenue: RevenueDataPoint[];
  taxReport: TaxReport | null;
  importReport: ImportReport | null;
  period: 'day' | 'month' | 'year';
  loading: boolean;
  error: string | null;

  setPeriod: (period: 'day' | 'month' | 'year') => void;
  fetchAll: (date?: string) => Promise<void>;
  exportTax: (date?: string) => Promise<string>;
}

export const useReportStore = create<ReportState>((set, get) => ({
  revenue: [],
  taxReport: null,
  importReport: null,
  period: 'month',
  loading: false,
  error: null,

  setPeriod: (period) => set({ period }),

  fetchAll: async (date) => {
    set({ loading: true, error: null });
    const period = get().period;
    try {
      const [revenue, taxReport, importReport] = await Promise.all([
        api.getRevenue(period, date),
        api.getTaxReport(period, date),
        api.getImportReport(period, date),
      ]);
      set({ revenue, taxReport, importReport, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  exportTax: async (date) => {
    const result = await api.exportTaxReport(get().period, date);
    return JSON.stringify(result.data, null, 2);
  },
}));
