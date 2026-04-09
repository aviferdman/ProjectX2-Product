import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

export interface TemplateSearchBarProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onValueChange: (value: string) => void;
}

export const TemplateSearchBar = forwardRef<
  HTMLInputElement,
  TemplateSearchBarProps
>(function TemplateSearchBar(
  { value, onValueChange, placeholder = 'Search templates...', className, ...props },
  ref,
) {
  return (
    <div className={clsx('relative', className)}>
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 text-tpl-search-icon"
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
        aria-label="Search templates"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        className={clsx(
          'w-full rounded-lg border pl-9 pr-3',
          'h-tpl-search-h',
          'bg-tpl-search-bg border-tpl-search-border text-tpl-card-title',
          'text-tpl-search-input',
          'placeholder:text-tpl-search-placeholder',
          'transition-colors duration-150',
          'focus:border-tpl-search-border-focus focus:outline-none focus:ring-1 focus:ring-tpl-search-border-focus',
        )}
        {...props}
      />
    </div>
  );
});
