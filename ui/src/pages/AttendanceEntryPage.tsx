import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router';
import ErrorAlert from '../components/ErrorAlert';
import { requestAttendance, type Attendance, type AttendanceHistory } from '../lib/attendance';
import type { EmployeeDetail } from '../lib/employees';
import AttendanceDetailPage from './AttendanceDetailPage';

export default function AttendanceEntryPage() {
  const { employeeId, date } = useParams();
  const employee = useOutletContext<EmployeeDetail | undefined>();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const historyPath = employeeId ? `/employees/${employeeId}` : '/my-history';
  const historyUrl = employeeId ? `/employees/${employeeId}/attendance` : '/profile/attendance';
  const fromProfile = search.get('from') === 'profile';
  const backUrl = fromProfile ? '/profile' : historyUrl + (search.size ? `?${search}` : '');

  useEffect(() => {
    const [year, month] = date!.split('-');
    requestAttendance<AttendanceHistory>(`${historyPath}?year=${year}&month=${Number(month)}`)
      .then((data) => setAttendance(data.data.find((record) => record.date === date) ?? null))
      .catch((error) => setError(error.message))
      .finally(() => setIsLoading(false));
  }, [date, historyPath]);

  if (isLoading) return <p role="status" className="text-sm text-supporting">Loading attendance...</p>;
  if (error) return <ErrorAlert error={error} onDismiss={() => navigate(backUrl)} />;
  return (
    <AttendanceDetailPage
      date={date!}
      attendance={attendance}
      employeeName={employee?.full_name}
      onBack={() => navigate(backUrl)}
      backLabel={fromProfile ? 'Back to profile' : 'Back to history'}
    />
  );
}
