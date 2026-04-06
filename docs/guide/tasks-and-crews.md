# Tasks & Crews

Tasks and crews work together to orchestrate multi-agent workflows with dependency resolution.

## Defining Tasks

A task is a unit of work with a description, expected output, and optional dependencies:

```typescript
import { Task } from '@crewspace/core';

const researchTask = new Task({
  id: 'research',
  description: 'Research the latest AI frameworks',
  expectedOutput: 'A comprehensive summary report',
});

researchTask.assignAgent('researcher');
```

## Task Configuration

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | `string` | ✅ | Unique identifier |
| `description` | `string` | ✅ | What the task should accomplish |
| `expectedOutput` | `string` | ❌ | Description of expected result |
| `dependencies` | `string[]` | ❌ | IDs of tasks that must complete first |
| `priority` | `number` | ❌ | Execution priority (higher = sooner) |
| `timeout` | `number` | ❌ | Timeout in milliseconds |
| `maxRetries` | `number` | ❌ | Number of retry attempts on failure |

## Task Status Machine

```
PENDING → RUNNING → COMPLETED
                  → FAILED
                  → CANCELLED
```

## Building a Crew

A crew composes agents and tasks into an executable workflow:

```typescript
import { Crew } from '@crewspace/core';

const crew = new Crew({
  id: 'content-team',
  agents: [researcher, writer, editor],
  tasks: [
    { id: 'research', description: 'Research topics', agentId: 'researcher' },
    { id: 'write', description: 'Write article', agentId: 'writer', dependencies: ['research'] },
    { id: 'edit', description: 'Edit for quality', agentId: 'editor', dependencies: ['write'] },
  ],
});

const result = await crew.run();
```

## Dependency Resolution

Crewspace automatically resolves task dependencies using topological sort. Tasks execute in the correct order, and results from completed tasks are passed forward as context to dependent tasks.

## Crew Events

```typescript
crew.on('crew:task:start', (crewId, taskId, agentId) => {
  console.log(`Starting ${taskId}`);
});

crew.on('crew:task:complete', (crewId, taskId, result) => {
  console.log(`Completed ${taskId}`);
});

crew.on('crew:complete', (crewId, result) => {
  console.log(`All done in ${result.duration}ms`);
});
```
