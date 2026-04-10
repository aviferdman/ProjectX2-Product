/**
 * TASK-182: StatusEmpty — Generic, reusable empty state component.
 *
 * Displays a centered message with an icon, heading, description,
 * and optional call-to-action button. Accepts a custom icon via the
 * `icon` prop or falls back to a default placeholder illustration.
 */
import { clsx } from 'clsx';
import { type HTMLAttributes, type ReactNode, forwardRef } from 'react';

export interface StatusEmptyProps extends HTMLAttributes<HTMLDivElement> {
  /** Custom icon or illustration */
  icon?: ReactNode;
  /** Heading text */
  heading?: string;
  /** Description text */
  description?: string;
  /** Primary action button label */
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

const DefaultIcon = () => (
  <svg
    className="w-16 h-16 text-slate-600"
    fill="none"
    viewBox="0 0 64 64"
    stroke="currentColor"
    strokeWidth="1.5"
    aria-hidden="true"
  >
    <rect x="8" y="16" width="48" height="32" rx="4" />
    <path d="M24 32h16M28 38h8" strokeLinecap="round" />
    <circle cx="32" cy="26" r="3" />
  </svg>
);

export const StatusEmpty = forwardRef<HTMLDivElement, StatusEmptyProps>(
  (
    {
      icon,
      heading = 'Nothing here yet',
      description = 'There are no items to display.',
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
          'cs-status-empty flex flex-col items-center justify-center gap-4',
          compact ? 'py-8 px-4' : 'py-16 px-8',
          'rounded-xl border border-dashed border-slate-700',
          className,
        )}
        role="status"
        {...rest}
      >
        {icon ?? <DefaultIcon />}

        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-100">{heading}</h3>
          {description && (
            <p className="mt-1 text-sm text-slate-400 max-w-md">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {onAction && actionLabel && (
            <button
              type="button"
              onClick={onAction}
              className={clsx(
                'inline-flex items-center gap-2 h-10 px-5',
                'rounded-lg bg-violet-600 text-white text-sm font-medium',
                'shadow-[0_2px_8px_rgba(124,58,237,0.35)]',
                'hover:bg-violet-500 transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
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

StatusEmpty.displayName = 'StatusEmpty';
