import { clsx } from 'clsx';
import { type ButtonHTMLAttributes, forwardRef } from 'react';

/* ------------------------------------------------------------------ */
/* Variant / size style maps                                           */
/* ------------------------------------------------------------------ */
const variantStyles = {
  primary:
    'bg-brand-primary text-white hover:bg-indigo-700 active:bg-indigo-800 focus-visible:ring-brand-primary',
  secondary:
    'bg-surface-elevated text-slate-200 hover:bg-slate-600 active:bg-slate-500 border border-slate-600 focus-visible:ring-brand-primary',
  ghost:
    'bg-transparent text-slate-300 hover:bg-surface-elevated hover:text-white active:bg-slate-600 focus-visible:ring-brand-primary',
  danger:
    'bg-status-error text-white hover:bg-rose-600 active:bg-rose-700 focus-visible:ring-status-error',
} as const;

const sizeStyles = {
  sm: 'h-7 px-2.5 text-xs gap-1 rounded',
  md: 'h-9 px-3.5 text-sm gap-1.5 rounded-md',
  lg: 'h-11 px-5 text-base gap-2 rounded-lg',
  icon: 'h-9 w-9 rounded-md justify-center',
} as const;

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */
export type ButtonVariant = keyof typeof variantStyles;
export type ButtonSize = keyof typeof sizeStyles;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      className,
      children,
      ...rest
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center font-medium transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app',
          'disabled:opacity-50 disabled:pointer-events-none',
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...rest}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
