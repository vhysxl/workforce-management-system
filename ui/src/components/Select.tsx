import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}

export default function Select({ id, label, children, className = '', ...props }: SelectProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1.5">{label}</label>
      <select
        id={id}
        className={`w-full px-4 py-2.5 rounded-lg border-r-2 border-transparent bg-supporting-2 text-secondary focus:outline-none focus:ring-1 focus:ring-tertiary ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
