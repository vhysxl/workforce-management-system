import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useOutletContext, useSearchParams } from 'react-router';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import ErrorAlert from '../components/ErrorAlert';
import EmployeeStatus from '../components/EmployeeStatus';
import EmployeeActions from '../components/EmployeeActions';
import { requestEmployeeApi, type EmployeeListResponse, type ManagerRole } from '../lib/employees';
import { formatDate } from '../lib/date';

interface EmployeeQuery {
  page: number;
  search: string;
  status: 'all' | 'active' | 'pending' | 'deactivated';
}

const statusFilters: Record<EmployeeQuery['status'], Record<string, string>> = {
  all: {},
  active: { is_activated: '1', is_deactivated: '0' },
  pending: { is_activated: '0', is_deactivated: '0' },
  deactivated: { is_deactivated: '1' },
};

function EmployeeDirectory({ actorRole }: { actorRole: ManagerRole }) {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const page = Number(params.get('page') ?? 1);
  const search = params.get('search') ?? '';
  const status = (params.get('status') ?? 'all') as EmployeeQuery['status'];
  const query = { page, search, status };
  const [list, setList] = useState<EmployeeListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), limit: '10', ...statusFilters[status] });
    if (search) params.set('search', search);
    requestEmployeeApi<EmployeeListResponse>(`/employees?${params}`)
      .then(setList)
      .catch((error) => setError(error.message))
      .finally(() => setIsLoading(false));
  }, [page, search, status]);

  const loadList = (nextQuery: EmployeeQuery) => {
    const params = new URLSearchParams({ page: String(nextQuery.page), status: nextQuery.status });
    if (nextQuery.search) params.set('search', nextQuery.search);
    setParams(params);
  };

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    loadList({ page: 1, search: String(data.get('search')).trim(), status: data.get('status') as EmployeeQuery['status'] });
  };

  return (
    <section className="space-y-6" aria-busy={isLoading}>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
        <Button type="button" disabled={isLoading} onClick={() => navigate('/employees/new')}>Add employee</Button>
      </div>

      <form onSubmit={applyFilters}>
        <fieldset disabled={isLoading} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-48">
            <Input id="employee-search" name="search" label="Search" placeholder="Name, email, or phone" defaultValue={query.search} />
          </div>
          <Select id="employee-status" name="status" label="Status" defaultValue={query.status}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending activation</option>
            <option value="deactivated">Deactivated</option>
          </Select>
          <Button type="submit" variant="secondary" isLoading={isLoading}>Apply</Button>
        </fieldset>
      </form>

      <ErrorAlert error={error} onDismiss={() => setError(null)} />
      {isLoading && <p role="status" className="text-sm text-supporting">Loading employees...</p>}
      {list && (
        <>
          <p className="text-sm text-supporting">{list.meta.total} employees</p>
          {list.data.length === 0 ? (
            <p className="text-sm text-supporting">No employees found.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-supporting-2 text-xs text-supporting">
                  <tr>
                    {['Name', 'Email', 'Phone', 'Role', 'Status', 'Created', 'Actions'].map((label) => (
                      <th key={label} scope="col" className="px-4 py-3 font-medium">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.data.map((employee) => (
                    <tr key={employee.id} className="border-t border-white/5">
                      <td className="px-4 py-3">
                        <Link to={`/employees/${employee.id}`} className="text-blue-300 hover:underline">{employee.full_name}</Link>
                      </td>
                      <td className="px-4 py-3">{employee.email}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{employee.phone_number}</td>
                      <td className="px-4 py-3 capitalize">{employee.role}</td>
                      <td className="px-4 py-3"><EmployeeStatus employee={employee} /></td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(employee.created_at)}</td>
                      <td className="px-4 py-3">
                        <EmployeeActions employee={employee} actorRole={actorRole} onDeactivated={() => loadList({ ...query, page: 1 })} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {list.meta.total > 0 && (
            <nav aria-label="Employee pagination" className="flex items-center justify-between gap-3">
              <span className="text-xs text-supporting">Page {list.meta.page} of {list.meta.totalPages}</span>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" disabled={!list.meta.hasPrevPage} onClick={() => loadList({ ...query, page: query.page - 1 })}>Previous</Button>
                <Button type="button" variant="secondary" disabled={!list.meta.hasNextPage} onClick={() => loadList({ ...query, page: query.page + 1 })}>Next</Button>
              </div>
            </nav>
          )}
        </>
      )}
    </section>
  );
}

export default function EmployeesPage() {
  const role = useOutletContext<ManagerRole>();
  return <EmployeeDirectory actorRole={role} />;
}
