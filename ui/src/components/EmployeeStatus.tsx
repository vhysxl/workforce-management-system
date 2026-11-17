import type { EmployeeListItem } from '../lib/employees';

interface EmployeeStatusProps {
  employee: EmployeeListItem;
}

export default function EmployeeStatus({ employee }: EmployeeStatusProps) {
  let label = 'Pending activation';
  let color = 'bg-yellow-500/20 text-yellow-300';
  if (employee.deactivated_at) {
    label = 'Deactivated';
    color = 'bg-red-500/20 text-red-300';
  } else if (employee.activated_at) {
    label = 'Active';
    color = 'bg-blue-500/20 text-blue-300';
  }

  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs whitespace-nowrap ${color}`}>{label}</span>;
}
