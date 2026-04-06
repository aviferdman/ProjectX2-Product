/**
 * Parallel task executor — dependency-aware parallel execution of tasks.
 *
 * Provides standalone utilities for resolving task dependencies (topological
 * sort), grouping tasks into parallel execution waves (execution levels), and
 * executing tasks concurrently with configurable concurrency limits and error
 * policies.
 *
 * @packageDocumentation
 */

import { EventEmitter } from 'eventemitter3';

import { TaskConfigError, TaskExecutionError } from '../errors/index.js';
import type { TaskResult } from '../types/task.js';
import type { Task } from './task.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_MAX_CONCURRENCY = 10;
const MAX_CONCURRENCY_UPPER_BOUND = 100;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Error handling policy for the parallel executor. */
export type ParallelErrorPolicy = 'fail-fast' | 'continue';

/** Configuration for creating a {@link ParallelExecutor}. */
export interface ParallelExecutorConfig {
  /** Maximum number of tasks to run concurrently (default: 10). */
  readonly maxConcurrency?: number;

  /** How to handle task errors (default: 'fail-fast'). */
  readonly errorPolicy?: ParallelErrorPolicy;
}

/** A group of independent tasks that can run concurrently. */
export interface ExecutionLevel {
  /** Zero-based level index (0 = root tasks with no dependencies). */
  readonly level: number;

  /** IDs of tasks in this execution level. */
  readonly taskIds: readonly string[];
}

/**
 * Callback that executes a single task and returns its result.
 *
 * @param task    - The task to execute
 * @param context - Aggregated results from completed dependency tasks
 * @returns A promise resolving to the task result
 */
export type TaskRunner = (
  task: Task,
  context: Readonly<Record<string, TaskResult>>,
) => Promise<TaskResult>;

/** Result of a parallel execution run. */
export interface ParallelExecutionResult {
  /** Successfully completed task results, keyed by task ID. */
  readonly results: ReadonlyMap<string, TaskResult>;

  /** Task errors, keyed by task ID. */
  readonly errors: ReadonlyMap<string, Error>;

  /** Execution levels that were planned. */
  readonly levels: readonly ExecutionLevel[];

  /** Total execution duration in milliseconds. */
  readonly duration: number;

  /** Whether all tasks completed successfully. */
  readonly success: boolean;
}

/** Map of parallel executor event names to their listener signatures. */
export interface ParallelExecutorEventMap {
  /** Emitted when a new execution level starts. */
  'level:start': (level: number, taskIds: string[]) => void;

  /** Emitted when an execution level completes. */
  'level:complete': (level: number) => void;

  /** Emitted when a single task starts. */
  'task:start': (taskId: string, level: number) => void;

  /** Emitted when a single task completes. */
  'task:complete': (taskId: string, result: TaskResult) => void;

  /** Emitted when a single task fails. */
  'task:error': (taskId: string, error: Error) => void;

  /** Emitted when a task is skipped due to a failed dependency. */
  'task:skipped': (taskId: string, reason: string) => void;

  /** Emitted when the entire run completes. */
  'run:complete': (result: ParallelExecutionResult) => void;

  /** Emitted when the run is cancelled. */
  'run:cancelled': () => void;
}

// ---------------------------------------------------------------------------
// Standalone utility functions
// ---------------------------------------------------------------------------

/**
 * Perform a topological sort on tasks using Kahn's algorithm.
 *
 * Returns tasks ordered so that every task appears after all of its
 * dependencies. Throws if the dependency graph contains cycles, unknown
 * references, or self-dependencies.
 *
 * @param tasks - Array of tasks to sort
 * @returns Topologically sorted array of tasks
 * @throws {TaskConfigError} If the graph has cycles, missing deps, or self-deps
 */
export function topologicalSort(tasks: readonly Task[]): Task[] {
  if (tasks.length === 0) {
    return [];
  }

  const taskMap = new Map<string, Task>();
  for (const task of tasks) {
    if (taskMap.has(task.id)) {
      throw new TaskConfigError(`Duplicate task id "${task.id}"`, task.id);
    }
    taskMap.set(task.id, task);
  }

  // Validate dependencies exist and are not self-referencing
  for (const task of tasks) {
    for (const depId of task.dependencies) {
      if (depId === task.id) {
        throw new TaskConfigError(`Task "${task.id}" cannot depend on itself`, task.id);
      }
      if (!taskMap.has(depId)) {
        throw new TaskConfigError(`Task "${task.id}" depends on unknown task "${depId}"`, task.id);
      }
    }
  }

  // Build adjacency list and in-degree map
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const task of tasks) {
    inDegree.set(task.id, 0);
    adjacency.set(task.id, []);
  }

  for (const task of tasks) {
    for (const depId of task.dependencies) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      adjacency.get(depId)!.push(task.id);
      inDegree.set(task.id, (inDegree.get(task.id) ?? 0) + 1);
    }
  }

  // Kahn's algorithm
  const queue: string[] = [];
  for (const [taskId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(taskId);
    }
  }

  const sorted: Task[] = [];
  while (queue.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const current = queue.shift()!;
    const task = taskMap.get(current);
    if (task) {
      sorted.push(task);
    }

    for (const neighbor of adjacency.get(current) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 0) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (sorted.length !== tasks.length) {
    throw new TaskConfigError('Circular dependency detected in task graph');
  }

  return sorted;
}

/**
 * Group tasks into parallel execution levels.
 *
 * Level 0 contains tasks with no dependencies (roots). Level N contains
 * tasks whose dependencies all appear in levels 0 through N−1.
 *
 * @param tasks - Array of tasks to group
 * @returns Ordered array of execution levels
 * @throws {TaskConfigError} If the graph has cycles, missing deps, or self-deps
 */
export function getExecutionLevels(tasks: readonly Task[]): ExecutionLevel[] {
  if (tasks.length === 0) {
    return [];
  }

  const taskMap = new Map<string, Task>();
  for (const task of tasks) {
    if (taskMap.has(task.id)) {
      throw new TaskConfigError(`Duplicate task id "${task.id}"`, task.id);
    }
    taskMap.set(task.id, task);
  }

  // Validate dependencies
  for (const task of tasks) {
    for (const depId of task.dependencies) {
      if (depId === task.id) {
        throw new TaskConfigError(`Task "${task.id}" cannot depend on itself`, task.id);
      }
      if (!taskMap.has(depId)) {
        throw new TaskConfigError(`Task "${task.id}" depends on unknown task "${depId}"`, task.id);
      }
    }
  }

  // Assign each task to a level using longest-path from roots
  const levelOf = new Map<string, number>();
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function computeLevel(taskId: string): number {
    if (levelOf.has(taskId)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return levelOf.get(taskId)!;
    }

    if (visiting.has(taskId)) {
      throw new TaskConfigError('Circular dependency detected in task graph');
    }

    visiting.add(taskId);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const task = taskMap.get(taskId)!;
    let maxDepLevel = -1;

    for (const depId of task.dependencies) {
      maxDepLevel = Math.max(maxDepLevel, computeLevel(depId));
    }

    visiting.delete(taskId);
    visited.add(taskId);
    const level = maxDepLevel + 1;
    levelOf.set(taskId, level);
    return level;
  }

  for (const task of tasks) {
    if (!visited.has(task.id)) {
      computeLevel(task.id);
    }
  }

  // Group tasks by level
  const levelGroups = new Map<number, string[]>();
  for (const [taskId, level] of levelOf) {
    const group = levelGroups.get(level);
    if (group) {
      group.push(taskId);
    } else {
      levelGroups.set(level, [taskId]);
    }
  }

  const levels: ExecutionLevel[] = [];
  const maxLevel = Math.max(...levelGroups.keys());
  for (let i = 0; i <= maxLevel; i++) {
    const taskIds = levelGroups.get(i) ?? [];
    levels.push({ level: i, taskIds });
  }

  return levels;
}

// ---------------------------------------------------------------------------
// ParallelExecutor class
// ---------------------------------------------------------------------------

/**
 * Executes tasks in parallel waves, respecting dependency ordering.
 *
 * The executor groups tasks into execution levels using
 * {@link getExecutionLevels}, then runs each level concurrently (up to
 * `maxConcurrency`). Results from completed tasks are automatically
 * passed as context to dependent tasks.
 *
 * @example
 * ```typescript
 * const executor = new ParallelExecutor({ maxConcurrency: 5 });
 *
 * executor.on('task:complete', (taskId, result) => {
 *   console.log(`${taskId}: ${result.output}`);
 * });
 *
 * const result = await executor.execute(tasks, async (task, ctx) => {
 *   return { output: 'done', agentId: 'agent-1', duration: 100 };
 * });
 * ```
 */
export class ParallelExecutor {
  /** Maximum concurrent tasks per execution level. */
  public readonly maxConcurrency: number;

  /** Error handling policy. */
  public readonly errorPolicy: ParallelErrorPolicy;

  private readonly _emitter: EventEmitter<ParallelExecutorEventMap>;
  private _cancelled: boolean;
  private _running: boolean;

  constructor(config?: ParallelExecutorConfig) {
    const concurrency = config?.maxConcurrency ?? DEFAULT_MAX_CONCURRENCY;

    if (
      !Number.isInteger(concurrency) ||
      concurrency < 1 ||
      concurrency > MAX_CONCURRENCY_UPPER_BOUND
    ) {
      throw new TaskConfigError(
        `maxConcurrency must be an integer between 1 and ${String(MAX_CONCURRENCY_UPPER_BOUND)}`,
      );
    }

    this.maxConcurrency = concurrency;
    this.errorPolicy = config?.errorPolicy ?? 'fail-fast';
    this._emitter = new EventEmitter<ParallelExecutorEventMap>();
    this._cancelled = false;
    this._running = false;
  }

  /** Whether the executor is currently running. */
  get running(): boolean {
    return this._running;
  }

  /** Whether the executor has been cancelled. */
  get cancelled(): boolean {
    return this._cancelled;
  }

  // -------------------------------------------------------------------------
  // Event system
  // -------------------------------------------------------------------------

  /**
   * Subscribe to an executor lifecycle event.
   *
   * @param event    - The event name to listen for
   * @param listener - The callback to invoke when the event fires
   */
  on<E extends keyof ParallelExecutorEventMap>(
    event: E,
    listener: ParallelExecutorEventMap[E],
  ): this {
    this._emitter.on(event, listener as (...args: unknown[]) => void);
    return this;
  }

  /**
   * Unsubscribe from an executor lifecycle event.
   *
   * @param event    - The event name to unsubscribe from
   * @param listener - The callback to remove
   */
  off<E extends keyof ParallelExecutorEventMap>(
    event: E,
    listener: ParallelExecutorEventMap[E],
  ): this {
    this._emitter.off(event, listener as (...args: unknown[]) => void);
    return this;
  }

  /**
   * Subscribe to an executor lifecycle event, automatically unsubscribing after the first invocation.
   *
   * @param event    - The event name to listen for
   * @param listener - The callback to invoke once
   */
  once<E extends keyof ParallelExecutorEventMap>(
    event: E,
    listener: ParallelExecutorEventMap[E],
  ): this {
    this._emitter.once(event, listener as (...args: unknown[]) => void);
    return this;
  }

  // -------------------------------------------------------------------------
  // Execution
  // -------------------------------------------------------------------------

  /**
   * Execute tasks in dependency-aware parallel waves.
   *
   * @param tasks  - Tasks to execute
   * @param runner - Callback that executes a single task
   * @returns Aggregated results of the entire run
   * @throws {TaskConfigError} If the executor is already running or tasks are invalid
   * @throws {TaskExecutionError} If errorPolicy is 'fail-fast' and a task fails
   */
  async execute(tasks: readonly Task[], runner: TaskRunner): Promise<ParallelExecutionResult> {
    if (this._running) {
      throw new TaskConfigError('ParallelExecutor is already running');
    }

    if (tasks.length === 0) {
      return {
        results: new Map(),
        errors: new Map(),
        levels: [],
        duration: 0,
        success: true,
      };
    }

    this._running = true;
    this._cancelled = false;

    const startTime = Date.now();
    const results = new Map<string, TaskResult>();
    const errors = new Map<string, Error>();

    let levels: ExecutionLevel[];
    try {
      levels = getExecutionLevels(tasks);
    } catch (error) {
      this._running = false;
      throw error;
    }

    const taskMap = new Map<string, Task>();
    for (const task of tasks) {
      taskMap.set(task.id, task);
    }

    try {
      for (const level of levels) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (this._cancelled) {
          this._emit('run:cancelled');
          break;
        }

        await this._executeLevel(level, taskMap, runner, results, errors);
      }
    } catch (error) {
      // fail-fast: re-throw the TaskExecutionError
      this._running = false;
      const result: ParallelExecutionResult = {
        results,
        errors,
        levels,
        duration: Date.now() - startTime,
        success: false,
      };
      this._emit('run:complete', result);
      throw error;
    }

    this._running = false;
    const result: ParallelExecutionResult = {
      results,
      errors,
      levels,
      duration: Date.now() - startTime,
      success: errors.size === 0 && !this._cancelled,
    };
    this._emit('run:complete', result);
    return result;
  }

  /**
   * Cancel the current execution. Running tasks in the current level will
   * complete, but no new levels or tasks will start.
   */
  cancel(): void {
    if (this._running) {
      this._cancelled = true;
    }
  }

  // -------------------------------------------------------------------------
  // Private: level execution
  // -------------------------------------------------------------------------

  private async _executeLevel(
    level: ExecutionLevel,
    taskMap: ReadonlyMap<string, Task>,
    runner: TaskRunner,
    results: Map<string, TaskResult>,
    errors: Map<string, Error>,
  ): Promise<void> {
    const taskIds = [...level.taskIds];
    this._emit('level:start', level.level, taskIds);

    // Process tasks in batches of maxConcurrency
    let i = 0;
    while (i < taskIds.length) {
      if (this._cancelled) {
        return;
      }

      const batch = taskIds.slice(i, i + this.maxConcurrency);
      const promises = batch.map((taskId) =>
        this._executeTaskSafe(taskId, level.level, taskMap, runner, results, errors),
      );

      await Promise.all(promises);

      // Check for fail-fast after each batch
      if (this.errorPolicy === 'fail-fast' && errors.size > 0) {
        const firstErrorEntry = errors.entries().next();
        if (!firstErrorEntry.done) {
          const [taskId, error] = firstErrorEntry.value;
          throw new TaskExecutionError(taskId, error.message, undefined, error);
        }
      }

      i += this.maxConcurrency;
    }

    this._emit('level:complete', level.level);
  }

  private async _executeTaskSafe(
    taskId: string,
    level: number,
    taskMap: ReadonlyMap<string, Task>,
    runner: TaskRunner,
    results: Map<string, TaskResult>,
    errors: Map<string, Error>,
  ): Promise<void> {
    const task = taskMap.get(taskId);
    if (!task) {
      return;
    }

    // Skip if a dependency failed
    for (const depId of task.dependencies) {
      if (errors.has(depId)) {
        const reason = `Dependency "${depId}" failed`;
        errors.set(taskId, new TaskExecutionError(taskId, `Skipped: ${reason}`));
        this._emit('task:skipped', taskId, reason);
        return;
      }
    }

    // Build context from completed dependency results
    const context: Record<string, TaskResult> = {};
    for (const depId of task.dependencies) {
      const depResult = results.get(depId);
      if (depResult) {
        context[depId] = depResult;
      }
    }

    this._emit('task:start', taskId, level);

    try {
      const result = await runner(task, context);
      results.set(taskId, result);
      this._emit('task:complete', taskId, result);
    } catch (error) {
      const wrappedError = error instanceof Error ? error : new Error(String(error));
      errors.set(taskId, wrappedError);
      this._emit('task:error', taskId, wrappedError);
    }
  }

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  private _emit<E extends keyof ParallelExecutorEventMap>(
    event: E,
    ...args: Parameters<ParallelExecutorEventMap[E]>
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this._emitter.emit as (event: string, ...args: any[]) => boolean)(event, ...args);
  }
}
