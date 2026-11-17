import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import Button from '../components/Button';
import ErrorAlert from '../components/ErrorAlert';
import EmployeeForm from '../components/EmployeeForm';
import EmployeeStatus from '../components/EmployeeStatus';
import EmployeeActions from '../components/EmployeeActions';
import { canManageEmployee, requestEmployeeApi, type EmployeeDetail, type EmployeeInput, type ManagerRole } from '../lib/employees';
import { formatDateTime } from '../lib/date';

interface EmployeeEditorPageProps {
  employeeId?: string;
  actorRole: ManagerRole;
  onBack: () => void;
}

export default function EmployeeEditorPage({ employeeId, actorRole, onBack }: EmployeeEditorPageProps) {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(employeeId));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!employeeId) return;
    requestEmployeeApi<EmployeeDetail>(`/employees/${employeeId}`)
      .then(setEmployee)
      .catch((error) => setError(error.message))
      .finally(() => setIsLoading(false));
  }, [employeeId]);

  const save = (data: EmployeeInput) => {
    setIsSaving(true);
    setError(null);
    setSuccess('');
    requestEmployeeApi<EmployeeDetail>(employee ? `/employees/${employee.id}` : '/employees', {
      method: employee ? 'PUT' : 'POST', body: JSON.stringify(data),
    })
      .then((updated) => {
        if (!employee) {
          navigate(`/employees/${updated.id}`, { replace: true });
          return;
        }
        setEmployee(updated);
        setSuccess(employee ? 'Employee updated.' : 'Employee created. Use the account actions menu to generate an activation link.');
      })
      .catch((error) => setError(error.message))
      .finally(() => setIsSaving(false));
  };

  const readOnly = Boolean(employee && (employee.deactivated_at || !canManageEmployee(actorRole, employee.role)));

  return (
    <section className="space-y-6" aria-busy={isLoading || isSaving}>
      <Button type="button" variant="ghost" size="small" onClick={onBack} disabled={isSaving} className="flex items-center gap-2 text-sm text-supporting">
        <ArrowLeft className="w-4 h-4" /> Back to employees
      </Button>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{employee ? employee.full_name : employeeId ? 'Employee details' : 'Add employee'}</h1>
          {employee && <p className="text-xs text-supporting mt-2 break-all">{employee.id}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {employee && employee.role !== 'admin' && (
            <Button type="button" variant="secondary" size="small" disabled={isSaving} onClick={() => navigate(`/employees/${employee.id}/attendance`)}>View attendance</Button>
          )}
          {employee && !isSaving && <EmployeeActions employee={employee} actorRole={actorRole} onDeactivated={(updated) => { setEmployee({ ...employee, ...updated }); setSuccess('Employee deactivated.'); }} />}
        </div>
      </div>
      <ErrorAlert error={error} onDismiss={() => setError(null)} />
      {success && <p role="status" className="text-sm text-blue-300">{success}</p>}
      {isLoading && <p role="status" className="text-sm text-supporting">Loading employee...</p>}
      {employee && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-supporting">
          <EmployeeStatus employee={employee} />
          <span>Created {formatDateTime(employee.created_at)}</span>
          {employee.activated_at && <span>Activated {formatDateTime(employee.activated_at)}</span>}
          {employee.deactivated_at && <span>Deactivated {formatDateTime(employee.deactivated_at)}</span>}
        </div>
      )}
      {readOnly && <p className="text-sm text-supporting">{employee?.deactivated_at ? 'This employee has been deactivated.' : 'Your role can view this employee.'}</p>}
      {!isLoading && (!employeeId || employee) && (
        <EmployeeForm
          key={employee ? `${employee.id}-${employee.updated_at}` : 'create'}
          employee={employee ?? undefined}
          actorRole={actorRole}
          readOnly={readOnly}
          isSaving={isSaving}
          onSubmit={save}
          onCancel={onBack}
        />
      )}
    </section>
  );
}
