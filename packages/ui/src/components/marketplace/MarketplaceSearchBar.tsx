import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

export interface MarketplaceSearchBarProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onValueChange: (value: string) => void;
}

export const MarketplaceSearchBar = forwardRef<
  HTMLInputElement,
  MarketplaceSearchBarProps
>(function MarketplaceSearchBar(
  { value, onValueChange, placeholder = 'Search integrations...', className, ...props },
  ref,
) {
  return (
    <div className={clsx('relative', className)}>
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cs-text-secondary,#94a3b8)]"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        ref={ref}
        type="search"
        role="searchbox"
        aria-label="Search integrations"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        className={clsx(
          'w-full rounded-lg border pl-9 pr-3',
          'h-9',
          'bg-[var(--cs-bg-surface,#020617)] border-[var(--cs-border-default,#1e293b)] text-[var(--cs-text-primary,#f8fafc)]',
          'text-sm',
          'placeholder:text-[var(--cs-text-secondary,#94a3b8)]',
          'transition-colors duration-150',
          'focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500',
        )}
        {...props}
      />
    </div>
  );
});
