/**
 * UsageProgressBar — visualises usage as a percentage with color coding.
 * TASK-152
 */

import { clsx } from 'clsx';
import { type HTMLAttributes, forwardRef } from 'react';
import { USAGE_THRESHOLDS } from './types.js';

export interface UsageProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  /** Percentage of limit used (0–100). */
  percent: number;
  /** Whether the limit is unlimited (-1). If true the bar is hidden. */
  unlimited?: boolean | undefined;
}

function barColor(percent: number): string {
  if (percent >= USAGE_THRESHOLDS.critical) return 'bg-rose-500';
  if (percent >= USAGE_THRESHOLDS.warning) return 'bg-amber-500';
  return 'bg-violet-500';
}

export const UsageProgressBar = forwardRef<HTMLDivElement, UsageProgressBarProps>(
  ({ percent, unlimited = false, className, ...rest }, ref) => {
    if (unlimited) {
      return (
        <div
          ref={ref}
          className={clsx('cs-usage-progress text-xs text-slate-500 italic', className)}
          {...rest}
        >
          Unlimited
        </div>
      );
    }

    const clamped = Math.max(0, Math.min(100, percent));

    return (
      <div ref={ref} className={clsx('cs-usage-progress flex flex-col gap-1', className)} {...rest}>
        <div
          className="h-2 w-full rounded-full bg-slate-700 overflow-hidden"
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${clamped}% used`}
        >
          <div
            className={clsx('h-full rounded-full transition-all duration-300', barColor(clamped))}
            style={{ width: `${clamped}%` }}
          />
        </div>
        <span className="text-[11px] text-slate-400">{clamped}% used</span>
      </div>
    );
  },
);

UsageProgressBar.displayName = 'UsageProgressBar';
