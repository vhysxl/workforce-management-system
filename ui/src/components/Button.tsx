import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'general' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  general: 'bg-secondary text-primary hover:opacity-90 active:opacity-80',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:opacity-90',
};

export default function Button({
  variant = 'general',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`py-3 px-4 rounded-lg font-medium transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
}
