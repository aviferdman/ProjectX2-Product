/**
 * Types for the usage tracking API.
 *
 * Defines the data model for tracking workflow runs per account,
 * enforcing plan-based limits, and querying usage statistics.
 *
 * @packageDocumentation
 */

// ---------------------------------------------------------------------------
// Plan tiers
// ---------------------------------------------------------------------------

/** Available plan tiers with associated usage limits. */
export type PlanTier = 'free' | 'starter' | 'pro' | 'enterprise';

/** Limits associated with a plan tier. */
export interface PlanLimits {
  /** Maximum workflow runs per calendar month. -1 means unlimited. */
  readonly maxRunsPerMonth: number;

  /** Maximum concurrent workflow runs. -1 means unlimited. */
  readonly maxConcurrentRuns: number;

  /** Maximum number of stored workflows. -1 means unlimited. */
  readonly maxWorkflows: number;
}

/** Default limits for each plan tier. */
export const DEFAULT_PLAN_LIMITS: Readonly<Record<PlanTier, PlanLimits>> = {
  free: { maxRunsPerMonth: 50, maxConcurrentRuns: 1, maxWorkflows: 3 },
  starter: { maxRunsPerMonth: 500, maxConcurrentRuns: 3, maxWorkflows: 20 },
  pro: { maxRunsPerMonth: 5000, maxConcurrentRuns: 10, maxWorkflows: -1 },
  enterprise: { maxRunsPerMonth: -1, maxConcurrentRuns: -1, maxWorkflows: -1 },
};

// ---------------------------------------------------------------------------
// Usage record
// ---------------------------------------------------------------------------

/** Status of a single workflow run. */
export type RunStatus = 'started' | 'completed' | 'failed' | 'cancelled';

/** A single recorded workflow run. */
export interface UsageRunRecord {
  /** Unique run identifier. */
  readonly id: string;

  /** Account that owns this run. */
  readonly accountId: string;

  /** Workflow that was executed. */
  readonly workflowId: string;

  /** Current status of the run. */
  readonly status: RunStatus;

  /** ISO-8601 timestamp when the run started. */
  readonly startedAt: string;

  /** ISO-8601 timestamp when the run completed/failed/cancelled, if applicable. */
  readonly endedAt?: string;

  /** Duration in milliseconds, if the run has ended. */
  readonly durationMs?: number;

  /** Optional metadata attached to the run. */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Record run input
// ---------------------------------------------------------------------------

/** Input for recording a new workflow run. */
export interface RecordRunInput {
  /** Account that owns this run. */
  readonly accountId: string;

  /** Workflow that was executed. */
  readonly workflowId: string;

  /** Optional metadata to attach. */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/** Input for completing an existing run. */
export interface CompleteRunInput {
  /** Final status of the run. */
  readonly status: 'completed' | 'failed' | 'cancelled';

  /** Optional metadata to merge. */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Usage summary
// ---------------------------------------------------------------------------

/** Aggregated usage statistics for an account. */
export interface UsageSummary {
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
// Query options
// ---------------------------------------------------------------------------

/** Options for querying usage run records. */
export interface ListRunsOptions {
  /** Filter by account ID. */
  readonly accountId?: string;

  /** Filter by workflow ID. */
  readonly workflowId?: string;

  /** Filter by run status. */
  readonly status?: RunStatus;

  /** Only include runs started on or after this ISO-8601 timestamp. */
  readonly startedAfter?: string;

  /** Only include runs started on or before this ISO-8601 timestamp. */
  readonly startedBefore?: string;

  /** Maximum number of results (default: 50). */
  readonly limit?: number;

  /** Offset for pagination (default: 0). */
  readonly offset?: number;

  /** Sort field (default: 'startedAt'). */
  readonly sortBy?: 'startedAt' | 'endedAt';

  /** Sort direction (default: 'desc'). */
  readonly sortOrder?: 'asc' | 'desc';
}

/** Result of a list runs query. */
export interface ListRunsResult {
  /** The matching run records. */
  readonly runs: readonly UsageRunRecord[];

  /** Total matching records before pagination. */
  readonly total: number;
}

// ---------------------------------------------------------------------------
// Storage provider interface
// ---------------------------------------------------------------------------

/** Abstract storage provider for usage tracking. */
export interface UsageStorageProvider {
  /** Record a new workflow run (status = 'started'). */
  recordRun(input: RecordRunInput): Promise<UsageRunRecord>;

  /** Update a run's status when it completes/fails/cancels. */
  completeRun(runId: string, input: CompleteRunInput): Promise<UsageRunRecord>;

  /** Get a run by ID. Returns undefined if not found. */
  getRun(runId: string): Promise<UsageRunRecord | undefined>;

  /** List runs with optional filtering and pagination. */
  listRuns(options?: ListRunsOptions): Promise<ListRunsResult>;

  /** Count runs for an account within a date range. */
  countRuns(accountId: string, startedAfter: string, startedBefore: string): Promise<number>;

  /** Count currently active (started) runs for an account. */
  countActiveRuns(accountId: string): Promise<number>;
}

// ---------------------------------------------------------------------------
// Account plan storage
// ---------------------------------------------------------------------------

/** Account plan information. */
export interface AccountPlan {
  /** Account identifier. */
  readonly accountId: string;

  /** Current plan tier. */
  readonly planTier: PlanTier;

  /** Custom limits that override plan defaults, if any. */
  readonly customLimits?: Partial<PlanLimits>;

  /** ISO-8601 start of the current billing period. */
  readonly billingPeriodStart: string;
}

/** Storage for account plan information. */
export interface AccountPlanProvider {
  /** Get account plan info. Returns undefined if not found. */
  getAccountPlan(accountId: string): Promise<AccountPlan | undefined>;

  /** Set or update the plan for an account. */
  setAccountPlan(plan: AccountPlan): Promise<AccountPlan>;
}
