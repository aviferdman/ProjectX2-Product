import { clsx } from 'clsx';
import { type InputHTMLAttributes, forwardRef } from 'react';

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Optional label shown above the input */
  label?: string;
  /** Error message — switches to error styling when set */
  error?: string;
  /** Helper text below the input */
  helperText?: string;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-property-label text-slate-300"
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'h-8 w-full rounded-md px-3 text-sm',
            'bg-surface-card border outline-none transition-colors duration-150',
            'text-slate-100 placeholder:text-slate-500',
            error
              ? 'border-status-error focus:ring-1 focus:ring-status-error'
              : 'border-slate-700 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className,
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error
              ? `${inputId}-error`
              : helperText
                ? `${inputId}-helper`
                : undefined
          }
          {...rest}
        />

        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs text-status-error"
            role="alert"
          >
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="text-xs text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
