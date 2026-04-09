/**
 * Usage Stats Display — shared types
 * TASK-152: Implement usage stats display (runs, limits, upgrade prompts)
 *
 * Mirrors core usage types for the UI layer so the UI package does not
 * depend directly on @crewspace/core at runtime.
 */

// ---------------------------------------------------------------------------
// Plan tiers (mirrors @crewspace/core usage-types)
// ---------------------------------------------------------------------------

/** Available plan tiers. */
export type PlanTier = 'free' | 'pro' | 'team' | 'enterprise';

/** Limits associated with a plan tier. */
export interface PlanLimits {
  readonly maxRunsPerMonth: number;
  readonly maxConcurrentRuns: number;
  readonly maxAgents: number;
  readonly maxWorkflows: number;
}

// ---------------------------------------------------------------------------
// Usage summary (UI-specific subset)
// ---------------------------------------------------------------------------

/** Usage summary data fed into the stats display. */
export interface UsageStats {
  /** Account identifier. */
  readonly accountId: string;

  /** Total runs in the current billing period. */
  readonly runsThisPeriod: number;

  /** Number of currently active (started) runs. */
  readonly activeRuns: number;

  /** The plan tier for this account. */
  readonly planTier: PlanTier;

  /** Limits for the current plan. */
  readonly limits: PlanLimits;

  /** Number of remaining runs this period (-1 if unlimited). */
  readonly remainingRuns: number;

  /** Percentage of monthly run limit used (0-100, or 0 if unlimited). */
  readonly usagePercent: number;
}

// ---------------------------------------------------------------------------
// Alert severity
// ---------------------------------------------------------------------------

/** Severity level for usage limit alerts. */
export type UsageAlertSeverity = 'info' | 'warning' | 'critical';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Whether a limit value represents "unlimited". */
export function isUnlimited(value: number): boolean {
  return value === -1;
}

/** Plan display names. */
export const PLAN_DISPLAY_NAMES: Readonly<Record<PlanTier, string>> = {
  free: 'Free',
  pro: 'Pro',
  team: 'Team',
  enterprise: 'Enterprise',
};

/** Usage threshold percentages for alert severity. */
export const USAGE_THRESHOLDS = {
  warning: 80,
  critical: 95,
} as const;

/**
 * Determine the alert severity for a given usage percentage.
 * Returns `undefined` if usage is below the warning threshold.
 */
export function getAlertSeverity(usagePercent: number): UsageAlertSeverity | undefined {
  if (usagePercent >= USAGE_THRESHOLDS.critical) return 'critical';
  if (usagePercent >= USAGE_THRESHOLDS.warning) return 'warning';
  return undefined;
}
