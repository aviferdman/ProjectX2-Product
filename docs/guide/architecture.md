# Architecture Deep Dive

This guide explores Crewspace's internal architecture, design patterns, data flow, and extension points. It's intended for contributors and advanced users who want to understand how the framework works under the hood.

## High-Level Architecture

Crewspace is organized as a layered TypeScript monorepo. Each layer depends only on the layers below it, ensuring clean separation of concerns.

```
┌─────────────────────────────────────────────────────────┐
│                     CLI (`@crewspace/cli`)               │
│              init · run · validate commands               │
├─────────────────────────────────────────────────────────┤
│                  Orchestration Layer                      │
│         Crew · ExecutionEngine · TaskContextManager       │
├──────────────────┬──────────────────┬───────────────────┤
│   Agent Layer    │   Task Layer     │   Memory Layer     │
│  Agent · Events  │ Task · Scheduler │ ShortTerm · Scoped │
│  Prompt Builder  │ Parallel Exec    │ SQLite · Export    │
├──────────────────┴──────────────────┴───────────────────┤
│                  Provider Layer                           │
│     LLM Providers · Tool System · Permission Manager     │
├─────────────────────────────────────────────────────────┤
│                  Foundation Layer                         │
│  Types · Errors · Validation · Events · Logging · Runtime │
└─────────────────────────────────────────────────────────┘
```

### Package Structure

The monorepo contains two packages:

| Package | Role |
|---------|------|
| `@crewspace/core` | Agent orchestration engine — all core primitives, providers, and tools |
| `@crewspace/cli` | Command-line interface — scaffolding, workflow execution, config validation |

The `core` package is the heart of the framework. Its `src/` directory is organized by domain:

```
packages/core/src/
├── agent/       # Agent class — persona, tools, LLM integration
├── crew/        # Crew orchestrator — multi-agent workflows
├── task/        # Task lifecycle, scheduler, parallel executor, context manager
├── engine/      # ExecutionEngine — strategy-based orchestration
├── llm/         # LLM providers, retry, fallback, circuit breaker, streaming
├── tool/        # Tool registry, executor, permissions, decorators
├── tools/       # Built-in tools (file, web, shell)
├── memory/      # Memory providers (short-term, scoped, SQLite, export/import)
├── types/       # Shared interfaces, enums, and event maps
├── errors/      # Typed error hierarchy per domain
├── validation/  # Zod schemas for runtime config validation
├── logging/     # Logger, transports, performance tracking
├── runtime/     # Runtime compatibility detection (Node.js version checks)
├── deprecation/ # Deprecation registry and decorator utilities
└── version/     # SemVer utilities and changelog parsing
```

## Core Design Patterns

Crewspace employs several design patterns consistently throughout the codebase.

### 1. Observer Pattern (Event-Driven Architecture)

Every major class emits typed lifecycle events through [EventEmitter3](https://github.com/primus/eventemitter3). Each domain defines its own `EventMap` interface that maps event names to strongly-typed listener signatures.

```typescript
// Type-safe event subscription
agent.on('agent:start', (agentId: string, taskInput: TaskInput) => {
  console.log(`Agent ${agentId} started`);
});

engine.on('engine:task:retry', (engineId, taskId, attempt, maxRetries) => {
  console.log(`Retry ${attempt}/${maxRetries} for ${taskId}`);
});
```

**Event maps defined in the framework:**

| Domain | Event Map | Key Events |
|--------|-----------|------------|
| Agent | `AgentEventMap` | `agent:start`, `agent:complete`, `agent:error`, `agent:llm:start`, `agent:llm:complete`, `agent:status-changed` |
| Task | `TaskEventMap` | `task:start`, `task:complete`, `task:error`, `task:retry`, `task:timeout`, `task:status-changed` |
| Crew | `CrewEventMap` | `crew:start`, `crew:complete`, `crew:error`, `crew:task:start`, `crew:task:complete`, `crew:task:error` |
| Engine | `EngineEventMap` | `engine:start`, `engine:complete`, `engine:error`, `engine:cancelled`, `engine:task:start`, `engine:task:retry` |
| Tool | `ToolEventMap` | `tool:execute:start`, `tool:execute:complete`, `tool:execute:error`, `tool:permission:denied` |
| Memory | `MemoryEventMap` | `memory:add`, `memory:delete`, `memory:clear`, `memory:evict` |

### 2. Strategy Pattern (Execution Strategies)

The `ExecutionEngine` uses the Strategy pattern to support different execution modes:

```typescript
enum ExecutionStrategy {
  SEQUENTIAL = 'sequential',  // Tasks run one at a time
  PARALLEL = 'parallel',      // Independent tasks run concurrently
}
```

The engine resolves the task dependency DAG and selects the appropriate execution path based on the configured strategy. The parallel strategy respects a configurable `maxConcurrency` limit and task dependency ordering.

### 3. Decorator Pattern (LLM Provider Wrappers)

LLM providers can be wrapped with resilience decorators that add cross-cutting behavior without modifying the underlying provider:

```
┌─────────────────────────────────┐
│     UsageTrackingProvider       │  ← Tracks token usage
│  ┌───────────────────────────┐  │
│  │     RetryLLMProvider      │  │  ← Retries with backoff
│  │  ┌─────────────────────┐  │  │
│  │  │  FallbackProvider   │  │  │  ← Falls back to alternatives
│  │  │  ┌───────────────┐  │  │  │
│  │  │  │ OpenAIProvider │  │  │  │  ← Base provider
│  │  │  └───────────────┘  │  │  │
│  │  └─────────────────────┘  │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

Each decorator implements the same `LLMProvider` interface, so they compose transparently:

```typescript
const base = createOpenAIProvider({ modelId: 'gpt-4o', apiKey: '...' });
const withRetry = createRetryProvider(base, { maxRetries: 3 });
const withFallback = createFallbackProvider(withRetry, [claudeProvider]);
const tracked = createUsageTrackingProvider(withFallback);
```

### 4. Registry Pattern (Tools and Providers)

Both tools and LLM providers use registries for centralized management:

- **`ToolRegistry`** — stores `Tool` instances by name, supports `register()`, `get()`, `list()`, `has()`, `remove()`
- **`LLMProviderRegistry`** — stores `LLMProviderFactory` functions by provider name, enables dynamic provider creation from config objects

### 5. Builder Pattern (Memory Search)

The `MemorySearchBuilder` provides a fluent API for constructing complex memory queries:

```typescript
const results = await memory.search()
  .inNamespace(MemoryNamespace.AGENT)
  .withRole(MemoryRole.ASSISTANT)
  .after('2024-01-01T00:00:00Z')
  .limit(10)
  .execute();
```

### 6. Dependency Injection

Agents are designed for testability through constructor injection:

- **LLM providers** are injected via `setLLMProvider()` — swap between OpenAI, Anthropic, Ollama, or a mock
- **Tools** are injected via `addTool()` — compose capabilities at runtime
- **Memory providers** are injected into the `MemoryManager` constructor

This makes every component testable in isolation without network calls.

## Data Flow

### Task Execution Flow

When `crew.run()` is called, the following sequence unfolds:

```
crew.run()
  │
  ├─ 1. Validate config (Zod schemas)
  ├─ 2. Emit 'crew:start'
  ├─ 3. Topological sort of task dependency graph
  │
  ├─ 4. For each task (in dependency order):
  │     │
  │     ├─ 4a. Emit 'crew:task:start'
  │     ├─ 4b. Resolve agent by agentId
  │     ├─ 4c. Build TaskInput (inject prior results as context)
  │     ├─ 4d. agent.execute(taskInput)
  │     │       │
  │     │       ├─ Set status → EXECUTING
  │     │       ├─ Emit 'agent:start'
  │     │       ├─ Build system prompt (role + goal + backstory + tools)
  │     │       ├─ Build messages (system + user prompt with context)
  │     │       ├─ Emit 'agent:llm:start'
  │     │       ├─ llmProvider.generateText(messages)
  │     │       ├─ Emit 'agent:llm:complete'
  │     │       ├─ Build TaskResult
  │     │       ├─ Set status → IDLE
  │     │       └─ Emit 'agent:complete'
  │     │
  │     ├─ 4e. Store result in taskResults map
  │     └─ 4f. Emit 'crew:task:complete'
  │
  ├─ 5. Build CrewRunResult
  └─ 6. Emit 'crew:complete'
```

### ExecutionEngine Flow (Advanced)

The `ExecutionEngine` provides more control than `Crew`:

```
engine.run()
  │
  ├─ 1. Validate config + resolve dependency graph
  ├─ 2. Emit 'engine:start'
  ├─ 3. Choose strategy:
  │
  │     SEQUENTIAL:
  │     └─ Execute tasks one by one in topological order
  │
  │     PARALLEL:
  │     └─ Group tasks into execution levels (DAG layers)
  │        └─ Execute each level concurrently (up to maxConcurrency)
  │           └─ Wait for all tasks in level to complete before next level
  │
  ├─ 4. For each task:
  │     ├─ Run beforeTask hooks
  │     ├─ Execute with timeout + retries
  │     │   ├─ On timeout → emit 'engine:task:timeout', throw TaskTimeoutError
  │     │   └─ On failure → emit 'engine:task:retry', retry with backoff
  │     ├─ On success → run afterTask hooks
  │     └─ On error → run onTaskError hooks, apply error policy
  │         ├─ 'fail-fast' → cancel remaining tasks, emit 'engine:error'
  │         └─ 'continue' → log error, continue with next tasks
  │
  └─ 5. Build EngineRunResult, emit 'engine:complete'
```

## State Machines

All major entities follow explicit state machines. Status transitions are emitted as events.

### Agent Status

```
     ┌──────────────────────────────┐
     │                              │
     ▼                              │
   IDLE ──── execute() ───▶ EXECUTING
     ▲                         │
     │                    ┌────┴────┐
     │                    │         │
     └─── success ────────┘    failure
                                │
                                ▼
                              ERROR
```

### Task Status

```
   PENDING ──── run ───▶ RUNNING
                           │
                    ┌──────┼──────┐
                    │      │      │
                    ▼      ▼      ▼
              COMPLETED  FAILED  CANCELLED
```

### Engine Status

```
   IDLE ──── run() ───▶ RUNNING
                           │
                  ┌────────┼────────┐
                  │        │        │
                  ▼        ▼        ▼
            COMPLETED    ERROR   CANCELLED
```

### Circuit Breaker States

```
   CLOSED ──── failures ≥ threshold ───▶ OPEN
     ▲                                     │
     │                                cooldown expires
     │                                     │
     │                                     ▼
     └──── test request succeeds ──── HALF_OPEN
                                           │
                                      test fails
                                           │
                                           ▼
                                         OPEN
```

## LLM Provider Architecture

### Provider Interface

All LLM providers implement the `LLMProvider` interface:

```typescript
interface LLMProvider {
  readonly name: string;
  generateText(
    messages: readonly LLMMessage[],
    options?: LLMRequestOptions
  ): Promise<LLMResponse>;
}
```

Streaming providers extend this with `generateStream()`:

```typescript
interface StreamingLLMProvider extends LLMProvider {
  generateStream(
    messages: readonly LLMMessage[],
    options?: LLMRequestOptions
  ): Promise<LLMStreamResponse>;
}
```

### Provider Hierarchy

```
LLMProvider (interface)
├── BaseLLMProvider (abstract class — shared config, validation)
│   ├── OpenAIProvider
│   ├── AnthropicProvider
│   └── OllamaProvider
│
├── RetryLLMProvider (decorator — exponential backoff + jitter)
├── FallbackLLMProvider (decorator — provider chain with fallback)
├── UsageTrackingProvider (decorator — token usage aggregation)
└── CircuitBreaker (standalone — failure threshold + cooldown)
```

### Resilience Stack

The retry system implements exponential backoff with full jitter:

```
delay = min(baseDelay × 2^attempt + random(0, baseDelay), maxDelay)
```

Key resilience features:
- **Retry with backoff** — configurable max retries, base delay, max delay, and backoff multiplier
- **Rate limit awareness** — respects `Retry-After` headers via `LLMRateLimitError.retryAfterMs`
- **Fallback chains** — try providers in order; first successful response wins
- **Circuit breaker** — CLOSED → OPEN → HALF_OPEN state machine prevents cascading failures
- **Usage tracking** — aggregates token usage across calls for cost monitoring
- **Abort signal support** — all providers accept `AbortSignal` for cancellation

### Model Catalog

The `ModelCatalog` provides static metadata about supported models:

```typescript
interface LLMModelInfo {
  modelId: string;
  provider: string;
  displayName: string;
  maxContextTokens: number;
  maxOutputTokens: number;
  supportsStreaming: boolean;
  costPer1kInputTokens?: number;
  costPer1kOutputTokens?: number;
}
```

## Tool System Architecture

### Tool Interface

Every tool implements the `Tool` interface:

```typescript
interface Tool {
  readonly name: string;
  readonly description: string;
  readonly category?: ToolCategory;
  readonly permissions?: readonly ToolPermission[];
  readonly inputSchema?: ToolParameterSchema;    // JSON Schema
  readonly inputZodSchema?: ZodType;             // Zod schema
  readonly outputSchema?: ToolParameterSchema;
  readonly timeout?: number;
  execute(input: unknown): Promise<unknown>;
}
```

### Three Ways to Create Tools

| Method | Schema | Type Safety | Use Case |
|--------|--------|-------------|----------|
| `defineTool()` | Zod | Full inference | Recommended default |
| `createTool()` | JSON Schema | Manual | Interop with external schemas |
| `@tool` decorator | Implicit | Class-based | Method-decorated tools |

Additionally, `composeTool()` chains multiple tools into a single pipeline.

### Tool Execution Pipeline

```
ToolExecutor.execute(toolName, input, callerId)
  │
  ├─ 1. Look up tool in ToolRegistry
  │     └─ Not found → throw ToolNotFoundError
  │
  ├─ 2. Check permissions via PermissionManager
  │     └─ Denied → emit 'tool:permission:denied', throw ToolPermissionError
  │
  ├─ 3. Validate input
  │     ├─ Zod schema present → parse with Zod
  │     └─ JSON schema present → validate against schema
  │     └─ Invalid → throw ToolInputValidationError
  │
  ├─ 4. Emit 'tool:execute:start'
  │
  ├─ 5. Execute with optional timeout
  │     └─ Timeout → throw ToolTimeoutError
  │
  ├─ 6. Build ToolResult { success, data, duration }
  ├─ 7. Emit 'tool:execute:complete'
  └─ 8. Return result
```

### Permission System

The permission system uses a policy-based model:

```typescript
enum ToolPermission {
  FILE_READ   = 'file:read',
  FILE_WRITE  = 'file:write',
  NETWORK     = 'network',
  SHELL_EXEC  = 'shell:exec',
  ENV_ACCESS  = 'env:access',
}

interface ToolPermissionPolicy {
  defaultAction: 'allow' | 'deny';
  allowed?: readonly ToolPermission[];
  denied?: readonly ToolPermission[];
}
```

The `PermissionManager` resolves permissions per tool and caller, with built-in policies `ALLOW_ALL_POLICY` and `DENY_ALL_POLICY`.

### Built-in Tools

| Category | Tools | Permissions |
|----------|-------|-------------|
| **File** | `readFile`, `writeFile`, `listFiles` | `FILE_READ`, `FILE_WRITE` |
| **Web** | `webSearch`, `fetchUrl`, `parseHtml` | `NETWORK` |
| **Shell** | Shell execution tools | `SHELL_EXEC` |

Web tools include a built-in `RateLimiter` and configurable timeouts.

## Memory System Architecture

The memory system provides conversation and context persistence with pluggable backends.

### Memory Provider Interface

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

### Memory Implementations

| Provider | Storage | Use Case |
|----------|---------|----------|
| `ShortTermMemory` | In-memory `Map` | Ephemeral per-session context |
| `SqliteMemory` | SQLite database | Persistent cross-session storage |
| `ScopedMemory` | Wraps any provider | Namespace isolation with read restrictions |

### Memory Architecture

```
MemoryManager
├── Wraps a MemoryProvider
├── Applies retention policies (maxEntries, maxAge)
├── Emits MemoryEventMap events
└── Auto-evicts oldest entries on overflow

ScopedMemory
├── Wraps a MemoryProvider
├── Enforces namespace boundaries
├── Configurable readable namespaces (e.g., agent can read crew)
└── All writes go to the scoped namespace

MemorySearchBuilder
├── Fluent query builder
├── Chains namespace, role, time range, limit, offset
└── Executes against underlying provider
```

### Memory Namespaces

```typescript
enum MemoryNamespace {
  AGENT  = 'agent',   // Private to a single agent
  CREW   = 'crew',    // Shared within a crew
  GLOBAL = 'global',  // Accessible to everything
}
```

### Export/Import

The `exportMemory()` and `importMemory()` functions support data portability with a versioned JSON format (`MEMORY_EXPORT_VERSION`), configurable entry limits, and merge/replace strategies.

## Error Handling Architecture

Crewspace uses a domain-specific error hierarchy that enables precise error handling.

### Error Hierarchy

```
Error
├── AgentConfigError          — Invalid agent configuration
├── AgentExecutionError       — Agent execution failure
├── CrewConfigError           — Invalid crew configuration
├── CrewExecutionError        — Crew execution failure
├── TaskConfigError           — Invalid task configuration
├── TaskExecutionError        — Task execution failure
├── TaskTimeoutError          — Task exceeded timeout
├── CircularDependencyError   — Circular task dependencies detected
├── EngineConfigError         — Invalid engine configuration
├── EngineExecutionError      — Engine execution failure
├── LLMProviderError          — Generic LLM provider failure
│   ├── LLMRateLimitError     — Rate limit exceeded (includes retryAfterMs)
│   ├── LLMAuthenticationError — Invalid API key or credentials
│   ├── LLMContextLengthError — Input exceeds model's context window
│   └── LLMStreamError        — Streaming response failure
├── ToolConfigError           — Invalid tool configuration
├── ToolNotFoundError         — Tool not in registry
├── ToolExecutionError        — Tool execution failure
├── ToolPermissionError       — Permission denied
├── ToolTimeoutError          — Tool exceeded timeout
├── ToolInputValidationError  — Input schema validation failure
├── ToolCompositionError      — Tool composition failure
├── MemoryConfigError         — Invalid memory configuration
├── MemoryOperationError      — Memory operation failure
└── MemoryQueryError          — Memory query failure
```

Each error class carries domain-specific context (e.g., `AgentExecutionError` includes the `agentId`, `LLMRateLimitError` includes `retryAfterMs`), making error handling both type-safe and informative.

## Validation Architecture

All configuration objects are validated at construction time using [Zod](https://zod.dev) schemas. This catches configuration errors immediately rather than at execution time.

```typescript
// Example: Agent construction validates config with Zod
const agent = new Agent({
  id: '',  // ❌ Throws AgentConfigError: "Agent id must not be empty"
  role: 'Analyst',
  goal: 'Analyze data',
});
```

Key validation rules:
- **IDs** must match `^[a-zA-Z0-9_-]+$` (alphanumeric with dashes/underscores)
- **Numeric limits** are bounded (e.g., `maxConcurrency ≤ 100`, `globalTimeout ≤ 1 hour`)
- **Tool configs** validate name, description, and schema presence
- **LLM configs** validate provider, model ID, and request options

The `validation/` module exports reusable Zod schemas (`ToolConfigSchema`, `LLMProviderConfigSchema`, etc.) for use outside the framework.

## Logging and Observability

### Logger

The `Logger` class provides structured, level-based logging:

```typescript
enum LogLevel {
  DEBUG, INFO, WARN, ERROR
}
```

Specialized factory functions create pre-configured loggers:
- `createAgentLogger(agentId)` — prefixed with agent context
- `createCrewLogger(crewId)` — prefixed with crew context
- `createSilentLogger()` — suppresses all output (for tests)

### Transports

| Transport | Output |
|-----------|--------|
| `ConsoleTransport` | `console.log` / `console.error` |
| `BufferTransport` | In-memory buffer (for testing and aggregation) |

### Performance Tracking

The `PerformanceTracker` and `PerformanceTimer` classes provide timing and metrics:

```typescript
const tracker = new PerformanceTracker();
const timer = tracker.startTimer({ name: 'llm-call', type: MetricType.LLM });
// ... do work ...
timer.stop();

const report = tracker.getReport();
// { metrics: [...], summary: { count, totalDuration, avgDuration, ... } }
```

## Task Scheduling and Dependency Resolution

### Topological Sort

Tasks declare dependencies via `dependencies: string[]`. The scheduler resolves these into a valid execution order using topological sort (Kahn's algorithm). Circular dependencies are detected and throw `CircularDependencyError`.

```typescript
// Detection utilities
const cycles = detectCircularDependencies(tasks);
assertNoCycles(tasks);  // throws CircularDependencyError if cycles exist

// Scheduling
const sorted = schedulerTopologicalSort(tasks);
const levels = getSchedulerExecutionLevels(tasks);
// levels[0] = tasks with no dependencies (can run first)
// levels[1] = tasks depending only on level-0 tasks
// ...
```

### Task Context Manager

The `TaskContextManager` threads results from completed tasks into dependent tasks as context. It supports configurable merge strategies and context transformers:

```typescript
interface TaskContextManagerConfig {
  mergeStrategy?: ContextMergeStrategy;  // e.g., 'shallow-merge'
  transformer?: ContextTransformer;       // custom context transformation
}
```

### Task Execution Wrapper

The `TaskExecutionWrapper` adds retry and timeout behavior to task execution:

```typescript
const wrapper = new TaskExecutionWrapper({
  timeout: 30000,
  maxRetries: 3,
  retryDelay: calculateTaskRetryDelay,  // exponential backoff
});
```

## Runtime Compatibility

The `runtime/` module detects the execution environment and validates compatibility:

```typescript
const runtime = detectRuntime();       // 'node' | 'bun' | 'deno' | 'browser' | 'unknown'
const version = getRuntimeVersion();   // { major, minor, patch }

const report = checkCompatibility();
// Validates: Node.js version ≥ 18, required globals present

assertCompatible();  // Throws if environment is incompatible
```

Required globals: `AbortController`, `AbortSignal`, `URL`, `URLSearchParams`, `fetch`, `crypto`, `structuredClone`, etc.

## Extension Points

Crewspace is designed for extensibility at every layer:

### Custom LLM Provider

Implement the `LLMProvider` interface:

```typescript
class MyProvider implements LLMProvider {
  readonly name = 'my-provider';

  async generateText(
    messages: readonly LLMMessage[],
    options?: LLMRequestOptions
  ): Promise<LLMResponse> {
    // Your implementation
    return { content: '...', tokenUsage: { ... }, finishReason: 'stop' };
  }
}
```

### Custom Tool

Use `defineTool()` for the best developer experience:

```typescript
const myTool = defineTool({
  name: 'my-tool',
  description: 'Does something useful',
  schema: z.object({ input: z.string() }),
  async execute({ input }) {
    return `Processed: ${input}`;
  },
});
```

### Custom Memory Provider

Implement the `MemoryProvider` interface:

```typescript
class RedisMemory implements MemoryProvider {
  readonly name = 'redis';
  async add(entry: MemoryEntry): Promise<MemoryEntry> { /* ... */ }
  async get(id: string): Promise<MemoryEntry | undefined> { /* ... */ }
  async query(options?: MemoryQueryOptions): Promise<MemoryQueryResult> { /* ... */ }
  async search(text: string, options?: MemoryQueryOptions): Promise<MemoryQueryResult> { /* ... */ }
  async delete(id: string): Promise<boolean> { /* ... */ }
  async clear(namespace?: MemoryNamespace): Promise<number> { /* ... */ }
  async count(namespace?: MemoryNamespace): Promise<number> { /* ... */ }
}
```

### Custom Log Transport

Implement the `LogTransport` interface:

```typescript
const fileTransport: LogTransport = {
  log(entry: LogEntry): void {
    fs.appendFileSync('app.log', JSON.stringify(entry) + '\n');
  },
};

const logger = new Logger({ transports: [fileTransport] });
```

## Build and CI Architecture

### TypeScript Configuration

- **Target**: ES2022 with Node16 module resolution
- **Strict mode**: All strict flags enabled (`strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`)
- **Composite builds**: Incremental TypeScript compilation with project references
- **Decorators**: Experimental decorators enabled for the `@tool` decorator

### Testing

- **Framework**: Vitest with V8 coverage provider
- **Coverage threshold**: 80% (lines, functions, branches, statements)
- **Test types**: Unit, integration, QA, documentation, and build-output tests
- **Workspaces**: Each package defines its own `vitest.config.ts`

### CI/CD Pipeline

```
Push / PR to main
  │
  ├─ Lint (ESLint + Prettier)
  ├─ Type Check (tsc --noEmit)
  ├─ Test (Node 18 / 20 / 22 matrix)
  ├─ Benchmarks (regression detection)
  └─ Build (verifies dist/ output)

Tag v* push
  │
  ├─ Validate (tag matches package version)
  ├─ Full CI checks
  ├─ Build artifacts
  └─ Publish to npm (with provenance)
```

### Performance Budgets

Performance benchmarks are enforced in CI:

| Operation | Budget |
|-----------|--------|
| Agent init | < 100ms |
| Task init | < 100ms |
| Memory operations | < 50ms |
| Tool invocation | < 50ms |
| Engine run (10 tasks, sequential) | < 5s |
| Engine run (5 tasks, parallel) | < 5s |

Regressions > 15% automatically fail the CI pipeline.

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **EventEmitter3** over Node.js built-in | Lightweight, typed generics, no `max listeners` warnings |
| **Zod** for runtime validation | Type inference from schemas, composable, excellent error messages |
| **Monorepo with npm workspaces** | Shared tooling, independent versioning, single CI |
| **ES2022 target** | Modern JavaScript features, good Node.js 18+ support |
| **Readonly interfaces** | Immutability by default prevents accidental state mutation |
| **Domain-specific errors** | Precise catch handling, rich context for debugging |
| **Provider-agnostic LLM layer** | Swap providers without changing agent code |
| **Policy-based permissions** | Flexible security boundaries per agent, crew, or global |
| **Strategy pattern for execution** | Clean separation of scheduling from orchestration logic |
| **Composite TypeScript builds** | Incremental compilation for fast dev feedback |
