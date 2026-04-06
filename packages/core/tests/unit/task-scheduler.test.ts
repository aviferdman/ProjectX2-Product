import { describe, it, expect } from 'vitest';

import { Task } from '../../src/task/task.js';
import {
  getExecutionLevels,
  resolveTaskDependencies,
  topologicalSort,
} from '../../src/task/task-scheduler.js';
import type { TopologicalSortResult } from '../../src/task/task-scheduler.js';
import { TaskConfigError } from '../../src/errors/index.js';
import type { TaskConfig } from '../../src/types/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTask(id: string, dependencies?: string[]): Task {
  const config: TaskConfig = {
    id,
    description: `Task ${id}`,
    ...(dependencies && dependencies.length > 0 ? { dependencies } : {}),
  };
  return new Task(config);
}

function ids(tasks: readonly Task[]): string[] {
  return tasks.map((t) => t.id);
}

function levelIds(levels: readonly (readonly Task[])[]): string[][] {
  return levels.map((level) => level.map((t) => t.id));
}

// ---------------------------------------------------------------------------
// topologicalSort
// ---------------------------------------------------------------------------

describe('topologicalSort', () => {
  it('should return empty array for empty input', () => {
    const result = topologicalSort([]);
    expect(result).toEqual([]);
  });

  it('should return single task unchanged', () => {
    const task = makeTask('solo');
    const result = topologicalSort([task]);
    expect(ids(result)).toEqual(['solo']);
  });

  it('should sort independent tasks in deterministic order', () => {
    const c = makeTask('c');
    const a = makeTask('a');
    const b = makeTask('b');
    const result = topologicalSort([c, a, b]);
    // No dependencies → sorted alphabetically for determinism
    expect(ids(result)).toEqual(['a', 'b', 'c']);
  });

  it('should sort a simple linear chain', () => {
    const t1 = makeTask('research');
    const t2 = makeTask('analyse', ['research']);
    const t3 = makeTask('report', ['analyse']);
    // Input in reverse order
    const result = topologicalSort([t3, t2, t1]);
    expect(ids(result)).toEqual(['research', 'analyse', 'report']);
  });

  it('should sort a diamond dependency graph', () => {
    //     A
    //    / \
    //   B   C
    //    \ /
    //     D
    const a = makeTask('a');
    const b = makeTask('b', ['a']);
    const c = makeTask('c', ['a']);
    const d = makeTask('d', ['b', 'c']);
    const result = topologicalSort([d, c, b, a]);
    // a must come first, then b and c (sorted), then d
    expect(ids(result)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('should handle multiple roots and leaves', () => {
    //  A   B
    //  |   |
    //  C   D
    //   \ /
    //    E
    const a = makeTask('a');
    const b = makeTask('b');
    const c = makeTask('c', ['a']);
    const d = makeTask('d', ['b']);
    const e = makeTask('e', ['c', 'd']);
    const result = topologicalSort([e, d, c, b, a]);
    const order = ids(result);
    // a,b must come before c,d; c,d must come before e
    expect(order.indexOf('a')).toBeLessThan(order.indexOf('c'));
    expect(order.indexOf('b')).toBeLessThan(order.indexOf('d'));
    expect(order.indexOf('c')).toBeLessThan(order.indexOf('e'));
    expect(order.indexOf('d')).toBeLessThan(order.indexOf('e'));
  });

  it('should handle a wide fan-out graph', () => {
    //     root
    //   / | | \
    //  a  b  c  d
    const root = makeTask('root');
    const a = makeTask('a', ['root']);
    const b = makeTask('b', ['root']);
    const c = makeTask('c', ['root']);
    const d = makeTask('d', ['root']);
    const result = topologicalSort([d, c, b, a, root]);
    expect(ids(result)[0]).toBe('root');
    expect(ids(result).slice(1).sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('should handle a wide fan-in graph', () => {
    //  a  b  c  d
    //   \ | | /
    //    sink
    const a = makeTask('a');
    const b = makeTask('b');
    const c = makeTask('c');
    const d = makeTask('d');
    const sink = makeTask('sink', ['a', 'b', 'c', 'd']);
    const result = topologicalSort([sink, d, c, b, a]);
    expect(ids(result).slice(0, 4).sort()).toEqual(['a', 'b', 'c', 'd']);
    expect(ids(result)[4]).toBe('sink');
  });

  it('should handle complex multi-level graph', () => {
    // Level 0: a, b
    // Level 1: c (dep a), d (dep a,b)
    // Level 2: e (dep c,d)
    // Level 3: f (dep e)
    const a = makeTask('a');
    const b = makeTask('b');
    const c = makeTask('c', ['a']);
    const d = makeTask('d', ['a', 'b']);
    const e = makeTask('e', ['c', 'd']);
    const f = makeTask('f', ['e']);
    const result = topologicalSort([f, e, d, c, b, a]);
    const order = ids(result);
    // Verify all dependency orderings
    expect(order.indexOf('a')).toBeLessThan(order.indexOf('c'));
    expect(order.indexOf('a')).toBeLessThan(order.indexOf('d'));
    expect(order.indexOf('b')).toBeLessThan(order.indexOf('d'));
    expect(order.indexOf('c')).toBeLessThan(order.indexOf('e'));
    expect(order.indexOf('d')).toBeLessThan(order.indexOf('e'));
    expect(order.indexOf('e')).toBeLessThan(order.indexOf('f'));
  });

  it('should return new array (not same reference as input)', () => {
    const tasks = [makeTask('a'), makeTask('b')];
    const result = topologicalSort(tasks);
    expect(result).not.toBe(tasks);
  });
});

// ---------------------------------------------------------------------------
// getExecutionLevels
// ---------------------------------------------------------------------------

describe('getExecutionLevels', () => {
  it('should return empty array for empty input', () => {
    const result = getExecutionLevels([]);
    expect(result).toEqual([]);
  });

  it('should put all independent tasks in one level', () => {
    const a = makeTask('a');
    const b = makeTask('b');
    const c = makeTask('c');
    const levels = getExecutionLevels([c, b, a]);
    expect(levelIds(levels)).toEqual([['a', 'b', 'c']]);
  });

  it('should create separate levels for a linear chain', () => {
    const t1 = makeTask('t1');
    const t2 = makeTask('t2', ['t1']);
    const t3 = makeTask('t3', ['t2']);
    const levels = getExecutionLevels([t3, t2, t1]);
    expect(levelIds(levels)).toEqual([['t1'], ['t2'], ['t3']]);
  });

  it('should group parallel tasks at the same level (diamond)', () => {
    const a = makeTask('a');
    const b = makeTask('b', ['a']);
    const c = makeTask('c', ['a']);
    const d = makeTask('d', ['b', 'c']);
    const levels = getExecutionLevels([d, c, b, a]);
    expect(levelIds(levels)).toEqual([['a'], ['b', 'c'], ['d']]);
  });

  it('should handle complex graph with correct parallel grouping', () => {
    // Level 0: a, b
    // Level 1: c (dep a), d (dep b)
    // Level 2: e (dep c, d)
    const a = makeTask('a');
    const b = makeTask('b');
    const c = makeTask('c', ['a']);
    const d = makeTask('d', ['b']);
    const e = makeTask('e', ['c', 'd']);
    const levels = getExecutionLevels([e, d, c, b, a]);
    expect(levelIds(levels)).toEqual([['a', 'b'], ['c', 'd'], ['e']]);
  });

  it('should handle mixed-depth branches', () => {
    // a → b → c → d
    //         ↑
    // e ------┘
    const a = makeTask('a');
    const b = makeTask('b', ['a']);
    const e = makeTask('e');
    const c = makeTask('c', ['b', 'e']);
    const d = makeTask('d', ['c']);
    const levels = getExecutionLevels([d, c, e, b, a]);
    expect(levelIds(levels)).toEqual([['a', 'e'], ['b'], ['c'], ['d']]);
  });

  it('should return new arrays (not shared references)', () => {
    const a = makeTask('a');
    const b = makeTask('b', ['a']);
    const levels = getExecutionLevels([b, a]);
    expect(levels[0]).not.toBe(levels[1]);
  });
});

// ---------------------------------------------------------------------------
// resolveTaskDependencies (combined result)
// ---------------------------------------------------------------------------

describe('resolveTaskDependencies', () => {
  it('should return empty result for empty input', () => {
    const result = resolveTaskDependencies([]);
    expect(result.sorted).toEqual([]);
    expect(result.levels).toEqual([]);
  });

  it('should return both sorted and levels consistently', () => {
    const a = makeTask('a');
    const b = makeTask('b', ['a']);
    const c = makeTask('c', ['a']);
    const d = makeTask('d', ['b', 'c']);
    const result = resolveTaskDependencies([d, c, b, a]);

    expect(ids([...result.sorted])).toEqual(['a', 'b', 'c', 'd']);
    expect(levelIds(result.levels)).toEqual([['a'], ['b', 'c'], ['d']]);

    // Verify that levels flatten to sorted order
    const flattenedLevels = result.levels.flat();
    expect(ids(flattenedLevels)).toEqual(ids([...result.sorted]));
  });

  it('should return readonly arrays', () => {
    const a = makeTask('a');
    const result = resolveTaskDependencies([a]);
    // TypeScript prevents mutation, but verify the structure is correct
    expect(Array.isArray(result.sorted)).toBe(true);
    expect(Array.isArray(result.levels)).toBe(true);
    expect(result.sorted.length).toBe(1);
    expect(result.levels.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe('dependency resolution errors', () => {
  it('should throw TaskConfigError for missing dependency', () => {
    const a = makeTask('a', ['nonexistent']);
    expect(() => topologicalSort([a])).toThrow(TaskConfigError);
    expect(() => topologicalSort([a])).toThrow(
      /Dependency "nonexistent" not found/,
    );
  });

  it('should throw TaskConfigError for self-dependency', () => {
    const a = makeTask('a', ['a']);
    expect(() => topologicalSort([a])).toThrow(TaskConfigError);
    expect(() => topologicalSort([a])).toThrow(/depends on itself/);
  });

  it('should throw TaskConfigError for simple circular dependency', () => {
    const a = makeTask('a', ['b']);
    const b = makeTask('b', ['a']);
    expect(() => topologicalSort([a, b])).toThrow(TaskConfigError);
    expect(() => topologicalSort([a, b])).toThrow(/Circular dependency/);
  });

  it('should throw TaskConfigError for three-node cycle', () => {
    const a = makeTask('a', ['c']);
    const b = makeTask('b', ['a']);
    const c = makeTask('c', ['b']);
    expect(() => topologicalSort([a, b, c])).toThrow(TaskConfigError);
    expect(() => topologicalSort([a, b, c])).toThrow(/Circular dependency/);
  });

  it('should include cycle task ids in error message', () => {
    const a = makeTask('a', ['c']);
    const b = makeTask('b', ['a']);
    const c = makeTask('c', ['b']);
    try {
      topologicalSort([a, b, c]);
      expect.fail('Should have thrown');
    } catch (error) {
      const err = error as TaskConfigError;
      expect(err.message).toContain('a');
      expect(err.message).toContain('b');
      expect(err.message).toContain('c');
    }
  });

  it('should throw TaskConfigError for cycle within a larger graph', () => {
    // x is fine, y→z→y is a cycle
    const x = makeTask('x');
    const y = makeTask('y', ['z']);
    const z = makeTask('z', ['y']);
    expect(() => topologicalSort([x, y, z])).toThrow(TaskConfigError);
    expect(() => topologicalSort([x, y, z])).toThrow(/Circular dependency/);
  });

  it('should throw TaskConfigError for duplicate task ids', () => {
    const a1 = makeTask('a');
    const a2 = makeTask('a');
    expect(() => topologicalSort([a1, a2])).toThrow(TaskConfigError);
    expect(() => topologicalSort([a1, a2])).toThrow(/Duplicate task id "a"/);
  });

  it('should throw from getExecutionLevels for circular dependency', () => {
    const a = makeTask('a', ['b']);
    const b = makeTask('b', ['a']);
    expect(() => getExecutionLevels([a, b])).toThrow(TaskConfigError);
    expect(() => getExecutionLevels([a, b])).toThrow(/Circular dependency/);
  });

  it('should throw from resolveTaskDependencies for missing dependency', () => {
    const a = makeTask('a', ['missing']);
    expect(() => resolveTaskDependencies([a])).toThrow(TaskConfigError);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('edge cases', () => {
  it('should handle a single task with no dependencies', () => {
    const solo = makeTask('solo');
    expect(ids(topologicalSort([solo]))).toEqual(['solo']);
    expect(levelIds(getExecutionLevels([solo]))).toEqual([['solo']]);
  });

  it('should handle 100 independent tasks', () => {
    const tasks = Array.from({ length: 100 }, (_, i) =>
      makeTask(`task-${String(i).padStart(3, '0')}`),
    );
    const result = topologicalSort(tasks);
    expect(result.length).toBe(100);
    // All should be in one level
    const levels = getExecutionLevels(tasks);
    expect(levels.length).toBe(1);
    expect(levels[0].length).toBe(100);
  });

  it('should handle a long chain of 50 tasks', () => {
    const tasks: Task[] = [];
    for (let i = 0; i < 50; i++) {
      tasks.push(makeTask(`t${i}`, i > 0 ? [`t${i - 1}`] : []));
    }
    const result = topologicalSort(tasks);
    expect(result.length).toBe(50);
    // Verify ordering
    for (let i = 0; i < 50; i++) {
      expect(result[i].id).toBe(`t${i}`);
    }
    // Each task should be its own level
    const levels = getExecutionLevels(tasks);
    expect(levels.length).toBe(50);
  });

  it('should handle tasks with multiple dependencies in different levels', () => {
    // a → b → c
    //       ↗
    // d ---┘
    const a = makeTask('a');
    const b = makeTask('b', ['a']);
    const d = makeTask('d');
    const c = makeTask('c', ['b', 'd']);
    const result = resolveTaskDependencies([c, d, b, a]);
    // a and d are level 0, b is level 1, c is level 2
    expect(levelIds(result.levels)).toEqual([['a', 'd'], ['b'], ['c']]);
  });

  it('should produce deterministic output regardless of input order', () => {
    const a = makeTask('a');
    const b = makeTask('b');
    const c = makeTask('c', ['a', 'b']);

    const result1 = ids(topologicalSort([a, b, c]));
    const result2 = ids(topologicalSort([c, b, a]));
    const result3 = ids(topologicalSort([b, c, a]));

    expect(result1).toEqual(result2);
    expect(result2).toEqual(result3);
  });

  it('should handle disconnected subgraphs', () => {
    // Subgraph 1: a → b
    // Subgraph 2: x → y
    const a = makeTask('a');
    const b = makeTask('b', ['a']);
    const x = makeTask('x');
    const y = makeTask('y', ['x']);
    const levels = getExecutionLevels([y, b, x, a]);
    // Level 0: a, x; Level 1: b, y
    expect(levelIds(levels)).toEqual([['a', 'x'], ['b', 'y']]);
  });
});
