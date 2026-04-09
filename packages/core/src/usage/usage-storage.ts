/**
 * In-memory usage storage implementation.
 *
 * Provides {@link UsageStorageProvider} and {@link AccountPlanProvider}
 * backed by in-memory Maps. Useful for development, testing, and
 * short-lived sessions.
 *
 * @packageDocumentation
 */

import { UsageRunNotFoundError, UsageInvalidTransitionError } from './usage-errors.js';
import type {
  AccountPlan,
  AccountPlanProvider,
  CompleteRunInput,
  ListRunsOptions,
  ListRunsResult,
  RecordRunInput,
  UsageRunRecord,
  UsageStorageProvider,
} from './usage-types.js';

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

let _counter = 0;

function generateRunId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  _counter += 1;
  return `run_${timestamp}_${random}_${String(_counter)}`;
}

/** Reset the internal counter (for testing only). */
export function _resetRunIdCounter(): void {
  _counter = 0;
}

// ---------------------------------------------------------------------------
// InMemoryUsageStorage
// ---------------------------------------------------------------------------

/**
 * In-memory implementation of {@link UsageStorageProvider}.
 *
 * @example
 * ```typescript
 * const storage = new InMemoryUsageStorage();
 *
 * const run = await storage.recordRun({
 *   accountId: 'acct-1',
 *   workflowId: 'wf-123',
 * });
 *
 * await storage.completeRun(run.id, { status: 'completed' });
 * ```
 */
export class InMemoryUsageStorage implements UsageStorageProvider {
  private readonly _runs = new Map<string, UsageRunRecord>();

  get size(): number {
    return this._runs.size;
  }

  async recordRun(input: RecordRunInput): Promise<UsageRunRecord> {
    if (!input.accountId || input.accountId.trim().length === 0) {
      throw new Error('accountId is required');
    }
    if (!input.workflowId || input.workflowId.trim().length === 0) {
      throw new Error('workflowId is required');
    }

    const now = new Date().toISOString();
    const record: UsageRunRecord = {
      id: generateRunId(),
      accountId: input.accountId,
      workflowId: input.workflowId,
      status: 'started',
      startedAt: now,
      metadata: input.metadata ? { ...input.metadata } : undefined,
    };

    this._runs.set(record.id, record);
    return record;
  }

  async completeRun(runId: string, input: CompleteRunInput): Promise<UsageRunRecord> {
    const existing = this._runs.get(runId);
    if (!existing) {
      throw new UsageRunNotFoundError(runId);
    }

    if (existing.status !== 'started') {
      throw new UsageInvalidTransitionError(runId, existing.status, input.status);
    }

    const now = new Date().toISOString();
    const startTime = new Date(existing.startedAt).getTime();
    const endTime = new Date(now).getTime();

    const updated: UsageRunRecord = {
      ...existing,
      status: input.status,
      endedAt: now,
      durationMs: endTime - startTime,
      metadata: input.metadata
        ? { ...existing.metadata, ...input.metadata }
        : existing.metadata,
    };

    this._runs.set(runId, updated);
    return updated;
  }

  async getRun(runId: string): Promise<UsageRunRecord | undefined> {
    return this._runs.get(runId);
  }

  async listRuns(options?: ListRunsOptions): Promise<ListRunsResult> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const sortBy = options?.sortBy ?? 'startedAt';
    const sortOrder = options?.sortOrder ?? 'desc';

    let runs = Array.from(this._runs.values());

    // Apply filters
    if (options?.accountId) {
      runs = runs.filter((r) => r.accountId === options.accountId);
    }
    if (options?.workflowId) {
      runs = runs.filter((r) => r.workflowId === options.workflowId);
    }
    if (options?.status) {
      runs = runs.filter((r) => r.status === options.status);
    }
    if (options?.startedAfter) {
      const after = options.startedAfter;
      runs = runs.filter((r) => r.startedAt >= after);
    }
    if (options?.startedBefore) {
      const before = options.startedBefore;
      runs = runs.filter((r) => r.startedAt <= before);
    }

    const total = runs.length;

    // Sort
    runs.sort((a, b) => {
      let cmp: number;
      if (sortBy === 'endedAt') {
        const aVal = a.endedAt ?? '';
        const bVal = b.endedAt ?? '';
        cmp = aVal.localeCompare(bVal);
      } else {
        cmp = a.startedAt.localeCompare(b.startedAt);
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    // Paginate
    runs = runs.slice(offset, offset + limit);

    return { runs, total };
  }

  async countRuns(
    accountId: string,
    startedAfter: string,
    startedBefore: string,
  ): Promise<number> {
    let count = 0;
    for (const run of this._runs.values()) {
      if (
        run.accountId === accountId &&
        run.startedAt >= startedAfter &&
        run.startedAt <= startedBefore
      ) {
        count++;
      }
    }
    return count;
  }

  async countActiveRuns(accountId: string): Promise<number> {
    let count = 0;
    for (const run of this._runs.values()) {
      if (run.accountId === accountId && run.status === 'started') {
        count++;
      }
    }
    return count;
  }

  /** Remove all stored runs. Primarily for testing. */
  clear(): void {
    this._runs.clear();
  }
}

// ---------------------------------------------------------------------------
// InMemoryAccountPlanStorage
// ---------------------------------------------------------------------------

/**
 * In-memory implementation of {@link AccountPlanProvider}.
 *
 * @example
 * ```typescript
 * const plans = new InMemoryAccountPlanStorage();
 *
 * await plans.setAccountPlan({
 *   accountId: 'acct-1',
 *   planTier: 'pro',
 *   billingPeriodStart: '2026-04-01T00:00:00.000Z',
 * });
 * ```
 */
export class InMemoryAccountPlanStorage implements AccountPlanProvider {
  private readonly _plans = new Map<string, AccountPlan>();

  get size(): number {
    return this._plans.size;
  }

  async getAccountPlan(accountId: string): Promise<AccountPlan | undefined> {
    return this._plans.get(accountId);
  }

  async setAccountPlan(plan: AccountPlan): Promise<AccountPlan> {
    if (!plan.accountId || plan.accountId.trim().length === 0) {
      throw new Error('accountId is required');
    }
    this._plans.set(plan.accountId, { ...plan });
    return plan;
  }

  /** Remove all stored plans. Primarily for testing. */
  clear(): void {
    this._plans.clear();
  }
}
