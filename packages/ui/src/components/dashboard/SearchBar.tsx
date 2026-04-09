import { clsx } from 'clsx';
import { type InputHTMLAttributes, forwardRef } from 'react';

export interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Current search value */
  value: string;
  /** Called when the search value changes */
  onValueChange: (value: string) => void;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ value, onValueChange, className, placeholder = 'Search workflows…', ...rest }, ref) => {
    return (
      <div className={clsx('cs-dashboard-toolbar relative', className)}>
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="7" cy="7" r="5" />
          <path d="M11 11l3 3" />
        </svg>
        <input
          ref={ref}
          type="search"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          className={clsx(
            'h-9 w-full rounded-md pl-9 pr-3 text-sm',
            'bg-surface-elevated border border-slate-700 outline-none',
            'text-slate-100 placeholder:text-slate-500',
            'transition-colors duration-150',
            'focus:border-violet-500 focus:ring-1 focus:ring-violet-500',
          )}
          aria-label="Search workflows"
          {...rest}
        />
      </div>
    );
  },
);

SearchBar.displayName = 'SearchBar';
