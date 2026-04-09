import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import type { TemplateCategory, TemplateSortField, SortDirection } from './types.js';
import { TemplateSearchBar, type TemplateSearchBarProps } from './TemplateSearchBar.js';
import { TemplateCategoryFilter } from './TemplateCategoryFilter.js';
import { TemplateSortDropdown } from './TemplateSortDropdown.js';

export interface TemplateToolbarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  search: string;
  onSearchChange: (value: string) => void;
  category: TemplateCategory | 'all';
  onCategoryChange: (category: TemplateCategory | 'all') => void;
  sort: { field: TemplateSortField; direction: SortDirection };
  onSortChange: (sort: { field: TemplateSortField; direction: SortDirection }) => void;
  resultCount?: number;
  totalCount?: number;
}

export const TemplateToolbar = forwardRef<HTMLDivElement, TemplateToolbarProps>(
  function TemplateToolbar(
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
        className={clsx(
          'flex flex-col gap-3',
          'min-h-[theme(spacing.tpl-toolbar-h)]',
          className,
        )}
        {...props}
      >
        {/* Top row: search + sort + count */}
        <div className="flex flex-wrap items-center gap-3">
          <TemplateSearchBar
            value={search}
            onValueChange={onSearchChange}
            className="w-72"
          />
          <div className="flex-1" />
          {resultCount !== undefined && totalCount !== undefined && (
            <span className="text-tpl-card-meta text-tpl-card-meta whitespace-nowrap">
              {resultCount === totalCount
                ? `${totalCount} templates`
                : `${resultCount} of ${totalCount} templates`}
            </span>
          )}
          <TemplateSortDropdown value={sort} onChange={onSortChange} />
        </div>

        {/* Bottom row: category filters */}
        <TemplateCategoryFilter value={category} onChange={onCategoryChange} />
      </div>
    );
  },
);
