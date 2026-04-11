import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import type { IntegrationCategory } from './types.js';
import { INTEGRATION_CATEGORIES } from './types.js';

export interface MarketplaceCategoryFilterProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value: IntegrationCategory | 'all';
  onChange: (category: IntegrationCategory | 'all') => void;
}

export const MarketplaceCategoryFilter = forwardRef<
  HTMLDivElement,
  MarketplaceCategoryFilterProps
>(function MarketplaceCategoryFilter({ value, onChange, className, ...props }, ref) {
  const allItems: { id: IntegrationCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All Categories' },
    ...INTEGRATION_CATEGORIES,
  ];

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label="Filter by category"
      className={clsx('flex flex-wrap gap-2', className)}
      {...props}
    >
      {allItems.map((item) => {
        const isActive = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(item.id)}
            className={clsx(
              'inline-flex items-center rounded-full border px-3',
              'h-7',
              'text-xs font-medium',
              'transition-all duration-150',
              isActive
                ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                : 'border-[var(--cs-border-default,#18181b)] bg-transparent text-[var(--cs-text-secondary,#a1a1aa)] hover:text-indigo-300',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
});
