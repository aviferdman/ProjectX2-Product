/**
 * TASK-182: Toast — Individual toast notification component.
 *
 * Renders a single toast notification with variant styling, optional close button,
 * and auto-dismiss timer. Designed to be rendered inside a ToastContainer.
 */
import { clsx } from 'clsx';
import { type HTMLAttributes, forwardRef, useEffect, useRef, useCallback } from 'react';
import type { ToastVariant } from './types.js';

export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  /** Toast variant determines icon and color */
  variant?: ToastVariant;
  /** Toast title (required) */
  title: string;
  /** Optional description message */
  message?: string;
  /** Auto-dismiss duration in ms (0 = no auto-dismiss). Default: 5000 */
  duration?: number;
  /** Whether the toast can be manually dismissed. Default: true */
  dismissible?: boolean;
  /** Callback when the toast is dismissed */
  onDismiss?: () => void;
}

const VARIANT_STYLES: Record<ToastVariant, { container: string; icon: string }> = {
  success: {
    container: 'border-emerald-800/50',
    icon: 'text-emerald-400',
  },
  error: {
    container: 'border-red-800/50',
    icon: 'text-red-400',
  },
  warning: {
    container: 'border-amber-800/50',
    icon: 'text-amber-400',
  },
  info: {
    container: 'border-sky-800/50',
    icon: 'text-sky-400',
  },
};

const SuccessIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <circle cx="10" cy="10" r="8" />
    <path d="M6.5 10.5l2 2 5-5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ErrorIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <circle cx="10" cy="10" r="8" />
    <path d="M10 6v5" strokeLinecap="round" />
    <circle cx="10" cy="14" r="0.75" fill="currentColor" stroke="none" />
  </svg>
);

const WarningIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M10 3L2 17h16L10 3z" />
    <path d="M10 8v4" strokeLinecap="round" />
    <circle cx="10" cy="14.5" r="0.75" fill="currentColor" stroke="none" />
  </svg>
);

const InfoIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <circle cx="10" cy="10" r="8" />
    <path d="M10 9v5" strokeLinecap="round" />
    <circle cx="10" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
  </svg>
);

const ICONS: Record<ToastVariant, () => JSX.Element> = {
  success: SuccessIcon,
  error: ErrorIcon,
  warning: WarningIcon,
  info: InfoIcon,
};

export const Toast = forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      variant = 'info',
      title,
      message,
      duration = 5000,
      dismissible = true,
      onDismiss,
      className,
      ...rest
    },
    ref,
  ) => {
    const timerRef = useRef<ReturnType<typeof setTimeout>>();
    const styles = VARIANT_STYLES[variant];
    const Icon = ICONS[variant];

    const handleDismiss = useCallback(() => {
      onDismiss?.();
    }, [onDismiss]);

    useEffect(() => {
      if (duration > 0 && onDismiss) {
        timerRef.current = setTimeout(handleDismiss, duration);
        return () => clearTimeout(timerRef.current);
      }
    }, [duration, handleDismiss, onDismiss]);

    return (
      <div
        ref={ref}
        role="alert"
        className={clsx(
          'cs-toast flex items-start gap-3 p-4',
          'rounded-lg border bg-slate-900 shadow-lg',
          'min-w-[280px] max-w-[420px]',
          styles.container,
          className,
        )}
        {...rest}
      >
        <span className={clsx('mt-0.5 shrink-0', styles.icon)}>
          <Icon />
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-100">{title}</p>
          {message && <p className="mt-0.5 text-xs text-slate-400">{message}</p>}
        </div>

        {dismissible && onDismiss && (
          <button
            type="button"
            onClick={handleDismiss}
            className={clsx(
              'shrink-0 mt-0.5 p-0.5 rounded',
              'text-slate-500 hover:text-slate-300',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500',
            )}
            aria-label="Dismiss notification"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M3 3l8 8M11 3l-8 8" />
            </svg>
          </button>
        )}
      </div>
    );
  },
);

Toast.displayName = 'Toast';
