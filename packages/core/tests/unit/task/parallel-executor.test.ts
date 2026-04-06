/**
 * Unit tests for the parallel executor module.
 *
 * Tests cover:
 * - topologicalSort(): ordering, cycles, missing deps, self-deps, duplicates
 * - getExecutionLevels(): wave grouping, complex DAGs, edge cases
 * - ParallelExecutor: concurrency, error policies, cancellation, context passing, events
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Task } from '../../../src/task/task.js';
import {
  topologicalSort,
  getExecutionLevels,
  ParallelExecutor,
} from '../../../src/task/parallel-executor.js';
import { TaskConfigError, TaskExecutionError } from '../../../src/errors/index.js';
import type { TaskRunner, ParallelExecutionResult } from '../../../src/task/parallel-executor.js';
import type { TaskResult } from '../../../src/types/task.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTask(id: string, deps: string[] = []): Task {
  return new Task({
    id,
    description: `Task ${id}`,
    dependencies: deps,
  });
}

function makeResult(taskId: string, output: string = `result-${taskId}`): TaskResult {
  return {
    output,
    agentId: 'test-agent',
    duration: 10,
  };
}

function immediateRunner(delayMs = 0): TaskRunner {
  return async (task) => {
    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
    return makeResult(task.id);
  };
}

// ---------------------------------------------------------------------------
// topologicalSort
// ---------------------------------------------------------------------------

describe('topologicalSort', () => {
  it('should return empty array for empty input', () => {
    expect(topologicalSort([])).toEqual([]);
  });

  it('should return a single task unchanged', () => {
    const task = makeTask('a');
    const sorted = topologicalSort([task]);
    expect(sorted).toEqual([task]);
  });

  it('should sort two tasks with a dependency', () => {
    const a = makeTask('a');
    const b = makeTask('b', ['a']);
    const sorted = topologicalSort([b, a]);
    const ids = sorted.map((t) => t.id);
    expect(ids.indexOf('a')).toBeLessThan(ids.indexOf('b'));
  });

  it('should sort a linear chain correctly', () => {
    const a = makeTask('a');
    const b = makeTask('b', ['a']);
    const c = makeTask('c', ['b']);
    const d = makeTask('d', ['c']);
    const sorted = topologicalSort([d, b, c, a]);
    const ids = sorted.map((t) => t.id);
    expect(ids).toEqual(['a', 'b', 'c', 'd']);
  });

  it('should handle independent tasks in any valid order', () => {
    const a = makeTask('a');
    const b = makeTask('b');
    const c = makeTask('c');
    const sorted = topologicalSort([a, b, c]);
    expect(sorted).toHaveLength(3);
    expect(new Set(sorted.map((t) => t.id))).toEqual(new Set(['a', 'b', 'c']));
  });

  it('should handle diamond dependency pattern', () => {
    //   a
    //  / \
    // b   c
    //  \ /
    //   d
    const a = makeTask('a');
    const b = makeTask('b', ['a']);
    const c = makeTask('c', ['a']);
    const d = makeTask('d', ['b', 'c']);
    const sorted = topologicalSort([d, c, b, a]);
    const ids = sorted.map((t) => t.id);

    expect(ids.indexOf('a')).toBeLessThan(ids.indexOf('b'));
    expect(ids.indexOf('a')).toBeLessThan(ids.indexOf('c'));
    expect(ids.indexOf('b')).toBeLessThan(ids.indexOf('d'));
    expect(ids.indexOf('c')).toBeLessThan(ids.indexOf('d'));
  });

  it('should throw on circular dependency', () => {
    const a = makeTask('a', ['b']);
    const b = makeTask('b', ['a']);
    expect(() => topologicalSort([a, b])).toThrow(TaskConfigError);
    expect(() => topologicalSort([a, b])).toThrow('Circular dependency');
  });

  it('should throw on self-dependency', () => {
    const a = makeTask('a', ['a']);
    expect(() => topologicalSort([a])).toThrow(TaskConfigError);
    expect(() => topologicalSort([a])).toThrow('cannot depend on itself');
  });

  it('should throw on unknown dependency', () => {
    const a = makeTask('a', ['nonexistent']);
    expect(() => topologicalSort([a])).toThrow(TaskConfigError);
    expect(() => topologicalSort([a])).toThrow('unknown task');
  });

  it('should throw on duplicate task IDs', () => {
    const a1 = makeTask('a');
    const a2 = makeTask('a');
    expect(() => topologicalSort([a1, a2])).toThrow(TaskConfigError);
    expect(() => topologicalSort([a1, a2])).toThrow('Duplicate task id');
  });

  it('should detect three-node circular dependency', () => {
    const a = makeTask('a', ['c']);
    const b = makeTask('b', ['a']);
    const c = makeTask('c', ['b']);
    expect(() => topologicalSort([a, b, c])).toThrow('Circular dependency');
  });

  it('should handle a complex DAG with multiple roots', () => {
    //  a   b
    //  |\ /|
    //  | X |
    //  |/ \|
    //  c   d
    //   \ /
    //    e
    const a = makeTask('a');
    const b = makeTask('b');
    const c = makeTask('c', ['a', 'b']);
    const d = makeTask('d', ['a', 'b']);
    const e = makeTask('e', ['c', 'd']);
    const sorted = topologicalSort([e, d, c, b, a]);
    const ids = sorted.map((t) => t.id);

    // a and b before c and d
    expect(ids.indexOf('a')).toBeLessThan(ids.indexOf('c'));
    expect(ids.indexOf('a')).toBeLessThan(ids.indexOf('d'));
    expect(ids.indexOf('b')).toBeLessThan(ids.indexOf('c'));
    expect(ids.indexOf('b')).toBeLessThan(ids.indexOf('d'));
    // c and d before e
    expect(ids.indexOf('c')).toBeLessThan(ids.indexOf('e'));
    expect(ids.indexOf('d')).toBeLessThan(ids.indexOf('e'));
  });
});

// ---------------------------------------------------------------------------
// getExecutionLevels
// ---------------------------------------------------------------------------

describe('getExecutionLevels', () => {
  it('should return empty array for empty input', () => {
    expect(getExecutionLevels([])).toEqual([]);
  });

  it('should put a single task at level 0', () => {
    const levels = getExecutionLevels([makeTask('a')]);
    expect(levels).toEqual([{ level: 0, taskIds: ['a'] }]);
  });

  it('should put all independent tasks at level 0', () => {
    const levels = getExecutionLevels([makeTask('a'), makeTask('b'), makeTask('c')]);
    expect(levels).toHaveLength(1);
    expect(levels[0].level).toBe(0);
    expect(new Set(levels[0].taskIds)).toEqual(new Set(['a', 'b', 'c']));
  });

  it('should order a linear chain into sequential levels', () => {
    const a = makeTask('a');
    const b = makeTask('b', ['a']);
    const c = makeTask('c', ['b']);
    const levels = getExecutionLevels([c, b, a]);

    expect(levels).toHaveLength(3);
    expect(levels[0]).toEqual({ level: 0, taskIds: ['a'] });
    expect(levels[1]).toEqual({ level: 1, taskIds: ['b'] });
    expect(levels[2]).toEqual({ level: 2, taskIds: ['c'] });
  });

  it('should group independent branches at the same level', () => {
    //   a
    //  / \
    // b   c
    const a = makeTask('a');
    const b = makeTask('b', ['a']);
    const c = makeTask('c', ['a']);
    const levels = getExecutionLevels([c, b, a]);

    expect(levels).toHaveLength(2);
    expect(levels[0]).toEqual({ level: 0, taskIds: ['a'] });
    expect(new Set(levels[1].taskIds)).toEqual(new Set(['b', 'c']));
  });

  it('should handle diamond pattern', () => {
    const a = makeTask('a');
    const b = makeTask('b', ['a']);
    const c = makeTask('c', ['a']);
    const d = makeTask('d', ['b', 'c']);
    const levels = getExecutionLevels([d, c, b, a]);

    expect(levels).toHaveLength(3);
    expect(levels[0].taskIds).toEqual(['a']);
    expect(new Set(levels[1].taskIds)).toEqual(new Set(['b', 'c']));
    expect(levels[2].taskIds).toEqual(['d']);
  });

  it('should handle multiple root tasks with merging', () => {
    const a = makeTask('a');
    const b = makeTask('b');
    const c = makeTask('c', ['a']);
    const d = makeTask('d', ['a', 'b']);
    const levels = getExecutionLevels([d, c, b, a]);

    expect(levels).toHaveLength(2);
    expect(new Set(levels[0].taskIds)).toEqual(new Set(['a', 'b']));
    expect(new Set(levels[1].taskIds)).toEqual(new Set(['c', 'd']));
  });

  it('should throw on circular dependency', () => {
    const a = makeTask('a', ['b']);
    const b = makeTask('b', ['a']);
    expect(() => getExecutionLevels([a, b])).toThrow('Circular dependency');
  });

  it('should throw on self-dependency', () => {
    const a = makeTask('a', ['a']);
    expect(() => getExecutionLevels([a])).toThrow('cannot depend on itself');
  });

  it('should throw on unknown dependency', () => {
    const a = makeTask('a', ['x']);
    expect(() => getExecutionLevels([a])).toThrow('unknown task');
  });

  it('should throw on duplicate task IDs', () => {
    expect(() => getExecutionLevels([makeTask('a'), makeTask('a')])).toThrow('Duplicate task id');
  });

  it('should handle a wide DAG with varying depth', () => {
    // a, b are roots
    // c depends on a
    // d depends on c
    // e depends on b
    const a = makeTask('a');
    const b = makeTask('b');
    const c = makeTask('c', ['a']);
    const d = makeTask('d', ['c']);
    const e = makeTask('e', ['b']);

    const levels = getExecutionLevels([e, d, c, b, a]);
    expect(levels).toHaveLength(3);
    expect(new Set(levels[0].taskIds)).toEqual(new Set(['a', 'b']));
    expect(new Set(levels[1].taskIds)).toEqual(new Set(['c', 'e']));
    expect(levels[2].taskIds).toEqual(['d']);
  });
});

// ---------------------------------------------------------------------------
// ParallelExecutor — construction
// ---------------------------------------------------------------------------

describe('ParallelExecutor', () => {
  describe('construction', () => {
    it('should create with default config', () => {
      const executor = new ParallelExecutor();
      expect(executor.maxConcurrency).toBe(10);
      expect(executor.errorPolicy).toBe('fail-fast');
      expect(executor.running).toBe(false);
      expect(executor.cancelled).toBe(false);
    });

    it('should accept custom config', () => {
      const executor = new ParallelExecutor({
        maxConcurrency: 3,
        errorPolicy: 'continue',
      });
      expect(executor.maxConcurrency).toBe(3);
      expect(executor.errorPolicy).toBe('continue');
    });

    it('should throw on invalid maxConcurrency (zero)', () => {
      expect(() => new ParallelExecutor({ maxConcurrency: 0 })).toThrow(TaskConfigError);
    });

    it('should throw on invalid maxConcurrency (negative)', () => {
      expect(() => new ParallelExecutor({ maxConcurrency: -1 })).toThrow(TaskConfigError);
    });

    it('should throw on maxConcurrency exceeding upper bound', () => {
      expect(() => new ParallelExecutor({ maxConcurrency: 101 })).toThrow(TaskConfigError);
    });

    it('should throw on non-integer maxConcurrency', () => {
      expect(() => new ParallelExecutor({ maxConcurrency: 2.5 })).toThrow(TaskConfigError);
    });
  });

  // -------------------------------------------------------------------------
  // execute — basic scenarios
  // -------------------------------------------------------------------------

  describe('execute — basic', () => {
    it('should return empty result for empty task array', async () => {
      const executor = new ParallelExecutor();
      const result = await executor.execute([], immediateRunner());
      expect(result.success).toBe(true);
      expect(result.results.size).toBe(0);
      expect(result.errors.size).toBe(0);
      expect(result.levels).toEqual([]);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should execute a single task', async () => {
      const executor = new ParallelExecutor();
      const task = makeTask('a');
      const result = await executor.execute([task], immediateRunner());

      expect(result.success).toBe(true);
      expect(result.results.size).toBe(1);
      expect(result.results.get('a')?.output).toBe('result-a');
    });

    it('should execute independent tasks in parallel', async () => {
      const executor = new ParallelExecutor();
      const tasks = [makeTask('a'), makeTask('b'), makeTask('c')];
      const result = await executor.execute(tasks, immediateRunner());

      expect(result.success).toBe(true);
      expect(result.results.size).toBe(3);
      expect(result.levels).toHaveLength(1);
    });

    it('should execute dependent tasks in correct order', async () => {
      const executor = new ParallelExecutor();
      const executionOrder: string[] = [];
      const runner: TaskRunner = async (task) => {
        executionOrder.push(task.id);
        return makeResult(task.id);
      };

      const a = makeTask('a');
      const b = makeTask('b', ['a']);
      const c = makeTask('c', ['b']);

      await executor.execute([c, b, a], runner);
      expect(executionOrder).toEqual(['a', 'b', 'c']);
    });

    it('should execute diamond dependency correctly', async () => {
      const executor = new ParallelExecutor();
      const executionOrder: string[] = [];
      const runner: TaskRunner = async (task) => {
        executionOrder.push(task.id);
        return makeResult(task.id);
      };

      const a = makeTask('a');
      const b = makeTask('b', ['a']);
      const c = makeTask('c', ['a']);
      const d = makeTask('d', ['b', 'c']);

      const result = await executor.execute([d, c, b, a], runner);
      expect(result.success).toBe(true);
      expect(executionOrder.indexOf('a')).toBe(0);
      expect(executionOrder.indexOf('d')).toBe(3);
    });

    it('should prevent concurrent calls', async () => {
      const executor = new ParallelExecutor();
      const slowRunner: TaskRunner = async (task) => {
        await new Promise((r) => setTimeout(r, 50));
        return makeResult(task.id);
      };

      const promise1 = executor.execute([makeTask('a')], slowRunner);
      await expect(executor.execute([makeTask('b')], slowRunner)).rejects.toThrow(
        'already running',
      );
      await promise1;
    });

    it('should allow sequential runs after completion', async () => {
      const executor = new ParallelExecutor();
      const result1 = await executor.execute([makeTask('a')], immediateRunner());
      expect(result1.success).toBe(true);

      const result2 = await executor.execute([makeTask('b')], immediateRunner());
      expect(result2.success).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // execute — context passing
  // -------------------------------------------------------------------------

  describe('execute — context passing', () => {
    it('should pass dependency results as context to dependent tasks', async () => {
      const executor = new ParallelExecutor();
      const receivedContexts: Record<string, Record<string, TaskResult>> = {};

      const runner: TaskRunner = async (task, context) => {
        receivedContexts[task.id] = { ...context };
        return makeResult(task.id);
      };

      const a = makeTask('a');
      const b = makeTask('b', ['a']);
      await executor.execute([b, a], runner);

      expect(receivedContexts['a']).toEqual({});
      expect(receivedContexts['b']).toBeDefined();
      expect(receivedContexts['b']['a']?.output).toBe('result-a');
    });

    it('should pass multiple dependency results', async () => {
      const executor = new ParallelExecutor();
      const receivedContexts: Record<string, Record<string, TaskResult>> = {};

      const runner: TaskRunner = async (task, context) => {
        receivedContexts[task.id] = { ...context };
        return makeResult(task.id);
      };

      const a = makeTask('a');
      const b = makeTask('b');
      const c = makeTask('c', ['a', 'b']);
      await executor.execute([c, b, a], runner);

      expect(Object.keys(receivedContexts['c'])).toHaveLength(2);
      expect(receivedContexts['c']['a']?.output).toBe('result-a');
      expect(receivedContexts['c']['b']?.output).toBe('result-b');
    });

    it('should pass empty context to root tasks', async () => {
      const executor = new ParallelExecutor();
      let rootContext: Record<string, TaskResult> | undefined;

      const runner: TaskRunner = async (task, context) => {
        if (task.id === 'root') {
          rootContext = { ...context };
        }
        return makeResult(task.id);
      };

      await executor.execute([makeTask('root')], runner);
      expect(rootContext).toEqual({});
    });
  });

  // -------------------------------------------------------------------------
  // execute — concurrency
  // -------------------------------------------------------------------------

  describe('execute — concurrency', () => {
    it('should respect maxConcurrency limit', async () => {
      const executor = new ParallelExecutor({ maxConcurrency: 2 });
      let maxConcurrent = 0;
      let currentConcurrent = 0;

      const runner: TaskRunner = async (task) => {
        currentConcurrent++;
        maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
        await new Promise((r) => setTimeout(r, 20));
        currentConcurrent--;
        return makeResult(task.id);
      };

      const tasks = [makeTask('a'), makeTask('b'), makeTask('c'), makeTask('d')];
      await executor.execute(tasks, runner);

      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });

    it('should run all independent tasks when concurrency is high', async () => {
      const executor = new ParallelExecutor({ maxConcurrency: 100 });
      let maxConcurrent = 0;
      let currentConcurrent = 0;

      const runner: TaskRunner = async (task) => {
        currentConcurrent++;
        maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
        await new Promise((r) => setTimeout(r, 20));
        currentConcurrent--;
        return makeResult(task.id);
      };

      const tasks = [makeTask('a'), makeTask('b'), makeTask('c')];
      await executor.execute(tasks, runner);

      expect(maxConcurrent).toBe(3);
    });
  });

  // -------------------------------------------------------------------------
  // execute — error handling
  // -------------------------------------------------------------------------

  describe('execute — error handling (fail-fast)', () => {
    it('should stop on first error with fail-fast policy', async () => {
      const executor = new ParallelExecutor({
        errorPolicy: 'fail-fast',
        maxConcurrency: 1,
      });
      const executed: string[] = [];

      const runner: TaskRunner = async (task) => {
        executed.push(task.id);
        if (task.id === 'a') {
          throw new Error('Task A failed');
        }
        return makeResult(task.id);
      };

      await expect(
        executor.execute([makeTask('a'), makeTask('b'), makeTask('c')], runner),
      ).rejects.toThrow(TaskExecutionError);
    });

    it('should include error in result before throwing', async () => {
      const executor = new ParallelExecutor({ errorPolicy: 'fail-fast' });
      const completionResult = vi.fn<[ParallelExecutionResult], void>();
      executor.on('run:complete', completionResult);

      const runner: TaskRunner = async (task) => {
        if (task.id === 'a') throw new Error('fail');
        return makeResult(task.id);
      };

      try {
        await executor.execute([makeTask('a')], runner);
      } catch {
        // expected
      }

      expect(completionResult).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });

  describe('execute — error handling (continue)', () => {
    it('should continue executing after errors', async () => {
      const executor = new ParallelExecutor({ errorPolicy: 'continue' });
      const executed: string[] = [];

      const runner: TaskRunner = async (task) => {
        executed.push(task.id);
        if (task.id === 'fail-me') {
          throw new Error('Task failed');
        }
        return makeResult(task.id);
      };

      const result = await executor.execute(
        [makeTask('ok-1'), makeTask('fail-me'), makeTask('ok-2')],
        runner,
      );

      expect(result.success).toBe(false);
      expect(result.results.size).toBe(2);
      expect(result.errors.size).toBe(1);
      expect(result.errors.has('fail-me')).toBe(true);
      expect(executed).toContain('ok-1');
      expect(executed).toContain('ok-2');
    });

    it('should skip tasks with failed dependencies', async () => {
      const executor = new ParallelExecutor({ errorPolicy: 'continue' });
      const executed: string[] = [];

      const runner: TaskRunner = async (task) => {
        executed.push(task.id);
        if (task.id === 'a') throw new Error('fail');
        return makeResult(task.id);
      };

      const a = makeTask('a');
      const b = makeTask('b', ['a']);
      const c = makeTask('c');

      const result = await executor.execute([a, b, c], runner);

      expect(result.success).toBe(false);
      expect(result.errors.size).toBe(2); // a failed, b skipped
      expect(result.results.has('c')).toBe(true);
      expect(executed).not.toContain('b'); // b should be skipped, not executed
    });

    it('should cascade dependency failures', async () => {
      const executor = new ParallelExecutor({ errorPolicy: 'continue' });

      const runner: TaskRunner = async (task) => {
        if (task.id === 'a') throw new Error('root failure');
        return makeResult(task.id);
      };

      const a = makeTask('a');
      const b = makeTask('b', ['a']);
      const c = makeTask('c', ['b']);

      const result = await executor.execute([a, b, c], runner);

      expect(result.errors.size).toBe(3);
      expect(result.errors.has('a')).toBe(true);
      expect(result.errors.has('b')).toBe(true);
      expect(result.errors.has('c')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // execute — cancellation
  // -------------------------------------------------------------------------

  describe('execute — cancellation', () => {
    it('should support cancellation', async () => {
      const executor = new ParallelExecutor({ errorPolicy: 'continue' });
      const executed: string[] = [];

      const runner: TaskRunner = async (task) => {
        executed.push(task.id);
        if (task.id === 'a') {
          executor.cancel();
        }
        await new Promise((r) => setTimeout(r, 10));
        return makeResult(task.id);
      };

      const a = makeTask('a');
      const b = makeTask('b', ['a']);
      const c = makeTask('c', ['a']);

      const result = await executor.execute([a, b, c], runner);
      expect(result.success).toBe(false);
      expect(executor.cancelled).toBe(true);
    });

    it('should not cancel when not running', () => {
      const executor = new ParallelExecutor();
      executor.cancel(); // should be a no-op
      expect(executor.cancelled).toBe(false);
    });

    it('should reset cancelled state on new run', async () => {
      const executor = new ParallelExecutor({ errorPolicy: 'continue' });
      let callCount = 0;

      const cancelRunner: TaskRunner = async (task) => {
        callCount++;
        if (callCount === 1) executor.cancel();
        return makeResult(task.id);
      };

      await executor.execute([makeTask('a'), makeTask('b', ['a'])], cancelRunner);

      // Run again — should work
      const result = await executor.execute([makeTask('x')], immediateRunner());
      expect(result.success).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // execute — events
  // -------------------------------------------------------------------------

  describe('execute — events', () => {
    let executor: ParallelExecutor;

    beforeEach(() => {
      executor = new ParallelExecutor({ errorPolicy: 'continue' });
    });

    it('should emit level:start and level:complete events', async () => {
      const levelStarts: number[] = [];
      const levelCompletes: number[] = [];

      executor.on('level:start', (level) => levelStarts.push(level));
      executor.on('level:complete', (level) => levelCompletes.push(level));

      const a = makeTask('a');
      const b = makeTask('b', ['a']);
      await executor.execute([a, b], immediateRunner());

      expect(levelStarts).toEqual([0, 1]);
      expect(levelCompletes).toEqual([0, 1]);
    });

    it('should emit task:start and task:complete events', async () => {
      const starts: string[] = [];
      const completes: string[] = [];

      executor.on('task:start', (id) => starts.push(id));
      executor.on('task:complete', (id) => completes.push(id));

      await executor.execute([makeTask('a'), makeTask('b')], immediateRunner());

      expect(new Set(starts)).toEqual(new Set(['a', 'b']));
      expect(new Set(completes)).toEqual(new Set(['a', 'b']));
    });

    it('should emit task:error on failure', async () => {
      const errors: string[] = [];
      executor.on('task:error', (id) => errors.push(id));

      const runner: TaskRunner = async (task) => {
        if (task.id === 'bad') throw new Error('fail');
        return makeResult(task.id);
      };

      await executor.execute([makeTask('bad'), makeTask('good')], runner);
      expect(errors).toContain('bad');
    });

    it('should emit task:skipped when dependency failed', async () => {
      const skipped: Array<{ id: string; reason: string }> = [];
      executor.on('task:skipped', (id, reason) => skipped.push({ id, reason }));

      const runner: TaskRunner = async (task) => {
        if (task.id === 'a') throw new Error('fail');
        return makeResult(task.id);
      };

      const a = makeTask('a');
      const b = makeTask('b', ['a']);
      await executor.execute([a, b], runner);

      expect(skipped).toHaveLength(1);
      expect(skipped[0].id).toBe('b');
      expect(skipped[0].reason).toContain('a');
    });

    it('should emit run:complete event', async () => {
      const completeFn = vi.fn<[ParallelExecutionResult], void>();
      executor.on('run:complete', completeFn);

      await executor.execute([makeTask('a')], immediateRunner());
      expect(completeFn).toHaveBeenCalledOnce();
      expect(completeFn).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should emit run:cancelled event on cancellation', async () => {
      const cancelFn = vi.fn();
      executor.on('run:cancelled', cancelFn);

      const runner: TaskRunner = async (task) => {
        executor.cancel();
        return makeResult(task.id);
      };

      const a = makeTask('a');
      const b = makeTask('b', ['a']);
      await executor.execute([a, b], runner);

      expect(cancelFn).toHaveBeenCalled();
    });

    it('should support off to unsubscribe', async () => {
      const fn = vi.fn();
      executor.on('task:start', fn);
      executor.off('task:start', fn);

      await executor.execute([makeTask('a')], immediateRunner());
      expect(fn).not.toHaveBeenCalled();
    });

    it('should support once for one-time listeners', async () => {
      const fn = vi.fn();
      executor.once('task:start', fn);

      await executor.execute([makeTask('a'), makeTask('b')], immediateRunner());
      expect(fn).toHaveBeenCalledOnce();
    });
  });

  // -------------------------------------------------------------------------
  // execute — validation
  // -------------------------------------------------------------------------

  describe('execute — validation', () => {
    it('should propagate circular dependency errors', async () => {
      const executor = new ParallelExecutor();
      const a = makeTask('a', ['b']);
      const b = makeTask('b', ['a']);
      await expect(executor.execute([a, b], immediateRunner())).rejects.toThrow(
        'Circular dependency',
      );
    });

    it('should propagate unknown dependency errors', async () => {
      const executor = new ParallelExecutor();
      const a = makeTask('a', ['missing']);
      await expect(executor.execute([a], immediateRunner())).rejects.toThrow('unknown task');
    });

    it('should reset running state after validation error', async () => {
      const executor = new ParallelExecutor();
      const a = makeTask('a', ['b']);
      const b = makeTask('b', ['a']);

      try {
        await executor.execute([a, b], immediateRunner());
      } catch {
        // expected
      }

      expect(executor.running).toBe(false);
      // Should be able to run again
      const result = await executor.execute([makeTask('c')], immediateRunner());
      expect(result.success).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // execute — duration tracking
  // -------------------------------------------------------------------------

  describe('execute — duration', () => {
    it('should track execution duration', async () => {
      const executor = new ParallelExecutor();
      const result = await executor.execute([makeTask('a')], immediateRunner(10));
      expect(result.duration).toBeGreaterThanOrEqual(5);
    });

    it('should report zero duration for empty tasks', async () => {
      const executor = new ParallelExecutor();
      const result = await executor.execute([], immediateRunner());
      expect(result.duration).toBe(0);
    });
  });
});
