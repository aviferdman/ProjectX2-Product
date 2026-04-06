/**
 * Crewspace — Simple Chat Agent Example
 *
 * This example demonstrates how to build a conversational chat agent using
 * Crewspace's Agent class. The agent maintains conversation history across
 * multiple turns, enabling natural multi-turn dialogue.
 *
 * Key concepts:
 *   - Creating an agent with a conversational persona
 *   - Maintaining message history for multi-turn chat
 *   - Listening to agent lifecycle events
 *   - Accumulating token usage across turns
 *
 * Prerequisites:
 *   npm install @crewspace/core
 *
 * Usage:
 *   npx tsx examples/simple-chat-agent.ts
 *
 * Note: This example uses a mock LLM provider for demonstration purposes.
 * Replace it with a real provider (OpenAI, Anthropic, Ollama) for production use.
 */

import { Agent } from '@crewspace/core';
import type { LLMProvider, LLMMessage, LLMResponse, TokenUsage } from '@crewspace/core';
import { LLMRole } from '@crewspace/core';

// -- Mock LLM provider (replace with createOpenAIProvider() for real use) ----

const mockResponses: Record<string, string> = {
  hello: 'Hello! I\'m your friendly AI assistant. How can I help you today?',
  'what can you do':
    'I can help you with a variety of tasks! I can answer questions, help with writing, brainstorm ideas, explain concepts, and much more. What would you like to work on?',
  'tell me a joke':
    'Why do programmers prefer dark mode? Because light attracts bugs! 🐛',
  default:
    'That\'s an interesting question! Let me think about that... I\'d be happy to help you explore this topic further.',
};

function createChatMockProvider(): LLMProvider {
  return {
    name: 'chat-mock',
    async generateText(messages: readonly LLMMessage[]): Promise<LLMResponse> {
      const lastUserMessage = [...messages].reverse().find((m) => m.role === LLMRole.USER);
      const query = (lastUserMessage?.content ?? '').toLowerCase().trim();

      const matchedKey = Object.keys(mockResponses).find((key) => query.includes(key));
      const content = matchedKey ? mockResponses[matchedKey] : mockResponses['default'];

      return {
        content,
        tokenUsage: { promptTokens: messages.length * 15, completionTokens: 25, totalTokens: messages.length * 15 + 25 },
        finishReason: 'stop',
      };
    },
  };
}

// -- Simple Chat Agent -------------------------------------------------------

// 1. Create a chat-focused agent with a conversational persona
const chatAgent = new Agent({
  id: 'chat-assistant',
  role: 'Friendly Conversational Assistant',
  goal: 'Have helpful, natural conversations with users',
  backstory:
    'You are a warm and knowledgeable assistant who loves helping people. ' +
    'You remember what was said earlier in the conversation and build on it.',
  llmProvider: createChatMockProvider(),
});

// 2. Track conversation history for multi-turn chat
const conversationHistory: LLMMessage[] = [];
const totalUsage: { promptTokens: number; completionTokens: number; totalTokens: number } = {
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
};

// 3. Listen to agent events (optional)
chatAgent.on('agent:start', (_agentId, taskInput) => {
  console.log(`\n💬 User: ${taskInput.description}`);
});

chatAgent.on('agent:complete', (_agentId, result) => {
  console.log(`🤖 Assistant: ${result.output}`);
});

// 4. Define a chat function that maintains history
async function chat(userMessage: string): Promise<string> {
  // Add user message to history
  conversationHistory.push({ role: LLMRole.USER, content: userMessage });

  // Execute the agent with conversation context
  const result = await chatAgent.execute({
    description: userMessage,
    context: {
      conversationHistory: conversationHistory.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    },
  });

  // Add assistant response to history
  conversationHistory.push({ role: LLMRole.ASSISTANT, content: result.output });

  // Accumulate token usage
  if (result.tokenUsage) {
    totalUsage.promptTokens += result.tokenUsage.promptTokens;
    totalUsage.completionTokens += result.tokenUsage.completionTokens;
    totalUsage.totalTokens += result.tokenUsage.totalTokens;
  }

  return result.output;
}

// -- Run a sample conversation -----------------------------------------------

console.log('=== Crewspace Simple Chat Agent ===\n');

await chat('Hello');
await chat('What can you do?');
await chat('Tell me a joke');

// 5. Print conversation summary
console.log('\n=== Conversation Summary ===');
console.log(`Turns: ${String(conversationHistory.length / 2)}`);
console.log(`Total tokens used: ${String(totalUsage.totalTokens)}`);
console.log(
  `Messages in history: ${String(conversationHistory.length)} (${String(conversationHistory.filter((m) => m.role === LLMRole.USER).length)} user, ${String(conversationHistory.filter((m) => m.role === LLMRole.ASSISTANT).length)} assistant)`,
);
