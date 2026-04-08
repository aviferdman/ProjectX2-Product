/**
 * Tests for the Vitest testing helpers module.
 *
 * TASK-077 — Validates all mock factories, assertion helpers, and event
 * collectors exported from `@crewspace/core/testing`.
 *
 * @packageDocumentation
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Agent } from '../../src/agent/agent.js';
import { Crew } from '../../src/crew/crew.js';
import { Task } from '../../src/task/task.js';
import { AgentStatus } from '../../src/types/agent.js';
import { CrewStatus } from '../../src/types/crew.js';
import { TaskPriority, TaskStatus } from '../../src/types/task.js';
import { ToolCategory, ToolPermission } from '../../src/types/tool.js';
import type { LLMMessage, LLMResponse } from '../../src/types/llm.js';

import {
  AgentEventCollector,
  createCapturingMockLLMProvider,
  createMockLLMProvider,
  createMockStreamingProvider,
  createMockTool,
  createSequenceMockLLMProvider,
  createTestAgent,
  createTestCrew,
  createTestTask,
  createTrackingMockLLMProvider,
  createTrackingMockTool,
  CrewEventCollector,
  DEFAULT_MOCK_TOKEN_USAGE,
  expectAgentError,
  expectAgentIdle,
  expectAgentOutput,
  expectAgentStatus,
  expectCrewStatus,
  expectCrewSuccess,
  expectEventOrder,
  expectEventsContain,
  expectTaskOutput,
} from '../../src/testing/index.js';

// ===========================================================================
// Mock LLM Provider
// ===========================================================================

describe('createMockLLMProvider', () => {
  it('should create a provider with default values', async () => {
    const provider = createMockLLMProvider();
    expect(provider.name).toBe('mock-provider');

    const response = await provider.generateText([]);
    expect(response.content).toBe('Mock LLM response');
    expect(response.tokenUsage).toEqual(DEFAULT_MOCK_TOKEN_USAGE);
    expect(response.finishReason).toBe('stop');
  });

  it('should accept custom content', async () => {
    const provider = createMockLLMProvider({ content: 'Custom response' });
    const response = await provider.generateText([]);
    expect(response.content).toBe('Custom response');
  });

  it('should accept a custom name', () => {
    const provider = createMockLLMProvider({ name: 'my-provider' });
    expect(provider.name).toBe('my-provider');
  });

  it('should accept custom token usage', async () => {
    const tokenUsage = { promptTokens: 100, completionTokens: 200, totalTokens: 300 };
    const provider = createMockLLMProvider({ tokenUsage });
    const response = await provider.generateText([]);
    expect(response.tokenUsage).toEqual(tokenUsage);
  });

  it('should accept a custom finish reason', async () => {
    const provider = createMockLLMProvider({ finishReason: 'length' });
    const response = await provider.generateText([]);
    expect(response.finishReason).toBe('length');
  });

  it('should support artificial delay', async () => {
    const provider = createMockLLMProvider({ delayMs: 50 });
    const start = Date.now();
    await provider.generateText([]);
    expect(Date.now() - start).toBeGreaterThanOrEqual(30); // allow some timing slack
  });

  it('should reject with error when configured', async () => {
    const err = new Error('LLM failure');
    const provider = createMockLLMProvider({ error: err });
    await expect(provider.generateText([])).rejects.toThrow('LLM failure');
  });

  it('should use a dynamic handler when provided', async () => {
    const provider = createMockLLMProvider({
      handler: (messages) => ({
        content: `Got ${String(messages.length)} messages`,
        tokenUsage: DEFAULT_MOCK_TOKEN_USAGE,
        finishReason: 'stop',
      }),
    });

    const response = await provider.generateText([
      { role: 'user' as const, content: 'hi' },
    ] as unknown as LLMMessage[]);

    expect(response.content).toBe('Got 1 messages');
  });

  it('should be a Vitest spy', () => {
    const provider = createMockLLMProvider();
    expect(vi.isMockFunction(provider.generateText)).toBe(true);
  });
});

// ===========================================================================
// Sequence Mock LLM Provider
// ===========================================================================

describe('createSequenceMockLLMProvider', () => {
  it('should return different responses on successive calls', async () => {
    const provider = createSequenceMockLLMProvider(['first', 'second', 'third']);

    expect((await provider.generateText([])).content).toBe('first');
    expect((await provider.generateText([])).content).toBe('second');
    expect((await provider.generateText([])).content).toBe('third');
  });

  it('should repeat last response when calls exceed response count', async () => {
    const provider = createSequenceMockLLMProvider(['only']);

    expect((await provider.generateText([])).content).toBe('only');
    expect((await provider.generateText([])).content).toBe('only');
  });
});

// ===========================================================================
// Tracking Mock LLM Provider
// ===========================================================================

describe('createTrackingMockLLMProvider', () => {
  it('should push id into tracker array on each call', async () => {
    const tracker: string[] = [];
    const p1 = createTrackingMockLLMProvider('agent-1', tracker);
    const p2 = createTrackingMockLLMProvider('agent-2', tracker);

    await p1.generateText([]);
    await p2.generateText([]);
    await p1.generateText([]);

    expect(tracker).toEqual(['agent-1', 'agent-2', 'agent-1']);
  });

  it('should use custom content when provided', async () => {
    const tracker: string[] = [];
    const provider = createTrackingMockLLMProvider('a', tracker, { content: 'custom' });
    const response = await provider.generateText([]);
    expect(response.content).toBe('custom');
  });

  it('should default content to output-{id}', async () => {
    const tracker: string[] = [];
    const provider = createTrackingMockLLMProvider('writer', tracker);
    const response = await provider.generateText([]);
    expect(response.content).toBe('output-writer');
  });
});

// ===========================================================================
// Capturing Mock LLM Provider
// ===========================================================================

describe('createCapturingMockLLMProvider', () => {
  it('should capture messages into the shared map', async () => {
    const captured = new Map<string, readonly LLMMessage[]>();
    const provider = createCapturingMockLLMProvider('research', captured);

    const messages = [
      { role: 'system' as const, content: 'You are a researcher' },
      { role: 'user' as const, content: 'Find papers' },
    ] as unknown as LLMMessage[];

    await provider.generateText(messages);

    expect(captured.has('research')).toBe(true);
    expect(captured.get('research')).toHaveLength(2);
  });
});

// ===========================================================================
// Mock Streaming Provider
// ===========================================================================

describe('createMockStreamingProvider', () => {
  it('should have both generateText and generateStream', () => {
    const provider = createMockStreamingProvider();
    expect(typeof provider.generateText).toBe('function');
    expect(typeof provider.generateStream).toBe('function');
  });

  it('should stream content in chunks', async () => {
    const provider = createMockStreamingProvider({
      streamContent: 'Hello World',
      chunkCount: 2,
    });

    const stream = await provider.generateStream([]);
    const chunks: string[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk.content);
    }

    expect(chunks.join('')).toBe('Hello World');
    expect(chunks.length).toBe(2);
  });

  it('should support toResponse() convenience method', async () => {
    const provider = createMockStreamingProvider({
      streamContent: 'Full response text',
    });

    const stream = await provider.generateStream([]);
    const response = await stream.toResponse();
    expect(response.content).toBe('Full response text');
    expect(response.tokenUsage).toEqual(DEFAULT_MOCK_TOKEN_USAGE);
    expect(response.finishReason).toBe('stop');
  });

  it('should throw when stream is consumed twice', async () => {
    const provider = createMockStreamingProvider({
      streamContent: 'Once only',
    });

    const stream = await provider.generateStream([]);

    // First consumption
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _ of stream) {
      // consume
    }

    // Second consumption should throw
    const secondIteration = async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of stream) {
        // consume
      }
    };

    await expect(secondIteration()).rejects.toThrow('Stream already consumed');
  });
});

// ===========================================================================
// Mock Tool
// ===========================================================================

describe('createMockTool', () => {
  it('should create a tool with default values', async () => {
    const tool = createMockTool();
    expect(tool.name).toBe('mock-tool');
    expect(tool.description).toBe('A mock tool called mock-tool');
    const result = await tool.execute({});
    expect(result).toBe('tool result');
  });

  it('should accept a custom name', () => {
    const tool = createMockTool({ name: 'search' });
    expect(tool.name).toBe('search');
    expect(tool.description).toBe('A mock tool called search');
  });

  it('should accept custom description', () => {
    const tool = createMockTool({ description: 'Custom desc' });
    expect(tool.description).toBe('Custom desc');
  });

  it('should accept a custom result', async () => {
    const tool = createMockTool({ result: { data: [1, 2, 3] } });
    const result = await tool.execute({});
    expect(result).toEqual({ data: [1, 2, 3] });
  });

  it('should reject with error when configured', async () => {
    const tool = createMockTool({ error: new Error('Tool broken') });
    await expect(tool.execute({})).rejects.toThrow('Tool broken');
  });

  it('should use dynamic handler when provided', async () => {
    const tool = createMockTool({
      handler: async (input) => `Got: ${JSON.stringify(input)}`,
    });
    const result = await tool.execute({ query: 'test' });
    expect(result).toBe('Got: {"query":"test"}');
  });

  it('should be a Vitest spy', () => {
    const tool = createMockTool();
    expect(vi.isMockFunction(tool.execute)).toBe(true);
  });

  it('should support category and permissions', () => {
    const tool = createMockTool({
      category: ToolCategory.WEB,
      permissions: [ToolPermission.NETWORK],
    });
    expect(tool.category).toBe(ToolCategory.WEB);
    expect(tool.permissions).toEqual([ToolPermission.NETWORK]);
  });
});

describe('createTrackingMockTool', () => {
  it('should record invocations into tracker', async () => {
    const calls: Array<{ tool: string; input: unknown }> = [];
    const tool = createTrackingMockTool('search', calls);

    await tool.execute({ query: 'AI' });
    await tool.execute({ query: 'ML' });

    expect(calls).toEqual([
      { tool: 'search', input: { query: 'AI' } },
      { tool: 'search', input: { query: 'ML' } },
    ]);
  });
});

// ===========================================================================
// Test Agent Factory
// ===========================================================================

describe('createTestAgent', () => {
  it('should create an agent with default values', () => {
    const agent = createTestAgent();
    expect(agent.id).toBe('test-agent');
    expect(agent.role).toBe('Test Role');
    expect(agent.goal).toBe('Test Goal');
    expect(agent.llmProvider).toBeDefined();
    expect(agent.status).toBe(AgentStatus.IDLE);
  });

  it('should accept custom id, role, goal', () => {
    const agent = createTestAgent({ id: 'researcher', role: 'Researcher', goal: 'Find papers' });
    expect(agent.id).toBe('researcher');
    expect(agent.role).toBe('Researcher');
    expect(agent.goal).toBe('Find papers');
  });

  it('should accept custom llmOptions', async () => {
    const agent = createTestAgent({ llmOptions: { content: 'Custom output' } });
    const result = await agent.execute({ description: 'Do something' });
    expect(result.output).toBe('Custom output');
  });

  it('should accept an existing llmProvider', async () => {
    const provider = createMockLLMProvider({ content: 'From existing' });
    const agent = createTestAgent({ llmProvider: provider });
    const result = await agent.execute({ description: 'Test' });
    expect(result.output).toBe('From existing');
  });

  it('should accept tools', () => {
    const tool = createMockTool({ name: 'search' });
    const agent = createTestAgent({ tools: [tool] });
    expect(agent.hasTool('search')).toBe(true);
  });

  it('should accept backstory and maxIterations', () => {
    const agent = createTestAgent({
      backstory: 'Expert tester',
      maxIterations: 5,
    });
    expect(agent.backstory).toBe('Expert tester');
    expect(agent.maxIterations).toBe(5);
  });
});

// ===========================================================================
// Test Task Factory
// ===========================================================================

describe('createTestTask', () => {
  it('should create a task with default values', () => {
    const task = createTestTask();
    expect(task.id).toBe('test-task');
    expect(task.description).toBe('Task test-task description');
    expect(task.agentId).toBe('test-agent');
    expect(task.status).toBe(TaskStatus.PENDING);
  });

  it('should accept all custom options', () => {
    const task = createTestTask({
      id: 'research',
      description: 'Research AI papers',
      expectedOutput: 'List of papers',
      agentId: 'researcher',
      dependencies: ['prep'],
      timeout: 5000,
      retries: 2,
      priority: TaskPriority.HIGH,
      metadata: { source: 'test' },
    });

    expect(task.id).toBe('research');
    expect(task.description).toBe('Research AI papers');
    expect(task.expectedOutput).toBe('List of papers');
    expect(task.agentId).toBe('researcher');
    expect(task.dependencies).toEqual(['prep']);
    expect(task.timeout).toBe(5000);
    expect(task.retries).toBe(2);
    expect(task.priority).toBe(TaskPriority.HIGH);
    expect(task.metadata).toEqual({ source: 'test' });
  });
});

// ===========================================================================
// Test Crew Factory
// ===========================================================================

describe('createTestCrew', () => {
  it('should auto-create agents from task agentIds', () => {
    const crew = createTestCrew({
      tasks: [
        { id: 't1', description: 'Task 1', agentId: 'agent-a' },
        { id: 't2', description: 'Task 2', agentId: 'agent-b' },
      ],
    });

    expect(crew.id).toBe('test-crew');
    expect(crew.agents.size).toBe(2);
    expect(crew.agents.has('agent-a')).toBe(true);
    expect(crew.agents.has('agent-b')).toBe(true);
  });

  it('should use provided agents', () => {
    const agent = createTestAgent({ id: 'custom' });
    const crew = createTestCrew({
      agents: [agent],
      tasks: [{ id: 't1', description: 'Task', agentId: 'custom' }],
    });

    expect(crew.agents.size).toBe(1);
    expect(crew.agents.get('custom')).toBe(agent);
  });

  it('should run the crew workflow end-to-end', async () => {
    const crew = createTestCrew({
      tasks: [
        { id: 'step-1', description: 'First step', agentId: 'worker' },
        { id: 'step-2', description: 'Second step', agentId: 'worker', dependencies: ['step-1'] },
      ],
    });

    const result = await crew.run();
    expect(result.success).toBe(true);
    expect(result.taskResults.size).toBe(2);
  });

  it('should accept custom crew name', () => {
    const crew = createTestCrew({
      name: 'Research Crew',
      tasks: [{ id: 't1', description: 'Do work', agentId: 'a' }],
    });
    expect(crew.name).toBe('Research Crew');
  });
});

// ===========================================================================
// Agent Event Collector
// ===========================================================================

describe('AgentEventCollector', () => {
  it('should collect agent lifecycle events', async () => {
    const agent = createTestAgent({ llmOptions: { content: 'Done' } });
    const collector = new AgentEventCollector(agent);

    await agent.execute({ description: 'Do something' });

    expect(collector.count).toBeGreaterThan(0);
    expect(collector.has('agent:start')).toBe(true);
    expect(collector.has('agent:complete')).toBe(true);
    expect(collector.has('agent:llm:start')).toBe(true);
    expect(collector.has('agent:llm:complete')).toBe(true);
    expect(collector.has('agent:status-changed')).toBe(true);
  });

  it('should collect error events on failure', async () => {
    const agent = createTestAgent({
      llmOptions: { error: new Error('LLM boom') },
    });
    const collector = new AgentEventCollector(agent);

    await expect(agent.execute({ description: 'Fail' })).rejects.toThrow();

    expect(collector.has('agent:error')).toBe(true);
  });

  it('should support filter by event name', async () => {
    const agent = createTestAgent();
    const collector = new AgentEventCollector(agent);
    await agent.execute({ description: 'Test' });

    const statusEvents = collector.filter('agent:status-changed');
    expect(statusEvents.length).toBeGreaterThan(0);
    expect(statusEvents.every((e) => e.event === 'agent:status-changed')).toBe(true);
  });

  it('should support clear', async () => {
    const agent = createTestAgent();
    const collector = new AgentEventCollector(agent);
    await agent.execute({ description: 'Test' });

    expect(collector.count).toBeGreaterThan(0);
    collector.clear();
    expect(collector.count).toBe(0);
  });

  it('should record timestamps', async () => {
    const agent = createTestAgent();
    const collector = new AgentEventCollector(agent);
    await agent.execute({ description: 'Test' });

    for (const event of collector.events) {
      expect(event.timestamp).toBeGreaterThan(0);
    }
  });
});

// ===========================================================================
// Crew Event Collector
// ===========================================================================

describe('CrewEventCollector', () => {
  it('should collect crew lifecycle events', async () => {
    const crew = createTestCrew({
      tasks: [{ id: 't1', description: 'Do it', agentId: 'a1' }],
    });
    const collector = new CrewEventCollector(crew);

    await crew.run();

    expect(collector.has('crew:start')).toBe(true);
    expect(collector.has('crew:complete')).toBe(true);
    expect(collector.has('crew:task:start')).toBe(true);
    expect(collector.has('crew:task:complete')).toBe(true);
    expect(collector.has('crew:status-changed')).toBe(true);
  });

  it('should support eventNames accessor', async () => {
    const crew = createTestCrew({
      tasks: [{ id: 't1', description: 'Do it', agentId: 'a1' }],
    });
    const collector = new CrewEventCollector(crew);
    await crew.run();

    expect(collector.eventNames).toContain('crew:start');
    expect(collector.eventNames).toContain('crew:complete');
  });

  it('should support clear', async () => {
    const crew = createTestCrew({
      tasks: [{ id: 't1', description: 'Do it', agentId: 'a1' }],
    });
    const collector = new CrewEventCollector(crew);
    await crew.run();

    expect(collector.count).toBeGreaterThan(0);
    collector.clear();
    expect(collector.count).toBe(0);
  });
});

// ===========================================================================
// Workflow Assertions
// ===========================================================================

describe('expectAgentOutput', () => {
  it('should pass when output contains expected string', () => {
    const result = { output: 'Hello World', agentId: 'a', duration: 50 };
    expect(() => expectAgentOutput(result, 'Hello')).not.toThrow();
  });

  it('should fail when output does not contain expected string', () => {
    const result = { output: 'Hello World', agentId: 'a', duration: 50 };
    expect(() => expectAgentOutput(result, 'Goodbye')).toThrow();
  });
});

describe('expectAgentStatus / expectAgentIdle / expectAgentError', () => {
  it('should validate idle state', () => {
    const agent = createTestAgent();
    expect(() => expectAgentIdle(agent)).not.toThrow();
  });

  it('should validate error state', async () => {
    const agent = createTestAgent({
      llmOptions: { error: new Error('boom') },
    });

    try {
      await agent.execute({ description: 'Fail' });
    } catch {
      // expected
    }

    expect(() => expectAgentError(agent)).not.toThrow();
  });

  it('should reject wrong status', () => {
    const agent = createTestAgent();
    expect(() => expectAgentStatus(agent, AgentStatus.ERROR)).toThrow();
  });
});

describe('expectCrewSuccess', () => {
  it('should pass for successful crew run', async () => {
    const crew = createTestCrew({
      tasks: [{ id: 't1', description: 'Do it', agentId: 'a1' }],
    });
    const result = await crew.run();
    expect(() => expectCrewSuccess(result, ['t1'])).not.toThrow();
  });

  it('should fail when task id is missing', async () => {
    const crew = createTestCrew({
      tasks: [{ id: 't1', description: 'Do it', agentId: 'a1' }],
    });
    const result = await crew.run();
    expect(() => expectCrewSuccess(result, ['t1', 't2'])).toThrow();
  });
});

describe('expectCrewStatus', () => {
  it('should validate crew status', async () => {
    const crew = createTestCrew({
      tasks: [{ id: 't1', description: 'Do it', agentId: 'a1' }],
    });
    await crew.run();
    expect(() => expectCrewStatus(crew, CrewStatus.COMPLETED)).not.toThrow();
  });
});

describe('expectTaskOutput', () => {
  it('should validate task output in crew results', async () => {
    const crew = createTestCrew({
      tasks: [{ id: 't1', description: 'Do it', agentId: 'worker' }],
    });
    const result = await crew.run();
    expect(() => expectTaskOutput(result, 't1', 'Output from worker')).not.toThrow();
  });

  it('should fail for missing task', async () => {
    const crew = createTestCrew({
      tasks: [{ id: 't1', description: 'Do it', agentId: 'worker' }],
    });
    const result = await crew.run();
    expect(() => expectTaskOutput(result, 'nonexistent', 'anything')).toThrow();
  });
});

describe('expectEventOrder', () => {
  it('should pass when events appear in order', () => {
    const events = ['start', 'llm:start', 'llm:complete', 'complete'];
    expect(() => expectEventOrder(events, ['start', 'complete'])).not.toThrow();
    expect(() => expectEventOrder(events, ['start', 'llm:start', 'complete'])).not.toThrow();
  });

  it('should fail when events are out of order', () => {
    const events = ['start', 'complete'];
    expect(() => expectEventOrder(events, ['complete', 'start'])).toThrow();
  });
});

describe('expectEventsContain', () => {
  it('should pass when all expected events are present', () => {
    const events = ['a', 'b', 'c', 'd'];
    expect(() => expectEventsContain(events, ['c', 'a'])).not.toThrow();
  });

  it('should fail when expected event is missing', () => {
    const events = ['a', 'b'];
    expect(() => expectEventsContain(events, ['a', 'x'])).toThrow();
  });
});

// ===========================================================================
// Integration: Full workflow test using helpers
// ===========================================================================

describe('Integration: full agent workflow with helpers', () => {
  it('should support a complete research-write workflow', async () => {
    // Build agents
    const researcher = createTestAgent({
      id: 'researcher',
      role: 'Research Analyst',
      goal: 'Find AI papers',
      llmOptions: { content: 'Found 3 relevant papers on multi-agent systems' },
    });

    const writer = createTestAgent({
      id: 'writer',
      role: 'Content Writer',
      goal: 'Write summaries',
      llmOptions: { content: 'Summary article about multi-agent AI research' },
    });

    // Build crew
    const crew = createTestCrew({
      id: 'research-crew',
      agents: [researcher, writer],
      tasks: [
        { id: 'research', description: 'Find papers', agentId: 'researcher' },
        {
          id: 'write',
          description: 'Write article',
          agentId: 'writer',
          dependencies: ['research'],
        },
      ],
    });

    // Collect events
    const crewEvents = new CrewEventCollector(crew);

    // Run
    const result = await crew.run();

    // Assertions using helpers
    expectCrewSuccess(result, ['research', 'write']);
    expectCrewStatus(crew, CrewStatus.COMPLETED);
    expectTaskOutput(result, 'research', 'papers');
    expectTaskOutput(result, 'write', 'Summary');

    // Event assertions
    expectEventsContain(crewEvents.eventNames, [
      'crew:start',
      'crew:task:start',
      'crew:task:complete',
      'crew:complete',
    ]);

    expectEventOrder(crewEvents.eventNames, ['crew:start', 'crew:complete']);
  });

  it('should track execution order in parallel-like workflows', async () => {
    const order: string[] = [];
    const p1 = createTrackingMockLLMProvider('research', order);
    const p2 = createTrackingMockLLMProvider('analysis', order);

    const agent1 = createTestAgent({ id: 'researcher', llmProvider: p1 });
    const agent2 = createTestAgent({ id: 'analyst', llmProvider: p2 });

    const crew = createTestCrew({
      agents: [agent1, agent2],
      tasks: [
        { id: 'research', description: 'Find data', agentId: 'researcher' },
        {
          id: 'analyze',
          description: 'Analyze data',
          agentId: 'analyst',
          dependencies: ['research'],
        },
      ],
    });

    await crew.run();

    expect(order).toEqual(['research', 'analysis']);
  });
});
