import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import type { TemplateCategory } from './types.js';
import { TEMPLATE_CATEGORIES } from './types.js';

export interface TemplateCategoryFilterProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onChange'
> {
  value: TemplateCategory | 'all';
  onChange: (category: TemplateCategory | 'all') => void;
}

export const TemplateCategoryFilter = forwardRef<HTMLDivElement, TemplateCategoryFilterProps>(
  function TemplateCategoryFilter({ value, onChange, className, ...props }, ref) {
    const allItems: { id: TemplateCategory | 'all'; label: string }[] = [
      { id: 'all', label: 'All Categories' },
      ...TEMPLATE_CATEGORIES,
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
                'h-tpl-chip-h',
                'text-tpl-filter-chip font-medium',
                'transition-all duration-150',
                isActive
                  ? 'border-tpl-filter-chip-border-active bg-tpl-filter-chip-bg-active text-tpl-filter-chip-text-active'
                  : 'border-tpl-filter-chip-border bg-tpl-filter-chip-bg text-tpl-filter-chip-text hover:text-tpl-filter-chip-text-active',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    );
  },
);
