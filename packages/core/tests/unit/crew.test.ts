import { describe, it, expect, vi, beforeEach } from 'vitest';

import { Agent } from '../../src/agent/agent.js';
import { Crew } from '../../src/crew/crew.js';
import { CrewConfigError, CrewExecutionError } from '../../src/errors/crew-errors.js';
import { CrewStatus } from '../../src/types/crew.js';
import type { CrewRunResult } from '../../src/types/crew.js';
import type { LLMProvider, LLMResponse, LLMMessage } from '../../src/types/index.js';

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Crew', () => {
  describe('construction', () => {
    it('should create a crew with minimal config', () => {
      const agent = createAgent('agent-1');
      const crew = new Crew({
        id: 'test-crew',
        agents: [agent],
        tasks: [{ id: 'task-1', description: 'Do something', agentId: 'agent-1' }],
      });

      expect(crew.id).toBe('test-crew');
      expect(crew.name).toBe('test-crew');
      expect(crew.verbose).toBe(false);
      expect(crew.status).toBe(CrewStatus.IDLE);
      expect(crew.agents.size).toBe(1);
      expect(crew.tasks).toHaveLength(1);
    });

    it('should create a crew with full config', () => {
      const agent1 = createAgent('agent-1');
      const agent2 = createAgent('agent-2');
      const crew = new Crew({
        id: 'full-crew',
        name: 'Full Crew',
        agents: [agent1, agent2],
        tasks: [
          { id: 'task-1', description: 'First task', agentId: 'agent-1' },
          {
            id: 'task-2',
            description: 'Second task',
            agentId: 'agent-2',
            dependencies: ['task-1'],
          },
        ],
        verbose: true,
      });

      expect(crew.name).toBe('Full Crew');
      expect(crew.verbose).toBe(true);
      expect(crew.agents.size).toBe(2);
      expect(crew.tasks).toHaveLength(2);
    });

    it('should reject empty id', () => {
      const agent = createAgent('a');
      expect(
        () =>
          new Crew({
            id: '',
            agents: [agent],
            tasks: [{ id: 't', description: 'x', agentId: 'a' }],
          }),
      ).toThrow(CrewConfigError);
    });

    it('should reject invalid id characters', () => {
      const agent = createAgent('a');
      expect(
        () =>
          new Crew({
            id: 'bad crew!',
            agents: [agent],
            tasks: [{ id: 't', description: 'x', agentId: 'a' }],
          }),
      ).toThrow(CrewConfigError);
    });

    it('should reject empty agents array', () => {
      expect(
        () =>
          new Crew({
            id: 'crew',
            agents: [],
            tasks: [{ id: 't', description: 'x', agentId: 'a' }],
          }),
      ).toThrow(CrewConfigError);
    });

    it('should reject empty tasks array', () => {
      const agent = createAgent('a');
      expect(() => new Crew({ id: 'crew', agents: [agent], tasks: [] })).toThrow(CrewConfigError);
    });

    it('should reject duplicate agent ids', () => {
      const agent1 = createAgent('dup');
      const agent2 = createAgent('dup');
      expect(
        () =>
          new Crew({
            id: 'crew',
            agents: [agent1, agent2],
            tasks: [{ id: 't', description: 'x', agentId: 'dup' }],
          }),
      ).toThrow(CrewConfigError);
      expect(
        () =>
          new Crew({
            id: 'crew',
            agents: [agent1, agent2],
            tasks: [{ id: 't', description: 'x', agentId: 'dup' }],
          }),
      ).toThrow('Duplicate agent id');
    });

    it('should reject duplicate task ids', () => {
      const agent = createAgent('a');
      expect(
        () =>
          new Crew({
            id: 'crew',
            agents: [agent],
            tasks: [
              { id: 'dup-task', description: 'First', agentId: 'a' },
              { id: 'dup-task', description: 'Second', agentId: 'a' },
            ],
          }),
      ).toThrow(CrewConfigError);
      expect(
        () =>
          new Crew({
            id: 'crew',
            agents: [agent],
            tasks: [
              { id: 'dup-task', description: 'First', agentId: 'a' },
              { id: 'dup-task', description: 'Second', agentId: 'a' },
            ],
          }),
      ).toThrow('Duplicate task id');
    });

    it('should reject tasks referencing unknown agents', () => {
      const agent = createAgent('a');
      expect(
        () =>
          new Crew({
            id: 'crew',
            agents: [agent],
            tasks: [{ id: 't', description: 'x', agentId: 'nonexistent' }],
          }),
      ).toThrow(CrewConfigError);
      expect(
        () =>
          new Crew({
            id: 'crew',
            agents: [agent],
            tasks: [{ id: 't', description: 'x', agentId: 'nonexistent' }],
          }),
      ).toThrow('unknown agent');
    });

    it('should reject tasks with unknown dependencies', () => {
      const agent = createAgent('a');
      expect(
        () =>
          new Crew({
            id: 'crew',
            agents: [agent],
            tasks: [{ id: 't', description: 'x', agentId: 'a', dependencies: ['missing'] }],
          }),
      ).toThrow(CrewConfigError);
      expect(
        () =>
          new Crew({
            id: 'crew',
            agents: [agent],
            tasks: [{ id: 't', description: 'x', agentId: 'a', dependencies: ['missing'] }],
          }),
      ).toThrow('unknown task');
    });

    it('should reject self-referential dependencies', () => {
      const agent = createAgent('a');
      expect(
        () =>
          new Crew({
            id: 'crew',
            agents: [agent],
            tasks: [{ id: 't', description: 'x', agentId: 'a', dependencies: ['t'] }],
          }),
      ).toThrow(CrewConfigError);
      expect(
        () =>
          new Crew({
            id: 'crew',
            agents: [agent],
            tasks: [{ id: 't', description: 'x', agentId: 'a', dependencies: ['t'] }],
          }),
      ).toThrow('cannot depend on itself');
    });

    it('should reject circular dependencies', () => {
      const agent = createAgent('a');
      expect(
        () =>
          new Crew({
            id: 'crew',
            agents: [agent],
            tasks: [
              { id: 't1', description: 'x', agentId: 'a', dependencies: ['t2'] },
              { id: 't2', description: 'y', agentId: 'a', dependencies: ['t1'] },
            ],
          }),
      ).toThrow(CrewConfigError);
      expect(
        () =>
          new Crew({
            id: 'crew',
            agents: [agent],
            tasks: [
              { id: 't1', description: 'x', agentId: 'a', dependencies: ['t2'] },
              { id: 't2', description: 'y', agentId: 'a', dependencies: ['t1'] },
            ],
          }),
      ).toThrow('Circular dependency');
    });

    it('should reject three-node circular dependencies', () => {
      const agent = createAgent('a');
      expect(
        () =>
          new Crew({
            id: 'crew',
            agents: [agent],
            tasks: [
              { id: 't1', description: 'x', agentId: 'a', dependencies: ['t3'] },
              { id: 't2', description: 'y', agentId: 'a', dependencies: ['t1'] },
              { id: 't3', description: 'z', agentId: 'a', dependencies: ['t2'] },
            ],
          }),
      ).toThrow('Circular dependency');
    });

    it('should accept valid task with empty description (rejected by Zod)', () => {
      const agent = createAgent('a');
      expect(
        () =>
          new Crew({
            id: 'crew',
            agents: [agent],
            tasks: [{ id: 't', description: '', agentId: 'a' }],
          }),
      ).toThrow(CrewConfigError);
    });

    it('should accept tasks with optional fields', () => {
      const agent = createAgent('a');
      const crew = new Crew({
        id: 'crew',
        agents: [agent],
        tasks: [
          {
            id: 't',
            description: 'Do it',
            agentId: 'a',
            expectedOutput: 'A report',
            context: { key: 'value' },
          },
        ],
      });
      expect(crew.tasks[0]!.expectedOutput).toBe('A report');
      expect(crew.tasks[0]!.context).toEqual({ key: 'value' });
    });
  });

  describe('execution', () => {
    let agent1: Agent;
    let agent2: Agent;

    beforeEach(() => {
      agent1 = createAgent('agent-1', 'Result from agent-1');
      agent2 = createAgent('agent-2', 'Result from agent-2');
    });

    it('should execute a single task and return results', async () => {
      const crew = new Crew({
        id: 'single-crew',
        agents: [agent1],
        tasks: [{ id: 'task-1', description: 'Do something', agentId: 'agent-1' }],
      });

      const result = await crew.run();

      expect(result.crewId).toBe('single-crew');
      expect(result.success).toBe(true);
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.taskResults.size).toBe(1);
      expect(result.taskResults.get('task-1')!.output).toBe('Result from agent-1');
    });

    it('should execute multiple tasks in sequence', async () => {
      const crew = new Crew({
        id: 'multi-crew',
        agents: [agent1, agent2],
        tasks: [
          { id: 'task-1', description: 'First', agentId: 'agent-1' },
          { id: 'task-2', description: 'Second', agentId: 'agent-2' },
        ],
      });

      const result = await crew.run();

      expect(result.success).toBe(true);
      expect(result.taskResults.size).toBe(2);
      expect(result.taskResults.get('task-1')!.output).toBe('Result from agent-1');
      expect(result.taskResults.get('task-2')!.output).toBe('Result from agent-2');
    });

    it('should execute tasks in dependency order', async () => {
      const executionOrder: string[] = [];
      const trackingProvider1: LLMProvider = {
        name: 'tracker-1',
        generateText: vi
          .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
          .mockImplementation(async () => {
            executionOrder.push('task-1');
            return {
              content: 'First',
              tokenUsage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
              finishReason: 'stop',
            };
          }),
      };
      const trackingProvider2: LLMProvider = {
        name: 'tracker-2',
        generateText: vi
          .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
          .mockImplementation(async () => {
            executionOrder.push('task-2');
            return {
              content: 'Second',
              tokenUsage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
              finishReason: 'stop',
            };
          }),
      };

      const a1 = new Agent({ id: 'a1', role: 'R', goal: 'G', llmProvider: trackingProvider1 });
      const a2 = new Agent({ id: 'a2', role: 'R', goal: 'G', llmProvider: trackingProvider2 });

      // Define task-2 first but it depends on task-1
      const crew = new Crew({
        id: 'order-crew',
        agents: [a1, a2],
        tasks: [
          { id: 'task-2', description: 'Second', agentId: 'a2', dependencies: ['task-1'] },
          { id: 'task-1', description: 'First', agentId: 'a1' },
        ],
      });

      await crew.run();

      expect(executionOrder).toEqual(['task-1', 'task-2']);
    });

    it('should pass dependency results as context', async () => {
      let capturedMessages: readonly LLMMessage[] = [];
      const secondProvider: LLMProvider = {
        name: 'capture',
        generateText: vi
          .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
          .mockImplementation(async (messages) => {
            capturedMessages = messages;
            return {
              content: 'Final',
              tokenUsage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
              finishReason: 'stop',
            };
          }),
      };

      const a1 = createAgent('a1', 'Research results here');
      const a2 = new Agent({
        id: 'a2',
        role: 'Writer',
        goal: 'Write',
        llmProvider: secondProvider,
      });

      const crew = new Crew({
        id: 'context-crew',
        agents: [a1, a2],
        tasks: [
          { id: 'research', description: 'Research stuff', agentId: 'a1' },
          { id: 'write', description: 'Write article', agentId: 'a2', dependencies: ['research'] },
        ],
      });

      await crew.run();

      const userMessage = capturedMessages.find((m) => m.role === 'user');
      expect(userMessage!.content).toContain('dependencyResults');
      expect(userMessage!.content).toContain('Research results here');
    });

    it('should throw if crew is already running', async () => {
      const slowProvider: LLMProvider = {
        name: 'slow',
        generateText: vi
          .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
          .mockImplementation(
            () =>
              new Promise((resolve) => {
                setTimeout(() => {
                  resolve({
                    content: 'done',
                    tokenUsage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
                    finishReason: 'stop',
                  });
                }, 100);
              }),
          ),
      };

      const agent = new Agent({
        id: 'slow-agent',
        role: 'R',
        goal: 'G',
        llmProvider: slowProvider,
      });
      const crew = new Crew({
        id: 'busy-crew',
        agents: [agent],
        tasks: [{ id: 't', description: 'x', agentId: 'slow-agent' }],
      });

      // Start first run without awaiting
      const firstRun = crew.run();

      // Try to run again immediately
      await expect(crew.run()).rejects.toThrow(CrewExecutionError);
      await expect(crew.run()).rejects.toThrow('already running');

      await firstRun;
    });

    it('should set status to ERROR when a task fails', async () => {
      const failProvider: LLMProvider = {
        name: 'fail',
        generateText: vi
          .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
          .mockRejectedValue(new Error('LLM unavailable')),
      };
      const failAgent = new Agent({
        id: 'fail-agent',
        role: 'R',
        goal: 'G',
        llmProvider: failProvider,
      });

      const crew = new Crew({
        id: 'fail-crew',
        agents: [failAgent],
        tasks: [{ id: 't', description: 'x', agentId: 'fail-agent' }],
      });

      await expect(crew.run()).rejects.toThrow(CrewExecutionError);
      expect(crew.status).toBe(CrewStatus.ERROR);
    });

    it('should include task id in execution error', async () => {
      const failProvider: LLMProvider = {
        name: 'fail',
        generateText: vi
          .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
          .mockRejectedValue(new Error('Boom')),
      };
      const failAgent = new Agent({
        id: 'fail-a',
        role: 'R',
        goal: 'G',
        llmProvider: failProvider,
      });

      const crew = new Crew({
        id: 'err-crew',
        agents: [failAgent],
        tasks: [{ id: 'failing-task', description: 'x', agentId: 'fail-a' }],
      });

      try {
        await crew.run();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(CrewExecutionError);
        expect((error as CrewExecutionError).taskId).toBe('failing-task');
      }
    });

    it('should transition through correct statuses on success', async () => {
      const statuses: CrewStatus[] = [];
      const crew = new Crew({
        id: 'status-crew',
        agents: [agent1],
        tasks: [{ id: 't', description: 'x', agentId: 'agent-1' }],
      });

      crew.on('crew:status-changed', (_id, status) => {
        statuses.push(status);
      });

      await crew.run();

      expect(statuses).toEqual([CrewStatus.RUNNING, CrewStatus.COMPLETED]);
      expect(crew.status).toBe(CrewStatus.COMPLETED);
    });

    it('should transition through correct statuses on failure', async () => {
      const failProvider: LLMProvider = {
        name: 'fail',
        generateText: vi
          .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
          .mockRejectedValue(new Error('Fail')),
      };
      const failAgent = new Agent({ id: 'fa', role: 'R', goal: 'G', llmProvider: failProvider });

      const statuses: CrewStatus[] = [];
      const crew = new Crew({
        id: 'fail-status',
        agents: [failAgent],
        tasks: [{ id: 't', description: 'x', agentId: 'fa' }],
      });

      crew.on('crew:status-changed', (_id, status) => {
        statuses.push(status);
      });

      await expect(crew.run()).rejects.toThrow();

      expect(statuses).toEqual([CrewStatus.RUNNING, CrewStatus.ERROR]);
    });

    it('should include static context in task input', async () => {
      let capturedMessages: readonly LLMMessage[] = [];
      const captureProvider: LLMProvider = {
        name: 'capture',
        generateText: vi
          .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
          .mockImplementation(async (messages) => {
            capturedMessages = messages;
            return {
              content: 'done',
              tokenUsage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
              finishReason: 'stop',
            };
          }),
      };

      const agent = new Agent({
        id: 'ctx-agent',
        role: 'R',
        goal: 'G',
        llmProvider: captureProvider,
      });
      const crew = new Crew({
        id: 'ctx-crew',
        agents: [agent],
        tasks: [
          {
            id: 't',
            description: 'Do it',
            agentId: 'ctx-agent',
            context: { key: 'value', num: 42 },
          },
        ],
      });

      await crew.run();

      const userMsg = capturedMessages.find((m) => m.role === 'user');
      expect(userMsg!.content).toContain('"key": "value"');
      expect(userMsg!.content).toContain('42');
    });

    it('should include expectedOutput in task input', async () => {
      let capturedMessages: readonly LLMMessage[] = [];
      const captureProvider: LLMProvider = {
        name: 'capture',
        generateText: vi
          .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
          .mockImplementation(async (messages) => {
            capturedMessages = messages;
            return {
              content: 'done',
              tokenUsage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
              finishReason: 'stop',
            };
          }),
      };

      const agent = new Agent({
        id: 'eo-agent',
        role: 'R',
        goal: 'G',
        llmProvider: captureProvider,
      });
      const crew = new Crew({
        id: 'eo-crew',
        agents: [agent],
        tasks: [
          {
            id: 't',
            description: 'Analyze data',
            agentId: 'eo-agent',
            expectedOutput: 'A bullet-point list',
          },
        ],
      });

      await crew.run();

      const userMsg = capturedMessages.find((m) => m.role === 'user');
      expect(userMsg!.content).toContain('A bullet-point list');
    });
  });

  describe('reset', () => {
    it('should reset status to IDLE after completion', async () => {
      const agent = createAgent('a');
      const crew = new Crew({
        id: 'reset-crew',
        agents: [agent],
        tasks: [{ id: 't', description: 'x', agentId: 'a' }],
      });

      await crew.run();
      expect(crew.status).toBe(CrewStatus.COMPLETED);

      crew.reset();
      expect(crew.status).toBe(CrewStatus.IDLE);
    });

    it('should reset status to IDLE after error', async () => {
      const failProvider: LLMProvider = {
        name: 'fail',
        generateText: vi
          .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
          .mockRejectedValue(new Error('Fail')),
      };
      const failAgent = new Agent({ id: 'fa', role: 'R', goal: 'G', llmProvider: failProvider });

      const crew = new Crew({
        id: 'reset-err',
        agents: [failAgent],
        tasks: [{ id: 't', description: 'x', agentId: 'fa' }],
      });

      await expect(crew.run()).rejects.toThrow();
      expect(crew.status).toBe(CrewStatus.ERROR);

      crew.reset();
      expect(crew.status).toBe(CrewStatus.IDLE);
    });

    it('should throw when resetting a running crew', async () => {
      const slowProvider: LLMProvider = {
        name: 'slow',
        generateText: vi
          .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
          .mockImplementation(
            () =>
              new Promise((resolve) => {
                setTimeout(() => {
                  resolve({
                    content: 'done',
                    tokenUsage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
                    finishReason: 'stop',
                  });
                }, 100);
              }),
          ),
      };

      const agent = new Agent({ id: 'slow-a', role: 'R', goal: 'G', llmProvider: slowProvider });
      const crew = new Crew({
        id: 'reset-run',
        agents: [agent],
        tasks: [{ id: 't', description: 'x', agentId: 'slow-a' }],
      });

      const runPromise = crew.run();
      expect(() => {
        crew.reset();
      }).toThrow(CrewExecutionError);
      await runPromise;
    });

    it('should allow re-running after reset', async () => {
      const agent = createAgent('a');
      const crew = new Crew({
        id: 'rerun-crew',
        agents: [agent],
        tasks: [{ id: 't', description: 'x', agentId: 'a' }],
      });

      const result1 = await crew.run();
      expect(result1.success).toBe(true);

      crew.reset();
      const result2 = await crew.run();
      expect(result2.success).toBe(true);
    });
  });

  describe('events', () => {
    it('should emit crew:start and crew:complete events', async () => {
      const agent = createAgent('a');
      const crew = new Crew({
        id: 'event-crew',
        agents: [agent],
        tasks: [{ id: 't', description: 'x', agentId: 'a' }],
      });

      const startListener = vi.fn();
      const completeListener = vi.fn();

      crew.on('crew:start', startListener);
      crew.on('crew:complete', completeListener);

      await crew.run();

      expect(startListener).toHaveBeenCalledOnce();
      expect(startListener).toHaveBeenCalledWith('event-crew');
      expect(completeListener).toHaveBeenCalledOnce();
      expect(completeListener.mock.calls[0]![0]).toBe('event-crew');
      const runResult = completeListener.mock.calls[0]![1] as CrewRunResult;
      expect(runResult.success).toBe(true);
    });

    it('should emit crew:error on failure', async () => {
      const failProvider: LLMProvider = {
        name: 'fail',
        generateText: vi
          .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
          .mockRejectedValue(new Error('Boom')),
      };
      const failAgent = new Agent({ id: 'fa', role: 'R', goal: 'G', llmProvider: failProvider });

      const crew = new Crew({
        id: 'err-event',
        agents: [failAgent],
        tasks: [{ id: 't', description: 'x', agentId: 'fa' }],
      });

      const errorListener = vi.fn();
      crew.on('crew:error', errorListener);

      await expect(crew.run()).rejects.toThrow();

      expect(errorListener).toHaveBeenCalledOnce();
      expect(errorListener.mock.calls[0]![0]).toBe('err-event');
      expect(errorListener.mock.calls[0]![1]).toBeInstanceOf(Error);
    });

    it('should emit crew:task:start and crew:task:complete for each task', async () => {
      const agent1 = createAgent('a1');
      const agent2 = createAgent('a2');

      const crew = new Crew({
        id: 'task-events',
        agents: [agent1, agent2],
        tasks: [
          { id: 't1', description: 'First', agentId: 'a1' },
          { id: 't2', description: 'Second', agentId: 'a2' },
        ],
      });

      const taskStartListener = vi.fn();
      const taskCompleteListener = vi.fn();

      crew.on('crew:task:start', taskStartListener);
      crew.on('crew:task:complete', taskCompleteListener);

      await crew.run();

      expect(taskStartListener).toHaveBeenCalledTimes(2);
      expect(taskStartListener.mock.calls[0]).toEqual(['task-events', 't1', 'a1']);
      expect(taskStartListener.mock.calls[1]).toEqual(['task-events', 't2', 'a2']);

      expect(taskCompleteListener).toHaveBeenCalledTimes(2);
      expect(taskCompleteListener.mock.calls[0]![1]).toBe('t1');
      expect(taskCompleteListener.mock.calls[1]![1]).toBe('t2');
    });

    it('should emit crew:task:error when a task fails', async () => {
      const failProvider: LLMProvider = {
        name: 'fail',
        generateText: vi
          .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
          .mockRejectedValue(new Error('Task Boom')),
      };
      const failAgent = new Agent({ id: 'fa', role: 'R', goal: 'G', llmProvider: failProvider });

      const crew = new Crew({
        id: 'task-err-event',
        agents: [failAgent],
        tasks: [{ id: 'fail-t', description: 'x', agentId: 'fa' }],
      });

      const taskErrorListener = vi.fn();
      crew.on('crew:task:error', taskErrorListener);

      await expect(crew.run()).rejects.toThrow();

      expect(taskErrorListener).toHaveBeenCalledOnce();
      expect(taskErrorListener.mock.calls[0]![1]).toBe('fail-t');
      expect(taskErrorListener.mock.calls[0]![2]).toBeInstanceOf(Error);
    });

    it('should support once() for single-fire listeners', async () => {
      const agent = createAgent('a');
      const crew = new Crew({
        id: 'once-crew',
        agents: [agent],
        tasks: [{ id: 't', description: 'x', agentId: 'a' }],
      });

      const listener = vi.fn();
      crew.once('crew:complete', listener);

      await crew.run();
      crew.reset();
      await crew.run();

      expect(listener).toHaveBeenCalledOnce();
    });

    it('should support off() to remove listeners', async () => {
      const agent = createAgent('a');
      const crew = new Crew({
        id: 'off-crew',
        agents: [agent],
        tasks: [{ id: 't', description: 'x', agentId: 'a' }],
      });

      const listener = vi.fn();
      crew.on('crew:complete', listener);
      crew.off('crew:complete', listener);

      await crew.run();

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('topological sort', () => {
    it('should handle diamond dependencies', async () => {
      const executionOrder: string[] = [];

      function makeTrackingAgent(id: string): Agent {
        const provider: LLMProvider = {
          name: `tracker-${id}`,
          generateText: vi
            .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
            .mockImplementation(async () => {
              executionOrder.push(id);
              return {
                content: `Out:${id}`,
                tokenUsage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
                finishReason: 'stop',
              };
            }),
        };
        return new Agent({ id, role: 'R', goal: 'G', llmProvider: provider });
      }

      const a = makeTrackingAgent('a');
      const b = makeTrackingAgent('b');
      const c = makeTrackingAgent('c');
      const d = makeTrackingAgent('d');

      //   a
      //  / \
      // b   c
      //  \ /
      //   d
      const crew = new Crew({
        id: 'diamond',
        agents: [a, b, c, d],
        tasks: [
          { id: 'ta', description: 'A', agentId: 'a' },
          { id: 'tb', description: 'B', agentId: 'b', dependencies: ['ta'] },
          { id: 'tc', description: 'C', agentId: 'c', dependencies: ['ta'] },
          { id: 'td', description: 'D', agentId: 'd', dependencies: ['tb', 'tc'] },
        ],
      });

      await crew.run();

      // 'a' must come first, 'd' must come last
      expect(executionOrder[0]).toBe('a');
      expect(executionOrder[3]).toBe('d');
      // b and c can be in either order
      expect(executionOrder.slice(1, 3).sort()).toEqual(['b', 'c']);
    });

    it('should handle no dependencies (preserves definition order)', async () => {
      const executionOrder: string[] = [];

      function makeTrackingAgent(id: string): Agent {
        const provider: LLMProvider = {
          name: `tracker-${id}`,
          generateText: vi
            .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
            .mockImplementation(async () => {
              executionOrder.push(id);
              return {
                content: 'out',
                tokenUsage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
                finishReason: 'stop',
              };
            }),
        };
        return new Agent({ id, role: 'R', goal: 'G', llmProvider: provider });
      }

      const a1 = makeTrackingAgent('x');
      const a2 = makeTrackingAgent('y');
      const a3 = makeTrackingAgent('z');

      const crew = new Crew({
        id: 'no-deps',
        agents: [a1, a2, a3],
        tasks: [
          { id: 'tx', description: 'X', agentId: 'x' },
          { id: 'ty', description: 'Y', agentId: 'y' },
          { id: 'tz', description: 'Z', agentId: 'z' },
        ],
      });

      await crew.run();

      expect(executionOrder).toEqual(['x', 'y', 'z']);
    });
  });

  // =========================================================================
  // Additional tests for TASK-017 — expanded Crew class coverage (>80%)
  // =========================================================================

  describe('construction — additional validation', () => {
    it('should reject task with empty id', () => {
      const agent = createAgent('a');
      expect(
        () =>
          new Crew({
            id: 'crew',
            agents: [agent],
            tasks: [{ id: '', description: 'Task', agentId: 'a' }],
          }),
      ).toThrow(CrewConfigError);
    });

    it('should reject task with invalid id characters', () => {
      const agent = createAgent('a');
      expect(
        () =>
          new Crew({
            id: 'crew',
            agents: [agent],
            tasks: [{ id: 'bad task!', description: 'Task', agentId: 'a' }],
          }),
      ).toThrow(CrewConfigError);
    });

    it('should reject task with empty agentId', () => {
      const agent = createAgent('a');
      expect(
        () =>
          new Crew({
            id: 'crew',
            agents: [agent],
            tasks: [{ id: 't', description: 'Task', agentId: '' }],
          }),
      ).toThrow(CrewConfigError);
    });

    it('should handle crew with many agents and tasks', () => {
      const agents = Array.from({ length: 10 }, (_, i) => createAgent(`agent-${String(i)}`));
      const tasks = agents.map((a, i) => ({
        id: `task-${String(i)}`,
        description: `Task ${String(i)}`,
        agentId: a.id,
      }));
      const crew = new Crew({ id: 'large-crew', agents, tasks });
      expect(crew.agents.size).toBe(10);
      expect(crew.tasks).toHaveLength(10);
    });

    it('should accept task with empty dependencies array', () => {
      const agent = createAgent('a');
      const crew = new Crew({
        id: 'crew',
        agents: [agent],
        tasks: [{ id: 't', description: 'Task', agentId: 'a', dependencies: [] }],
      });
      expect(crew.tasks).toHaveLength(1);
    });

    it('should accept single agent handling multiple tasks', () => {
      const agent = createAgent('a');
      const crew = new Crew({
        id: 'crew',
        agents: [agent],
        tasks: [
          { id: 't1', description: 'First', agentId: 'a' },
          { id: 't2', description: 'Second', agentId: 'a' },
          { id: 't3', description: 'Third', agentId: 'a', dependencies: ['t1', 't2'] },
        ],
      });
      expect(crew.tasks).toHaveLength(3);
    });

    it('should accept task with duplicate entries in dependencies array', () => {
      const agent = createAgent('a');
      const crew = new Crew({
        id: 'crew',
        agents: [agent],
        tasks: [
          { id: 't1', description: 'First', agentId: 'a' },
          { id: 't2', description: 'Second', agentId: 'a', dependencies: ['t1', 't1'] },
        ],
      });
      expect(crew.tasks).toHaveLength(2);
    });

    it('should default verbose to false when not specified', () => {
      const agent = createAgent('a');
      const crew = new Crew({
        id: 'crew',
        agents: [agent],
        tasks: [{ id: 't', description: 'x', agentId: 'a' }],
      });
      expect(crew.verbose).toBe(false);
    });

    it('should reject crew with id containing spaces', () => {
      const agent = createAgent('a');
      expect(
        () =>
          new Crew({
            id: 'bad crew',
            agents: [agent],
            tasks: [{ id: 't', description: 'x', agentId: 'a' }],
          }),
      ).toThrow(CrewConfigError);
    });

    it('should accept crew id with dashes and underscores', () => {
      const agent = createAgent('a');
      const crew = new Crew({
        id: 'my-crew_v2',
        agents: [agent],
        tasks: [{ id: 't', description: 'x', agentId: 'a' }],
      });
      expect(crew.id).toBe('my-crew_v2');
    });
  });

  describe('execution — error handling edge cases', () => {
    it('should allow run after error state without explicit reset', async () => {
      let callCount = 0;
      const sometimesFailProvider: LLMProvider = {
        name: 'sometimes-fail',
        generateText: vi
          .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
          .mockImplementation(async () => {
            callCount++;
            if (callCount === 1) {
              throw new Error('First call fails');
            }
            return {
              content: 'Success',
              tokenUsage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
              finishReason: 'stop',
            };
          }),
      };

      const agent = new Agent({
        id: 'a',
        role: 'R',
        goal: 'G',
        llmProvider: sometimesFailProvider,
      });
      const crew = new Crew({
        id: 'retry-crew',
        agents: [agent],
        tasks: [{ id: 't', description: 'x', agentId: 'a' }],
      });

      await expect(crew.run()).rejects.toThrow();
      expect(crew.status).toBe(CrewStatus.ERROR);

      const result = await crew.run();
      expect(result.success).toBe(true);
      expect(crew.status).toBe(CrewStatus.COMPLETED);
    });

    it('should handle non-Error thrown by mock agent execute', async () => {
      const mockAgent = {
        id: 'mock-a',
        execute: vi.fn().mockRejectedValue('string error value'),
      };

      const crew = new Crew({
        id: 'non-error-crew',
        agents: [mockAgent as unknown as Agent],
        tasks: [{ id: 't', description: 'x', agentId: 'mock-a' }],
      });

      try {
        await crew.run();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(CrewExecutionError);
        expect((error as CrewExecutionError).message).toContain('string error value');
        expect((error as CrewExecutionError).taskId).toBe('t');
      }
    });

    it('should stop execution when first task in sequence fails', async () => {
      const failProvider: LLMProvider = {
        name: 'fail',
        generateText: vi
          .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
          .mockRejectedValue(new Error('Boom')),
      };
      const successProvider = createMockLLMProvider();

      const failAgent = new Agent({
        id: 'fail-a',
        role: 'R',
        goal: 'G',
        llmProvider: failProvider,
      });
      const successAgent = new Agent({
        id: 'ok-a',
        role: 'R',
        goal: 'G',
        llmProvider: successProvider,
      });

      const crew = new Crew({
        id: 'partial-crew',
        agents: [failAgent, successAgent],
        tasks: [
          { id: 't1', description: 'Fails', agentId: 'fail-a' },
          { id: 't2', description: 'Never runs', agentId: 'ok-a' },
        ],
      });

      await expect(crew.run()).rejects.toThrow(CrewExecutionError);
      expect(successProvider.generateText).not.toHaveBeenCalled();
    });

    it('should wrap error cause in CrewExecutionError', async () => {
      const originalError = new Error('Root cause');
      const failProvider: LLMProvider = {
        name: 'fail',
        generateText: vi
          .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
          .mockRejectedValue(originalError),
      };

      const agent = new Agent({ id: 'a', role: 'R', goal: 'G', llmProvider: failProvider });
      const crew = new Crew({
        id: 'cause-crew',
        agents: [agent],
        tasks: [{ id: 't', description: 'x', agentId: 'a' }],
      });

      try {
        await crew.run();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(CrewExecutionError);
        expect((error as CrewExecutionError).cause).toBeDefined();
      }
    });

    it('should report correct crewId in execution error', async () => {
      const failProvider: LLMProvider = {
        name: 'fail',
        generateText: vi
          .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
          .mockRejectedValue(new Error('Fail')),
      };

      const agent = new Agent({ id: 'a', role: 'R', goal: 'G', llmProvider: failProvider });
      const crew = new Crew({
        id: 'named-crew',
        agents: [agent],
        tasks: [{ id: 't', description: 'x', agentId: 'a' }],
      });

      try {
        await crew.run();
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as CrewExecutionError).crewId).toBe('named-crew');
      }
    });

    it('should only execute dependent task after all dependencies complete', async () => {
      const executionOrder: string[] = [];
      const failProvider: LLMProvider = {
        name: 'fail',
        generateText: vi
          .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
          .mockImplementation(async () => {
            executionOrder.push('dep-b');
            throw new Error('Dep B fails');
          }),
      };

      const a1 = createAgent('a1', 'ok');
      const a2 = new Agent({ id: 'a2', role: 'R', goal: 'G', llmProvider: failProvider });

      const crew = new Crew({
        id: 'dep-fail',
        agents: [a1, a2],
        tasks: [
          { id: 'dep-a', description: 'First dep succeeds', agentId: 'a1' },
          { id: 'dep-b', description: 'Second dep fails', agentId: 'a2' },
        ],
      });

      try {
        await crew.run();
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as CrewExecutionError).taskId).toBe('dep-b');
      }
    });
  });

  describe('execution — context building', () => {
    it('should not inject dependencyResults when task has empty deps array', async () => {
      let capturedMessages: readonly LLMMessage[] = [];
      const captureProvider: LLMProvider = {
        name: 'capture',
        generateText: vi
          .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
          .mockImplementation(async (messages) => {
            capturedMessages = messages;
            return {
              content: 'done',
              tokenUsage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
              finishReason: 'stop',
            };
          }),
      };

      const agent = new Agent({ id: 'a', role: 'R', goal: 'G', llmProvider: captureProvider });
      const crew = new Crew({
        id: 'empty-deps',
        agents: [agent],
        tasks: [{ id: 't', description: 'Simple task', agentId: 'a', dependencies: [] }],
      });

      await crew.run();

      const userMsg = capturedMessages.find((m) => m.role === 'user');
      expect(userMsg).toBeDefined();
      expect(userMsg!.content).not.toContain('dependencyResults');
    });

    it('should merge static context with dependency results', async () => {
      let capturedMessages: readonly LLMMessage[] = [];
      const secondProvider: LLMProvider = {
        name: 'capture',
        generateText: vi
          .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
          .mockImplementation(async (messages) => {
            capturedMessages = messages;
            return {
              content: 'Final output',
              tokenUsage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
              finishReason: 'stop',
            };
          }),
      };

      const a1 = createAgent('a1', 'Dep result');
      const a2 = new Agent({ id: 'a2', role: 'R', goal: 'G', llmProvider: secondProvider });

      const crew = new Crew({
        id: 'merge-ctx',
        agents: [a1, a2],
        tasks: [
          { id: 'dep', description: 'Dependency', agentId: 'a1' },
          {
            id: 'main',
            description: 'Main task',
            agentId: 'a2',
            dependencies: ['dep'],
            context: { staticKey: 'staticValue' },
          },
        ],
      });

      await crew.run();

      const userMsg = capturedMessages.find((m) => m.role === 'user');
      expect(userMsg).toBeDefined();
      expect(userMsg!.content).toContain('staticKey');
      expect(userMsg!.content).toContain('staticValue');
      expect(userMsg!.content).toContain('dependencyResults');
      expect(userMsg!.content).toContain('Dep result');
    });

    it('should inject multiple dependency results', async () => {
      let capturedMessages: readonly LLMMessage[] = [];
      const captureProvider: LLMProvider = {
        name: 'capture',
        generateText: vi
          .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
          .mockImplementation(async (messages) => {
            capturedMessages = messages;
            return {
              content: 'Final',
              tokenUsage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
              finishReason: 'stop',
            };
          }),
      };

      const a1 = createAgent('a1', 'Result-A');
      const a2 = createAgent('a2', 'Result-B');
      const a3 = new Agent({ id: 'a3', role: 'R', goal: 'G', llmProvider: captureProvider });

      const crew = new Crew({
        id: 'multi-dep',
        agents: [a1, a2, a3],
        tasks: [
          { id: 'dep-a', description: 'First dep', agentId: 'a1' },
          { id: 'dep-b', description: 'Second dep', agentId: 'a2' },
          {
            id: 'final',
            description: 'Uses both',
            agentId: 'a3',
            dependencies: ['dep-a', 'dep-b'],
          },
        ],
      });

      await crew.run();

      const userMsg = capturedMessages.find((m) => m.role === 'user');
      expect(userMsg).toBeDefined();
      expect(userMsg!.content).toContain('Result-A');
      expect(userMsg!.content).toContain('Result-B');
    });

    it('should not include context key when task has no context or dependencies', async () => {
      let capturedMessages: readonly LLMMessage[] = [];
      const captureProvider: LLMProvider = {
        name: 'capture',
        generateText: vi
          .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
          .mockImplementation(async (messages) => {
            capturedMessages = messages;
            return {
              content: 'done',
              tokenUsage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
              finishReason: 'stop',
            };
          }),
      };

      const agent = new Agent({ id: 'a', role: 'R', goal: 'G', llmProvider: captureProvider });
      const crew = new Crew({
        id: 'plain',
        agents: [agent],
        tasks: [{ id: 't', description: 'Plain task', agentId: 'a' }],
      });

      await crew.run();

      const userMsg = capturedMessages.find((m) => m.role === 'user');
      expect(userMsg).toBeDefined();
      expect(userMsg!.content).toContain('Plain task');
      expect(userMsg!.content).not.toContain('Context from Previous Tasks');
    });
  });

  describe('topological sort — complex graphs', () => {
    function makeTrackingAgent(id: string, executionOrder: string[]): Agent {
      const provider: LLMProvider = {
        name: `t-${id}`,
        generateText: vi
          .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
          .mockImplementation(async () => {
            executionOrder.push(id);
            return {
              content: `out-${id}`,
              tokenUsage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
              finishReason: 'stop',
            };
          }),
      };
      return new Agent({ id, role: 'R', goal: 'G', llmProvider: provider });
    }

    it('should handle a linear chain (A → B → C → D)', async () => {
      const executionOrder: string[] = [];
      const agents = ['a', 'b', 'c', 'd'].map((id) => makeTrackingAgent(id, executionOrder));

      const crew = new Crew({
        id: 'chain',
        agents,
        tasks: [
          { id: 'td', description: 'D', agentId: 'd', dependencies: ['tc'] },
          { id: 'tc', description: 'C', agentId: 'c', dependencies: ['tb'] },
          { id: 'tb', description: 'B', agentId: 'b', dependencies: ['ta'] },
          { id: 'ta', description: 'A', agentId: 'a' },
        ],
      });

      const result = await crew.run();

      expect(executionOrder).toEqual(['a', 'b', 'c', 'd']);
      expect(result.taskResults.size).toBe(4);
    });

    it('should handle wide independent tasks', async () => {
      const executionOrder: string[] = [];
      const agents = Array.from({ length: 5 }, (_, i) =>
        makeTrackingAgent(`a${String(i)}`, executionOrder),
      );
      const tasks = agents.map((a, i) => ({
        id: `t${String(i)}`,
        description: `Task ${String(i)}`,
        agentId: a.id,
      }));

      const crew = new Crew({ id: 'wide', agents, tasks });
      const result = await crew.run();

      expect(result.success).toBe(true);
      expect(result.taskResults.size).toBe(5);
      expect(executionOrder).toHaveLength(5);
    });

    it('should handle complex multi-level DAG', async () => {
      const executionOrder: string[] = [];
      const ids = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
      const agents = ids.map((id) => makeTrackingAgent(id, executionOrder));

      //   a1  a2
      //   |   |
      //   b1  b2
      //    \ / \
      //    c1   c2
      const crew = new Crew({
        id: 'complex-dag',
        agents,
        tasks: [
          { id: 'a1', description: 'A1', agentId: 'a1' },
          { id: 'a2', description: 'A2', agentId: 'a2' },
          { id: 'b1', description: 'B1', agentId: 'b1', dependencies: ['a1'] },
          { id: 'b2', description: 'B2', agentId: 'b2', dependencies: ['a2'] },
          { id: 'c1', description: 'C1', agentId: 'c1', dependencies: ['b1', 'b2'] },
          { id: 'c2', description: 'C2', agentId: 'c2', dependencies: ['b2'] },
        ],
      });

      const result = await crew.run();

      expect(result.success).toBe(true);

      const idxA1 = executionOrder.indexOf('a1');
      const idxA2 = executionOrder.indexOf('a2');
      const idxB1 = executionOrder.indexOf('b1');
      const idxB2 = executionOrder.indexOf('b2');
      const idxC1 = executionOrder.indexOf('c1');
      const idxC2 = executionOrder.indexOf('c2');

      expect(idxA1).toBeLessThan(idxB1);
      expect(idxA2).toBeLessThan(idxB2);
      expect(idxB1).toBeLessThan(idxC1);
      expect(idxB2).toBeLessThan(idxC1);
      expect(idxB2).toBeLessThan(idxC2);
    });

    it('should handle single task with no dependencies', async () => {
      const executionOrder: string[] = [];
      const agent = makeTrackingAgent('solo', executionOrder);

      const crew = new Crew({
        id: 'solo-crew',
        agents: [agent],
        tasks: [{ id: 'only-task', description: 'Only', agentId: 'solo' }],
      });

      const result = await crew.run();

      expect(result.success).toBe(true);
      expect(executionOrder).toEqual(['solo']);
    });
  });

  describe('event details — extended', () => {
    it('should emit crew:status-changed with correct status values', async () => {
      const statusChanges: { crewId: string; status: CrewStatus }[] = [];
      const agent = createAgent('a');
      const crew = new Crew({
        id: 'sc-crew',
        agents: [agent],
        tasks: [{ id: 't', description: 'x', agentId: 'a' }],
      });

      crew.on('crew:status-changed', (crewId, status) => {
        statusChanges.push({ crewId, status });
      });

      await crew.run();

      expect(statusChanges).toEqual([
        { crewId: 'sc-crew', status: CrewStatus.RUNNING },
        { crewId: 'sc-crew', status: CrewStatus.COMPLETED },
      ]);
    });

    it('should emit all events in correct order during successful run', async () => {
      const events: string[] = [];
      const agent = createAgent('a');
      const crew = new Crew({
        id: 'order-crew',
        agents: [agent],
        tasks: [{ id: 't', description: 'x', agentId: 'a' }],
      });

      crew.on('crew:start', () => {
        events.push('crew:start');
      });
      crew.on('crew:complete', () => {
        events.push('crew:complete');
      });
      crew.on('crew:task:start', () => {
        events.push('crew:task:start');
      });
      crew.on('crew:task:complete', () => {
        events.push('crew:task:complete');
      });
      crew.on('crew:status-changed', (_id, status) => {
        events.push(`status:${status}`);
      });

      await crew.run();

      expect(events).toEqual([
        'status:running',
        'crew:start',
        'crew:task:start',
        'crew:task:complete',
        'status:completed',
        'crew:complete',
      ]);
    });

    it('should emit all events in correct order during failed run', async () => {
      const events: string[] = [];
      const failProvider: LLMProvider = {
        name: 'fail',
        generateText: vi
          .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
          .mockRejectedValue(new Error('Boom')),
      };
      const agent = new Agent({ id: 'a', role: 'R', goal: 'G', llmProvider: failProvider });
      const crew = new Crew({
        id: 'fail-order',
        agents: [agent],
        tasks: [{ id: 't', description: 'x', agentId: 'a' }],
      });

      crew.on('crew:start', () => {
        events.push('crew:start');
      });
      crew.on('crew:error', () => {
        events.push('crew:error');
      });
      crew.on('crew:task:start', () => {
        events.push('crew:task:start');
      });
      crew.on('crew:task:error', () => {
        events.push('crew:task:error');
      });
      crew.on('crew:status-changed', (_id, status) => {
        events.push(`status:${status}`);
      });

      await expect(crew.run()).rejects.toThrow();

      expect(events).toEqual([
        'status:running',
        'crew:start',
        'crew:task:start',
        'crew:task:error',
        'status:error',
        'crew:error',
      ]);
    });

    it('should support multiple listeners on same event', async () => {
      const agent = createAgent('a');
      const crew = new Crew({
        id: 'multi-listener',
        agents: [agent],
        tasks: [{ id: 't', description: 'x', agentId: 'a' }],
      });

      const listener1 = vi.fn();
      const listener2 = vi.fn();
      crew.on('crew:start', listener1);
      crew.on('crew:start', listener2);

      await crew.run();

      expect(listener1).toHaveBeenCalledOnce();
      expect(listener2).toHaveBeenCalledOnce();
    });

    it('should pass crew:task:complete result with correct shape', async () => {
      const agent = createAgent('a', 'Expected output');
      const crew = new Crew({
        id: 'result-shape',
        agents: [agent],
        tasks: [{ id: 'my-task', description: 'Do it', agentId: 'a' }],
      });

      const taskResults: { crewId: string; taskId: string; output: string }[] = [];
      crew.on('crew:task:complete', (crewId, taskId, result) => {
        taskResults.push({ crewId, taskId, output: result.output });
      });

      await crew.run();

      expect(taskResults).toEqual([
        { crewId: 'result-shape', taskId: 'my-task', output: 'Expected output' },
      ]);
    });
  });

  describe('run result structure', () => {
    it('should include correct duration measurement', async () => {
      const delayProvider: LLMProvider = {
        name: 'delay',
        generateText: vi
          .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
          .mockImplementation(
            () =>
              new Promise((resolve) => {
                setTimeout(() => {
                  resolve({
                    content: 'done',
                    tokenUsage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
                    finishReason: 'stop',
                  });
                }, 50);
              }),
          ),
      };

      const agent = new Agent({ id: 'a', role: 'R', goal: 'G', llmProvider: delayProvider });
      const crew = new Crew({
        id: 'duration-crew',
        agents: [agent],
        tasks: [{ id: 't', description: 'x', agentId: 'a' }],
      });

      const result = await crew.run();

      expect(result.duration).toBeGreaterThanOrEqual(40);
      expect(result.duration).toBeLessThan(5000);
    });

    it('should include task results with correct agent metadata', async () => {
      const agent = createAgent('my-agent', 'My output');
      const crew = new Crew({
        id: 'meta-crew',
        agents: [agent],
        tasks: [{ id: 'my-task', description: 'x', agentId: 'my-agent' }],
      });

      const result = await crew.run();
      const taskResult = result.taskResults.get('my-task');

      expect(taskResult).toBeDefined();
      expect(taskResult!.output).toBe('My output');
      expect(taskResult!.agentId).toBe('my-agent');
      expect(taskResult!.duration).toBeGreaterThanOrEqual(0);
      expect(taskResult!.tokenUsage).toBeDefined();
    });

    it('should return all task results keyed by task id', async () => {
      const a1 = createAgent('a1', 'Output-1');
      const a2 = createAgent('a2', 'Output-2');
      const a3 = createAgent('a3', 'Output-3');

      const crew = new Crew({
        id: 'results-crew',
        agents: [a1, a2, a3],
        tasks: [
          { id: 'task-1', description: 'First', agentId: 'a1' },
          { id: 'task-2', description: 'Second', agentId: 'a2' },
          { id: 'task-3', description: 'Third', agentId: 'a3', dependencies: ['task-1'] },
        ],
      });

      const result = await crew.run();

      expect(result.taskResults.size).toBe(3);
      expect(result.taskResults.get('task-1')!.output).toBe('Output-1');
      expect(result.taskResults.get('task-2')!.output).toBe('Output-2');
      expect(result.taskResults.get('task-3')!.output).toBe('Output-3');
    });

    it('should set crewId on the result', async () => {
      const agent = createAgent('a');
      const crew = new Crew({
        id: 'id-check',
        agents: [agent],
        tasks: [{ id: 't', description: 'x', agentId: 'a' }],
      });

      const result = await crew.run();
      expect(result.crewId).toBe('id-check');
    });
  });

  describe('read-only accessors', () => {
    it('should expose agents as ReadonlyMap', () => {
      const agent = createAgent('test-agent');
      const crew = new Crew({
        id: 'ro-crew',
        agents: [agent],
        tasks: [{ id: 't', description: 'x', agentId: 'test-agent' }],
      });

      const agents = crew.agents;
      expect(agents.get('test-agent')).toBe(agent);
      expect(agents.size).toBe(1);
      expect(agents.has('test-agent')).toBe(true);
      expect(agents.has('nonexistent')).toBe(false);
    });

    it('should expose tasks as readonly array preserving order', () => {
      const agent = createAgent('a');
      const crew = new Crew({
        id: 'ro-crew',
        agents: [agent],
        tasks: [
          { id: 't1', description: 'First', agentId: 'a' },
          { id: 't2', description: 'Second', agentId: 'a' },
          { id: 't3', description: 'Third', agentId: 'a' },
        ],
      });

      expect(crew.tasks).toHaveLength(3);
      expect(crew.tasks[0]!.id).toBe('t1');
      expect(crew.tasks[1]!.id).toBe('t2');
      expect(crew.tasks[2]!.id).toBe('t3');
    });

    it('should expose status reflecting current lifecycle state', () => {
      const agent = createAgent('a');
      const crew = new Crew({
        id: 'status-check',
        agents: [agent],
        tasks: [{ id: 't', description: 'x', agentId: 'a' }],
      });

      expect(crew.status).toBe(CrewStatus.IDLE);
    });
  });

  describe('idempotency and re-runs', () => {
    it('should produce consistent results across multiple runs', async () => {
      const agent = createAgent('a', 'Consistent output');
      const crew = new Crew({
        id: 'idempotent-crew',
        agents: [agent],
        tasks: [{ id: 't', description: 'x', agentId: 'a' }],
      });

      const result1 = await crew.run();
      crew.reset();
      const result2 = await crew.run();

      expect(result1.taskResults.get('t')!.output).toBe(result2.taskResults.get('t')!.output);
      expect(result1.success).toBe(result2.success);
    });

    it('should emit events on each run after reset', async () => {
      const agent = createAgent('a');
      const crew = new Crew({
        id: 'rerun-events',
        agents: [agent],
        tasks: [{ id: 't', description: 'x', agentId: 'a' }],
      });

      const startCalls = vi.fn();
      crew.on('crew:start', startCalls);

      await crew.run();
      crew.reset();
      await crew.run();
      crew.reset();
      await crew.run();

      expect(startCalls).toHaveBeenCalledTimes(3);
    });
  });
});
