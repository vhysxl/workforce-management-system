import { useEffect, useState } from 'react';
import { ArrowLeft, LogIn, LogOut } from 'lucide-react';
import AttendanceTimeCard from '../components/AttendanceTimeCard';
import ErrorAlert from '../components/ErrorAlert';
import type { Attendance } from '../lib/attendance';
import { formatDate, formatDateTime } from '../lib/date';
import { useAuthStore } from '../stores/authStore';

interface AttendanceDetailPageProps {
  date: string;
  attendance: Attendance | null;
  onBack: () => void;
  backLabel?: string;
}

export default function AttendanceDetailPage({ date, attendance, onBack, backLabel = 'Back to profile' }: AttendanceDetailPageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(Boolean(attendance?.attachment_url));
  const attachmentUrl = attendance?.attachment_url;

  useEffect(() => {
    if (!attachmentUrl) return;
    let active = true;
    let objectUrl: string | null = null;

    useAuthStore.getState().fetchWithAuth(attachmentUrl)
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message);
        }
        return response.blob();
      })
      .then((blob) => {
        if (active) {
          objectUrl = URL.createObjectURL(blob);
          setImageUrl(objectUrl);
        }
      })
      .catch((error) => {
        if (active) setImageError(error.message);
      })
      .finally(() => {
        if (active) setImageLoading(false);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachmentUrl]);

  const isLeave = attendance?.type === 'sick' || attendance?.type === 'personal';

  return (
    <section className="space-y-6 max-w-2xl mx-auto">
      <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm text-supporting hover:text-secondary cursor-pointer">
        <ArrowLeft className="w-4 h-4" /> {backLabel}
      </button>
      <div>
        <p className="text-sm text-supporting">{formatDate(date)}</p>
        <h1 className="text-2xl font-bold mt-1">{isLeave ? 'Leave details' : 'Attendance details'}</h1>
      </div>

      {!attendance ? <p className="text-sm text-supporting">No attendance recorded for this date.</p> : (
        <>
          {isLeave ? (
            <div className="rounded-xl bg-supporting-2 p-5 space-y-3">
              <span className="inline-block rounded-full bg-yellow-500/20 text-yellow-300 px-3 py-1 text-xs">
                {attendance.type === 'sick' ? 'Sick leave' : 'Personal leave'}
              </span>
              <p className="text-sm text-supporting">Submitted {formatDateTime(attendance.clock_in!)}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium uppercase">{attendance.type}</span>
                <span className={`rounded-full px-3 py-1 text-xs ${attendance.is_late ? 'bg-orange-500/20 text-orange-300' : 'bg-blue-500/20 text-blue-300'}`}>
                  {attendance.is_late ? `Late by ${attendance.late_minutes} minutes` : 'On time'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <AttendanceTimeCard
                  label="Clock In"
                  icon={LogIn}
                  time={attendance.clock_in}
                  caption={attendance.clock_in ? formatDate(attendance.clock_in) : undefined}
                />
                <AttendanceTimeCard
                  label="Clock Out"
                  icon={LogOut}
                  time={attendance.clock_out}
                  caption={attendance.type === 'wfh' ? 'Not required' : attendance.clock_out ? formatDate(attendance.clock_out) : undefined}
                />
              </div>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-supporting">Late</dt>
                  <dd className="font-medium mt-1">{attendance.late_minutes} minutes</dd>
                </div>
                <div>
                  <dt className="text-supporting">Overtime</dt>
                  <dd className="font-medium mt-1">{attendance.overtime_minutes} minutes</dd>
                </div>
              </dl>
            </>
          )}

          <div className="space-y-2">
            <h2 className="text-sm font-medium">{isLeave ? 'Reason' : 'Notes'}</h2>
            <p className="text-sm text-supporting whitespace-pre-wrap">{attendance.detail ?? '—'}</p>
          </div>

          {attachmentUrl && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium">{isLeave ? 'Supporting image' : 'Attendance photo'}</h2>
              <ErrorAlert error={imageError} onDismiss={() => setImageError(null)} />
              {imageLoading && <p role="status" className="text-sm text-supporting">Loading image...</p>}
              {imageUrl && (
                <a href={imageUrl} target="_blank" rel="noreferrer" className="block w-fit">
                  <img src={imageUrl} alt={isLeave ? 'Leave supporting document' : 'WFH attendance'} className="max-h-96 max-w-full rounded-xl object-contain" />
                </a>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
