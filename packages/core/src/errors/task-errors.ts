/**
 * Custom error classes for task operations.
 *
 * @packageDocumentation
 */

import { CrewspaceError, ErrorCode } from './base.js';

/** Thrown when task configuration is invalid. */
export class TaskConfigError extends CrewspaceError {
  public readonly taskId: string | undefined;

  constructor(message: string, taskId?: string) {
    super(
      taskId ? `Task "${taskId}": ${message}` : message,
      ErrorCode.TASK_CONFIG,
    );
    this.name = 'TaskConfigError';
    this.taskId = taskId;
  }

  protected override getDetails(): Record<string, unknown> {
    return { taskId: this.taskId };
  }
}

/** Thrown when task execution fails. */
export class TaskExecutionError extends CrewspaceError {
  public readonly taskId: string;
  public readonly agentId: string | undefined;

  constructor(taskId: string, message: string, agentId?: string, cause?: Error) {
    const agentCtx = agentId ? ` (agent "${agentId}")` : '';
    super(
      `Task "${taskId}"${agentCtx} execution failed: ${message}`,
      ErrorCode.TASK_EXECUTION,
      { cause },
    );
    this.name = 'TaskExecutionError';
    this.taskId = taskId;
    this.agentId = agentId;
  }

  protected override getDetails(): Record<string, unknown> {
    return { taskId: this.taskId, agentId: this.agentId };
  }
}

/**
 * A single cycle found during circular dependency detection.
 *
 * The `path` contains task IDs forming the cycle, e.g. `['a', 'b', 'c', 'a']`
 * where the last element repeats the first to close the loop.
 */
export interface DependencyCycle {
  /** Task IDs forming the cycle (last ID equals the first). */
  readonly path: readonly string[];
}

/**
 * Thrown when circular dependencies are detected among tasks.
 *
 * Extends {@link TaskConfigError} with structured cycle information,
 * including the exact cycle paths and all involved task IDs.
 */
export class CircularDependencyError extends TaskConfigError {
  /** All cycles detected, each with its path of task IDs. */
  public readonly cycles: readonly DependencyCycle[];

  /** Unique set of task IDs involved in at least one cycle. */
  public readonly involvedTaskIds: readonly string[];

  constructor(cycles: DependencyCycle[]) {
    const cycleDescriptions = cycles.map(
      (c) => c.path.join(' → '),
    );
    const message =
      cycles.length === 1
        ? `Circular dependency detected: ${cycleDescriptions[0]}`
        : `Circular dependencies detected:\n  ${cycleDescriptions.join('\n  ')}`;

    super(message);
    this.name = 'CircularDependencyError';
    this.cycles = cycles;
    // Override code to a more specific one
    (this as { code: ErrorCode }).code = ErrorCode.TASK_CIRCULAR_DEPENDENCY;

    const idSet = new Set<string>();
    for (const cycle of cycles) {
      // Skip the last element (it's the duplicate that closes the loop)
      for (let i = 0; i < cycle.path.length - 1; i++) {
        const id = cycle.path[i];
        if (id !== undefined) {
          idSet.add(id);
        }
      }
    }
    this.involvedTaskIds = [...idSet].sort();
  }

  protected override getDetails(): Record<string, unknown> {
    return {
      ...super.getDetails(),
      cycles: this.cycles.map((c) => c.path),
      involvedTaskIds: this.involvedTaskIds,
    };
  }
}

/** Thrown when task execution exceeds the configured timeout. */
export class TaskTimeoutError extends TaskExecutionError {
  public readonly timeoutMs: number;

  constructor(taskId: string, timeoutMs: number, agentId?: string) {
    super(taskId, `Execution timed out after ${String(timeoutMs)}ms`, agentId);
    this.name = 'TaskTimeoutError';
    this.timeoutMs = timeoutMs;
    (this as { code: ErrorCode }).code = ErrorCode.TASK_TIMEOUT;
    // Timeouts are generally retryable
    (this as { isRetryable: boolean }).isRetryable = true;
  }

  protected override getDetails(): Record<string, unknown> {
    return { ...super.getDetails(), timeoutMs: this.timeoutMs };
  }
}
