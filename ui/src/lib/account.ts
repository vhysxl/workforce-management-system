export interface AccountTokenStatus {
  is_active: boolean;
  purpose: 'activation_account' | 'reset_password' | null;
}

export async function requestAccount<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/auth/${path}`, {
    ...options,
    credentials: 'omit',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join('\n') : data.message);
  return data;
}
