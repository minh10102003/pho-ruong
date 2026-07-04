import { create } from 'zustand';
import { Employee, PayrollEntry, Timesheet } from '../types';
import { api } from '../services/api';

function mapOpenTimesheets(timesheets: Timesheet[]): Record<string, Timesheet> {
  return timesheets.reduce<Record<string, Timesheet>>((acc, sheet) => {
    acc[sheet.employee.id] = sheet;
    return acc;
  }, {});
}

// Store Zustand quản lý state Nhân viên & Lương
interface EmployeeState {
  employees: Employee[];
  openTimesheets: Record<string, Timesheet>;
  currentTimesheet: Timesheet | null;
  payroll: PayrollEntry[];
  loading: boolean;
  error: string | null;

  fetchEmployees: () => Promise<void>;
  fetchOpenTimesheets: () => Promise<void>;
  syncCurrentTimesheet: (employeeId: string) => Promise<void>;
  createEmployee: (data: {
    fullName: string;
    phone?: string;
    hourlyRate: number;
  }) => Promise<void>;
  updateEmployee: (
    id: string,
    data: {
      fullName?: string;
      phone?: string | null;
      hourlyRate?: number;
    }
  ) => Promise<void>;
  checkIn: (employeeId: string) => Promise<void>;
  checkOut: (timesheetId: string) => Promise<void>;
  fetchPayroll: (year: number, month: number) => Promise<void>;
}

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
  employees: [],
  openTimesheets: {},
  currentTimesheet: null,
  payroll: [],
  loading: false,
  error: null,

  fetchEmployees: async () => {
    set({ loading: true });
    try {
      const employees = await api.getEmployees();
      set({ employees, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  fetchOpenTimesheets: async () => {
    try {
      const timesheets = await api.getOpenTimesheets();
      set({ openTimesheets: mapOpenTimesheets(timesheets) });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  syncCurrentTimesheet: async (employeeId: string) => {
    if (!employeeId) {
      set({ currentTimesheet: null });
      return;
    }
    try {
      const timesheet = await api.getOpenTimesheet(employeeId);
      set((state) => {
        const openTimesheets = { ...state.openTimesheets };
        if (timesheet) {
          openTimesheets[employeeId] = timesheet;
        } else {
          delete openTimesheets[employeeId];
        }
        return {
          openTimesheets,
          currentTimesheet: timesheet,
        };
      });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  createEmployee: async (data) => {
    set({ loading: true, error: null });
    try {
      await api.createEmployee(data);
      const employees = await api.getEmployees();
      set({ employees, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  updateEmployee: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await api.updateEmployee(id, data);
      const employees = await api.getEmployees();
      set({ employees, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  checkIn: async (employeeId) => {
    set({ loading: true });
    try {
      const timesheet = await api.checkIn(employeeId);
      set((state) => ({
        currentTimesheet: timesheet,
        openTimesheets: { ...state.openTimesheets, [employeeId]: timesheet },
        loading: false,
      }));
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  checkOut: async (timesheetId) => {
    set({ loading: true });
    try {
      const timesheet = await api.checkOut(timesheetId);
      set((state) => {
        const openTimesheets = { ...state.openTimesheets };
        delete openTimesheets[timesheet.employee.id];
        return {
          openTimesheets,
          currentTimesheet: null,
          loading: false,
        };
      });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  fetchPayroll: async (year, month) => {
    set({ loading: true });
    try {
      const data = await api.getPayroll(year, month);
      const payroll = Array.isArray(data) ? data : [data];
      set({ payroll, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },
}));

export function refreshEmployeeData(
  selectedEmployeeId?: string,
  payrollYear?: number,
  payrollMonth?: number
) {
  const { fetchEmployees, fetchOpenTimesheets, syncCurrentTimesheet, fetchPayroll } =
    useEmployeeStore.getState();
  const tasks: Promise<void>[] = [fetchEmployees(), fetchOpenTimesheets()];
  if (selectedEmployeeId) {
    tasks.push(syncCurrentTimesheet(selectedEmployeeId));
  }
  if (payrollYear && payrollMonth) {
    tasks.push(fetchPayroll(payrollYear, payrollMonth));
  }
  return Promise.all(tasks);
}
