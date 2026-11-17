import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'general' | 'danger' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'default' | 'small' | 'icon';
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  general: 'bg-secondary text-primary hover:opacity-90 active:opacity-80',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:opacity-90',
  secondary: 'bg-supporting-2 text-secondary border border-white/10 hover:bg-white/10',
  ghost: 'hover:bg-white/5',
};

const sizeStyles = {
  default: 'py-3 px-4',
  small: 'py-2 px-3',
  icon: 'p-2',
};

export default function Button({
  variant = 'general',
  size = 'default',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`${sizeStyles[size]} rounded-lg font-medium transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
}
