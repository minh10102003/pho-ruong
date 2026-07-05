import { create } from 'zustand';
import { Employee, PayrollEntry, Timesheet, CheckInRequest, CheckOutRequest } from '../types';
import { AppRole } from '../types/auth';
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
  pendingCheckInRequests: CheckInRequest[];
  myPendingCheckInRequest: CheckInRequest | null;
  pendingCheckOutRequests: CheckOutRequest[];
  myPendingCheckOutRequest: CheckOutRequest | null;
  payroll: PayrollEntry[];
  loading: boolean;
  error: string | null;

  fetchEmployees: (silent?: boolean) => Promise<void>;
  fetchOpenTimesheets: () => Promise<void>;
  syncCurrentTimesheet: (employeeId: string) => Promise<void>;
  createEmployee: (data: {
    fullName: string;
    phone?: string;
    hourlyRate: number;
    useBlockRounding?: boolean;
  }) => Promise<void>;
  createStaffAccount: (data: {
    fullName: string;
    phone: string;
    password: string;
    hourlyRate: number;
    useBlockRounding?: boolean;
  }) => Promise<void>;
  updateEmployee: (
    id: string,
    data: {
      fullName?: string;
      phone?: string | null;
      hourlyRate?: number;
      useBlockRounding?: boolean;
    }
  ) => Promise<void>;
  checkIn: (employeeId: string) => Promise<void>;
  requestCheckIn: (employeeId: string) => Promise<void>;
  cancelMyCheckInRequest: () => Promise<void>;
  fetchPendingCheckInRequests: () => Promise<void>;
  fetchMyPendingCheckInRequest: () => Promise<void>;
  approveCheckInRequest: (requestId: string) => Promise<void>;
  rejectCheckInRequest: (requestId: string, rejectReason?: string) => Promise<void>;
  requestCheckOut: (timesheetId: string) => Promise<void>;
  cancelMyCheckOutRequest: () => Promise<void>;
  fetchPendingCheckOutRequests: () => Promise<void>;
  fetchMyPendingCheckOutRequest: () => Promise<void>;
  approveCheckOutRequest: (requestId: string) => Promise<void>;
  rejectCheckOutRequest: (requestId: string, rejectReason?: string) => Promise<void>;
  checkOut: (timesheetId: string) => Promise<void>;
  fetchPayroll: (year: number, month: number, employeeId?: string, silent?: boolean) => Promise<void>;
}

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
  employees: [],
  openTimesheets: {},
  currentTimesheet: null,
  pendingCheckInRequests: [],
  myPendingCheckInRequest: null,
  pendingCheckOutRequests: [],
  myPendingCheckOutRequest: null,
  payroll: [],
  loading: false,
  error: null,

  fetchEmployees: async (silent = false) => {
    if (!silent) set({ loading: true });
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

  createStaffAccount: async (data) => {
    set({ loading: true, error: null });
    try {
      await api.createStaffAccount(data);
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

  requestCheckIn: async (employeeId) => {
    set({ loading: true, error: null });
    try {
      const request = await api.requestCheckIn(employeeId);
      set({ myPendingCheckInRequest: request, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  cancelMyCheckInRequest: async () => {
    set({ loading: true, error: null });
    try {
      await api.cancelMyCheckInRequest();
      set({ myPendingCheckInRequest: null, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  fetchPendingCheckInRequests: async () => {
    try {
      const pendingCheckInRequests = await api.getPendingCheckInRequests();
      set({ pendingCheckInRequests });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  fetchMyPendingCheckInRequest: async () => {
    try {
      const myPendingCheckInRequest = await api.getMyPendingCheckInRequest();
      set({ myPendingCheckInRequest });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  approveCheckInRequest: async (requestId) => {
    set({ loading: true, error: null });
    try {
      await api.approveCheckInRequest(requestId);
      set((state) => {
        const pendingCheckInRequests = state.pendingCheckInRequests.filter((r) => r.id !== requestId);
        return { pendingCheckInRequests, loading: false };
      });
      await get().fetchOpenTimesheets();
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  rejectCheckInRequest: async (requestId, rejectReason) => {
    set({ loading: true, error: null });
    try {
      await api.rejectCheckInRequest(requestId, rejectReason);
      set((state) => ({
        pendingCheckInRequests: state.pendingCheckInRequests.filter((r) => r.id !== requestId),
        loading: false,
      }));
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  requestCheckOut: async (timesheetId) => {
    set({ loading: true, error: null });
    try {
      const request = await api.requestCheckOut(timesheetId);
      set({ myPendingCheckOutRequest: request, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  cancelMyCheckOutRequest: async () => {
    set({ loading: true, error: null });
    try {
      await api.cancelMyCheckOutRequest();
      set({ myPendingCheckOutRequest: null, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  fetchPendingCheckOutRequests: async () => {
    try {
      const pendingCheckOutRequests = await api.getPendingCheckOutRequests();
      set({ pendingCheckOutRequests });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  fetchMyPendingCheckOutRequest: async () => {
    try {
      const myPendingCheckOutRequest = await api.getMyPendingCheckOutRequest();
      set({ myPendingCheckOutRequest });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  approveCheckOutRequest: async (requestId) => {
    set({ loading: true, error: null });
    try {
      await api.approveCheckOutRequest(requestId);
      set((state) => {
        const pendingCheckOutRequests = state.pendingCheckOutRequests.filter((r) => r.id !== requestId);
        return { pendingCheckOutRequests, loading: false };
      });
      await get().fetchOpenTimesheets();
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  rejectCheckOutRequest: async (requestId, rejectReason) => {
    set({ loading: true, error: null });
    try {
      await api.rejectCheckOutRequest(requestId, rejectReason);
      set((state) => ({
        pendingCheckOutRequests: state.pendingCheckOutRequests.filter((r) => r.id !== requestId),
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

  fetchPayroll: async (year, month, employeeId, silent = false) => {
    if (!silent) set({ loading: true });
    try {
      const data = await api.getPayroll(year, month, employeeId);
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
  payrollMonth?: number,
  silent = false
) {
  const {
    fetchEmployees,
    fetchOpenTimesheets,
    syncCurrentTimesheet,
    fetchPayroll,
  } = useEmployeeStore.getState();
  const tasks: Promise<void>[] = [
    fetchEmployees(silent),
    fetchOpenTimesheets(),
  ];
  if (selectedEmployeeId) {
    tasks.push(syncCurrentTimesheet(selectedEmployeeId));
  }
  if (payrollYear && payrollMonth) {
    tasks.push(fetchPayroll(payrollYear, payrollMonth, undefined, silent));
  }
  return Promise.all(tasks);
}

/** Cập nhật dữ liệu chấm công qua socket — không bật loading toàn màn hình */
export async function refreshCheckInRealtimeData(params: {
  role: AppRole;
  employeeId?: string;
  eventEmployeeId?: string;
  action?: import('../types').CheckInSocketPayload['action'];
}) {
  const {
    fetchPendingCheckInRequests,
    fetchPendingCheckOutRequests,
    fetchMyPendingCheckInRequest,
    fetchMyPendingCheckOutRequest,
    fetchOpenTimesheets,
    syncCurrentTimesheet,
    fetchEmployees,
    fetchPayroll,
  } = useEmployeeStore.getState();

  if (params.role === 'MANAGER' || params.role === 'ADMIN') {
    await Promise.all([
      fetchPendingCheckInRequests(),
      fetchPendingCheckOutRequests(),
      fetchOpenTimesheets(),
      fetchEmployees(true),
    ]);
    return;
  }

  if (params.role === 'STAFF' && params.employeeId) {
    if (params.eventEmployeeId && params.eventEmployeeId !== params.employeeId) {
      return;
    }
    await Promise.all([
      fetchMyPendingCheckInRequest(),
      fetchMyPendingCheckOutRequest(),
      syncCurrentTimesheet(params.employeeId),
    ]);
    if (params.action === 'checkout_approved') {
      const now = new Date();
      await fetchPayroll(now.getFullYear(), now.getMonth() + 1, params.employeeId, true);
    }
  }
}
