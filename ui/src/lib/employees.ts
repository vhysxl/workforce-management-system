import type { EmployeeProfile } from './profile';
import { useAuthStore } from '../stores/authStore';

export type EmployeeRole = EmployeeProfile['role'];
export type ManagerRole = 'admin' | 'hrd';

export interface EmployeeDetail extends EmployeeProfile {
  deactivated_at: string | null;
  updated_at: string;
}

export type EmployeeListItem = Omit<EmployeeDetail, 'nik'>;
export type EmployeeInput = Pick<EmployeeDetail,
  'full_name' | 'email' | 'nik' | 'phone_number' | 'role' | 'address' |
  'birth_place' | 'birth_date' | 'marital_status' | 'religion'
>;

export interface EmployeeListResponse {
  data: EmployeeListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export function canManageEmployee(actorRole: ManagerRole, targetRole: EmployeeRole): boolean {
  if (actorRole === 'admin') return targetRole === 'employee' || targetRole === 'hrd';
  return actorRole === 'hrd' && targetRole === 'employee';
}

export async function requestEmployeeApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await useAuthStore.getState().fetchWithAuth(`/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join('\n') : data.message);
  return data;
}
