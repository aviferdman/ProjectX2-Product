/**
 * Custom error classes for execution engine operations.
 *
 * @packageDocumentation
 */

/** Thrown when engine configuration is invalid. */
export class EngineConfigError extends Error {
  public readonly engineId: string | undefined;

  constructor(message: string, engineId?: string) {
    super(engineId ? `Engine "${engineId}": ${message}` : message);
    this.name = 'EngineConfigError';
    this.engineId = engineId;
  }
}

/** Thrown when engine execution fails. */
export class EngineExecutionError extends Error {
  public readonly engineId: string;
  public readonly taskId: string | undefined;
  public override readonly cause: Error | undefined;

  constructor(engineId: string, message: string, taskId?: string, cause?: Error) {
    const taskCtx = taskId ? ` (task "${taskId}")` : '';
    super(`Engine "${engineId}"${taskCtx} execution failed: ${message}`);
    this.name = 'EngineExecutionError';
    this.engineId = engineId;
    this.taskId = taskId;
    this.cause = cause;
  }
}
