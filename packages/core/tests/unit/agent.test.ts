import { describe, it, expect, vi, beforeEach } from 'vitest';

import { Agent } from '../../src/agent/agent.js';
import { AgentConfigError, AgentExecutionError } from '../../src/errors/index.js';
import { AgentStatus } from '../../src/types/agent.js';
import { LLMRole } from '../../src/types/llm.js';
import type {
  LLMProvider,
  LLMResponse,
  LLMMessage,
  Tool,
  TaskInput,
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

function createMockTool(name = 'mockTool'): Tool {
  return {
    name,
    description: `A mock tool called ${name}`,
    execute: vi.fn<(input: unknown) => Promise<unknown>>().mockResolvedValue('tool result'),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Agent', () => {
  describe('construction', () => {
    it('should create an agent with required config', () => {
      const agent = new Agent({
        id: 'test-agent',
        role: 'Tester',
        goal: 'Validate functionality',
      });

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

    it('should accept id with dashes and underscores', () => {
      const agent = new Agent({ id: 'my-test_agent-01', role: 'Tester', goal: 'Test' });
      expect(agent.id).toBe('my-test_agent-01');
    });

    it('should reject maxIterations above 100', () => {
      expect(
        () => new Agent({ id: 'test', role: 'Test', goal: 'Test', maxIterations: 101 }),
      ).toThrow(AgentConfigError);
    });

    it('should reject non-positive maxIterations', () => {
      expect(() => new Agent({ id: 'test', role: 'Test', goal: 'Test', maxIterations: 0 })).toThrow(
        AgentConfigError,
      );
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
  });

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

    it('should reject duplicate tool names', () => {
      const tool = createMockTool('dup');
      agent.addTool(tool);

      expect(() => {
        agent.addTool(createMockTool('dup'));
      }).toThrow(AgentConfigError);
    });

    it('should remove a tool', () => {
      agent.addTool(createMockTool('removable'));
      expect(agent.removeTool('removable')).toBe(true);
      expect(agent.hasTool('removable')).toBe(false);
    });

    it('should return false when removing a non-existent tool', () => {
      expect(agent.removeTool('nonexistent')).toBe(false);
    });
  });

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
  });

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
      expect(messages[1]!.content).toContain('Format and content: A bullet-point list');
    });

    it('should include context in user prompt', async () => {
      await agent.execute({
        description: 'Analyze this',
        context: { source: 'test-data', count: 42 },
      });

      const generateText = provider.generateText as ReturnType<typeof vi.fn>;
      const messages = generateText.mock.calls[0]![0] as LLMMessage[];
      expect(messages[1]!.content).toContain('Context from Previous Tasks');
      expect(messages[1]!.content).toContain('"source": "test-data"');
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
  });

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
  });

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
  });
});
