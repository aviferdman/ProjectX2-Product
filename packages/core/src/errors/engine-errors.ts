/**
 * Custom error classes for execution engine operations.
 *
 * @packageDocumentation
 */

import { CrewspaceError, ErrorCode } from './base.js';

/** Thrown when engine configuration is invalid. */
export class EngineConfigError extends CrewspaceError {
  public readonly engineId: string | undefined;

  constructor(message: string, engineId?: string) {
    super(
      engineId ? `Engine "${engineId}": ${message}` : message,
      ErrorCode.ENGINE_CONFIG,
    );
    this.name = 'EngineConfigError';
    this.engineId = engineId;
  }

  protected override getDetails(): Record<string, unknown> {
    return { engineId: this.engineId };
  }
}

/** Thrown when engine execution fails. */
export class EngineExecutionError extends CrewspaceError {
  public readonly engineId: string;
  public readonly taskId: string | undefined;

  constructor(engineId: string, message: string, taskId?: string, cause?: Error) {
    const taskCtx = taskId ? ` (task "${taskId}")` : '';
    super(
      `Engine "${engineId}"${taskCtx} execution failed: ${message}`,
      ErrorCode.ENGINE_EXECUTION,
      { cause },
    );
    this.name = 'EngineExecutionError';
    this.engineId = engineId;
    this.taskId = taskId;
  }

  protected override getDetails(): Record<string, unknown> {
    return { engineId: this.engineId, taskId: this.taskId };
  }
}
