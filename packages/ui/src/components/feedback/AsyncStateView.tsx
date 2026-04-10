/**
 * TASK-182: AsyncStateView — State orchestrator component.
 *
 * Renders the appropriate child based on the current async status:
 * loading → StatusLoading, error → ErrorFallback, empty → StatusEmpty,
 * success → the provided children.
 *
 * Eliminates boilerplate conditional rendering across pages.
 */
import { type ReactNode, type HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { StatusLoading } from './StatusLoading.js';
import { StatusEmpty } from './StatusEmpty.js';
import { ErrorFallback } from '../ErrorFallback.js';
import type { AsyncState } from './types.js';

export interface AsyncStateViewProps<T = unknown> extends HTMLAttributes<HTMLDivElement> {
  /** Current async state */
  state: AsyncState<T>;
  /** Predicate to detect empty data (default: checks for null, undefined, or empty array) */
  isEmpty?: (data: T) => boolean;
  /** Children to render on success (receives the data as argument if function) */
  children: ReactNode | ((data: T) => ReactNode);
  /** Custom loading state */
  loadingMessage?: string;
  /** Custom empty state heading */
  emptyHeading?: string;
  /** Custom empty state description */
  emptyDescription?: string;
  /** Empty state action label */
  emptyActionLabel?: string;
  /** Empty state action callback */
  onEmptyAction?: () => void;
  /** Custom error heading */
  errorHeading?: string;
  /** Custom error message (overrides the error.message) */
  errorMessage?: string;
  /** Retry callback (shown as a button in the error state) */
  onRetry?: () => void;
}

function defaultIsEmpty(data: unknown): boolean {
  if (data == null) return true;
  if (Array.isArray(data)) return data.length === 0;
  return false;
}

export const AsyncStateView = forwardRef<HTMLDivElement, AsyncStateViewProps>(
  (
    {
      state,
      isEmpty,
      children,
      loadingMessage,
      emptyHeading,
      emptyDescription,
      emptyActionLabel,
      onEmptyAction,
      errorHeading,
      errorMessage,
      onRetry,
      className,
      ...rest
    },
    ref,
  ) => {
    const { status, data, error } = state;

    // Loading
    if (status === 'loading') {
      return (
        <div ref={ref} className={clsx('cs-async-state-view', className)} {...rest}>
          <StatusLoading message={loadingMessage} />
        </div>
      );
    }

    // Error
    if (status === 'error') {
      return (
        <div ref={ref} className={clsx('cs-async-state-view', className)} {...rest}>
          <ErrorFallback
            heading={errorHeading}
            message={errorMessage ?? error?.message}
            onRetry={onRetry}
          />
        </div>
      );
    }

    // Idle — render nothing (not yet started)
    if (status === 'idle') {
      return (
        <div ref={ref} className={clsx('cs-async-state-view', className)} {...rest} />
      );
    }

    // Success — check for empty
    const checkEmpty = isEmpty ?? defaultIsEmpty;
    if (data != null && checkEmpty(data as never)) {
      return (
        <div ref={ref} className={clsx('cs-async-state-view', className)} {...rest}>
          <StatusEmpty
            heading={emptyHeading}
            description={emptyDescription}
            actionLabel={emptyActionLabel}
            onAction={onEmptyAction}
          />
        </div>
      );
    }

    // Null data (should not happen with status=success, but defensive)
    if (data == null) {
      return (
        <div ref={ref} className={clsx('cs-async-state-view', className)} {...rest}>
          <StatusEmpty heading={emptyHeading} description={emptyDescription} />
        </div>
      );
    }

    // Success with data — render children
    return (
      <div ref={ref} className={clsx('cs-async-state-view', className)} {...rest}>
        {typeof children === 'function' ? (children as (data: never) => ReactNode)(data as never) : children}
      </div>
    );
  },
);

AsyncStateView.displayName = 'AsyncStateView';
