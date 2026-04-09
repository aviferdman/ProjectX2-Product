import { clsx } from 'clsx';
import { type HTMLAttributes, type MouseEvent, forwardRef } from 'react';
import type { WorkflowSummary } from './types.js';
import { WorkflowStatusBadge } from './WorkflowStatusBadge.js';

export interface WorkflowCardProps extends HTMLAttributes<HTMLDivElement> {
  workflow: WorkflowSummary;
  onOpen?: ((id: string) => void) | undefined;
  onDuplicate?: ((id: string) => void) | undefined;
  onDelete?: ((id: string) => void) | undefined;
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export const WorkflowCard = forwardRef<HTMLDivElement, WorkflowCardProps>(
  ({ workflow, onOpen, onDuplicate, onDelete, className, ...rest }, ref) => {
    const handleClick = () => onOpen?.(workflow.id);

    const stopProp = (fn?: (id: string) => void) => (e: MouseEvent) => {
      e.stopPropagation();
      fn?.(workflow.id);
    };

    return (
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        aria-label={`Open workflow ${workflow.name}`}
        onClick={handleClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
        className={clsx(
          'cs-workflow-card group flex flex-col overflow-hidden rounded-xl border',
          'border-slate-700 bg-surface-card shadow-node cursor-pointer',
          'transition-all duration-150',
          'hover:shadow-node-hover hover:border-slate-600',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app',
          className,
        )}
        {...rest}
      >
        {/* Thumbnail area */}
        <div className="h-28 sm:h-40 bg-[rgba(10,14,26,0.8)] border-b border-slate-800 flex items-center justify-center">
          <svg
            className="w-12 h-12 text-slate-600"
            fill="none"
            viewBox="0 0 48 48"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <rect x="6" y="14" width="12" height="10" rx="2" />
            <rect x="30" y="14" width="12" height="10" rx="2" />
            <rect x="18" y="28" width="12" height="10" rx="2" />
            <path d="M18 19h12M24 24v4" />
          </svg>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-2 p-4 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-100 truncate flex-1">
              {workflow.name}
            </h3>
            <WorkflowStatusBadge status={workflow.status} />
          </div>

          {workflow.description && (
            <p className="text-xs text-slate-400 line-clamp-2">{workflow.description}</p>
          )}

          <div className="mt-auto flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500">
              {workflow.agentCount} agent{workflow.agentCount !== 1 ? 's' : ''} · {workflow.taskCount} task{workflow.taskCount !== 1 ? 's' : ''}
            </span>
            <span className="text-[11px] text-slate-500">
              {formatRelativeTime(workflow.updatedAt)}
            </span>
          </div>
        </div>

        {/* Action row */}
        <div className="flex items-center justify-end gap-1 px-3 py-2 border-t border-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity">
          {onDuplicate && (
            <button
              type="button"
              onClick={stopProp(onDuplicate)}
              className="rounded p-1.5 text-slate-500 hover:text-slate-200 hover:bg-surface-elevated transition-colors"
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
              className="rounded p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              aria-label={`Delete ${workflow.name}`}
              title="Delete"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4M12.667 4v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  },
);

WorkflowCard.displayName = 'WorkflowCard';
