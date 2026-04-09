/**
 * UsageStatCard — renders a single usage metric (e.g. "Runs this month").
 * TASK-152
 */

import { clsx } from 'clsx';
import { type HTMLAttributes, forwardRef } from 'react';

export interface UsageStatCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Label describing the metric. */
  label: string;
  /** Numeric or text value to display. */
  value: string | number;
  /** Optional maximum / limit text shown after value. */
  limit?: string | number | undefined;
  /** Optional footer text (e.g. "2 remaining"). */
  footer?: string | undefined;
}

export const UsageStatCard = forwardRef<HTMLDivElement, UsageStatCardProps>(
  ({ label, value, limit, footer, className, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'cs-usage-stat-card flex flex-col gap-1 rounded-lg border border-slate-700',
          'bg-surface-card p-4 shadow-node',
          className,
        )}
        {...rest}
      >
        <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="text-2xl font-bold text-slate-100">
          {value}
          {limit !== undefined && (
            <span className="text-base font-normal text-slate-500"> / {limit}</span>
          )}
        </span>
        {footer && <span className="text-xs text-slate-500">{footer}</span>}
      </div>
    );
  },
);

UsageStatCard.displayName = 'UsageStatCard';
