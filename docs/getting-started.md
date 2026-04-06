# Getting Started with Crewspace

Build your first multi-agent workflow in under 10 lines of code.

## Prerequisites

- **Node.js** 18 or later
- **npm** 10 or later

## Installation

```bash
npm install @crewspace/core
```

## Your First Crew in 10 Lines

```typescript
import { Agent, Crew } from '@crewspace/core';

// 1. Create agents with distinct roles
const researcher = new Agent({ id: 'researcher', role: 'Research Analyst', goal: 'Find key insights' });
const writer = new Agent({ id: 'writer', role: 'Content Writer', goal: 'Write clear summaries' });

// 2. Build a crew with tasks assigned to agents
const crew = new Crew({
  id: 'my-crew',
  agents: [researcher, writer],
  tasks: [
    { id: 'research', description: 'Research AI trends', agentId: 'researcher' },
    { id: 'report', description: 'Write a summary report', agentId: 'writer', dependencies: ['research'] },
  ],
});

// 3. Run the workflow — tasks execute in dependency order
const result = await crew.run();
console.log(result.taskResults);
```

That's it! In just 10 lines of functional code you:

1. **Created two agents** with specialized roles
2. **Defined a crew** with a task dependency graph
3. **Ran the workflow** — Crewspace executes tasks in topological order, threading prior results as context

## Connecting an LLM Provider

Agents need an LLM provider to generate responses. Crewspace supports OpenAI, Anthropic, and Ollama out of the box:

```typescript
import { createOpenAIProvider } from '@crewspace/core';

const llm = createOpenAIProvider({
  modelId: 'gpt-4o',
  apiKey: process.env.OPENAI_API_KEY!,
});

researcher.setLLMProvider(llm);
writer.setLLMProvider(llm);
```

Swap providers at any time without changing agent code:

```typescript
import { createAnthropicProvider, createOllamaProvider } from '@crewspace/core';

// Use Anthropic in production
const claude = createAnthropicProvider({
  modelId: 'claude-sonnet-4-20250514',
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Use Ollama locally
const local = createOllamaProvider({ modelId: 'llama3' });
```

## Adding Tools to Agents

Give agents capabilities with the built-in tool system:

```typescript
import { defineTool } from '@crewspace/core';
import { z } from 'zod';

const calculator = defineTool({
  name: 'calculator',
  description: 'Perform basic arithmetic',
  schema: z.object({
    a: z.number(),
    b: z.number(),
    op: z.enum(['add', 'subtract', 'multiply', 'divide']),
  }),
  async execute({ a, b, op }) {
    const ops = { add: a + b, subtract: a - b, multiply: a * b, divide: a / b };
    return ops[op];
  },
});

researcher.addTool(calculator);
```

## Listening to Lifecycle Events

Every agent, task, and crew emits typed events you can subscribe to:

```typescript
crew.on('crew:task:start', (crewId, taskId, agentId) => {
  console.log(`[${crewId}] Starting task "${taskId}" on agent "${agentId}"`);
});

crew.on('crew:task:complete', (crewId, taskId, result) => {
  console.log(`[${crewId}] Task "${taskId}" completed: ${result.output}`);
});

crew.on('crew:complete', (crewId, result) => {
  console.log(`[${crewId}] All tasks done in ${result.duration}ms`);
});
```

## Next Steps

- **[API Reference](./api-reference.md)** — Full documentation of all classes and interfaces
- **[Examples](../examples/)** — More complete examples including research crews and chat agents
- **[Core Concepts](../README.md#core-concepts)** — Deep dive into Agent, Task, Crew, and ExecutionEngine

---

> **Tip:** Crewspace is fully type-safe. Your IDE will autocomplete agent configs, task options, and event names. Let TypeScript guide you!
