/**
 * Custom error classes for crew operations.
 *
 * @packageDocumentation
 */

/** Thrown when crew configuration is invalid. */
export class CrewConfigError extends Error {
  public readonly crewId: string | undefined;

  constructor(message: string, crewId?: string) {
    super(crewId ? `Crew "${crewId}": ${message}` : message);
    this.name = 'CrewConfigError';
    this.crewId = crewId;
  }
}

/** Thrown when crew execution fails. */
export class CrewExecutionError extends Error {
  public readonly crewId: string;
  public readonly taskId: string | undefined;
  public override readonly cause: Error | undefined;

  constructor(crewId: string, message: string, taskId?: string, cause?: Error) {
    const taskCtx = taskId ? ` (task "${taskId}")` : '';
    super(`Crew "${crewId}"${taskCtx} execution failed: ${message}`);
    this.name = 'CrewExecutionError';
    this.crewId = crewId;
    this.taskId = taskId;
    this.cause = cause;
  }
}
