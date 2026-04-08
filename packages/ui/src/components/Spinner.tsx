import { clsx } from 'clsx';
import { type HTMLAttributes, forwardRef } from 'react';

/* ------------------------------------------------------------------ */
/* Spinner                                                             */
/* ------------------------------------------------------------------ */
export interface SpinnerProps extends HTMLAttributes<SVGSVGElement> {
  /** Size in pixels (default 20) */
  size?: number;
}

export const Spinner = forwardRef<SVGSVGElement, SpinnerProps>(
  ({ size = 20, className, ...rest }, ref) => {
    return (
      <svg
        ref={ref}
        className={clsx('animate-spin text-brand-secondary', className)}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        role="status"
        aria-label="Loading"
        {...rest}
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
    );
  },
);

Spinner.displayName = 'Spinner';
