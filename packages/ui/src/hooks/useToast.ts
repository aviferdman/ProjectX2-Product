/**
 * TASK-182: useToast — Hook for managing toast notifications.
 *
 * Provides methods to add, dismiss, and clear toast notifications.
 * Manages auto-dismiss timers and a capped notification queue.
 */
import { useState, useCallback, useRef } from 'react';
import type { ToastEntry, ToastVariant } from '../components/feedback/types.js';

export interface UseToastOptions {
  /** Maximum number of visible toasts (default: 5) */
  maxToasts?: number;
  /** Default auto-dismiss duration in ms (default: 5000) */
  defaultDuration?: number;
}

export interface UseToastResult {
  /** Current active toasts */
  toasts: ToastEntry[];
  /** Add a toast notification */
  addToast: (toast: Omit<ToastEntry, 'id'>) => string;
  /** Dismiss a specific toast by id */
  dismissToast: (id: string) => void;
  /** Clear all toasts */
  clearToasts: () => void;
  /** Shorthand: add a success toast */
  success: (title: string, message?: string) => string;
  /** Shorthand: add an error toast */
  error: (title: string, message?: string) => string;
  /** Shorthand: add a warning toast */
  warning: (title: string, message?: string) => string;
  /** Shorthand: add an info toast */
  info: (title: string, message?: string) => string;
}

let toastIdCounter = 0;

function generateId(): string {
  toastIdCounter += 1;
  return `toast-${toastIdCounter}`;
}

export function useToast(options: UseToastOptions = {}): UseToastResult {
  const { maxToasts = 5, defaultDuration = 5000 } = options;
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const maxRef = useRef(maxToasts);
  maxRef.current = maxToasts;

  const addToast = useCallback(
    (toast: Omit<ToastEntry, 'id'>): string => {
      const id = generateId();
      const entry: ToastEntry = {
        id,
        duration: defaultDuration,
        dismissible: true,
        ...toast,
      };
      setToasts((prev) => {
        const next = [...prev, entry];
        if (next.length > maxRef.current) {
          return next.slice(next.length - maxRef.current);
        }
        return next;
      });
      return id;
    },
    [defaultDuration],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const shorthand = useCallback(
    (variant: ToastVariant) =>
      (title: string, message?: string): string =>
        addToast({ variant, title, message }),
    [addToast],
  );

  return {
    toasts,
    addToast,
    dismissToast,
    clearToasts,
    success: shorthand('success'),
    error: shorthand('error'),
    warning: shorthand('warning'),
    info: shorthand('info'),
  };
}
