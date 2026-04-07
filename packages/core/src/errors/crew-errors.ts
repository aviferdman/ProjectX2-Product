/**
 * Custom error classes for crew operations.
 *
 * @packageDocumentation
 */

import { CrewspaceError, ErrorCode } from './base.js';

/** Thrown when crew configuration is invalid. */
export class CrewConfigError extends CrewspaceError {
  public readonly crewId: string | undefined;

  constructor(message: string, crewId?: string) {
    super(crewId ? `Crew "${crewId}": ${message}` : message, ErrorCode.CREW_CONFIG);
    this.name = 'CrewConfigError';
    this.crewId = crewId;
  }

  protected override getDetails(): Record<string, unknown> {
    return { crewId: this.crewId };
  }
}

/** Thrown when crew execution fails. */
export class CrewExecutionError extends CrewspaceError {
  public readonly crewId: string;
  public readonly taskId: string | undefined;

  constructor(crewId: string, message: string, taskId?: string, cause?: Error) {
    const taskCtx = taskId ? ` (task "${taskId}")` : '';
    super(`Crew "${crewId}"${taskCtx} execution failed: ${message}`, ErrorCode.CREW_EXECUTION, {
      cause,
    });
    this.name = 'CrewExecutionError';
    this.crewId = crewId;
    this.taskId = taskId;
  }

  protected override getDetails(): Record<string, unknown> {
    return { crewId: this.crewId, taskId: this.taskId };
  }
}
