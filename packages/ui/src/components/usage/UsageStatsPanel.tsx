/**
 * UsageStatsPanel — composite component that displays full usage stats,
 * progress bar, limit alerts, and upgrade prompts.
 * TASK-152
 */

import { clsx } from 'clsx';
import { type HTMLAttributes, forwardRef, useMemo, useState } from 'react';
import {
  type UsageStats,
  isUnlimited,
  getAlertSeverity,
  PLAN_DISPLAY_NAMES,
} from './types.js';
import { PlanBadge } from './PlanBadge.js';
import { UsageProgressBar } from './UsageProgressBar.js';
import { UsageStatCard } from './UsageStatCard.js';
import { UsageLimitAlert } from './UsageLimitAlert.js';
import { UpgradePrompt } from './UpgradePrompt.js';

export interface UsageStatsPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Usage statistics to display. */
  stats: UsageStats;
  /** Whether to show the upgrade prompt (default: true when not enterprise). */
  showUpgradePrompt?: boolean | undefined;
  /** Callback when upgrade button is clicked. */
  onUpgrade?: (() => void) | undefined;
  /** Whether the data is loading. */
  loading?: boolean | undefined;
}

function formatLimit(value: number): string {
  if (isUnlimited(value)) return '∞';
  return value.toLocaleString();
}

export const UsageStatsPanel = forwardRef<HTMLDivElement, UsageStatsPanelProps>(
  ({ stats, showUpgradePrompt = true, onUpgrade, loading = false, className, ...rest }, ref) => {
    const [alertDismissed, setAlertDismissed] = useState(false);
    const [upgradeDismissed, setUpgradeDismissed] = useState(false);

    const alertSeverity = useMemo(() => getAlertSeverity(stats.usagePercent), [stats.usagePercent]);

    const runsUnlimited = isUnlimited(stats.limits.maxRunsPerMonth);
    const concurrentUnlimited = isUnlimited(stats.limits.maxConcurrentRuns);
    const showUpgrade = showUpgradePrompt && stats.planTier !== 'enterprise' && !upgradeDismissed;

    if (loading) {
      return (
        <div
          ref={ref}
          className={clsx('cs-usage-stats-panel flex items-center justify-center py-16', className)}
          {...rest}
        >
          <div className="flex flex-col items-center gap-3">
            <svg
              className="animate-spin h-8 w-8 text-indigo-400"
              viewBox="0 0 24 24"
              fill="none"
              aria-label="Loading"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm text-slate-400">Loading usage data…</span>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={clsx('cs-usage-stats-panel flex flex-col gap-5', className)}
        {...rest}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Usage</h2>
          <PlanBadge tier={stats.planTier} />
        </div>

        {/* Limit alert */}
        {alertSeverity && !alertDismissed && (
          <UsageLimitAlert
            severity={alertSeverity}
            heading={
              alertSeverity === 'critical'
                ? 'Run limit reached'
                : 'Approaching run limit'
            }
            description={
              alertSeverity === 'critical'
                ? `You've used ${stats.usagePercent}% of your monthly run limit. Upgrade to continue running workflows.`
                : `You've used ${stats.usagePercent}% of your monthly run limit on the ${PLAN_DISPLAY_NAMES[stats.planTier]} plan.`
            }
            actionLabel={stats.planTier !== 'enterprise' ? 'Upgrade Plan' : undefined}
            onAction={onUpgrade}
            onDismiss={() => setAlertDismissed(true)}
          />
        )}

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-300">Monthly Runs</span>
            <span className="text-sm text-slate-400">
              {stats.runsThisPeriod.toLocaleString()} / {formatLimit(stats.limits.maxRunsPerMonth)}
            </span>
          </div>
          <UsageProgressBar percent={stats.usagePercent} unlimited={runsUnlimited} />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <UsageStatCard
            label="Runs this period"
            value={stats.runsThisPeriod.toLocaleString()}
            limit={runsUnlimited ? '∞' : stats.limits.maxRunsPerMonth.toLocaleString()}
            footer={
              runsUnlimited
                ? 'Unlimited'
                : `${stats.remainingRuns.toLocaleString()} remaining`
            }
          />
          <UsageStatCard
            label="Active runs"
            value={stats.activeRuns}
            limit={concurrentUnlimited ? '∞' : stats.limits.maxConcurrentRuns}
          />
          <UsageStatCard
            label="Max agents"
            value={formatLimit(stats.limits.maxAgents)}
          />
          <UsageStatCard
            label="Max workflows"
            value={formatLimit(stats.limits.maxWorkflows)}
          />
        </div>

        {/* Upgrade prompt */}
        {showUpgrade && (
          <UpgradePrompt
            currentTier={stats.planTier}
            onUpgrade={onUpgrade}
            onDismiss={() => setUpgradeDismissed(true)}
          />
        )}
      </div>
    );
  },
);

UsageStatsPanel.displayName = 'UsageStatsPanel';
