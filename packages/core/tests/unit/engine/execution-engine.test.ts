/**
 * Unit tests for the ExecutionEngine class.
 *
 * Tests cover:
 * - Construction and configuration validation
 * - Task and agent management
 * - Sequential execution strategy
 * - Parallel execution strategy
 * - Dependency resolution and topological sort
 * - Retry logic with exponential backoff
 * - Task timeouts
 * - Cancellation
 * - Error policies (fail-fast vs continue)
 * - Middleware hooks (before/after/onError)
 * - Event emission
 * - Circular dependency detection
 * - Edge cases
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Agent } from '../../../src/agent/agent.js';
import { ExecutionEngine } from '../../../src/engine/execution-engine.js';
import { EngineStatus, ExecutionStrategy } from '../../../src/engine/types.js';
import { EngineConfigError, EngineExecutionError } from '../../../src/errors/engine-errors.js';
import { Task } from '../../../src/task/task.js';
import type { LLMProvider, LLMResponse } from '../../../src/types/index.js';
import { TaskPriority, TaskStatus } from '../../../src/types/index.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createMockLLMProvider(response?: string): LLMProvider {
  return {
    name: 'mock-provider',
    generateText: vi.fn().mockResolvedValue({
      content: response ?? 'mock output',
      tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      finishReason: 'stop',
    } satisfies LLMResponse),
  };
}

function createAgent(id: string, response?: string): Agent {
  const agent = new Agent({ id, role: 'Test Role', goal: 'Test Goal' });
  agent.setLLMProvider(createMockLLMProvider(response));
  return agent;
}

function createTask(
  id: string,
  agentId: string,
  options?: {
    dependencies?: string[];
    timeout?: number;
    retries?: number;
    priority?: TaskPriority;
  },
): Task {
  return new Task({
    id,
    description: `Task ${id} description`,
    agentId,
    ...(options?.dependencies !== undefined ? { dependencies: options.dependencies } : {}),
    ...(options?.timeout !== undefined ? { timeout: options.timeout } : {}),
    ...(options?.retries !== undefined ? { retries: options.retries } : {}),
    ...(options?.priority !== undefined ? { priority: options.priority } : {}),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExecutionEngine', () => {
  describe('construction', () => {
    it('should create an engine with default config', () => {
      const engine = new ExecutionEngine({ id: 'test-engine' });

      expect(engine.id).toBe('test-engine');
      expect(engine.strategy).toBe(ExecutionStrategy.SEQUENTIAL);
      expect(engine.maxConcurrency).toBe(Infinity);
      expect(engine.globalTimeout).toBe(0);
      expect(engine.taskErrorPolicy).toBe('fail-fast');
      expect(engine.verbose).toBe(false);
      expect(engine.status).toBe(EngineStatus.IDLE);
    });

    it('should create an engine with custom config', () => {
      const engine = new ExecutionEngine({
        id: 'custom-engine',
        strategy: ExecutionStrategy.PARALLEL,
        maxConcurrency: 5,
        globalTimeout: 10000,
        taskErrorPolicy: 'continue',
        verbose: true,
      });

      expect(engine.strategy).toBe(ExecutionStrategy.PARALLEL);
      expect(engine.maxConcurrency).toBe(5);
      expect(engine.globalTimeout).toBe(10000);
      expect(engine.taskErrorPolicy).toBe('continue');
      expect(engine.verbose).toBe(true);
    });

    it('should throw EngineConfigError for empty id', () => {
      expect(() => new ExecutionEngine({ id: '' })).toThrow(EngineConfigError);
    });

    it('should throw EngineConfigError for invalid id characters', () => {
      expect(() => new ExecutionEngine({ id: 'has spaces' })).toThrow(EngineConfigError);
    });

    it('should throw EngineConfigError for non-positive maxConcurrency', () => {
      expect(() => new ExecutionEngine({ id: 'e', maxConcurrency: 0 })).toThrow(EngineConfigError);
      expect(() => new ExecutionEngine({ id: 'e', maxConcurrency: -1 })).toThrow(EngineConfigError);
    });

    it('should throw EngineConfigError for maxConcurrency exceeding upper bound', () => {
      expect(() => new ExecutionEngine({ id: 'e', maxConcurrency: 101 })).toThrow(
        EngineConfigError,
      );
    });

    it('should throw EngineConfigError for non-positive globalTimeout', () => {
      expect(() => new ExecutionEngine({ id: 'e', globalTimeout: 0 })).toThrow(EngineConfigError);
      expect(() => new ExecutionEngine({ id: 'e', globalTimeout: -1 })).toThrow(EngineConfigError);
    });

    it('should throw EngineConfigError for globalTimeout exceeding upper bound', () => {
      expect(() => new ExecutionEngine({ id: 'e', globalTimeout: 3_600_001 })).toThrow(
        EngineConfigError,
      );
    });
  });

  describe('task and agent management', () => {
    let engine: ExecutionEngine;

    beforeEach(() => {
      engine = new ExecutionEngine({ id: 'mgmt-engine' });
    });

    it('should add and retrieve tasks', () => {
      const task = createTask('t1', 'a1');
      engine.addTask(task);

      expect(engine.tasks.size).toBe(1);
      expect(engine.tasks.get('t1')).toBe(task);
    });

    it('should add and retrieve agents', () => {
      const agent = createAgent('a1');
      engine.addAgent(agent);

      expect(engine.agents.size).toBe(1);
      expect(engine.agents.get('a1')).toBe(agent);
    });

    it('should support fluent chaining', () => {
      const agent = createAgent('a1');
      const task = createTask('t1', 'a1');

      const result = engine.addAgent(agent).addTask(task);
      expect(result).toBe(engine);
    });

    it('should throw on duplicate task ID', () => {
      const task1 = createTask('t1', 'a1');
      const task2 = createTask('t1', 'a1');
      engine.addTask(task1);

      expect(() => engine.addTask(task2)).toThrow(EngineConfigError);
    });

    it('should throw on duplicate agent ID', () => {
      const agent1 = createAgent('a1');
      const agent2 = createAgent('a1');
      engine.addAgent(agent1);

      expect(() => engine.addAgent(agent2)).toThrow(EngineConfigError);
    });

    it('should remove tasks', () => {
      engine.addTask(createTask('t1', 'a1'));
      expect(engine.removeTask('t1')).toBe(true);
      expect(engine.tasks.size).toBe(0);
    });

    it('should return false when removing non-existent task', () => {
      expect(engine.removeTask('nope')).toBe(false);
    });

    it('should remove agents', () => {
      engine.addAgent(createAgent('a1'));
      expect(engine.removeAgent('a1')).toBe(true);
      expect(engine.agents.size).toBe(0);
    });

    it('should return false when removing non-existent agent', () => {
      expect(engine.removeAgent('nope')).toBe(false);
    });
  });

  describe('sequential execution', () => {
    it('should execute a single task', async () => {
      const engine = new ExecutionEngine({ id: 'seq-single' });
      const agent = createAgent('a1', 'result from a1');
      const task = createTask('t1', 'a1');

      engine.addAgent(agent).addTask(task);

      const result = await engine.run();

      expect(result.success).toBe(true);
      expect(result.engineId).toBe('seq-single');
      expect(result.strategy).toBe(ExecutionStrategy.SEQUENTIAL);
      expect(result.taskResults.size).toBe(1);
      expect(result.taskResults.get('t1')?.output).toBe('result from a1');
      expect(result.failedTasks.size).toBe(0);
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(engine.status).toBe(EngineStatus.COMPLETED);
    });

    it('should execute tasks in dependency order', async () => {
      const executionOrder: string[] = [];

      const provider1: LLMProvider = {
        name: 'mock-1',
        generateText: vi.fn().mockImplementation(async () => {
          executionOrder.push('t1');
          return {
            content: 'output-1',
            tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            finishReason: 'stop',
          };
        }),
      };
      const provider2: LLMProvider = {
        name: 'mock-2',
        generateText: vi.fn().mockImplementation(async () => {
          executionOrder.push('t2');
          return {
            content: 'output-2',
            tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            finishReason: 'stop',
          };
        }),
      };
      const provider3: LLMProvider = {
        name: 'mock-3',
        generateText: vi.fn().mockImplementation(async () => {
          executionOrder.push('t3');
          return {
            content: 'output-3',
            tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            finishReason: 'stop',
          };
        }),
      };

      const a1 = new Agent({ id: 'a1', role: 'R', goal: 'G' });
      a1.setLLMProvider(provider1);
      const a2 = new Agent({ id: 'a2', role: 'R', goal: 'G' });
      a2.setLLMProvider(provider2);
      const a3 = new Agent({ id: 'a3', role: 'R', goal: 'G' });
      a3.setLLMProvider(provider3);

      const t1 = createTask('t1', 'a1');
      const t2 = createTask('t2', 'a2', { dependencies: ['t1'] });
      const t3 = createTask('t3', 'a3', { dependencies: ['t2'] });

      const engine = new ExecutionEngine({ id: 'seq-deps' });
      engine.addAgent(a1).addAgent(a2).addAgent(a3);
      engine.addTask(t1).addTask(t2).addTask(t3);

      const result = await engine.run();

      expect(result.success).toBe(true);
      expect(executionOrder).toEqual(['t1', 't2', 't3']);
    });

    it('should inject dependency results as context', async () => {
      const capturedMessages: unknown[] = [];

      const provider2: LLMProvider = {
        name: 'mock-2',
        generateText: vi.fn().mockImplementation(async (messages: unknown[]) => {
          capturedMessages.push(...messages);
          return {
            content: 'output-2',
            tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            finishReason: 'stop',
          };
        }),
      };

      const a1 = createAgent('a1', 'first-output');
      const a2 = new Agent({ id: 'a2', role: 'R', goal: 'G' });
      a2.setLLMProvider(provider2);

      const t1 = createTask('t1', 'a1');
      const t2 = createTask('t2', 'a2', { dependencies: ['t1'] });

      const engine = new ExecutionEngine({ id: 'seq-ctx' });
      engine.addAgent(a1).addAgent(a2);
      engine.addTask(t1).addTask(t2);

      await engine.run();

      // The user message to a2 should contain dependency results
      const userMessage = capturedMessages.find(
        (m: unknown) => (m as { role: string }).role === 'user',
      ) as { content: string } | undefined;
      expect(userMessage).toBeDefined();
      expect(userMessage!.content).toContain('first-output');
    });
  });

  describe('parallel execution', () => {
    it('should execute independent tasks concurrently', async () => {
      const startTimes: Record<string, number> = {};
      const start = Date.now();

      const makeProvider = (id: string): LLMProvider => ({
        name: `mock-${id}`,
        generateText: vi.fn().mockImplementation(async () => {
          startTimes[id] = Date.now() - start;
          await new Promise((resolve) => setTimeout(resolve, 50));
          return {
            content: `output-${id}`,
            tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            finishReason: 'stop',
          };
        }),
      });

      const a1 = new Agent({ id: 'a1', role: 'R', goal: 'G' });
      a1.setLLMProvider(makeProvider('t1'));
      const a2 = new Agent({ id: 'a2', role: 'R', goal: 'G' });
      a2.setLLMProvider(makeProvider('t2'));

      const t1 = createTask('t1', 'a1');
      const t2 = createTask('t2', 'a2');

      const engine = new ExecutionEngine({
        id: 'par-concurrent',
        strategy: ExecutionStrategy.PARALLEL,
      });
      engine.addAgent(a1).addAgent(a2);
      engine.addTask(t1).addTask(t2);

      const result = await engine.run();

      expect(result.success).toBe(true);
      expect(result.taskResults.size).toBe(2);
      expect(result.strategy).toBe(ExecutionStrategy.PARALLEL);

      // Both tasks should have started near-simultaneously
      const timeDiff = Math.abs((startTimes['t1'] ?? 0) - (startTimes['t2'] ?? 0));
      expect(timeDiff).toBeLessThan(40);
    });

    it('should respect dependencies in parallel mode', async () => {
      const executionOrder: string[] = [];

      const makeProvider = (id: string): LLMProvider => ({
        name: `mock-${id}`,
        generateText: vi.fn().mockImplementation(async () => {
          executionOrder.push(id);
          return {
            content: `output-${id}`,
            tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            finishReason: 'stop',
          };
        }),
      });

      const a1 = new Agent({ id: 'a1', role: 'R', goal: 'G' });
      a1.setLLMProvider(makeProvider('t1'));
      const a2 = new Agent({ id: 'a2', role: 'R', goal: 'G' });
      a2.setLLMProvider(makeProvider('t2'));

      // t2 depends on t1, so t1 must run first even in parallel mode
      const t1 = createTask('t1', 'a1');
      const t2 = createTask('t2', 'a2', { dependencies: ['t1'] });

      const engine = new ExecutionEngine({
        id: 'par-deps',
        strategy: ExecutionStrategy.PARALLEL,
      });
      engine.addAgent(a1).addAgent(a2);
      engine.addTask(t1).addTask(t2);

      const result = await engine.run();

      expect(result.success).toBe(true);
      expect(executionOrder.indexOf('t1')).toBeLessThan(executionOrder.indexOf('t2'));
    });

    it('should respect maxConcurrency limit', async () => {
      let maxActive = 0;
      let currentActive = 0;

      const makeProvider = (id: string): LLMProvider => ({
        name: `mock-${id}`,
        generateText: vi.fn().mockImplementation(async () => {
          currentActive++;
          maxActive = Math.max(maxActive, currentActive);
          await new Promise((resolve) => setTimeout(resolve, 50));
          currentActive--;
          return {
            content: `output-${id}`,
            tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            finishReason: 'stop',
          };
        }),
      });

      const agent = new Agent({ id: 'a1', role: 'R', goal: 'G' });
      agent.setLLMProvider(makeProvider('shared'));

      const engine = new ExecutionEngine({
        id: 'par-limit',
        strategy: ExecutionStrategy.PARALLEL,
        maxConcurrency: 2,
      });
      engine.addAgent(agent);

      // Add 4 independent tasks all using the same agent
      for (let i = 1; i <= 4; i++) {
        engine.addTask(createTask(`t${String(i)}`, 'a1'));
      }

      const result = await engine.run();

      expect(result.success).toBe(true);
      expect(result.taskResults.size).toBe(4);
      expect(maxActive).toBeLessThanOrEqual(2);
    });
  });

  describe('retries', () => {
    it('should retry failed tasks up to configured retries', async () => {
      let callCount = 0;
      const provider: LLMProvider = {
        name: 'mock',
        generateText: vi.fn().mockImplementation(async () => {
          callCount++;
          if (callCount < 3) {
            throw new Error(`Attempt ${String(callCount)} failed`);
          }
          return {
            content: 'success on 3rd try',
            tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            finishReason: 'stop',
          };
        }),
      };

      const agent = new Agent({ id: 'a1', role: 'R', goal: 'G' });
      agent.setLLMProvider(provider);

      const task = createTask('t1', 'a1', { retries: 2 });

      const engine = new ExecutionEngine({ id: 'retry-test' });
      engine.addAgent(agent).addTask(task);

      const retryEvents: number[] = [];
      engine.on('engine:task:retry', (_eId, _tId, attempt) => {
        retryEvents.push(attempt);
      });

      const result = await engine.run();

      expect(result.success).toBe(true);
      expect(callCount).toBe(3);
      expect(retryEvents).toEqual([1, 2]);
    });

    it('should fail after exhausting all retries', async () => {
      const provider: LLMProvider = {
        name: 'mock',
        generateText: vi.fn().mockRejectedValue(new Error('always fails')),
      };

      const agent = new Agent({ id: 'a1', role: 'R', goal: 'G' });
      agent.setLLMProvider(provider);

      const task = createTask('t1', 'a1', { retries: 2 });

      const engine = new ExecutionEngine({ id: 'retry-exhaust' });
      engine.addAgent(agent).addTask(task);

      await expect(engine.run()).rejects.toThrow(EngineExecutionError);
      expect(provider.generateText).toHaveBeenCalledTimes(3); // 1 + 2 retries
    });
  });

  describe('timeouts', () => {
    it('should timeout individual tasks', async () => {
      const provider: LLMProvider = {
        name: 'mock',
        generateText: vi
          .fn()
          .mockImplementation(async () => new Promise((resolve) => setTimeout(resolve, 5000))),
      };

      const agent = new Agent({ id: 'a1', role: 'R', goal: 'G' });
      agent.setLLMProvider(provider);

      const task = createTask('t1', 'a1', { timeout: 50 });

      const engine = new ExecutionEngine({ id: 'timeout-test' });
      engine.addAgent(agent).addTask(task);

      const timeoutEvents: string[] = [];
      engine.on('engine:task:timeout', (_eId, taskId) => {
        timeoutEvents.push(taskId);
      });

      await expect(engine.run()).rejects.toThrow(EngineExecutionError);
      expect(timeoutEvents).toEqual(['t1']);
    });

    it('should not timeout if task completes in time', async () => {
      const agent = createAgent('a1', 'fast result');
      const task = createTask('t1', 'a1', { timeout: 5000 });

      const engine = new ExecutionEngine({ id: 'no-timeout' });
      engine.addAgent(agent).addTask(task);

      const result = await engine.run();
      expect(result.success).toBe(true);
    });
  });

  describe('cancellation', () => {
    it('should cancel execution and stop starting new tasks', async () => {
      const executedTasks: string[] = [];

      const slowProvider: LLMProvider = {
        name: 'slow',
        generateText: vi.fn().mockImplementation(async () => {
          executedTasks.push('t1');
          await new Promise((resolve) => setTimeout(resolve, 100));
          return {
            content: 'output',
            tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            finishReason: 'stop',
          };
        }),
      };

      const a1 = new Agent({ id: 'a1', role: 'R', goal: 'G' });
      a1.setLLMProvider(slowProvider);
      const a2 = createAgent('a2', 'should not run');

      const t1 = createTask('t1', 'a1');
      const t2 = createTask('t2', 'a2', { dependencies: ['t1'] });

      const engine = new ExecutionEngine({ id: 'cancel-test' });
      engine.addAgent(a1).addAgent(a2);
      engine.addTask(t1).addTask(t2);

      // Cancel during t1 execution
      engine.on('engine:task:start', () => {
        engine.cancel();
      });

      const result = await engine.run();

      expect(result.success).toBe(false);
      expect(engine.status).toBe(EngineStatus.CANCELLED);
    });

    it('should emit cancelled event on cancellation', async () => {
      const provider: LLMProvider = {
        name: 'mock',
        generateText: vi.fn().mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return {
            content: 'output',
            tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            finishReason: 'stop',
          };
        }),
      };

      const agent = new Agent({ id: 'a1', role: 'R', goal: 'G' });
      agent.setLLMProvider(provider);

      const t1 = createTask('t1', 'a1');
      const t2 = createTask('t2', 'a1', { dependencies: ['t1'] });

      const engine = new ExecutionEngine({ id: 'cancel-event' });
      engine.addAgent(agent);
      engine.addTask(t1).addTask(t2);

      let cancelledEmitted = false;
      engine.on('engine:cancelled', () => {
        cancelledEmitted = true;
      });

      engine.on('engine:task:start', () => {
        engine.cancel();
      });

      await engine.run();
      expect(cancelledEmitted).toBe(true);
    });

    it('should be a no-op if not running', () => {
      const engine = new ExecutionEngine({ id: 'cancel-idle' });
      // Should not throw
      engine.cancel();
      expect(engine.status).toBe(EngineStatus.IDLE);
    });
  });

  describe('error policies', () => {
    it('should stop on first error with fail-fast policy', async () => {
      const failProvider: LLMProvider = {
        name: 'fail',
        generateText: vi.fn().mockRejectedValue(new Error('task failed')),
      };

      const a1 = new Agent({ id: 'a1', role: 'R', goal: 'G' });
      a1.setLLMProvider(failProvider);
      const a2 = createAgent('a2', 'should not run');

      const t1 = createTask('t1', 'a1');
      const t2 = createTask('t2', 'a2');

      const engine = new ExecutionEngine({
        id: 'fail-fast',
        taskErrorPolicy: 'fail-fast',
      });
      engine.addAgent(a1).addAgent(a2);
      engine.addTask(t1).addTask(t2);

      await expect(engine.run()).rejects.toThrow(EngineExecutionError);
      expect(engine.status).toBe(EngineStatus.ERROR);
    });

    it('should continue on error with continue policy', async () => {
      const failProvider: LLMProvider = {
        name: 'fail',
        generateText: vi.fn().mockRejectedValue(new Error('task failed')),
      };

      const a1 = new Agent({ id: 'a1', role: 'R', goal: 'G' });
      a1.setLLMProvider(failProvider);
      const a2 = createAgent('a2', 'success output');

      const t1 = createTask('t1', 'a1');
      const t2 = createTask('t2', 'a2');

      const engine = new ExecutionEngine({
        id: 'continue-policy',
        taskErrorPolicy: 'continue',
      });
      engine.addAgent(a1).addAgent(a2);
      engine.addTask(t1).addTask(t2);

      const result = await engine.run();

      expect(result.success).toBe(false);
      expect(result.taskResults.size).toBe(1);
      expect(result.taskResults.get('t2')?.output).toBe('success output');
      expect(result.failedTasks.size).toBe(1);
      expect(result.failedTasks.has('t1')).toBe(true);
      expect(engine.status).toBe(EngineStatus.ERROR);
    });

    it('should skip dependent tasks when a dependency fails in continue mode', async () => {
      const failProvider: LLMProvider = {
        name: 'fail',
        generateText: vi.fn().mockRejectedValue(new Error('task failed')),
      };

      const a1 = new Agent({ id: 'a1', role: 'R', goal: 'G' });
      a1.setLLMProvider(failProvider);
      const a2 = createAgent('a2', 'should be skipped');

      const t1 = createTask('t1', 'a1');
      const t2 = createTask('t2', 'a2', { dependencies: ['t1'] });

      const engine = new ExecutionEngine({
        id: 'skip-deps',
        taskErrorPolicy: 'continue',
      });
      engine.addAgent(a1).addAgent(a2);
      engine.addTask(t1).addTask(t2);

      const result = await engine.run();

      expect(result.success).toBe(false);
      expect(result.failedTasks.size).toBe(2);
      expect(result.failedTasks.has('t1')).toBe(true);
      expect(result.failedTasks.has('t2')).toBe(true);
    });
  });

  describe('middleware hooks', () => {
    it('should call beforeTask hooks before execution', async () => {
      const hookLog: string[] = [];

      const engine = new ExecutionEngine({ id: 'hook-before' });
      const agent = createAgent('a1');
      const task = createTask('t1', 'a1');

      engine.addAgent(agent).addTask(task);
      engine.beforeTask((t, a) => {
        hookLog.push(`before:${t.id}:${a.id}`);
      });

      await engine.run();

      expect(hookLog).toEqual(['before:t1:a1']);
    });

    it('should call afterTask hooks after successful execution', async () => {
      const hookLog: string[] = [];

      const engine = new ExecutionEngine({ id: 'hook-after' });
      const agent = createAgent('a1', 'result');
      const task = createTask('t1', 'a1');

      engine.addAgent(agent).addTask(task);
      engine.afterTask((t, a, r) => {
        hookLog.push(`after:${t.id}:${a.id}:${r.output}`);
      });

      await engine.run();

      expect(hookLog).toEqual(['after:t1:a1:result']);
    });

    it('should call onTaskError hooks on failure', async () => {
      const hookLog: string[] = [];

      const failProvider: LLMProvider = {
        name: 'fail',
        generateText: vi.fn().mockRejectedValue(new Error('oops')),
      };
      const agent = new Agent({ id: 'a1', role: 'R', goal: 'G' });
      agent.setLLMProvider(failProvider);

      const engine = new ExecutionEngine({ id: 'hook-error' });
      engine.addAgent(agent).addTask(createTask('t1', 'a1'));
      engine.onTaskError((t, err) => {
        hookLog.push(`error:${t.id}:${err.message}`);
      });

      await expect(engine.run()).rejects.toThrow();
      expect(hookLog.length).toBe(1);
      expect(hookLog[0]).toContain('error:t1:');
      expect(hookLog[0]).toContain('oops');
    });

    it('should support multiple hooks in order', async () => {
      const hookLog: string[] = [];

      const engine = new ExecutionEngine({ id: 'multi-hooks' });
      engine.addAgent(createAgent('a1'));
      engine.addTask(createTask('t1', 'a1'));

      engine.beforeTask(() => {
        hookLog.push('before-1');
      });
      engine.beforeTask(() => {
        hookLog.push('before-2');
      });
      engine.afterTask(() => {
        hookLog.push('after-1');
      });
      engine.afterTask(() => {
        hookLog.push('after-2');
      });

      await engine.run();

      expect(hookLog).toEqual(['before-1', 'before-2', 'after-1', 'after-2']);
    });

    it('should support async hooks', async () => {
      const hookLog: string[] = [];

      const engine = new ExecutionEngine({ id: 'async-hooks' });
      engine.addAgent(createAgent('a1'));
      engine.addTask(createTask('t1', 'a1'));

      engine.beforeTask(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        hookLog.push('async-before');
      });
      engine.afterTask(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        hookLog.push('async-after');
      });

      await engine.run();

      expect(hookLog).toEqual(['async-before', 'async-after']);
    });
  });

  describe('event emission', () => {
    it('should emit engine lifecycle events', async () => {
      const events: string[] = [];

      const engine = new ExecutionEngine({ id: 'events-test' });
      engine.addAgent(createAgent('a1'));
      engine.addTask(createTask('t1', 'a1'));

      engine.on('engine:start', () => events.push('start'));
      engine.on('engine:complete', () => events.push('complete'));
      engine.on('engine:status-changed', (_id, status) => events.push(`status:${status}`));

      await engine.run();

      expect(events).toContain('start');
      expect(events).toContain('complete');
      expect(events).toContain('status:running');
      expect(events).toContain('status:completed');
    });

    it('should emit task lifecycle events', async () => {
      const events: string[] = [];

      const engine = new ExecutionEngine({ id: 'task-events' });
      engine.addAgent(createAgent('a1'));
      engine.addTask(createTask('t1', 'a1'));

      engine.on('engine:task:start', (_eId, taskId, agentId) => {
        events.push(`task:start:${taskId}:${agentId}`);
      });
      engine.on('engine:task:complete', (_eId, taskId) => {
        events.push(`task:complete:${taskId}`);
      });

      await engine.run();

      expect(events).toEqual(['task:start:t1:a1', 'task:complete:t1']);
    });

    it('should emit error events on failure', async () => {
      const events: string[] = [];

      const failProvider: LLMProvider = {
        name: 'fail',
        generateText: vi.fn().mockRejectedValue(new Error('boom')),
      };
      const agent = new Agent({ id: 'a1', role: 'R', goal: 'G' });
      agent.setLLMProvider(failProvider);

      const engine = new ExecutionEngine({ id: 'error-events' });
      engine.addAgent(agent).addTask(createTask('t1', 'a1'));

      engine.on('engine:task:error', (_eId, taskId) => events.push(`task:error:${taskId}`));
      engine.on('engine:error', () => events.push('engine:error'));

      await expect(engine.run()).rejects.toThrow();
      expect(events).toContain('task:error:t1');
      expect(events).toContain('engine:error');
    });

    it('should support once listeners', async () => {
      let callCount = 0;

      const engine = new ExecutionEngine({ id: 'once-test' });
      engine.addAgent(createAgent('a1'));
      engine.addTask(createTask('t1', 'a1'));
      engine.addTask(createTask('t2', 'a1'));

      engine.once('engine:task:start', () => {
        callCount++;
      });

      await engine.run();

      expect(callCount).toBe(1);
    });

    it('should support removing listeners', async () => {
      let callCount = 0;

      const listener = (): void => {
        callCount++;
      };
      const engine = new ExecutionEngine({ id: 'off-test' });
      engine.addAgent(createAgent('a1'));
      engine.addTask(createTask('t1', 'a1'));

      engine.on('engine:task:start', listener);
      engine.off('engine:task:start', listener);

      await engine.run();

      expect(callCount).toBe(0);
    });
  });

  describe('validation', () => {
    it('should throw when running with no tasks', async () => {
      const engine = new ExecutionEngine({ id: 'no-tasks' });
      engine.addAgent(createAgent('a1'));

      await expect(engine.run()).rejects.toThrow(EngineConfigError);
    });

    it('should throw when running with no agents', async () => {
      const engine = new ExecutionEngine({ id: 'no-agents' });
      engine.addTask(createTask('t1', 'a1'));

      await expect(engine.run()).rejects.toThrow(EngineConfigError);
    });

    it('should throw when task references unknown agent', async () => {
      const engine = new ExecutionEngine({ id: 'bad-agent' });
      engine.addAgent(createAgent('a1'));
      engine.addTask(createTask('t1', 'a-nonexistent'));

      await expect(engine.run()).rejects.toThrow(EngineConfigError);
    });

    it('should throw when task has unassigned agent', async () => {
      const engine = new ExecutionEngine({ id: 'unassigned' });
      engine.addAgent(createAgent('a1'));
      engine.addTask(new Task({ id: 't1', description: 'no agent' }));

      await expect(engine.run()).rejects.toThrow(EngineConfigError);
    });

    it('should throw when task depends on unknown task', async () => {
      const engine = new ExecutionEngine({ id: 'bad-dep' });
      engine.addAgent(createAgent('a1'));
      engine.addTask(createTask('t1', 'a1', { dependencies: ['nonexistent'] }));

      await expect(engine.run()).rejects.toThrow(EngineConfigError);
    });

    it('should throw when task depends on itself', async () => {
      const engine = new ExecutionEngine({ id: 'self-dep' });
      engine.addAgent(createAgent('a1'));
      engine.addTask(createTask('t1', 'a1', { dependencies: ['t1'] }));

      await expect(engine.run()).rejects.toThrow(EngineConfigError);
    });

    it('should detect circular dependencies', async () => {
      const engine = new ExecutionEngine({ id: 'circular' });
      engine.addAgent(createAgent('a1'));
      engine.addTask(createTask('t1', 'a1', { dependencies: ['t2'] }));
      engine.addTask(createTask('t2', 'a1', { dependencies: ['t1'] }));

      await expect(engine.run()).rejects.toThrow(EngineConfigError);
    });

    it('should throw when run is called while already running', async () => {
      const provider: LLMProvider = {
        name: 'slow',
        generateText: vi
          .fn()
          .mockImplementation(async () => new Promise((resolve) => setTimeout(resolve, 200))),
      };
      const agent = new Agent({ id: 'a1', role: 'R', goal: 'G' });
      agent.setLLMProvider(provider);

      const engine = new ExecutionEngine({ id: 'double-run' });
      engine.addAgent(agent).addTask(createTask('t1', 'a1'));

      const firstRun = engine.run();
      await expect(engine.run()).rejects.toThrow(EngineExecutionError);

      engine.cancel();
      await firstRun.catch(() => {});
    });

    it('should prevent modifications while running', async () => {
      const provider: LLMProvider = {
        name: 'slow',
        generateText: vi
          .fn()
          .mockImplementation(async () => new Promise((resolve) => setTimeout(resolve, 200))),
      };
      const agent = new Agent({ id: 'a1', role: 'R', goal: 'G' });
      agent.setLLMProvider(provider);

      const engine = new ExecutionEngine({ id: 'locked' });
      engine.addAgent(agent).addTask(createTask('t1', 'a1'));

      const runPromise = engine.run();

      // Wait for engine to start
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(() => engine.addTask(createTask('t2', 'a1'))).toThrow(EngineConfigError);
      expect(() => engine.addAgent(createAgent('a2'))).toThrow(EngineConfigError);
      expect(() => engine.removeTask('t1')).toThrow(EngineConfigError);
      expect(() => engine.removeAgent('a1')).toThrow(EngineConfigError);
      expect(() => {
        engine.reset();
      }).toThrow(EngineConfigError);

      engine.cancel();
      await runPromise.catch(() => {});
    });
  });

  describe('reset', () => {
    it('should reset engine to idle and clear tasks/agents', async () => {
      const engine = new ExecutionEngine({ id: 'reset-test' });
      engine.addAgent(createAgent('a1'));
      engine.addTask(createTask('t1', 'a1'));

      await engine.run();
      expect(engine.status).toBe(EngineStatus.COMPLETED);

      engine.reset();

      expect(engine.status).toBe(EngineStatus.IDLE);
      expect(engine.tasks.size).toBe(0);
      expect(engine.agents.size).toBe(0);
    });

    it('should throw when resetting while running', async () => {
      const provider: LLMProvider = {
        name: 'slow',
        generateText: vi
          .fn()
          .mockImplementation(async () => new Promise((resolve) => setTimeout(resolve, 200))),
      };
      const agent = new Agent({ id: 'a1', role: 'R', goal: 'G' });
      agent.setLLMProvider(provider);

      const engine = new ExecutionEngine({ id: 'reset-running' });
      engine.addAgent(agent).addTask(createTask('t1', 'a1'));

      const runPromise = engine.run();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(() => {
        engine.reset();
      }).toThrow(EngineConfigError);

      engine.cancel();
      await runPromise.catch(() => {});
    });

    it('should allow re-running after reset', async () => {
      const agent = createAgent('a1', 'first-run');

      const engine = new ExecutionEngine({ id: 'rerun-test' });
      engine.addAgent(agent);
      engine.addTask(createTask('t1', 'a1'));

      const result1 = await engine.run();
      expect(result1.success).toBe(true);

      engine.reset();

      // Re-add tasks and agents for second run
      const agent2 = createAgent('a2', 'second-run');
      engine.addAgent(agent2);
      engine.addTask(createTask('t2', 'a2'));

      const result2 = await engine.run();
      expect(result2.success).toBe(true);
      expect(result2.taskResults.get('t2')?.output).toBe('second-run');
    });
  });

  describe('task status management', () => {
    it('should transition task status through lifecycle', async () => {
      const statusChanges: string[] = [];

      const agent = createAgent('a1');
      const task = createTask('t1', 'a1');

      task.on('task:status-changed', (_id, status) => {
        statusChanges.push(status);
      });

      const engine = new ExecutionEngine({ id: 'status-lifecycle' });
      engine.addAgent(agent).addTask(task);

      await engine.run();

      expect(statusChanges).toContain(TaskStatus.RUNNING);
      expect(statusChanges).toContain(TaskStatus.COMPLETED);
    });

    it('should set task to FAILED status on error', async () => {
      const failProvider: LLMProvider = {
        name: 'fail',
        generateText: vi.fn().mockRejectedValue(new Error('fail')),
      };
      const agent = new Agent({ id: 'a1', role: 'R', goal: 'G' });
      agent.setLLMProvider(failProvider);

      const task = createTask('t1', 'a1');

      const engine = new ExecutionEngine({ id: 'status-fail' });
      engine.addAgent(agent).addTask(task);

      await expect(engine.run()).rejects.toThrow();
      expect(task.status).toBe(TaskStatus.FAILED);
    });
  });

  describe('parallel execution - continue policy', () => {
    it('should continue executing independent tasks when one fails', async () => {
      const failProvider: LLMProvider = {
        name: 'fail',
        generateText: vi.fn().mockRejectedValue(new Error('fails')),
      };
      const a1 = new Agent({ id: 'a1', role: 'R', goal: 'G' });
      a1.setLLMProvider(failProvider);
      const a2 = createAgent('a2', 'success');

      const t1 = createTask('t1', 'a1');
      const t2 = createTask('t2', 'a2');

      const engine = new ExecutionEngine({
        id: 'par-continue',
        strategy: ExecutionStrategy.PARALLEL,
        taskErrorPolicy: 'continue',
      });
      engine.addAgent(a1).addAgent(a2);
      engine.addTask(t1).addTask(t2);

      const result = await engine.run();

      expect(result.success).toBe(false);
      expect(result.taskResults.get('t2')?.output).toBe('success');
      expect(result.failedTasks.has('t1')).toBe(true);
    });

    it('should fail-fast in parallel mode when policy is fail-fast', async () => {
      const failProvider: LLMProvider = {
        name: 'fail',
        generateText: vi.fn().mockRejectedValue(new Error('quick fail')),
      };

      const a1 = new Agent({ id: 'a1', role: 'R', goal: 'G' });
      a1.setLLMProvider(failProvider);

      const engine = new ExecutionEngine({
        id: 'par-failfast',
        strategy: ExecutionStrategy.PARALLEL,
        taskErrorPolicy: 'fail-fast',
      });
      engine.addAgent(a1);
      engine.addTask(createTask('t1', 'a1'));

      await expect(engine.run()).rejects.toThrow(EngineExecutionError);
    });
  });

  describe('complex dependency graphs', () => {
    it('should handle diamond dependency pattern', async () => {
      const executionOrder: string[] = [];

      const makeProvider = (id: string): LLMProvider => ({
        name: `mock-${id}`,
        generateText: vi.fn().mockImplementation(async () => {
          executionOrder.push(id);
          return {
            content: `output-${id}`,
            tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            finishReason: 'stop',
          };
        }),
      });

      // Diamond: t1 → t2, t1 → t3, t2 → t4, t3 → t4
      const agents = ['a1', 'a2', 'a3', 'a4'].map((id) => {
        const agent = new Agent({ id, role: 'R', goal: 'G' });
        agent.setLLMProvider(makeProvider(id.replace('a', 't')));
        return agent;
      });

      const t1 = createTask('t1', 'a1');
      const t2 = createTask('t2', 'a2', { dependencies: ['t1'] });
      const t3 = createTask('t3', 'a3', { dependencies: ['t1'] });
      const t4 = createTask('t4', 'a4', { dependencies: ['t2', 't3'] });

      const engine = new ExecutionEngine({
        id: 'diamond',
        strategy: ExecutionStrategy.PARALLEL,
      });
      for (const agent of agents) engine.addAgent(agent);
      engine.addTask(t1).addTask(t2).addTask(t3).addTask(t4);

      const result = await engine.run();

      expect(result.success).toBe(true);
      expect(executionOrder.indexOf('t1')).toBeLessThan(executionOrder.indexOf('t2'));
      expect(executionOrder.indexOf('t1')).toBeLessThan(executionOrder.indexOf('t3'));
      expect(executionOrder.indexOf('t2')).toBeLessThan(executionOrder.indexOf('t4'));
      expect(executionOrder.indexOf('t3')).toBeLessThan(executionOrder.indexOf('t4'));
    });
  });
});
