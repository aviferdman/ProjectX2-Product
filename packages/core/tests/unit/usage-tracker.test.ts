/**
 * Tests for the usage tracking API.
 */
import { describe, it, expect, beforeEach } from 'vitest';

import {
  InMemoryUsageStorage,
  InMemoryAccountPlanStorage,
  UsageTracker,
  _resetRunIdCounter,
  DEFAULT_PLAN_LIMITS,
} from '../../src/usage/index.js';
import {
  UsageLimitExceededError,
  UsageRunNotFoundError,
  UsageAccountNotFoundError,
  UsageInvalidTransitionError,
} from '../../src/usage/index.js';
import type { AccountPlan } from '../../src/usage/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAccountPlan(overrides?: Partial<AccountPlan>): AccountPlan {
  return {
    accountId: 'acct-1',
    planTier: 'free',
    billingPeriodStart: '2026-04-01T00:00:00.000Z',
    ...overrides,
  };
}

function createTracker(options?: { enforceLimits?: boolean }) {
  const storage = new InMemoryUsageStorage();
  const plans = new InMemoryAccountPlanStorage();
  const tracker = new UsageTracker({
    storage,
    plans,
    enforceLimits: options?.enforceLimits,
  });
  return { storage, plans, tracker };
}

// ---------------------------------------------------------------------------
// InMemoryUsageStorage
// ---------------------------------------------------------------------------

describe('InMemoryUsageStorage', () => {
  let storage: InMemoryUsageStorage;

  beforeEach(() => {
    storage = new InMemoryUsageStorage();
    _resetRunIdCounter();
  });

  // -----------------------------------------------------------------------
  // recordRun
  // -----------------------------------------------------------------------

  describe('recordRun', () => {
    it('creates a run with generated id and started status', async () => {
      const run = await storage.recordRun({
        accountId: 'acct-1',
        workflowId: 'wf-1',
      });

      expect(run.id).toMatch(/^run_/);
      expect(run.accountId).toBe('acct-1');
      expect(run.workflowId).toBe('wf-1');
      expect(run.status).toBe('started');
      expect(run.startedAt).toBeTruthy();
      expect(run.endedAt).toBeUndefined();
    });

    it('stores optional metadata', async () => {
      const run = await storage.recordRun({
        accountId: 'acct-1',
        workflowId: 'wf-1',
        metadata: { trigger: 'manual' },
      });

      expect(run.metadata).toEqual({ trigger: 'manual' });
    });

    it('throws if accountId is empty', async () => {
      await expect(
        storage.recordRun({ accountId: '', workflowId: 'wf-1' }),
      ).rejects.toThrow('accountId is required');
    });

    it('throws if workflowId is empty', async () => {
      await expect(
        storage.recordRun({ accountId: 'acct-1', workflowId: '' }),
      ).rejects.toThrow('workflowId is required');
    });
  });

  // -----------------------------------------------------------------------
  // completeRun
  // -----------------------------------------------------------------------

  describe('completeRun', () => {
    it('marks a started run as completed', async () => {
      const run = await storage.recordRun({
        accountId: 'acct-1',
        workflowId: 'wf-1',
      });

      const completed = await storage.completeRun(run.id, { status: 'completed' });

      expect(completed.status).toBe('completed');
      expect(completed.endedAt).toBeTruthy();
      expect(typeof completed.durationMs).toBe('number');
    });

    it('marks a started run as failed', async () => {
      const run = await storage.recordRun({
        accountId: 'acct-1',
        workflowId: 'wf-1',
      });

      const failed = await storage.completeRun(run.id, { status: 'failed' });
      expect(failed.status).toBe('failed');
    });

    it('marks a started run as cancelled', async () => {
      const run = await storage.recordRun({
        accountId: 'acct-1',
        workflowId: 'wf-1',
      });

      const cancelled = await storage.completeRun(run.id, { status: 'cancelled' });
      expect(cancelled.status).toBe('cancelled');
    });

    it('merges metadata on completion', async () => {
      const run = await storage.recordRun({
        accountId: 'acct-1',
        workflowId: 'wf-1',
        metadata: { trigger: 'manual' },
      });

      const completed = await storage.completeRun(run.id, {
        status: 'completed',
        metadata: { outputSize: 42 },
      });

      expect(completed.metadata).toEqual({ trigger: 'manual', outputSize: 42 });
    });

    it('throws UsageRunNotFoundError for unknown run', async () => {
      await expect(
        storage.completeRun('no-such-run', { status: 'completed' }),
      ).rejects.toThrow(UsageRunNotFoundError);
    });

    it('throws UsageInvalidTransitionError for already completed run', async () => {
      const run = await storage.recordRun({
        accountId: 'acct-1',
        workflowId: 'wf-1',
      });
      await storage.completeRun(run.id, { status: 'completed' });

      await expect(
        storage.completeRun(run.id, { status: 'failed' }),
      ).rejects.toThrow(UsageInvalidTransitionError);
    });
  });

  // -----------------------------------------------------------------------
  // getRun
  // -----------------------------------------------------------------------

  describe('getRun', () => {
    it('returns the run if found', async () => {
      const run = await storage.recordRun({
        accountId: 'acct-1',
        workflowId: 'wf-1',
      });

      const found = await storage.getRun(run.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(run.id);
    });

    it('returns undefined if not found', async () => {
      const found = await storage.getRun('no-such-run');
      expect(found).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // listRuns
  // -----------------------------------------------------------------------

  describe('listRuns', () => {
    it('returns all runs with default options', async () => {
      await storage.recordRun({ accountId: 'acct-1', workflowId: 'wf-1' });
      await storage.recordRun({ accountId: 'acct-1', workflowId: 'wf-2' });
      await storage.recordRun({ accountId: 'acct-2', workflowId: 'wf-1' });

      const result = await storage.listRuns();
      expect(result.total).toBe(3);
      expect(result.runs).toHaveLength(3);
    });

    it('filters by accountId', async () => {
      await storage.recordRun({ accountId: 'acct-1', workflowId: 'wf-1' });
      await storage.recordRun({ accountId: 'acct-2', workflowId: 'wf-1' });

      const result = await storage.listRuns({ accountId: 'acct-1' });
      expect(result.total).toBe(1);
      expect(result.runs[0].accountId).toBe('acct-1');
    });

    it('filters by workflowId', async () => {
      await storage.recordRun({ accountId: 'acct-1', workflowId: 'wf-1' });
      await storage.recordRun({ accountId: 'acct-1', workflowId: 'wf-2' });

      const result = await storage.listRuns({ workflowId: 'wf-2' });
      expect(result.total).toBe(1);
      expect(result.runs[0].workflowId).toBe('wf-2');
    });

    it('filters by status', async () => {
      const run = await storage.recordRun({ accountId: 'acct-1', workflowId: 'wf-1' });
      await storage.recordRun({ accountId: 'acct-1', workflowId: 'wf-2' });
      await storage.completeRun(run.id, { status: 'completed' });

      const result = await storage.listRuns({ status: 'completed' });
      expect(result.total).toBe(1);
      expect(result.runs[0].status).toBe('completed');
    });

    it('paginates results', async () => {
      for (let i = 0; i < 5; i++) {
        await storage.recordRun({ accountId: 'acct-1', workflowId: `wf-${String(i)}` });
      }

      const page1 = await storage.listRuns({ limit: 2, offset: 0 });
      expect(page1.total).toBe(5);
      expect(page1.runs).toHaveLength(2);

      const page2 = await storage.listRuns({ limit: 2, offset: 2 });
      expect(page2.runs).toHaveLength(2);

      const page3 = await storage.listRuns({ limit: 2, offset: 4 });
      expect(page3.runs).toHaveLength(1);
    });

    it('sorts ascending by startedAt', async () => {
      await storage.recordRun({ accountId: 'acct-1', workflowId: 'wf-1' });
      await storage.recordRun({ accountId: 'acct-1', workflowId: 'wf-2' });

      const result = await storage.listRuns({ sortOrder: 'asc' });
      expect(result.runs[0].startedAt <= result.runs[1].startedAt).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // countRuns / countActiveRuns
  // -----------------------------------------------------------------------

  describe('countRuns', () => {
    it('counts runs in a date range', async () => {
      await storage.recordRun({ accountId: 'acct-1', workflowId: 'wf-1' });
      await storage.recordRun({ accountId: 'acct-1', workflowId: 'wf-2' });
      await storage.recordRun({ accountId: 'acct-2', workflowId: 'wf-1' });

      const count = await storage.countRuns(
        'acct-1',
        '2020-01-01T00:00:00.000Z',
        '2030-01-01T00:00:00.000Z',
      );
      expect(count).toBe(2);
    });
  });

  describe('countActiveRuns', () => {
    it('counts only started runs', async () => {
      const run1 = await storage.recordRun({ accountId: 'acct-1', workflowId: 'wf-1' });
      await storage.recordRun({ accountId: 'acct-1', workflowId: 'wf-2' });
      await storage.completeRun(run1.id, { status: 'completed' });

      const count = await storage.countActiveRuns('acct-1');
      expect(count).toBe(1);
    });
  });
});

// ---------------------------------------------------------------------------
// InMemoryAccountPlanStorage
// ---------------------------------------------------------------------------

describe('InMemoryAccountPlanStorage', () => {
  let plans: InMemoryAccountPlanStorage;

  beforeEach(() => {
    plans = new InMemoryAccountPlanStorage();
  });

  it('stores and retrieves a plan', async () => {
    const plan = makeAccountPlan();
    await plans.setAccountPlan(plan);

    const found = await plans.getAccountPlan('acct-1');
    expect(found).toEqual(plan);
  });

  it('returns undefined for unknown account', async () => {
    const found = await plans.getAccountPlan('no-such-account');
    expect(found).toBeUndefined();
  });

  it('throws if accountId is empty', async () => {
    await expect(
      plans.setAccountPlan(makeAccountPlan({ accountId: '' })),
    ).rejects.toThrow('accountId is required');
  });

  it('overwrites existing plan', async () => {
    await plans.setAccountPlan(makeAccountPlan({ planTier: 'free' }));
    await plans.setAccountPlan(makeAccountPlan({ planTier: 'pro' }));

    const found = await plans.getAccountPlan('acct-1');
    expect(found?.planTier).toBe('pro');
  });
});

// ---------------------------------------------------------------------------
// UsageTracker
// ---------------------------------------------------------------------------

describe('UsageTracker', () => {
  let storage: InMemoryUsageStorage;
  let plans: InMemoryAccountPlanStorage;
  let tracker: UsageTracker;

  beforeEach(async () => {
    _resetRunIdCounter();
    const t = createTracker();
    storage = t.storage;
    plans = t.plans;
    tracker = t.tracker;

    // Set up default account
    await plans.setAccountPlan(makeAccountPlan());
  });

  // -----------------------------------------------------------------------
  // recordRun
  // -----------------------------------------------------------------------

  describe('recordRun', () => {
    it('records a run when within limits', async () => {
      const run = await tracker.recordRun({
        accountId: 'acct-1',
        workflowId: 'wf-1',
      });

      expect(run.id).toMatch(/^run_/);
      expect(run.status).toBe('started');
    });

    it('throws UsageLimitExceededError when monthly limit reached', async () => {
      // Set a plan with max 2 runs per month and enough concurrent headroom
      await plans.setAccountPlan(
        makeAccountPlan({ customLimits: { maxRunsPerMonth: 2, maxConcurrentRuns: 10 } }),
      );

      const run1 = await tracker.recordRun({ accountId: 'acct-1', workflowId: 'wf-1' });
      await tracker.completeRun(run1.id, { status: 'completed' });
      const run2 = await tracker.recordRun({ accountId: 'acct-1', workflowId: 'wf-2' });
      await tracker.completeRun(run2.id, { status: 'completed' });

      await expect(
        tracker.recordRun({ accountId: 'acct-1', workflowId: 'wf-3' }),
      ).rejects.toThrow(UsageLimitExceededError);
    });

    it('throws UsageLimitExceededError when concurrent limit reached', async () => {
      // Free plan allows 2 concurrent runs
      await tracker.recordRun({ accountId: 'acct-1', workflowId: 'wf-1' });
      await tracker.recordRun({ accountId: 'acct-1', workflowId: 'wf-2' });

      await expect(
        tracker.recordRun({ accountId: 'acct-1', workflowId: 'wf-3' }),
      ).rejects.toThrow(UsageLimitExceededError);
    });

    it('allows new run after completing a concurrent run', async () => {
      const run1 = await tracker.recordRun({
        accountId: 'acct-1',
        workflowId: 'wf-1',
      });

      await tracker.completeRun(run1.id, { status: 'completed' });

      // Should succeed since concurrent run finished
      const run2 = await tracker.recordRun({
        accountId: 'acct-1',
        workflowId: 'wf-2',
      });
      expect(run2.status).toBe('started');
    });

    it('throws UsageAccountNotFoundError for unknown account', async () => {
      await expect(
        tracker.recordRun({ accountId: 'no-such-account', workflowId: 'wf-1' }),
      ).rejects.toThrow(UsageAccountNotFoundError);
    });

    it('skips limit enforcement when disabled', async () => {
      const t = createTracker({ enforceLimits: false });
      await t.plans.setAccountPlan(
        makeAccountPlan({ customLimits: { maxRunsPerMonth: 1 } }),
      );

      await t.tracker.recordRun({ accountId: 'acct-1', workflowId: 'wf-1' });

      // Should succeed even though limit is 1
      const run2 = await t.tracker.recordRun({
        accountId: 'acct-1',
        workflowId: 'wf-2',
      });
      expect(run2.status).toBe('started');
    });
  });

  // -----------------------------------------------------------------------
  // completeRun
  // -----------------------------------------------------------------------

  describe('completeRun', () => {
    it('delegates to storage', async () => {
      const run = await tracker.recordRun({
        accountId: 'acct-1',
        workflowId: 'wf-1',
      });

      const completed = await tracker.completeRun(run.id, { status: 'completed' });
      expect(completed.status).toBe('completed');
    });
  });

  // -----------------------------------------------------------------------
  // checkLimits
  // -----------------------------------------------------------------------

  describe('checkLimits', () => {
    it('returns allowed=true when within limits', async () => {
      const result = await tracker.checkLimits('acct-1');
      expect(result.allowed).toBe(true);
    });

    it('returns allowed=false when monthly limit exceeded', async () => {
      await plans.setAccountPlan(
        makeAccountPlan({ customLimits: { maxRunsPerMonth: 1 } }),
      );

      await tracker.recordRun({ accountId: 'acct-1', workflowId: 'wf-1' });

      const result = await tracker.checkLimits('acct-1');
      expect(result.allowed).toBe(false);
      expect(result.exceededLimit).toBe('maxRunsPerMonth');
      expect(result.currentValue).toBe(1);
      expect(result.limitValue).toBe(1);
    });

    it('skips unlimited limits (-1)', async () => {
      await plans.setAccountPlan(makeAccountPlan({ planTier: 'enterprise' }));

      // Record many runs
      for (let i = 0; i < 10; i++) {
        // Record directly in storage to bypass limit checks
        await storage.recordRun({ accountId: 'acct-1', workflowId: `wf-${String(i)}` });
      }

      const result = await tracker.checkLimits('acct-1');
      expect(result.allowed).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // getUsageSummary
  // -----------------------------------------------------------------------

  describe('getUsageSummary', () => {
    it('returns correct summary for an account with no runs', async () => {
      const summary = await tracker.getUsageSummary('acct-1');

      expect(summary.accountId).toBe('acct-1');
      expect(summary.runsThisPeriod).toBe(0);
      expect(summary.activeRuns).toBe(0);
      expect(summary.planTier).toBe('free');
      expect(summary.limits).toEqual(DEFAULT_PLAN_LIMITS.free);
      expect(summary.remainingRuns).toBe(500);
      expect(summary.usagePercent).toBe(0);
    });

    it('reflects runs in the summary', async () => {
      const run1 = await tracker.recordRun({
        accountId: 'acct-1',
        workflowId: 'wf-1',
      });
      await tracker.completeRun(run1.id, { status: 'completed' });

      const summary = await tracker.getUsageSummary('acct-1');

      expect(summary.runsThisPeriod).toBe(1);
      expect(summary.activeRuns).toBe(0);
      expect(summary.remainingRuns).toBe(499);
      expect(summary.usagePercent).toBe(0);
    });

    it('counts active runs correctly', async () => {
      await tracker.recordRun({
        accountId: 'acct-1',
        workflowId: 'wf-1',
      });

      // Use a higher concurrent limit to allow multiple active runs
      await plans.setAccountPlan(
        makeAccountPlan({ planTier: 'pro' }),
      );

      const summary = await tracker.getUsageSummary('acct-1');
      expect(summary.activeRuns).toBe(1);
    });

    it('returns -1 remainingRuns for unlimited plans', async () => {
      await plans.setAccountPlan(makeAccountPlan({ planTier: 'enterprise' }));

      const summary = await tracker.getUsageSummary('acct-1');

      expect(summary.remainingRuns).toBe(-1);
      expect(summary.usagePercent).toBe(0);
    });

    it('throws UsageAccountNotFoundError for unknown account', async () => {
      await expect(tracker.getUsageSummary('no-such-account')).rejects.toThrow(
        UsageAccountNotFoundError,
      );
    });

    it('applies custom limits over defaults', async () => {
      await plans.setAccountPlan(
        makeAccountPlan({ customLimits: { maxRunsPerMonth: 100 } }),
      );

      const summary = await tracker.getUsageSummary('acct-1');
      expect(summary.limits.maxRunsPerMonth).toBe(100);
      // concurrent and workflow limits should use free defaults
      expect(summary.limits.maxConcurrentRuns).toBe(2);
      expect(summary.limits.maxWorkflows).toBe(10);
    });
  });

  // -----------------------------------------------------------------------
  // listRuns
  // -----------------------------------------------------------------------

  describe('listRuns', () => {
    it('delegates to storage', async () => {
      // Use a plan with enough concurrent headroom
      await plans.setAccountPlan(
        makeAccountPlan({ customLimits: { maxConcurrentRuns: 10 } }),
      );

      await tracker.recordRun({ accountId: 'acct-1', workflowId: 'wf-1' });
      await tracker.recordRun({ accountId: 'acct-1', workflowId: 'wf-2' });

      const result = await tracker.listRuns({ accountId: 'acct-1' });
      expect(result.total).toBe(2);
    });
  });
});

// ---------------------------------------------------------------------------
// Error classes
// ---------------------------------------------------------------------------

describe('Usage errors', () => {
  it('UsageLimitExceededError has structured details', () => {
    const err = new UsageLimitExceededError('acct-1', 'maxRunsPerMonth', 500, 500, 'free');
    expect(err.name).toBe('UsageLimitExceededError');
    expect(err.message).toContain('acct-1');
    expect(err.message).toContain('monthly run');

    const json = err.toJSON();
    expect(json.details).toEqual({
      accountId: 'acct-1',
      limitType: 'maxRunsPerMonth',
      currentValue: 500,
      limitValue: 500,
      planTier: 'free',
    });
  });

  it('UsageRunNotFoundError includes runId', () => {
    const err = new UsageRunNotFoundError('run-xyz');
    expect(err.name).toBe('UsageRunNotFoundError');
    expect(err.toJSON().details).toEqual({ runId: 'run-xyz' });
  });

  it('UsageAccountNotFoundError includes accountId', () => {
    const err = new UsageAccountNotFoundError('acct-unknown');
    expect(err.name).toBe('UsageAccountNotFoundError');
    expect(err.toJSON().details).toEqual({ accountId: 'acct-unknown' });
  });

  it('UsageInvalidTransitionError includes transition details', () => {
    const err = new UsageInvalidTransitionError('run-1', 'completed', 'failed');
    expect(err.name).toBe('UsageInvalidTransitionError');
    expect(err.toJSON().details).toEqual({
      runId: 'run-1',
      fromStatus: 'completed',
      toStatus: 'failed',
    });
  });

  it('UsageLimitExceededError for concurrent limit', () => {
    const err = new UsageLimitExceededError('acct-1', 'maxConcurrentRuns', 3, 3, 'pro');
    expect(err.message).toContain('concurrent run');
  });

  it('UsageLimitExceededError for workflow limit', () => {
    const err = new UsageLimitExceededError('acct-1', 'maxWorkflows', 10, 10, 'free');
    expect(err.message).toContain('workflow');
  });
});

// ---------------------------------------------------------------------------
// DEFAULT_PLAN_LIMITS
// ---------------------------------------------------------------------------

describe('DEFAULT_PLAN_LIMITS', () => {
  it('defines limits for all tiers', () => {
    expect(DEFAULT_PLAN_LIMITS.free).toBeDefined();
    expect(DEFAULT_PLAN_LIMITS.pro).toBeDefined();
    expect(DEFAULT_PLAN_LIMITS.team).toBeDefined();
    expect(DEFAULT_PLAN_LIMITS.enterprise).toBeDefined();
  });

  it('free tier has correct defaults matching spec', () => {
    const free = DEFAULT_PLAN_LIMITS.free;
    expect(free.maxRunsPerMonth).toBe(500);
    expect(free.maxConcurrentRuns).toBe(2);
    expect(free.maxAgents).toBe(5);
    expect(free.maxWorkflows).toBe(10);
  });

  it('enterprise tier has unlimited (-1) values', () => {
    const enterprise = DEFAULT_PLAN_LIMITS.enterprise;
    expect(enterprise.maxRunsPerMonth).toBe(-1);
    expect(enterprise.maxConcurrentRuns).toBe(-1);
    expect(enterprise.maxAgents).toBe(-1);
    expect(enterprise.maxWorkflows).toBe(-1);
  });

  it('tiers are ordered by increasing limits', () => {
    const { free, pro } = DEFAULT_PLAN_LIMITS;
    expect(free.maxAgents).toBeLessThan(pro.maxAgents);
    expect(free.maxWorkflows).toBeLessThan(pro.maxWorkflows);
    expect(free.maxConcurrentRuns).toBeLessThan(pro.maxConcurrentRuns);
  });

  it('pro tier matches spec (unlimited runs, 20 agents, 100 workflows)', () => {
    const pro = DEFAULT_PLAN_LIMITS.pro;
    expect(pro.maxRunsPerMonth).toBe(-1);
    expect(pro.maxAgents).toBe(20);
    expect(pro.maxWorkflows).toBe(100);
  });
});
