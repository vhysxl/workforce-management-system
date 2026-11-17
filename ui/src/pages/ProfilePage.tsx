import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import ErrorAlert from '../components/ErrorAlert';
import AttendanceCalendar from '../components/AttendanceCalendar';
import AttendanceSummary from '../components/AttendanceSummary';
import { requestProfile, type EmployeeProfile } from '../lib/profile';
import { requestAttendance, type AttendanceHistory } from '../lib/attendance';
import { formatDate, formatDateTime, getTodayDate } from '../lib/date';
import { useAuthStore } from '../stores/authStore';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [history, setHistory] = useState<AttendanceHistory | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [today] = useState(getTodayDate);
  const [year, month] = today.split('-').map(Number);
  const isAdmin = user?.role === 'admin';
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const signOut = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      if (!response.ok) throw new Error('Could not sign out. Please try again.');
      logout();
    } catch (error) {
      setProfileError((error as Error).message);
    } finally {
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    requestProfile()
      .then(setProfile)
      .catch((error) => setProfileError(error.message))
      .finally(() => setProfileLoading(false));
  }, []);

  useEffect(() => {
    if (isAdmin) return;
    requestAttendance<AttendanceHistory>(`/my-history?year=${year}&month=${month}`)
      .then(setHistory)
      .catch((error) => setHistoryError(error.message))
      .finally(() => setHistoryLoading(false));
  }, [year, month, isAdmin]);

  return (
    <section className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
      <ErrorAlert error={profileError} onDismiss={() => setProfileError(null)} />

      {profileLoading && <p role="status" className="text-sm text-supporting">Loading profile...</p>}
      {!profileLoading && !profile && (
        <Button type="button" onClick={() => window.location.reload()}>Reload profile</Button>
      )}
      {profile && (
        <article className="rounded-2xl bg-supporting-2 p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14" />
            <div className="min-w-0">
              <h2 className="text-lg font-semibold break-words">{profile.full_name}</h2>
              <p className="text-sm text-supporting capitalize">{profile.role}</p>
            </div>
          </div>

          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {[
              { label: 'Email', value: <a href={`mailto:${profile.email}`} className="hover:underline">{profile.email}</a> },
              { label: 'Employee ID', value: profile.id },
              { label: 'NIK', value: profile.nik },
              { label: 'Phone number', value: profile.phone_number },
              { label: 'Address', value: profile.address },
              { label: 'Birth place', value: profile.birth_place },
              { label: 'Birth date', value: formatDate(profile.birth_date) },
              { label: 'Marital status', value: profile.marital_status ? <span className="capitalize">{profile.marital_status}</span> : null },
              { label: 'Religion', value: profile.religion ? <span className="capitalize">{profile.religion}</span> : null },
              { label: 'Activated', value: profile.activated_at ? formatDateTime(profile.activated_at) : '—' },
              { label: 'Account created', value: formatDateTime(profile.created_at) },
            ].map(({ label, value }) => (
              <div key={label} className="min-w-0">
                <dt className="text-xs text-supporting mb-1">{label}</dt>
                <dd className="text-sm break-words">{value ?? '—'}</dd>
              </div>
            ))}
          </dl>
        </article>
      )}

      {!isAdmin && (
        <section className="space-y-5" aria-label="Monthly attendance">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold">Attendance this month</h2>
            <Link
              to="/profile/attendance"
              className="text-xs text-blue-300 hover:text-blue-200 hover:underline cursor-pointer"
            >
              View more
            </Link>
          </div>
          <ErrorAlert error={historyError} onDismiss={() => setHistoryError(null)} />
          {historyLoading && <p role="status" className="text-sm text-supporting">Loading attendance...</p>}
          {!historyLoading && !history && (
            <Button type="button" onClick={() => window.location.reload()}>Reload attendance</Button>
          )}
          {history && (
            <>
              <AttendanceSummary records={history.data} />
              <AttendanceCalendar
                year={year}
                month={month}
                today={today}
                records={history.data}
                onSelect={(date) => navigate(`/profile/attendance/${date}?from=profile`)}
              />
            </>
          )}
        </section>
      )}

      <div className="flex justify-end border-t border-white/5 pt-6">
        <Button variant="danger" isLoading={isLoggingOut} onClick={signOut}>Logout</Button>
      </div>
    </section>
  );
}
