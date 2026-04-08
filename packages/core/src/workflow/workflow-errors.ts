/**
 * Custom error classes for workflow storage operations.
 *
 * @packageDocumentation
 */

import { CrewspaceError, ErrorCode } from '../errors/base.js';

// ---------------------------------------------------------------------------
// Error codes (extend base ErrorCode enum at usage sites)
// ---------------------------------------------------------------------------

/** Error code for workflow-specific errors. */
export const WORKFLOW_NOT_FOUND = 'WORKFLOW_NOT_FOUND' as unknown as ErrorCode;
export const WORKFLOW_VALIDATION = 'WORKFLOW_VALIDATION' as unknown as ErrorCode;

// ---------------------------------------------------------------------------
// Workflow errors
// ---------------------------------------------------------------------------

/** Thrown when a workflow is not found by ID. */
export class WorkflowNotFoundError extends CrewspaceError {
  public readonly workflowId: string;

  constructor(workflowId: string) {
    super(`Workflow "${workflowId}" not found`, WORKFLOW_NOT_FOUND);
    this.name = 'WorkflowNotFoundError';
    this.workflowId = workflowId;
  }

  protected override getDetails(): Record<string, unknown> {
    return { workflowId: this.workflowId };
  }
}

/** Thrown when workflow input fails validation. */
export class WorkflowValidationError extends CrewspaceError {
  constructor(message: string) {
    super(message, WORKFLOW_VALIDATION);
    this.name = 'WorkflowValidationError';
  }
}
