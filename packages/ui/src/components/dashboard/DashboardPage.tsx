import { clsx } from 'clsx';
import { type HTMLAttributes, forwardRef, useState, useMemo, useCallback } from 'react';
import type {
  WorkflowSummary,
  ViewMode,
  SortField,
  SortDirection,
  DashboardFilters,
} from './types.js';
import { DashboardToolbar } from './DashboardToolbar.js';
import { WorkflowGrid } from './WorkflowGrid.js';
import { WorkflowList } from './WorkflowList.js';
import { EmptyState } from './EmptyState.js';
import type { FilterOption } from './FilterChips.js';

export interface DashboardPageProps extends HTMLAttributes<HTMLDivElement> {
  workflows: WorkflowSummary[];
  loading?: boolean | undefined;
  onOpen?: ((id: string) => void) | undefined;
  onCreate?: (() => void) | undefined;
  onDuplicate?: ((id: string) => void) | undefined;
  onDelete?: ((id: string) => void) | undefined;
  /** Initial view mode (default: grid) */
  defaultViewMode?: ViewMode | undefined;
}

function applyFilters(
  workflows: WorkflowSummary[],
  filters: DashboardFilters,
): WorkflowSummary[] {
  let result = [...workflows];

  // Text search
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (wf) =>
        wf.name.toLowerCase().includes(q) ||
        wf.description?.toLowerCase().includes(q),
    );
  }

  // Status filter
  if (filters.status !== 'all') {
    result = result.filter((wf) => wf.status === filters.status);
  }

  // Sort
  const dir = filters.sort.direction === 'asc' ? 1 : -1;
  result.sort((a, b) => {
    const field = filters.sort.field;
    if (field === 'name') return a.name.localeCompare(b.name) * dir;
    if (field === 'status') return a.status.localeCompare(b.status) * dir;
    const aVal = new Date(a[field]).getTime();
    const bVal = new Date(b[field]).getTime();
    return (aVal - bVal) * dir;
  });

  return result;
}

export const DashboardPage = forwardRef<HTMLDivElement, DashboardPageProps>(
  (
    {
      workflows,
      loading = false,
      onOpen,
      onCreate,
      onDuplicate,
      onDelete,
      defaultViewMode = 'grid',
      className,
      ...rest
    },
    ref,
  ) => {
    const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);
    const [filters, setFilters] = useState<DashboardFilters>({
      search: '',
      status: 'all',
      sort: { field: 'updatedAt', direction: 'desc' },
    });

    const filtered = useMemo(() => applyFilters(workflows, filters), [workflows, filters]);

    const handleSearchChange = useCallback(
      (search: string) => setFilters((f) => ({ ...f, search })),
      [],
    );

    const handleStatusChange = useCallback(
      (status: FilterOption) => setFilters((f) => ({ ...f, status })),
      [],
    );

    const handleSortChange = useCallback(
      (field: SortField) =>
        setFilters((f) => ({
          ...f,
          sort: {
            field,
            direction: f.sort.field === field && f.sort.direction === 'asc' ? 'desc' : 'asc',
          },
        })),
      [],
    );

    const hasWorkflows = workflows.length > 0;
    const hasResults = filtered.length > 0;

    return (
      <div
        ref={ref}
        className={clsx('cs-dashboard flex flex-col gap-6', className)}
        {...rest}
      >
        {/* Toolbar */}
        <DashboardToolbar
          search={filters.search}
          onSearchChange={handleSearchChange}
          statusFilter={filters.status}
          onStatusFilterChange={handleStatusChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onCreate={onCreate}
        />

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <svg
                className="animate-spin h-8 w-8 text-violet-400"
                viewBox="0 0 24 24"
                fill="none"
                aria-label="Loading"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm text-slate-400">Loading workflows…</span>
            </div>
          </div>
        ) : !hasWorkflows ? (
          <EmptyState onAction={onCreate} />
        ) : !hasResults ? (
          <EmptyState
            heading="No matching workflows"
            description="Try adjusting your search or filter criteria."
            actionLabel="Clear Filters"
            onAction={() =>
              setFilters({ search: '', status: 'all', sort: filters.sort })
            }
          />
        ) : viewMode === 'grid' ? (
          <WorkflowGrid
            workflows={filtered}
            onOpen={onOpen}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        ) : (
          <WorkflowList
            workflows={filtered}
            sortField={filters.sort.field}
            sortDirection={filters.sort.direction}
            onSortChange={handleSortChange}
            onOpen={onOpen}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        )}

        {/* Result count */}
        {hasWorkflows && !loading && (
          <p className="text-xs text-slate-500 text-center">
            Showing {filtered.length} of {workflows.length} workflow{workflows.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    );
  },
);

DashboardPage.displayName = 'DashboardPage';
