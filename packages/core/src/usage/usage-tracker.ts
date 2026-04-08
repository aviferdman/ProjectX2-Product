/**
 * Usage tracking service.
 *
 * Provides the main {@link UsageTracker} class that combines storage and
 * plan providers to record runs, check limits, and produce usage summaries.
 *
 * @packageDocumentation
 */

import {
  UsageAccountNotFoundError,
  UsageLimitExceededError,
} from './usage-errors.js';
import type {
  AccountPlanProvider,
  CompleteRunInput,
  ListRunsOptions,
  ListRunsResult,
  PlanLimits,
  RecordRunInput,
  UsageRunRecord,
  UsageStorageProvider,
  UsageSummary,
} from './usage-types.js';
import { DEFAULT_PLAN_LIMITS } from './usage-types.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/** Configuration for the {@link UsageTracker}. */
export interface UsageTrackerConfig {
  /** Storage provider for run records. */
  readonly storage: UsageStorageProvider;

  /** Provider for account plan information. */
  readonly plans: AccountPlanProvider;

  /**
   * Whether to enforce limits before recording a run.
   * When false, limits are checked but runs are still recorded.
   * Default: true.
   */
  readonly enforceLimits?: boolean;
}

// ---------------------------------------------------------------------------
// Limit check result
// ---------------------------------------------------------------------------

/** Result of a limit check. */
export interface LimitCheckResult {
  /** Whether the action is allowed. */
  readonly allowed: boolean;

  /** If not allowed, which limit was exceeded. */
  readonly exceededLimit?: keyof PlanLimits;

  /** Current value for the exceeded limit. */
  readonly currentValue?: number;

  /** Maximum value for the exceeded limit. */
  readonly limitValue?: number;
}

// ---------------------------------------------------------------------------
// UsageTracker
// ---------------------------------------------------------------------------

/**
 * Service for tracking workflow runs and enforcing plan-based limits.
 *
 * Combines a {@link UsageStorageProvider} for persisting run records with an
 * {@link AccountPlanProvider} for resolving plan limits. Optionally enforces
 * limits before allowing new runs.
 *
 * @example
 * ```typescript
 * import {
 *   UsageTracker,
 *   InMemoryUsageStorage,
 *   InMemoryAccountPlanStorage,
 * } from '@crewspace/core';
 *
 * const tracker = new UsageTracker({
 *   storage: new InMemoryUsageStorage(),
 *   plans: new InMemoryAccountPlanStorage(),
 * });
 *
 * // Set up an account on the free plan
 * await tracker.plans.setAccountPlan({
 *   accountId: 'acct-1',
 *   planTier: 'free',
 *   billingPeriodStart: '2026-04-01T00:00:00.000Z',
 * });
 *
 * // Record a run (limit-checked automatically)
 * const run = await tracker.recordRun({
 *   accountId: 'acct-1',
 *   workflowId: 'wf-123',
 * });
 *
 * // Complete the run
 * await tracker.completeRun(run.id, { status: 'completed' });
 *
 * // Get usage summary
 * const summary = await tracker.getUsageSummary('acct-1');
 * console.log(summary.runsThisPeriod); // 1
 * ```
 */
export class UsageTracker {
  private readonly _storage: UsageStorageProvider;
  private readonly _plans: AccountPlanProvider;
  private readonly _enforceLimits: boolean;

  constructor(config: UsageTrackerConfig) {
    this._storage = config.storage;
    this._plans = config.plans;
    this._enforceLimits = config.enforceLimits ?? true;
  }

  /** The underlying storage provider. */
  get storage(): UsageStorageProvider {
    return this._storage;
  }

  /** The underlying plan provider. */
  get plans(): AccountPlanProvider {
    return this._plans;
  }

  /**
   * Record a new workflow run.
   *
   * If limit enforcement is enabled, checks monthly run and concurrent run
   * limits before recording. Throws {@link UsageLimitExceededError} if a
   * limit is exceeded.
   */
  async recordRun(input: RecordRunInput): Promise<UsageRunRecord> {
    if (this._enforceLimits) {
      const check = await this.checkLimits(input.accountId);
      if (!check.allowed) {
        const plan = await this._plans.getAccountPlan(input.accountId);
        throw new UsageLimitExceededError(
          input.accountId,
          check.exceededLimit!,
          check.currentValue!,
          check.limitValue!,
          plan?.planTier ?? 'free',
        );
      }
    }

    return this._storage.recordRun(input);
  }

  /**
   * Complete a run with a final status.
   */
  async completeRun(runId: string, input: CompleteRunInput): Promise<UsageRunRecord> {
    return this._storage.completeRun(runId, input);
  }

  /**
   * Get a run by ID.
   */
  async getRun(runId: string): Promise<UsageRunRecord | undefined> {
    return this._storage.getRun(runId);
  }

  /**
   * List runs with optional filtering.
   */
  async listRuns(options?: ListRunsOptions): Promise<ListRunsResult> {
    return this._storage.listRuns(options);
  }

  /**
   * Check whether a new run is allowed for the given account.
   *
   * Checks both monthly run limits and concurrent run limits.
   * Returns a {@link LimitCheckResult} describing whether the action
   * is allowed and, if not, which limit was exceeded.
   */
  async checkLimits(accountId: string): Promise<LimitCheckResult> {
    const plan = await this._plans.getAccountPlan(accountId);
    if (!plan) {
      throw new UsageAccountNotFoundError(accountId);
    }

    const limits = this._resolveEffectiveLimits(plan.planTier, plan.customLimits);

    // Check monthly run limit
    if (limits.maxRunsPerMonth !== -1) {
      const now = new Date().toISOString();
      const runsThisPeriod = await this._storage.countRuns(
        accountId,
        plan.billingPeriodStart,
        now,
      );

      if (runsThisPeriod >= limits.maxRunsPerMonth) {
        return {
          allowed: false,
          exceededLimit: 'maxRunsPerMonth',
          currentValue: runsThisPeriod,
          limitValue: limits.maxRunsPerMonth,
        };
      }
    }

    // Check concurrent run limit
    if (limits.maxConcurrentRuns !== -1) {
      const activeRuns = await this._storage.countActiveRuns(accountId);

      if (activeRuns >= limits.maxConcurrentRuns) {
        return {
          allowed: false,
          exceededLimit: 'maxConcurrentRuns',
          currentValue: activeRuns,
          limitValue: limits.maxConcurrentRuns,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Get a usage summary for the given account.
   */
  async getUsageSummary(accountId: string): Promise<UsageSummary> {
    const plan = await this._plans.getAccountPlan(accountId);
    if (!plan) {
      throw new UsageAccountNotFoundError(accountId);
    }

    const limits = this._resolveEffectiveLimits(plan.planTier, plan.customLimits);
    const now = new Date().toISOString();

    const runsThisPeriod = await this._storage.countRuns(
      accountId,
      plan.billingPeriodStart,
      now,
    );
    const activeRuns = await this._storage.countActiveRuns(accountId);

    const remainingRuns =
      limits.maxRunsPerMonth === -1
        ? -1
        : Math.max(0, limits.maxRunsPerMonth - runsThisPeriod);

    const usagePercent =
      limits.maxRunsPerMonth === -1
        ? 0
        : Math.min(100, Math.round((runsThisPeriod / limits.maxRunsPerMonth) * 100));

    return {
      accountId,
      runsThisPeriod,
      activeRuns,
      planTier: plan.planTier,
      limits,
      remainingRuns,
      usagePercent,
    };
  }

  /**
   * Resolve effective limits by merging plan defaults with any custom overrides.
   */
  private _resolveEffectiveLimits(
    planTier: string,
    customLimits?: Partial<PlanLimits>,
  ): PlanLimits {
    const defaults = DEFAULT_PLAN_LIMITS[planTier as keyof typeof DEFAULT_PLAN_LIMITS] ??
      DEFAULT_PLAN_LIMITS.free;

    if (!customLimits) {
      return defaults;
    }

    return {
      maxRunsPerMonth: customLimits.maxRunsPerMonth ?? defaults.maxRunsPerMonth,
      maxConcurrentRuns: customLimits.maxConcurrentRuns ?? defaults.maxConcurrentRuns,
      maxWorkflows: customLimits.maxWorkflows ?? defaults.maxWorkflows,
    };
  }
}
