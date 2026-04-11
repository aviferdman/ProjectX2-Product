import { clsx } from 'clsx';
import { type HTMLAttributes, forwardRef } from 'react';

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  heading?: string | undefined;
  description?: string | undefined;
  actionLabel?: string | undefined;
  onAction?: (() => void) | undefined;
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      heading = 'No workflows yet',
      description = 'Create your first workflow to get started with AI agent orchestration.',
      actionLabel = 'Create Workflow',
      onAction,
      className,
      ...rest
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'cs-empty-state flex flex-col items-center justify-center gap-4 py-16 px-8',
          'rounded-xl border border-dashed border-slate-700',
          className,
        )}
        {...rest}
      >
        <svg
          className="w-16 h-16 text-slate-600"
          fill="none"
          viewBox="0 0 64 64"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <rect x="12" y="22" width="16" height="12" rx="3" />
          <rect x="36" y="22" width="16" height="12" rx="3" />
          <rect x="24" y="38" width="16" height="12" rx="3" />
          <path d="M28 22V18a2 2 0 012-2h4a2 2 0 012 2v4" />
          <path d="M32 34v4" />
        </svg>

        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-100">{heading}</h3>
          <p className="mt-1 text-sm text-slate-400 max-w-sm">{description}</p>
        </div>

        {onAction && (
          <button
            type="button"
            onClick={onAction}
            className={clsx(
              'inline-flex items-center gap-2 h-10 px-5',
              'rounded-lg bg-indigo-600 text-white text-sm font-medium',
              'shadow-[0_2px_8px_rgba(99,102,241,0.35)]',
              'hover:bg-indigo-500 transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app',
            )}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M8 2v12M2 8h12" />
            </svg>
            {actionLabel}
          </button>
        )}
      </div>
    );
  },
);

EmptyState.displayName = 'EmptyState';
