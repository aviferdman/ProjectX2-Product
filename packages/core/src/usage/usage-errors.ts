/**
 * Custom error classes for usage tracking operations.
 *
 * @packageDocumentation
 */

import { CrewspaceError, ErrorCode } from '../errors/base.js';
import type { PlanLimits, PlanTier } from './usage-types.js';

// ---------------------------------------------------------------------------
// Error codes
// ---------------------------------------------------------------------------

export const USAGE_LIMIT_EXCEEDED = 'USAGE_LIMIT_EXCEEDED' as unknown as ErrorCode;
export const USAGE_RUN_NOT_FOUND = 'USAGE_RUN_NOT_FOUND' as unknown as ErrorCode;
export const USAGE_ACCOUNT_NOT_FOUND = 'USAGE_ACCOUNT_NOT_FOUND' as unknown as ErrorCode;
export const USAGE_INVALID_TRANSITION = 'USAGE_INVALID_TRANSITION' as unknown as ErrorCode;

// ---------------------------------------------------------------------------
// Error classes
// ---------------------------------------------------------------------------

/** Thrown when a usage limit is exceeded. */
export class UsageLimitExceededError extends CrewspaceError {
  public readonly accountId: string;
  public readonly limitType: keyof PlanLimits;
  public readonly currentValue: number;
  public readonly limitValue: number;
  public readonly planTier: PlanTier;

  constructor(
    accountId: string,
    limitType: keyof PlanLimits,
    currentValue: number,
    limitValue: number,
    planTier: PlanTier,
  ) {
    const limitLabel =
      limitType === 'maxRunsPerMonth'
        ? 'monthly run'
        : limitType === 'maxConcurrentRuns'
          ? 'concurrent run'
          : limitType === 'maxAgents'
            ? 'agent'
            : 'workflow';

    super(
      `Account "${accountId}" has exceeded the ${limitLabel} limit (${String(currentValue)}/${String(limitValue)}) on the "${planTier}" plan`,
      USAGE_LIMIT_EXCEEDED,
    );
    this.name = 'UsageLimitExceededError';
    this.accountId = accountId;
    this.limitType = limitType;
    this.currentValue = currentValue;
    this.limitValue = limitValue;
    this.planTier = planTier;
  }

  protected override getDetails(): Record<string, unknown> {
    return {
      accountId: this.accountId,
      limitType: this.limitType,
      currentValue: this.currentValue,
      limitValue: this.limitValue,
      planTier: this.planTier,
    };
  }
}

/** Thrown when a run record is not found. */
export class UsageRunNotFoundError extends CrewspaceError {
  public readonly runId: string;

  constructor(runId: string) {
    super(`Run "${runId}" not found`, USAGE_RUN_NOT_FOUND);
    this.name = 'UsageRunNotFoundError';
    this.runId = runId;
  }

  protected override getDetails(): Record<string, unknown> {
    return { runId: this.runId };
  }
}

/** Thrown when an account plan is not found. */
export class UsageAccountNotFoundError extends CrewspaceError {
  public readonly accountId: string;

  constructor(accountId: string) {
    super(`Account "${accountId}" has no plan configured`, USAGE_ACCOUNT_NOT_FOUND);
    this.name = 'UsageAccountNotFoundError';
    this.accountId = accountId;
  }

  protected override getDetails(): Record<string, unknown> {
    return { accountId: this.accountId };
  }
}

/** Thrown when a run status transition is invalid. */
export class UsageInvalidTransitionError extends CrewspaceError {
  public readonly runId: string;
  public readonly fromStatus: string;
  public readonly toStatus: string;

  constructor(runId: string, fromStatus: string, toStatus: string) {
    super(
      `Cannot transition run "${runId}" from "${fromStatus}" to "${toStatus}"`,
      USAGE_INVALID_TRANSITION,
    );
    this.name = 'UsageInvalidTransitionError';
    this.runId = runId;
    this.fromStatus = fromStatus;
    this.toStatus = toStatus;
  }

  protected override getDetails(): Record<string, unknown> {
    return {
      runId: this.runId,
      fromStatus: this.fromStatus,
      toStatus: this.toStatus,
    };
  }
}
