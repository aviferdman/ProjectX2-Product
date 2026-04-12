/**
 * Tests for the workflow execution API.
 *
 * Validates the WorkflowExecutor lifecycle: load workflow → check limits →
 * resolve agents → build crew → execute → record run → return result.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { Agent } from '../../src/agent/agent.js';
import type { LLMProvider, LLMResponse, LLMMessage } from '../../src/types/index.js';
import { InMemoryWorkflowStorage, _resetIdCounter } from '../../src/workflow/index.js';
import { WorkflowExecutor, _resetRunCounter } from '../../src/workflow/workflow-executor.js';
import { WorkflowNotFoundError } from '../../src/workflow/workflow-errors.js';
import {
  WorkflowNotActiveError,
  WorkflowNoAgentsError,
  WorkflowExecutionTimeoutError,
  WorkflowExecutionCancelledError,
} from '../../src/workflow/workflow-execution-errors.js';
import type {
  WorkflowExecutionResult,
  WorkflowExecutionOptions,
} from '../../src/workflow/workflow-execution-types.js';
import type { AgentResolver } from '../../src/workflow/workflow-executor.js';
import type { CreateWorkflowInput, StoredWorkflow } from '../../src/workflow/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockLLMProvider(response?: Partial<LLMResponse>): LLMProvider {
  return {
    name: 'mock-provider',
    generateText: vi
      .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
      .mockResolvedValue({
        content: response?.content ?? 'Mock LLM response',
        tokenUsage: response?.tokenUsage ?? {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
        finishReason: response?.finishReason ?? 'stop',
      }),
  };
}

function createAgent(id: string, content?: string): Agent {
  const provider = createMockLLMProvider({ content: content ?? `Output from ${id}` });
  return new Agent({
    id,
    role: `Role of ${id}`,
    goal: `Goal of ${id}`,
    llmProvider: provider,
  });
}

function makeWorkflowInput(overrides?: Partial<CreateWorkflowInput>): CreateWorkflowInput {
  return {
    name: 'Test Workflow',
    agents: [
      { id: 'researcher', role: 'Researcher', goal: 'Find information' },
      { id: 'writer', role: 'Writer', goal: 'Write summaries' },
    ],
    tasks: [
      { id: 'research', description: 'Search for papers', agentId: 'researcher' },
      {
        id: 'write',
        description: 'Summarize findings',
        agentId: 'writer',
        dependencies: ['research'],
      },
    ],
    ...overrides,
  };
}

const defaultResolver: AgentResolver = (defs) =>
  defs.map((d) => createAgent(d.id, `Result from ${d.id}`));

// A mock usage tracker for testing
function createMockUsageTracker() {
  const recordedRuns: Array<{ id: string; accountId: string; workflowId: string }> = [];
  const completedRuns: Array<{ runId: string; status: string }> = [];
  let runCounter = 0;

  return {
    recordedRuns,
    completedRuns,
    recordRun: vi.fn(async (input: { accountId: string; workflowId: string }) => {
      runCounter += 1;
      const run = {
        id: `usage_run_${String(runCounter)}`,
        accountId: input.accountId,
        workflowId: input.workflowId,
        status: 'started' as const,
        startedAt: new Date().toISOString(),
      };
      recordedRuns.push(run);
      return run;
    }),
    completeRun: vi.fn(async (runId: string, input: { status: string }) => {
      completedRuns.push({ runId, status: input.status });
      return {
        id: runId,
        accountId: 'acct-1',
        workflowId: 'wf-1',
        status: input.status,
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
      };
    }),
    getRun: vi.fn(),
    listRuns: vi.fn(),
    checkLimits: vi.fn().mockResolvedValue({ allowed: true }),
    getUsageSummary: vi.fn(),
    get storage() {
      return {} as any;
    },
    get plans() {
      return {} as any;
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WorkflowExecutor', () => {
  let storage: InMemoryWorkflowStorage;
  let executor: WorkflowExecutor;

  beforeEach(() => {
    storage = new InMemoryWorkflowStorage();
    _resetIdCounter();
    _resetRunCounter();
    executor = new WorkflowExecutor({
      storage,
      agentResolver: defaultResolver,
      requireActive: false, // Allow draft execution for easier testing
    });
  });

  // -------------------------------------------------------------------------
  // Basic execution
  // -------------------------------------------------------------------------

  describe('execute', () => {
    it('executes a stored workflow and returns results', async () => {
      const workflow = await storage.create(makeWorkflowInput());
      const result = await executor.execute(workflow.id);

      expect(result.runId).toMatch(/^run_/);
      expect(result.workflowId).toBe(workflow.id);
      expect(result.status).toBe('completed');
      expect(result.success).toBe(true);
      expect(result.taskResults).toHaveLength(2);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.startedAt).toBeTruthy();
      expect(result.finishedAt).toBeTruthy();
      expect(result.strategy).toBe('sequential');
    });

    it('includes task outputs in results', async () => {
      const workflow = await storage.create(makeWorkflowInput());
      const result = await executor.execute(workflow.id);

      const researchResult = result.taskResults.find((t) => t.taskId === 'research');
      expect(researchResult).toBeDefined();
      expect(researchResult!.agentId).toBe('researcher');
      expect(researchResult!.output).toContain('Result from researcher');
      expect(researchResult!.success).toBe(true);
      expect(researchResult!.durationMs).toBeGreaterThanOrEqual(0);

      const writeResult = result.taskResults.find((t) => t.taskId === 'write');
      expect(writeResult).toBeDefined();
      expect(writeResult!.agentId).toBe('writer');
      expect(writeResult!.success).toBe(true);
    });

    it('attaches metadata to the result when provided', async () => {
      const workflow = await storage.create(makeWorkflowInput());
      const result = await executor.execute(workflow.id, {
        metadata: { triggeredBy: 'api', version: 2 },
      });

      expect(result.metadata).toEqual({ triggeredBy: 'api', version: 2 });
    });

    it('executes a single-task workflow', async () => {
      const workflow = await storage.create(
        makeWorkflowInput({
          agents: [{ id: 'solo', role: 'Solo Agent', goal: 'Do everything' }],
          tasks: [{ id: 'only-task', description: 'Complete the work', agentId: 'solo' }],
        }),
      );

      const result = await executor.execute(workflow.id);
      expect(result.success).toBe(true);
      expect(result.taskResults).toHaveLength(1);
      expect(result.taskResults[0].taskId).toBe('only-task');
    });
  });

  // -------------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------------

  describe('error handling', () => {
    it('throws WorkflowNotFoundError for unknown workflow ID', async () => {
      await expect(executor.execute('nonexistent-id')).rejects.toThrow(WorkflowNotFoundError);
    });

    it('throws WorkflowNotActiveError when requireActive is true and workflow is draft', async () => {
      const activeExecutor = new WorkflowExecutor({
        storage,
        agentResolver: defaultResolver,
        requireActive: true,
      });

      const workflow = await storage.create(makeWorkflowInput());
      // Workflow starts as 'draft'
      await expect(activeExecutor.execute(workflow.id)).rejects.toThrow(WorkflowNotActiveError);
    });

    it('allows execution of active workflows when requireActive is true', async () => {
      const activeExecutor = new WorkflowExecutor({
        storage,
        agentResolver: defaultResolver,
        requireActive: true,
      });

      const workflow = await storage.create(makeWorkflowInput());
      await storage.update(workflow.id, { status: 'active' });

      const result = await activeExecutor.execute(workflow.id);
      expect(result.success).toBe(true);
    });

    it('throws WorkflowNoAgentsError when resolver returns empty array', async () => {
      const emptyExecutor = new WorkflowExecutor({
        storage,
        agentResolver: () => [],
        requireActive: false,
      });

      const workflow = await storage.create(makeWorkflowInput());
      await expect(emptyExecutor.execute(workflow.id)).rejects.toThrow(WorkflowNoAgentsError);
    });

    it('handles agent execution failures gracefully', async () => {
      const failingProvider: LLMProvider = {
        name: 'failing-provider',
        generateText: vi.fn().mockRejectedValue(new Error('LLM service unavailable')),
      };

      const failingResolver: AgentResolver = (defs) =>
        defs.map(
          (d) =>
            new Agent({
              id: d.id,
              role: d.role,
              goal: d.goal,
              llmProvider: failingProvider,
            }),
        );

      const failingExecutor = new WorkflowExecutor({
        storage,
        agentResolver: failingResolver,
        requireActive: false,
      });

      const workflow = await storage.create(makeWorkflowInput());
      const result = await failingExecutor.execute(workflow.id);

      expect(result.success).toBe(false);
      expect(result.status).toBe('failed');
      expect(result.error).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Timeout
  // -------------------------------------------------------------------------

  describe('timeout', () => {
    it('throws WorkflowExecutionTimeoutError when execution exceeds timeout', async () => {
      const slowProvider: LLMProvider = {
        name: 'slow-provider',
        generateText: vi.fn(
          () =>
            new Promise<LLMResponse>((resolve) => {
              setTimeout(
                () =>
                  resolve({
                    content: 'Slow response',
                    tokenUsage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
                    finishReason: 'stop',
                  }),
                5000,
              );
            }),
        ),
      };

      const slowResolver: AgentResolver = (defs) =>
        defs.map(
          (d) =>
            new Agent({
              id: d.id,
              role: d.role,
              goal: d.goal,
              llmProvider: slowProvider,
            }),
        );

      const slowExecutor = new WorkflowExecutor({
        storage,
        agentResolver: slowResolver,
        requireActive: false,
      });

      const workflow = await storage.create(makeWorkflowInput());
      await expect(slowExecutor.execute(workflow.id, { timeout: 50 })).rejects.toThrow(
        WorkflowExecutionTimeoutError,
      );
    });
  });

  // -------------------------------------------------------------------------
  // Cancellation
  // -------------------------------------------------------------------------

  describe('cancellation', () => {
    it('returns false when cancelling a non-existent run', () => {
      expect(executor.cancel('nonexistent-run')).toBe(false);
    });

    it('tracks active runs', async () => {
      expect(executor.activeRunCount).toBe(0);
      expect(executor.activeRunIds).toEqual([]);

      const workflow = await storage.create(makeWorkflowInput());
      const resultPromise = executor.execute(workflow.id);

      // After execution completes, active runs should be 0
      await resultPromise;
      expect(executor.activeRunCount).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Events
  // -------------------------------------------------------------------------

  describe('events', () => {
    it('emits execution:start and execution:complete events', async () => {
      const startHandler = vi.fn();
      const completeHandler = vi.fn();

      executor.on('execution:start', startHandler);
      executor.on('execution:complete', completeHandler);

      const workflow = await storage.create(makeWorkflowInput());
      await executor.execute(workflow.id);

      expect(startHandler).toHaveBeenCalledOnce();
      expect(startHandler).toHaveBeenCalledWith(expect.stringMatching(/^run_/), workflow.id);

      expect(completeHandler).toHaveBeenCalledOnce();
      expect(completeHandler).toHaveBeenCalledWith(
        expect.stringMatching(/^run_/),
        expect.objectContaining({ success: true }),
      );
    });

    it('emits task-level events during execution', async () => {
      const taskStartHandler = vi.fn();
      const taskCompleteHandler = vi.fn();

      executor.on('execution:task:start', taskStartHandler);
      executor.on('execution:task:complete', taskCompleteHandler);

      const workflow = await storage.create(makeWorkflowInput());
      await executor.execute(workflow.id);

      // Two tasks should trigger two start and two complete events
      expect(taskStartHandler).toHaveBeenCalledTimes(2);
      expect(taskCompleteHandler).toHaveBeenCalledTimes(2);
    });

    it('emits execution:error on workflow not found', async () => {
      const errorHandler = vi.fn();
      executor.on('execution:error', errorHandler);

      await expect(executor.execute('nonexistent')).rejects.toThrow();
      expect(errorHandler).toHaveBeenCalledOnce();
    });

    it('supports once() for single-fire event subscription', async () => {
      const handler = vi.fn();
      executor.once('execution:start', handler);

      const workflow = await storage.create(makeWorkflowInput());
      await executor.execute(workflow.id);
      await executor.execute(workflow.id);

      expect(handler).toHaveBeenCalledOnce();
    });

    it('supports off() to unsubscribe', async () => {
      const handler = vi.fn();
      executor.on('execution:start', handler);
      executor.off('execution:start', handler);

      const workflow = await storage.create(makeWorkflowInput());
      await executor.execute(workflow.id);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Usage tracking integration
  // -------------------------------------------------------------------------

  describe('usage tracking', () => {
    it('records and completes a usage run when tracker and accountId are provided', async () => {
      const mockTracker = createMockUsageTracker();
      const trackedExecutor = new WorkflowExecutor({
        storage,
        agentResolver: defaultResolver,
        usageTracker: mockTracker as any,
        requireActive: false,
      });

      const workflow = await storage.create(makeWorkflowInput());
      const result = await trackedExecutor.execute(workflow.id, {
        accountId: 'acct-123',
      });

      expect(result.success).toBe(true);
      expect(mockTracker.recordRun).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 'acct-123',
          workflowId: workflow.id,
        }),
      );
      expect(mockTracker.completeRun).toHaveBeenCalledWith(
        'usage_run_1',
        expect.objectContaining({ status: 'completed' }),
      );
    });

    it('records a failed usage run when execution fails', async () => {
      const mockTracker = createMockUsageTracker();
      const failingProvider: LLMProvider = {
        name: 'failing',
        generateText: vi.fn().mockRejectedValue(new Error('Crash')),
      };

      const trackedExecutor = new WorkflowExecutor({
        storage,
        agentResolver: (defs) =>
          defs.map(
            (d) =>
              new Agent({
                id: d.id,
                role: d.role,
                goal: d.goal,
                llmProvider: failingProvider,
              }),
          ),
        usageTracker: mockTracker as any,
        requireActive: false,
      });

      const workflow = await storage.create(makeWorkflowInput());
      const result = await trackedExecutor.execute(workflow.id, {
        accountId: 'acct-123',
      });

      expect(result.success).toBe(false);
      expect(mockTracker.completeRun).toHaveBeenCalledWith(
        'usage_run_1',
        expect.objectContaining({ status: 'failed' }),
      );
    });

    it('does not call usage tracker when accountId is not provided', async () => {
      const mockTracker = createMockUsageTracker();
      const trackedExecutor = new WorkflowExecutor({
        storage,
        agentResolver: defaultResolver,
        usageTracker: mockTracker as any,
        requireActive: false,
      });

      const workflow = await storage.create(makeWorkflowInput());
      await trackedExecutor.execute(workflow.id);

      expect(mockTracker.recordRun).not.toHaveBeenCalled();
    });

    it('does not call usage tracker when none is configured', async () => {
      // Default executor has no usage tracker
      const workflow = await storage.create(makeWorkflowInput());
      const result = await executor.execute(workflow.id);

      expect(result.success).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Workflow status enforcement
  // -------------------------------------------------------------------------

  describe('workflow status enforcement', () => {
    it('allows draft execution when requireActive is false', async () => {
      const workflow = await storage.create(makeWorkflowInput());
      // Default status is 'draft'
      const result = await executor.execute(workflow.id);
      expect(result.success).toBe(true);
    });

    it('rejects archived workflows when requireActive is true', async () => {
      const strictExecutor = new WorkflowExecutor({
        storage,
        agentResolver: defaultResolver,
        requireActive: true,
      });

      const workflow = await storage.create(makeWorkflowInput());
      await storage.update(workflow.id, { status: 'archived' });

      await expect(strictExecutor.execute(workflow.id)).rejects.toThrow(WorkflowNotActiveError);
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  describe('edge cases', () => {
    it('generates unique run IDs for consecutive executions', async () => {
      const workflow = await storage.create(makeWorkflowInput());

      const result1 = await executor.execute(workflow.id);
      const result2 = await executor.execute(workflow.id);

      expect(result1.runId).not.toBe(result2.runId);
    });

    it('handles workflow with many tasks', async () => {
      const agents = [
        { id: 'a1', role: 'Agent 1', goal: 'Goal 1' },
        { id: 'a2', role: 'Agent 2', goal: 'Goal 2' },
        { id: 'a3', role: 'Agent 3', goal: 'Goal 3' },
      ];

      const tasks = [
        { id: 't1', description: 'Task 1', agentId: 'a1' },
        {
          id: 't2',
          description: 'Task 2',
          agentId: 'a2',
          dependencies: ['t1'] as readonly string[],
        },
        {
          id: 't3',
          description: 'Task 3',
          agentId: 'a3',
          dependencies: ['t1'] as readonly string[],
        },
        {
          id: 't4',
          description: 'Task 4',
          agentId: 'a1',
          dependencies: ['t2', 't3'] as readonly string[],
        },
      ];

      const workflow = await storage.create(makeWorkflowInput({ agents, tasks }));
      const result = await executor.execute(workflow.id);

      expect(result.success).toBe(true);
      expect(result.taskResults).toHaveLength(4);
    });

    it('preserves task dependencies through execution', async () => {
      const workflow = await storage.create(makeWorkflowInput());
      const taskOrder: string[] = [];

      executor.on('execution:task:start', (_runId, taskId) => {
        taskOrder.push(taskId);
      });

      await executor.execute(workflow.id);

      // 'research' must come before 'write' due to dependency
      expect(taskOrder.indexOf('research')).toBeLessThan(taskOrder.indexOf('write'));
    });
  });

  // -------------------------------------------------------------------------
  // Error class validation
  // -------------------------------------------------------------------------

  describe('error classes', () => {
    it('WorkflowNotActiveError includes workflowId and status', async () => {
      const strictExecutor = new WorkflowExecutor({
        storage,
        agentResolver: defaultResolver,
        requireActive: true,
      });

      const workflow = await storage.create(makeWorkflowInput());

      try {
        await strictExecutor.execute(workflow.id);
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error).toBeInstanceOf(WorkflowNotActiveError);
        expect(error.workflowId).toBe(workflow.id);
        expect(error.currentStatus).toBe('draft');
        expect(error.name).toBe('WorkflowNotActiveError');
      }
    });

    it('WorkflowNoAgentsError includes workflowId', async () => {
      const emptyExecutor = new WorkflowExecutor({
        storage,
        agentResolver: () => [],
        requireActive: false,
      });

      const workflow = await storage.create(makeWorkflowInput());

      try {
        await emptyExecutor.execute(workflow.id);
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error).toBeInstanceOf(WorkflowNoAgentsError);
        expect(error.workflowId).toBe(workflow.id);
        expect(error.name).toBe('WorkflowNoAgentsError');
      }
    });

    it('WorkflowExecutionTimeoutError includes runId and timeout', async () => {
      const slowProvider: LLMProvider = {
        name: 'slow',
        generateText: () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  content: 'late',
                  tokenUsage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
                  finishReason: 'stop',
                }),
              5000,
            ),
          ),
      };

      const slowExecutor = new WorkflowExecutor({
        storage,
        agentResolver: (defs) =>
          defs.map(
            (d) => new Agent({ id: d.id, role: d.role, goal: d.goal, llmProvider: slowProvider }),
          ),
        requireActive: false,
      });

      const workflow = await storage.create(makeWorkflowInput());

      try {
        await slowExecutor.execute(workflow.id, { timeout: 30 });
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error).toBeInstanceOf(WorkflowExecutionTimeoutError);
        expect(error.runId).toMatch(/^run_/);
        expect(error.timeoutMs).toBe(30);
        expect(error.name).toBe('WorkflowExecutionTimeoutError');
        expect(error.isRetryable).toBe(true);
      }
    });

    it('WorkflowExecutionCancelledError includes runId', () => {
      const err = new WorkflowExecutionCancelledError('run_abc');
      expect(err.name).toBe('WorkflowExecutionCancelledError');
      expect(err.runId).toBe('run_abc');
      expect(err.toJSON().details).toEqual({ runId: 'run_abc' });
    });
  });
});
