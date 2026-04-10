import { describe, it, expect, vi } from 'vitest';

import { Agent } from '../../src/agent/agent.js';
import { Crew } from '../../src/crew/crew.js';
import { ConvergenceStrategy } from '../../src/types/discussion.js';
import type { DiscussionMessage, DiscussionResult } from '../../src/types/discussion.js';
import type { LLMProvider, LLMResponse, LLMMessage } from '../../src/types/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockProvider(content?: string): LLMProvider {
  return {
    name: 'mock-provider',
    generateText: vi
      .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
      .mockResolvedValue({
        content: content ?? '[AGREE] Looks good',
        tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        finishReason: 'stop',
      }),
  };
}

function createAgent(id: string, content?: string): Agent {
  const provider = createMockProvider(content);
  return new Agent({
    id,
    role: `Role-${id}`,
    goal: `Goal of ${id}`,
    llmProvider: provider,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Crew with discussions', () => {
  it('should run a task with a pre-task discussion', async () => {
    const agentA = createAgent('agent-a');
    const agentB = createAgent('agent-b');

    const events: string[] = [];

    const crew = new Crew({
      id: 'crew-disc',
      agents: [agentA, agentB],
      tasks: [
        {
          id: 'task-1',
          description: 'Write a summary based on discussion',
          agentId: 'agent-a',
          discussion: {
            participantIds: ['agent-a', 'agent-b'],
            maxRounds: 3,
            convergenceStrategy: ConvergenceStrategy.UNANIMOUS,
            topic: 'What should the summary cover?',
          },
        },
      ],
    });

    crew.on('crew:discussion:start', () => events.push('disc:start'));
    crew.on('crew:discussion:message', () => events.push('disc:message'));
    crew.on('crew:discussion:complete', () => events.push('disc:complete'));
    crew.on('crew:task:start', () => events.push('task:start'));
    crew.on('crew:task:complete', () => events.push('task:complete'));

    const result = await crew.run();

    expect(result.success).toBe(true);
    expect(result.taskResults.size).toBe(1);

    // Discussion events should fire before task events
    const discStartIdx = events.indexOf('disc:start');
    const taskStartIdx = events.indexOf('task:start');
    expect(discStartIdx).toBeGreaterThanOrEqual(0);
    expect(taskStartIdx).toBeGreaterThan(discStartIdx);

    // Verify discussion happened
    expect(events.filter((e) => e === 'disc:message').length).toBeGreaterThanOrEqual(2);
    expect(events).toContain('disc:complete');
  });

  it('should inject discussion result into task context', async () => {
    const providerA = createMockProvider('[AGREE] We should focus on AI trends');
    const providerB = createMockProvider('[AGREE] Agreed on AI trends');

    const agentA = new Agent({
      id: 'agent-a',
      role: 'Researcher',
      goal: 'Research',
      llmProvider: providerA,
    });
    const agentB = new Agent({
      id: 'agent-b',
      role: 'Analyst',
      goal: 'Analyze',
      llmProvider: providerB,
    });

    const crew = new Crew({
      id: 'crew-ctx',
      agents: [agentA, agentB],
      tasks: [
        {
          id: 'task-1',
          description: 'Produce a report',
          agentId: 'agent-a',
          discussion: {
            participantIds: ['agent-a', 'agent-b'],
            maxRounds: 3,
            convergenceStrategy: ConvergenceStrategy.UNANIMOUS,
          },
        },
      ],
    });

    const result = await crew.run();
    expect(result.success).toBe(true);

    // The last call to agent-a's LLM should include discussionResult in context
    const lastCall = (providerA.generateText as ReturnType<typeof vi.fn>).mock.calls;
    // Discussion calls + 1 task call
    expect(lastCall.length).toBeGreaterThan(1);
    const taskCallMessages = lastCall[lastCall.length - 1]![0] as Array<{ content: string }>;
    const userMsg = taskCallMessages.find((m) => m.content.includes('discussionResult'));
    expect(userMsg).toBeDefined();
  });

  it('should work with mixed discussion and non-discussion tasks', async () => {
    const agentA = createAgent('agent-a');
    const agentB = createAgent('agent-b');

    const crew = new Crew({
      id: 'crew-mixed',
      agents: [agentA, agentB],
      tasks: [
        {
          id: 'task-1',
          description: 'Simple task (no discussion)',
          agentId: 'agent-a',
        },
        {
          id: 'task-2',
          description: 'Collaborative task',
          agentId: 'agent-b',
          dependencies: ['task-1'],
          discussion: {
            participantIds: ['agent-a', 'agent-b'],
            maxRounds: 2,
            convergenceStrategy: ConvergenceStrategy.MAJORITY,
          },
        },
      ],
    });

    const result = await crew.run();
    expect(result.success).toBe(true);
    expect(result.taskResults.size).toBe(2);
  });
});
