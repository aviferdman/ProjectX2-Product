# Tool System

Crewspace provides a rich tool system that lets agents interact with external services, files, and APIs.

## Defining Tools

### With `defineTool` (Zod Schema)

The recommended way to create tools with full type safety:

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
```

### With `createTool` (JSON Schema)

For JSON Schema-based definitions:

```typescript
import { createTool } from '@crewspace/core';

const tool = createTool({
  name: 'lookup',
  description: 'Look up a value',
  inputSchema: {
    type: 'object',
    properties: { key: { type: 'string' } },
    required: ['key'],
  },
  async execute({ key }) {
    return `Value for ${key}`;
  },
});
```

### With `@tool` Decorator

For class-based tools:

```typescript
import { tool } from '@crewspace/core';

class MyTools {
  @tool({ name: 'greet', description: 'Greet someone' })
  async greet(name: string): Promise<string> {
    return `Hello, ${name}!`;
  }
}
```

## Built-in Tools

Crewspace ships with built-in tool factories:

### File Tools

```typescript
import { createFileTools } from '@crewspace/core';

const { readFile, writeFile, listFiles } = createFileTools();
agent.addTool(readFile);
```

### Web Tools

```typescript
import { createWebTools } from '@crewspace/core';

const { httpGet, httpPost } = createWebTools();
agent.addTool(httpGet);
```

## Tool Registry

Manage collections of tools:

```typescript
import { ToolRegistry } from '@crewspace/core';

const registry = new ToolRegistry();
registry.register(calculator);
registry.register(readFile);

const tool = registry.get('calculator');
const all = registry.list();
```

## Tool Executor & Permissions

Execute tools with permission checks:

```typescript
import { ToolExecutor, PermissionManager } from '@crewspace/core';

const permissions = new PermissionManager();
permissions.grant('calculator', 'agent:researcher');

const executor = new ToolExecutor(registry, permissions);
const result = await executor.execute('calculator', { a: 1, b: 2, op: 'add' }, 'agent:researcher');
```
