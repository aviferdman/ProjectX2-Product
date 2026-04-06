/**
 * Unit tests for the TaskExecutionWrapper module.
 *
 * Tests cover:
 * - TaskExecutionWrapper: wrap(), timeout, retry, backoff, events, edge cases
 * - executeWithTimeout(): standalone timeout enforcement
 * - executeWithRetry(): standalone retry logic
 * - calculateTaskRetryDelay(): delay computation with backoff and jitter
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Task } from '../../../src/task/task.js';
import {
  TaskExecutionWrapper,
  executeWithTimeout,
  executeWithRetry,
  calculateTaskRetryDelay,
} from '../../../src/task/task-execution-wrapper.js';
import { TaskExecutionError, TaskTimeoutError } from '../../../src/errors/index.js';
import type { TaskRunner } from '../../../src/task/parallel-executor.js';
import type { TaskResult } from '../../../src/types/task.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTask(
  id: string,
  opts: { timeout?: number; retries?: number; agentId?: string } = {},
): Task {
  return new Task({
    id,
    description: `Task ${id}`,
    timeout: opts.timeout,
    retries: opts.retries,
    agentId: opts.agentId,
  });
}

function makeResult(taskId: string, output = `result-${taskId}`): TaskResult {
  return { output, agentId: 'test-agent', duration: 10 };
}

function immediateRunner(): TaskRunner {
  return async (task) => makeResult(task.id);
}

function delayRunner(ms: number): TaskRunner {
  return async (task) => {
    await new Promise((resolve) => setTimeout(resolve, ms));
    return makeResult(task.id);
  };
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

/** No-op sleep for fast tests. */
const noSleep = async (_ms: number): Promise<void> => {};

/** Deterministic "random" for predictable delay calculations. */
const fixedRandom = () => 0.5;

// ---------------------------------------------------------------------------
// calculateTaskRetryDelay
// ---------------------------------------------------------------------------

describe('calculateTaskRetryDelay', () => {
  it('should compute base delay on attempt 0 with no jitter', () => {
    const delay = calculateTaskRetryDelay(0, 1000, 30000, 2, 0, () => 0);
    expect(delay).toBe(1000);
  });

  it('should apply exponential backoff', () => {
    const delay0 = calculateTaskRetryDelay(0, 1000, 30000, 2, 0, () => 0);
    const delay1 = calculateTaskRetryDelay(1, 1000, 30000, 2, 0, () => 0);
    const delay2 = calculateTaskRetryDelay(2, 1000, 30000, 2, 0, () => 0);

    expect(delay0).toBe(1000);
    expect(delay1).toBe(2000);
    expect(delay2).toBe(4000);
  });

  it('should cap at maxDelayMs', () => {
    const delay = calculateTaskRetryDelay(10, 1000, 5000, 2, 0, () => 0);
    expect(delay).toBe(5000);
  });

  it('should apply jitter', () => {
    // With jitter=1 and random=0.5: delay = 0 + cappedDelay * 1 * 0.5
    const delay = calculateTaskRetryDelay(0, 1000, 30000, 2, 1, () => 0.5);
    expect(delay).toBe(500); // 1000 * 0 + 1000 * 1 * 0.5
  });

  it('should produce zero delay with jitter=1 and random=0', () => {
    const delay = calculateTaskRetryDelay(0, 1000, 30000, 2, 1, () => 0);
    expect(delay).toBe(0);
  });

  it('should produce full delay with jitter=1 and random=1', () => {
    const delay = calculateTaskRetryDelay(0, 1000, 30000, 2, 1, () => 1);
    expect(delay).toBe(1000);
  });

  it('should handle partial jitter', () => {
    // jitter=0.5, random=1: delay = 1000*0.5 + 1000*0.5*1 = 500 + 500 = 1000
    const delay = calculateTaskRetryDelay(0, 1000, 30000, 2, 0.5, () => 1);
    expect(delay).toBe(1000);
  });

  it('should use defaults when called without optional args', () => {
    const delay = calculateTaskRetryDelay(0);
    expect(delay).toBeGreaterThanOrEqual(0);
    expect(delay).toBeLessThanOrEqual(1000);
  });
});

// ---------------------------------------------------------------------------
// executeWithTimeout (standalone)
// ---------------------------------------------------------------------------

describe('executeWithTimeout', () => {
  it('should return result when execution completes within timeout', async () => {
    const task = makeTask('fast');
    const result = await executeWithTimeout(immediateRunner(), task, {}, 5000);
    expect(result.output).toBe('result-fast');
  });

  it('should throw TaskTimeoutError when execution exceeds timeout', async () => {
    const task = makeTask('slow');
    await expect(executeWithTimeout(delayRunner(500), task, {}, 50)).rejects.toThrow(
      TaskTimeoutError,
    );
  });

  it('should emit task:timeout event on timeout', async () => {
    const task = makeTask('slow-events');
    const timeoutHandler = vi.fn();
    task.on('task:timeout', timeoutHandler);

    await expect(executeWithTimeout(delayRunner(500), task, {}, 50)).rejects.toThrow(
      TaskTimeoutError,
    );

    expect(timeoutHandler).toHaveBeenCalledWith('slow-events', 50);
  });

  it('should pass through runner errors without modification', async () => {
    const task = makeTask('error-task');
    await expect(executeWithTimeout(failingRunner('boom'), task, {}, 5000)).rejects.toThrow(
      'boom: error-task',
    );
  });

  it('should skip timeout when timeoutMs is 0', async () => {
    const task = makeTask('no-timeout');
    const result = await executeWithTimeout(immediateRunner(), task, {}, 0);
    expect(result.output).toBe('result-no-timeout');
  });

  it('should skip timeout when timeoutMs is negative', async () => {
    const task = makeTask('neg-timeout');
    const result = await executeWithTimeout(immediateRunner(), task, {}, -1);
    expect(result.output).toBe('result-neg-timeout');
  });

  it('should include taskId and timeoutMs in TaskTimeoutError', async () => {
    const task = makeTask('timeout-info');
    try {
      await executeWithTimeout(delayRunner(500), task, {}, 50);
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(TaskTimeoutError);
      const timeoutErr = error as TaskTimeoutError;
      expect(timeoutErr.taskId).toBe('timeout-info');
      expect(timeoutErr.timeoutMs).toBe(50);
    }
  });

  it('should pass context to the runner', async () => {
    const task = makeTask('ctx-task');
    const contextSpy = vi.fn<TaskRunner>();
    contextSpy.mockResolvedValue(makeResult('ctx-task'));

    const ctx = { dep1: makeResult('dep1') };
    await executeWithTimeout(contextSpy, task, ctx, 5000);

    expect(contextSpy).toHaveBeenCalledWith(task, ctx);
  });
});

// ---------------------------------------------------------------------------
// executeWithRetry (standalone)
// ---------------------------------------------------------------------------

describe('executeWithRetry', () => {
  it('should return result on first successful attempt', async () => {
    const task = makeTask('no-retry');
    const result = await executeWithRetry(immediateRunner(), task, {}, 3, { sleep: noSleep });
    expect(result.output).toBe('result-no-retry');
  });

  it('should retry and succeed after failures', async () => {
    const task = makeTask('retry-ok');
    const runner = failThenSucceedRunner(2);
    const result = await executeWithRetry(runner, task, {}, 3, {
      sleep: noSleep,
      random: fixedRandom,
    });
    expect(result.output).toBe('success-on-attempt-3');
  });

  it('should throw TaskExecutionError when all retries exhausted', async () => {
    const task = makeTask('all-fail');
    await expect(
      executeWithRetry(failingRunner('always fails'), task, {}, 2, { sleep: noSleep }),
    ).rejects.toThrow(TaskExecutionError);
  });

  it('should include attempt count in error message when retries exhausted', async () => {
    const task = makeTask('count-fail');
    try {
      await executeWithRetry(failingRunner('bad'), task, {}, 2, { sleep: noSleep });
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(TaskExecutionError);
      expect((error as Error).message).toContain('3 attempt(s)');
    }
  });

  it('should throw immediately for non-retryable errors', async () => {
    const task = makeTask('non-retryable');
    const callCount = vi.fn();
    const runner: TaskRunner = async (t) => {
      callCount();
      throw new Error('fatal');
    };

    await expect(
      executeWithRetry(runner, task, {}, 3, {
        sleep: noSleep,
        isRetryable: () => false,
      }),
    ).rejects.toThrow('fatal');

    expect(callCount).toHaveBeenCalledTimes(1);
  });

  it('should emit task:retry events', async () => {
    const task = makeTask('retry-events');
    const retryHandler = vi.fn();
    task.on('task:retry', retryHandler);

    const runner = failThenSucceedRunner(2);
    await executeWithRetry(runner, task, {}, 3, {
      sleep: noSleep,
      random: fixedRandom,
    });

    expect(retryHandler).toHaveBeenCalledTimes(2);
    expect(retryHandler).toHaveBeenCalledWith('retry-events', 1, 3);
    expect(retryHandler).toHaveBeenCalledWith('retry-events', 2, 3);
  });

  it('should call sleep between retries', async () => {
    const task = makeTask('sleep-check');
    const sleepFn = vi.fn<(ms: number) => Promise<void>>().mockResolvedValue(undefined);
    const runner = failThenSucceedRunner(2);

    await executeWithRetry(runner, task, {}, 3, {
      sleep: sleepFn,
      random: () => 0.5,
      baseDelayMs: 1000,
      backoffMultiplier: 2,
      jitter: 1,
    });

    expect(sleepFn).toHaveBeenCalledTimes(2);
    // attempt 0: baseDelay=1000, jitter=1, random=0.5 → 500
    expect(sleepFn).toHaveBeenNthCalledWith(1, 500);
    // attempt 1: baseDelay*2=2000, jitter=1, random=0.5 → 1000
    expect(sleepFn).toHaveBeenNthCalledWith(2, 1000);
  });

  it('should work with zero retries', async () => {
    const task = makeTask('zero-retry');
    const result = await executeWithRetry(immediateRunner(), task, {}, 0, { sleep: noSleep });
    expect(result.output).toBe('result-zero-retry');
  });

  it('should throw on first failure with zero retries', async () => {
    const task = makeTask('zero-fail');
    await expect(
      executeWithRetry(failingRunner('no-retry-fail'), task, {}, 0, { sleep: noSleep }),
    ).rejects.toThrow('no-retry-fail');
  });
});

// ---------------------------------------------------------------------------
// TaskExecutionWrapper class
// ---------------------------------------------------------------------------

describe('TaskExecutionWrapper', () => {
  describe('constructor', () => {
    it('should use default values when no config provided', () => {
      const wrapper = new TaskExecutionWrapper();
      expect(wrapper.defaultTimeoutMs).toBe(0);
      expect(wrapper.defaultRetries).toBe(0);
      expect(wrapper.retryBaseDelayMs).toBe(1000);
      expect(wrapper.retryMaxDelayMs).toBe(30000);
      expect(wrapper.retryBackoffMultiplier).toBe(2);
      expect(wrapper.retryJitter).toBe(1);
    });

    it('should accept custom config', () => {
      const wrapper = new TaskExecutionWrapper({
        defaultTimeoutMs: 5000,
        defaultRetries: 3,
        retryBaseDelayMs: 500,
        retryMaxDelayMs: 10000,
        retryBackoffMultiplier: 3,
        retryJitter: 0.5,
      });
      expect(wrapper.defaultTimeoutMs).toBe(5000);
      expect(wrapper.defaultRetries).toBe(3);
      expect(wrapper.retryBaseDelayMs).toBe(500);
      expect(wrapper.retryMaxDelayMs).toBe(10000);
      expect(wrapper.retryBackoffMultiplier).toBe(3);
      expect(wrapper.retryJitter).toBe(0.5);
    });
  });

  describe('calculateDelay', () => {
    it('should compute exponential backoff with configurable params', () => {
      const wrapper = new TaskExecutionWrapper({
        retryBaseDelayMs: 100,
        retryBackoffMultiplier: 2,
        retryMaxDelayMs: 10000,
        retryJitter: 0,
      });

      expect(wrapper.calculateDelay(0)).toBe(100);
      expect(wrapper.calculateDelay(1)).toBe(200);
      expect(wrapper.calculateDelay(2)).toBe(400);
      expect(wrapper.calculateDelay(3)).toBe(800);
    });

    it('should cap delay at retryMaxDelayMs', () => {
      const wrapper = new TaskExecutionWrapper({
        retryBaseDelayMs: 1000,
        retryBackoffMultiplier: 10,
        retryMaxDelayMs: 5000,
        retryJitter: 0,
      });

      expect(wrapper.calculateDelay(0)).toBe(1000);
      expect(wrapper.calculateDelay(1)).toBe(5000); // 10000 capped to 5000
      expect(wrapper.calculateDelay(2)).toBe(5000); // still capped
    });
  });

  describe('wrap() — no timeout, no retry', () => {
    it('should pass through to the original runner', async () => {
      const wrapper = new TaskExecutionWrapper({ sleep: noSleep });
      const task = makeTask('passthrough');
      const enhanced = wrapper.wrap(immediateRunner());
      const result = await enhanced(task, {});
      expect(result.output).toBe('result-passthrough');
    });

    it('should pass through runner errors', async () => {
      const wrapper = new TaskExecutionWrapper({ sleep: noSleep });
      const task = makeTask('error-pass');
      const enhanced = wrapper.wrap(failingRunner('kaboom'));
      await expect(enhanced(task, {})).rejects.toThrow('kaboom');
    });
  });

  describe('wrap() — timeout only', () => {
    it('should respect task-level timeout', async () => {
      const wrapper = new TaskExecutionWrapper({ sleep: noSleep });
      const task = makeTask('task-timeout', { timeout: 50 });
      const enhanced = wrapper.wrap(delayRunner(500));

      await expect(enhanced(task, {})).rejects.toThrow(TaskTimeoutError);
    });

    it('should use default timeout when task has none', async () => {
      const wrapper = new TaskExecutionWrapper({
        defaultTimeoutMs: 50,
        sleep: noSleep,
      });
      const task = makeTask('default-timeout');
      const enhanced = wrapper.wrap(delayRunner(500));

      await expect(enhanced(task, {})).rejects.toThrow(TaskTimeoutError);
    });

    it('should prefer task timeout over default', async () => {
      const wrapper = new TaskExecutionWrapper({
        defaultTimeoutMs: 50,
        sleep: noSleep,
      });
      // Task has a generous timeout — should succeed
      const task = makeTask('generous-timeout', { timeout: 5000 });
      const enhanced = wrapper.wrap(immediateRunner());
      const result = await enhanced(task, {});
      expect(result.output).toBe('result-generous-timeout');
    });
  });

  describe('wrap() — retry only', () => {
    it('should retry and succeed after transient failures', async () => {
      const wrapper = new TaskExecutionWrapper({
        sleep: noSleep,
        random: fixedRandom,
      });
      const task = makeTask('retry-success', { retries: 3 });
      const runner = failThenSucceedRunner(2);
      const enhanced = wrapper.wrap(runner);

      const result = await enhanced(task, {});
      expect(result.output).toBe('success-on-attempt-3');
    });

    it('should use default retries when task has none', async () => {
      const wrapper = new TaskExecutionWrapper({
        defaultRetries: 3,
        sleep: noSleep,
        random: fixedRandom,
      });
      const task = makeTask('default-retries');
      const runner = failThenSucceedRunner(2);
      const enhanced = wrapper.wrap(runner);

      const result = await enhanced(task, {});
      expect(result.output).toBe('success-on-attempt-3');
    });

    it('should throw TaskExecutionError after exhausting retries', async () => {
      const wrapper = new TaskExecutionWrapper({
        sleep: noSleep,
        random: fixedRandom,
      });
      const task = makeTask('exhaust-retries', { retries: 2 });
      const enhanced = wrapper.wrap(failingRunner('persistent error'));

      await expect(enhanced(task, {})).rejects.toThrow(TaskExecutionError);
    });

    it('should emit task:retry event for each retry', async () => {
      const wrapper = new TaskExecutionWrapper({
        sleep: noSleep,
        random: fixedRandom,
      });
      const task = makeTask('retry-event-check', { retries: 3 });
      const retryHandler = vi.fn();
      task.on('task:retry', retryHandler);

      const runner = failThenSucceedRunner(2);
      const enhanced = wrapper.wrap(runner);
      await enhanced(task, {});

      expect(retryHandler).toHaveBeenCalledTimes(2);
      expect(retryHandler).toHaveBeenCalledWith('retry-event-check', 1, 3);
      expect(retryHandler).toHaveBeenCalledWith('retry-event-check', 2, 3);
    });

    it('should skip retry for non-retryable errors', async () => {
      const callCount = vi.fn();
      const runner: TaskRunner = async (t) => {
        callCount();
        throw new Error('non-retryable');
      };

      const wrapper = new TaskExecutionWrapper({
        sleep: noSleep,
        isRetryable: () => false,
      });
      const task = makeTask('non-retryable', { retries: 5 });
      const enhanced = wrapper.wrap(runner);

      await expect(enhanced(task, {})).rejects.toThrow('non-retryable');
      expect(callCount).toHaveBeenCalledTimes(1);
    });

    it('should use custom isRetryable predicate', async () => {
      const callCount = vi.fn();
      let attempt = 0;
      const runner: TaskRunner = async (t) => {
        callCount();
        attempt++;
        if (attempt <= 2) {
          throw new Error('retryable-error');
        }
        throw new Error('fatal-error');
      };

      const wrapper = new TaskExecutionWrapper({
        sleep: noSleep,
        isRetryable: (err) => err.message === 'retryable-error',
      });
      const task = makeTask('custom-retryable', { retries: 5 });
      const enhanced = wrapper.wrap(runner);

      await expect(enhanced(task, {})).rejects.toThrow('fatal-error');
      expect(callCount).toHaveBeenCalledTimes(3);
    });
  });

  describe('wrap() — timeout + retry combined', () => {
    it('should retry after timeout on first attempt', async () => {
      let attempt = 0;
      const runner: TaskRunner = async (task) => {
        attempt++;
        if (attempt === 1) {
          // Simulate a slow operation that will timeout
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
        return makeResult(task.id, `ok-on-${String(attempt)}`);
      };

      const wrapper = new TaskExecutionWrapper({
        sleep: noSleep,
        random: fixedRandom,
      });
      const task = makeTask('timeout-retry', { timeout: 50, retries: 2 });
      const enhanced = wrapper.wrap(runner);

      const result = await enhanced(task, {});
      expect(result.output).toBe('ok-on-2');
    });

    it('should throw TaskTimeoutError after all retries time out', async () => {
      const wrapper = new TaskExecutionWrapper({
        sleep: noSleep,
        random: fixedRandom,
      });
      const task = makeTask('all-timeout', { timeout: 50, retries: 1 });
      const enhanced = wrapper.wrap(delayRunner(500));

      await expect(enhanced(task, {})).rejects.toThrow(TaskTimeoutError);
    });

    it('should emit both timeout and retry events', async () => {
      let attempt = 0;
      const runner: TaskRunner = async (task) => {
        attempt++;
        if (attempt <= 2) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
        return makeResult(task.id);
      };

      const wrapper = new TaskExecutionWrapper({
        sleep: noSleep,
        random: fixedRandom,
      });
      const task = makeTask('both-events', { timeout: 50, retries: 3 });

      const timeoutHandler = vi.fn();
      const retryHandler = vi.fn();
      task.on('task:timeout', timeoutHandler);
      task.on('task:retry', retryHandler);

      const enhanced = wrapper.wrap(runner);
      await enhanced(task, {});

      expect(timeoutHandler).toHaveBeenCalledTimes(2);
      expect(retryHandler).toHaveBeenCalledTimes(2);
    });
  });

  describe('wrap() — context passing', () => {
    it('should pass dependency context to the inner runner', async () => {
      const wrapper = new TaskExecutionWrapper({ sleep: noSleep });
      const spy = vi.fn<TaskRunner>().mockResolvedValue(makeResult('ctx'));
      const enhanced = wrapper.wrap(spy);

      const task = makeTask('ctx-pass');
      const context = { dep1: makeResult('dep1') };
      await enhanced(task, context);

      expect(spy).toHaveBeenCalledWith(task, context);
    });
  });

  describe('wrap() — sleep integration', () => {
    it('should call configured sleep between retries', async () => {
      const sleepFn = vi.fn<(ms: number) => Promise<void>>().mockResolvedValue(undefined);
      const wrapper = new TaskExecutionWrapper({
        sleep: sleepFn,
        random: () => 0.5,
        retryBaseDelayMs: 100,
        retryBackoffMultiplier: 2,
        retryJitter: 1,
      });

      const task = makeTask('sleep-test', { retries: 3 });
      const runner = failThenSucceedRunner(2);
      const enhanced = wrapper.wrap(runner);

      await enhanced(task, {});

      expect(sleepFn).toHaveBeenCalledTimes(2);
      // attempt 0 retry: baseDelay=100, jitter=1, random=0.5 → 50
      expect(sleepFn).toHaveBeenNthCalledWith(1, 50);
      // attempt 1 retry: baseDelay*2=200, jitter=1, random=0.5 → 100
      expect(sleepFn).toHaveBeenNthCalledWith(2, 100);
    });
  });

  describe('wrap() — agentId in errors', () => {
    it('should include agentId in TaskTimeoutError when available', async () => {
      const wrapper = new TaskExecutionWrapper({ sleep: noSleep });
      const task = makeTask('agent-timeout', { timeout: 50, agentId: 'researcher' });
      const enhanced = wrapper.wrap(delayRunner(500));

      try {
        await enhanced(task, {});
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TaskTimeoutError);
        const timeoutErr = error as TaskTimeoutError;
        expect(timeoutErr.agentId).toBe('researcher');
      }
    });

    it('should include agentId in TaskExecutionError when retries exhausted', async () => {
      const wrapper = new TaskExecutionWrapper({ sleep: noSleep });
      const task = makeTask('agent-exhaust', { retries: 1, agentId: 'writer' });
      const enhanced = wrapper.wrap(failingRunner('fail'));

      try {
        await enhanced(task, {});
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TaskExecutionError);
        const execErr = error as TaskExecutionError;
        expect(execErr.agentId).toBe('writer');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle non-Error throws from runner', async () => {
      const runner: TaskRunner = async () => {
        throw 'string error';
      };

      const wrapper = new TaskExecutionWrapper({ sleep: noSleep });
      const task = makeTask('string-throw', { retries: 1 });
      const enhanced = wrapper.wrap(runner);

      await expect(enhanced(task, {})).rejects.toThrow(TaskExecutionError);
    });

    it('should handle runner returning normally after timeout fires', async () => {
      // This tests the race condition: timeout fires but runner also completes
      // The timeout should "win" if it fires first
      const wrapper = new TaskExecutionWrapper({ sleep: noSleep });
      const task = makeTask('race-condition', { timeout: 10 });
      // Runner that takes ~100ms — timeout of 10ms should fire first
      const enhanced = wrapper.wrap(delayRunner(100));

      await expect(enhanced(task, {})).rejects.toThrow(TaskTimeoutError);
    });

    it('should work with exactly 1 retry', async () => {
      const wrapper = new TaskExecutionWrapper({
        sleep: noSleep,
        random: fixedRandom,
      });
      const task = makeTask('one-retry', { retries: 1 });
      const runner = failThenSucceedRunner(1);
      const enhanced = wrapper.wrap(runner);

      const result = await enhanced(task, {});
      expect(result.output).toBe('success-on-attempt-2');
    });

    it('should work with maximum configured retries (10)', async () => {
      const wrapper = new TaskExecutionWrapper({
        sleep: noSleep,
        random: fixedRandom,
      });
      const task = makeTask('max-retry', { retries: 10 });
      const runner = failThenSucceedRunner(10);
      const enhanced = wrapper.wrap(runner);

      const result = await enhanced(task, {});
      expect(result.output).toBe('success-on-attempt-11');
    });
  });
});
