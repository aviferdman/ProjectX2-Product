/**
 * PlanBadge — displays the current plan tier as a styled badge.
 * TASK-152
 */

import { clsx } from 'clsx';
import { type HTMLAttributes, forwardRef } from 'react';
import { type PlanTier, PLAN_DISPLAY_NAMES } from './types.js';

const tierStyles: Record<PlanTier, string> = {
  free: 'bg-slate-800/60 text-slate-300 border-slate-600',
  pro: 'bg-indigo-900/40 text-indigo-300 border-indigo-700/50',
  team: 'bg-sky-900/40 text-sky-300 border-sky-700/50',
  enterprise: 'bg-amber-900/30 text-amber-300 border-amber-700/50',
};

export interface PlanBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tier: PlanTier;
}

export const PlanBadge = forwardRef<HTMLSpanElement, PlanBadgeProps>(
  ({ tier, className, ...rest }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(
          'cs-plan-badge inline-flex items-center rounded-full border px-2.5 py-0.5',
          'text-[11px] font-semibold uppercase tracking-wider',
          tierStyles[tier],
          className,
        )}
        {...rest}
      >
        {PLAN_DISPLAY_NAMES[tier]}
      </span>
    );
  },
);

PlanBadge.displayName = 'PlanBadge';
