export type AppRole = 'ADMIN' | 'MANAGER' | 'STAFF';

export interface AuthUser {
  id: string;
  phone: string;
  role: AppRole;
  displayName: string;
  employeeId: string | null;
}
