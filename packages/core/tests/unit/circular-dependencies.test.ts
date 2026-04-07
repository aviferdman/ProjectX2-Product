import { describe, it, expect } from 'vitest';

import { Task } from '../../src/task/task.js';
import { detectCircularDependencies, assertNoCycles } from '../../src/task/task-scheduler.js';
import type { CircularDependencyCheckResult } from '../../src/task/task-scheduler.js';
import { resolveTaskDependencies } from '../../src/task/task-scheduler.js';
import { CircularDependencyError, TaskConfigError } from '../../src/errors/index.js';
import type { DependencyCycle } from '../../src/errors/index.js';
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

/** Extract just the cycle paths as string arrays for easy assertion. */
function cyclePaths(result: CircularDependencyCheckResult): string[][] {
  return result.cycles.map((c) => [...c.path]);
}

// ---------------------------------------------------------------------------
// detectCircularDependencies — no cycles
// ---------------------------------------------------------------------------

describe('detectCircularDependencies — acyclic graphs', () => {
  it('should return no cycles for empty input', () => {
    const result = detectCircularDependencies([]);
    expect(result.hasCycles).toBe(false);
    expect(result.cycles).toEqual([]);
    expect(result.involvedTaskIds).toEqual([]);
  });

  it('should return no cycles for a single task', () => {
    const result = detectCircularDependencies([makeTask('a')]);
    expect(result.hasCycles).toBe(false);
  });

  it('should return no cycles for independent tasks', () => {
    const result = detectCircularDependencies([makeTask('a'), makeTask('b'), makeTask('c')]);
    expect(result.hasCycles).toBe(false);
  });

  it('should return no cycles for a linear chain', () => {
    const result = detectCircularDependencies([
      makeTask('a'),
      makeTask('b', ['a']),
      makeTask('c', ['b']),
    ]);
    expect(result.hasCycles).toBe(false);
  });

  it('should return no cycles for a diamond graph', () => {
    const result = detectCircularDependencies([
      makeTask('a'),
      makeTask('b', ['a']),
      makeTask('c', ['a']),
      makeTask('d', ['b', 'c']),
    ]);
    expect(result.hasCycles).toBe(false);
  });

  it('should return no cycles for a complex acyclic graph', () => {
    const result = detectCircularDependencies([
      makeTask('a'),
      makeTask('b'),
      makeTask('c', ['a']),
      makeTask('d', ['a', 'b']),
      makeTask('e', ['c', 'd']),
      makeTask('f', ['e']),
    ]);
    expect(result.hasCycles).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// detectCircularDependencies — with cycles
// ---------------------------------------------------------------------------

describe('detectCircularDependencies — cycle detection', () => {
  it('should detect a self-dependency', () => {
    const result = detectCircularDependencies([makeTask('a', ['a'])]);
    expect(result.hasCycles).toBe(true);
    expect(result.cycles.length).toBe(1);
    expect(result.cycles[0].path).toEqual(['a', 'a']);
    expect(result.involvedTaskIds).toEqual(['a']);
  });

  it('should detect a simple two-node cycle', () => {
    const result = detectCircularDependencies([makeTask('a', ['b']), makeTask('b', ['a'])]);
    expect(result.hasCycles).toBe(true);
    expect(result.cycles.length).toBe(1);
    expect([...result.involvedTaskIds].sort()).toEqual(['a', 'b']);
    // The cycle path should contain both nodes and close the loop
    const path = result.cycles[0].path;
    expect(path.length).toBe(3);
    expect(path[0]).toBe(path[path.length - 1]); // closes the loop
  });

  it('should detect a three-node cycle', () => {
    const result = detectCircularDependencies([
      makeTask('a', ['b']),
      makeTask('b', ['c']),
      makeTask('c', ['a']),
    ]);
    expect(result.hasCycles).toBe(true);
    expect(result.cycles.length).toBe(1);
    expect([...result.involvedTaskIds].sort()).toEqual(['a', 'b', 'c']);
    const path = result.cycles[0].path;
    expect(path.length).toBe(4);
    expect(path[0]).toBe(path[path.length - 1]);
  });

  it('should detect a cycle within a larger acyclic graph', () => {
    // x is fine (no deps), y→z→y is a cycle
    const result = detectCircularDependencies([
      makeTask('x'),
      makeTask('y', ['z']),
      makeTask('z', ['y']),
    ]);
    expect(result.hasCycles).toBe(true);
    expect([...result.involvedTaskIds].sort()).toEqual(['y', 'z']);
    // x should not be involved
    expect(result.involvedTaskIds).not.toContain('x');
  });

  it('should detect multiple independent cycles', () => {
    // Cycle 1: a → b → a
    // Cycle 2: c → d → c
    const result = detectCircularDependencies([
      makeTask('a', ['b']),
      makeTask('b', ['a']),
      makeTask('c', ['d']),
      makeTask('d', ['c']),
    ]);
    expect(result.hasCycles).toBe(true);
    expect(result.cycles.length).toBe(2);
    expect([...result.involvedTaskIds].sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('should detect cycle with non-cyclic tasks attached', () => {
    // a → b → c → b (cycle: b → c → b), a is non-cyclic lead-in
    const result = detectCircularDependencies([
      makeTask('a'),
      makeTask('b', ['a', 'c']),
      makeTask('c', ['b']),
    ]);
    expect(result.hasCycles).toBe(true);
    expect([...result.involvedTaskIds].sort()).toEqual(['b', 'c']);
  });
});

// ---------------------------------------------------------------------------
// detectCircularDependencies — cycle path structure
// ---------------------------------------------------------------------------

describe('detectCircularDependencies — cycle path structure', () => {
  it('should produce a path where first and last element are the same', () => {
    const result = detectCircularDependencies([
      makeTask('a', ['b']),
      makeTask('b', ['c']),
      makeTask('c', ['a']),
    ]);
    for (const cycle of result.cycles) {
      expect(cycle.path[0]).toBe(cycle.path[cycle.path.length - 1]);
    }
  });

  it('should produce canonical (normalized) cycle paths', () => {
    // Regardless of detection order, cycles should be normalized
    // so the smallest ID comes first
    const result = detectCircularDependencies([
      makeTask('c', ['a']),
      makeTask('a', ['b']),
      makeTask('b', ['c']),
    ]);
    expect(result.hasCycles).toBe(true);
    // The canonical form starts with 'a' (smallest)
    expect(result.cycles[0].path[0]).toBe('a');
  });

  it('should not produce duplicate cycles', () => {
    const result = detectCircularDependencies([makeTask('a', ['b']), makeTask('b', ['a'])]);
    expect(result.cycles.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// detectCircularDependencies — error conditions
// ---------------------------------------------------------------------------

describe('detectCircularDependencies — validation errors', () => {
  it('should throw TaskConfigError for duplicate task ids', () => {
    const a1 = makeTask('a');
    const a2 = makeTask('a');
    expect(() => detectCircularDependencies([a1, a2])).toThrow(TaskConfigError);
    expect(() => detectCircularDependencies([a1, a2])).toThrow(/Duplicate task id "a"/);
  });

  it('should throw TaskConfigError for missing dependency', () => {
    const a = makeTask('a', ['nonexistent']);
    expect(() => detectCircularDependencies([a])).toThrow(TaskConfigError);
    expect(() => detectCircularDependencies([a])).toThrow(/Dependency "nonexistent" not found/);
  });
});

// ---------------------------------------------------------------------------
// assertNoCycles
// ---------------------------------------------------------------------------

describe('assertNoCycles', () => {
  it('should not throw for acyclic graph', () => {
    expect(() =>
      assertNoCycles([makeTask('a'), makeTask('b', ['a']), makeTask('c', ['b'])]),
    ).not.toThrow();
  });

  it('should not throw for empty input', () => {
    expect(() => assertNoCycles([])).not.toThrow();
  });

  it('should throw CircularDependencyError for cyclic graph', () => {
    expect(() => assertNoCycles([makeTask('a', ['b']), makeTask('b', ['a'])])).toThrow(
      CircularDependencyError,
    );
  });

  it('should include cycle paths in the error', () => {
    try {
      assertNoCycles([makeTask('a', ['b']), makeTask('b', ['c']), makeTask('c', ['a'])]);
      expect.fail('Should have thrown');
    } catch (error) {
      const err = error as CircularDependencyError;
      expect(err).toBeInstanceOf(CircularDependencyError);
      expect(err.cycles.length).toBeGreaterThanOrEqual(1);
      expect([...err.involvedTaskIds].sort()).toEqual(['a', 'b', 'c']);
      expect(err.message).toContain('Circular dependency detected');
      expect(err.message).toContain('→');
    }
  });

  it('should throw TaskConfigError for duplicate task ids', () => {
    expect(() => assertNoCycles([makeTask('a'), makeTask('a')])).toThrow(TaskConfigError);
  });
});

// ---------------------------------------------------------------------------
// CircularDependencyError
// ---------------------------------------------------------------------------

describe('CircularDependencyError', () => {
  it('should be an instance of TaskConfigError', () => {
    const err = new CircularDependencyError([{ path: ['a', 'b', 'a'] }]);
    expect(err).toBeInstanceOf(TaskConfigError);
    expect(err).toBeInstanceOf(Error);
  });

  it('should have name "CircularDependencyError"', () => {
    const err = new CircularDependencyError([{ path: ['a', 'b', 'a'] }]);
    expect(err.name).toBe('CircularDependencyError');
  });

  it('should format single cycle message', () => {
    const err = new CircularDependencyError([{ path: ['a', 'b', 'c', 'a'] }]);
    expect(err.message).toBe('Circular dependency detected: a → b → c → a');
  });

  it('should format multiple cycles message', () => {
    const err = new CircularDependencyError([{ path: ['a', 'b', 'a'] }, { path: ['c', 'd', 'c'] }]);
    expect(err.message).toContain('Circular dependencies detected:');
    expect(err.message).toContain('a → b → a');
    expect(err.message).toContain('c → d → c');
  });

  it('should provide involved task IDs sorted', () => {
    const err = new CircularDependencyError([{ path: ['c', 'b', 'a', 'c'] }]);
    expect(err.involvedTaskIds).toEqual(['a', 'b', 'c']);
  });

  it('should store cycles as provided', () => {
    const cycles: DependencyCycle[] = [{ path: ['x', 'y', 'x'] }];
    const err = new CircularDependencyError(cycles);
    expect(err.cycles).toEqual(cycles);
  });
});

// ---------------------------------------------------------------------------
// Integration: resolveTaskDependencies with CircularDependencyError
// ---------------------------------------------------------------------------

describe('resolveTaskDependencies — CircularDependencyError integration', () => {
  it('should throw CircularDependencyError for simple cycle', () => {
    const a = makeTask('a', ['b']);
    const b = makeTask('b', ['a']);
    expect(() => resolveTaskDependencies([a, b])).toThrow(CircularDependencyError);
  });

  it('should throw CircularDependencyError for three-node cycle', () => {
    const a = makeTask('a', ['c']);
    const b = makeTask('b', ['a']);
    const c = makeTask('c', ['b']);
    expect(() => resolveTaskDependencies([a, b, c])).toThrow(CircularDependencyError);
  });

  it('should throw CircularDependencyError with cycle path info', () => {
    const a = makeTask('a', ['b']);
    const b = makeTask('b', ['a']);
    try {
      resolveTaskDependencies([a, b]);
      expect.fail('Should have thrown');
    } catch (error) {
      const err = error as CircularDependencyError;
      expect(err.cycles.length).toBeGreaterThanOrEqual(1);
      expect([...err.involvedTaskIds].sort()).toEqual(['a', 'b']);
      expect(err.message).toContain('→');
    }
  });

  it('should throw CircularDependencyError for cycle within larger graph', () => {
    // x is fine, y→z→y is a cycle
    const x = makeTask('x');
    const y = makeTask('y', ['z']);
    const z = makeTask('z', ['y']);
    try {
      resolveTaskDependencies([x, y, z]);
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(CircularDependencyError);
      const err = error as CircularDependencyError;
      expect(err.involvedTaskIds).not.toContain('x');
      expect([...err.involvedTaskIds].sort()).toEqual(['y', 'z']);
    }
  });

  it('should still throw TaskConfigError (not CircularDependencyError) for duplicates', () => {
    const a1 = makeTask('a');
    const a2 = makeTask('a');
    try {
      resolveTaskDependencies([a1, a2]);
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(TaskConfigError);
      expect(error).not.toBeInstanceOf(CircularDependencyError);
    }
  });

  it('should still throw TaskConfigError for missing dependencies', () => {
    const a = makeTask('a', ['missing']);
    try {
      resolveTaskDependencies([a]);
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(TaskConfigError);
      expect(error).not.toBeInstanceOf(CircularDependencyError);
    }
  });
});

// ---------------------------------------------------------------------------
// Edge cases and scale
// ---------------------------------------------------------------------------

describe('detectCircularDependencies — edge cases', () => {
  it('should handle self-dependency correctly', () => {
    const result = detectCircularDependencies([makeTask('loop', ['loop'])]);
    expect(result.hasCycles).toBe(true);
    expect(result.involvedTaskIds).toEqual(['loop']);
  });

  it('should handle a large cyclic chain', () => {
    // Create a cycle: t0 → t1 → t2 → ... → t19 → t0
    const tasks: Task[] = [];
    for (let i = 0; i < 20; i++) {
      const depId = `t${(i + 1) % 20}`;
      tasks.push(makeTask(`t${i}`, [depId]));
    }
    const result = detectCircularDependencies(tasks);
    expect(result.hasCycles).toBe(true);
    expect(result.involvedTaskIds.length).toBe(20);
  });

  it('should handle 100 acyclic tasks efficiently', () => {
    const tasks: Task[] = [];
    for (let i = 0; i < 100; i++) {
      tasks.push(
        makeTask(
          `t${String(i).padStart(3, '0')}`,
          i > 0 ? [`t${String(i - 1).padStart(3, '0')}`] : [],
        ),
      );
    }
    const result = detectCircularDependencies(tasks);
    expect(result.hasCycles).toBe(false);
  });

  it('should handle disconnected subgraphs with one cycle', () => {
    // Acyclic: a → b → c
    // Cyclic: x → y → x
    const result = detectCircularDependencies([
      makeTask('a'),
      makeTask('b', ['a']),
      makeTask('c', ['b']),
      makeTask('x', ['y']),
      makeTask('y', ['x']),
    ]);
    expect(result.hasCycles).toBe(true);
    expect([...result.involvedTaskIds].sort()).toEqual(['x', 'y']);
  });
});
