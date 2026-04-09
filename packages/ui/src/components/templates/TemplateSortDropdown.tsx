import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import type { TemplateSortField, SortDirection } from './types.js';
import { SORT_OPTIONS } from './types.js';

export interface TemplateSortDropdownProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value: { field: TemplateSortField; direction: SortDirection };
  onChange: (sort: { field: TemplateSortField; direction: SortDirection }) => void;
}

export const TemplateSortDropdown = forwardRef<
  HTMLDivElement,
  TemplateSortDropdownProps
>(function TemplateSortDropdown({ value, onChange, className, ...props }, ref) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeLabel =
    SORT_OPTIONS.find((o) => o.field === value.field)?.label ?? 'Sort';

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

  const handleSelect = (field: TemplateSortField) => {
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
          'bg-tpl-sort-bg border-tpl-sort-border text-tpl-sort-text',
          'text-tpl-sort-label font-medium',
          'transition-colors duration-150',
          'hover:bg-tpl-sort-bg-hover hover:text-tpl-sort-text-active',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
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
            'bg-tpl-sort-menu-bg border-tpl-sort-border',
            'shadow-tpl-sort-menu',
          )}
        >
          {SORT_OPTIONS.map((option) => {
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
                  'text-tpl-sort-label',
                  'transition-colors duration-100',
                  isSelected
                    ? 'text-tpl-sort-text-active'
                    : 'text-tpl-sort-text hover:bg-[rgba(30,41,59,0.5)]',
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
