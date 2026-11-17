import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({
  id,
  label,
  error,
  className = '',
  ...props
}: InputProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-secondary mb-1.5">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full px-4 py-2.5 rounded-lg bg-supporting-2 border border-transparent text-secondary placeholder:text-tertiary focus:border-tertiary focus:outline-none transition-colors ${className}`}
        {...props}
      />
      {error && (
        <span className="mt-1 block text-xs text-red-400">
          {error}
        </span>
      )}
    </div>
  );
}
