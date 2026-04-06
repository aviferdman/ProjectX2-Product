# Core Concepts

Crewspace is built around four fundamental primitives that compose into powerful multi-agent workflows.

## Agent

An **Agent** is a specialized AI persona with a role, goal, backstory, optional tools, and an LLM provider. Agents emit lifecycle events (`agent:start`, `agent:complete`, `agent:error`) and manage their own status transitions.

```
IDLE → EXECUTING → IDLE | ERROR
```

```typescript
import { Agent } from '@crewspace/core';

const researcher = new Agent({
  id: 'researcher',
  role: 'Research Analyst',
  goal: 'Find and summarize relevant information',
  backstory: 'You are an expert researcher with deep analytical skills.',
});
```

## Task

A **Task** is a unit of work with a description, expected output, priority, timeout, retries, and dependencies on other tasks. Tasks follow a strict status machine:

```
PENDING → RUNNING → COMPLETED | FAILED | CANCELLED
```

Tasks can declare dependencies on other tasks. Crewspace resolves these into a topological execution order automatically.

## Crew

A **Crew** composes multiple agents and an ordered list of tasks. On `crew.run()`, the crew:

1. Resolves the task dependency graph via topological sort
2. Feeds each task to its assigned agent
3. Threads task results forward as context

```typescript
import { Crew } from '@crewspace/core';

const crew = new Crew({
  id: 'research-team',
  agents: [researcher, writer],
  tasks: [
    { id: 'research', description: 'Research AI trends', agentId: 'researcher' },
    { id: 'report', description: 'Write a summary', agentId: 'writer', dependencies: ['research'] },
  ],
});
```

## ExecutionEngine

The **ExecutionEngine** provides lower-level orchestration with support for:

- `SEQUENTIAL` or `PARALLEL` execution strategies
- Configurable concurrency limits
- Global timeouts
- `fail-fast` or `continue` error policies
- Before/after/error hooks

Use the `ExecutionEngine` when you need fine-grained control beyond what `Crew` provides.
