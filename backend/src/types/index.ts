import { OrderStatus, PaymentMethod } from '@prisma/client';

// Kiểu dữ liệu dùng chung cho toàn backend
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface CreateOrderItemDto {
  menuItemId: string;
  quantity: number;
  selection?: string;
  note?: string;
}

export interface CreateOrderDto {
  items: CreateOrderItemDto[];
  note?: string;
  tableNumber?: string;
}

export interface CreateMenuItemDto {
  name: string;
  price: number;
  category: string;
  imageUrl?: string;
}

export interface UpdateMenuItemDto {
  name?: string;
  price?: number;
  category?: string;
  isActive?: boolean;
  imageUrl?: string | null;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
}

export interface CreateIngredientDto {
  category: string;
  name: string;
  unit: string;
  minStock?: number;
}

export interface UpdateIngredientDto {
  category?: string;
  name?: string;
  unit?: string;
  minStock?: number;
}

export interface CreateInventoryReceiptDto {
  ingredientId: string;
  quantity: number;
  unitPrice: number;
  supplier: string;
  note?: string;
  receivedAt?: string;
}

export interface CreateEmployeeDto {
  fullName: string;
  phone?: string;
  hourlyRate: number;
}

export interface UpdateEmployeeDto {
  fullName?: string;
  phone?: string | null;
  hourlyRate?: number;
  isActive?: boolean;
}

export interface CheckInDto {
  employeeId: string;
  note?: string;
}

export interface CheckOutDto {
  timesheetId: string;
}

export interface ReportFilterDto {
  period: 'day' | 'month' | 'year';
  date?: string; // ISO date
}

export { OrderStatus, PaymentMethod };
