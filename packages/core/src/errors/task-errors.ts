/**
 * Custom error classes for task operations.
 *
 * @packageDocumentation
 */

/** Thrown when task configuration is invalid. */
export class TaskConfigError extends Error {
  public readonly taskId: string | undefined;

  constructor(message: string, taskId?: string) {
    super(taskId ? `Task "${taskId}": ${message}` : message);
    this.name = 'TaskConfigError';
    this.taskId = taskId;
  }
}

/** Thrown when task execution fails. */
export class TaskExecutionError extends Error {
  public readonly taskId: string;
  public readonly agentId: string | undefined;
  public override readonly cause: Error | undefined;

  constructor(taskId: string, message: string, agentId?: string, cause?: Error) {
    const agentCtx = agentId ? ` (agent "${agentId}")` : '';
    super(`Task "${taskId}"${agentCtx} execution failed: ${message}`);
    this.name = 'TaskExecutionError';
    this.taskId = taskId;
    this.agentId = agentId;
    this.cause = cause;
  }
}

/** Thrown when task execution exceeds the configured timeout. */
export class TaskTimeoutError extends TaskExecutionError {
  public readonly timeoutMs: number;

  constructor(taskId: string, timeoutMs: number, agentId?: string) {
    super(taskId, `Execution timed out after ${String(timeoutMs)}ms`, agentId);
    this.name = 'TaskTimeoutError';
    this.timeoutMs = timeoutMs;
  }
}
