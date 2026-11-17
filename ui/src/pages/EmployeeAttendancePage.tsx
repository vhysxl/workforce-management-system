import { useEffect, useState } from 'react';
import { Link, Outlet, useParams } from 'react-router';
import ErrorAlert from '../components/ErrorAlert';
import { requestEmployeeApi, type EmployeeDetail } from '../lib/employees';

export default function EmployeeAttendancePage() {
  const { employeeId } = useParams();
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    requestEmployeeApi<EmployeeDetail>(`/employees/${employeeId}`)
      .then(setEmployee)
      .catch((error) => setError(error.message))
      .finally(() => setIsLoading(false));
  }, [employeeId]);

  if (employee) return <Outlet context={employee} />;
  return (
    <section className="space-y-4">
      <Link to={`/employees/${employeeId}`} className="text-sm text-supporting hover:text-secondary">Back to employee</Link>
      <ErrorAlert error={error} onDismiss={() => setError(null)} />
      {isLoading && <p role="status" className="text-sm text-supporting">Loading employee...</p>}
    </section>
  );
}
