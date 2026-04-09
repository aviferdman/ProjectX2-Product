import { clsx } from 'clsx';
import { type HTMLAttributes, type MouseEvent, forwardRef } from 'react';
import type { WorkflowSummary } from './types.js';
import { WorkflowStatusBadge } from './WorkflowStatusBadge.js';

export interface WorkflowListRowProps extends HTMLAttributes<HTMLTableRowElement> {
  workflow: WorkflowSummary;
  selected?: boolean | undefined;
  onOpen?: ((id: string) => void) | undefined;
  onDuplicate?: ((id: string) => void) | undefined;
  onDelete?: ((id: string) => void) | undefined;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const WorkflowListRow = forwardRef<HTMLTableRowElement, WorkflowListRowProps>(
  ({ workflow, selected, onOpen, onDuplicate, onDelete, className, ...rest }, ref) => {
    const handleClick = () => onOpen?.(workflow.id);

    const stopProp = (fn?: (id: string) => void) => (e: MouseEvent) => {
      e.stopPropagation();
      fn?.(workflow.id);
    };

    return (
      <tr
        ref={ref}
        role="row"
        tabIndex={0}
        aria-selected={selected}
        onClick={handleClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
        className={clsx(
          'cs-workflow-list group h-14 border-b border-slate-800 cursor-pointer',
          'transition-colors duration-100',
          selected ? 'bg-violet-500/[0.08]' : 'hover:bg-slate-800/50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary',
          className,
        )}
        {...rest}
      >
        <td className="px-4 py-2">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-100 truncate max-w-[260px]">
              {workflow.name}
            </span>
            {workflow.description && (
              <span className="text-xs text-slate-500 truncate max-w-[260px]">
                {workflow.description}
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-2">
          <WorkflowStatusBadge status={workflow.status} />
        </td>
        <td className="px-4 py-2 text-xs text-slate-400">
          {workflow.agentCount} agent{workflow.agentCount !== 1 ? 's' : ''}
        </td>
        <td className="px-4 py-2 text-xs text-slate-400">
          {workflow.taskCount} task{workflow.taskCount !== 1 ? 's' : ''}
        </td>
        <td className="px-4 py-2 text-xs text-slate-500">
          {formatDate(workflow.updatedAt)}
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onDuplicate && (
              <button
                type="button"
                onClick={stopProp(onDuplicate)}
                className="rounded p-1 text-slate-500 hover:text-slate-200 hover:bg-surface-elevated transition-colors"
                aria-label={`Duplicate ${workflow.name}`}
                title="Duplicate"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="5" y="5" width="9" height="9" rx="1.5" />
                  <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-7A1.5 1.5 0 001 3.5v7A1.5 1.5 0 002.5 12H5" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={stopProp(onDelete)}
                className="rounded p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                aria-label={`Delete ${workflow.name}`}
                title="Delete"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4M12.667 4v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4" />
                </svg>
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  },
);

WorkflowListRow.displayName = 'WorkflowListRow';
