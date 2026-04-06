/**
 * Task dependency resolution via topological sort (Kahn's algorithm).
 *
 * Provides two main functions:
 * - {@link topologicalSort} — produces a flat execution order
 * - {@link getExecutionLevels} — groups tasks into parallelisable waves
 *
 * @packageDocumentation
 */

import { TaskConfigError } from '../errors/index.js';
import type { Task } from './task.js';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Result of a topological sort, including both the flat order and grouped
 * execution levels for parallel scheduling.
 */
export interface TopologicalSortResult {
  /** Tasks in a valid topological execution order. */
  readonly sorted: readonly Task[];

  /**
   * Tasks grouped by execution "level". Tasks within the same level have
   * no inter-dependencies and may run in parallel.
   */
  readonly levels: readonly (readonly Task[])[];
}

/**
 * Topologically sort a set of tasks based on their declared dependencies.
 *
 * Uses Kahn's algorithm (BFS-based) which naturally produces a stable
 * ordering and cleanly detects cycles.
 *
 * @param tasks - The tasks to sort. Each task's {@link Task.dependencies}
 *   must reference IDs present in the supplied array.
 * @returns An array of tasks in valid execution order.
 * @throws {TaskConfigError} If a circular dependency is detected.
 * @throws {TaskConfigError} If a dependency references an unknown task ID.
 *
 * @example
 * ```typescript
 * const research = new Task({ id: 'research', description: '...' });
 * const analyse  = new Task({ id: 'analyse', description: '...', dependencies: ['research'] });
 * const report   = new Task({ id: 'report', description: '...', dependencies: ['analyse'] });
 *
 * const ordered = topologicalSort([report, analyse, research]);
 * // => [research, analyse, report]
 * ```
 */
export function topologicalSort(tasks: readonly Task[]): Task[] {
  const result = resolveTaskDependencies(tasks);
  return [...result.sorted];
}

/**
 * Group tasks into execution levels (waves) that can run in parallel.
 *
 * Level 0 contains tasks with no dependencies. Level 1 contains tasks
 * whose dependencies are all in level 0, and so on.
 *
 * @param tasks - The tasks to schedule.
 * @returns An array of arrays, where each inner array is a set of tasks
 *   that can execute concurrently.
 * @throws {TaskConfigError} If a circular dependency is detected.
 * @throws {TaskConfigError} If a dependency references an unknown task ID.
 *
 * @example
 * ```typescript
 * const a = new Task({ id: 'a', description: '...' });
 * const b = new Task({ id: 'b', description: '...', dependencies: ['a'] });
 * const c = new Task({ id: 'c', description: '...', dependencies: ['a'] });
 * const d = new Task({ id: 'd', description: '...', dependencies: ['b', 'c'] });
 *
 * const levels = getExecutionLevels([d, c, b, a]);
 * // => [[a], [b, c], [d]]
 * ```
 */
export function getExecutionLevels(tasks: readonly Task[]): Task[][] {
  const result = resolveTaskDependencies(tasks);
  return result.levels.map((level) => [...level]);
}

/**
 * Full dependency resolution: returns both the flat sorted order and the
 * parallel execution levels in a single pass.
 *
 * @param tasks - The tasks to resolve.
 * @returns A {@link TopologicalSortResult} with both views.
 * @throws {TaskConfigError} If a circular dependency is detected.
 * @throws {TaskConfigError} If a dependency references an unknown task ID.
 */
export function resolveTaskDependencies(tasks: readonly Task[]): TopologicalSortResult {
  if (tasks.length === 0) {
    return { sorted: [], levels: [] };
  }

  // Build lookup map and validate uniqueness
  const taskMap = new Map<string, Task>();
  for (const task of tasks) {
    if (taskMap.has(task.id)) {
      throw new TaskConfigError(`Duplicate task id "${task.id}"`, task.id);
    }
    taskMap.set(task.id, task);
  }

  // Validate all declared dependencies exist
  for (const task of tasks) {
    for (const depId of task.dependencies) {
      if (!taskMap.has(depId)) {
        throw new TaskConfigError(
          `Dependency "${depId}" not found in task set`,
          task.id,
        );
      }
    }
    // Self-dependency check
    if (task.dependencies.includes(task.id)) {
      throw new TaskConfigError(
        `Task depends on itself`,
        task.id,
      );
    }
  }

  // Kahn's algorithm — compute in-degree per task
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>(); // depId → [taskIds that depend on it]

  for (const task of tasks) {
    inDegree.set(task.id, task.dependencies.length);
    for (const depId of task.dependencies) {
      const list = dependents.get(depId) ?? [];
      list.push(task.id);
      dependents.set(depId, list);
    }
  }

  // Seed the queue with zero-in-degree tasks (sorted by id for determinism)
  const queue: string[] = [];
  for (const task of tasks) {
    if (inDegree.get(task.id) === 0) {
      queue.push(task.id);
    }
  }
  queue.sort();

  const sorted: Task[] = [];
  const levels: Task[][] = [];

  // BFS level-by-level
  while (queue.length > 0) {
    // Process all tasks at the current level
    const currentLevel: Task[] = [];
    const nextQueue: string[] = [];

    for (const taskId of queue) {
      const task = taskMap.get(taskId)!;
      sorted.push(task);
      currentLevel.push(task);

      // Reduce in-degree for dependents
      const deps = dependents.get(taskId) ?? [];
      for (const depId of deps) {
        const newDegree = (inDegree.get(depId) ?? 0) - 1;
        inDegree.set(depId, newDegree);
        if (newDegree === 0) {
          nextQueue.push(depId);
        }
      }
    }

    levels.push(currentLevel);
    // Sort for deterministic ordering
    nextQueue.sort();
    queue.length = 0;
    queue.push(...nextQueue);
  }

  // If not all tasks were visited, there's a cycle
  if (sorted.length !== tasks.length) {
    const cycleIds = tasks
      .filter((t) => !sorted.some((s) => s.id === t.id))
      .map((t) => t.id)
      .sort();

    throw new TaskConfigError(
      `Circular dependency detected among tasks: ${cycleIds.join(', ')}`,
    );
  }

  return { sorted, levels };
}
