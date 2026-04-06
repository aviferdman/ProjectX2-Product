/**
 * Text-based task plan tree formatter for CLI output.
 *
 * Generates a human-readable representation of a task dependency graph
 * showing execution levels, task status, dependencies, and metadata.
 *
 * @packageDocumentation
 */

import type { TaskPriority } from '../types/task.js';
import { TaskStatus } from '../types/task.js';
import { resolveTaskDependencies } from './task-scheduler.js';
import type { Task } from './task.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Options for customising the output of {@link formatTaskPlanTree}.
 */
export interface FormatTaskPlanOptions {
  /** Title displayed at the top of the plan. Defaults to `"Task Plan"`. */
  readonly title?: string;

  /** Whether to show task status badges (e.g. `[pending]`). Defaults to `true`. */
  readonly showStatus?: boolean;

  /** Whether to show task priority. Defaults to `false`. */
  readonly showPriority?: boolean;

  /** Whether to show dependency lists under each task. Defaults to `true`. */
  readonly showDependencies?: boolean;

  /** Whether to show task descriptions. Defaults to `true`. */
  readonly showDescriptions?: boolean;

  /** Indent size in spaces for nested content. Defaults to `2`. */
  readonly indent?: number;

  /** Use compact single-line format per task instead of multi-line. Defaults to `false`. */
  readonly compact?: boolean;
}

// ---------------------------------------------------------------------------
// Box-drawing characters
// ---------------------------------------------------------------------------

const BOX = {
  branch: '├── ',
  last: '└── ',
  pipe: '│   ',
  space: '    ',
} as const;

// ---------------------------------------------------------------------------
// Status / priority formatting
// ---------------------------------------------------------------------------

const STATUS_ICONS: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: '○',
  [TaskStatus.RUNNING]: '◉',
  [TaskStatus.COMPLETED]: '✓',
  [TaskStatus.FAILED]: '✗',
  [TaskStatus.CANCELLED]: '⊘',
};

function formatStatus(status: TaskStatus): string {
  const icon = STATUS_ICONS[status];
  return `${icon} ${status}`;
}

function formatPriority(priority: TaskPriority): string {
  return priority.toUpperCase();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Format a set of tasks into a text-based plan tree grouped by execution
 * level (wave).
 *
 * Tasks are first resolved via topological sort (using Kahn's algorithm)
 * to determine parallel execution levels, then rendered as an ASCII tree.
 *
 * @param tasks   - The tasks to format (order does not matter).
 * @param options - Optional formatting overrides.
 * @returns A multi-line string suitable for terminal / CLI output.
 * @throws {TaskConfigError} If tasks contain circular or missing dependencies.
 *
 * @example
 * ```typescript
 * const research = new Task({ id: 'research', description: 'Find papers' });
 * const analyse  = new Task({ id: 'analyse', description: 'Analyse results', dependencies: ['research'] });
 * const report   = new Task({ id: 'report', description: 'Write report', dependencies: ['analyse'] });
 *
 * console.log(formatTaskPlanTree([report, analyse, research]));
 * // Task Plan
 * // =========
 * //
 * // Level 0:
 * //   └── research — Find papers  [○ pending]
 * //
 * // Level 1:
 * //   └── analyse — Analyse results  [○ pending]
 * //       └── depends on: research
 * //
 * // Level 2:
 * //   └── report — Write report  [○ pending]
 * //       └── depends on: analyse
 * //
 * // Summary: 3 tasks, 3 levels, 0 completed
 * ```
 */
export function formatTaskPlanTree(
  tasks: readonly Task[],
  options: FormatTaskPlanOptions = {},
): string {
  const {
    title = 'Task Plan',
    showStatus = true,
    showPriority = false,
    showDependencies = true,
    showDescriptions = true,
    indent = 2,
    compact = false,
  } = options;

  if (tasks.length === 0) {
    return `${title}\n${'='.repeat(title.length)}\n\n(no tasks)`;
  }

  const { levels } = resolveTaskDependencies(tasks);

  const lines: string[] = [];

  // Title
  lines.push(title);
  lines.push('='.repeat(title.length));
  lines.push('');

  // Render each level
  for (let levelIdx = 0; levelIdx < levels.length; levelIdx++) {
    const level = levels[levelIdx]!;
    const levelLabel =
      level.length > 1 ? `Level ${String(levelIdx)} (parallel)` : `Level ${String(levelIdx)}`;
    lines.push(`${levelLabel}:`);

    for (let taskIdx = 0; taskIdx < level.length; taskIdx++) {
      const task = level[taskIdx]!;
      const isLast = taskIdx === level.length - 1;
      const prefix = ' '.repeat(indent);
      const connector = isLast ? BOX.last : BOX.branch;
      const continuation = isLast ? BOX.space : BOX.pipe;

      // Main task line
      const parts: string[] = [task.id];
      if (showDescriptions) {
        parts.push(`— ${task.description}`);
      }
      if (showPriority) {
        parts.push(`[${formatPriority(task.priority)}]`);
      }
      if (showStatus) {
        parts.push(`[${formatStatus(task.status)}]`);
      }

      lines.push(`${prefix}${connector}${parts.join('  ')}`);

      if (!compact) {
        // Dependency sub-line
        if (showDependencies && task.dependencies.length > 0) {
          const depLine = `depends on: ${task.dependencies.join(', ')}`;
          lines.push(`${prefix}${continuation}${BOX.last}${depLine}`);
        }
      }
    }

    lines.push('');
  }

  // Summary
  const completedCount = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
  const failedCount = tasks.filter((t) => t.status === TaskStatus.FAILED).length;

  const summaryParts = [
    `${String(tasks.length)} task${tasks.length === 1 ? '' : 's'}`,
    `${String(levels.length)} level${levels.length === 1 ? '' : 's'}`,
    `${String(completedCount)} completed`,
  ];
  if (failedCount > 0) {
    summaryParts.push(`${String(failedCount)} failed`);
  }

  lines.push(`Summary: ${summaryParts.join(', ')}`);

  return lines.join('\n');
}

/**
 * Format a single task's dependency tree as a flat indented string.
 *
 * Renders the task and then recursively renders its transitive
 * dependencies in a tree layout. Useful when inspecting a single task's
 * "upstream" chain.
 *
 * @param task    - The root task to format.
 * @param allTasks - The full task set (used to resolve dependency IDs).
 * @param options  - Optional formatting overrides.
 * @returns A multi-line string showing the task and its upstream dependencies.
 *
 * @example
 * ```typescript
 * console.log(formatTaskDependencyTree(reportTask, allTasks));
 * // report — Write report  [○ pending]
 * //   └── analyse — Analyse results  [○ pending]
 * //       └── research — Find papers  [○ pending]
 * ```
 */
export function formatTaskDependencyTree(
  task: Task,
  allTasks: readonly Task[],
  options: FormatTaskPlanOptions = {},
): string {
  const { showStatus = true, showPriority = false, showDescriptions = true } = options;

  const taskMap = new Map<string, Task>();
  for (const t of allTasks) {
    taskMap.set(t.id, t);
  }

  const lines: string[] = [];
  const visited = new Set<string>();

  function renderTaskLine(t: Task): string {
    const parts: string[] = [t.id];
    if (showDescriptions) {
      parts.push(`— ${t.description}`);
    }
    if (showPriority) {
      parts.push(`[${formatPriority(t.priority)}]`);
    }
    if (showStatus) {
      parts.push(`[${formatStatus(t.status)}]`);
    }
    return parts.join('  ');
  }

  function walk(current: Task, prefix: string, isRoot: boolean): void {
    if (isRoot) {
      lines.push(renderTaskLine(current));
    }

    if (visited.has(current.id)) {
      return;
    }
    visited.add(current.id);

    const deps = current.dependencies
      .map((depId) => taskMap.get(depId))
      .filter((d): d is Task => d !== undefined)
      .filter((d) => !visited.has(d.id));

    for (let i = 0; i < deps.length; i++) {
      const dep = deps[i]!;
      const isLast = i === deps.length - 1;
      const connector = isLast ? BOX.last : BOX.branch;
      const nextPrefix = prefix + (isLast ? BOX.space : BOX.pipe);

      lines.push(`${prefix}${connector}${renderTaskLine(dep)}`);
      walk(dep, nextPrefix, false);
    }
  }

  walk(task, '', true);

  return lines.join('\n');
}

/**
 * Generate a compact one-line-per-task summary string.
 *
 * Useful for quick status overviews in CI logs or inline CLI messages.
 *
 * @param tasks - The tasks to summarise.
 * @returns A multi-line string with one task per line.
 *
 * @example
 * ```typescript
 * console.log(formatTaskList(tasks));
 * // [○ pending]  research — Find papers
 * // [○ pending]  analyse — Analyse results  (← research)
 * // [○ pending]  report — Write report  (← analyse)
 * ```
 */
export function formatTaskList(tasks: readonly Task[]): string {
  if (tasks.length === 0) {
    return '(no tasks)';
  }

  const lines: string[] = [];

  for (const task of tasks) {
    const statusStr = `[${formatStatus(task.status)}]`;
    const depStr = task.dependencies.length > 0 ? `  (← ${task.dependencies.join(', ')})` : '';
    lines.push(`${statusStr}  ${task.id} — ${task.description}${depStr}`);
  }

  return lines.join('\n');
}
