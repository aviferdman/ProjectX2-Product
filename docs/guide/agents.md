# Agents

Agents are the core building blocks in Crewspace. Each agent represents a specialized AI persona that can execute tasks using an LLM provider and optional tools.

## Creating an Agent

```typescript
import { Agent } from '@crewspace/core';

const analyst = new Agent({
  id: 'analyst',
  role: 'Data Analyst',
  goal: 'Analyze data and produce insights',
  backstory: 'You are an experienced data analyst specializing in trends.',
});
```

## Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | `string` | ✅ | Unique identifier for the agent |
| `role` | `string` | ✅ | The agent's role description |
| `goal` | `string` | ✅ | What the agent aims to achieve |
| `backstory` | `string` | ❌ | Background context for the agent |

## Connecting an LLM Provider

Agents need an LLM provider to generate responses:

```typescript
import { createOpenAIProvider } from '@crewspace/core';

const llm = createOpenAIProvider({
  modelId: 'gpt-4o',
  apiKey: process.env.OPENAI_API_KEY!,
});

analyst.setLLMProvider(llm);
```

## Adding Tools

Give agents capabilities with the tool system:

```typescript
import { defineTool } from '@crewspace/core';
import { z } from 'zod';

const searchTool = defineTool({
  name: 'search',
  description: 'Search for information',
  schema: z.object({ query: z.string() }),
  async execute({ query }) {
    // implementation
    return `Results for: ${query}`;
  },
});

analyst.addTool(searchTool);
```

## Lifecycle Events

Agents emit typed events you can subscribe to:

- `agent:start` — Agent begins executing a task
- `agent:complete` — Agent finishes a task successfully
- `agent:error` — Agent encounters an error during execution

## Status Transitions

```
IDLE → EXECUTING → IDLE (success)
                 → ERROR (failure)
```
