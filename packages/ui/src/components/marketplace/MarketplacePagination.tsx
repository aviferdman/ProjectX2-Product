import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

export interface MarketplacePaginationProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'onChange'> {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export const MarketplacePagination = forwardRef<
  HTMLElement,
  MarketplacePaginationProps
>(function MarketplacePagination(
  { currentPage, totalPages, onChange, className, ...props },
  ref,
) {
  if (totalPages <= 1) return null;

  const pages: (number | 'ellipsis')[] = [];
  const maxVisible = 7;

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('ellipsis');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
  }

  return (
    <nav
      ref={ref}
      role="navigation"
      aria-label="Pagination"
      className={clsx('flex items-center justify-center gap-1', className)}
      {...props}
    >
      {/* Previous */}
      <button
        type="button"
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className={clsx(
          'inline-flex items-center justify-center rounded-md',
          'w-8 h-8',
          'text-[var(--cs-text-secondary,#a1a1aa)]',
          'transition-colors duration-150',
          currentPage === 1
            ? 'opacity-40 cursor-not-allowed'
            : 'hover:bg-[var(--cs-bg-card,#111113)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
        )}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      {/* Page buttons */}
      {pages.map((page, i) =>
        page === 'ellipsis' ? (
          <span
            key={`ellipsis-${i}`}
            className="inline-flex items-center justify-center w-8 h-8 text-[var(--cs-text-secondary,#a1a1aa)]"
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onChange(page)}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
            className={clsx(
              'inline-flex items-center justify-center rounded-md',
              'w-8 h-8',
              'text-xs font-medium',
              'transition-colors duration-150',
              page === currentPage
                ? 'bg-indigo-500/20 text-indigo-300'
                : 'text-[var(--cs-text-secondary,#a1a1aa)] hover:bg-[var(--cs-bg-card,#111113)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
            )}
          >
            {page}
          </button>
        ),
      )}

      {/* Next */}
      <button
        type="button"
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className={clsx(
          'inline-flex items-center justify-center rounded-md',
          'w-8 h-8',
          'text-[var(--cs-text-secondary,#a1a1aa)]',
          'transition-colors duration-150',
          currentPage === totalPages
            ? 'opacity-40 cursor-not-allowed'
            : 'hover:bg-[var(--cs-bg-card,#111113)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
        )}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    </nav>
  );
});
