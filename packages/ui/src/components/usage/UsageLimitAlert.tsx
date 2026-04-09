/**
 * UsageLimitAlert — banner shown when usage approaches or exceeds a limit.
 * TASK-152
 */

import { clsx } from 'clsx';
import { type HTMLAttributes, forwardRef } from 'react';
import type { UsageAlertSeverity } from './types.js';

const severityStyles: Record<UsageAlertSeverity, { container: string; icon: string }> = {
  info: {
    container: 'border-sky-700/50 bg-sky-900/20 text-sky-300',
    icon: 'text-sky-400',
  },
  warning: {
    container: 'border-amber-700/50 bg-amber-900/20 text-amber-300',
    icon: 'text-amber-400',
  },
  critical: {
    container: 'border-rose-700/50 bg-rose-900/20 text-rose-300',
    icon: 'text-rose-400',
  },
};

export interface UsageLimitAlertProps extends HTMLAttributes<HTMLDivElement> {
  severity: UsageAlertSeverity;
  /** Alert heading (e.g. "Approaching run limit"). */
  heading: string;
  /** Description or CTA text. */
  description?: string | undefined;
  /** Optional action button label. */
  actionLabel?: string | undefined;
  /** Callback when action button is clicked. */
  onAction?: (() => void) | undefined;
  /** Callback when dismiss is clicked. */
  onDismiss?: (() => void) | undefined;
}

export const UsageLimitAlert = forwardRef<HTMLDivElement, UsageLimitAlertProps>(
  ({ severity, heading, description, actionLabel, onAction, onDismiss, className, ...rest }, ref) => {
    const styles = severityStyles[severity];

    return (
      <div
        ref={ref}
        role="alert"
        className={clsx(
          'cs-usage-limit-alert flex items-start gap-3 rounded-lg border p-4',
          styles.container,
          className,
        )}
        {...rest}
      >
        {/* Icon */}
        <svg
          className={clsx('mt-0.5 h-5 w-5 flex-shrink-0', styles.icon)}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          {severity === 'critical' ? (
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 8a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          ) : (
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
              clipRule="evenodd"
            />
          )}
        </svg>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{heading}</p>
          {description && <p className="mt-1 text-xs opacity-80">{description}</p>}
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className={clsx(
                'mt-2 inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold',
                'bg-white/10 hover:bg-white/20 transition-colors',
              )}
            >
              {actionLabel}
            </button>
          )}
        </div>

        {/* Dismiss */}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="flex-shrink-0 rounded p-1 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        )}
      </div>
    );
  },
);

UsageLimitAlert.displayName = 'UsageLimitAlert';
