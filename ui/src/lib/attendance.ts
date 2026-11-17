import { useAuthStore } from '../stores/authStore';

export interface Attendance {
  date: string;
  type: 'wfo' | 'wfh' | 'sick' | 'personal';
  clock_in: string | null;
  clock_out: string | null;
  detail: string | null;
}

export async function requestAttendance(
  path: string,
  options: RequestInit = {},
): Promise<Attendance | null> {
  const response = await useAuthStore.getState().fetchWithAuth(`/api/attendance${path}`, options);
  const data = await response.json().catch(() => null);

  if (!response.ok) throw new Error(data.message);

  return data;
}
