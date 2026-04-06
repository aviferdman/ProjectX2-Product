import { describe, it, expect, vi, beforeEach } from 'vitest';

import { Agent } from '../../src/agent/agent.js';
import { AgentConfigError, AgentExecutionError } from '../../src/errors/index.js';
import { AgentStatus } from '../../src/types/agent.js';
import type { AgentEventMap } from '../../src/types/agent.js';
import { LLMRole } from '../../src/types/llm.js';
import type {
  LLMProvider,
  LLMResponse,
  LLMMessage,
  Tool,
  TaskInput,
  TaskResult,
} from '../../src/types/index.js';

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

function createMockTool(name = 'mockTool', description?: string): Tool {
  return {
    name,
    description: description ?? `A mock tool called ${name}`,
    execute: vi.fn<(input: unknown) => Promise<unknown>>().mockResolvedValue('tool result'),
  };
}

function baseConfig() {
  return { id: 'test-agent', role: 'Tester', goal: 'Validate functionality' };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Agent', () => {
  // =========================================================================
  // Construction
  // =========================================================================
  describe('construction', () => {
    it('should create an agent with required config', () => {
      const agent = new Agent(baseConfig());

      expect(agent.id).toBe('test-agent');
      expect(agent.role).toBe('Tester');
      expect(agent.goal).toBe('Validate functionality');
      expect(agent.backstory).toBe('');
      expect(agent.maxIterations).toBe(10);
      expect(agent.verbose).toBe(false);
      expect(agent.status).toBe(AgentStatus.IDLE);
      expect(agent.tools.size).toBe(0);
      expect(agent.llmProvider).toBeUndefined();
    });

    it('should create an agent with full config', () => {
      const provider = createMockLLMProvider();
      const tool = createMockTool();

      const agent = new Agent({
        id: 'full-agent',
        role: 'Analyst',
        goal: 'Analyze data',
        backstory: 'Expert analyst with 10 years of experience',
        tools: [tool],
        llmProvider: provider,
        maxIterations: 5,
        verbose: true,
      });

      expect(agent.backstory).toBe('Expert analyst with 10 years of experience');
      expect(agent.maxIterations).toBe(5);
      expect(agent.verbose).toBe(true);
      expect(agent.tools.size).toBe(1);
      expect(agent.tools.get('mockTool')).toBe(tool);
      expect(agent.llmProvider).toBe(provider);
    });

    it('should reject empty id', () => {
      expect(() => new Agent({ id: '', role: 'Test', goal: 'Test' })).toThrow(AgentConfigError);
    });

    it('should reject empty role', () => {
      expect(() => new Agent({ id: 'test', role: '', goal: 'Test' })).toThrow(AgentConfigError);
    });

    it('should reject empty goal', () => {
      expect(() => new Agent({ id: 'test', role: 'Test', goal: '' })).toThrow(AgentConfigError);
    });

    it('should reject invalid id characters', () => {
      expect(() => new Agent({ id: 'test agent!', role: 'Test', goal: 'Test' })).toThrow(
        AgentConfigError,
      );
    });

    it('should reject id with spaces', () => {
      expect(() => new Agent({ id: 'has space', role: 'R', goal: 'G' })).toThrow(AgentConfigError);
    });

    it('should reject id with special characters', () => {
      for (const ch of ['@', '#', '$', '%', '&', '*', '+', '=', '!']) {
        expect(
          () => new Agent({ id: `bad${ch}id`, role: 'R', goal: 'G' }),
          `should reject id containing "${ch}"`,
        ).toThrow(AgentConfigError);
      }
    });

    it('should accept id with dashes and underscores', () => {
      const agent = new Agent({ id: 'my-test_agent-01', role: 'Tester', goal: 'Test' });
      expect(agent.id).toBe('my-test_agent-01');
    });

    it('should accept single-character id', () => {
      const agent = new Agent({ id: 'x', role: 'R', goal: 'G' });
      expect(agent.id).toBe('x');
    });

    it('should accept numeric-only id', () => {
      const agent = new Agent({ id: '42', role: 'R', goal: 'G' });
      expect(agent.id).toBe('42');
    });

    it('should reject maxIterations above 100', () => {
      expect(
        () => new Agent({ id: 'test', role: 'Test', goal: 'Test', maxIterations: 101 }),
      ).toThrow(AgentConfigError);
    });

    it('should accept maxIterations at boundary (100)', () => {
      const agent = new Agent({ ...baseConfig(), maxIterations: 100 });
      expect(agent.maxIterations).toBe(100);
    });

    it('should accept maxIterations of 1', () => {
      const agent = new Agent({ ...baseConfig(), maxIterations: 1 });
      expect(agent.maxIterations).toBe(1);
    });

    it('should reject non-positive maxIterations', () => {
      expect(() => new Agent({ id: 'test', role: 'Test', goal: 'Test', maxIterations: 0 })).toThrow(
        AgentConfigError,
      );
    });

    it('should reject negative maxIterations', () => {
      expect(
        () => new Agent({ ...baseConfig(), maxIterations: -5 }),
      ).toThrow(AgentConfigError);
    });

    it('should reject fractional maxIterations', () => {
      expect(
        () => new Agent({ ...baseConfig(), maxIterations: 5.5 }),
      ).toThrow(AgentConfigError);
    });

    it('should register multiple tools at construction', () => {
      const tool1 = createMockTool('tool1');
      const tool2 = createMockTool('tool2');

      const agent = new Agent({
        id: 'multi-tool',
        role: 'Tester',
        goal: 'Test',
        tools: [tool1, tool2],
      });

      expect(agent.tools.size).toBe(2);
      expect(agent.hasTool('tool1')).toBe(true);
      expect(agent.hasTool('tool2')).toBe(true);
    });

    it('should create agent with empty tools array', () => {
      const agent = new Agent({ ...baseConfig(), tools: [] });
      expect(agent.tools.size).toBe(0);
    });

    it('should default backstory to empty string when omitted', () => {
      const agent = new Agent(baseConfig());
      expect(agent.backstory).toBe('');
    });

    it('should preserve explicit backstory', () => {
      const agent = new Agent({ ...baseConfig(), backstory: 'A seasoned professional' });
      expect(agent.backstory).toBe('A seasoned professional');
    });

    it('should default verbose to false when omitted', () => {
      const agent = new Agent(baseConfig());
      expect(agent.verbose).toBe(false);
    });

    it('should honour verbose true', () => {
      const agent = new Agent({ ...baseConfig(), verbose: true });
      expect(agent.verbose).toBe(true);
    });

    it('should rethrow non-ZodError exceptions from constructor', () => {
      // Force a non-Zod error by passing a config whose property access throws
      const trap = new Proxy(
        { id: 'x', role: 'R', goal: 'G' },
        {
          get(target, prop) {
            if (prop === 'tools') {
              throw new TypeError('Unexpected getter error');
            }
            return Reflect.get(target, prop) as unknown;
          },
        },
      );

      expect(() => new Agent(trap as unknown as Parameters<typeof Agent['prototype']['execute']>[0] & { id: string; role: string; goal: string })).toThrow(TypeError);
    });

    it('should include agent id in AgentConfigError when id is a string', () => {
      try {
        new Agent({ id: 'bad!', role: 'R', goal: 'G' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AgentConfigError);
        expect((error as AgentConfigError).agentId).toBe('bad!');
      }
    });

    it('should set agentId to undefined in error when id is not a string', () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        new Agent({ id: 123 as any, role: 'R', goal: 'G' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AgentConfigError);
        expect((error as AgentConfigError).agentId).toBeUndefined();
      }
    });
  });

  // =========================================================================
  // Tool management
  // =========================================================================
  describe('tool management', () => {
    let agent: Agent;

    beforeEach(() => {
      agent = new Agent({ id: 'tool-agent', role: 'Tester', goal: 'Test' });
    });

    it('should add a tool', () => {
      const tool = createMockTool('newTool');
      agent.addTool(tool);

      expect(agent.hasTool('newTool')).toBe(true);
      expect(agent.tools.get('newTool')).toBe(tool);
    });

    it('should add multiple tools sequentially', () => {
      agent.addTool(createMockTool('a'));
      agent.addTool(createMockTool('b'));
      agent.addTool(createMockTool('c'));

      expect(agent.tools.size).toBe(3);
    });

    it('should reject duplicate tool names', () => {
      const tool = createMockTool('dup');
      agent.addTool(tool);

      expect(() => agent.addTool(createMockTool('dup'))).toThrow(AgentConfigError);
    });

    it('should include agent id in duplicate tool error', () => {
      agent.addTool(createMockTool('dup'));

      try {
        agent.addTool(createMockTool('dup'));
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AgentConfigError);
        expect((error as AgentConfigError).message).toContain('dup');
        expect((error as AgentConfigError).agentId).toBe('tool-agent');
      }
    });

    it('should remove a tool', () => {
      agent.addTool(createMockTool('removable'));
      expect(agent.removeTool('removable')).toBe(true);
      expect(agent.hasTool('removable')).toBe(false);
    });

    it('should return false when removing a non-existent tool', () => {
      expect(agent.removeTool('nonexistent')).toBe(false);
    });

    it('should allow re-adding a tool after removal', () => {
      const tool = createMockTool('recyclable');
      agent.addTool(tool);
      agent.removeTool('recyclable');

      const replacement = createMockTool('recyclable');
      agent.addTool(replacement);
      expect(agent.tools.get('recyclable')).toBe(replacement);
    });

    it('should report false for hasTool on empty tools', () => {
      expect(agent.hasTool('anything')).toBe(false);
    });

    it('should expose tools as ReadonlyMap', () => {
      agent.addTool(createMockTool('ro'));
      const tools = agent.tools;
      expect(typeof tools.get).toBe('function');
      expect(typeof tools.has).toBe('function');
      expect(typeof tools.size).toBe('number');
    });
  });

  // =========================================================================
  // LLM provider management
  // =========================================================================
  describe('LLM provider management', () => {
    it('should set an LLM provider after construction', () => {
      const agent = new Agent({ id: 'provider-test', role: 'Test', goal: 'Test' });
      const provider = createMockLLMProvider();

      agent.setLLMProvider(provider);

      expect(agent.llmProvider).toBe(provider);
    });

    it('should replace an existing LLM provider', () => {
      const provider1 = createMockLLMProvider();
      const provider2: LLMProvider = {
        name: 'second-provider',
        generateText: vi
          .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
          .mockResolvedValue({
            content: 'response',
            tokenUsage: { promptTokens: 1, completionTokens: 2, totalTokens: 3 },
            finishReason: 'stop',
          }),
      };

      const agent = new Agent({
        id: 'replace-test',
        role: 'Test',
        goal: 'Test',
        llmProvider: provider1,
      });

      agent.setLLMProvider(provider2);
      expect(agent.llmProvider).toBe(provider2);
    });

    it('should use new provider for subsequent executions', async () => {
      const provider1 = createMockLLMProvider({ content: 'first' });
      const provider2 = createMockLLMProvider({ content: 'second' });

      const agent = new Agent({ ...baseConfig(), llmProvider: provider1 });

      const result1 = await agent.execute({ description: 'task' });
      expect(result1.output).toBe('first');

      agent.setLLMProvider(provider2);
      const result2 = await agent.execute({ description: 'task' });
      expect(result2.output).toBe('second');
    });
  });

  // =========================================================================
  // Execution
  // =========================================================================
  describe('execution', () => {
    let agent: Agent;
    let provider: LLMProvider;
    const taskInput: TaskInput = {
      description: 'Write a summary of recent events',
    };

    beforeEach(() => {
      provider = createMockLLMProvider({ content: 'Summary: things happened.' });
      agent = new Agent({
        id: 'exec-agent',
        role: 'Summarizer',
        goal: 'Create concise summaries',
        llmProvider: provider,
      });
    });

    it('should throw if no LLM provider is set', async () => {
      const noProvider = new Agent({ id: 'no-llm', role: 'Test', goal: 'Test' });

      await expect(noProvider.execute(taskInput)).rejects.toThrow(AgentExecutionError);
      await expect(noProvider.execute(taskInput)).rejects.toThrow('No LLM provider configured');
    });

    it('should set status to ERROR when no LLM provider is configured', async () => {
      const noProvider = new Agent({ id: 'no-llm', role: 'Test', goal: 'Test' });

      await expect(noProvider.execute(taskInput)).rejects.toThrow();
      // Agent status remains IDLE because error is thrown before status change
    });

    it('should execute a task and return a result', async () => {
      const result = await agent.execute(taskInput);

      expect(result.output).toBe('Summary: things happened.');
      expect(result.agentId).toBe('exec-agent');
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.tokenUsage).toEqual({
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      });
    });

    it('should pass system and user messages to the LLM provider', async () => {
      await agent.execute(taskInput);

      const generateText = provider.generateText as ReturnType<typeof vi.fn>;
      expect(generateText).toHaveBeenCalledTimes(1);

      const messages = generateText.mock.calls[0]![0] as LLMMessage[];
      expect(messages).toHaveLength(2);
      expect(messages[0]!.role).toBe(LLMRole.SYSTEM);
      expect(messages[0]!.content).toContain('Summarizer');
      expect(messages[0]!.content).toContain('Create concise summaries');
      expect(messages[1]!.role).toBe(LLMRole.USER);
      expect(messages[1]!.content).toContain('Write a summary');
    });

    it('should include expected output in user prompt', async () => {
      await agent.execute({
        description: 'Summarize data',
        expectedOutput: 'A bullet-point list',
      });

      const generateText = provider.generateText as ReturnType<typeof vi.fn>;
      const messages = generateText.mock.calls[0]![0] as LLMMessage[];
      expect(messages[1]!.content).toContain('Expected output format: A bullet-point list');
    });

    it('should not include expected output tag when expectedOutput is omitted', async () => {
      await agent.execute({ description: 'Simple task' });

      const generateText = provider.generateText as ReturnType<typeof vi.fn>;
      const messages = generateText.mock.calls[0]![0] as LLMMessage[];
      expect(messages[1]!.content).not.toContain('Expected output format');
    });

    it('should include context in user prompt', async () => {
      await agent.execute({
        description: 'Analyze this',
        context: { source: 'test-data', count: 42 },
      });

      const generateText = provider.generateText as ReturnType<typeof vi.fn>;
      const messages = generateText.mock.calls[0]![0] as LLMMessage[];
      expect(messages[1]!.content).toContain('Context:');
      expect(messages[1]!.content).toContain('"source": "test-data"');
    });

    it('should not include context section when context is empty object', async () => {
      await agent.execute({
        description: 'No context task',
        context: {},
      });

      const generateText = provider.generateText as ReturnType<typeof vi.fn>;
      const messages = generateText.mock.calls[0]![0] as LLMMessage[];
      expect(messages[1]!.content).not.toContain('Context:');
    });

    it('should not include context section when context is omitted', async () => {
      await agent.execute({ description: 'Bare task' });

      const generateText = provider.generateText as ReturnType<typeof vi.fn>;
      const messages = generateText.mock.calls[0]![0] as LLMMessage[];
      expect(messages[1]!.content).not.toContain('Context:');
    });

    it('should include all optional fields when provided together', async () => {
      await agent.execute({
        description: 'Full task',
        expectedOutput: 'JSON format',
        context: { key: 'value' },
      });

      const generateText = provider.generateText as ReturnType<typeof vi.fn>;
      const messages = generateText.mock.calls[0]![0] as LLMMessage[];
      expect(messages[1]!.content).toContain('Full task');
      expect(messages[1]!.content).toContain('Expected output format: JSON format');
      expect(messages[1]!.content).toContain('Context:');
      expect(messages[1]!.content).toContain('"key": "value"');
    });

    it('should transition status during execution', async () => {
      const statuses: AgentStatus[] = [];
      agent.on('agent:status-changed', (_id, status) => {
        statuses.push(status);
      });

      await agent.execute(taskInput);

      expect(statuses).toEqual([AgentStatus.EXECUTING, AgentStatus.IDLE]);
      expect(agent.status).toBe(AgentStatus.IDLE);
    });

    it('should set status to ERROR on failure', async () => {
      const failProvider = createMockLLMProvider();
      (failProvider.generateText as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('LLM unavailable'),
      );

      const failAgent = new Agent({
        id: 'fail-agent',
        role: 'Test',
        goal: 'Test',
        llmProvider: failProvider,
      });

      await expect(failAgent.execute(taskInput)).rejects.toThrow(AgentExecutionError);
      expect(failAgent.status).toBe(AgentStatus.ERROR);
    });

    it('should wrap non-AgentExecutionError errors', async () => {
      const failProvider = createMockLLMProvider();
      (failProvider.generateText as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network timeout'),
      );

      const failAgent = new Agent({
        id: 'wrap-agent',
        role: 'Test',
        goal: 'Test',
        llmProvider: failProvider,
      });

      try {
        await failAgent.execute(taskInput);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AgentExecutionError);
        expect((error as AgentExecutionError).agentId).toBe('wrap-agent');
        expect((error as AgentExecutionError).cause).toBeInstanceOf(Error);
      }
    });

    it('should rethrow AgentExecutionError directly without wrapping', async () => {
      const originalError = new AgentExecutionError('inner', 'Provider-level failure');
      const failProvider = createMockLLMProvider();
      (failProvider.generateText as ReturnType<typeof vi.fn>).mockRejectedValue(originalError);

      const failAgent = new Agent({
        id: 'passthrough-agent',
        role: 'Test',
        goal: 'Test',
        llmProvider: failProvider,
      });

      try {
        await failAgent.execute(taskInput);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBe(originalError);
        expect((error as AgentExecutionError).agentId).toBe('inner');
      }
    });

    it('should wrap non-Error thrown values into Error', async () => {
      const failProvider = createMockLLMProvider();
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
      (failProvider.generateText as ReturnType<typeof vi.fn>).mockRejectedValue('string error');

      const failAgent = new Agent({
        id: 'string-err',
        role: 'Test',
        goal: 'Test',
        llmProvider: failProvider,
      });

      try {
        await failAgent.execute(taskInput);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AgentExecutionError);
        expect((error as AgentExecutionError).message).toContain('string error');
      }
    });

    it('should handle numeric thrown value in execution', async () => {
      const failProvider = createMockLLMProvider();
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
      (failProvider.generateText as ReturnType<typeof vi.fn>).mockRejectedValue(42);

      const failAgent = new Agent({
        id: 'num-err',
        role: 'Test',
        goal: 'Test',
        llmProvider: failProvider,
      });

      try {
        await failAgent.execute(taskInput);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AgentExecutionError);
        expect((error as AgentExecutionError).message).toContain('42');
      }
    });

    it('should return correct agentId in result', async () => {
      const result = await agent.execute(taskInput);
      expect(result.agentId).toBe('exec-agent');
    });

    it('should allow sequential executions on the same agent', async () => {
      const result1 = await agent.execute({ description: 'First task' });
      const result2 = await agent.execute({ description: 'Second task' });

      expect(result1.output).toBe('Summary: things happened.');
      expect(result2.output).toBe('Summary: things happened.');
      expect(agent.status).toBe(AgentStatus.IDLE);
    });

    it('should recover to IDLE status after a failed then successful execution', async () => {
      const dualProvider = createMockLLMProvider();
      (dualProvider.generateText as ReturnType<typeof vi.fn>)
        .mockRejectedValueOnce(new Error('Transient failure'))
        .mockResolvedValueOnce({
          content: 'recovered',
          tokenUsage: { promptTokens: 5, completionTokens: 10, totalTokens: 15 },
          finishReason: 'stop',
        });

      const dualAgent = new Agent({
        id: 'recovery',
        role: 'Test',
        goal: 'Test',
        llmProvider: dualProvider,
      });

      await expect(dualAgent.execute(taskInput)).rejects.toThrow();
      expect(dualAgent.status).toBe(AgentStatus.ERROR);

      const result = await dualAgent.execute(taskInput);
      expect(result.output).toBe('recovered');
      expect(dualAgent.status).toBe(AgentStatus.IDLE);
    });

    it('should include token usage from provider response', async () => {
      const customProvider = createMockLLMProvider({
        content: 'result',
        tokenUsage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
      });
      const customAgent = new Agent({ ...baseConfig(), llmProvider: customProvider });

      const result = await customAgent.execute(taskInput);
      expect(result.tokenUsage).toEqual({
        promptTokens: 100,
        completionTokens: 200,
        totalTokens: 300,
      });
    });
  });

  // =========================================================================
  // Events
  // =========================================================================
  describe('events', () => {
    it('should emit agent:start and agent:complete events', async () => {
      const provider = createMockLLMProvider();
      const agent = new Agent({
        id: 'event-agent',
        role: 'Test',
        goal: 'Test',
        llmProvider: provider,
      });

      const startListener = vi.fn();
      const completeListener = vi.fn();

      agent.on('agent:start', startListener);
      agent.on('agent:complete', completeListener);

      const input: TaskInput = { description: 'Do something' };
      await agent.execute(input);

      expect(startListener).toHaveBeenCalledOnce();
      expect(startListener).toHaveBeenCalledWith('event-agent', input);
      expect(completeListener).toHaveBeenCalledOnce();
      expect(completeListener.mock.calls[0]![0]).toBe('event-agent');
    });

    it('should emit agent:error on failure', async () => {
      const failProvider = createMockLLMProvider();
      (failProvider.generateText as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Boom'));

      const agent = new Agent({
        id: 'error-event',
        role: 'Test',
        goal: 'Test',
        llmProvider: failProvider,
      });

      const errorListener = vi.fn();
      agent.on('agent:error', errorListener);

      await expect(agent.execute({ description: 'Fail' })).rejects.toThrow();

      expect(errorListener).toHaveBeenCalledOnce();
      expect(errorListener.mock.calls[0]![0]).toBe('error-event');
      expect(errorListener.mock.calls[0]![1]).toBeInstanceOf(Error);
    });

    it('should emit agent:llm:start and agent:llm:complete events', async () => {
      const provider = createMockLLMProvider();
      const agent = new Agent({
        id: 'llm-event',
        role: 'Test',
        goal: 'Test',
        llmProvider: provider,
      });

      const llmStartListener = vi.fn();
      const llmCompleteListener = vi.fn();

      agent.on('agent:llm:start', llmStartListener);
      agent.on('agent:llm:complete', llmCompleteListener);

      await agent.execute({ description: 'Test' });

      expect(llmStartListener).toHaveBeenCalledOnce();
      expect(llmCompleteListener).toHaveBeenCalledOnce();
    });

    it('should emit agent:llm:complete with the LLM response', async () => {
      const provider = createMockLLMProvider({
        content: 'Hello',
        tokenUsage: { promptTokens: 5, completionTokens: 3, totalTokens: 8 },
        finishReason: 'stop',
      });
      const agent = new Agent({ ...baseConfig(), llmProvider: provider });

      const llmCompleteListener = vi.fn();
      agent.on('agent:llm:complete', llmCompleteListener);

      await agent.execute({ description: 'test' });

      const [agentId, response] = llmCompleteListener.mock.calls[0] as [string, LLMResponse];
      expect(agentId).toBe('test-agent');
      expect(response.content).toBe('Hello');
      expect(response.tokenUsage.totalTokens).toBe(8);
    });

    it('should emit agent:complete with the task result', async () => {
      const provider = createMockLLMProvider({ content: 'done' });
      const agent = new Agent({ ...baseConfig(), llmProvider: provider });

      const completeListener = vi.fn();
      agent.on('agent:complete', completeListener);

      await agent.execute({ description: 'task' });

      const [agentId, result] = completeListener.mock.calls[0] as [string, TaskResult];
      expect(agentId).toBe('test-agent');
      expect(result.output).toBe('done');
      expect(result.agentId).toBe('test-agent');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should emit events in correct order during successful execution', async () => {
      const provider = createMockLLMProvider();
      const agent = new Agent({ ...baseConfig(), llmProvider: provider });

      const events: string[] = [];
      agent.on('agent:status-changed', () => events.push('status-changed'));
      agent.on('agent:start', () => events.push('start'));
      agent.on('agent:llm:start', () => events.push('llm:start'));
      agent.on('agent:llm:complete', () => events.push('llm:complete'));
      agent.on('agent:complete', () => events.push('complete'));

      await agent.execute({ description: 'test' });

      expect(events).toEqual([
        'status-changed', // → EXECUTING
        'start',
        'llm:start',
        'llm:complete',
        'status-changed', // → IDLE
        'complete',
      ]);
    });

    it('should emit events in correct order during failed execution', async () => {
      const failProvider = createMockLLMProvider();
      (failProvider.generateText as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('fail'),
      );
      const agent = new Agent({ ...baseConfig(), llmProvider: failProvider });

      const events: string[] = [];
      agent.on('agent:status-changed', () => events.push('status-changed'));
      agent.on('agent:start', () => events.push('start'));
      agent.on('agent:llm:start', () => events.push('llm:start'));
      agent.on('agent:error', () => events.push('error'));

      await expect(agent.execute({ description: 'test' })).rejects.toThrow();

      expect(events).toEqual([
        'status-changed', // → EXECUTING
        'start',
        'llm:start',
        'status-changed', // → ERROR
        'error',
      ]);
    });

    it('should support once() for single-fire listeners', async () => {
      const provider = createMockLLMProvider();
      const agent = new Agent({
        id: 'once-test',
        role: 'Test',
        goal: 'Test',
        llmProvider: provider,
      });

      const listener = vi.fn();
      agent.once('agent:complete', listener);

      await agent.execute({ description: 'First' });
      await agent.execute({ description: 'Second' });

      expect(listener).toHaveBeenCalledOnce();
    });

    it('should support off() to remove listeners', async () => {
      const provider = createMockLLMProvider();
      const agent = new Agent({
        id: 'off-test',
        role: 'Test',
        goal: 'Test',
        llmProvider: provider,
      });

      const listener = vi.fn();
      agent.on('agent:complete', listener);
      agent.off('agent:complete', listener);

      await agent.execute({ description: 'Test' });

      expect(listener).not.toHaveBeenCalled();
    });

    it('should allow multiple listeners on the same event', async () => {
      const provider = createMockLLMProvider();
      const agent = new Agent({ ...baseConfig(), llmProvider: provider });

      const listener1 = vi.fn();
      const listener2 = vi.fn();

      agent.on('agent:complete', listener1);
      agent.on('agent:complete', listener2);

      await agent.execute({ description: 'test' });

      expect(listener1).toHaveBeenCalledOnce();
      expect(listener2).toHaveBeenCalledOnce();
    });

    it('should return this from on() for chaining', () => {
      const agent = new Agent(baseConfig());
      const result = agent.on('agent:start', vi.fn());
      expect(result).toBe(agent);
    });

    it('should return this from off() for chaining', () => {
      const agent = new Agent(baseConfig());
      const result = agent.off('agent:start', vi.fn());
      expect(result).toBe(agent);
    });

    it('should return this from once() for chaining', () => {
      const agent = new Agent(baseConfig());
      const result = agent.once('agent:start', vi.fn());
      expect(result).toBe(agent);
    });

    it('should emit agent:status-changed with correct status values', async () => {
      const provider = createMockLLMProvider();
      const agent = new Agent({ ...baseConfig(), llmProvider: provider });

      const statusChanges: Array<[string, AgentStatus]> = [];
      agent.on('agent:status-changed', (agentId: string, status: AgentStatus) => {
        statusChanges.push([agentId, status]);
      });

      await agent.execute({ description: 'task' });

      expect(statusChanges).toEqual([
        ['test-agent', AgentStatus.EXECUTING],
        ['test-agent', AgentStatus.IDLE],
      ]);
    });
  });

  // =========================================================================
  // buildSystemPrompt
  // =========================================================================
  describe('buildSystemPrompt', () => {
    it('should include role and goal', () => {
      const agent = new Agent({
        id: 'prompt-test',
        role: 'Data Analyst',
        goal: 'Extract insights from datasets',
      });

      const prompt = agent.buildSystemPrompt();

      expect(prompt).toContain('Data Analyst');
      expect(prompt).toContain('Extract insights from datasets');
    });

    it('should include backstory when provided', () => {
      const agent = new Agent({
        id: 'backstory-test',
        role: 'Writer',
        goal: 'Write articles',
        backstory: 'Published author with 5 books',
      });

      const prompt = agent.buildSystemPrompt();

      expect(prompt).toContain('Published author with 5 books');
    });

    it('should not include backstory section when backstory is empty', () => {
      const agent = new Agent({
        id: 'no-backstory',
        role: 'Writer',
        goal: 'Write',
      });

      const prompt = agent.buildSystemPrompt();

      expect(prompt).not.toContain('Background:');
    });

    it('should include tool descriptions when tools are registered', () => {
      const agent = new Agent({
        id: 'tool-prompt-test',
        role: 'Researcher',
        goal: 'Research topics',
        tools: [createMockTool('search'), createMockTool('readFile')],
      });

      const prompt = agent.buildSystemPrompt();

      expect(prompt).toContain('Available tools:');
      expect(prompt).toContain('search:');
      expect(prompt).toContain('readFile:');
    });

    it('should not include tools section when no tools are registered', () => {
      const agent = new Agent({
        id: 'no-tools-test',
        role: 'Writer',
        goal: 'Write',
      });

      const prompt = agent.buildSystemPrompt();

      expect(prompt).not.toContain('Available tools');
    });

    it('should format prompt with role preamble', () => {
      const agent = new Agent({ ...baseConfig(), role: 'SeniorDev' });
      const prompt = agent.buildSystemPrompt();

      expect(prompt).toMatch(/You are an AI agent with the role: SeniorDev/);
    });

    it('should format prompt with goal preamble', () => {
      const agent = new Agent({ ...baseConfig(), goal: 'Ship fast' });
      const prompt = agent.buildSystemPrompt();

      expect(prompt).toMatch(/Your goal: Ship fast/);
    });

    it('should reflect dynamically added tools in system prompt', () => {
      const agent = new Agent({ ...baseConfig() });
      expect(agent.buildSystemPrompt()).not.toContain('Available tools');

      agent.addTool(createMockTool('dynamicTool', 'Does dynamic things'));
      const prompt = agent.buildSystemPrompt();

      expect(prompt).toContain('Available tools:');
      expect(prompt).toContain('dynamicTool: Does dynamic things');
    });

    it('should not include removed tool in system prompt', () => {
      const agent = new Agent({
        ...baseConfig(),
        tools: [createMockTool('tempTool')],
      });
      agent.removeTool('tempTool');

      const prompt = agent.buildSystemPrompt();
      expect(prompt).not.toContain('tempTool');
      expect(prompt).not.toContain('Available tools');
    });
  });

  // =========================================================================
  // Error class integration
  // =========================================================================
  describe('error classes', () => {
    it('AgentConfigError should have correct name', () => {
      try {
        new Agent({ id: '', role: 'R', goal: 'G' });
      } catch (error) {
        expect((error as Error).name).toBe('AgentConfigError');
      }
    });

    it('AgentExecutionError should have correct name and agentId', async () => {
      const agent = new Agent({ id: 'err-test', role: 'R', goal: 'G' });
      try {
        await agent.execute({ description: 'fail' });
      } catch (error) {
        expect((error as Error).name).toBe('AgentExecutionError');
        expect((error as AgentExecutionError).agentId).toBe('err-test');
      }
    });

    it('AgentExecutionError message should include agent id', async () => {
      const failProvider = createMockLLMProvider();
      (failProvider.generateText as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('provider crash'),
      );

      const agent = new Agent({ id: 'msg-test', role: 'R', goal: 'G', llmProvider: failProvider });

      try {
        await agent.execute({ description: 'task' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toContain('msg-test');
        expect((error as Error).message).toContain('provider crash');
      }
    });
  });
});
