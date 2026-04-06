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
});
