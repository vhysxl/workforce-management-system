import { useId, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import Button from './Button';
import Dialog from './Dialog';
import ErrorAlert from './ErrorAlert';
import Input from './Input';
import { canManageEmployee, requestEmployeeApi, type EmployeeListItem, type ManagerRole } from '../lib/employees';
import { useAuthStore } from '../stores/authStore';

interface EmployeeActionsProps {
  employee: EmployeeListItem;
  actorRole: ManagerRole;
  onDeactivated: (employee: EmployeeListItem) => void;
}

type Action = 'activate' | 'reset' | 'deactivate';
const titles = { activate: 'Activate account', reset: 'Reset password', deactivate: 'Deactivate account' };

export default function EmployeeActions({ employee, actorRole, onDeactivated }: EmployeeActionsProps) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [action, setAction] = useState<Action | null>(null);
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openAction = (nextAction: Action) => {
    menuRef.current!.hidePopover();
    setAction(nextAction);
    setLink('');
    setCopied(false);
    setError(null);
    if (nextAction === 'deactivate') return;

    setIsLoading(true);
    const endpoint = nextAction === 'activate' ? 'issue-activation-token' : 'issue-reset-password-token';
    requestEmployeeApi<{ raw_token: string }>(`/auth/${endpoint}`, {
      method: 'POST', body: JSON.stringify({ employee_id: employee.id }),
    })
      .then((data) => setLink(`${window.location.origin}/account/password?token=${encodeURIComponent(data.raw_token)}`))
      .catch((error) => setError(error.message))
      .finally(() => setIsLoading(false));
  };

  const deactivate = () => {
    setIsLoading(true);
    setError(null);
    requestEmployeeApi<EmployeeListItem>(`/employees/${employee.id}/deactivate`, { method: 'PATCH' })
      .then((updated) => {
        setAction(null);
        onDeactivated(updated);
      })
      .catch((error) => setError(error.message))
      .finally(() => setIsLoading(false));
  };

  const copyLink = () => {
    setError(null);
    navigator.clipboard.writeText(link)
      .then(() => setCopied(true))
      .catch(() => setError('Could not copy the link. Select and copy it manually.'));
  };

  if (!canManageEmployee(actorRole, employee.role)) return null;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        popoverTarget={menuId}
        aria-label={`Account actions for ${employee.full_name}`}
        onClick={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          setPosition({ top: Math.min(bounds.bottom + 4, window.innerHeight - 160), left: Math.max(8, bounds.right - 192) });
        }}
      >
        <MoreHorizontal className="w-5 h-5" />
      </Button>
      <div ref={menuRef} id={menuId} popover="auto" style={{ position: 'fixed', inset: 'auto', margin: 0, ...position }} className="w-48 rounded-xl bg-supporting-2 text-secondary border border-white/10 p-1 shadow-xl">
        {(!employee.activated_at || employee.deactivated_at) && <Button type="button" variant="ghost" size="small" className="w-full text-left text-sm" onClick={() => openAction('activate')}>Activate account</Button>}
        {!employee.deactivated_at && employee.activated_at && <Button type="button" variant="ghost" size="small" className="w-full text-left text-sm" onClick={() => openAction('reset')}>Reset password</Button>}
        {!employee.deactivated_at && employee.id !== currentUserId && <Button type="button" variant="ghost" size="small" className="w-full text-left text-sm text-red-400" onClick={() => openAction('deactivate')}>Deactivate account</Button>}
      </div>

      {action && (
        <Dialog title={titles[action]} isBusy={isLoading} onClose={() => setAction(null)}>
          <div className="space-y-5">
            <p className="text-sm text-supporting">{employee.full_name} · {employee.email}</p>
            <ErrorAlert error={error} onDismiss={() => setError(null)} />
            {action === 'deactivate' ? (
              <>
                <p className="text-sm">This employee will lose access to their account.</p>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="secondary" disabled={isLoading} onClick={() => setAction(null)}>Cancel</Button>
                  <Button type="button" variant="danger" isLoading={isLoading} onClick={deactivate}>Deactivate account</Button>
                </div>
              </>
            ) : (
              <>
                {isLoading && <p role="status" className="text-sm text-supporting">Generating link...</p>}
                {link && (
                  <>
                    <Input id={`account-link-${employee.id}`} label={action === 'activate' ? 'Activation link' : 'Password reset link'} value={link} readOnly onFocus={(event) => event.target.select()} />
                    <p className="text-xs text-supporting">Share this link with the employee. It expires in 24 hours. Generating a new link replaces the previous one.</p>
                    <Button type="button" onClick={copyLink}>{copied ? 'Copied' : 'Copy link'}</Button>
                  </>
                )}
                {!link && !isLoading && <Button type="button" onClick={() => openAction(action)}>Try again</Button>}
              </>
            )}
          </div>
        </Dialog>
      )}
    </>
  );
}
