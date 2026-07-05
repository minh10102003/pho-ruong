import { API_BASE_URL } from '../constants';
import { decodeOrderItemMeta } from '../utils/orderItemMeta';
import { AuthUser } from '../types/auth';

// Client HTTP gọi API Backend
class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.error || 'Lỗi kết nối API');
    }
    return json.data;
  }

  // --- AUTH ---
  login(phone: string, password: string) {
    return this.request<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });
  }

  getMe() {
    return this.request<AuthUser>('/auth/me');
  }

  createManagerAccount(body: { fullName: string; phone: string; password: string }) {
    return this.request<AuthUser>('/auth/managers', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  createStaffAccount(body: {
    fullName: string;
    phone: string;
    password: string;
    hourlyRate: number;
  }) {
    return this.request<AuthUser>('/auth/staff', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  private normalizeOrder(order: import('../types').Order): import('../types').Order {
    return {
      ...order,
      items: order.items.map((item) => {
        const meta = decodeOrderItemMeta(item.note);
        return {
          ...item,
          selection: meta.selection,
          note: meta.note,
        };
      }),
    };
  }

  // --- ORDER ---
  getMenu() {
    return this.request<import('../types').MenuItem[]>('/orders/menu');
  }

  getAllMenuItems() {
    return this.request<import('../types').MenuItem[]>('/orders/menu/all');
  }

  createMenuItem(body: { name: string; price: number; category: string; imageUrl?: string }) {
    return this.request<import('../types').MenuItem>('/orders/menu', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  updateMenuItem(
    id: string,
    body: { name?: string; price?: number; category?: string; isActive?: boolean; imageUrl?: string | null }
  ) {
    return this.request<import('../types').MenuItem>(`/orders/menu/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  createOrder(body: {
    items: { menuItemId: string; quantity: number; selection?: string; note?: string }[];
    note?: string;
    tableNumber?: string;
  }) {
    return this.request<import('../types').Order>('/orders/orders', {
      method: 'POST',
      body: JSON.stringify(body),
    }).then((order) => this.normalizeOrder(order));
  }

  getOrders(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request<import('../types').Order[]>(`/orders/orders${query}`).then((orders) =>
      orders.map((order) => this.normalizeOrder(order))
    );
  }

  updateOrderStatus(id: string, status: string, paymentMethod?: string) {
    return this.request<import('../types').Order>(`/orders/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...(paymentMethod ? { paymentMethod } : {}) }),
    }).then((order) => this.normalizeOrder(order));
  }

  removeOrderItem(orderId: string, itemId: string) {
    return this.request<import('../types').Order | null>(
      `/orders/orders/${orderId}/items/${itemId}`,
      { method: 'DELETE' }
    ).then((order) => (order ? this.normalizeOrder(order) : null));
  }

  getPaymentConfig() {
    return this.request<import('../types').PaymentConfig>('/payment/config');
  }

  // --- INVENTORY ---
  getIngredients() {
    return this.request<import('../types').Ingredient[]>('/inventory/ingredients');
  }

  createIngredient(body: { category: string; name: string; unit: string; minStock?: number }) {
    return this.request<import('../types').Ingredient>('/inventory/ingredients', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  updateIngredient(
    id: string,
    body: { category?: string; name?: string; unit?: string; minStock?: number }
  ) {
    return this.request<import('../types').Ingredient>(`/inventory/ingredients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  deleteIngredient(id: string) {
    return this.request<void>(`/inventory/ingredients/${id}`, {
      method: 'DELETE',
    });
  }

  createReceipt(body: {
    ingredientId: string;
    quantity: number;
    unitPrice: number;
    supplier: string;
    note?: string;
    receivedAt?: string;
  }) {
    return this.request<import('../types').InventoryReceipt>('/inventory/receipts', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  getReceipts() {
    return this.request<import('../types').InventoryReceipt[]>('/inventory/receipts');
  }

  // --- EMPLOYEE ---
  getEmployees() {
    return this.request<import('../types').Employee[]>('/employees/employees');
  }

  getOpenTimesheets() {
    return this.request<import('../types').Timesheet[]>('/employees/employees/open-timesheets');
  }

  getOpenTimesheet(employeeId: string) {
    return this.request<import('../types').Timesheet | null>(
      `/employees/employees/${employeeId}/open-timesheet`
    );
  }

  createEmployee(body: {
    fullName: string;
    phone?: string;
    hourlyRate: number;
  }) {
    return this.request<import('../types').Employee>('/employees/employees', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  updateEmployee(
    id: string,
    body: {
      fullName?: string;
      phone?: string | null;
      hourlyRate?: number;
    }
  ) {
    return this.request<import('../types').Employee>(`/employees/employees/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  checkIn(employeeId: string, note?: string) {
    return this.request<import('../types').Timesheet>('/employees/timesheets/check-in', {
      method: 'POST',
      body: JSON.stringify({ employeeId, note }),
    });
  }

  requestCheckIn(employeeId: string) {
    return this.request<import('../types').CheckInRequest>('/employees/timesheets/request-check-in', {
      method: 'POST',
      body: JSON.stringify({ employeeId }),
    });
  }

  getPendingCheckInRequests() {
    return this.request<import('../types').CheckInRequest[]>(
      '/employees/timesheets/check-in-requests/pending'
    );
  }

  getMyPendingCheckInRequest() {
    return this.request<import('../types').CheckInRequest | null>(
      '/employees/timesheets/check-in-requests/mine'
    );
  }

  approveCheckInRequest(requestId: string) {
    return this.request<import('../types').CheckInRequest>(
      `/employees/timesheets/check-in-requests/${requestId}/approve`,
      { method: 'POST' }
    );
  }

  rejectCheckInRequest(requestId: string, rejectReason?: string) {
    return this.request<import('../types').CheckInRequest>(
      `/employees/timesheets/check-in-requests/${requestId}/reject`,
      {
        method: 'POST',
        body: JSON.stringify({ rejectReason }),
      }
    );
  }

  cancelMyCheckInRequest() {
    return this.request<import('../types').CheckInRequest>(
      '/employees/timesheets/check-in-requests/mine/cancel',
      { method: 'POST' }
    );
  }

  checkOut(timesheetId: string) {
    return this.request<import('../types').Timesheet>('/employees/timesheets/check-out', {
      method: 'POST',
      body: JSON.stringify({ timesheetId }),
    });
  }

  getPayroll(year: number, month: number, employeeId?: string) {
    const params = new URLSearchParams({
      year: String(year),
      month: String(month),
    });
    if (employeeId) params.set('employeeId', employeeId);
    return this.request<import('../types').PayrollEntry | import('../types').PayrollEntry[]>(
      `/employees/payroll?${params}`
    );
  }

  // --- REPORTS ---
  getRevenue(period: 'day' | 'month' | 'year', date?: string) {
    const params = new URLSearchParams({ period });
    if (date) params.set('date', date);
    return this.request<import('../types').RevenueDataPoint[]>(
      `/reports/revenue?${params}`
    );
  }

  getTaxReport(period: 'day' | 'month' | 'year', date?: string) {
    const params = new URLSearchParams({ period });
    if (date) params.set('date', date);
    return this.request<import('../types').TaxReport>(`/reports/tax?${params}`);
  }

  getImportReport(period: 'day' | 'month' | 'year', date?: string) {
    const params = new URLSearchParams({ period });
    if (date) params.set('date', date);
    return this.request<import('../types').ImportReport>(`/reports/imports?${params}`);
  }

  exportTaxReport(period: 'day' | 'month' | 'year', date?: string) {
    const params = new URLSearchParams({ period });
    if (date) params.set('date', date);
    return this.request<{ filename: string; data: import('../types').TaxReport }>(
      `/reports/tax/export?${params}`
    );
  }
}

export const api = new ApiClient(API_BASE_URL);
