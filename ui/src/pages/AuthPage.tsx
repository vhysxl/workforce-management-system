import { useState, type FormEvent, type ChangeEvent } from 'react';
import * as v from 'valibot';
import { AlertCircle, X } from 'lucide-react';
import { LoginSchema, type LoginInput, type LoginErrors } from '../lib/validation/auth';
import { useAuthStore } from '../stores/authStore';
import Input from '../components/Input';
import Button from '../components/Button';

export default function AuthPage() {
  const [form, setForm] = useState<LoginInput>({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<LoginErrors>();

  const { login, isLoading, error: apiError, clearError } = useAuthStore();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    clearError();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = v.safeParse(LoginSchema, form);
    if (!result.success) {
      setFieldErrors(v.flatten<typeof LoginSchema>(result.issues).nested);
      return;
    }

    setFieldErrors(undefined);
    await login(result.output.email, result.output.password);
  };

  return (
    <div className="min-h-screen bg-primary text-secondary flex items-center justify-center p-6">
      <div className="w-full max-w-[360px]">
        <h1 className="text-2xl font-semibold tracking-tight text-secondary text-center mb-8">
          Welcome Back
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {apiError && (
            <div className="flex items-start justify-between gap-2.5 bg-red-600 text-white rounded-lg p-3 text-xs leading-relaxed shadow-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="whitespace-pre-line">
                  <strong className="font-bold">Error!</strong> {Array.isArray(apiError) ? apiError.join('\n') : apiError}
                </p>
              </div>
              <button
                type="button"
                onClick={clearError}
                className="text-white/80 hover:text-white transition flex-shrink-0 cursor-pointer"
                aria-label="Dismiss error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <Input
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="name@company.com"
            value={form.email}
            onChange={handleChange}
            error={fieldErrors?.email?.[0]}
          />

          <Input
            id="password"
            name="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            error={fieldErrors?.password?.[0]}
          />

          <div className="text-right pt-0.5">
            <span className="text-xs text-supporting">
              If you forgot your password, please contact HR or an administrator.
            </span>
          </div>

          <Button
            type="submit"
            variant="general"
            isLoading={isLoading}
            className="w-full"
          >
            Login
          </Button>
        </form>
      </div>
    </div>
  );
}
