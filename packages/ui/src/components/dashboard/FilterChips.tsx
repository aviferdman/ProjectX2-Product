import { clsx } from 'clsx';
import { type HTMLAttributes, forwardRef } from 'react';
import type { WorkflowStatus } from './types.js';

export type FilterOption = 'all' | WorkflowStatus;

const filterLabels: Record<FilterOption, string> = {
  all: 'All',
  draft: 'Draft',
  active: 'Active',
  error: 'Error',
  archived: 'Archived',
};

const filterOrder: FilterOption[] = ['all', 'draft', 'active', 'error', 'archived'];

export interface FilterChipsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value: FilterOption;
  onChange: (value: FilterOption) => void;
}

export const FilterChips = forwardRef<HTMLDivElement, FilterChipsProps>(
  ({ value, onChange, className, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        role="radiogroup"
        aria-label="Filter by status"
        className={clsx('flex items-center gap-1.5', className)}
        {...rest}
      >
        {filterOrder.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={value === option}
            onClick={() => onChange(option)}
            className={clsx(
              'h-7 rounded-full border px-3 text-xs font-medium transition-colors duration-100',
              value === option
                ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                : 'border-slate-700 bg-surface-elevated text-slate-400 hover:text-slate-200 hover:border-slate-600',
            )}
          >
            {filterLabels[option]}
          </button>
        ))}
      </div>
    );
  },
);

FilterChips.displayName = 'FilterChips';
