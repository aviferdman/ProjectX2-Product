/**
 * ErrorFallback — Reusable error display component for error states across all screens.
 * TASK-181: Error handling and edge cases
 *
 * Provides a styled error message with optional retry and secondary actions.
 * Designed to work standalone or as a fallback for ErrorBoundary.
 */
import { clsx } from 'clsx';
import { type HTMLAttributes, forwardRef } from 'react';

export type ErrorSeverity = 'error' | 'warning';

export interface ErrorFallbackProps extends HTMLAttributes<HTMLDivElement> {
  /** Error heading text */
  heading?: string | undefined;
  /** Error message or description */
  message?: string | undefined;
  /** Error severity affects icon and styling */
  severity?: ErrorSeverity | undefined;
  /** Label for the primary retry action */
  retryLabel?: string | undefined;
  /** Callback when retry is clicked */
  onRetry?: (() => void) | undefined;
  /** Label for the secondary action (e.g. "Go Back") */
  secondaryLabel?: string | undefined;
  /** Callback when secondary action is clicked */
  onSecondary?: (() => void) | undefined;
  /** Render inline (no padding/border) for embedding in other components */
  inline?: boolean | undefined;
}

const ErrorIcon = () => (
  <svg
    className="w-12 h-12 text-red-400"
    fill="none"
    viewBox="0 0 48 48"
    stroke="currentColor"
    strokeWidth="1.5"
    aria-hidden="true"
  >
    <circle cx="24" cy="24" r="20" />
    <path d="M24 16v10" strokeLinecap="round" />
    <circle cx="24" cy="32" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

const WarningIcon = () => (
  <svg
    className="w-12 h-12 text-amber-400"
    fill="none"
    viewBox="0 0 48 48"
    stroke="currentColor"
    strokeWidth="1.5"
    aria-hidden="true"
  >
    <path d="M24 6L4 42h40L24 6z" />
    <path d="M24 20v10" strokeLinecap="round" />
    <circle cx="24" cy="36" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

export const ErrorFallback = forwardRef<HTMLDivElement, ErrorFallbackProps>(
  (
    {
      heading = 'Something went wrong',
      message = 'An unexpected error occurred. Please try again.',
      severity = 'error',
      retryLabel = 'Try Again',
      onRetry,
      secondaryLabel,
      onSecondary,
      inline = false,
      className,
      ...rest
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={clsx(
          'cs-error-fallback flex flex-col items-center justify-center gap-4',
          !inline && 'py-16 px-8 rounded-xl border border-dashed',
          !inline && severity === 'error' && 'border-red-800/50',
          !inline && severity === 'warning' && 'border-amber-800/50',
          className,
        )}
        {...rest}
      >
        {severity === 'error' ? <ErrorIcon /> : <WarningIcon />}

        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-100">{heading}</h3>
          <p className="mt-1 text-sm text-slate-400 max-w-md">{message}</p>
        </div>

        <div className="flex items-center gap-3">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className={clsx(
                'inline-flex items-center gap-2 h-10 px-5',
                'rounded-lg text-white text-sm font-medium',
                'transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app',
                severity === 'error' && 'bg-red-600 hover:bg-red-500 focus-visible:ring-red-500',
                severity === 'warning' && 'bg-amber-600 hover:bg-amber-500 focus-visible:ring-amber-500',
              )}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M2 8a6 6 0 0111.2-3M14 8a6 6 0 01-11.2 3" />
                <path d="M14 2v3h-3M2 14v-3h3" />
              </svg>
              {retryLabel}
            </button>
          )}

          {onSecondary && secondaryLabel && (
            <button
              type="button"
              onClick={onSecondary}
              className={clsx(
                'inline-flex items-center h-10 px-5',
                'rounded-lg text-sm font-medium',
                'bg-slate-800 text-slate-300 hover:bg-slate-700',
                'transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app',
              )}
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      </div>
    );
  },
);

ErrorFallback.displayName = 'ErrorFallback';
