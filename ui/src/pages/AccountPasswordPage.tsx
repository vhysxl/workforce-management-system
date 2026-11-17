import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import Button from '../components/Button';
import Input from '../components/Input';
import ErrorAlert from '../components/ErrorAlert';
import { requestAccount, type AccountTokenStatus } from '../lib/account';

interface AccountPasswordPageProps {
  token: string;
}

export default function AccountPasswordPage({ token }: AccountPasswordPageProps) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<AccountTokenStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    requestAccount<AccountTokenStatus>(`check-token?token=${encodeURIComponent(token)}`)
      .then(setStatus)
      .catch((error) => setError(error.message))
      .finally(() => setIsLoading(false));
  }, [token]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get('password'));
    if (password !== data.get('confirm_password')) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setIsSaving(true);
    const endpoint = status!.purpose === 'activation_account' ? 'activate-account' : 'reset-password';
    requestAccount<{ message: string }>(endpoint, { method: 'POST', body: JSON.stringify({ token, password }) })
      .then((result) => setSuccess(result.message))
      .catch((error) => setError(error.message))
      .finally(() => setIsSaving(false));
  };

  return (
    <main className="min-h-screen bg-primary text-secondary flex items-center justify-center p-6">
      <section className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-semibold">{status?.purpose ? (status.purpose === 'activation_account' ? 'Activate your account' : 'Reset your password') : 'Set your password'}</h1>
        <ErrorAlert error={error} onDismiss={() => setError(null)} />
        {isLoading && <p role="status" className="text-sm text-supporting">Checking link...</p>}
        {!isLoading && !status && <Button type="button" variant="secondary" onClick={() => window.location.reload()}>Try again</Button>}
        {status && !status.is_active && <p className="text-sm text-supporting">This link is invalid or expired. Contact HR or an administrator for a new link.</p>}
        {success ? <p role="status" className="text-sm text-blue-300">{success}</p> : status?.is_active && (
          <form onSubmit={submit} className="space-y-5">
            <fieldset disabled={isSaving} className="space-y-4">
              <Input id="account-password" name="password" type="password" autoComplete="new-password" label="New password" required minLength={8} maxLength={255} />
              <p className="text-xs text-supporting">At least 8 characters, including uppercase, lowercase, a number, and a symbol.</p>
              <Input id="account-confirm-password" name="confirm_password" type="password" autoComplete="new-password" label="Confirm password" required minLength={8} maxLength={255} />
            </fieldset>
            <Button type="submit" isLoading={isSaving} className="w-full">{status.purpose === 'activation_account' ? 'Activate account' : 'Reset password'}</Button>
          </form>
        )}
        {(success || (status && !status.is_active)) && <Button type="button" variant="secondary" className="w-full" onClick={() => navigate('/', { replace: true })}>Continue to app</Button>}
      </section>
    </main>
  );
}
