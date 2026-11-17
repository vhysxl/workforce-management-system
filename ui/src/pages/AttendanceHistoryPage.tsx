import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import AttendanceCalendar from '../components/AttendanceCalendar';
import AttendanceSummary from '../components/AttendanceSummary';
import Button from '../components/Button';
import ErrorAlert from '../components/ErrorAlert';
import { requestAttendance, type AttendanceHistory } from '../lib/attendance';
import { getTodayDate } from '../lib/date';
import type { EmployeeProfile } from '../lib/profile';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function AttendanceHistoryPage() {
  const { employeeId } = useParams();
  const employee = useOutletContext<EmployeeProfile | undefined>();
  const [search, setSearch] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [today] = useState(getTodayDate);
  const [currentYear, currentMonth] = today.split('-').map(Number);
  const year = Number(search.get('year') ?? currentYear);
  const monthParam = search.get('month');
  const month = monthParam === 'all' ? '' : monthParam ?? String(currentMonth);
  const filters = { year, month };
  const [history, setHistory] = useState<AttendanceHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const historyPath = employeeId ? `/employees/${employeeId}` : '/my-history';
  const historyUrl = employeeId ? `/employees/${employeeId}/attendance` : '/profile/attendance';

  useEffect(() => {
    const params = new URLSearchParams({ year: String(year) });
    if (month) params.set('month', month);

    requestAttendance<AttendanceHistory>(`${historyPath}?${params}`)
      .then(setHistory)
      .catch((error) => setError(error.message))
      .finally(() => setIsLoading(false));
  }, [year, month, historyPath]);

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSearch({ year: String(data.get('year')), month: String(data.get('month')) || 'all' });
  };

  const visibleMonths = filters.month ? [Number(filters.month)] : months.map((_, index) => index + 1);

  return (
    <section className="space-y-8" aria-busy={isLoading}>
      <Link to={employeeId ? `/employees/${employeeId}` : '/profile'} className="flex items-center gap-2 text-sm text-supporting hover:text-secondary cursor-pointer">
        <ArrowLeft className="w-4 h-4" /> {employee ? 'Back to employee' : 'Back to profile'}
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Attendance history</h1>
        {employee && <p className="text-sm text-supporting mt-2">{employee.full_name}</p>}
      </div>

      <form onSubmit={applyFilters}>
        <fieldset disabled={isLoading} className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="history-year" className="block text-sm font-medium mb-1.5">Year</label>
            <input
              id="history-year"
              name="year"
              type="number"
              required
              min={2000}
              max={2100}
              defaultValue={filters.year}
              className="w-28 px-4 py-2.5 rounded-lg bg-supporting-2 text-secondary focus:outline-none focus:ring-1 focus:ring-tertiary"
            />
          </div>
          <div>
            <label htmlFor="history-month" className="block text-sm font-medium mb-1.5">Month</label>
            <select
              id="history-month"
              name="month"
              defaultValue={filters.month}
              className="px-4 py-2.5 rounded-lg border-r-2 border-transparent bg-supporting-2 text-secondary focus:outline-none focus:ring-1 focus:ring-tertiary"
            >
              <option value="">All months</option>
              {months.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
            </select>
          </div>
          <Button type="submit" isLoading={isLoading}>Apply</Button>
        </fieldset>
      </form>

      <ErrorAlert error={error} onDismiss={() => setError(null)} />
      {isLoading && <p role="status" className="text-sm text-supporting">Loading attendance...</p>}

      {history && (
        <>
          <AttendanceSummary records={history.data} />

          <section className="space-y-5" aria-label="Attendance calendars">
            <h2 className="text-base font-semibold">{filters.month ? `${months[Number(filters.month) - 1]} ${filters.year}` : `${filters.year} overview`}</h2>
            <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
              {visibleMonths.map((month) => {
                const prefix = `${filters.year}-${String(month).padStart(2, '0')}`;
                return (
                  <AttendanceCalendar
                    key={month}
                    year={filters.year}
                    month={month}
                    today={today}
                    records={history.data.filter((record) => record.date.startsWith(prefix))}
                    onSelect={(date) => navigate(`${historyUrl}/${date}${location.search}`)}
                  />
                );
              })}
            </div>
          </section>

        </>
      )}
    </section>
  );
}
