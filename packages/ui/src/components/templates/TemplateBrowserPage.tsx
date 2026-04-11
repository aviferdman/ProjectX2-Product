import React, { forwardRef, useState, useMemo } from 'react';
import { clsx } from 'clsx';
import type {
  TemplateSummary,
  TemplateCategory,
  TemplateSortField,
  SortDirection,
  TemplateFilters,
} from './types.js';
import { ITEMS_PER_PAGE } from './types.js';
import { TemplateToolbar } from './TemplateToolbar.js';
import { TemplateGrid } from './TemplateGrid.js';
import { TemplateEmptyState } from './TemplateEmptyState.js';
import { TemplatePagination } from './TemplatePagination.js';

export interface TemplateBrowserPageProps
  extends React.HTMLAttributes<HTMLDivElement> {
  templates: TemplateSummary[];
  loading?: boolean;
  onUseTemplate?: ((id: string) => void) | undefined;
  onPreview?: ((id: string) => void) | undefined;
}

function applyFilters(
  templates: TemplateSummary[],
  filters: TemplateFilters,
): TemplateSummary[] {
  let result = [...templates];

  // Search filter
  if (filters.search) {
    const query = filters.search.toLowerCase();
    result = result.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        t.author.toLowerCase().includes(query),
    );
  }

  // Category filter
  if (filters.category !== 'all') {
    result = result.filter((t) => t.category === filters.category);
  }

  // Sort
  const { field, direction } = filters.sort;
  const dir = direction === 'asc' ? 1 : -1;
  result.sort((a, b) => {
    switch (field) {
      case 'name':
        return dir * a.name.localeCompare(b.name);
      case 'popularity':
        return dir * (a.usageCount - b.usageCount);
      case 'createdAt':
        return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'updatedAt':
        return dir * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
      default:
        return 0;
    }
  });

  return result;
}

export const TemplateBrowserPage = forwardRef<
  HTMLDivElement,
  TemplateBrowserPageProps
>(function TemplateBrowserPage(
  { templates, loading = false, onUseTemplate, onPreview, className, ...props },
  ref,
) {
  const [filters, setFilters] = useState<TemplateFilters>({
    search: '',
    category: 'all',
    sort: { field: 'popularity', direction: 'desc' },
  });
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(
    () => applyFilters(templates, filters),
    [templates, filters],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setCurrentPage(1);
  };

  const handleCategoryChange = (category: TemplateCategory | 'all') => {
    setFilters((prev) => ({ ...prev, category }));
    setCurrentPage(1);
  };

  const handleSortChange = (sort: {
    field: TemplateSortField;
    direction: SortDirection;
  }) => {
    setFilters((prev) => ({ ...prev, sort }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ search: '', category: 'all', sort: { field: 'popularity', direction: 'desc' } });
    setCurrentPage(1);
  };

  const hasActiveFilters = filters.search !== '' || filters.category !== 'all';

  return (
    <div
      ref={ref}
      className={clsx(
        'flex flex-col gap-6',
        'max-w-[var(--tpl-content-max-w,1440px)] mx-auto',
        'p-tpl-content-p',
        className,
      )}
      {...props}
    >
      {/* Page header */}
      <div>
        <h1 className="text-tpl-page-title text-[var(--cs-text-primary)]">
          Template Library
        </h1>
        <p className="text-tpl-page-subtitle text-[var(--cs-text-secondary)] mt-1">
          Browse pre-built workflow templates to get started quickly
        </p>
      </div>

      {/* Toolbar: search, filters, sort */}
      <TemplateToolbar
        search={filters.search}
        onSearchChange={handleSearchChange}
        category={filters.category}
        onCategoryChange={handleCategoryChange}
        sort={filters.sort}
        onSortChange={handleSortChange}
        resultCount={filtered.length}
        totalCount={templates.length}
      />

      {/* Content area */}
      {loading ? (
        <div className="flex items-center justify-center py-20" role="status">
          <svg
            className="h-8 w-8 animate-spin text-indigo-500"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="31.4 31.4"
              strokeLinecap="round"
            />
          </svg>
          <span className="sr-only">Loading templates…</span>
        </div>
      ) : paginated.length === 0 ? (
        <TemplateEmptyState
          heading={hasActiveFilters ? 'No matching templates' : 'No templates yet'}
          description={
            hasActiveFilters
              ? 'Try adjusting your search or filters to find what you\'re looking for.'
              : 'Templates will appear here once they are created.'
          }
          isSearchResult={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />
      ) : (
        <>
          <TemplateGrid
            templates={paginated}
            onUseTemplate={onUseTemplate}
            onPreview={onPreview}
          />
          <TemplatePagination
            currentPage={safePage}
            totalPages={totalPages}
            onChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
});
