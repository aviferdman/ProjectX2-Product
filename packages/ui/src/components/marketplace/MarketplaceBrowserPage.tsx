import React, { forwardRef, useState, useMemo } from 'react';
import { clsx } from 'clsx';
import type {
  IntegrationSummary,
  IntegrationCategory,
  IntegrationSortField,
  SortDirection,
  MarketplaceFilters,
} from './types.js';
import { MARKETPLACE_ITEMS_PER_PAGE } from './types.js';
import { MarketplaceToolbar } from './MarketplaceToolbar.js';
import { IntegrationGrid } from './IntegrationGrid.js';
import { MarketplaceEmptyState } from './MarketplaceEmptyState.js';
import { MarketplacePagination } from './MarketplacePagination.js';

export interface MarketplaceBrowserPageProps extends React.HTMLAttributes<HTMLDivElement> {
  integrations: IntegrationSummary[];
  loading?: boolean;
  onInstall?: ((id: string) => void) | undefined;
  onViewDetails?: ((id: string) => void) | undefined;
}

function applyFilters(
  integrations: IntegrationSummary[],
  filters: MarketplaceFilters,
): IntegrationSummary[] {
  let result = [...integrations];

  // Search filter
  if (filters.search) {
    const query = filters.search.toLowerCase();
    result = result.filter(
      (i) =>
        i.name.toLowerCase().includes(query) ||
        i.description.toLowerCase().includes(query) ||
        i.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        i.author.toLowerCase().includes(query),
    );
  }

  // Category filter
  if (filters.category !== 'all') {
    result = result.filter((i) => i.category === filters.category);
  }

  // Sort
  const { field, direction } = filters.sort;
  const dir = direction === 'asc' ? 1 : -1;
  result.sort((a, b) => {
    switch (field) {
      case 'name':
        return dir * a.name.localeCompare(b.name);
      case 'installs':
        return dir * (a.installCount - b.installCount);
      case 'rating':
        return dir * (a.rating - b.rating);
      case 'updatedAt':
        return dir * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
      default:
        return 0;
    }
  });

  return result;
}

export const MarketplaceBrowserPage = forwardRef<HTMLDivElement, MarketplaceBrowserPageProps>(
  function MarketplaceBrowserPage(
    { integrations, loading = false, onInstall, onViewDetails, className, ...props },
    ref,
  ) {
    const [filters, setFilters] = useState<MarketplaceFilters>({
      search: '',
      category: 'all',
      sort: { field: 'installs', direction: 'desc' },
    });
    const [currentPage, setCurrentPage] = useState(1);

    const filtered = useMemo(() => applyFilters(integrations, filters), [integrations, filters]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / MARKETPLACE_ITEMS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const paginated = filtered.slice(
      (safePage - 1) * MARKETPLACE_ITEMS_PER_PAGE,
      safePage * MARKETPLACE_ITEMS_PER_PAGE,
    );

    const handleSearchChange = (value: string) => {
      setFilters((prev) => ({ ...prev, search: value }));
      setCurrentPage(1);
    };

    const handleCategoryChange = (category: IntegrationCategory | 'all') => {
      setFilters((prev) => ({ ...prev, category }));
      setCurrentPage(1);
    };

    const handleSortChange = (sort: { field: IntegrationSortField; direction: SortDirection }) => {
      setFilters((prev) => ({ ...prev, sort }));
      setCurrentPage(1);
    };

    const handleClearFilters = () => {
      setFilters({ search: '', category: 'all', sort: { field: 'installs', direction: 'desc' } });
      setCurrentPage(1);
    };

    const hasActiveFilters = filters.search !== '' || filters.category !== 'all';

    return (
      <div
        ref={ref}
        className={clsx('flex flex-col gap-6', 'max-w-[1440px] mx-auto', 'p-6', className)}
        {...props}
      >
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-[var(--cs-text-primary,#fafafa)]">Marketplace</h1>
          <p className="text-sm text-[var(--cs-text-secondary,#a1a1aa)] mt-1">
            Discover and install integrations to extend your workflows
          </p>
        </div>

        {/* Toolbar: search, filters, sort */}
        <MarketplaceToolbar
          search={filters.search}
          onSearchChange={handleSearchChange}
          category={filters.category}
          onCategoryChange={handleCategoryChange}
          sort={filters.sort}
          onSortChange={handleSortChange}
          resultCount={filtered.length}
          totalCount={integrations.length}
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
            <span className="sr-only">Loading integrations…</span>
          </div>
        ) : paginated.length === 0 ? (
          <MarketplaceEmptyState
            heading={hasActiveFilters ? 'No matching integrations' : 'No integrations yet'}
            description={
              hasActiveFilters
                ? "Try adjusting your search or filters to find what you're looking for."
                : 'Integrations will appear here once they are published.'
            }
            isSearchResult={hasActiveFilters}
            onClearFilters={handleClearFilters}
          />
        ) : (
          <>
            <IntegrationGrid
              integrations={paginated}
              onInstall={onInstall}
              onViewDetails={onViewDetails}
            />
            <MarketplacePagination
              currentPage={safePage}
              totalPages={totalPages}
              onChange={setCurrentPage}
            />
          </>
        )}
      </div>
    );
  },
);
