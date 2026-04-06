/**
 * Crewspace — Getting Started Example
 *
 * This example demonstrates the core Crewspace workflow in ~10 lines of code:
 * create agents, build a crew with tasks, and run the workflow.
 *
 * Prerequisites:
 *   npm install @crewspace/core
 *
 * Usage:
 *   npx tsx examples/getting-started.ts
 *
 * Note: This example uses a mock LLM provider for demonstration purposes.
 * Replace it with a real provider (OpenAI, Anthropic, Ollama) for production use.
 */

import { Agent, Crew } from '@crewspace/core';
import type { LLMProvider, LLMMessage, LLMResponse } from '@crewspace/core';

// -- Mock LLM provider (replace with createOpenAIProvider() for real use) ----
function createMockProvider(name: string): LLMProvider {
  return {
    name,
    async generateText(_messages: readonly LLMMessage[]): Promise<LLMResponse> {
      return {
        content: `[${name}] Generated response based on the prompt.`,
        tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        finishReason: 'stop',
      };
    },
  };
}

// -- Getting started: 10 lines of functional code ----------------------------

// 1. Create agents with distinct roles
const researcher = new Agent({
  id: 'researcher',
  role: 'Research Analyst',
  goal: 'Find key insights on a given topic',
  llmProvider: createMockProvider('researcher-llm'),
});

const writer = new Agent({
  id: 'writer',
  role: 'Content Writer',
  goal: 'Write clear and concise summaries',
  llmProvider: createMockProvider('writer-llm'),
});

// 2. Build a crew with tasks assigned to agents
const crew = new Crew({
  id: 'my-crew',
  agents: [researcher, writer],
  tasks: [
    { id: 'research', description: 'Research AI trends for 2026', agentId: 'researcher' },
    {
      id: 'report',
      description: 'Write a summary report of the research findings',
      agentId: 'writer',
      dependencies: ['research'],
    },
  ],
});

// 3. Subscribe to lifecycle events (optional)
crew.on('crew:task:start', (_crewId, taskId, agentId) => {
  console.log(`▶ Starting task "${taskId}" → agent "${agentId}"`);
});

crew.on('crew:task:complete', (_crewId, taskId, result) => {
  console.log(`✓ Task "${taskId}" completed (${String(result.duration)}ms)`);
});

// 4. Run the workflow — tasks execute in dependency order
const result = await crew.run();

// 5. Inspect results
console.log('\n=== Crew Run Complete ===');
console.log(`Success: ${String(result.success)}`);
console.log(`Duration: ${String(result.duration)}ms`);
console.log(`Tasks completed: ${String(result.taskResults.size)}`);

for (const [taskId, taskResult] of result.taskResults) {
  console.log(`\n--- ${taskId} ---`);
  console.log(`Agent: ${String(taskResult.agentId)}`);
  console.log(`Output: ${taskResult.output}`);
}
