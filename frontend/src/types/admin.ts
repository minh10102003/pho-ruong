import { AppRole } from './auth';

export interface ManagedUser {
  id: string;
  phone: string;
  role: Extract<AppRole, 'MANAGER' | 'STAFF'>;
  displayName: string;
  isActive: boolean;
  employeeId: string | null;
  hourlyRate: number | null;
}

export interface InventoryCategoryItem {
  name: string;
}
