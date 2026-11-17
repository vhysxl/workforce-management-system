import type { LucideIcon } from 'lucide-react';
import { formatTime } from '../lib/date';

interface AttendanceTimeCardProps {
  label: string;
  icon: LucideIcon;
  time?: string | null;
  caption?: string;
}

export default function AttendanceTimeCard({ label, icon: Icon, time, caption }: AttendanceTimeCardProps) {
  return (
    <div className="p-5 rounded-2xl bg-supporting-2 border border-white/5 space-y-2">
      <div className="flex items-center gap-2 text-supporting text-sm font-medium">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </div>
      <p className="text-2xl font-semibold text-secondary tracking-tight">
        {time ? formatTime(time) : '--:--'}
      </p>
      <p className="text-xs text-supporting">{caption ?? (time ? 'Recorded' : 'Not recorded')}</p>
    </div>
  );
}
