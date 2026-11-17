import Calendar, { type CalendarMarker } from './Calendar';
import type { Attendance } from '../lib/attendance';

interface AttendanceCalendarProps {
  year: number;
  month: number;
  today: string;
  records: Attendance[];
  onSelect: (date: string) => void;
}

const legend: CalendarMarker[] = [
  { label: 'On time', color: 'blue' },
  { label: 'Late', color: 'orange' },
  { label: 'Absent', color: 'red' },
  { label: 'Leave', color: 'yellow' },
];

export default function AttendanceCalendar({ year, month, today, records, onSelect }: AttendanceCalendarProps) {
  const markers: Record<string, CalendarMarker> = {};
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(Date.UTC(year, month - 1, day));
    const key = date.toISOString().slice(0, 10);
    const weekday = date.getUTCDay();
    if (key <= today && weekday !== 0 && weekday !== 6) {
      markers[key] = { label: 'Absent', color: 'red' };
    }
  }

  for (const record of records) {
    if (record.type === 'sick' || record.type === 'personal') {
      markers[record.date] = { label: record.type === 'sick' ? 'Sick leave' : 'Personal leave', color: 'yellow' };
    } else {
      markers[record.date] = record.is_late
        ? { label: `Late, ${record.late_minutes} minutes`, color: 'orange' }
        : { label: 'On time', color: 'blue' };
    }
  }

  return (
    <Calendar
      year={year}
      month={month}
      today={today}
      markers={markers}
      legend={legend}
      onDateSelect={onSelect}
    />
  );
}
