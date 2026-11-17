import { useAuthStore } from '../stores/authStore';

export interface Attendance {
  id: string;
  employee_id: string;
  date: string;
  type: 'wfo' | 'wfh' | 'sick' | 'personal';
  clock_in: string | null;
  clock_out: string | null;
  detail: string | null;
  attachment_url: string | null;
  is_late: boolean;
  late_minutes: number;
  is_overtime: boolean;
  overtime_minutes: number;
}

export interface AttendanceHistory {
  year: number;
  month: number | null;
  total: number;
  data: Attendance[];
}

export async function requestAttendance<T = Attendance | null>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await useAuthStore.getState().fetchWithAuth(`/api/attendance${path}`, options);
  const data = await response.json().catch(() => null);

  if (!response.ok) throw new Error(data.message);

  return data;
}
