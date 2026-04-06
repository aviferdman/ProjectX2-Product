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

    const idSet = new Set<string>();
    for (const cycle of cycles) {
      // Skip the last element (it's the duplicate that closes the loop)
      for (let i = 0; i < cycle.path.length - 1; i++) {
        idSet.add(cycle.path[i]);
      }
    }
    this.involvedTaskIds = [...idSet].sort();
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
