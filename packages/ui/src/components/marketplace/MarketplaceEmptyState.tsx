import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

export interface MarketplaceEmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  heading?: string;
  description?: string;
  isSearchResult?: boolean;
  onClearFilters?: () => void;
}

export const MarketplaceEmptyState = forwardRef<HTMLDivElement, MarketplaceEmptyStateProps>(
  function MarketplaceEmptyState(
    {
      heading = 'No integrations found',
      description = "Try adjusting your search or filters to find what you're looking for.",
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
          'border-[var(--cs-border-default,#18181b)]',
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
            <rect
              x="16"
              y="12"
              width="40"
              height="40"
              rx="10"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M28 32h16M36 24v16"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="54" cy="54" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M60 60l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        <h3 className="text-base font-semibold text-[var(--cs-text-primary,#fafafa)] mb-2">
          {heading}
        </h3>
        <p className="text-sm text-[var(--cs-text-secondary,#a1a1aa)] text-center max-w-sm">
          {description}
        </p>

        {isSearchResult && onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className={clsx(
              'mt-6 inline-flex items-center gap-2 rounded-lg px-4 py-2',
              'bg-indigo-600 text-white',
              'text-sm font-medium',
              'transition-colors duration-150',
              'hover:bg-indigo-500',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
            )}
          >
            Clear Filters
          </button>
        )}
      </div>
    );
  },
);
