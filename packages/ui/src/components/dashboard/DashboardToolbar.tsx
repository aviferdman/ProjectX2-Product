import { clsx } from 'clsx';
import { type HTMLAttributes, forwardRef } from 'react';
import { SearchBar } from './SearchBar.js';
import { FilterChips, type FilterOption } from './FilterChips.js';
import { ViewToggle } from './ViewToggle.js';
import type { ViewMode } from './types.js';

export interface DashboardToolbarProps extends HTMLAttributes<HTMLDivElement> {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: FilterOption;
  onStatusFilterChange: (value: FilterOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onCreate?: (() => void) | undefined;
}

export const DashboardToolbar = forwardRef<HTMLDivElement, DashboardToolbarProps>(
  (
    {
      search,
      onSearchChange,
      statusFilter,
      onStatusFilterChange,
      viewMode,
      onViewModeChange,
      onCreate,
      className,
      ...rest
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'flex flex-wrap items-center gap-3',
          className,
        )}
        {...rest}
      >
        <SearchBar value={search} onValueChange={onSearchChange} className="w-64" />
        <FilterChips value={statusFilter} onChange={onStatusFilterChange} />
        <div className="flex-1" />
        <ViewToggle value={viewMode} onChange={onViewModeChange} />
        {onCreate && (
          <button
            type="button"
            onClick={onCreate}
            className={clsx(
              'cs-create-workflow-btn inline-flex items-center gap-2 h-10 px-4',
              'rounded-lg bg-violet-600 text-white text-sm font-medium',
              'shadow-[0_2px_8px_rgba(124,58,237,0.35)]',
              'hover:bg-violet-500 hover:shadow-[0_4px_12px_rgba(124,58,237,0.45)]',
              'transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app',
            )}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M8 2v12M2 8h12" />
            </svg>
            New Workflow
          </button>
        )}
      </div>
    );
  },
);

DashboardToolbar.displayName = 'DashboardToolbar';
