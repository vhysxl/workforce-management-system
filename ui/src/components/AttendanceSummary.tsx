import type { Attendance } from '../lib/attendance';

interface AttendanceSummaryProps {
  records: Attendance[];
}

export default function AttendanceSummary({ records }: AttendanceSummaryProps) {
  const workDays = records.filter((record) => record.type === 'wfo' || record.type === 'wfh');
  const lateDays = workDays.filter((record) => record.is_late);
  const overtimeDays = workDays.filter((record) => record.is_overtime);
  const lateMinutes = workDays.reduce((total, record) => total + record.late_minutes, 0);
  const overtimeMinutes = workDays.reduce((total, record) => total + record.overtime_minutes, 0);

  const items = [
    { label: 'On time', value: `${workDays.length - lateDays.length} days`, detail: 'WFO / WFH', color: 'text-blue-300' },
    { label: 'Late', value: `${lateDays.length} days`, detail: `${lateMinutes} minutes late`, color: 'text-orange-300' },
    { label: 'Leave', value: `${records.length - workDays.length} days`, detail: 'Sick / personal leave', color: 'text-yellow-300' },
    { label: 'Overtime', value: `${overtimeMinutes} minutes`, detail: `${overtimeDays.length} days`, color: 'text-secondary' },
  ];

  return (
    <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map(({ label, value, detail, color }) => (
        <div key={label} className="rounded-xl bg-supporting-2 p-4 space-y-1">
          <dt className="text-xs text-supporting">{label}</dt>
          <dd className={`text-lg font-semibold ${color}`}>{value}</dd>
          <dd className="text-xs text-supporting">{detail}</dd>
        </div>
      ))}
    </dl>
  );
}
