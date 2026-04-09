/**
 * Custom error classes for workflow execution operations.
 *
 * @packageDocumentation
 */

import { CrewspaceError, ErrorCode } from '../errors/base.js';

// ---------------------------------------------------------------------------
// Error codes
// ---------------------------------------------------------------------------

export const WORKFLOW_EXECUTION_FAILED = 'WORKFLOW_EXECUTION_FAILED' as unknown as ErrorCode;
export const WORKFLOW_NOT_ACTIVE = 'WORKFLOW_NOT_ACTIVE' as unknown as ErrorCode;
export const WORKFLOW_EXECUTION_CANCELLED = 'WORKFLOW_EXECUTION_CANCELLED' as unknown as ErrorCode;
export const WORKFLOW_EXECUTION_TIMEOUT = 'WORKFLOW_EXECUTION_TIMEOUT' as unknown as ErrorCode;
export const WORKFLOW_NO_AGENTS = 'WORKFLOW_NO_AGENTS' as unknown as ErrorCode;

// ---------------------------------------------------------------------------
// Error classes
// ---------------------------------------------------------------------------

/** Thrown when a workflow execution fails. */
export class WorkflowExecutionFailedError extends CrewspaceError {
  public readonly workflowId: string;
  public readonly runId: string;

  constructor(workflowId: string, runId: string, message: string, cause?: Error) {
    super(
      `Workflow "${workflowId}" execution failed (run "${runId}"): ${message}`,
      WORKFLOW_EXECUTION_FAILED,
      { cause },
    );
    this.name = 'WorkflowExecutionFailedError';
    this.workflowId = workflowId;
    this.runId = runId;
  }

  protected override getDetails(): Record<string, unknown> {
    return { workflowId: this.workflowId, runId: this.runId };
  }
}

/** Thrown when trying to execute a non-active workflow. */
export class WorkflowNotActiveError extends CrewspaceError {
  public readonly workflowId: string;
  public readonly currentStatus: string;

  constructor(workflowId: string, currentStatus: string) {
    super(
      `Workflow "${workflowId}" cannot be executed: status is "${currentStatus}" (must be "active")`,
      WORKFLOW_NOT_ACTIVE,
    );
    this.name = 'WorkflowNotActiveError';
    this.workflowId = workflowId;
    this.currentStatus = currentStatus;
  }

  protected override getDetails(): Record<string, unknown> {
    return { workflowId: this.workflowId, currentStatus: this.currentStatus };
  }
}

/** Thrown when an execution is cancelled. */
export class WorkflowExecutionCancelledError extends CrewspaceError {
  public readonly runId: string;

  constructor(runId: string) {
    super(`Execution run "${runId}" was cancelled`, WORKFLOW_EXECUTION_CANCELLED);
    this.name = 'WorkflowExecutionCancelledError';
    this.runId = runId;
  }

  protected override getDetails(): Record<string, unknown> {
    return { runId: this.runId };
  }
}

/** Thrown when an execution times out. */
export class WorkflowExecutionTimeoutError extends CrewspaceError {
  public readonly runId: string;
  public readonly timeoutMs: number;

  constructor(runId: string, timeoutMs: number) {
    super(
      `Execution run "${runId}" timed out after ${String(timeoutMs)}ms`,
      WORKFLOW_EXECUTION_TIMEOUT,
      { isRetryable: true },
    );
    this.name = 'WorkflowExecutionTimeoutError';
    this.runId = runId;
    this.timeoutMs = timeoutMs;
  }

  protected override getDetails(): Record<string, unknown> {
    return { runId: this.runId, timeoutMs: this.timeoutMs };
  }
}

/** Thrown when a workflow has no agent resolver configured. */
export class WorkflowNoAgentsError extends CrewspaceError {
  public readonly workflowId: string;

  constructor(workflowId: string) {
    super(
      `Workflow "${workflowId}" cannot be executed: no agent resolver configured`,
      WORKFLOW_NO_AGENTS,
    );
    this.name = 'WorkflowNoAgentsError';
    this.workflowId = workflowId;
  }

  protected override getDetails(): Record<string, unknown> {
    return { workflowId: this.workflowId };
  }
}
