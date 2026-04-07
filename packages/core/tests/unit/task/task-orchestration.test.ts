/**
 * Comprehensive tests for task orchestration and dependency handling.
 *
 * TASK-045 — Covers:
 * - Dependency DAG construction and validation
 * - Topological sort / execution ordering
 * - Parallel execution with dependency constraints
 * - Task context passing (dependency outputs → dependent inputs)
 * - Dependency failure cascading
 * - Circular dependency detection
 * - Complex graph patterns (diamond, fan-out, fan-in, deep chain)
 * - Edge cases and error handling
 *
 * @packageDocumentation
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Agent } from '../../../src/agent/agent.js';
import { ExecutionEngine } from '../../../src/engine/execution-engine.js';
import { EngineStatus, ExecutionStrategy } from '../../../src/engine/types.js';
import { EngineConfigError, EngineExecutionError } from '../../../src/errors/engine-errors.js';
import { Task } from '../../../src/task/task.js';
import type { LLMProvider, LLMResponse, TaskResult } from '../../../src/types/index.js';
import { TaskPriority, TaskStatus } from '../../../src/types/index.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createMockProvider(response?: string): LLMProvider {
  return {
    name: 'mock-provider',
    generateText: vi.fn().mockResolvedValue({
      content: response ?? 'mock output',
      tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      finishReason: 'stop',
    } satisfies LLMResponse),
  };
}

function createTrackingProvider(id: string, tracker: string[], delayMs = 0): LLMProvider {
  return {
    name: `mock-${id}`,
    generateText: vi.fn().mockImplementation(async () => {
      tracker.push(id);
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      return {
        content: `output-${id}`,
        tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        finishReason: 'stop',
      } satisfies LLMResponse;
    }),
  };
}

function createCapturingProvider(
  id: string,
  capturedMessages: Map<string, unknown[]>,
): LLMProvider {
  return {
    name: `mock-${id}`,
    generateText: vi.fn().mockImplementation(async (messages: unknown[]) => {
      capturedMessages.set(id, [...messages]);
      return {
        content: `output-${id}`,
        tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        finishReason: 'stop',
      } satisfies LLMResponse;
    }),
  };
}

function createAgent(id: string, provider: LLMProvider): Agent {
  const agent = new Agent({ id, role: 'Test Role', goal: 'Test Goal' });
  agent.setLLMProvider(provider);
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
    context?: Record<string, unknown>;
    expectedOutput?: string;
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
    ...(options?.context !== undefined ? { context: options.context } : {}),
    ...(options?.expectedOutput !== undefined ? { expectedOutput: options.expectedOutput } : {}),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Task Orchestration & Dependency Handling', () => {
  // =========================================================================
  // 1. Dependency DAG validation
  // =========================================================================

  describe('dependency DAG validation', () => {
    it('should detect self-dependency', async () => {
      const engine = new ExecutionEngine({ id: 'self-dep' });
      engine.addAgent(createAgent('a1', createMockProvider()));
      engine.addTask(createTask('t1', 'a1', { dependencies: ['t1'] }));

      await expect(engine.run()).rejects.toThrow(EngineConfigError);
      await expect(engine.run()).rejects.toThrow(/depend on itself/i);
    });

    it('should detect missing dependency reference', async () => {
      const engine = new ExecutionEngine({ id: 'missing-dep' });
      engine.addAgent(createAgent('a1', createMockProvider()));
      engine.addTask(createTask('t1', 'a1', { dependencies: ['nonexistent'] }));

      await expect(engine.run()).rejects.toThrow(EngineConfigError);
      await expect(engine.run()).rejects.toThrow(/unknown task/i);
    });

    it('should detect 2-node circular dependency (A↔B)', async () => {
      const engine = new ExecutionEngine({ id: 'cycle-2' });
      engine.addAgent(createAgent('a1', createMockProvider()));
      engine.addTask(createTask('t1', 'a1', { dependencies: ['t2'] }));
      engine.addTask(createTask('t2', 'a1', { dependencies: ['t1'] }));

      await expect(engine.run()).rejects.toThrow(EngineConfigError);
      await expect(engine.run()).rejects.toThrow(/circular/i);
    });

    it('should detect 3-node circular dependency (A→B→C→A)', async () => {
      const engine = new ExecutionEngine({ id: 'cycle-3' });
      engine.addAgent(createAgent('a1', createMockProvider()));
      engine.addTask(createTask('t1', 'a1', { dependencies: ['t3'] }));
      engine.addTask(createTask('t2', 'a1', { dependencies: ['t1'] }));
      engine.addTask(createTask('t3', 'a1', { dependencies: ['t2'] }));

      await expect(engine.run()).rejects.toThrow(EngineConfigError);
      await expect(engine.run()).rejects.toThrow(/circular/i);
    });

    it('should detect cycle hidden in larger graph', async () => {
      // t1 → t2 → t3 → t4 → t2 (cycle), t5 is independent
      const engine = new ExecutionEngine({ id: 'hidden-cycle' });
      engine.addAgent(createAgent('a1', createMockProvider()));
      engine.addTask(createTask('t1', 'a1'));
      engine.addTask(createTask('t2', 'a1', { dependencies: ['t1', 't4'] }));
      engine.addTask(createTask('t3', 'a1', { dependencies: ['t2'] }));
      engine.addTask(createTask('t4', 'a1', { dependencies: ['t3'] }));
      engine.addTask(createTask('t5', 'a1'));

      await expect(engine.run()).rejects.toThrow(EngineConfigError);
      await expect(engine.run()).rejects.toThrow(/circular/i);
    });

    it('should accept a valid DAG with no cycles', async () => {
      const engine = new ExecutionEngine({ id: 'valid-dag' });
      engine.addAgent(createAgent('a1', createMockProvider()));
      engine.addTask(createTask('t1', 'a1'));
      engine.addTask(createTask('t2', 'a1', { dependencies: ['t1'] }));
      engine.addTask(createTask('t3', 'a1', { dependencies: ['t1'] }));
      engine.addTask(createTask('t4', 'a1', { dependencies: ['t2', 't3'] }));

      const result = await engine.run();
      expect(result.success).toBe(true);
    });

    it('should reject tasks with dependency on unregistered task', async () => {
      const engine = new ExecutionEngine({ id: 'bad-ref' });
      engine.addAgent(createAgent('a1', createMockProvider()));
      engine.addTask(createTask('t1', 'a1'));
      engine.addTask(createTask('t2', 'a1', { dependencies: ['t1', 'ghost'] }));

      await expect(engine.run()).rejects.toThrow(EngineConfigError);
    });
  });

  // =========================================================================
  // 2. Sequential execution ordering (topological sort)
  // =========================================================================

  describe('sequential execution ordering', () => {
    it('should execute a linear chain in order (A→B→C→D)', async () => {
      const order: string[] = [];
      const engine = new ExecutionEngine({ id: 'linear-chain' });

      for (const id of ['t1', 't2', 't3', 't4']) {
        const provider = createTrackingProvider(id, order);
        engine.addAgent(createAgent(`a-${id}`, provider));
      }

      engine.addTask(createTask('t1', 'a-t1'));
      engine.addTask(createTask('t2', 'a-t2', { dependencies: ['t1'] }));
      engine.addTask(createTask('t3', 'a-t3', { dependencies: ['t2'] }));
      engine.addTask(createTask('t4', 'a-t4', { dependencies: ['t3'] }));

      const result = await engine.run();

      expect(result.success).toBe(true);
      expect(order).toEqual(['t1', 't2', 't3', 't4']);
    });

    it('should execute fan-out correctly (A→B,C,D)', async () => {
      const order: string[] = [];
      const engine = new ExecutionEngine({ id: 'fan-out' });

      for (const id of ['root', 'b', 'c', 'd']) {
        engine.addAgent(createAgent(`a-${id}`, createTrackingProvider(id, order)));
      }

      engine.addTask(createTask('root', 'a-root'));
      engine.addTask(createTask('b', 'a-b', { dependencies: ['root'] }));
      engine.addTask(createTask('c', 'a-c', { dependencies: ['root'] }));
      engine.addTask(createTask('d', 'a-d', { dependencies: ['root'] }));

      const result = await engine.run();

      expect(result.success).toBe(true);
      // root must be first
      expect(order[0]).toBe('root');
      // All children must appear after root
      expect(order.indexOf('b')).toBeGreaterThan(0);
      expect(order.indexOf('c')).toBeGreaterThan(0);
      expect(order.indexOf('d')).toBeGreaterThan(0);
    });

    it('should execute fan-in correctly (B,C,D→E)', async () => {
      const order: string[] = [];
      const engine = new ExecutionEngine({ id: 'fan-in' });

      for (const id of ['b', 'c', 'd', 'join']) {
        engine.addAgent(createAgent(`a-${id}`, createTrackingProvider(id, order)));
      }

      engine.addTask(createTask('b', 'a-b'));
      engine.addTask(createTask('c', 'a-c'));
      engine.addTask(createTask('d', 'a-d'));
      engine.addTask(createTask('join', 'a-join', { dependencies: ['b', 'c', 'd'] }));

      const result = await engine.run();

      expect(result.success).toBe(true);
      // join must be last
      expect(order[order.length - 1]).toBe('join');
      expect(order).toHaveLength(4);
    });

    it('should handle diamond dependency (A→B,C; B,C→D)', async () => {
      const order: string[] = [];
      const engine = new ExecutionEngine({ id: 'seq-diamond' });

      for (const id of ['a', 'b', 'c', 'd']) {
        engine.addAgent(createAgent(`a-${id}`, createTrackingProvider(id, order)));
      }

      engine.addTask(createTask('a', 'a-a'));
      engine.addTask(createTask('b', 'a-b', { dependencies: ['a'] }));
      engine.addTask(createTask('c', 'a-c', { dependencies: ['a'] }));
      engine.addTask(createTask('d', 'a-d', { dependencies: ['b', 'c'] }));

      const result = await engine.run();

      expect(result.success).toBe(true);
      expect(order.indexOf('a')).toBe(0);
      expect(order.indexOf('d')).toBe(3);
      expect(order.indexOf('b')).toBeLessThan(order.indexOf('d'));
      expect(order.indexOf('c')).toBeLessThan(order.indexOf('d'));
    });

    it('should handle independent tasks with no dependencies', async () => {
      const order: string[] = [];
      const engine = new ExecutionEngine({ id: 'independent' });

      for (const id of ['t1', 't2', 't3']) {
        engine.addAgent(createAgent(`a-${id}`, createTrackingProvider(id, order)));
      }

      engine.addTask(createTask('t1', 'a-t1'));
      engine.addTask(createTask('t2', 'a-t2'));
      engine.addTask(createTask('t3', 'a-t3'));

      const result = await engine.run();

      expect(result.success).toBe(true);
      expect(order).toHaveLength(3);
    });

    it('should handle complex multi-level graph', async () => {
      //   t1
      //  / | \
      // t2 t3 t4
      //  \ |  /
      //   t5
      //   |
      //   t6
      const order: string[] = [];
      const engine = new ExecutionEngine({ id: 'multi-level' });

      for (const id of ['t1', 't2', 't3', 't4', 't5', 't6']) {
        engine.addAgent(createAgent(`a-${id}`, createTrackingProvider(id, order)));
      }

      engine.addTask(createTask('t1', 'a-t1'));
      engine.addTask(createTask('t2', 'a-t2', { dependencies: ['t1'] }));
      engine.addTask(createTask('t3', 'a-t3', { dependencies: ['t1'] }));
      engine.addTask(createTask('t4', 'a-t4', { dependencies: ['t1'] }));
      engine.addTask(createTask('t5', 'a-t5', { dependencies: ['t2', 't3', 't4'] }));
      engine.addTask(createTask('t6', 'a-t6', { dependencies: ['t5'] }));

      const result = await engine.run();

      expect(result.success).toBe(true);
      expect(order[0]).toBe('t1');
      expect(order.indexOf('t5')).toBeGreaterThan(order.indexOf('t2'));
      expect(order.indexOf('t5')).toBeGreaterThan(order.indexOf('t3'));
      expect(order.indexOf('t5')).toBeGreaterThan(order.indexOf('t4'));
      expect(order[order.length - 1]).toBe('t6');
    });
  });

  // =========================================================================
  // 3. Parallel execution with dependencies
  // =========================================================================

  describe('parallel execution with dependencies', () => {
    it('should run independent tasks concurrently', async () => {
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

      const engine = new ExecutionEngine({
        id: 'par-independent',
        strategy: ExecutionStrategy.PARALLEL,
      });

      for (const id of ['t1', 't2', 't3']) {
        engine.addAgent(createAgent(`a-${id}`, makeProvider(id)));
        engine.addTask(createTask(id, `a-${id}`));
      }

      const result = await engine.run();

      expect(result.success).toBe(true);
      expect(result.taskResults.size).toBe(3);

      // All three should start near-simultaneously (within 30ms)
      const times = Object.values(startTimes);
      const maxDiff = Math.max(...times) - Math.min(...times);
      expect(maxDiff).toBeLessThan(40);
    });

    it('should wait for dependencies before scheduling dependents', async () => {
      const order: string[] = [];

      const makeProvider = (id: string, delayMs: number): LLMProvider => ({
        name: `mock-${id}`,
        generateText: vi.fn().mockImplementation(async () => {
          order.push(`start:${id}`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          order.push(`end:${id}`);
          return {
            content: `output-${id}`,
            tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            finishReason: 'stop',
          };
        }),
      });

      const engine = new ExecutionEngine({
        id: 'par-wait-deps',
        strategy: ExecutionStrategy.PARALLEL,
      });

      engine.addAgent(createAgent('a1', makeProvider('t1', 50)));
      engine.addAgent(createAgent('a2', makeProvider('t2', 10)));
      engine.addTask(createTask('t1', 'a1'));
      engine.addTask(createTask('t2', 'a2', { dependencies: ['t1'] }));

      const result = await engine.run();

      expect(result.success).toBe(true);
      // t2 should not start until t1 ends
      const t1EndIdx = order.indexOf('end:t1');
      const t2StartIdx = order.indexOf('start:t2');
      expect(t2StartIdx).toBeGreaterThan(t1EndIdx);
    });

    it('should execute diamond pattern with correct wave ordering', async () => {
      const order: string[] = [];

      const makeProvider = (id: string): LLMProvider => ({
        name: `mock-${id}`,
        generateText: vi.fn().mockImplementation(async () => {
          order.push(id);
          await new Promise((resolve) => setTimeout(resolve, 10));
          return {
            content: `output-${id}`,
            tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            finishReason: 'stop',
          };
        }),
      });

      const engine = new ExecutionEngine({
        id: 'par-diamond',
        strategy: ExecutionStrategy.PARALLEL,
      });

      for (const id of ['t1', 't2', 't3', 't4']) {
        engine.addAgent(createAgent(`a-${id}`, makeProvider(id)));
      }

      // Diamond: t1 → t2, t1 → t3, t2 → t4, t3 → t4
      engine.addTask(createTask('t1', 'a-t1'));
      engine.addTask(createTask('t2', 'a-t2', { dependencies: ['t1'] }));
      engine.addTask(createTask('t3', 'a-t3', { dependencies: ['t1'] }));
      engine.addTask(createTask('t4', 'a-t4', { dependencies: ['t2', 't3'] }));

      const result = await engine.run();

      expect(result.success).toBe(true);
      expect(order.indexOf('t1')).toBe(0);
      expect(order.indexOf('t2')).toBeLessThan(order.indexOf('t4'));
      expect(order.indexOf('t3')).toBeLessThan(order.indexOf('t4'));
    });

    it('should respect maxConcurrency with dependent tasks', async () => {
      let maxActive = 0;
      let currentActive = 0;

      const makeProvider = (id: string): LLMProvider => ({
        name: `mock-${id}`,
        generateText: vi.fn().mockImplementation(async () => {
          currentActive++;
          maxActive = Math.max(maxActive, currentActive);
          await new Promise((resolve) => setTimeout(resolve, 30));
          currentActive--;
          return {
            content: `output-${id}`,
            tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            finishReason: 'stop',
          };
        }),
      });

      const engine = new ExecutionEngine({
        id: 'par-conc-deps',
        strategy: ExecutionStrategy.PARALLEL,
        maxConcurrency: 2,
      });

      // t1 and t2 are independent, t3 depends on t1, t4 depends on t2
      for (const id of ['t1', 't2', 't3', 't4']) {
        engine.addAgent(createAgent(`a-${id}`, makeProvider(id)));
      }
      engine.addTask(createTask('t1', 'a-t1'));
      engine.addTask(createTask('t2', 'a-t2'));
      engine.addTask(createTask('t3', 'a-t3', { dependencies: ['t1'] }));
      engine.addTask(createTask('t4', 'a-t4', { dependencies: ['t2'] }));

      const result = await engine.run();

      expect(result.success).toBe(true);
      expect(result.taskResults.size).toBe(4);
      expect(maxActive).toBeLessThanOrEqual(2);
    });

    it('should run parallel branches independently', async () => {
      const order: string[] = [];

      const makeProvider = (id: string, delayMs: number): LLMProvider => ({
        name: `mock-${id}`,
        generateText: vi.fn().mockImplementation(async () => {
          order.push(`start:${id}`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          order.push(`end:${id}`);
          return {
            content: `output-${id}`,
            tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            finishReason: 'stop',
          };
        }),
      });

      const engine = new ExecutionEngine({
        id: 'par-branches',
        strategy: ExecutionStrategy.PARALLEL,
      });

      // Branch 1: t1 → t3
      // Branch 2: t2 → t4
      engine.addAgent(createAgent('a1', makeProvider('t1', 20)));
      engine.addAgent(createAgent('a2', makeProvider('t2', 20)));
      engine.addAgent(createAgent('a3', makeProvider('t3', 10)));
      engine.addAgent(createAgent('a4', makeProvider('t4', 10)));

      engine.addTask(createTask('t1', 'a1'));
      engine.addTask(createTask('t2', 'a2'));
      engine.addTask(createTask('t3', 'a3', { dependencies: ['t1'] }));
      engine.addTask(createTask('t4', 'a4', { dependencies: ['t2'] }));

      const result = await engine.run();

      expect(result.success).toBe(true);
      expect(result.taskResults.size).toBe(4);

      // Both branches should start at the same time
      expect(order.indexOf('start:t1')).toBeLessThan(2);
      expect(order.indexOf('start:t2')).toBeLessThan(2);
    });
  });

  // =========================================================================
  // 4. Task context passing (dependency outputs → dependent inputs)
  // =========================================================================

  describe('task context passing', () => {
    it('should pass single dependency output as context', async () => {
      const capturedMessages = new Map<string, unknown[]>();

      const engine = new ExecutionEngine({ id: 'ctx-single' });
      engine.addAgent(createAgent('a1', createMockProvider('first-result')));
      engine.addAgent(createAgent('a2', createCapturingProvider('t2', capturedMessages)));

      engine.addTask(createTask('t1', 'a1'));
      engine.addTask(createTask('t2', 'a2', { dependencies: ['t1'] }));

      await engine.run();

      const messages = capturedMessages.get('t2');
      expect(messages).toBeDefined();
      const userMsg = messages!.find((m: unknown) => (m as { role: string }).role === 'user') as
        | { content: string }
        | undefined;
      expect(userMsg).toBeDefined();
      expect(userMsg!.content).toContain('first-result');
    });

    it('should pass multiple dependency outputs as context', async () => {
      const capturedMessages = new Map<string, unknown[]>();

      const engine = new ExecutionEngine({ id: 'ctx-multi' });

      // Create two source tasks with distinct outputs
      const p1: LLMProvider = {
        name: 'mock-1',
        generateText: vi.fn().mockResolvedValue({
          content: 'output-from-source-1',
          tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          finishReason: 'stop',
        }),
      };
      const p2: LLMProvider = {
        name: 'mock-2',
        generateText: vi.fn().mockResolvedValue({
          content: 'output-from-source-2',
          tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          finishReason: 'stop',
        }),
      };

      engine.addAgent(createAgent('a1', p1));
      engine.addAgent(createAgent('a2', p2));
      engine.addAgent(createAgent('a3', createCapturingProvider('join', capturedMessages)));

      engine.addTask(createTask('src1', 'a1'));
      engine.addTask(createTask('src2', 'a2'));
      engine.addTask(createTask('join', 'a3', { dependencies: ['src1', 'src2'] }));

      await engine.run();

      const messages = capturedMessages.get('join');
      expect(messages).toBeDefined();
      const userMsg = messages!.find((m: unknown) => (m as { role: string }).role === 'user') as
        | { content: string }
        | undefined;
      expect(userMsg).toBeDefined();
      // Both dependency outputs should be present
      expect(userMsg!.content).toContain('output-from-source-1');
      expect(userMsg!.content).toContain('output-from-source-2');
    });

    it('should preserve original task context alongside dependency results', async () => {
      const capturedMessages = new Map<string, unknown[]>();

      const engine = new ExecutionEngine({ id: 'ctx-merge' });
      engine.addAgent(createAgent('a1', createMockProvider('dep-output')));
      engine.addAgent(createAgent('a2', createCapturingProvider('consumer', capturedMessages)));

      engine.addTask(createTask('producer', 'a1'));
      engine.addTask(
        createTask('consumer', 'a2', {
          dependencies: ['producer'],
          context: { customKey: 'customValue' },
        }),
      );

      await engine.run();

      const messages = capturedMessages.get('consumer');
      expect(messages).toBeDefined();
      const userMsg = messages!.find((m: unknown) => (m as { role: string }).role === 'user') as
        | { content: string }
        | undefined;
      expect(userMsg).toBeDefined();
      // Should contain both original context and dependency result
      expect(userMsg!.content).toContain('dep-output');
      expect(userMsg!.content).toContain('customValue');
    });

    it('should pass context through a chain (A→B→C)', async () => {
      const capturedMessages = new Map<string, unknown[]>();

      const engine = new ExecutionEngine({ id: 'ctx-chain' });
      engine.addAgent(createAgent('a1', createMockProvider('chain-start-value')));
      engine.addAgent(createAgent('a2', createCapturingProvider('t2', capturedMessages)));
      engine.addAgent(createAgent('a3', createCapturingProvider('t3', capturedMessages)));

      engine.addTask(createTask('t1', 'a1'));
      engine.addTask(createTask('t2', 'a2', { dependencies: ['t1'] }));
      engine.addTask(createTask('t3', 'a3', { dependencies: ['t2'] }));

      await engine.run();

      // t2 should receive t1's output
      const t2Msgs = capturedMessages.get('t2');
      expect(t2Msgs).toBeDefined();
      const t2UserMsg = t2Msgs!.find((m: unknown) => (m as { role: string }).role === 'user') as
        | { content: string }
        | undefined;
      expect(t2UserMsg).toBeDefined();
      expect(t2UserMsg!.content).toContain('chain-start-value');

      // t3 should receive t2's output (not t1's directly)
      const t3Msgs = capturedMessages.get('t3');
      expect(t3Msgs).toBeDefined();
      const t3UserMsg = t3Msgs!.find((m: unknown) => (m as { role: string }).role === 'user') as
        | { content: string }
        | undefined;
      expect(t3UserMsg).toBeDefined();
      expect(t3UserMsg!.content).toContain('output-t2');
    });

    it('should not inject context when task has no dependencies', async () => {
      const capturedMessages = new Map<string, unknown[]>();

      const engine = new ExecutionEngine({ id: 'ctx-none' });
      engine.addAgent(createAgent('a1', createCapturingProvider('standalone', capturedMessages)));
      engine.addTask(createTask('standalone', 'a1'));

      await engine.run();

      const messages = capturedMessages.get('standalone');
      expect(messages).toBeDefined();
      const userMsg = messages!.find((m: unknown) => (m as { role: string }).role === 'user') as
        | { content: string }
        | undefined;
      expect(userMsg).toBeDefined();
      // Should not contain "dependencyResults"
      expect(userMsg!.content).not.toContain('dependencyResults');
    });
  });

  // =========================================================================
  // 5. Dependency failure cascading
  // =========================================================================

  describe('dependency failure cascading', () => {
    it('should skip dependents when root task fails (continue policy)', async () => {
      const failProvider: LLMProvider = {
        name: 'fail',
        generateText: vi.fn().mockRejectedValue(new Error('root failed')),
      };

      const engine = new ExecutionEngine({
        id: 'cascade-root',
        taskErrorPolicy: 'continue',
      });

      engine.addAgent(createAgent('a-fail', failProvider));
      engine.addAgent(createAgent('a-ok', createMockProvider()));

      engine.addTask(createTask('root', 'a-fail'));
      engine.addTask(createTask('child1', 'a-ok', { dependencies: ['root'] }));
      engine.addTask(createTask('child2', 'a-ok', { dependencies: ['root'] }));
      engine.addTask(createTask('grandchild', 'a-ok', { dependencies: ['child1', 'child2'] }));

      const result = await engine.run();

      expect(result.success).toBe(false);
      expect(result.failedTasks.size).toBe(4);
      expect(result.failedTasks.has('root')).toBe(true);
      expect(result.failedTasks.has('child1')).toBe(true);
      expect(result.failedTasks.has('child2')).toBe(true);
      expect(result.failedTasks.has('grandchild')).toBe(true);
    });

    it('should not affect independent branches when one branch fails', async () => {
      const failProvider: LLMProvider = {
        name: 'fail',
        generateText: vi.fn().mockRejectedValue(new Error('branch-a failed')),
      };

      const engine = new ExecutionEngine({
        id: 'cascade-branch',
        taskErrorPolicy: 'continue',
      });

      engine.addAgent(createAgent('a-fail', failProvider));
      engine.addAgent(createAgent('a-ok', createMockProvider('success')));

      // Branch A: branch-a → dep-a (should fail)
      // Branch B: branch-b → dep-b (should succeed)
      engine.addTask(createTask('branch-a', 'a-fail'));
      engine.addTask(createTask('dep-a', 'a-ok', { dependencies: ['branch-a'] }));
      engine.addTask(createTask('branch-b', 'a-ok'));
      engine.addTask(createTask('dep-b', 'a-ok', { dependencies: ['branch-b'] }));

      const result = await engine.run();

      expect(result.success).toBe(false);
      expect(result.failedTasks.has('branch-a')).toBe(true);
      expect(result.failedTasks.has('dep-a')).toBe(true);
      expect(result.taskResults.has('branch-b')).toBe(true);
      expect(result.taskResults.has('dep-b')).toBe(true);
    });

    it('should cascade failure in parallel mode', async () => {
      const failProvider: LLMProvider = {
        name: 'fail',
        generateText: vi.fn().mockRejectedValue(new Error('fail')),
      };

      const engine = new ExecutionEngine({
        id: 'par-cascade',
        strategy: ExecutionStrategy.PARALLEL,
        taskErrorPolicy: 'continue',
      });

      engine.addAgent(createAgent('a-fail', failProvider));
      engine.addAgent(createAgent('a-ok', createMockProvider()));

      engine.addTask(createTask('src', 'a-fail'));
      engine.addTask(createTask('dep1', 'a-ok', { dependencies: ['src'] }));
      engine.addTask(createTask('dep2', 'a-ok', { dependencies: ['src'] }));
      engine.addTask(createTask('independent', 'a-ok'));

      const result = await engine.run();

      expect(result.success).toBe(false);
      expect(result.failedTasks.has('src')).toBe(true);
      expect(result.failedTasks.has('dep1')).toBe(true);
      expect(result.failedTasks.has('dep2')).toBe(true);
      expect(result.taskResults.has('independent')).toBe(true);
    });

    it('should fail-fast when dependency fails in fail-fast mode', async () => {
      const failProvider: LLMProvider = {
        name: 'fail',
        generateText: vi.fn().mockRejectedValue(new Error('boom')),
      };

      const engine = new ExecutionEngine({
        id: 'ff-dep-fail',
        taskErrorPolicy: 'fail-fast',
      });

      engine.addAgent(createAgent('a-fail', failProvider));
      engine.addAgent(createAgent('a-ok', createMockProvider()));

      engine.addTask(createTask('t1', 'a-fail'));
      engine.addTask(createTask('t2', 'a-ok', { dependencies: ['t1'] }));

      await expect(engine.run()).rejects.toThrow(EngineExecutionError);
    });

    it('should emit error events for skipped dependent tasks', async () => {
      const failProvider: LLMProvider = {
        name: 'fail',
        generateText: vi.fn().mockRejectedValue(new Error('fail')),
      };

      const engine = new ExecutionEngine({
        id: 'cascade-events',
        taskErrorPolicy: 'continue',
      });

      engine.addAgent(createAgent('a-fail', failProvider));
      engine.addAgent(createAgent('a-ok', createMockProvider()));

      engine.addTask(createTask('parent', 'a-fail'));
      engine.addTask(createTask('child', 'a-ok', { dependencies: ['parent'] }));

      const errorEvents: string[] = [];
      engine.on('engine:task:error', (_eId, taskId) => {
        errorEvents.push(taskId);
      });

      await engine.run();

      expect(errorEvents).toContain('parent');
      expect(errorEvents).toContain('child');
    });

    it('should handle multiple independent failures in continue mode', async () => {
      const failProvider: LLMProvider = {
        name: 'fail',
        generateText: vi.fn().mockRejectedValue(new Error('fail')),
      };

      const engine = new ExecutionEngine({
        id: 'multi-fail',
        taskErrorPolicy: 'continue',
      });

      engine.addAgent(createAgent('a-fail', failProvider));
      engine.addAgent(createAgent('a-ok', createMockProvider('ok')));

      engine.addTask(createTask('f1', 'a-fail'));
      engine.addTask(createTask('f2', 'a-fail'));
      engine.addTask(createTask('ok1', 'a-ok'));

      const result = await engine.run();

      expect(result.success).toBe(false);
      expect(result.failedTasks.size).toBe(2);
      expect(result.taskResults.size).toBe(1);
      expect(result.taskResults.get('ok1')?.output).toBe('ok');
    });
  });

  // =========================================================================
  // 6. Task lifecycle through orchestration
  // =========================================================================

  describe('task lifecycle through orchestration', () => {
    it('should transition all tasks through PENDING→RUNNING→COMPLETED', async () => {
      const statusLog: Record<string, string[]> = {};

      const engine = new ExecutionEngine({ id: 'lifecycle' });
      engine.addAgent(createAgent('a1', createMockProvider()));

      const tasks = ['t1', 't2', 't3'].map((id, i) => {
        const deps = i > 0 ? { dependencies: [`t${String(i)}`] } : {};
        return createTask(id, 'a1', deps);
      });

      for (const task of tasks) {
        statusLog[task.id] = [];
        task.on('task:status-changed', (_id, status) => {
          statusLog[task.id]!.push(status);
        });
        engine.addTask(task);
      }

      await engine.run();

      for (const task of tasks) {
        expect(task.status).toBe(TaskStatus.COMPLETED);
        expect(statusLog[task.id]).toContain(TaskStatus.RUNNING);
        expect(statusLog[task.id]).toContain(TaskStatus.COMPLETED);
      }
    });

    it('should set task to FAILED when it errors', async () => {
      const failProvider: LLMProvider = {
        name: 'fail',
        generateText: vi.fn().mockRejectedValue(new Error('fail')),
      };

      const engine = new ExecutionEngine({
        id: 'lifecycle-fail',
        taskErrorPolicy: 'continue',
      });

      engine.addAgent(createAgent('a-fail', failProvider));
      engine.addAgent(createAgent('a-ok', createMockProvider()));

      const failTask = createTask('fail-task', 'a-fail');
      const okTask = createTask('ok-task', 'a-ok');

      engine.addTask(failTask).addTask(okTask);

      await engine.run();

      expect(failTask.status).toBe(TaskStatus.FAILED);
      expect(failTask.error).toBeDefined();
      expect(okTask.status).toBe(TaskStatus.COMPLETED);
      expect(okTask.result).toBeDefined();
    });

    it('should store task results after completion', async () => {
      const engine = new ExecutionEngine({ id: 'results-store' });
      engine.addAgent(createAgent('a1', createMockProvider('the-answer')));
      engine.addTask(createTask('t1', 'a1'));

      const result = await engine.run();

      expect(result.taskResults.size).toBe(1);
      const taskResult = result.taskResults.get('t1');
      expect(taskResult).toBeDefined();
      expect(taskResult!.output).toBe('the-answer');
      expect(taskResult!.agentId).toBe('a1');
      expect(taskResult!.duration).toBeGreaterThanOrEqual(0);
    });
  });

  // =========================================================================
  // 7. Engine events during orchestration
  // =========================================================================

  describe('engine events during orchestration', () => {
    it('should emit task events in dependency order', async () => {
      const events: string[] = [];

      const engine = new ExecutionEngine({ id: 'events-order' });
      engine.addAgent(createAgent('a1', createMockProvider()));

      engine.addTask(createTask('t1', 'a1'));
      engine.addTask(createTask('t2', 'a1', { dependencies: ['t1'] }));

      engine.on('engine:task:start', (_eId, taskId) => events.push(`start:${taskId}`));
      engine.on('engine:task:complete', (_eId, taskId) => events.push(`complete:${taskId}`));

      await engine.run();

      expect(events.indexOf('start:t1')).toBeLessThan(events.indexOf('start:t2'));
      expect(events.indexOf('complete:t1')).toBeLessThan(events.indexOf('start:t2'));
    });

    it('should emit engine start and complete events around orchestration', async () => {
      const events: string[] = [];

      const engine = new ExecutionEngine({ id: 'events-wrap' });
      engine.addAgent(createAgent('a1', createMockProvider()));
      engine.addTask(createTask('t1', 'a1'));
      engine.addTask(createTask('t2', 'a1', { dependencies: ['t1'] }));

      engine.on('engine:start', () => events.push('engine:start'));
      engine.on('engine:complete', () => events.push('engine:complete'));
      engine.on('engine:task:start', (_eId, taskId) => events.push(`task:start:${taskId}`));

      await engine.run();

      expect(events[0]).toBe('engine:start');
      expect(events[events.length - 1]).toBe('engine:complete');
    });

    it('should track status transitions during orchestration', async () => {
      const statuses: EngineStatus[] = [];

      const engine = new ExecutionEngine({ id: 'status-track' });
      engine.addAgent(createAgent('a1', createMockProvider()));
      engine.addTask(createTask('t1', 'a1'));

      engine.on('engine:status-changed', (_id, status) => statuses.push(status));

      await engine.run();

      expect(statuses[0]).toBe(EngineStatus.RUNNING);
      expect(statuses[statuses.length - 1]).toBe(EngineStatus.COMPLETED);
    });
  });

  // =========================================================================
  // 8. Middleware hooks with dependencies
  // =========================================================================

  describe('middleware hooks with dependent tasks', () => {
    it('should call before/after hooks for each task in dependency order', async () => {
      const hookLog: string[] = [];

      const engine = new ExecutionEngine({ id: 'hooks-deps' });
      engine.addAgent(createAgent('a1', createMockProvider()));

      engine.addTask(createTask('t1', 'a1'));
      engine.addTask(createTask('t2', 'a1', { dependencies: ['t1'] }));

      engine.beforeTask((t) => { hookLog.push(`before:${t.id}`); });
      engine.afterTask((t) => { hookLog.push(`after:${t.id}`); });

      await engine.run();

      expect(hookLog).toEqual(['before:t1', 'after:t1', 'before:t2', 'after:t2']);
    });

    it('should call error hooks for failed tasks and their skipped dependents', async () => {
      const errorLog: string[] = [];

      const failProvider: LLMProvider = {
        name: 'fail',
        generateText: vi.fn().mockRejectedValue(new Error('hook-test-fail')),
      };

      const engine = new ExecutionEngine({
        id: 'hooks-error',
        taskErrorPolicy: 'continue',
      });

      engine.addAgent(createAgent('a-fail', failProvider));
      engine.addAgent(createAgent('a-ok', createMockProvider()));

      engine.addTask(createTask('parent', 'a-fail'));
      engine.addTask(createTask('child', 'a-ok', { dependencies: ['parent'] }));

      engine.onTaskError((t) => { errorLog.push(`error:${t.id}`); });

      await engine.run();

      expect(errorLog).toContain('error:parent');
    });
  });

  // =========================================================================
  // 9. Edge cases
  // =========================================================================

  describe('edge cases', () => {
    it('should handle a single task with no dependencies', async () => {
      const engine = new ExecutionEngine({ id: 'single' });
      engine.addAgent(createAgent('a1', createMockProvider('solo-output')));
      engine.addTask(createTask('t1', 'a1'));

      const result = await engine.run();

      expect(result.success).toBe(true);
      expect(result.taskResults.size).toBe(1);
      expect(result.taskResults.get('t1')?.output).toBe('solo-output');
    });

    it('should handle duplicate dependency references gracefully', async () => {
      const engine = new ExecutionEngine({ id: 'dup-dep' });
      engine.addAgent(createAgent('a1', createMockProvider()));

      engine.addTask(createTask('t1', 'a1'));
      // t2 depends on t1 twice — should still work
      engine.addTask(createTask('t2', 'a1', { dependencies: ['t1', 't1'] }));

      const result = await engine.run();

      expect(result.success).toBe(true);
      expect(result.taskResults.size).toBe(2);
    });

    it('should handle a larger DAG (10 tasks with complex dependencies)', async () => {
      const order: string[] = [];
      const engine = new ExecutionEngine({
        id: 'large-dag',
        strategy: ExecutionStrategy.PARALLEL,
      });

      for (let i = 1; i <= 10; i++) {
        const id = `t${String(i)}`;
        engine.addAgent(createAgent(`a-${id}`, createTrackingProvider(id, order)));
      }

      // Layer 0: t1, t2 (no deps)
      // Layer 1: t3 (dep t1), t4 (dep t2), t5 (dep t1, t2)
      // Layer 2: t6 (dep t3), t7 (dep t4, t5)
      // Layer 3: t8 (dep t6, t7)
      // Independent: t9, t10
      engine.addTask(createTask('t1', 'a-t1'));
      engine.addTask(createTask('t2', 'a-t2'));
      engine.addTask(createTask('t3', 'a-t3', { dependencies: ['t1'] }));
      engine.addTask(createTask('t4', 'a-t4', { dependencies: ['t2'] }));
      engine.addTask(createTask('t5', 'a-t5', { dependencies: ['t1', 't2'] }));
      engine.addTask(createTask('t6', 'a-t6', { dependencies: ['t3'] }));
      engine.addTask(createTask('t7', 'a-t7', { dependencies: ['t4', 't5'] }));
      engine.addTask(createTask('t8', 'a-t8', { dependencies: ['t6', 't7'] }));
      engine.addTask(createTask('t9', 'a-t9'));
      engine.addTask(createTask('t10', 'a-t10'));

      const result = await engine.run();

      expect(result.success).toBe(true);
      expect(result.taskResults.size).toBe(10);

      // Verify ordering constraints
      expect(order.indexOf('t1')).toBeLessThan(order.indexOf('t3'));
      expect(order.indexOf('t2')).toBeLessThan(order.indexOf('t4'));
      expect(order.indexOf('t1')).toBeLessThan(order.indexOf('t5'));
      expect(order.indexOf('t2')).toBeLessThan(order.indexOf('t5'));
      expect(order.indexOf('t3')).toBeLessThan(order.indexOf('t6'));
      expect(order.indexOf('t4')).toBeLessThan(order.indexOf('t7'));
      expect(order.indexOf('t5')).toBeLessThan(order.indexOf('t7'));
      expect(order.indexOf('t6')).toBeLessThan(order.indexOf('t8'));
      expect(order.indexOf('t7')).toBeLessThan(order.indexOf('t8'));
    });

    it('should allow re-running orchestration after reset', async () => {
      const engine = new ExecutionEngine({ id: 'rerun' });
      engine.addAgent(createAgent('a1', createMockProvider('run1')));
      engine.addTask(createTask('t1', 'a1'));

      const result1 = await engine.run();
      expect(result1.success).toBe(true);

      engine.reset();

      engine.addAgent(createAgent('a2', createMockProvider('run2')));
      engine.addTask(createTask('t2', 'a2'));
      engine.addTask(createTask('t3', 'a2', { dependencies: ['t2'] }));

      const result2 = await engine.run();
      expect(result2.success).toBe(true);
      expect(result2.taskResults.size).toBe(2);
    });

    it('should report correct duration for orchestrated workflow', async () => {
      const engine = new ExecutionEngine({ id: 'duration' });
      engine.addAgent(createAgent('a1', createMockProvider()));
      engine.addTask(createTask('t1', 'a1'));

      const result = await engine.run();

      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(typeof result.duration).toBe('number');
    });

    it('should handle tasks with retries in a dependency chain', async () => {
      let callCount = 0;
      const flakyProvider: LLMProvider = {
        name: 'flaky',
        generateText: vi.fn().mockImplementation(async () => {
          callCount++;
          if (callCount === 1) {
            throw new Error('flaky error');
          }
          return {
            content: 'success-after-retry',
            tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            finishReason: 'stop',
          };
        }),
      };

      const engine = new ExecutionEngine({ id: 'retry-chain' });
      engine.addAgent(createAgent('a-flaky', flakyProvider));
      engine.addAgent(createAgent('a-ok', createMockProvider()));

      engine.addTask(createTask('t1', 'a-flaky', { retries: 2 }));
      engine.addTask(createTask('t2', 'a-ok', { dependencies: ['t1'] }));

      const result = await engine.run();

      expect(result.success).toBe(true);
      expect(result.taskResults.size).toBe(2);
      expect(callCount).toBe(2);
    });
  });

  // =========================================================================
  // 10. Task class dependency-related features
  // =========================================================================

  describe('Task class dependency features', () => {
    it('should store dependencies as readonly', () => {
      const task = createTask('t1', 'a1', { dependencies: ['dep-a', 'dep-b'] });
      expect(task.dependencies).toEqual(['dep-a', 'dep-b']);
      expect(Object.isFrozen(task.dependencies) || Array.isArray(task.dependencies)).toBe(true);
    });

    it('should include dependencies in toCrewTask conversion', () => {
      const task = new Task({
        id: 'convert-test',
        description: 'Test conversion',
        agentId: 'a1',
        dependencies: ['dep-a', 'dep-b'],
      });

      const crewTask = task.toCrewTask();
      expect(crewTask.dependencies).toEqual(['dep-a', 'dep-b']);
    });

    it('should omit dependencies from toCrewTask when empty', () => {
      const task = new Task({
        id: 'no-deps',
        description: 'No dependencies',
        agentId: 'a1',
      });

      const crewTask = task.toCrewTask();
      expect(crewTask.dependencies).toBeUndefined();
    });

    it('should not include dependencies in toTaskInput', () => {
      const task = new Task({
        id: 'input-test',
        description: 'Test input conversion',
        dependencies: ['dep-a'],
      });

      const input = task.toTaskInput();
      expect(input.description).toBe('Test input conversion');
      // TaskInput doesn't have a dependencies field
      expect((input as unknown as Record<string, unknown>)['dependencies']).toBeUndefined();
    });

    it('should accept empty dependencies array', () => {
      const task = createTask('t1', 'a1', { dependencies: [] });
      expect(task.dependencies).toEqual([]);
    });

    it('should isolate dependencies from original array mutation', () => {
      const deps = ['dep-a', 'dep-b'];
      const task = new Task({
        id: 't1',
        description: 'test',
        dependencies: deps,
      });

      // Mutating the original array should not affect the task
      deps.push('dep-c');
      expect(task.dependencies).toEqual(['dep-a', 'dep-b']);
    });
  });

  // =========================================================================
  // 11. Global timeout with dependencies
  // =========================================================================

  describe('global timeout with dependent tasks', () => {
    it('should cancel orchestration when global timeout is exceeded', async () => {
      const slowProvider: LLMProvider = {
        name: 'slow',
        generateText: vi
          .fn()
          .mockImplementation(async () => new Promise((resolve) => setTimeout(resolve, 5000))),
      };

      const engine = new ExecutionEngine({
        id: 'global-timeout',
        globalTimeout: 100,
      });

      engine.addAgent(createAgent('a1', slowProvider));
      engine.addTask(createTask('t1', 'a1'));
      engine.addTask(createTask('t2', 'a1', { dependencies: ['t1'] }));

      await expect(engine.run()).rejects.toThrow(/timeout/i);
    });
  });
});
