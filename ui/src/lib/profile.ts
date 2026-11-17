import { useAuthStore } from '../stores/authStore';

export interface EmployeeProfile {
  id: string;
  full_name: string;
  email: string;
  address: string | null;
  nik: string;
  phone_number: string;
  role: 'admin' | 'hrd' | 'employee';
  birth_place: string;
  birth_date: string;
  marital_status: string | null;
  religion: string | null;
  activated_at: string | null;
  created_at: string;
}

export async function requestProfile(): Promise<EmployeeProfile> {
  const response = await useAuthStore.getState().fetchWithAuth('/api/employees/me');
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
}
