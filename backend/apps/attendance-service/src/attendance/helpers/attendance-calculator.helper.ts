import {
  Attendance,
  AttendanceType,
  WorkType,
} from '../entities/attendance.entity.js';

export interface AttendanceResponse {
  id: string;
  employee_id: string;
  date: string;
  type: AttendanceType;
  clock_in: Date | null;
  clock_out: Date | null;
  image_path: string | null;
  attachment_url: string | null;
  detail: string | null;
  is_late: boolean;
  late_minutes: number;
  is_overtime: boolean;
  overtime_minutes: number;
  created_at: Date;
  updated_at: Date;
}

const OFFICE_START_TOTAL_MINUTES = 8 * 60;
export const OFFICE_END_TOTAL_MINUTES = 17 * 60;

function minutesAfter(time: Date | null, thresholdMinutes: number): number {
  if (!time) return 0;

  const totalMinutes = time.getHours() * 60 + time.getMinutes();

  return Math.max(0, totalMinutes - thresholdMinutes);
}

export function formatAttendanceResponse(
  attendance: Attendance,
): AttendanceResponse {
  const {
    id,
    employee_id,
    date,
    type,
    clock_in,
    clock_out,
    image_path,
    detail,
    created_at,
    updated_at,
  } = attendance;

  const isWorkDay = type === WorkType.WFO || type === WorkType.WFH;

  const late_minutes = isWorkDay
    ? minutesAfter(clock_in, OFFICE_START_TOTAL_MINUTES)
    : 0;

  const overtime_minutes = isWorkDay
    ? minutesAfter(clock_out, OFFICE_END_TOTAL_MINUTES)
    : 0;

  const filename = image_path?.replace(/\\/g, '/').split('/').pop();

  const attachment_url = image_path
    ? `/api/attendance/attachments/${employee_id}/${filename}`
    : null;

  return {
    id,
    employee_id,
    date,
    type,
    clock_in,
    clock_out,
    image_path,
    attachment_url,
    detail,
    is_late: late_minutes > 0,
    late_minutes,
    is_overtime: overtime_minutes > 0,
    overtime_minutes,
    created_at,
    updated_at,
  };
}
