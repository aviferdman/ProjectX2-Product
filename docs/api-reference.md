# API Reference — @crewspace/core

Complete reference for every public class, interface, enum, and function in the Crewspace framework.

> **Version:** 0.1.0 · **Module:** `@crewspace/core`

---

## Table of Contents

- [Core Classes](#core-classes)
  - [Agent](#agent)
  - [Crew](#crew)
  - [Task](#task)
  - [ExecutionEngine](#executionengine)
- [LLM Providers](#llm-providers)
  - [LLMProvider (interface)](#llmprovider)
  - [StreamingLLMProvider (interface)](#streamingllmprovider)
  - [BaseLLMProvider](#basellmprovider)
  - [OpenAIProvider](#openaiprovider)
  - [AnthropicProvider](#anthropicprovider)
  - [OllamaProvider](#ollamaprovider)
  - [RetryLLMProvider](#retryllmprovider)
  - [FallbackLLMProvider](#fallbackllmprovider)
  - [UsageTrackingProvider](#usagetrackingprovider)
  - [LLMProviderRegistry](#llmproviderregistry)
  - [TokenUsageTracker](#tokenusagetracker)
  - [ModelCatalog](#modelcatalog)
  - [CircuitBreaker](#circuitbreaker)
  - [DefaultLLMStreamResponse](#defaultllmstreamresponse)
- [Tool System](#tool-system)
  - [Tool (interface)](#tool)
  - [ToolRegistry](#toolregistry)
  - [ToolExecutor](#toolexecutor)
  - [PermissionManager](#permissionmanager)
  - [defineTool](#definetool)
  - [createTool](#createtool)
  - [composeTool](#composetool)
  - [tool (decorator)](#tool-decorator)
- [Built-in Tools](#built-in-tools)
  - [File Tools](#file-tools)
  - [Web Tools](#web-tools)
- [Memory System](#memory-system)
  - [MemoryProvider (interface)](#memoryprovider)
  - [ShortTermMemory](#shorttermmemory)
  - [MemoryManager](#memorymanager)
- [Configuration Interfaces](#configuration-interfaces)
  - [AgentConfig](#agentconfig)
  - [CrewConfig](#crewconfig)
  - [CrewTask](#crewtask)
  - [TaskConfig](#taskconfig)
  - [ExecutionEngineConfig](#executionengineconfig)
  - [LLMProviderConfig](#llmproviderconfig)
  - [LLMRequestOptions](#llmrequestoptions)
  - [MemoryConfig](#memoryconfig)
  - [ToolPermissionPolicy](#toolpermissionpolicy)
- [Data Types](#data-types)
  - [TaskInput](#taskinput)
  - [TaskResult](#taskresult)
  - [CrewRunResult](#crewrunresult)
  - [EngineRunResult](#enginerunresult)
  - [LLMMessage](#llmmessage)
  - [LLMResponse](#llmresponse)
  - [LLMStreamChunk](#llmstreamchunk)
  - [LLMStreamResponse](#llmstreamresponse)
  - [LLMModelInfo](#llmmodelinfo)
  - [TokenUsage](#tokenusage)
  - [ToolResult](#toolresult)
  - [ToolParameterSchema](#toolparameterschema)
  - [MemoryEntry](#memoryentry)
  - [MemoryQueryOptions](#memoryqueryoptions)
  - [MemoryQueryResult](#memoryqueryresult)
  - [MemoryRetentionPolicy](#memoryretentionpolicy)
- [Enums](#enums)
  - [AgentStatus](#agentstatus)
  - [CrewStatus](#crewstatus)
  - [TaskStatus](#taskstatus)
  - [TaskPriority](#taskpriority)
  - [EngineStatus](#enginestatus)
  - [ExecutionStrategy](#executionstrategy)
  - [LLMRole](#llmrole)
  - [ToolPermission](#toolpermission)
  - [ToolCategory](#toolcategory)
  - [MemoryNamespace](#memorynamespace)
  - [MemoryRole](#memoryrole)
  - [CircuitState](#circuitstate)
- [Event Maps](#event-maps)
  - [AgentEventMap](#agenteventmap)
  - [CrewEventMap](#creweventmap)
  - [TaskEventMap](#taskeventmap)
  - [EngineEventMap](#engineeventmap)
  - [ToolEventMap](#tooleventmap)
  - [MemoryEventMap](#memoryeventmap)
- [Error Classes](#error-classes)
  - [Agent Errors](#agent-errors)
  - [Crew Errors](#crew-errors)
  - [Task Errors](#task-errors)
  - [Engine Errors](#engine-errors)
  - [LLM Errors](#llm-errors)
  - [Tool Errors](#tool-errors)
  - [Memory Errors](#memory-errors)
- [Utility Functions](#utility-functions)
  - [Task Utilities](#task-utilities)
  - [LLM Utilities](#llm-utilities)
  - [Validation Functions](#validation-functions)

---

## Core Classes

### Agent

An AI agent with a persona, tools, and an injectable LLM provider. Agents execute tasks by generating LLM prompts based on their role, goal, backstory, and available tools.

```typescript
import { Agent } from '@crewspace/core';

const agent = new Agent({
  id: 'researcher',
  role: 'Senior Research Analyst',
  goal: 'Find and summarize the latest AI papers',
  backstory: 'Expert in machine learning with 10 years of experience',
  tools: [webSearch, readFile],
  maxIterations: 5,
});
```

#### Constructor

```typescript
new Agent(config: AgentConfig)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `config` | [`AgentConfig`](#agentconfig) | Agent configuration object |

**Throws:** [`AgentConfigError`](#agent-errors) if the configuration is invalid.

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier |
| `role` | `string` | Role description (e.g. "Research Analyst") |
| `goal` | `string` | Primary objective |
| `backstory` | `string` | Persona context (defaults to `""`) |
| `maxIterations` | `number` | Max LLM iterations per task (default: `10`) |
| `verbose` | `boolean` | Verbose logging flag (default: `false`) |
| `status` | [`AgentStatus`](#agentstatus) | Current lifecycle status (getter) |
| `tools` | `ReadonlyMap<string, Tool>` | Registered tools (getter) |
| `llmProvider` | `LLMProvider \| undefined` | Current LLM provider (getter) |

#### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `setLLMProvider` | `(provider: LLMProvider): void` | Inject or swap the LLM provider |
| `addTool` | `(tool: Tool): void` | Register a tool for use during execution |
| `removeTool` | `(name: string): boolean` | Remove a tool by name |
| `hasTool` | `(name: string): boolean` | Check if a tool is registered |
| `execute` | `(taskInput: TaskInput): Promise<TaskResult>` | Execute a task and return the result |
| `on` | `<E>(event: E, listener): this` | Subscribe to an event |
| `off` | `<E>(event: E, listener): this` | Unsubscribe from an event |
| `once` | `<E>(event: E, listener): this` | Subscribe once to an event |

#### Events

See [`AgentEventMap`](#agenteventmap) for all events emitted by agents.

---

### Crew

A crew of agents that collaborate on a workflow of tasks. The crew manages dependency resolution, execution ordering, and result propagation between tasks.

```typescript
import { Agent, Crew } from '@crewspace/core';

const researcher = new Agent({ id: 'researcher', role: 'Analyst', goal: 'Find insights' });
const writer = new Agent({ id: 'writer', role: 'Writer', goal: 'Write summaries' });

const crew = new Crew({
  id: 'research-crew',
  agents: [researcher, writer],
  tasks: [
    { id: 'research', description: 'Find papers', agentId: 'researcher' },
    { id: 'write', description: 'Write summary', agentId: 'writer', dependencies: ['research'] },
  ],
});

const result = await crew.run();
```

#### Constructor

```typescript
new Crew(config: CrewConfig)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `config` | [`CrewConfig`](#crewconfig) | Crew configuration object |

**Throws:** [`CrewConfigError`](#crew-errors) if the configuration is invalid or contains circular dependencies.

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier |
| `name` | `string` | Display name |
| `verbose` | `boolean` | Verbose logging flag |
| `status` | [`CrewStatus`](#crewstatus) | Current lifecycle status (getter) |
| `agents` | `ReadonlyMap<string, Agent>` | Registered agents (getter) |
| `tasks` | `readonly CrewTask[]` | Task definitions (getter) |

#### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `run` | `(): Promise<CrewRunResult>` | Execute all tasks in dependency order |
| `reset` | `(): void` | Reset crew to idle state |
| `on` | `<E>(event: E, listener): this` | Subscribe to an event |
| `off` | `<E>(event: E, listener): this` | Unsubscribe from an event |
| `once` | `<E>(event: E, listener): this` | Subscribe once to an event |

#### Events

See [`CrewEventMap`](#creweventmap) for all events emitted by crews.

---

### Task

A standalone, reusable task with lifecycle management and event emission. Tasks can be used independently or composed into Crew workflows.

```typescript
import { Task, TaskPriority } from '@crewspace/core';

const task = new Task({
  id: 'research',
  description: 'Find the latest AI papers',
  expectedOutput: 'A list of 5 papers with summaries',
  agentId: 'researcher',
  priority: TaskPriority.HIGH,
  timeout: 30000,
  retries: 2,
});
```

#### Constructor

```typescript
new Task(config: TaskConfig)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `config` | [`TaskConfig`](#taskconfig) | Task configuration object |

**Throws:** [`TaskConfigError`](#task-errors) if the configuration is invalid.

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier |
| `description` | `string` | Task description |
| `expectedOutput` | `string` | Expected output format (defaults to `""`) |
| `timeout` | `number` | Timeout in ms (`0` = no limit) |
| `retries` | `number` | Max retry count (default: `0`) |
| `priority` | [`TaskPriority`](#taskpriority) | Scheduling priority |
| `status` | [`TaskStatus`](#taskstatus) | Current lifecycle status (getter) |
| `agentId` | `string \| undefined` | Assigned agent ID (getter) |
| `context` | `Readonly<Record<string, unknown>>` | Static context data (getter) |
| `dependencies` | `readonly string[]` | Dependency task IDs (getter) |
| `metadata` | `Readonly<Record<string, unknown>>` | User-defined metadata (getter) |
| `result` | `TaskResult \| undefined` | Execution result (getter) |
| `error` | `Error \| undefined` | Execution error (getter) |
| `isAssigned` | `boolean` | Whether an agent is assigned (getter) |

#### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `assignAgent` | `(agentId: string): void` | Assign an agent to execute this task |
| `setStatus` | `(status: TaskStatus): void` | Update the task status |
| `complete` | `(result: TaskResult): void` | Mark as completed with result |
| `fail` | `(error: Error): void` | Mark as failed with error |
| `cancel` | `(): void` | Cancel the task |
| `reset` | `(): void` | Reset to pending state |
| `toTaskInput` | `(): TaskInput` | Convert to agent execution input |
| `toCrewTask` | `(): CrewTask` | Convert to crew task definition |
| `on` | `<E>(event: E, listener): this` | Subscribe to an event |
| `off` | `<E>(event: E, listener): this` | Unsubscribe from an event |
| `once` | `<E>(event: E, listener): this` | Subscribe once to an event |

#### Status Transitions

```
PENDING → RUNNING → COMPLETED
                  → FAILED → PENDING (reset)
                  → CANCELLED → PENDING (reset)
PENDING → CANCELLED → PENDING (reset)
```

#### Events

See [`TaskEventMap`](#taskeventmap) for all events emitted by tasks.

---

### ExecutionEngine

An advanced execution engine that orchestrates task workflows with parallel execution, retries, timeouts, middleware hooks, and context propagation.

```typescript
import { ExecutionEngine, ExecutionStrategy } from '@crewspace/core';

const engine = new ExecutionEngine({
  id: 'pipeline',
  strategy: ExecutionStrategy.PARALLEL,
  maxConcurrency: 3,
  globalTimeout: 60000,
  taskErrorPolicy: 'continue',
});

engine.addAgent(researcher);
engine.addAgent(writer);
engine.addTask(researchTask);
engine.addTask(writeTask);

engine.beforeTask((task, agent) => {
  console.log(`Starting ${task.id} on ${agent.id}`);
});

const result = await engine.run();
```

#### Constructor

```typescript
new ExecutionEngine(config: ExecutionEngineConfig)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `config` | [`ExecutionEngineConfig`](#executionengineconfig) | Engine configuration object |

**Throws:** [`EngineConfigError`](#engine-errors) if the configuration is invalid.

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier |
| `strategy` | [`ExecutionStrategy`](#executionstrategy) | Execution strategy |
| `maxConcurrency` | `number` | Max parallel tasks (default: `Infinity`) |
| `globalTimeout` | `number` | Global timeout in ms (default: `0` = no limit) |
| `taskErrorPolicy` | `TaskErrorPolicy` | `'fail-fast'` or `'continue'` |
| `verbose` | `boolean` | Verbose logging flag |
| `status` | [`EngineStatus`](#enginestatus) | Current lifecycle status (getter) |
| `tasks` | `ReadonlyMap<string, Task>` | Registered tasks (getter) |
| `agents` | `ReadonlyMap<string, Agent>` | Registered agents (getter) |
| `contextManager` | `TaskContextManager` | Context propagation manager (getter) |

#### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `addTask` | `(task: Task): this` | Register a task (chainable) |
| `addAgent` | `(agent: Agent): this` | Register an agent (chainable) |
| `removeTask` | `(taskId: string): boolean` | Remove a task by ID |
| `removeAgent` | `(agentId: string): boolean` | Remove an agent by ID |
| `beforeTask` | `(hook: BeforeTaskHook): this` | Add pre-execution middleware |
| `afterTask` | `(hook: AfterTaskHook): this` | Add post-execution middleware |
| `onTaskError` | `(hook: OnTaskErrorHook): this` | Add error-handling middleware |
| `run` | `(): Promise<EngineRunResult>` | Execute the workflow |
| `cancel` | `(): void` | Cancel execution |
| `reset` | `(): void` | Reset to idle state |
| `on` | `<E>(event: E, listener): this` | Subscribe to an event |
| `off` | `<E>(event: E, listener): this` | Unsubscribe from an event |
| `once` | `<E>(event: E, listener): this` | Subscribe once to an event |

#### Hook Types

```typescript
type BeforeTaskHook = (task: Task, agent: Agent) => Promise<void> | void;
type AfterTaskHook = (task: Task, agent: Agent, result: TaskResult) => Promise<void> | void;
type OnTaskErrorHook = (task: Task, error: Error) => Promise<void> | void;
```

#### Events

See [`EngineEventMap`](#engineeventmap) for all events emitted by the engine.

---

## LLM Providers

### LLMProvider

Abstract interface for all LLM backends. Implement this to integrate any model provider.

```typescript
interface LLMProvider {
  readonly name: string;
  generateText(messages: readonly LLMMessage[], options?: LLMRequestOptions): Promise<LLMResponse>;
}
```

### StreamingLLMProvider

Extends `LLMProvider` with streaming support via `generateStream()`.

```typescript
interface StreamingLLMProvider extends LLMProvider {
  generateStream(
    messages: readonly LLMMessage[],
    options?: LLMRequestOptions,
  ): Promise<LLMStreamResponse>;
}
```

Use `isStreamingProvider(provider)` to check streaming support at runtime.

### BaseLLMProvider

Abstract base class for building custom LLM providers. Handles configuration, option merging, and message validation.

```typescript
new BaseLLMProvider(config: LLMProviderConfig)
```

Override these protected methods:
- `_doGenerateText(messages, options): Promise<LLMResponse>`
- `_doGenerateStream(messages, options): Promise<LLMStreamResponse>`

### OpenAIProvider

Provider for OpenAI models (GPT-4o, GPT-4, etc.).

```typescript
import { createOpenAIProvider } from '@crewspace/core';

const provider = createOpenAIProvider({
  modelId: 'gpt-4o',
  apiKey: process.env.OPENAI_API_KEY!,
});
```

### AnthropicProvider

Provider for Anthropic models (Claude).

```typescript
import { createAnthropicProvider } from '@crewspace/core';

const provider = createAnthropicProvider({
  modelId: 'claude-sonnet-4-20250514',
  apiKey: process.env.ANTHROPIC_API_KEY!,
});
```

### OllamaProvider

Provider for locally-hosted Ollama models.

```typescript
import { createOllamaProvider } from '@crewspace/core';

const provider = createOllamaProvider({
  modelId: 'llama3',
  baseUrl: 'http://localhost:11434', // default
});
```

### RetryLLMProvider

Wraps any `LLMProvider` with automatic retry logic, exponential backoff, and optional circuit breaker.

```typescript
import { createRetryProvider } from '@crewspace/core';

const resilient = createRetryProvider(baseProvider, {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  circuitBreaker: { failureThreshold: 5, resetTimeout: 60000 },
  onRetry: (context) => console.log(`Retry #${context.attempt}`),
});
```

#### RetryLLMProviderOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxRetries` | `number` | `3` | Maximum retry attempts |
| `baseDelay` | `number` | `1000` | Base delay in ms |
| `maxDelay` | `number` | `30000` | Maximum delay in ms |
| `backoffMultiplier` | `number` | `2` | Exponential backoff factor |
| `jitter` | `boolean` | `true` | Add random jitter to delays |
| `retryableErrors` | `string[]` | — | Error types to retry |
| `circuitBreaker` | `CircuitBreakerConfig` | — | Circuit breaker settings |
| `onRetry` | `OnRetryCallback` | — | Called on each retry |

### FallbackLLMProvider

Chains multiple LLM providers with automatic failover.

```typescript
import { createFallbackProvider } from '@crewspace/core';

const provider = createFallbackProvider(
  [primaryProvider, backupProvider, localProvider],
  { onFallback: (ctx) => console.log(`Falling back to ${ctx.provider.name}`) },
);
```

#### FallbackLLMProviderOptions

| Option | Type | Description |
|--------|------|-------------|
| `onFallback` | `OnFallbackCallback` | Called when a fallback is triggered |

### UsageTrackingProvider

Wraps any provider to track token usage and cost.

```typescript
import { createUsageTrackingProvider } from '@crewspace/core';

const { provider, tracker } = createUsageTrackingProvider(baseProvider, {
  modelId: 'gpt-4o',
});

// After usage:
const report = tracker.getReport();
console.log(`Total cost: $${report.totalCost}`);
```

### LLMProviderRegistry

Global registry for creating LLM providers by name from configuration.

```typescript
import { LLMProviderRegistry } from '@crewspace/core';

const registry = new LLMProviderRegistry();
registry.register('openai', (config) => new OpenAIProvider(config));
const provider = registry.create({ provider: 'openai', modelId: 'gpt-4o', apiKey: '...' });
```

| Method | Signature | Description |
|--------|-----------|-------------|
| `register` | `(name: string, factory: LLMProviderFactory): void` | Register a factory |
| `override` | `(name: string, factory: LLMProviderFactory): void` | Override existing factory |
| `unregister` | `(name: string): boolean` | Remove a factory |
| `has` | `(name: string): boolean` | Check if factory exists |
| `listProviders` | `(): string[]` | List registered provider names |
| `create` | `(config: LLMProviderConfig): LLMProvider` | Create a provider |
| `createFromEnv` | `(provider, modelId): LLMProvider` | Create from env variables |
| `clear` | `(): void` | Remove all registrations |

### TokenUsageTracker

Records and reports token usage across LLM calls.

| Method | Signature | Description |
|--------|-----------|-------------|
| `record` | `(input: UsageRecordInput): void` | Record a usage event |
| `getRecords` | `(): UsageRecord[]` | Get all records |
| `getRecordsByModel` | `(modelId: string): UsageRecord[]` | Filter by model |
| `getRecordsByProvider` | `(provider: string): UsageRecord[]` | Filter by provider |
| `recordCount` | `number` | Total record count (getter) |
| `getTotalTokens` | `(): number` | Sum all tokens |
| `getTotalCost` | `(): number` | Sum all costs |
| `getReport` | `(): UsageReport` | Full usage report |
| `reset` | `(): void` | Clear all records |

### ModelCatalog

Static catalog of known LLM models with pricing and capability metadata.

| Method | Signature | Description |
|--------|-----------|-------------|
| `get` | `(modelId: string): LLMModelInfo \| undefined` | Look up a model |
| `getByProvider` | `(provider: string): LLMModelInfo[]` | Get all models for a provider |
| `listModelIds` | `(): string[]` | List all model IDs |
| `listProviders` | `(): string[]` | List all providers |
| `has` | `(modelId: string): boolean` | Check if model exists |
| `size` | `number` | Total model count |
| `estimateCost` | `(modelId, tokens): number` | Estimate cost |

### CircuitBreaker

Circuit breaker pattern implementation for fault tolerance.

```typescript
import { CircuitBreaker, CircuitState } from '@crewspace/core';

const breaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000,
  halfOpenMaxAttempts: 1,
});
```

| Method | Signature | Description |
|--------|-----------|-------------|
| `state` | `CircuitState` | Current state (getter) |
| `isAllowed` | `(): boolean` | Whether requests are allowed |
| `recordSuccess` | `(): void` | Record a successful call |
| `recordFailure` | `(): void` | Record a failed call |
| `reset` | `(): void` | Reset to closed state |
| `snapshot` | `(): CircuitBreakerSnapshot` | Get state snapshot |

### DefaultLLMStreamResponse

Default implementation of [`LLMStreamResponse`](#llmstreamresponse) that wraps an `AsyncIterable<LLMStreamChunk>`.

```typescript
new DefaultLLMStreamResponse(provider: string, source: AsyncIterable<LLMStreamChunk>)
```

| Method | Signature | Description |
|--------|-----------|-------------|
| `[Symbol.asyncIterator]` | `(): AsyncIterator<LLMStreamChunk>` | Iterate over chunks |
| `toResponse` | `(): Promise<LLMResponse>` | Collect into a single response |

---

## Tool System

### Tool

Interface for agent capabilities — file I/O, web requests, or custom operations.

```typescript
interface Tool {
  readonly name: string;
  readonly description: string;
  readonly category?: ToolCategory;
  readonly permissions?: readonly ToolPermission[];
  readonly inputSchema?: ToolParameterSchema;
  readonly inputZodSchema?: ZodType;
  readonly outputSchema?: ToolParameterSchema;
  readonly timeout?: number;
  execute(input: unknown): Promise<unknown>;
}
```

### ToolRegistry

Thread-safe registry for managing tools by name.

```typescript
import { ToolRegistry } from '@crewspace/core';

const registry = new ToolRegistry();
registry.register(readFileTool);
const tool = registry.get('readFile');
```

| Method | Signature | Description |
|--------|-----------|-------------|
| `register` | `(tool: Tool): void` | Register a tool |
| `unregister` | `(name: string): boolean` | Remove by name |
| `get` | `(name: string): Tool \| undefined` | Get by name |
| `find` | `(name: string): Tool` | Get by name or throw |
| `has` | `(name: string): boolean` | Check existence |
| `getAll` | `(): Tool[]` | List all tools |
| `getNames` | `(): string[]` | List all names |
| `getByCategory` | `(category: ToolCategory): Tool[]` | Filter by category |
| `getByPermission` | `(permission: ToolPermission): Tool[]` | Filter by permission |
| `clear` | `(): void` | Remove all tools |
| `size` | `number` | Tool count (getter) |
| `[Symbol.iterator]` | `(): Iterator<Tool>` | Iterate over tools |

**Static:** `ToolRegistry.from(tools: Tool[]): ToolRegistry`

### ToolExecutor

Executes tools with permission checking, input validation, timeout handling, and event emission.

```typescript
import { ToolExecutor, PermissionManager, ALLOW_ALL_POLICY } from '@crewspace/core';

const executor = new ToolExecutor(new PermissionManager(ALLOW_ALL_POLICY));
const result = await executor.execute(myTool, { path: '/data.txt' });
```

| Method | Signature | Description |
|--------|-----------|-------------|
| `execute` | `(tool: Tool, input: unknown): Promise<ToolResult>` | Execute a tool |
| `on` | `(event, listener): void` | Subscribe to tool events |
| `off` | `(event, listener): void` | Unsubscribe |

### PermissionManager

Evaluates tool permissions against a security policy.

```typescript
import { PermissionManager, ALLOW_ALL_POLICY, DENY_ALL_POLICY } from '@crewspace/core';

const pm = new PermissionManager({
  defaultAction: 'deny',
  allowed: [ToolPermission.FILE_READ, ToolPermission.NETWORK],
});

pm.isPermitted(ToolPermission.FILE_READ);   // true
pm.assertPermitted('myTool', [ToolPermission.SHELL_EXEC]); // throws
```

| Method | Signature | Description |
|--------|-----------|-------------|
| `isPermitted` | `(permission: ToolPermission): boolean` | Check a single permission |
| `getDeniedPermissions` | `(permissions: ToolPermission[]): ToolPermission[]` | Get denied permissions |
| `assertPermitted` | `(toolName, permissions): void` | Assert or throw |
| `checkTool` | `(tool: Tool): boolean` | Check all tool permissions |

**Constants:** `ALLOW_ALL_POLICY`, `DENY_ALL_POLICY`

### defineTool

Type-safe tool factory using Zod schemas for input validation.

```typescript
import { defineTool } from '@crewspace/core';
import { z } from 'zod';

const calculator = defineTool({
  name: 'calculator',
  description: 'Perform arithmetic',
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

#### DefineToolOptions

| Option | Type | Description |
|--------|------|-------------|
| `name` | `string` | Tool name |
| `description` | `string` | Tool description |
| `schema` | `ZodType<TInput>` | Zod input schema (auto-converted to JSON Schema) |
| `execute` | `(input: TInput) => Promise<TOutput>` | Execution function |
| `category` | `ToolCategory` | Optional category |
| `permissions` | `ToolPermission[]` | Optional required permissions |
| `timeout` | `number` | Optional timeout in ms |

### createTool

Lower-level tool factory using JSON Schema (no Zod dependency).

```typescript
import { createTool } from '@crewspace/core';

const tool = createTool({
  name: 'greet',
  description: 'Greet a user',
  inputSchema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
  execute: async (input) => `Hello, ${(input as { name: string }).name}!`,
});
```

### composeTool

Create composite tools that chain multiple tools together.

```typescript
import { composeTool } from '@crewspace/core';

const pipeline = composeTool({
  name: 'fetch-and-parse',
  description: 'Fetch URL then parse HTML',
  schema: z.object({ url: z.string().url() }),
  async execute(input, context) {
    const html = await context.executeTool('fetchUrl', { url: input.url });
    return context.executeTool('parseHtml', { html });
  },
});
```

**Max composition depth:** `DEFAULT_MAX_COMPOSITION_DEPTH = 10`

### tool (decorator)

TypeScript method decorator for defining tools on class instances.

```typescript
import { tool, collectTools, hasTools } from '@crewspace/core';

class MyTools {
  @tool({ name: 'greet', description: 'Greet someone' })
  async greet(input: { name: string }) {
    return `Hello, ${input.name}!`;
  }
}

const instance = new MyTools();
const tools = collectTools(instance); // Tool[]
```

---

## Built-in Tools

### File Tools

Pre-built tools for file system operations.

```typescript
import { createFileTools } from '@crewspace/core';

const { readFile, writeFile, listFiles } = createFileTools({ basePath: '/workspace' });
```

#### createReadFileTool

Reads file contents from disk.

| Input Field | Type | Description |
|-------------|------|-------------|
| `path` | `string` | File path (relative to basePath) |
| `encoding` | `string` | Encoding (default: `'utf-8'`) |

**Constants:** `MAX_READ_SIZE = 10 MB`

#### createWriteFileTool

Writes content to a file.

| Input Field | Type | Description |
|-------------|------|-------------|
| `path` | `string` | File path (relative to basePath) |
| `content` | `string` | Content to write |

**Constants:** `MAX_WRITE_SIZE = 10 MB`

#### createListFilesTool

Lists files in a directory.

| Input Field | Type | Description |
|-------------|------|-------------|
| `path` | `string` | Directory path |
| `pattern` | `string` | Optional glob pattern |
| `maxEntries` | `number` | Max results (default: `500`) |

**Constants:** `DEFAULT_MAX_ENTRIES = 500`, `HARD_MAX_ENTRIES = 10,000`

### Web Tools

Pre-built tools for web operations.

```typescript
import { createWebTools } from '@crewspace/core';

const { fetchUrl, parseHtml, webSearch } = createWebTools();
```

#### createFetchUrlTool

Fetches content from a URL.

| Input Field | Type | Description |
|-------------|------|-------------|
| `url` | `string` | URL to fetch |
| `headers` | `Record<string, string>` | Optional HTTP headers |

**Constants:** `DEFAULT_TIMEOUT_MS`, `DEFAULT_USER_AGENT`, `MAX_RESPONSE_SIZE`

#### createParseHtmlTool

Parses HTML content and extracts structured data.

| Input Field | Type | Description |
|-------------|------|-------------|
| `html` | `string` | HTML content to parse |

**Utility functions:** `stripTags()`, `extractTitle()`, `extractMetadata()`, `extractLinks()`, `decodeHtmlEntities()`

#### createWebSearchTool

Performs web searches.

| Input Field | Type | Description |
|-------------|------|-------------|
| `query` | `string` | Search query |
| `maxResults` | `number` | Max results (default: `10`) |

**Constants:** `DEFAULT_MAX_RESULTS`, `HARD_MAX_RESULTS`

---

## Memory System

### MemoryProvider

Interface for all memory storage backends.

```typescript
interface MemoryProvider {
  readonly name: string;
  add(entry: MemoryEntry): Promise<MemoryEntry>;
  get(id: string): Promise<MemoryEntry | undefined>;
  query(options?: MemoryQueryOptions): Promise<MemoryQueryResult>;
  search(text: string, options?: MemoryQueryOptions): Promise<MemoryQueryResult>;
  delete(id: string): Promise<boolean>;
  clear(namespace?: MemoryNamespace): Promise<number>;
  count(namespace?: MemoryNamespace): Promise<number>;
}
```

### ShortTermMemory

In-memory implementation of `MemoryProvider` with automatic eviction policies.

```typescript
import { ShortTermMemory, MemoryNamespace } from '@crewspace/core';

const memory = new ShortTermMemory({
  defaultNamespace: MemoryNamespace.AGENT,
  retention: { maxEntries: 100, maxAge: 3600000 },
});

await memory.add(entry);
const results = await memory.search('AI papers', { limit: 5 });
```

Implements all `MemoryProvider` methods plus:
- Event emission via `on()`/`off()` (see [`MemoryEventMap`](#memoryeventmap))
- Automatic eviction of oldest entries when `maxEntries` is reached
- Automatic eviction of expired entries based on `maxAge`

### MemoryManager

Higher-level memory management with multi-provider support.

```typescript
import { MemoryManager } from '@crewspace/core';

const manager = new MemoryManager(config);
```

---

## Configuration Interfaces

### AgentConfig

```typescript
interface AgentConfig {
  readonly id: string;              // Unique ID (alphanumeric, dashes, underscores)
  readonly role: string;            // Role description
  readonly goal: string;            // Primary goal
  readonly backstory?: string;      // Persona backstory
  readonly tools?: readonly Tool[]; // Initial tools
  readonly llmProvider?: LLMProvider; // LLM provider
  readonly maxIterations?: number;  // Max iterations (1–100, default: 10)
  readonly verbose?: boolean;       // Verbose logging (default: false)
}
```

### CrewConfig

```typescript
interface CrewConfig {
  readonly id: string;                     // Unique ID
  readonly name?: string;                  // Display name
  readonly agents: readonly Agent[];       // Agents (at least 1)
  readonly tasks: readonly CrewTask[];     // Tasks (at least 1)
  readonly verbose?: boolean;              // Verbose logging (default: false)
}
```

### CrewTask

```typescript
interface CrewTask {
  readonly id: string;                              // Unique task ID
  readonly description: string;                     // Task description
  readonly expectedOutput?: string;                 // Expected output format
  readonly agentId: string;                         // Assigned agent ID
  readonly context?: Readonly<Record<string, unknown>>; // Static context
  readonly dependencies?: readonly string[];        // Dependency task IDs
}
```

### TaskConfig

```typescript
interface TaskConfig {
  readonly id: string;                              // Unique ID
  readonly description: string;                     // Task description
  readonly expectedOutput?: string;                 // Expected output format
  readonly agentId?: string;                        // Assigned agent (or set later)
  readonly context?: Readonly<Record<string, unknown>>; // Static context
  readonly dependencies?: readonly string[];        // Dependency task IDs
  readonly timeout?: number;                        // Timeout ms (max: 600,000)
  readonly retries?: number;                        // Retry count (max: 10)
  readonly priority?: TaskPriority;                 // Priority (default: MEDIUM)
  readonly metadata?: Readonly<Record<string, unknown>>; // User metadata
}
```

### ExecutionEngineConfig

```typescript
interface ExecutionEngineConfig {
  readonly id: string;                                 // Unique ID
  readonly strategy?: ExecutionStrategy;               // SEQUENTIAL or PARALLEL
  readonly maxConcurrency?: number;                    // Max parallel tasks (1–100)
  readonly globalTimeout?: number;                     // Global timeout ms (max: 3,600,000)
  readonly taskErrorPolicy?: 'fail-fast' | 'continue'; // Error handling policy
  readonly verbose?: boolean;                          // Verbose logging
  readonly contextManager?: TaskContextManagerConfig;  // Context propagation config
}
```

### LLMProviderConfig

```typescript
interface LLMProviderConfig {
  readonly provider: string;            // Provider name ("openai", "anthropic", "ollama")
  readonly modelId: string;             // Model identifier
  readonly apiKey?: string;             // API key (optional for local providers)
  readonly baseUrl?: string;            // Custom API base URL
  readonly maxRetries?: number;         // Retry count (default: 3)
  readonly timeout?: number;            // Request timeout ms (default: 30000)
  readonly defaultOptions?: LLMRequestOptions; // Default generation options
}
```

### LLMRequestOptions

```typescript
interface LLMRequestOptions {
  readonly temperature?: number;          // Sampling temperature
  readonly maxTokens?: number;            // Max output tokens
  readonly stopSequences?: readonly string[]; // Stop sequences
  readonly signal?: AbortSignal;          // Abort signal for cancellation
}
```

### MemoryConfig

```typescript
interface MemoryConfig {
  readonly defaultNamespace?: MemoryNamespace;    // Default namespace
  readonly retention?: MemoryRetentionPolicy;     // Retention policy
}
```

### ToolPermissionPolicy

```typescript
interface ToolPermissionPolicy {
  readonly defaultAction: 'allow' | 'deny';       // Fallback action
  readonly allowed?: readonly ToolPermission[];    // Explicitly allowed
  readonly denied?: readonly ToolPermission[];     // Explicitly denied
}
```

---

## Data Types

### TaskInput

Input to an agent's `execute()` method.

```typescript
interface TaskInput {
  readonly description: string;
  readonly expectedOutput?: string;
  readonly context?: Readonly<Record<string, unknown>>;
}
```

### TaskResult

Result returned after an agent completes a task.

```typescript
interface TaskResult {
  readonly output: string;
  readonly agentId: string;
  readonly duration: number;         // ms
  readonly tokenUsage?: TokenUsage;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
```

### CrewRunResult

Result of a full crew run.

```typescript
interface CrewRunResult {
  readonly crewId: string;
  readonly taskResults: ReadonlyMap<string, TaskResult>;
  readonly duration: number;         // ms
  readonly success: boolean;
}
```

### EngineRunResult

Result of an execution engine run.

```typescript
interface EngineRunResult {
  readonly engineId: string;
  readonly taskResults: ReadonlyMap<string, TaskResult>;
  readonly duration: number;         // ms
  readonly success: boolean;
  readonly errors: ReadonlyMap<string, Error>;
}
```

### LLMMessage

A single message in an LLM conversation.

```typescript
interface LLMMessage {
  readonly role: LLMRole;
  readonly content: string;
  readonly name?: string;   // Tool-result messages: identifies the source tool
}
```

### LLMResponse

Response from an LLM generation call.

```typescript
interface LLMResponse {
  readonly content: string;
  readonly tokenUsage: TokenUsage;
  readonly finishReason: string;
}
```

### LLMStreamChunk

A single chunk emitted during streaming.

```typescript
interface LLMStreamChunk {
  readonly content: string;
  readonly finishReason?: string;  // Only on final chunk
  readonly tokenUsage?: TokenUsage; // Only on final chunk
}
```

### LLMStreamResponse

Async iterable of stream chunks with a convenience collector.

```typescript
interface LLMStreamResponse extends AsyncIterable<LLMStreamChunk> {
  toResponse(): Promise<LLMResponse>;
}
```

### LLMModelInfo

Static metadata about a specific LLM model.

```typescript
interface LLMModelInfo {
  readonly modelId: string;
  readonly provider: string;
  readonly displayName: string;
  readonly maxContextTokens: number;
  readonly maxOutputTokens: number;
  readonly supportsStreaming: boolean;
  readonly costPer1kInputTokens?: number;    // USD
  readonly costPer1kOutputTokens?: number;   // USD
}
```

### TokenUsage

Token usage statistics from an LLM call.

```typescript
interface TokenUsage {
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
}
```

### ToolResult

Result of a single tool execution.

```typescript
interface ToolResult {
  readonly success: boolean;
  readonly data?: unknown;
  readonly error?: string;
  readonly duration: number;  // ms
}
```

### ToolParameterSchema

Simplified JSON Schema for describing tool input/output shapes.

```typescript
interface ToolParameterSchema {
  readonly type: string;
  readonly description?: string;
  readonly properties?: Readonly<Record<string, ToolParameterSchema>>;
  readonly required?: readonly string[];
  readonly items?: ToolParameterSchema;
  readonly enum?: readonly unknown[];
}
```

### MemoryEntry

A single memory entry stored by a provider.

```typescript
interface MemoryEntry {
  readonly id: string;
  readonly content: string;
  readonly role: MemoryRole;
  readonly namespace: MemoryNamespace;
  readonly createdAt: string;              // ISO-8601
  readonly metadata?: MemoryMetadata;
}
```

### MemoryQueryOptions

Options for querying memory.

```typescript
interface MemoryQueryOptions {
  readonly namespace?: MemoryNamespace;
  readonly limit?: number;
  readonly after?: string;     // ISO-8601
  readonly before?: string;    // ISO-8601
  readonly metadata?: Readonly<Record<string, string | number | boolean>>;
}
```

### MemoryQueryResult

Result of a memory query.

```typescript
interface MemoryQueryResult {
  readonly entries: readonly MemoryEntry[];
  readonly total: number;
}
```

### MemoryRetentionPolicy

Controls automatic eviction of old entries.

```typescript
interface MemoryRetentionPolicy {
  readonly maxEntries?: number;  // 0 = unlimited
  readonly maxAge?: number;      // ms, 0 = unlimited
}
```

---

## Enums

### AgentStatus

```typescript
enum AgentStatus {
  IDLE = 'idle',
  EXECUTING = 'executing',
  ERROR = 'error',
}
```

### CrewStatus

```typescript
enum CrewStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  COMPLETED = 'completed',
  ERROR = 'error',
}
```

### TaskStatus

```typescript
enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}
```

### TaskPriority

```typescript
enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}
```

### EngineStatus

```typescript
enum EngineStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  COMPLETED = 'completed',
  ERROR = 'error',
  CANCELLED = 'cancelled',
}
```

### ExecutionStrategy

```typescript
enum ExecutionStrategy {
  SEQUENTIAL = 'sequential',
  PARALLEL = 'parallel',
}
```

### LLMRole

```typescript
enum LLMRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
  TOOL = 'tool',
}
```

### ToolPermission

```typescript
enum ToolPermission {
  FILE_READ = 'file:read',
  FILE_WRITE = 'file:write',
  NETWORK = 'network',
  SHELL_EXEC = 'shell:exec',
  ENV_ACCESS = 'env:access',
}
```

### ToolCategory

```typescript
enum ToolCategory {
  FILE = 'file',
  WEB = 'web',
  SHELL = 'shell',
  DATA = 'data',
  CUSTOM = 'custom',
}
```

### MemoryNamespace

```typescript
enum MemoryNamespace {
  AGENT = 'agent',
  CREW = 'crew',
  GLOBAL = 'global',
}
```

### MemoryRole

```typescript
enum MemoryRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
  TOOL = 'tool',
}
```

### CircuitState

```typescript
enum CircuitState {
  CLOSED = 'closed',     // Normal operation
  OPEN = 'open',         // Rejecting requests
  HALF_OPEN = 'half-open', // Testing recovery
}
```

---

## Event Maps

### AgentEventMap

| Event | Parameters | Description |
|-------|------------|-------------|
| `agent:start` | `(agentId, taskInput)` | Agent begins task execution |
| `agent:complete` | `(agentId, result)` | Agent completes task |
| `agent:error` | `(agentId, error)` | Agent encounters an error |
| `agent:llm:start` | `(agentId)` | LLM generation begins |
| `agent:llm:complete` | `(agentId, response)` | LLM generation completes |
| `agent:tool:start` | `(agentId, toolName)` | Tool execution begins |
| `agent:tool:complete` | `(agentId, toolName, result)` | Tool execution completes |
| `agent:status-changed` | `(agentId, status)` | Agent status changes |

### CrewEventMap

| Event | Parameters | Description |
|-------|------------|-------------|
| `crew:start` | `(crewId)` | Crew run begins |
| `crew:complete` | `(crewId, result)` | Crew run completes |
| `crew:error` | `(crewId, error)` | Crew encounters an error |
| `crew:task:start` | `(crewId, taskId, agentId)` | Task begins in crew |
| `crew:task:complete` | `(crewId, taskId, result)` | Task completes in crew |
| `crew:task:error` | `(crewId, taskId, error)` | Task fails in crew |
| `crew:status-changed` | `(crewId, status)` | Crew status changes |

### TaskEventMap

| Event | Parameters | Description |
|-------|------------|-------------|
| `task:start` | `(taskId, agentId)` | Task starts execution |
| `task:complete` | `(taskId, result)` | Task completes successfully |
| `task:error` | `(taskId, error)` | Task fails |
| `task:retry` | `(taskId, attempt, maxRetries)` | Retry attempt begins |
| `task:timeout` | `(taskId, timeoutMs)` | Task exceeds timeout |
| `task:status-changed` | `(taskId, status)` | Task status changes |

### EngineEventMap

| Event | Parameters | Description |
|-------|------------|-------------|
| `engine:start` | `(engineId)` | Engine run begins |
| `engine:complete` | `(engineId, result)` | Engine run completes |
| `engine:error` | `(engineId, error)` | Engine encounters an error |
| `engine:cancelled` | `(engineId)` | Engine run cancelled |
| `engine:task:start` | `(engineId, taskId, agentId)` | Task starts in engine |
| `engine:task:complete` | `(engineId, taskId, result)` | Task completes in engine |
| `engine:task:error` | `(engineId, taskId, error)` | Task fails in engine |
| `engine:task:retry` | `(engineId, taskId, attempt, maxRetries)` | Task retry in engine |
| `engine:task:timeout` | `(engineId, taskId, timeoutMs)` | Task timeout in engine |
| `engine:status-changed` | `(engineId, status)` | Engine status changes |

### ToolEventMap

| Event | Parameters | Description |
|-------|------------|-------------|
| `tool:execute:start` | `(toolName, input)` | Tool execution begins |
| `tool:execute:complete` | `(toolName, result)` | Tool execution completes |
| `tool:execute:error` | `(toolName, error)` | Tool execution fails |
| `tool:permission:denied` | `(toolName, required, denied)` | Permission denied |

### MemoryEventMap

| Event | Parameters | Description |
|-------|------------|-------------|
| `memory:add` | `(entry)` | Entry added |
| `memory:delete` | `(id)` | Entry deleted |
| `memory:clear` | `(namespace, count)` | Entries cleared |
| `memory:evict` | `(entries)` | Entries evicted by retention policy |

---

## Error Classes

All error classes extend the built-in `Error` class with descriptive `name` and `message` properties.

### Agent Errors

| Class | Description |
|-------|-------------|
| `AgentConfigError` | Invalid agent configuration (bad ID, empty role/goal, etc.) |
| `AgentExecutionError` | Error during agent task execution |

### Crew Errors

| Class | Description |
|-------|-------------|
| `CrewConfigError` | Invalid crew configuration (missing agents, circular deps, etc.) |
| `CrewExecutionError` | Error during crew workflow execution |

### Task Errors

| Class | Description |
|-------|-------------|
| `TaskConfigError` | Invalid task configuration |
| `TaskExecutionError` | Error during task execution |
| `TaskTimeoutError` | Task exceeded its timeout |
| `CircularDependencyError` | Circular dependency detected in task graph |

**Type:** `DependencyCycle` — Describes a cycle path in the dependency graph.

### Engine Errors

| Class | Description |
|-------|-------------|
| `EngineConfigError` | Invalid engine configuration |
| `EngineExecutionError` | Error during engine execution |

### LLM Errors

| Class | Description |
|-------|-------------|
| `LLMProviderError` | Base LLM provider error |
| `LLMRateLimitError` | Rate limited (HTTP 429) |
| `LLMAuthenticationError` | Authentication failed (HTTP 401) |
| `LLMContextLengthError` | Context window exceeded |
| `LLMStreamError` | Streaming failure |

### Tool Errors

| Class | Description |
|-------|-------------|
| `ToolConfigError` | Invalid tool configuration |
| `ToolNotFoundError` | Tool not found in registry |
| `ToolExecutionError` | Tool execution failed |
| `ToolPermissionError` | Permission denied for tool |
| `ToolTimeoutError` | Tool exceeded timeout |
| `ToolCompositionError` | Tool composition failure |
| `ToolInputValidationError` | Input validation failed |

**Type:** `ToolValidationIssue` — Describes a single validation error.

### Memory Errors

| Class | Description |
|-------|-------------|
| `MemoryConfigError` | Invalid memory configuration |
| `MemoryOperationError` | Memory operation failed |
| `MemoryQueryError` | Memory query failed |

---

## Utility Functions

### Task Utilities

#### Dependency Resolution

```typescript
import {
  topologicalSort,
  getExecutionLevels,
  detectCircularDependencies,
  assertNoCycles,
} from '@crewspace/core';
```

| Function | Signature | Description |
|----------|-----------|-------------|
| `topologicalSort` | `(tasks): string[]` | Sort tasks in dependency order |
| `getExecutionLevels` | `(tasks): ExecutionLevel[]` | Group tasks into parallel execution levels |
| `detectCircularDependencies` | `(tasks): CircularDependencyCheckResult` | Check for cycles |
| `assertNoCycles` | `(tasks): void` | Throw if cycles exist |
| `resolveTaskDependencies` | `(tasks): Map<string, string[]>` | Resolve transitive dependencies |
| `schedulerTopologicalSort` | `(tasks): TopologicalSortResult` | Extended sort with metadata |
| `getSchedulerExecutionLevels` | `(tasks): ExecutionLevel[]` | Scheduler-aware execution levels |

#### Task Execution

```typescript
import { executeWithRetry, executeWithTimeout, TaskExecutionWrapper } from '@crewspace/core';
```

| Function | Signature | Description |
|----------|-----------|-------------|
| `executeWithRetry` | `(fn, config): Promise<T>` | Execute with retry logic |
| `executeWithTimeout` | `(fn, timeoutMs): Promise<T>` | Execute with timeout |
| `calculateTaskRetryDelay` | `(attempt, config): number` | Calculate retry delay |

**Class:** `TaskExecutionWrapper` — Wraps task execution with retry and timeout support.

#### Task Formatting

```typescript
import { formatTaskList, formatTaskDependencyTree, formatTaskPlanTree } from '@crewspace/core';
```

| Function | Signature | Description |
|----------|-----------|-------------|
| `formatTaskList` | `(tasks): string` | Format tasks as a list |
| `formatTaskDependencyTree` | `(tasks): string` | Format as dependency tree |
| `formatTaskPlanTree` | `(tasks, options?): string` | Format as execution plan |

#### Context Management

**Class:** `TaskContextManager` — Manages context propagation between tasks.

### LLM Utilities

| Function | Signature | Description |
|----------|-----------|-------------|
| `isStreamingProvider` | `(provider): boolean` | Check if provider supports streaming |
| `buildRetryConfig` | `(maxRetries, overrides?): RetryConfig` | Build retry configuration |
| `calculateDelay` | `(attempt, config): number` | Calculate exponential backoff delay |
| `isRetryableError` | `(error): boolean` | Check if error is retryable |
| `withRetry` | `(operation, config): Promise<T>` | Execute with retry wrapper |
| `zodToToolSchema` | `(schema): ToolParameterSchema` | Convert Zod schema to JSON Schema |

### Validation Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `validateToolConfig` | `(config): void` | Validate tool configuration |
| `validateToolPermissionPolicy` | `(policy): void` | Validate permission policy |
| `parseToolInput` | `(toolName, schema, input): T` | Parse and validate tool input |
| `isValidTool` | `(value): boolean` | Runtime type guard for Tool |
| `validateLLMProviderConfig` | `(config): void` | Validate LLM provider config |
| `validateLLMMessages` | `(messages): void` | Validate message array |

#### Zod Schemas

Pre-built Zod schemas for runtime validation:

- `ToolConfigSchema` — Validates `Tool` objects
- `ToolParameterSchemaSchema` — Validates `ToolParameterSchema`
- `ToolPermissionPolicySchema` — Validates `ToolPermissionPolicy`
- `LLMProviderConfigSchema` — Validates `LLMProviderConfig`
- `LLMRequestOptionsSchema` — Validates `LLMRequestOptions`
- `LLMMessageSchema` — Validates `LLMMessage`
- `LLMMessagesSchema` — Validates `LLMMessage[]`
- `LLMModelInfoSchema` — Validates `LLMModelInfo`

---

> **See also:** [Getting Started](./getting-started.md) · [Examples](../examples/) · [README](../README.md)
