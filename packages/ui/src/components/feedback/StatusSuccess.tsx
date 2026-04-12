/**
 * TASK-182: StatusSuccess — Success confirmation component.
 *
 * Displays an animated checkmark with heading, message, and optional actions.
 * Designed for full-area success states (e.g. form submission, operation complete).
 */
import { clsx } from 'clsx';
import { type HTMLAttributes, type ReactNode, forwardRef } from 'react';

export interface StatusSuccessProps extends HTMLAttributes<HTMLDivElement> {
  /** Custom icon (overrides the default checkmark) */
  icon?: ReactNode;
  /** Success heading */
  heading?: string;
  /** Success description */
  message?: string;
  /** Primary action label */
  actionLabel?: string;
  /** Primary action callback */
  onAction?: () => void;
  /** Secondary action label */
  secondaryLabel?: string;
  /** Secondary action callback */
  onSecondary?: () => void;
  /** Compact variant (less padding) */
  compact?: boolean;
}

const CheckIcon = () => (
  <svg
    className="w-16 h-16 text-emerald-400"
    fill="none"
    viewBox="0 0 64 64"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <circle cx="32" cy="32" r="28" className="opacity-20" />
    <circle cx="32" cy="32" r="28" strokeDasharray="176" strokeDashoffset="0" />
    <path d="M20 33l8 8 16-16" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const StatusSuccess = forwardRef<HTMLDivElement, StatusSuccessProps>(
  (
    {
      icon,
      heading = 'Success!',
      message,
      actionLabel,
      onAction,
      secondaryLabel,
      onSecondary,
      compact = false,
      className,
      ...rest
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'cs-status-success flex flex-col items-center justify-center gap-4',
          compact ? 'py-8 px-4' : 'py-16 px-8',
          'rounded-xl border border-emerald-800/50',
          className,
        )}
        role="status"
        aria-label={heading}
        {...rest}
      >
        {icon ?? <CheckIcon />}

        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-100">{heading}</h3>
          {message && <p className="mt-1 text-sm text-slate-400 max-w-md">{message}</p>}
        </div>

        <div className="flex items-center gap-3">
          {onAction && actionLabel && (
            <button
              type="button"
              onClick={onAction}
              className={clsx(
                'inline-flex items-center gap-2 h-10 px-5',
                'rounded-lg bg-emerald-600 text-white text-sm font-medium',
                'hover:bg-emerald-500 transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                'focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app',
              )}
            >
              {actionLabel}
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
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500',
                'focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app',
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

StatusSuccess.displayName = 'StatusSuccess';
