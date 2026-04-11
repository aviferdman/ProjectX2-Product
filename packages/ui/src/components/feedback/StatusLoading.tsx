/**
 * TASK-182: StatusLoading — Full-area loading state component.
 *
 * Displays a centered spinner with an optional message and progress indicator.
 * Supports an overlay mode that covers its parent container.
 */
import { clsx } from 'clsx';
import { type HTMLAttributes, forwardRef } from 'react';

export interface StatusLoadingProps extends HTMLAttributes<HTMLDivElement> {
  /** Spinner size in pixels (default 32) */
  size?: number;
  /** Loading message displayed below the spinner */
  message?: string;
  /** Optional progress value 0-100. Shows a progress bar when set. */
  progress?: number;
  /** Overlay mode: renders a semi-transparent backdrop that covers its parent. */
  overlay?: boolean;
  /** Compact variant (less padding) */
  compact?: boolean;
}

export const StatusLoading = forwardRef<HTMLDivElement, StatusLoadingProps>(
  (
    {
      size = 32,
      message,
      progress,
      overlay = false,
      compact = false,
      className,
      ...rest
    },
    ref,
  ) => {
    const showProgress = typeof progress === 'number';

    return (
      <div
        ref={ref}
        className={clsx(
          'cs-status-loading flex flex-col items-center justify-center gap-3',
          overlay && 'absolute inset-0 bg-slate-950/70 z-10 rounded-xl',
          !overlay && (compact ? 'py-8 px-4' : 'py-16 px-8'),
          className,
        )}
        role="status"
        aria-label={message ?? 'Loading'}
        {...rest}
      >
        <svg
          className="animate-spin text-indigo-400"
          width={size}
          height={size}
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

        {message && (
          <p className="text-sm text-slate-400">{message}</p>
        )}

        {showProgress && (
          <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        )}
      </div>
    );
  },
);

StatusLoading.displayName = 'StatusLoading';
