import { clsx } from 'clsx';
import { type HTMLAttributes, forwardRef } from 'react';
import type { WorkflowSummary, SortField, SortDirection } from './types.js';
import { WorkflowListRow } from './WorkflowListRow.js';

export interface WorkflowListProps extends HTMLAttributes<HTMLDivElement> {
  workflows: WorkflowSummary[];
  selectedId?: string | undefined;
  sortField?: SortField | undefined;
  sortDirection?: SortDirection | undefined;
  onSortChange?: ((field: SortField) => void) | undefined;
  onOpen?: ((id: string) => void) | undefined;
  onDuplicate?: ((id: string) => void) | undefined;
  onDelete?: ((id: string) => void) | undefined;
}

interface ColumnDef {
  key: SortField | 'actions';
  label: string;
  sortable: boolean;
  width?: string;
}

const columns: ColumnDef[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'status', label: 'Status', sortable: true, width: 'w-28' },
  { key: 'actions', label: 'Agents', sortable: false, width: 'w-24' },
  { key: 'actions', label: 'Tasks', sortable: false, width: 'w-24' },
  { key: 'updatedAt', label: 'Last Updated', sortable: true, width: 'w-32' },
  { key: 'actions', label: '', sortable: false, width: 'w-20' },
];

export const WorkflowList = forwardRef<HTMLDivElement, WorkflowListProps>(
  (
    {
      workflows,
      selectedId,
      sortField,
      sortDirection,
      onSortChange,
      onOpen,
      onDuplicate,
      onDelete,
      className,
      ...rest
    },
    ref,
  ) => {
    const renderSortIcon = (field: SortField) => {
      if (sortField !== field) return null;
      return (
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="currentColor"
          className="ml-1 inline-block"
          aria-hidden="true"
        >
          {sortDirection === 'asc' ? (
            <path d="M6 2l4 5H2z" />
          ) : (
            <path d="M6 10l4-5H2z" />
          )}
        </svg>
      );
    };

    return (
      <div ref={ref} className={clsx('overflow-x-auto', className)} {...rest}>
        <table className="w-full border-collapse" role="grid">
          <thead>
            <tr className="border-b border-slate-700 bg-surface-card">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={clsx(
                    'px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider',
                    col.width,
                    col.sortable && 'cursor-pointer hover:text-slate-300 select-none',
                  )}
                  onClick={
                    col.sortable && col.key !== 'actions'
                      ? () => onSortChange?.(col.key as SortField)
                      : undefined
                  }
                  aria-sort={
                    col.sortable && sortField === col.key
                      ? sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                >
                  {col.label}
                  {col.sortable && col.key !== 'actions' && renderSortIcon(col.key as SortField)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {workflows.map((wf) => (
              <WorkflowListRow
                key={wf.id}
                workflow={wf}
                selected={wf.id === selectedId}
                onOpen={onOpen}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    );
  },
);

WorkflowList.displayName = 'WorkflowList';
