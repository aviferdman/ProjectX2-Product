import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

export interface TemplateEmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  heading?: string;
  description?: string;
  isSearchResult?: boolean;
  onClearFilters?: () => void;
}

export const TemplateEmptyState = forwardRef<
  HTMLDivElement,
  TemplateEmptyStateProps
>(function TemplateEmptyState(
  {
    heading = 'No templates found',
    description = 'Try adjusting your search or filters to find what you\'re looking for.',
    isSearchResult = false,
    onClearFilters,
    className,
    ...props
  },
  ref,
) {
  return (
    <div
      ref={ref}
      className={clsx(
        'flex flex-col items-center justify-center rounded-xl border py-16 px-8',
        'border-dashed',
        'border-[var(--cs-border-default)]',
        'animate-tpl-empty-in',
        className,
      )}
      {...props}
    >
      {/* Icon */}
      <div className="mb-4">
        <svg
          width="72"
          height="72"
          viewBox="0 0 72 72"
          fill="none"
          className="text-slate-600"
          aria-hidden="true"
        >
          <rect x="12" y="16" width="20" height="16" rx="4" stroke="currentColor" strokeWidth="1.5" />
          <rect x="40" y="16" width="20" height="16" rx="4" stroke="currentColor" strokeWidth="1.5" />
          <rect x="26" y="40" width="20" height="16" rx="4" stroke="currentColor" strokeWidth="1.5" />
          <path d="M22 32v4l14 4M50 32v4l-14 4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
        </svg>
      </div>

      <h3 className="text-tpl-empty-heading text-[var(--cs-text-primary)] mb-2">
        {heading}
      </h3>
      <p className="text-tpl-empty-desc text-[var(--cs-text-secondary)] text-center max-w-sm">
        {description}
      </p>

      {isSearchResult && onClearFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className={clsx(
            'mt-6 inline-flex items-center gap-2 rounded-lg px-4 py-2',
            'bg-tpl-use-btn-bg text-tpl-use-btn-text',
            'text-sm font-medium',
            'transition-colors duration-150',
            'hover:bg-tpl-use-btn-bg-hover',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
          )}
        >
          Clear Filters
        </button>
      )}
    </div>
  );
});
