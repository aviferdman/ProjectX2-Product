import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import type { IntegrationSortField, SortDirection } from './types.js';
import { MARKETPLACE_SORT_OPTIONS } from './types.js';

export interface MarketplaceSortDropdownProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value: { field: IntegrationSortField; direction: SortDirection };
  onChange: (sort: { field: IntegrationSortField; direction: SortDirection }) => void;
}

export const MarketplaceSortDropdown = forwardRef<
  HTMLDivElement,
  MarketplaceSortDropdownProps
>(function MarketplaceSortDropdown({ value, onChange, className, ...props }, ref) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeLabel =
    MARKETPLACE_SORT_OPTIONS.find((o) => o.field === value.field)?.label ?? 'Sort';

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleSelect = (field: IntegrationSortField) => {
    const direction: SortDirection =
      value.field === field && value.direction === 'desc' ? 'asc' : 'desc';
    onChange({ field, direction });
    setOpen(false);
  };

  return (
    <div
      ref={(node) => {
        (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className={clsx('relative', className)}
      {...props}
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={clsx(
          'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5',
          'bg-[var(--cs-bg-surface,#09090b)] border-[var(--cs-border-default,#18181b)] text-[var(--cs-text-secondary,#a1a1aa)]',
          'text-xs font-medium',
          'transition-colors duration-150',
          'hover:bg-[var(--cs-bg-card,#111113)] hover:text-[var(--cs-text-primary,#fafafa)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
        )}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M3 6h18M6 12h12M9 18h6" />
        </svg>
        {activeLabel}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
          className={clsx('transition-transform', open && 'rotate-180')}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Sort options"
          className={clsx(
            'absolute right-0 z-50 mt-1 min-w-[180px] overflow-hidden rounded-lg border',
            'bg-[var(--cs-bg-card,#111113)] border-[var(--cs-border-default,#18181b)]',
            'shadow-lg',
          )}
        >
          {MARKETPLACE_SORT_OPTIONS.map((option) => {
            const isSelected = value.field === option.field;
            return (
              <button
                key={option.field}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.field)}
                className={clsx(
                  'flex w-full items-center justify-between px-3 py-2',
                  'text-xs',
                  'transition-colors duration-100',
                  isSelected
                    ? 'text-indigo-300'
                    : 'text-[var(--cs-text-secondary,#a1a1aa)] hover:bg-[rgba(30,41,59,0.5)]',
                )}
              >
                {option.label}
                {isSelected && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});
