/**
 * TaskContextManager — manages the flow of context data between tasks.
 *
 * When tasks are composed into workflows, the output of upstream tasks
 * often needs to be passed as context to downstream dependents. The
 * {@link TaskContextManager} encapsulates this logic, supporting:
 *
 * - **Result storage:** Completed task results are stored and retrieved by ID.
 * - **Context resolution:** Dependency outputs are collected and merged with
 *   a task's static context to produce the final {@link TaskInput}.
 * - **Merge strategies:** `replace`, `shallow-merge`, or `deep-merge` control
 *   how dependency outputs are combined with static context.
 * - **Custom transformers:** Callers can supply a {@link ContextTransformer}
 *   to reshape dependency outputs before merging.
 *
 * @packageDocumentation
 */

import type { Task } from './task.js';
import type { TaskInput, TaskResult } from '../types/task.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Strategy for merging dependency results into a task's static context.
 *
 * - `replace`       — dependency results completely replace static context.
 * - `shallow-merge` — dependency results are shallow-merged onto static context (default).
 * - `deep-merge`    — dependency results are recursively deep-merged onto static context.
 */
export type ContextMergeStrategy = 'replace' | 'shallow-merge' | 'deep-merge';

/**
 * A function that transforms raw dependency results into a context object.
 *
 * @param dependencyResults - Map of dependency task IDs to their results.
 * @param staticContext     - The task's own static context data.
 * @returns The transformed context to inject into the task input.
 */
export type ContextTransformer = (
  dependencyResults: ReadonlyMap<string, TaskResult>,
  staticContext: Readonly<Record<string, unknown>>,
) => Record<string, unknown>;

/** Configuration for creating a {@link TaskContextManager}. */
export interface TaskContextManagerConfig {
  /** How to merge dependency outputs with static context (default: `shallow-merge`). */
  readonly mergeStrategy?: ContextMergeStrategy;
  /** Optional custom transformer applied before merging. */
  readonly transformer?: ContextTransformer;
  /** Whether to include full result metadata (duration, tokenUsage) or just output strings (default: false). */
  readonly includeMetadata?: boolean;
}

// ---------------------------------------------------------------------------
// Deep merge helper
// ---------------------------------------------------------------------------

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...target };
  for (const key of Object.keys(source)) {
    const targetVal = result[key];
    const sourceVal = source[key];
    if (isPlainObject(targetVal) && isPlainObject(sourceVal)) {
      result[key] = deepMerge(targetVal, sourceVal);
    } else {
      result[key] = sourceVal;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// TaskContextManager
// ---------------------------------------------------------------------------

/**
 * Manages context data flow between tasks in a workflow.
 *
 * @example
 * ```typescript
 * const ctxManager = new TaskContextManager({ mergeStrategy: 'shallow-merge' });
 *
 * // After task A completes:
 * ctxManager.setResult('task-a', resultA);
 *
 * // Before executing task B (which depends on A):
 * const input = ctxManager.buildTaskInput(taskB);
 * // input.context now contains { dependencyResults: { 'task-a': '...' } }
 * ```
 */
export class TaskContextManager {
  private readonly _results: Map<string, TaskResult>;
  private readonly _mergeStrategy: ContextMergeStrategy;
  private readonly _transformer: ContextTransformer | undefined;
  private readonly _includeMetadata: boolean;

  constructor(config?: TaskContextManagerConfig) {
    this._results = new Map();
    this._mergeStrategy = config?.mergeStrategy ?? 'shallow-merge';
    this._transformer = config?.transformer;
    this._includeMetadata = config?.includeMetadata ?? false;
  }

  // -------------------------------------------------------------------------
  // Read-only accessors
  // -------------------------------------------------------------------------

  /** The configured merge strategy. */
  get mergeStrategy(): ContextMergeStrategy {
    return this._mergeStrategy;
  }

  /** Whether full result metadata is included in context. */
  get includeMetadata(): boolean {
    return this._includeMetadata;
  }

  /** Number of stored results. */
  get size(): number {
    return this._results.size;
  }

  // -------------------------------------------------------------------------
  // Result management
  // -------------------------------------------------------------------------

  /**
   * Store a completed task's result.
   *
   * @param taskId - The ID of the completed task
   * @param result - The task's result
   * @throws {Error} If taskId is empty
   */
  setResult(taskId: string, result: TaskResult): void {
    if (!taskId) {
      throw new Error('taskId must not be empty');
    }
    this._results.set(taskId, result);
  }

  /**
   * Retrieve a stored task result.
   *
   * @param taskId - The task ID to look up
   * @returns The result, or `undefined` if not stored
   */
  getResult(taskId: string): TaskResult | undefined {
    return this._results.get(taskId);
  }

  /**
   * Check whether a result exists for the given task ID.
   *
   * @param taskId - The task ID to check
   */
  hasResult(taskId: string): boolean {
    return this._results.has(taskId);
  }

  /**
   * Get a read-only view of all stored results.
   */
  getAllResults(): ReadonlyMap<string, TaskResult> {
    return this._results;
  }

  /**
   * Remove a stored result.
   *
   * @param taskId - The task ID to remove
   * @returns `true` if a result was removed, `false` otherwise
   */
  removeResult(taskId: string): boolean {
    return this._results.delete(taskId);
  }

  /** Clear all stored results. */
  clear(): void {
    this._results.clear();
  }

  // -------------------------------------------------------------------------
  // Context resolution
  // -------------------------------------------------------------------------

  /**
   * Resolve the final context for a task by collecting dependency outputs
   * and merging them with the task's static context.
   *
   * If a custom transformer is configured, it is applied first. Otherwise,
   * dependency results are placed under a `dependencyResults` key in the
   * merged context.
   *
   * @param task - The task whose context should be resolved
   * @returns The resolved context object
   */
  resolveContext(task: Task): Record<string, unknown> {
    const staticContext: Record<string, unknown> = { ...task.context };
    const depResults = this._collectDependencyResults(task);

    if (depResults.size === 0 && !this._transformer) {
      return staticContext;
    }

    if (this._transformer) {
      const transformed = this._transformer(depResults, staticContext);
      return this._merge(staticContext, transformed);
    }

    const dependencyContext = this._buildDependencyContext(depResults);
    if (Object.keys(dependencyContext).length === 0) {
      return staticContext;
    }

    return this._merge(staticContext, { dependencyResults: dependencyContext });
  }

  /**
   * Build a complete {@link TaskInput} for a task, including resolved context.
   *
   * This is the primary method for integration with execution engines.
   *
   * @param task - The task to build input for
   * @returns A TaskInput with description, expectedOutput, and resolved context
   */
  buildTaskInput(task: Task): TaskInput {
    const context = this.resolveContext(task);

    const input: {
      description: string;
      expectedOutput?: string;
      context?: Record<string, unknown>;
    } = {
      description: task.description,
    };

    if (task.expectedOutput) {
      input.expectedOutput = task.expectedOutput;
    }

    if (Object.keys(context).length > 0) {
      input.context = context;
    }

    return input;
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private _collectDependencyResults(task: Task): ReadonlyMap<string, TaskResult> {
    const results = new Map<string, TaskResult>();
    for (const depId of task.dependencies) {
      const result = this._results.get(depId);
      if (result) {
        results.set(depId, result);
      }
    }
    return results;
  }

  private _buildDependencyContext(
    depResults: ReadonlyMap<string, TaskResult>,
  ): Record<string, unknown> {
    const context: Record<string, unknown> = {};
    for (const [depId, result] of depResults) {
      if (this._includeMetadata) {
        context[depId] = {
          output: result.output,
          agentId: result.agentId,
          duration: result.duration,
          ...(result.tokenUsage ? { tokenUsage: result.tokenUsage } : {}),
          ...(result.metadata ? { metadata: result.metadata } : {}),
        };
      } else {
        context[depId] = result.output;
      }
    }
    return context;
  }

  private _merge(
    base: Record<string, unknown>,
    overlay: Record<string, unknown>,
  ): Record<string, unknown> {
    switch (this._mergeStrategy) {
      case 'replace':
        return overlay;
      case 'deep-merge':
        return deepMerge(base, overlay);
      case 'shallow-merge':
      default:
        return { ...base, ...overlay };
    }
  }
}
