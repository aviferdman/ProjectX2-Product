import { clsx } from 'clsx';
import { type HTMLAttributes, forwardRef } from 'react';
import type { ViewMode } from './types.js';

export interface ViewToggleProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export const ViewToggle = forwardRef<HTMLDivElement, ViewToggleProps>(
  ({ value, onChange, className, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        role="radiogroup"
        aria-label="View mode"
        className={clsx(
          'flex items-center rounded-md border border-slate-700 bg-surface-card overflow-hidden',
          className,
        )}
        {...rest}
      >
        <button
          type="button"
          role="radio"
          aria-checked={value === 'grid'}
          aria-label="Grid view"
          onClick={() => onChange('grid')}
          className={clsx(
            'flex items-center justify-center w-8 h-8 transition-colors',
            value === 'grid'
              ? 'bg-surface-elevated text-slate-100'
              : 'text-slate-500 hover:text-slate-300',
          )}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <rect x="1" y="1" width="6" height="6" rx="1" />
            <rect x="9" y="1" width="6" height="6" rx="1" />
            <rect x="1" y="9" width="6" height="6" rx="1" />
            <rect x="9" y="9" width="6" height="6" rx="1" />
          </svg>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={value === 'list'}
          aria-label="List view"
          onClick={() => onChange('list')}
          className={clsx(
            'flex items-center justify-center w-8 h-8 transition-colors',
            value === 'list'
              ? 'bg-surface-elevated text-slate-100'
              : 'text-slate-500 hover:text-slate-300',
          )}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <rect x="1" y="2" width="14" height="2.5" rx="0.5" />
            <rect x="1" y="6.75" width="14" height="2.5" rx="0.5" />
            <rect x="1" y="11.5" width="14" height="2.5" rx="0.5" />
          </svg>
        </button>
      </div>
    );
  },
);

ViewToggle.displayName = 'ViewToggle';
