/**
 * Tests for TASK-084: Simple Chat Agent Example
 *
 * Validates the simple chat agent example file, its documentation,
 * and that the conversational chat pattern works end-to-end.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Agent } from '../../src/agent/agent.js';
import { LLMRole } from '../../src/types/llm.js';
import type { LLMProvider, LLMResponse, LLMMessage } from '../../src/types/index.js';

const currentFilename = fileURLToPath(import.meta.url);
const currentDirname = dirname(currentFilename);
const PROJECT_ROOT = join(currentDirname, '../../../..');
const EXAMPLES_DIR = join(PROJECT_ROOT, 'examples');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockChatProvider(responseMap?: Record<string, string>): LLMProvider {
  const responses = responseMap ?? {
    hello: 'Hi there! How can I help?',
    default: 'Mock chat response',
  };

  return {
    name: 'mock-chat-provider',
    generateText: vi
      .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
      .mockImplementation(async (messages) => {
        const lastUserMsg = [...messages].reverse().find((m) => m.role === LLMRole.USER);
        // Match on just the first line (the description), not the full context
        const firstLine = (lastUserMsg?.content ?? '').split('\n')[0].toLowerCase().trim();
        const key = Object.keys(responses).find((k) => firstLine.includes(k));
        const content = key ? responses[key] : responses['default'];

        return {
          content,
          tokenUsage: {
            promptTokens: messages.length * 10,
            completionTokens: 20,
            totalTokens: messages.length * 10 + 20,
          },
          finishReason: 'stop',
        };
      }),
  };
}

// ---------------------------------------------------------------------------
// Example file validation
// ---------------------------------------------------------------------------

describe('TASK-084: Simple Chat Agent — Example File', () => {
  const examplePath = join(EXAMPLES_DIR, 'simple-chat-agent.ts');
  let content: string;

  it('should exist at examples/simple-chat-agent.ts', () => {
    expect(existsSync(examplePath)).toBe(true);
    content = readFileSync(examplePath, 'utf-8');
  });

  it('should include a file header comment', () => {
    expect(content).toMatch(/^\/\*\*/);
  });

  it('should import Agent from @crewspace/core', () => {
    expect(content).toContain("import { Agent } from '@crewspace/core'");
  });

  it('should import LLMRole from @crewspace/core', () => {
    expect(content).toContain("import { LLMRole } from '@crewspace/core'");
  });

  it('should import LLM types from @crewspace/core', () => {
    expect(content).toContain('LLMProvider');
    expect(content).toContain('LLMMessage');
    expect(content).toContain('LLMResponse');
  });

  it('should create an Agent with a conversational role', () => {
    expect(content).toContain('new Agent');
    expect(content).toMatch(/role:.*[Cc]onversational|[Aa]ssistant|[Cc]hat/);
  });

  it('should maintain conversation history', () => {
    expect(content).toContain('conversationHistory');
  });

  it('should define a chat function', () => {
    expect(content).toMatch(/async function chat/);
  });

  it('should use agent.execute()', () => {
    expect(content).toContain('.execute(');
  });

  it('should track token usage', () => {
    expect(content).toContain('tokenUsage');
    expect(content).toContain('totalTokens');
  });

  it('should demonstrate multi-turn conversation', () => {
    const chatCalls = content.match(/await chat\(/g) ?? [];
    expect(chatCalls.length).toBeGreaterThanOrEqual(2);
  });

  it('should listen to agent events', () => {
    expect(content).toContain("chatAgent.on('agent:");
  });

  it('should mention LLMRole.USER and LLMRole.ASSISTANT', () => {
    expect(content).toContain('LLMRole.USER');
    expect(content).toContain('LLMRole.ASSISTANT');
  });

  it('should include usage instructions in header', () => {
    expect(content).toContain('npx tsx examples/simple-chat-agent.ts');
  });

  it('should mention mock provider replacement', () => {
    expect(content).toMatch(/[Rr]eplace.*real provider|[Mm]ock.*provider/);
  });
});

// ---------------------------------------------------------------------------
// Functional validation — chat agent pattern works
// ---------------------------------------------------------------------------

describe('TASK-084: Simple Chat Agent — Functional Validation', () => {
  let chatAgent: Agent;
  let conversationHistory: LLMMessage[];
  let provider: LLMProvider;

  beforeEach(() => {
    provider = createMockChatProvider({
      hello: 'Hi there! How can I help?',
      weather: 'The weather looks great today!',
      default: 'Interesting, tell me more!',
    });

    chatAgent = new Agent({
      id: 'chat-assistant',
      role: 'Friendly Conversational Assistant',
      goal: 'Have helpful conversations with users',
      backstory: 'A warm and knowledgeable assistant.',
      llmProvider: provider,
    });

    conversationHistory = [];
  });

  async function chat(userMessage: string): Promise<string> {
    conversationHistory.push({ role: LLMRole.USER, content: userMessage });

    const result = await chatAgent.execute({
      description: userMessage,
      context: {
        conversationHistory: conversationHistory.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      },
    });

    conversationHistory.push({ role: LLMRole.ASSISTANT, content: result.output });
    return result.output;
  }

  it('should respond to a single message', async () => {
    const response = await chat('Hello');
    expect(response).toBe('Hi there! How can I help?');
  });

  it('should maintain conversation history across turns', async () => {
    await chat('Hello');
    await chat('How is the weather?');

    expect(conversationHistory).toHaveLength(4);
    expect(conversationHistory[0]).toEqual({ role: LLMRole.USER, content: 'Hello' });
    expect(conversationHistory[1]).toEqual({
      role: LLMRole.ASSISTANT,
      content: 'Hi there! How can I help?',
    });
    expect(conversationHistory[2]).toEqual({
      role: LLMRole.USER,
      content: 'How is the weather?',
    });
    expect(conversationHistory[3]).toEqual({
      role: LLMRole.ASSISTANT,
      content: 'The weather looks great today!',
    });
  });

  it('should pass conversation history as context to the agent', async () => {
    await chat('Hello');
    await chat('Tell me more');

    // The second call should include the history as context
    const generateText = provider.generateText as ReturnType<typeof vi.fn>;
    const secondCallMessages = generateText.mock.calls[1][0] as readonly LLMMessage[];
    const userMessage = secondCallMessages.find((m: LLMMessage) => m.role === LLMRole.USER);
    expect(userMessage?.content).toContain('Tell me more');
    expect(userMessage?.content).toContain('conversationHistory');
  });

  it('should handle multiple conversation turns', async () => {
    const responses = [
      await chat('Hello'),
      await chat('What about the weather?'),
      await chat('Something else entirely'),
    ];

    expect(responses).toHaveLength(3);
    expect(responses[0]).toBe('Hi there! How can I help?');
    expect(responses[1]).toBe('The weather looks great today!');
    expect(responses[2]).toBe('Interesting, tell me more!');
  });

  it('should return valid task results with duration and token usage', async () => {
    const result = await chatAgent.execute({
      description: 'Hello',
      context: { conversationHistory: [] },
    });

    expect(result.output).toBeDefined();
    expect(result.agentId).toBe('chat-assistant');
    expect(result.duration).toBeGreaterThanOrEqual(0);
    expect(result.tokenUsage).toBeDefined();
    expect(result.tokenUsage?.totalTokens).toBeGreaterThan(0);
  });

  it('should accumulate token usage across turns', async () => {
    let totalTokens = 0;

    for (const msg of ['Hello', 'Weather?', 'Bye']) {
      const result = await chatAgent.execute({
        description: msg,
        context: { conversationHistory: [] },
      });
      totalTokens += result.tokenUsage?.totalTokens ?? 0;
    }

    expect(totalTokens).toBeGreaterThan(0);
  });

  it('should emit agent lifecycle events during chat', async () => {
    const events: string[] = [];

    chatAgent.on('agent:start', () => events.push('start'));
    chatAgent.on('agent:llm:start', () => events.push('llm:start'));
    chatAgent.on('agent:llm:complete', () => events.push('llm:complete'));
    chatAgent.on('agent:complete', () => events.push('complete'));

    await chat('Hello');

    expect(events).toEqual(['start', 'llm:start', 'llm:complete', 'complete']);
  });

  it('should include agent backstory in system prompt', () => {
    const systemPrompt = chatAgent.buildSystemPrompt();
    expect(systemPrompt).toContain('Friendly Conversational Assistant');
    expect(systemPrompt).toContain('Have helpful conversations');
    expect(systemPrompt).toContain('warm and knowledgeable');
  });

  it('should work with an empty conversation history', async () => {
    const result = await chatAgent.execute({
      description: 'First message ever',
      context: { conversationHistory: [] },
    });

    expect(result.output).toBeDefined();
    expect(result.output.length).toBeGreaterThan(0);
  });

  it('should handle rapid sequential messages', async () => {
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        chatAgent.execute({
          description: `Message ${String(i)}`,
          context: { conversationHistory: [] },
        }),
      );
    }

    // Note: these run concurrently but each is independent
    const results = await Promise.all(promises);
    expect(results).toHaveLength(5);
    for (const result of results) {
      expect(result.output).toBeDefined();
      expect(result.agentId).toBe('chat-assistant');
    }
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('TASK-084: Simple Chat Agent — Edge Cases', () => {
  it('should handle empty user message', async () => {
    const agent = new Agent({
      id: 'chat-edge',
      role: 'Assistant',
      goal: 'Help users',
      llmProvider: createMockChatProvider(),
    });

    const result = await agent.execute({
      description: '',
      context: { conversationHistory: [] },
    });

    expect(result.output).toBeDefined();
  });

  it('should handle very long user messages', async () => {
    const agent = new Agent({
      id: 'chat-long',
      role: 'Assistant',
      goal: 'Help users',
      llmProvider: createMockChatProvider(),
    });

    const longMessage = 'a'.repeat(10000);
    const result = await agent.execute({
      description: longMessage,
      context: { conversationHistory: [] },
    });

    expect(result.output).toBeDefined();
  });

  it('should handle conversation with large history in context', async () => {
    const agent = new Agent({
      id: 'chat-history',
      role: 'Assistant',
      goal: 'Help users',
      llmProvider: createMockChatProvider(),
    });

    const largeHistory = Array.from({ length: 50 }, (_, i) => ({
      role: i % 2 === 0 ? LLMRole.USER : LLMRole.ASSISTANT,
      content: `Message ${String(i)}`,
    }));

    const result = await agent.execute({
      description: 'Latest message',
      context: { conversationHistory: largeHistory },
    });

    expect(result.output).toBeDefined();
    expect(result.agentId).toBe('chat-history');
  });

  it('should fail gracefully without LLM provider', async () => {
    const agent = new Agent({
      id: 'chat-no-llm',
      role: 'Assistant',
      goal: 'Help users',
    });

    await expect(
      agent.execute({ description: 'Hello', context: { conversationHistory: [] } }),
    ).rejects.toThrow('No LLM provider configured');
  });
});
