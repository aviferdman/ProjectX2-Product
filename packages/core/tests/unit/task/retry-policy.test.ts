/**
 * Unit tests for per-task configurable retry policies (TASK-070).
 *
 * Tests cover:
 * - RetryPolicy type on TaskConfig and Task class
 * - Per-task retry policy overrides in TaskExecutionWrapper
 * - Fallback to wrapper defaults when no per-task policy
 * - Validation of RetryPolicy fields
 * - Per-task isRetryable predicate
 * - Per-task backoff/jitter/delay configuration
 */

import { describe, it, expect, vi } from 'vitest';
import { Task } from '../../../src/task/task.js';
import { TaskExecutionWrapper } from '../../../src/task/task-execution-wrapper.js';
import { TaskExecutionError } from '../../../src/errors/index.js';
import type { TaskRunner } from '../../../src/task/parallel-executor.js';
import type { TaskResult } from '../../../src/types/task.js';
import type { RetryPolicy } from '../../../src/types/task.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResult(taskId: string, output = `result-${taskId}`): TaskResult {
  return { output, agentId: 'test-agent', duration: 10 };
}

function immediateRunner(): TaskRunner {
  return async (task) => makeResult(task.id);
}

function failingRunner(errorMsg: string): TaskRunner {
  return async (task) => {
    throw new Error(`${errorMsg}: ${task.id}`);
  };
}

function failThenSucceedRunner(failCount: number): TaskRunner {
  let calls = 0;
  return async (task) => {
    calls++;
    if (calls <= failCount) {
      throw new Error(`Attempt ${String(calls)} failed for ${task.id}`);
    }
    return makeResult(task.id, `success-on-attempt-${String(calls)}`);
  };
}

const noSleep = async (_ms: number): Promise<void> => {};
const fixedRandom = () => 0.5;

// ---------------------------------------------------------------------------
// Task class — retryPolicy property
// ---------------------------------------------------------------------------

describe('Task — retryPolicy property', () => {
  it('should be undefined when not specified', () => {
    const task = new Task({ id: 'no-policy', description: 'Test' });
    expect(task.retryPolicy).toBeUndefined();
  });

  it('should accept a valid retryPolicy', () => {
    const policy: RetryPolicy = {
      baseDelayMs: 200,
      maxDelayMs: 5000,
      backoffMultiplier: 3,
      jitter: 0.5,
    };
    const task = new Task({
      id: 'with-policy',
      description: 'Test',
      retries: 3,
      retryPolicy: policy,
    });
    expect(task.retryPolicy).toBeDefined();
    expect(task.retryPolicy!.baseDelayMs).toBe(200);
    expect(task.retryPolicy!.maxDelayMs).toBe(5000);
    expect(task.retryPolicy!.backoffMultiplier).toBe(3);
    expect(task.retryPolicy!.jitter).toBe(0.5);
  });

  it('should accept retryPolicy with only some fields', () => {
    const task = new Task({
      id: 'partial-policy',
      description: 'Test',
      retries: 2,
      retryPolicy: { baseDelayMs: 100 },
    });
    expect(task.retryPolicy).toBeDefined();
    expect(task.retryPolicy!.baseDelayMs).toBe(100);
    expect(task.retryPolicy!.maxDelayMs).toBeUndefined();
    expect(task.retryPolicy!.backoffMultiplier).toBeUndefined();
  });

  it('should accept retryPolicy with isRetryable predicate', () => {
    const pred = (err: Error) => err.message.includes('transient');
    const task = new Task({
      id: 'retryable-policy',
      description: 'Test',
      retries: 1,
      retryPolicy: { isRetryable: pred },
    });
    expect(task.retryPolicy!.isRetryable).toBe(pred);
  });

  it('should accept an empty retryPolicy object', () => {
    const task = new Task({
      id: 'empty-policy',
      description: 'Test',
      retryPolicy: {},
    });
    expect(task.retryPolicy).toBeDefined();
    expect(task.retryPolicy!.baseDelayMs).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Task — retryPolicy validation
// ---------------------------------------------------------------------------

describe('Task — retryPolicy validation', () => {
  it('should reject negative baseDelayMs', () => {
    expect(
      () =>
        new Task({
          id: 'bad-delay',
          description: 'Test',
          retryPolicy: { baseDelayMs: -100 },
        }),
    ).toThrow('baseDelayMs must be positive');
  });

  it('should reject zero baseDelayMs', () => {
    expect(
      () =>
        new Task({
          id: 'bad-delay',
          description: 'Test',
          retryPolicy: { baseDelayMs: 0 },
        }),
    ).toThrow('baseDelayMs must be positive');
  });

  it('should reject negative maxDelayMs', () => {
    expect(
      () =>
        new Task({
          id: 'bad-max',
          description: 'Test',
          retryPolicy: { maxDelayMs: -1 },
        }),
    ).toThrow('maxDelayMs must be positive');
  });

  it('should reject negative backoffMultiplier', () => {
    expect(
      () =>
        new Task({
          id: 'bad-mult',
          description: 'Test',
          retryPolicy: { backoffMultiplier: -2 },
        }),
    ).toThrow('backoffMultiplier must be positive');
  });

  it('should reject jitter below 0', () => {
    expect(
      () =>
        new Task({
          id: 'bad-jitter',
          description: 'Test',
          retryPolicy: { jitter: -0.1 },
        }),
    ).toThrow('jitter must be ≥ 0');
  });

  it('should reject jitter above 1', () => {
    expect(
      () =>
        new Task({
          id: 'bad-jitter',
          description: 'Test',
          retryPolicy: { jitter: 1.5 },
        }),
    ).toThrow('jitter must be ≤ 1');
  });

  it('should reject unknown fields in retryPolicy (strict mode)', () => {
    expect(
      () =>
        new Task({
          id: 'bad-fields',
          description: 'Test',
          retryPolicy: { unknownField: 42 } as unknown as RetryPolicy,
        }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// TaskExecutionWrapper — per-task policy overrides
// ---------------------------------------------------------------------------

describe('TaskExecutionWrapper — per-task retry policy', () => {
  it('should use per-task baseDelayMs and backoff instead of wrapper defaults', async () => {
    const sleepSpy = vi.fn(noSleep);

    const wrapper = new TaskExecutionWrapper({
      retryBaseDelayMs: 1000,
      retryMaxDelayMs: 30000,
      retryBackoffMultiplier: 2,
      retryJitter: 0,
      sleep: sleepSpy,
      random: fixedRandom,
    });

    const task = new Task({
      id: 'per-task-delay',
      description: 'Test',
      retries: 2,
      retryPolicy: {
        baseDelayMs: 100,
        maxDelayMs: 500,
        backoffMultiplier: 3,
        jitter: 0,
      },
    });

    const runner = failThenSucceedRunner(2);
    const wrappedRunner = wrapper.wrap(runner);

    const result = await wrappedRunner(task, {});
    expect(result.output).toBe('success-on-attempt-3');

    // First retry: 100 * 3^0 = 100ms
    expect(sleepSpy).toHaveBeenNthCalledWith(1, 100);
    // Second retry: 100 * 3^1 = 300ms
    expect(sleepSpy).toHaveBeenNthCalledWith(2, 300);
  });

  it('should use per-task maxDelayMs cap', async () => {
    const sleepSpy = vi.fn(noSleep);

    const wrapper = new TaskExecutionWrapper({
      retryBaseDelayMs: 10000,
      retryMaxDelayMs: 60000,
      retryBackoffMultiplier: 10,
      retryJitter: 0,
      sleep: sleepSpy,
      random: fixedRandom,
    });

    const task = new Task({
      id: 'per-task-cap',
      description: 'Test',
      retries: 2,
      retryPolicy: {
        baseDelayMs: 200,
        maxDelayMs: 250,
        backoffMultiplier: 10,
        jitter: 0,
      },
    });

    const runner = failThenSucceedRunner(2);
    const wrappedRunner = wrapper.wrap(runner);

    await wrappedRunner(task, {});

    // First retry: min(200 * 10^0, 250) = 200ms
    expect(sleepSpy).toHaveBeenNthCalledWith(1, 200);
    // Second retry: min(200 * 10^1, 250) = 250ms (capped)
    expect(sleepSpy).toHaveBeenNthCalledWith(2, 250);
  });

  it('should use per-task jitter', async () => {
    const sleepSpy = vi.fn(noSleep);

    const wrapper = new TaskExecutionWrapper({
      retryBaseDelayMs: 1000,
      retryJitter: 0,
      sleep: sleepSpy,
      random: () => 0.5,
    });

    const task = new Task({
      id: 'per-task-jitter',
      description: 'Test',
      retries: 1,
      retryPolicy: {
        baseDelayMs: 1000,
        jitter: 1,
      },
    });

    const runner = failThenSucceedRunner(1);
    const wrappedRunner = wrapper.wrap(runner);

    await wrappedRunner(task, {});

    // With jitter=1 and random=0.5: round(1000 * 0 + 1000 * 1 * 0.5) = 500
    expect(sleepSpy).toHaveBeenCalledWith(500);
  });

  it('should use per-task isRetryable predicate', async () => {
    const wrapper = new TaskExecutionWrapper({
      defaultRetries: 3,
      sleep: noSleep,
      random: fixedRandom,
      isRetryable: () => true, // wrapper says all errors are retryable
    });

    const task = new Task({
      id: 'per-task-retryable',
      description: 'Test',
      retries: 3,
      retryPolicy: {
        isRetryable: (err) => !err.message.includes('fatal'),
      },
    });

    // Runner that throws a "fatal" error
    const runner: TaskRunner = async (t) => {
      throw new Error(`fatal error: ${t.id}`);
    };

    const wrappedRunner = wrapper.wrap(runner);

    // Per-task policy rejects "fatal" errors, so should throw immediately (no retry)
    await expect(wrappedRunner(task, {})).rejects.toThrow('fatal error');
  });

  it('should fall back to wrapper defaults when task has no retryPolicy', async () => {
    const sleepSpy = vi.fn(noSleep);

    const wrapper = new TaskExecutionWrapper({
      retryBaseDelayMs: 500,
      retryMaxDelayMs: 2000,
      retryBackoffMultiplier: 2,
      retryJitter: 0,
      sleep: sleepSpy,
      random: fixedRandom,
    });

    const task = new Task({
      id: 'no-policy-task',
      description: 'Test',
      retries: 1,
    });

    const runner = failThenSucceedRunner(1);
    const wrappedRunner = wrapper.wrap(runner);

    await wrappedRunner(task, {});

    // Should use wrapper default: 500 * 2^0 = 500ms
    expect(sleepSpy).toHaveBeenCalledWith(500);
  });

  it('should use partial per-task policy and fall back for unset fields', async () => {
    const sleepSpy = vi.fn(noSleep);

    const wrapper = new TaskExecutionWrapper({
      retryBaseDelayMs: 1000,
      retryMaxDelayMs: 30000,
      retryBackoffMultiplier: 2,
      retryJitter: 0,
      sleep: sleepSpy,
      random: fixedRandom,
    });

    // Only override baseDelayMs, rest falls back to wrapper
    const task = new Task({
      id: 'partial-override',
      description: 'Test',
      retries: 1,
      retryPolicy: { baseDelayMs: 200 },
    });

    const runner = failThenSucceedRunner(1);
    const wrappedRunner = wrapper.wrap(runner);

    await wrappedRunner(task, {});

    // baseDelayMs=200 (per-task), backoff=2 (wrapper default), jitter=0 (wrapper)
    // Delay = 200 * 2^0 = 200ms
    expect(sleepSpy).toHaveBeenCalledWith(200);
  });

  it('should emit retry events with per-task policy', async () => {
    const wrapper = new TaskExecutionWrapper({
      sleep: noSleep,
      random: fixedRandom,
    });

    const task = new Task({
      id: 'retry-events',
      description: 'Test',
      retries: 2,
      retryPolicy: { baseDelayMs: 50, jitter: 0 },
    });

    const retryEvents: Array<{ attempt: number; maxRetries: number }> = [];
    task.on('task:retry', (_id, attempt, maxRetries) => {
      retryEvents.push({ attempt, maxRetries });
    });

    const runner = failThenSucceedRunner(2);
    const wrappedRunner = wrapper.wrap(runner);

    await wrappedRunner(task, {});

    expect(retryEvents).toEqual([
      { attempt: 1, maxRetries: 2 },
      { attempt: 2, maxRetries: 2 },
    ]);
  });

  it('should throw TaskExecutionError after exhausting retries with per-task policy', async () => {
    const wrapper = new TaskExecutionWrapper({
      sleep: noSleep,
      random: fixedRandom,
    });

    const task = new Task({
      id: 'exhaust-retries',
      description: 'Test',
      retries: 2,
      retryPolicy: { baseDelayMs: 10, jitter: 0 },
    });

    const runner = failingRunner('boom');
    const wrappedRunner = wrapper.wrap(runner);

    await expect(wrappedRunner(task, {})).rejects.toThrow(TaskExecutionError);
    await expect(wrappedRunner(task, {})).rejects.toThrow(/Failed after 3 attempt/);
  });

  it('should work with per-task isRetryable allowing some errors but not others', async () => {
    const wrapper = new TaskExecutionWrapper({
      sleep: noSleep,
      random: fixedRandom,
    });

    let callCount = 0;
    const runner: TaskRunner = async (t) => {
      callCount++;
      if (callCount === 1) throw new Error('transient error');
      if (callCount === 2) throw new Error('fatal error');
      return makeResult(t.id);
    };

    const task = new Task({
      id: 'selective-retry',
      description: 'Test',
      retries: 5,
      retryPolicy: {
        isRetryable: (err) => err.message.includes('transient'),
      },
    });

    const wrappedRunner = wrapper.wrap(runner);

    // First call: transient → retry; second call: fatal → stop immediately
    await expect(wrappedRunner(task, {})).rejects.toThrow('fatal error');
    expect(callCount).toBe(2);
  });

  it('should handle per-task policy with zero jitter (deterministic)', async () => {
    const sleepSpy = vi.fn(noSleep);

    const wrapper = new TaskExecutionWrapper({
      retryJitter: 1, // wrapper has full jitter
      sleep: sleepSpy,
      random: () => 0.99,
    });

    const task = new Task({
      id: 'deterministic',
      description: 'Test',
      retries: 1,
      retryPolicy: {
        baseDelayMs: 1000,
        jitter: 0, // per-task: deterministic
      },
    });

    const runner = failThenSucceedRunner(1);
    const wrappedRunner = wrapper.wrap(runner);

    await wrappedRunner(task, {});

    // With jitter=0: delay = 1000 * 1.0 + 0 = 1000ms (deterministic, ignores random)
    expect(sleepSpy).toHaveBeenCalledWith(1000);
  });

  it('two tasks with different policies should use their own configs', async () => {
    const sleepCalls: Array<{ taskId: string; delayMs: number }> = [];

    const wrapper = new TaskExecutionWrapper({
      retryBaseDelayMs: 999,
      retryJitter: 0,
      sleep: async (ms) => {
        // We'll track which task caused which sleep
        sleepCalls.push({ taskId: 'unknown', delayMs: ms });
      },
      random: fixedRandom,
    });

    const taskA = new Task({
      id: 'task-a',
      description: 'Task A',
      retries: 1,
      retryPolicy: { baseDelayMs: 100, jitter: 0 },
    });

    const taskB = new Task({
      id: 'task-b',
      description: 'Task B',
      retries: 1,
      retryPolicy: { baseDelayMs: 500, jitter: 0 },
    });

    const runnerA = failThenSucceedRunner(1);
    const runnerB = failThenSucceedRunner(1);

    const wrappedA = wrapper.wrap(runnerA);
    const wrappedB = wrapper.wrap(runnerB);

    sleepCalls.length = 0;
    await wrappedA(taskA, {});
    expect(sleepCalls[0]!.delayMs).toBe(100);

    sleepCalls.length = 0;
    await wrappedB(taskB, {});
    expect(sleepCalls[0]!.delayMs).toBe(500);
  });
});
