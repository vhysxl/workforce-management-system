import { useEffect, useState, type FormEvent } from 'react';
import { LogIn, LogOut } from 'lucide-react';
import AttendanceTimeCard from '../components/AttendanceTimeCard';
import Button from '../components/Button';
import ErrorAlert from '../components/ErrorAlert';
import Input from '../components/Input';
import { requestAttendance, type Attendance } from '../lib/attendance';
import LeavePage from './LeavePage';

const statuses = {
  unrecorded: { label: 'Not Clocked In', style: 'bg-amber-950/40 text-amber-500 border-amber-900/50' },
  wfo: { label: 'Clocked In', style: 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50' },
  wfh: { label: 'WFH Recorded', style: 'bg-blue-950/40 text-blue-400 border-blue-900/50' },
  completed: { label: 'Completed', style: 'bg-blue-950/40 text-blue-400 border-blue-900/50' },
  sick: { label: 'Sick Leave', style: 'bg-amber-950/40 text-amber-500 border-amber-900/50' },
  personal: { label: 'On Leave', style: 'bg-amber-950/40 text-amber-500 border-amber-900/50' },
};

const actions = {
  wfo: { label: 'Clock In', path: '/wfo/clock-in', icon: LogIn },
  wfh: { label: 'Submit WFH', path: '/wfh', icon: LogIn },
  clockOut: { label: 'Clock Out', path: '/wfo/clock-out', icon: LogOut },
};

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<Attendance | null>();
  const [selectedPage, setSelectedPage] = useState<'leave' | 'attendance'>('attendance');
  const [mode, setMode] = useState<'wfo' | 'wfh'>('wfo');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayDate] = useState(() => new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }));

  useEffect(() => {
    requestAttendance('/today')
      .then(setAttendance)
      .catch((error) => setError(error.message))
      .finally(() => setIsLoading(false));
  }, []);

  let page = selectedPage;
  if (attendance) {
    page = attendance.type === 'sick' || attendance.type === 'personal' ? 'leave' : 'attendance';
  }
  const canClockOut = attendance?.type === 'wfo' && !attendance.clock_out;
  const isComplete = Boolean(attendance && !canClockOut);
  const selectedMode = attendance?.type ?? mode;
  const status = statuses[attendance?.clock_out ? 'completed' : attendance?.type ?? 'unrecorded'];
  const action = actions[canClockOut ? 'clockOut' : mode];
  const ActionIcon = action.icon;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading || attendance === undefined || isComplete) return;

    const body = mode === 'wfh' && !canClockOut ? new FormData(event.currentTarget) : undefined;

    setIsLoading(true);
    setError(null);
    try {
      setAttendance(await requestAttendance(action.path, { method: 'POST', body }));
    } catch (error) {
      setError((error as Error).message);
      try {
        setAttendance(await requestAttendance('/today'));
      } catch {
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="space-y-8 max-w-2xl mx-auto pt-4" aria-busy={isLoading}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-supporting">{todayDate}</p>
          <h1 className="text-2xl font-bold tracking-tight text-secondary mt-1">
            {page === 'leave' ? "Today's Leave" : "Today's Attendance"}
          </h1>
        </div>
        {attendance !== undefined && (
          <span className={`mt-1 text-xs px-3.5 py-1 rounded-full font-medium border ${status.style}`}>
            {status.label}
          </span>
        )}
      </div>

      <ErrorAlert error={error} onDismiss={() => setError(null)} />

      {attendance === undefined && (
        isLoading ? <p role="status" className="text-sm text-supporting">Loading attendance...</p> : (
          <Button type="button" onClick={() => window.location.reload()}>Try again</Button>
        )
      )}

      {attendance !== undefined && page === 'leave' && (
        <LeavePage
          attendance={attendance}
          onSaved={setAttendance}
          onBack={() => setSelectedPage('attendance')}
        />
      )}

      {attendance !== undefined && page === 'attendance' && (
        <>
          <div>
            <div className="flex items-center justify-between gap-4 mb-1.5">
              <label htmlFor="work-mode" className="text-sm font-medium">Work mode</label>
              {!attendance && (
                <button
                  type="button"
                  onClick={() => setSelectedPage('leave')}
                  disabled={isLoading}
                  className="text-xs text-red-400 hover:text-red-300 hover:underline cursor-pointer disabled:opacity-50"
                >
                  Take leave
                </button>
              )}
            </div>
            <select
              id="work-mode"
              name="workMode"
              value={selectedMode}
              onChange={(event) => setMode(event.target.value as 'wfo' | 'wfh')}
              disabled={isLoading || Boolean(attendance)}
              className="w-full px-4 py-2.5 rounded-lg border-r-2 border-transparent bg-supporting-2 text-secondary focus:outline-none focus:ring-1 focus:ring-tertiary"
            >
              <option value="wfo">WFO</option>
              <option value="wfh">WFH</option>
            </select>
          </div>

          <div className="text-center py-2">
            <p className="text-xs text-supporting font-medium">Office Hour</p>
            <p className="text-3xl font-bold tracking-tight text-secondary my-1">08:00 - 17:00</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <AttendanceTimeCard label="Clock In" icon={LogIn} time={attendance?.clock_in} />
            <AttendanceTimeCard
              label="Clock Out"
              icon={LogOut}
              time={attendance?.clock_out}
              caption={attendance?.type === 'wfh' ? 'Not required' : attendance?.clock_out ? `Overtime ${attendance.overtime_minutes} minutes` : undefined}
            />
          </div>

          {attendance?.detail && <p className="text-sm text-supporting whitespace-pre-wrap">{attendance.detail}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {selectedMode === 'wfh' && !attendance && (
              <fieldset disabled={isLoading} className="space-y-4">
                <Input
                  id="wfh-image"
                  name="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  label="Attendance photo"
                  required
                  aria-describedby="wfh-image-help"
                />
                <p id="wfh-image-help" className="text-xs text-supporting">JPG, PNG, or WebP. Up to 10 MB.</p>
                <div>
                  <label htmlFor="wfh-detail" className="block text-sm font-medium mb-1.5">Notes (optional)</label>
                  <textarea
                    id="wfh-detail"
                    name="detail"
                    maxLength={500}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg bg-supporting-2 text-secondary focus:outline-none focus:ring-1 focus:ring-tertiary"
                  />
                </div>
              </fieldset>
            )}
            <Button
              type="submit"
              isLoading={isLoading}
              disabled={isComplete}
              className="w-full rounded-full flex items-center justify-center gap-2"
            >
              {!isComplete && <ActionIcon className="w-4 h-4" />}
              {isComplete ? 'Attendance Completed' : action.label}
            </Button>
          </form>
        </>
      )}
    </section>
  );
}
