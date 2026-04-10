/**
 * TASK-182: Shared types for feedback components
 *
 * Common types used across empty states, loading states, success/error feedback,
 * toast notifications, and async state orchestration.
 */

/** Feedback status variants */
export type FeedbackStatus = 'loading' | 'empty' | 'success' | 'error' | 'warning' | 'info';

/** Toast notification variants */
export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

/** Toast position on screen */
export type ToastPosition = 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';

/** A single toast notification entry */
export interface ToastEntry {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  duration?: number;
  dismissible?: boolean;
}

/** Async data state for the AsyncStateView orchestrator */
export interface AsyncState<T = unknown> {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: T | null;
  error: Error | null;
}
