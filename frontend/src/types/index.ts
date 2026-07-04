// Kiểu dữ liệu TypeScript cho Frontend

export type OrderStatus = 'PENDING' | 'PREPARING' | 'SERVED' | 'PAID';
export type PaymentMethod = 'CASH' | 'TRANSFER';

export interface PaymentConfig {
  shopName: string;
  shopAddress: string | null;
  shopPhone: string | null;
  logoUrl: string | null;
  transferQrUrl: string | null;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: string | number;
  category: string;
  isActive: boolean;
  imageUrl?: string | null;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  selection?: string;
  note?: string;
  lineKey: string;
}

export interface CartDraftLine {
  lineKey: string;
  menuItem: MenuItem;
  selection?: string;
  note?: string;
  existingQty: number;
  pendingQty: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  note?: string;
  subtotal: string | number;
  taxAmount: string | number;
  total: string | number;
  tableNumber?: string;
  paymentMethod?: PaymentMethod | null;
  invoiceNumber?: string | null;
  items: OrderItem[];
  createdAt: string;
  paidAt?: string;
}

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: string | number;
  lineTotal: string | number;
  selection?: string;
  note?: string;
  menuItem: MenuItem;
}

export interface Ingredient {
  id: string;
  category: string;
  name: string;
  unit: string;
  stockQty: string | number;
  minStock: string | number;
}

export interface InventoryReceipt {
  id: string;
  receiptCode: string;
  quantity: string | number;
  unitPrice: string | number;
  totalCost: string | number;
  supplier: string;
  receivedAt: string;
  ingredient: Ingredient;
}

export interface Employee {
  id: string;
  fullName: string;
  phone?: string;
  role: string;
  hourlyRate: string | number;
}

export interface Timesheet {
  id: string;
  checkIn: string;
  checkOut?: string;
  employee: Employee;
}

export interface PayrollEntry {
  employee: Employee;
  year: number;
  month: number;
  totalHours: number;
  hourlyRate: number;
  totalSalary: number;
  timesheets: Timesheet[];
}

export interface RevenueDataPoint {
  period: string;
  revenue: number;
  orderCount: number;
}

export interface TaxReport {
  period: string;
  totalRevenue: number;
  cashRevenue: number;
  transferRevenue: number;
  cashOrderCount: number;
  transferOrderCount: number;
  totalImportCost: number;
  taxableIncome: number;
  taxRate: number;
  taxType: string;
  taxAmount: number;
  netProfit: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
