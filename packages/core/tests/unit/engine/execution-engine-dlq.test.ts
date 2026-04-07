/**
 * Unit tests for DeadLetterQueue integration with ExecutionEngine.
 *
 * Tests cover:
 * - DLQ auto-enqueue after retry exhaustion
 * - DLQ configuration (boolean and object)
 * - engine:task:dead-lettered event emission
 * - DLQ accessor on the engine
 * - DLQ entries contain correct attempts and context
 * - DLQ disabled by default (no enqueue when not configured)
 * - continue policy: multiple tasks dead-lettered
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Agent } from '../../../src/agent/agent.js';
import { ExecutionEngine } from '../../../src/engine/execution-engine.js';
import { ExecutionStrategy } from '../../../src/engine/types.js';
import type { EngineEventMap } from '../../../src/engine/types.js';
import { Task } from '../../../src/task/task.js';
import type { LLMProvider, LLMResponse } from '../../../src/types/index.js';

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

function createFailingLLMProvider(errorMsg: string): LLMProvider {
  return {
    name: 'failing-provider',
    generateText: vi.fn().mockRejectedValue(new Error(errorMsg)),
  };
}

function createAgent(id: string, response?: string): Agent {
  const agent = new Agent({ id, role: 'Test Role', goal: 'Test Goal' });
  agent.setLLMProvider(createMockLLMProvider(response));
  return agent;
}

function createFailingAgent(id: string, errorMsg: string): Agent {
  const agent = new Agent({ id, role: 'Test Role', goal: 'Test Goal' });
  agent.setLLMProvider(createFailingLLMProvider(errorMsg));
  return agent;
}

function createTask(
  id: string,
  agentId: string,
  options?: { dependencies?: string[]; retries?: number; timeout?: number },
): Task {
  return new Task({
    id,
    description: `Task ${id} description`,
    agentId,
    ...(options?.dependencies !== undefined ? { dependencies: options.dependencies } : {}),
    ...(options?.retries !== undefined ? { retries: options.retries } : {}),
    ...(options?.timeout !== undefined ? { timeout: options.timeout } : {}),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExecutionEngine — DeadLetterQueue integration', () => {
  describe('configuration', () => {
    it('should not create a DLQ by default', () => {
      const engine = new ExecutionEngine({ id: 'test-engine' });
      expect(engine.deadLetterQueue).toBeUndefined();
    });

    it('should create a DLQ with default config when true', () => {
      const engine = new ExecutionEngine({ id: 'test-engine', deadLetterQueue: true });
      expect(engine.deadLetterQueue).toBeDefined();
      expect(engine.deadLetterQueue!.maxSize).toBe(1_000);
      expect(engine.deadLetterQueue!.overflowPolicy).toBe('drop-oldest');
    });

    it('should create a DLQ with custom config', () => {
      const engine = new ExecutionEngine({
        id: 'test-engine',
        deadLetterQueue: { maxSize: 50, overflowPolicy: 'reject' },
      });
      expect(engine.deadLetterQueue).toBeDefined();
      expect(engine.deadLetterQueue!.maxSize).toBe(50);
      expect(engine.deadLetterQueue!.overflowPolicy).toBe('reject');
    });

    it('should not create a DLQ when false', () => {
      const engine = new ExecutionEngine({ id: 'test-engine', deadLetterQueue: false });
      expect(engine.deadLetterQueue).toBeUndefined();
    });
  });

  describe('auto-enqueue on retry exhaustion (sequential)', () => {
    let engine: ExecutionEngine;

    beforeEach(() => {
      engine = new ExecutionEngine({
        id: 'dlq-engine',
        strategy: ExecutionStrategy.SEQUENTIAL,
        taskErrorPolicy: 'continue',
        deadLetterQueue: true,
      });
    });

    it('should enqueue a failed task into the DLQ after all retries', async () => {
      const failAgent = createFailingAgent('agent1', 'task failed');
      const task = createTask('task1', 'agent1', { retries: 2 });

      engine.addAgent(failAgent);
      engine.addTask(task);

      const result = await engine.run();

      expect(result.success).toBe(false);
      expect(result.failedTasks.has('task1')).toBe(true);

      const dlq = engine.deadLetterQueue!;
      expect(dlq.size).toBe(1);
      expect(dlq.has('task1')).toBe(true);

      const entry = dlq.get('task1')!;
      expect(entry.task.id).toBe('task1');
      expect(entry.attempts).toBe(3); // 1 initial + 2 retries
      expect(entry.error.message).toContain('task failed');
    });

    it('should enqueue a task that fails without retries', async () => {
      const failAgent = createFailingAgent('agent1', 'immediate fail');
      const task = createTask('task1', 'agent1'); // no retries

      engine.addAgent(failAgent);
      engine.addTask(task);

      const result = await engine.run();

      expect(result.success).toBe(false);
      const dlq = engine.deadLetterQueue!;
      expect(dlq.size).toBe(1);
      expect(dlq.get('task1')!.attempts).toBe(1);
    });

    it('should not enqueue successful tasks', async () => {
      const agent = createAgent('agent1', 'success');
      const task = createTask('task1', 'agent1');

      engine.addAgent(agent);
      engine.addTask(task);

      const result = await engine.run();

      expect(result.success).toBe(true);
      expect(engine.deadLetterQueue!.size).toBe(0);
    });

    it('should enqueue multiple failed tasks', async () => {
      const failAgent = createFailingAgent('agent1', 'fail');
      const task1 = createTask('task1', 'agent1');
      const task2 = createTask('task2', 'agent1');

      engine.addAgent(failAgent);
      engine.addTask(task1);
      engine.addTask(task2);

      const result = await engine.run();

      expect(result.success).toBe(false);
      const dlq = engine.deadLetterQueue!;
      expect(dlq.size).toBe(2);
      expect(dlq.has('task1')).toBe(true);
      expect(dlq.has('task2')).toBe(true);
    });

    it('should include context from completed tasks in DLQ entry', async () => {
      const successAgent = createAgent('agent-ok', 'output-from-dep');
      const failAgent = createFailingAgent('agent-fail', 'downstream fail');

      const depTask = createTask('dep-task', 'agent-ok');
      const mainTask = createTask('main-task', 'agent-fail', { dependencies: ['dep-task'] });

      engine.addAgent(successAgent);
      engine.addAgent(failAgent);
      engine.addTask(depTask);
      engine.addTask(mainTask);

      const result = await engine.run();

      expect(result.success).toBe(false);
      const dlq = engine.deadLetterQueue!;
      expect(dlq.has('main-task')).toBe(true);

      const entry = dlq.get('main-task')!;
      expect(entry.context).toBeDefined();
      // The context should include the completed dependency result
      expect(entry.context!['dep-task']).toBeDefined();
    });
  });

  describe('auto-enqueue on retry exhaustion (parallel)', () => {
    it('should enqueue failed tasks in parallel strategy', async () => {
      const engine = new ExecutionEngine({
        id: 'parallel-dlq',
        strategy: ExecutionStrategy.PARALLEL,
        taskErrorPolicy: 'continue',
        deadLetterQueue: true,
      });

      const failAgent = createFailingAgent('agent1', 'parallel fail');
      const task1 = createTask('task1', 'agent1', { retries: 1 });
      const task2 = createTask('task2', 'agent1', { retries: 1 });

      engine.addAgent(failAgent);
      engine.addTask(task1);
      engine.addTask(task2);

      const result = await engine.run();

      expect(result.success).toBe(false);
      const dlq = engine.deadLetterQueue!;
      expect(dlq.size).toBe(2);
      expect(dlq.has('task1')).toBe(true);
      expect(dlq.has('task2')).toBe(true);
    });
  });

  describe('engine:task:dead-lettered event', () => {
    it('should emit dead-lettered event when task is enqueued', async () => {
      const engine = new ExecutionEngine({
        id: 'dlq-events',
        taskErrorPolicy: 'continue',
        deadLetterQueue: true,
      });

      const listener = vi.fn<Parameters<EngineEventMap['engine:task:dead-lettered']>>();
      engine.on('engine:task:dead-lettered', listener);

      const failAgent = createFailingAgent('agent1', 'event test fail');
      const task = createTask('task1', 'agent1', { retries: 1 });

      engine.addAgent(failAgent);
      engine.addTask(task);

      await engine.run();

      expect(listener).toHaveBeenCalledOnce();
      expect(listener).toHaveBeenCalledWith(
        'dlq-events',
        'task1',
        expect.objectContaining({ message: expect.stringContaining('event test fail') }),
        2, // 1 initial + 1 retry
      );
    });

    it('should not emit dead-lettered event when DLQ is not configured', async () => {
      const engine = new ExecutionEngine({
        id: 'no-dlq',
        taskErrorPolicy: 'continue',
      });

      const listener = vi.fn();
      engine.on('engine:task:dead-lettered', listener);

      const failAgent = createFailingAgent('agent1', 'no dlq');
      const task = createTask('task1', 'agent1');

      engine.addAgent(failAgent);
      engine.addTask(task);

      await engine.run();

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('DLQ not affected by successful tasks', () => {
    it('should keep DLQ empty when all tasks succeed', async () => {
      const engine = new ExecutionEngine({
        id: 'all-success',
        deadLetterQueue: true,
      });

      const agent = createAgent('agent1', 'great output');
      const task = createTask('task1', 'agent1');

      engine.addAgent(agent);
      engine.addTask(task);

      const result = await engine.run();

      expect(result.success).toBe(true);
      expect(engine.deadLetterQueue!.isEmpty).toBe(true);
    });
  });

  describe('fail-fast policy with DLQ', () => {
    it('should enqueue the failing task even with fail-fast', async () => {
      const engine = new ExecutionEngine({
        id: 'failfast-dlq',
        taskErrorPolicy: 'fail-fast',
        deadLetterQueue: true,
      });

      const failAgent = createFailingAgent('agent1', 'fast fail');
      const task = createTask('task1', 'agent1');

      engine.addAgent(failAgent);
      engine.addTask(task);

      await expect(engine.run()).rejects.toThrow();

      const dlq = engine.deadLetterQueue!;
      expect(dlq.size).toBe(1);
      expect(dlq.has('task1')).toBe(true);
    });
  });
});
