import { describe, it, expect } from 'vitest';

import { Task } from '../../../src/task/task.js';
import {
  formatTaskPlanTree,
  formatTaskDependencyTree,
  formatTaskList,
} from '../../../src/task/task-plan-formatter.js';
import type { FormatTaskPlanOptions } from '../../../src/task/task-plan-formatter.js';
import type { TaskConfig } from '../../../src/types/index.js';
import { TaskPriority, TaskStatus } from '../../../src/types/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTask(id: string, description?: string, dependencies?: string[]): Task {
  const config: TaskConfig = {
    id,
    description: description ?? `Task ${id}`,
    ...(dependencies && dependencies.length > 0 ? { dependencies } : {}),
  };
  return new Task(config);
}

function makeTaskWithPriority(id: string, priority: TaskPriority, dependencies?: string[]): Task {
  const config: TaskConfig = {
    id,
    description: `Task ${id}`,
    priority,
    ...(dependencies && dependencies.length > 0 ? { dependencies } : {}),
  };
  return new Task(config);
}

// ---------------------------------------------------------------------------
// formatTaskPlanTree
// ---------------------------------------------------------------------------

describe('formatTaskPlanTree', () => {
  describe('empty input', () => {
    it('should display "(no tasks)" for empty array', () => {
      const result = formatTaskPlanTree([]);
      expect(result).toContain('Task Plan');
      expect(result).toContain('(no tasks)');
    });

    it('should use the default title', () => {
      const result = formatTaskPlanTree([]);
      expect(result).toMatch(/^Task Plan\n/);
    });
  });

  describe('single task', () => {
    it('should render one task at level 0', () => {
      const task = makeTask('research', 'Find papers');
      const result = formatTaskPlanTree([task]);
      expect(result).toContain('Level 0:');
      expect(result).toContain('research');
      expect(result).toContain('Find papers');
      expect(result).toContain('pending');
    });

    it('should show summary with 1 task', () => {
      const task = makeTask('solo');
      const result = formatTaskPlanTree([task]);
      expect(result).toContain('Summary: 1 task, 1 level, 0 completed');
    });
  });

  describe('linear chain (A → B → C)', () => {
    it('should group tasks into separate sequential levels', () => {
      const a = makeTask('a', 'First step');
      const b = makeTask('b', 'Second step', ['a']);
      const c = makeTask('c', 'Third step', ['b']);
      const result = formatTaskPlanTree([c, a, b]);

      expect(result).toContain('Level 0:');
      expect(result).toContain('Level 1:');
      expect(result).toContain('Level 2:');
      expect(result).toContain('Summary: 3 tasks, 3 levels, 0 completed');
    });

    it('should show dependency info for each task', () => {
      const a = makeTask('a');
      const b = makeTask('b', 'Second step', ['a']);
      const c = makeTask('c', 'Third step', ['b']);
      const result = formatTaskPlanTree([a, b, c]);

      expect(result).toContain('depends on: a');
      expect(result).toContain('depends on: b');
    });

    it('should not show dependency line for root tasks', () => {
      const a = makeTask('a');
      const result = formatTaskPlanTree([a]);

      // Level 0 task should not have "depends on" line
      const lines = result.split('\n');
      const aLine = lines.findIndex((l) => l.includes('a') && l.includes('Task a'));
      expect(aLine).toBeGreaterThan(-1);
      // The line after the task should not be a dependency line
      const nextLine = lines[aLine + 1] ?? '';
      expect(nextLine).not.toContain('depends on');
    });
  });

  describe('parallel tasks (diamond DAG)', () => {
    it('should label levels with "(parallel)" when they have multiple tasks', () => {
      const a = makeTask('a');
      const b = makeTask('b', 'Branch 1', ['a']);
      const c = makeTask('c', 'Branch 2', ['a']);
      const d = makeTask('d', 'Merge', ['b', 'c']);
      const result = formatTaskPlanTree([d, c, b, a]);

      expect(result).toContain('Level 0:');
      expect(result).toContain('Level 1 (parallel):');
      expect(result).toContain('Level 2:');
    });

    it('should show multiple tasks within a parallel level', () => {
      const a = makeTask('a');
      const b = makeTask('b', 'Branch 1', ['a']);
      const c = makeTask('c', 'Branch 2', ['a']);
      const result = formatTaskPlanTree([a, b, c]);

      const level1Section = result.split('Level 1')[1] ?? '';
      expect(level1Section).toContain('b');
      expect(level1Section).toContain('c');
    });
  });

  describe('independent tasks (no dependencies)', () => {
    it('should place all tasks in level 0 as parallel', () => {
      const a = makeTask('a');
      const b = makeTask('b');
      const c = makeTask('c');
      const result = formatTaskPlanTree([a, b, c]);

      expect(result).toContain('Level 0 (parallel):');
      expect(result).toContain('Summary: 3 tasks, 1 level, 0 completed');
    });
  });

  describe('title option', () => {
    it('should use custom title', () => {
      const task = makeTask('x');
      const result = formatTaskPlanTree([task], { title: 'My Plan' });
      expect(result).toMatch(/^My Plan\n/);
      expect(result).toContain('='.repeat('My Plan'.length));
    });

    it('should underline title with equals signs matching title length', () => {
      const task = makeTask('x');
      const result = formatTaskPlanTree([task], { title: 'ABC' });
      const lines = result.split('\n');
      expect(lines[1]).toBe('===');
    });
  });

  describe('showStatus option', () => {
    it('should show status by default', () => {
      const task = makeTask('x');
      const result = formatTaskPlanTree([task]);
      expect(result).toContain('pending');
    });

    it('should hide status when showStatus is false', () => {
      const task = makeTask('x');
      const result = formatTaskPlanTree([task], { showStatus: false });
      expect(result).not.toContain('pending');
      expect(result).not.toContain('○');
    });
  });

  describe('showPriority option', () => {
    it('should hide priority by default', () => {
      const task = makeTaskWithPriority('x', TaskPriority.HIGH);
      const result = formatTaskPlanTree([task]);
      expect(result).not.toContain('HIGH');
    });

    it('should show priority when enabled', () => {
      const task = makeTaskWithPriority('x', TaskPriority.HIGH);
      const result = formatTaskPlanTree([task], { showPriority: true });
      expect(result).toContain('HIGH');
    });
  });

  describe('showDependencies option', () => {
    it('should show dependencies by default', () => {
      const a = makeTask('a');
      const b = makeTask('b', 'Task b', ['a']);
      const result = formatTaskPlanTree([a, b]);
      expect(result).toContain('depends on: a');
    });

    it('should hide dependencies when showDependencies is false', () => {
      const a = makeTask('a');
      const b = makeTask('b', 'Task b', ['a']);
      const result = formatTaskPlanTree([a, b], { showDependencies: false });
      expect(result).not.toContain('depends on');
    });
  });

  describe('showDescriptions option', () => {
    it('should show descriptions by default', () => {
      const task = makeTask('x', 'My important task');
      const result = formatTaskPlanTree([task]);
      expect(result).toContain('My important task');
    });

    it('should hide descriptions when showDescriptions is false', () => {
      const task = makeTask('x', 'My important task');
      const result = formatTaskPlanTree([task], { showDescriptions: false });
      expect(result).not.toContain('My important task');
      expect(result).toContain('x');
    });
  });

  describe('compact option', () => {
    it('should suppress dependency sub-lines in compact mode', () => {
      const a = makeTask('a');
      const b = makeTask('b', 'Task b', ['a']);
      const result = formatTaskPlanTree([a, b], { compact: true });
      expect(result).not.toContain('depends on');
    });

    it('should still show task IDs and descriptions in compact mode', () => {
      const a = makeTask('a', 'First');
      const b = makeTask('b', 'Second', ['a']);
      const result = formatTaskPlanTree([a, b], { compact: true });
      expect(result).toContain('a');
      expect(result).toContain('b');
      expect(result).toContain('First');
      expect(result).toContain('Second');
    });
  });

  describe('status counts in summary', () => {
    it('should count completed tasks', () => {
      const a = makeTask('a');
      const b = makeTask('b');
      a.setStatus(TaskStatus.RUNNING);
      a.complete({ output: 'done', agentId: 'ag', duration: 100 });
      const result = formatTaskPlanTree([a, b]);
      expect(result).toContain('1 completed');
    });

    it('should show failed count when > 0', () => {
      const a = makeTask('a');
      const b = makeTask('b');
      a.setStatus(TaskStatus.RUNNING);
      a.fail(new Error('oops'));
      const result = formatTaskPlanTree([a, b]);
      expect(result).toContain('1 failed');
    });

    it('should not show failed count when 0', () => {
      const task = makeTask('a');
      const result = formatTaskPlanTree([task]);
      expect(result).not.toContain('failed');
    });
  });

  describe('box-drawing connectors', () => {
    it('should use └── for last task in a level', () => {
      const task = makeTask('solo');
      const result = formatTaskPlanTree([task]);
      expect(result).toContain('└── solo');
    });

    it('should use ├── for non-last tasks in a level', () => {
      const a = makeTask('a');
      const b = makeTask('b');
      const c = makeTask('c');
      const result = formatTaskPlanTree([a, b, c]);
      expect(result).toContain('├── a');
      expect(result).toContain('├── b');
      expect(result).toContain('└── c');
    });
  });

  describe('error handling', () => {
    it('should throw on circular dependencies', () => {
      const a = makeTask('a', 'Task a', ['b']);
      const b = makeTask('b', 'Task b', ['a']);
      expect(() => formatTaskPlanTree([a, b])).toThrow(/[Cc]ircular/);
    });

    it('should throw on missing dependency reference', () => {
      const a = makeTask('a', 'Task a', ['missing']);
      expect(() => formatTaskPlanTree([a])).toThrow(/not found/);
    });
  });

  describe('complex DAG', () => {
    it('should handle a realistic multi-level plan', () => {
      const research = makeTask('research', 'Find papers');
      const gather = makeTask('gather', 'Collect data');
      const analyse = makeTask('analyse', 'Analyse findings', ['research']);
      const process = makeTask('process', 'Process data', ['gather']);
      const report = makeTask('report', 'Write report', ['analyse', 'process']);

      const result = formatTaskPlanTree([report, process, analyse, gather, research]);

      // Level 0: research, gather (parallel)
      expect(result).toContain('Level 0 (parallel):');
      // Level 1: analyse, process (parallel)
      expect(result).toContain('Level 1 (parallel):');
      // Level 2: report
      expect(result).toContain('Level 2:');

      expect(result).toContain('depends on: research');
      expect(result).toContain('depends on: gather');
      expect(result).toContain('depends on: analyse, process');
      expect(result).toContain('Summary: 5 tasks, 3 levels, 0 completed');
    });
  });

  describe('status icon display', () => {
    it('should show ○ for pending tasks', () => {
      const task = makeTask('x');
      const result = formatTaskPlanTree([task]);
      expect(result).toContain('○ pending');
    });

    it('should show ✓ for completed tasks', () => {
      const task = makeTask('x');
      task.setStatus(TaskStatus.RUNNING);
      task.complete({ output: 'ok', agentId: 'a', duration: 1 });
      const result = formatTaskPlanTree([task]);
      expect(result).toContain('✓ completed');
    });

    it('should show ✗ for failed tasks', () => {
      const task = makeTask('x');
      task.setStatus(TaskStatus.RUNNING);
      task.fail(new Error('err'));
      const result = formatTaskPlanTree([task]);
      expect(result).toContain('✗ failed');
    });

    it('should show ⊘ for cancelled tasks', () => {
      const task = makeTask('x');
      task.cancel();
      const result = formatTaskPlanTree([task]);
      expect(result).toContain('⊘ cancelled');
    });
  });
});

// ---------------------------------------------------------------------------
// formatTaskDependencyTree
// ---------------------------------------------------------------------------

describe('formatTaskDependencyTree', () => {
  describe('single task with no dependencies', () => {
    it('should render just the task line', () => {
      const task = makeTask('solo', 'Stand alone');
      const result = formatTaskDependencyTree(task, [task]);
      expect(result).toContain('solo');
      expect(result).toContain('Stand alone');
      expect(result).not.toContain('depends on');
    });
  });

  describe('task with one dependency', () => {
    it('should render the dependency as a child node', () => {
      const a = makeTask('a', 'Parent');
      const b = makeTask('b', 'Child', ['a']);
      const result = formatTaskDependencyTree(b, [a, b]);

      const lines = result.split('\n');
      expect(lines[0]).toContain('b');
      expect(lines[1]).toContain('└── a');
    });
  });

  describe('deep dependency chain', () => {
    it('should render nested tree for A → B → C', () => {
      const a = makeTask('a', 'Root');
      const b = makeTask('b', 'Middle', ['a']);
      const c = makeTask('c', 'Leaf', ['b']);
      const result = formatTaskDependencyTree(c, [a, b, c]);

      expect(result).toContain('c');
      expect(result).toContain('b');
      expect(result).toContain('a');
      // Should have indented tree structure
      const lines = result.split('\n');
      expect(lines.length).toBe(3);
    });
  });

  describe('multiple dependencies (branching)', () => {
    it('should render all direct dependencies', () => {
      const a = makeTask('a');
      const b = makeTask('b');
      const c = makeTask('c', 'Merge task', ['a', 'b']);
      const result = formatTaskDependencyTree(c, [a, b, c]);

      expect(result).toContain('c');
      expect(result).toContain('├── a');
      expect(result).toContain('└── b');
    });
  });

  describe('diamond dependencies', () => {
    it('should not duplicate shared ancestors', () => {
      const base = makeTask('base', 'Base task');
      const left = makeTask('left', 'Left branch', ['base']);
      const right = makeTask('right-branch', 'Right branch', ['base']);
      const merge = makeTask('merge', 'Merge point', ['left', 'right-branch']);
      const allTasks = [base, left, right, merge];
      const result = formatTaskDependencyTree(merge, allTasks);

      // "base" appears in the tree exactly once (visited set prevents repeat traversal)
      const lines = result.split('\n');
      const baseLines = lines.filter((l) => l.includes('base  — Base task'));
      expect(baseLines.length).toBe(1);
    });
  });

  describe('options', () => {
    it('should hide status when showStatus is false', () => {
      const task = makeTask('x');
      const result = formatTaskDependencyTree(task, [task], { showStatus: false });
      expect(result).not.toContain('pending');
    });

    it('should show priority when showPriority is true', () => {
      const task = makeTaskWithPriority('x', TaskPriority.CRITICAL);
      const result = formatTaskDependencyTree(task, [task], { showPriority: true });
      expect(result).toContain('CRITICAL');
    });

    it('should hide descriptions when showDescriptions is false', () => {
      const task = makeTask('x', 'My description');
      const result = formatTaskDependencyTree(task, [task], { showDescriptions: false });
      expect(result).not.toContain('My description');
      expect(result).toContain('x');
    });
  });

  describe('missing dependencies in allTasks', () => {
    it('should skip dependencies not found in the task set', () => {
      const task = makeTask('x', 'Task x', ['unknown-dep']);
      const result = formatTaskDependencyTree(task, [task]);
      // Should not crash, just skip the missing dep
      expect(result).toContain('x');
      const lines = result.split('\n');
      expect(lines.length).toBe(1);
    });
  });
});

// ---------------------------------------------------------------------------
// formatTaskList
// ---------------------------------------------------------------------------

describe('formatTaskList', () => {
  describe('empty input', () => {
    it('should return "(no tasks)" for empty array', () => {
      const result = formatTaskList([]);
      expect(result).toBe('(no tasks)');
    });
  });

  describe('single task', () => {
    it('should render one line with status and description', () => {
      const task = makeTask('research', 'Find papers');
      const result = formatTaskList([task]);
      expect(result).toContain('○ pending');
      expect(result).toContain('research');
      expect(result).toContain('Find papers');
    });
  });

  describe('task with dependencies', () => {
    it('should show arrow notation for dependencies', () => {
      const a = makeTask('a');
      const b = makeTask('b', 'Task b', ['a']);
      const result = formatTaskList([a, b]);

      expect(result).toContain('(← a)');
    });

    it('should list multiple dependencies separated by commas', () => {
      const a = makeTask('a');
      const b = makeTask('b');
      const c = makeTask('c', 'Task c', ['a', 'b']);
      const result = formatTaskList([a, b, c]);

      expect(result).toContain('(← a, b)');
    });

    it('should not show arrow for tasks without dependencies', () => {
      const task = makeTask('a');
      const result = formatTaskList([task]);
      expect(result).not.toContain('←');
    });
  });

  describe('multiple tasks', () => {
    it('should render one line per task', () => {
      const a = makeTask('a');
      const b = makeTask('b');
      const c = makeTask('c');
      const result = formatTaskList([a, b, c]);
      const lines = result.split('\n');
      expect(lines.length).toBe(3);
    });
  });

  describe('status display', () => {
    it('should show completed status', () => {
      const task = makeTask('x');
      task.setStatus(TaskStatus.RUNNING);
      task.complete({ output: 'ok', agentId: 'a', duration: 1 });
      const result = formatTaskList([task]);
      expect(result).toContain('✓ completed');
    });

    it('should show failed status', () => {
      const task = makeTask('x');
      task.setStatus(TaskStatus.RUNNING);
      task.fail(new Error('err'));
      const result = formatTaskList([task]);
      expect(result).toContain('✗ failed');
    });
  });
});

// ---------------------------------------------------------------------------
// Integration: formatTaskPlanTree output structure
// ---------------------------------------------------------------------------

describe('formatTaskPlanTree output structure', () => {
  it('should produce a well-formed multi-line string', () => {
    const a = makeTask('a', 'First');
    const b = makeTask('b', 'Second', ['a']);
    const result = formatTaskPlanTree([a, b]);

    const lines = result.split('\n');
    // Title line
    expect(lines[0]).toBe('Task Plan');
    // Underline
    expect(lines[1]).toBe('=========');
    // Blank line
    expect(lines[2]).toBe('');
    // Levels exist
    expect(lines.some((l) => l.startsWith('Level 0'))).toBe(true);
    expect(lines.some((l) => l.startsWith('Level 1'))).toBe(true);
    // Summary at the end
    expect(lines[lines.length - 1]).toMatch(/^Summary:/);
  });

  it('should match snapshot for a standard plan', () => {
    const a = makeTask('a', 'First task');
    const b = makeTask('b', 'Second task', ['a']);

    const result = formatTaskPlanTree([a, b], {
      showStatus: true,
      showDependencies: true,
      showDescriptions: true,
    });

    expect(result).toContain('Level 0:');
    expect(result).toContain('a  — First task');
    expect(result).toContain('Level 1:');
    expect(result).toContain('b  — Second task');
    expect(result).toContain('depends on: a');
    expect(result).toContain('Summary: 2 tasks, 2 levels, 0 completed');
  });

  it('should combine all options together', () => {
    const a = makeTaskWithPriority('a', TaskPriority.HIGH);
    const b = makeTaskWithPriority('b', TaskPriority.LOW, ['a']);

    const opts: FormatTaskPlanOptions = {
      title: 'Build Plan',
      showStatus: true,
      showPriority: true,
      showDependencies: true,
      showDescriptions: true,
      compact: false,
    };

    const result = formatTaskPlanTree([a, b], opts);
    expect(result).toContain('Build Plan');
    expect(result).toContain('HIGH');
    expect(result).toContain('LOW');
    expect(result).toContain('pending');
    expect(result).toContain('depends on: a');
  });
});
