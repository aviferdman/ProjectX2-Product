import { clsx } from 'clsx';
import { type HTMLAttributes, forwardRef } from 'react';
import type { WorkflowStatus } from './types.js';

const statusStyles: Record<WorkflowStatus, string> = {
  draft: 'bg-slate-400/10 text-slate-400 border-slate-400/20',
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  error: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  archived: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
};

const statusLabels: Record<WorkflowStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  error: 'Error',
  archived: 'Archived',
};

export interface WorkflowStatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: WorkflowStatus;
}

export const WorkflowStatusBadge = forwardRef<HTMLSpanElement, WorkflowStatusBadgeProps>(
  ({ status, className, ...rest }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(
          'inline-flex items-center rounded-full border px-2 py-0.5',
          'text-[10px] font-semibold uppercase tracking-wider',
          statusStyles[status],
          className,
        )}
        {...rest}
      >
        {statusLabels[status]}
      </span>
    );
  },
);

WorkflowStatusBadge.displayName = 'WorkflowStatusBadge';
