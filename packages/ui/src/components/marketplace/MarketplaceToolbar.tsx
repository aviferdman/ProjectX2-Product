import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import type { IntegrationCategory, IntegrationSortField, SortDirection } from './types.js';
import { MarketplaceSearchBar } from './MarketplaceSearchBar.js';
import { MarketplaceCategoryFilter } from './MarketplaceCategoryFilter.js';
import { MarketplaceSortDropdown } from './MarketplaceSortDropdown.js';

export interface MarketplaceToolbarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  search: string;
  onSearchChange: (value: string) => void;
  category: IntegrationCategory | 'all';
  onCategoryChange: (category: IntegrationCategory | 'all') => void;
  sort: { field: IntegrationSortField; direction: SortDirection };
  onSortChange: (sort: { field: IntegrationSortField; direction: SortDirection }) => void;
  resultCount?: number;
  totalCount?: number;
}

export const MarketplaceToolbar = forwardRef<HTMLDivElement, MarketplaceToolbarProps>(
  function MarketplaceToolbar(
    {
      search,
      onSearchChange,
      category,
      onCategoryChange,
      sort,
      onSortChange,
      resultCount,
      totalCount,
      className,
      ...props
    },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={clsx('flex flex-col gap-3', className)}
        {...props}
      >
        {/* Top row: search + sort + count */}
        <div className="flex flex-wrap items-center gap-3">
          <MarketplaceSearchBar
            value={search}
            onValueChange={onSearchChange}
            className="w-72"
          />
          <div className="flex-1" />
          {resultCount !== undefined && totalCount !== undefined && (
            <span className="text-[11px] text-[var(--cs-text-secondary,#a1a1aa)] whitespace-nowrap">
              {resultCount === totalCount
                ? `${totalCount} integrations`
                : `${resultCount} of ${totalCount} integrations`}
            </span>
          )}
          <MarketplaceSortDropdown value={sort} onChange={onSortChange} />
        </div>

        {/* Bottom row: category filters */}
        <MarketplaceCategoryFilter value={category} onChange={onCategoryChange} />
      </div>
    );
  },
);
