/**
 * TASK-182: ToastContainer — Positioned container for toast notifications.
 *
 * Renders a stack of Toast components in a fixed-position region.
 * Should be mounted once at the app root level.
 */
import { clsx } from 'clsx';
import { type HTMLAttributes, forwardRef } from 'react';
import { Toast } from './Toast.js';
import type { ToastEntry, ToastPosition } from './types.js';

export interface ToastContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Active toast entries to render */
  toasts: ToastEntry[];
  /** Position on screen. Default: 'top-right' */
  position?: ToastPosition;
  /** Callback to dismiss a toast by id */
  onDismiss?: (id: string) => void;
}

const POSITION_STYLES: Record<ToastPosition, string> = {
  'top-right': 'top-4 right-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

export const ToastContainer = forwardRef<HTMLDivElement, ToastContainerProps>(
  (
    {
      toasts,
      position = 'top-right',
      onDismiss,
      className,
      ...rest
    },
    ref,
  ) => {
    if (toasts.length === 0) return null;

    return (
      <div
        ref={ref}
        className={clsx(
          'cs-toast-container fixed z-50 flex flex-col gap-2',
          POSITION_STYLES[position],
          className,
        )}
        aria-live="polite"
        aria-label="Notifications"
        {...rest}
      >
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            variant={toast.variant}
            title={toast.title}
            message={toast.message}
            duration={toast.duration}
            dismissible={toast.dismissible ?? true}
            onDismiss={() => onDismiss?.(toast.id)}
          />
        ))}
      </div>
    );
  },
);

ToastContainer.displayName = 'ToastContainer';
