/**
 * Task dependency resolution via topological sort (Kahn's algorithm).
 *
 * Provides two main functions:
 * - {@link topologicalSort} — produces a flat execution order
 * - {@link getExecutionLevels} — groups tasks into parallelisable waves
 *
 * @packageDocumentation
 */

import { CircularDependencyError, TaskConfigError } from '../errors/index.js';
import type { DependencyCycle } from '../errors/index.js';
import type { Task } from './task.js';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Result of circular dependency detection.
 */
export interface CircularDependencyCheckResult {
  /** Whether the task graph contains any cycles. */
  readonly hasCycles: boolean;

  /** All detected cycles, each with the path of task IDs. */
  readonly cycles: readonly DependencyCycle[];

  /** Unique task IDs involved in at least one cycle. */
  readonly involvedTaskIds: readonly string[];
}

/**
 * Detect circular dependencies in a set of tasks using DFS.
 *
 * Unlike the Kahn's algorithm used in {@link resolveTaskDependencies}, this
 * function identifies the *exact cycle paths* rather than just reporting
 * which tasks are involved.
 *
 * @param tasks - The tasks to check.
 * @returns A {@link CircularDependencyCheckResult} describing any cycles found.
 * @throws {TaskConfigError} If duplicate task IDs or unknown dependencies exist.
 *
 * @example
 * ```typescript
 * const a = new Task({ id: 'a', description: '...', dependencies: ['c'] });
 * const b = new Task({ id: 'b', description: '...', dependencies: ['a'] });
 * const c = new Task({ id: 'c', description: '...', dependencies: ['b'] });
 *
 * const result = detectCircularDependencies([a, b, c]);
 * // result.hasCycles === true
 * // result.cycles[0].path === ['a', 'c', 'b', 'a']
 * ```
 */
export function detectCircularDependencies(tasks: readonly Task[]): CircularDependencyCheckResult {
  if (tasks.length === 0) {
    return { hasCycles: false, cycles: [], involvedTaskIds: [] };
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
        throw new TaskConfigError(`Dependency "${depId}" not found in task set`, task.id);
      }
    }
  }

  return findCyclesWithDFS(taskMap);
}

/**
 * Assert that a set of tasks contains no circular dependencies.
 *
 * Convenience wrapper around {@link detectCircularDependencies} that throws
 * a {@link CircularDependencyError} if any cycles are found.
 *
 * @param tasks - The tasks to validate.
 * @throws {CircularDependencyError} If any cycles are detected.
 * @throws {TaskConfigError} If duplicate task IDs or unknown dependencies exist.
 */
export function assertNoCycles(tasks: readonly Task[]): void {
  const result = detectCircularDependencies(tasks);
  if (result.hasCycles) {
    throw new CircularDependencyError([...result.cycles]);
  }
}

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
        throw new TaskConfigError(`Dependency "${depId}" not found in task set`, task.id);
      }
    }
    // Self-dependency check
    if (task.dependencies.includes(task.id)) {
      throw new TaskConfigError(`Task depends on itself`, task.id);
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
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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

  // If not all tasks were visited, there's a cycle — use DFS to find exact paths
  if (sorted.length !== tasks.length) {
    // Build a map of only the unvisited tasks for cycle detection
    const unvisitedMap = new Map<string, Task>();
    const visitedIds = new Set(sorted.map((t) => t.id));
    for (const task of tasks) {
      if (!visitedIds.has(task.id)) {
        unvisitedMap.set(task.id, task);
      }
    }

    const cycleResult = findCyclesWithDFS(taskMap);
    if (cycleResult.hasCycles) {
      throw new CircularDependencyError([...cycleResult.cycles]);
    }

    // Fallback (should not happen — Kahn's detected a cycle but DFS didn't)
    const cycleIds = [...unvisitedMap.keys()].sort();
    throw new TaskConfigError(`Circular dependency detected among tasks: ${cycleIds.join(', ')}`);
  }

  return { sorted, levels };
}

// ---------------------------------------------------------------------------
// Internal — DFS-based cycle detection
// ---------------------------------------------------------------------------

const enum DFSColor {
  WHITE = 0, // Unvisited
  GRAY = 1, // In current DFS path (on recursion stack)
  BLACK = 2, // Fully processed
}

/**
 * Find all elementary cycles in the task dependency graph using DFS.
 *
 * Visits each node via DFS; when a GRAY (on-stack) node is re-encountered
 * we extract the cycle path from the recursion stack.
 */
function findCyclesWithDFS(taskMap: Map<string, Task>): CircularDependencyCheckResult {
  const color = new Map<string, DFSColor>();
  const parent = new Map<string, string | null>();
  const cycles: DependencyCycle[] = [];
  const seenCycleKeys = new Set<string>();

  for (const id of taskMap.keys()) {
    color.set(id, DFSColor.WHITE);
  }

  // Sort keys for deterministic traversal order
  const sortedIds = [...taskMap.keys()].sort();

  for (const startId of sortedIds) {
    if (color.get(startId) === DFSColor.WHITE) {
      dfsVisit(startId, taskMap, color, parent, cycles, seenCycleKeys);
    }
  }

  if (cycles.length === 0) {
    return { hasCycles: false, cycles: [], involvedTaskIds: [] };
  }

  const involvedIds = new Set<string>();
  for (const cycle of cycles) {
    for (let i = 0; i < cycle.path.length - 1; i++) {
      const id = cycle.path[i];
      if (id !== undefined) {
        involvedIds.add(id);
      }
    }
  }

  return {
    hasCycles: true,
    cycles,
    involvedTaskIds: [...involvedIds].sort(),
  };
}

/**
 * Iterative DFS visit using an explicit stack to avoid call-stack overflow
 * on large graphs.
 */
function dfsVisit(
  startId: string,
  taskMap: Map<string, Task>,
  color: Map<string, DFSColor>,
  _parent: Map<string, string | null>,
  cycles: DependencyCycle[],
  seenCycleKeys: Set<string>,
): void {
  // Stack items: [taskId, index into its sorted dependencies]
  const stack: Array<{ id: string; depIndex: number }> = [{ id: startId, depIndex: 0 }];
  color.set(startId, DFSColor.GRAY);
  _parent.set(startId, null);

  // Track the current DFS path for cycle extraction
  const pathSet = new Set<string>([startId]);
  const pathStack: string[] = [startId];

  while (stack.length > 0) {
    const top = stack[stack.length - 1];
    if (top === undefined) break;

    const taskId = top.id;
    const task = taskMap.get(taskId);
    if (task === undefined) break;

    const deps = [...task.dependencies].sort();

    if (top.depIndex < deps.length) {
      const depId = deps[top.depIndex];
      top.depIndex++;

      if (depId === undefined) continue;

      const depColor = color.get(depId);
      if (depColor === DFSColor.GRAY && pathSet.has(depId)) {
        // Found a cycle — extract the path
        extractCycle(depId, pathStack, cycles, seenCycleKeys);
      } else if (depColor === DFSColor.WHITE) {
        color.set(depId, DFSColor.GRAY);
        _parent.set(depId, taskId);
        stack.push({ id: depId, depIndex: 0 });
        pathStack.push(depId);
        pathSet.add(depId);
      }
    } else {
      // All dependencies of this node explored — backtrack
      color.set(taskId, DFSColor.BLACK);
      stack.pop();
      pathStack.pop();
      pathSet.delete(taskId);
    }
  }
}

/**
 * Extract a cycle from the current DFS path stack.
 *
 * Given that `targetId` was found again (it's in the GRAY set),
 * walk back through the pathStack to reconstruct the cycle.
 */
function extractCycle(
  targetId: string,
  pathStack: string[],
  cycles: DependencyCycle[],
  seenCycleKeys: Set<string>,
): void {
  const cycleStart = pathStack.indexOf(targetId);
  if (cycleStart === -1) return;

  const cyclePath = pathStack.slice(cycleStart);
  cyclePath.push(targetId); // Close the loop

  // Normalise cycle to a canonical form for deduplication:
  // rotate so the lexicographically smallest ID comes first
  const inner = cyclePath.slice(0, -1);
  let minIdx = 0;
  for (let i = 1; i < inner.length; i++) {
    const current = inner[i];
    const smallest = inner[minIdx];
    if (current !== undefined && smallest !== undefined && current < smallest) {
      minIdx = i;
    }
  }
  const rotated = [...inner.slice(minIdx), ...inner.slice(0, minIdx)];
  const first = rotated[0];
  if (first !== undefined) {
    rotated.push(first);
  }
  const key = rotated.join('→');

  if (!seenCycleKeys.has(key)) {
    seenCycleKeys.add(key);
    cycles.push({ path: rotated });
  }
}
