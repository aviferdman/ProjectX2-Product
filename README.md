<div align="center">

# 🚀 Crewspace

**TypeScript-native agent orchestration framework**

Build, debug, and deploy multi-agent workflows in under 5 minutes.

[![CI](https://github.com/aviferdman/ProjectX2-Product/actions/workflows/ci.yml/badge.svg)](https://github.com/aviferdman/ProjectX2-Product/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

</div>

---

## What is Crewspace?

Crewspace is a **TypeScript-native framework** for building multi-agent AI systems. Define specialized agents, wire them into crews, and orchestrate complex workflows — all with type-safe, event-driven TypeScript.

### Key Features

- **🔒 Type-safe by default** — Strict TypeScript with full type inference, Zod-validated configs
- **⚡ Event-driven execution** — Lightweight EventEmitter-based engine, no heavy runtimes
- **🔌 Provider-agnostic** — Swap LLM providers (OpenAI, Anthropic, Ollama) without changing agent code
- **📦 Monorepo-ready** — Modular packages, use only what you need
- **🧪 Test-friendly** — Built for testability with dependency injection and mock-friendly interfaces
- **🏃 Fast** — Minimal dependencies, optimized for startup time and low memory usage
- **🛠️ Rich tool system** — Built-in file, web, and shell tools plus a decorator-based API for custom tools
- **🔄 Resilient LLM layer** — Retry with exponential backoff, fallback chains, circuit breakers, and usage tracking

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`@crewspace/core`](./packages/core) | `0.1.0` | Core agent orchestration — Agent, Crew, Task types and execution engine |

## Quick Start

### Install

```bash
npm install @crewspace/core
```

### 1. Create an Agent

```typescript
import { Agent, Crew } from '@crewspace/core';

const researcher = new Agent({
  id: 'researcher',
  role: 'Research Analyst',
  goal: 'Find and summarize relevant information',
  backstory: 'You are an expert researcher with deep analytical skills.',
});
```

### 2. Connect an LLM Provider

```typescript
import { createOpenAIProvider } from '@crewspace/core';

const llm = createOpenAIProvider({
  modelId: 'gpt-4o',
  apiKey: process.env.OPENAI_API_KEY!,
});

researcher.setLLMProvider(llm);
```

Swap providers at any time — Anthropic, Ollama, or any custom provider:

```typescript
import { createAnthropicProvider, createOllamaProvider } from '@crewspace/core';

// Cloud
const claude = createAnthropicProvider({
  modelId: 'claude-sonnet-4-20250514',
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Local
const local = createOllamaProvider({ modelId: 'llama3' });
```

### 3. Give Agents Tools

```typescript
import { defineTool, createFileTools, createWebTools } from '@crewspace/core';
import { z } from 'zod';

// Built-in tools
const { readFile, writeFile, listFiles } = createFileTools();
researcher.addTool(readFile);

// Custom tools with Zod schema validation
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
researcher.addTool(calculator);
```

### 4. Define Tasks and Build a Crew

```typescript
const crew = new Crew({
  id: 'research-team',
  agents: [researcher],
  tasks: [
    {
      id: 'research',
      description: 'Research the latest trends in AI agent frameworks',
      expectedOutput: 'A summary report with key findings',
      agentId: 'researcher',
    },
  ],
});

const result = await crew.run();
console.log(result.taskResults);
```

### 5. Advanced: Execution Engine with Parallel Tasks

For fine-grained control, use the `ExecutionEngine` directly:

```typescript
import { ExecutionEngine, Task, ExecutionStrategy } from '@crewspace/core';

const engine = new ExecutionEngine({
  id: 'parallel-engine',
  strategy: ExecutionStrategy.PARALLEL,
  maxConcurrency: 3,
  taskErrorPolicy: 'continue',
});

engine.addAgent(researcher);

const taskA = new Task({ id: 'task-a', description: 'First task' });
const taskB = new Task({ id: 'task-b', description: 'Second task', dependencies: ['task-a'] });
taskA.assignAgent('researcher');
taskB.assignAgent('researcher');

engine.addTask(taskA);
engine.addTask(taskB);

// Lifecycle hooks
engine.onBeforeTask((task, agent) => {
  console.log(`Starting ${task.id} on ${agent.id}`);
});

const result = await engine.run();
console.log(`Completed in ${result.duration}ms, success: ${result.success}`);
```

> **Note:** The Agent and Crew APIs are under active development. The examples above show the intended API design — implementation is in progress.

## Core Concepts

### Agent

An **Agent** is a specialized AI persona with a role, goal, backstory, optional tools, and an LLM provider. Agents emit lifecycle events (`agent:start`, `agent:complete`, `agent:error`) and manage their own status transitions (IDLE → EXECUTING → IDLE/ERROR).

### Task

A **Task** is a unit of work with a description, expected output, priority, timeout, retries, and dependencies on other tasks. Tasks follow a strict status machine: PENDING → RUNNING → COMPLETED / FAILED / CANCELLED.

### Crew

A **Crew** composes multiple agents and an ordered list of tasks. On `crew.run()`, the crew resolves the task dependency graph via topological sort, feeds each task to its assigned agent, and threads task results forward as context.

### ExecutionEngine

The **ExecutionEngine** provides lower-level orchestration with support for `SEQUENTIAL` or `PARALLEL` execution strategies, configurable concurrency, global timeouts, `fail-fast` or `continue` error policies, and before/after/error hooks.

### Tool System

Tools are first-class objects with Zod-validated input schemas, permission requirements, timeout support, and category tags. Create them with `defineTool` (type-safe Zod), `createTool` (JSON Schema), or the `@tool` decorator. Register tools in a `ToolRegistry` and execute them through a `ToolExecutor` with a `PermissionManager`.

### LLM Providers

All providers implement a common `LLMProvider` interface with `generateText()`. Streaming providers add `generateStream()` returning an `AsyncIterable<LLMStreamChunk>`. The framework includes:

| Provider | Class | Factory |
|----------|-------|---------|
| OpenAI | `OpenAIProvider` | `createOpenAIProvider()` |
| Anthropic | `AnthropicProvider` | `createAnthropicProvider()` |
| Ollama | `OllamaProvider` | `createOllamaProvider()` |

Wrap any provider with resilience decorators:

```typescript
import { createRetryProvider, createFallbackProvider, createUsageTrackingProvider } from '@crewspace/core';

const resilient = createRetryProvider(llm, { maxRetries: 3 });
const withFallback = createFallbackProvider(llm, [claude, local]);
const tracked = createUsageTrackingProvider(llm);
```

### Error Handling

Every module has typed error classes for precise catch handling:

| Module | Errors |
|--------|--------|
| Agent | `AgentConfigError`, `AgentExecutionError` |
| Task | `TaskConfigError`, `TaskExecutionError`, `TaskTimeoutError` |
| Crew | `CrewConfigError`, `CrewExecutionError` |
| Engine | `EngineConfigError`, `EngineExecutionError` |
| Tool | `ToolConfigError`, `ToolNotFoundError`, `ToolExecutionError`, `ToolPermissionError`, `ToolTimeoutError`, `ToolInputValidationError` |
| LLM | `LLMProviderError`, `LLMRateLimitError`, `LLMAuthenticationError`, `LLMContextLengthError`, `LLMStreamError` |

## Development

### Prerequisites

- **Node.js** 18 or later (20+ recommended)
- **npm** 10 or later

### Setup

```bash
# Clone the repository
git clone https://github.com/aviferdman/ProjectX2-Product.git
cd ProjectX2-Product

# Install dependencies
npm install

# Build all packages
npm run build

# Run the test suite
npm test
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Build all packages |
| `npm run test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Lint all source files |
| `npm run lint:fix` | Lint and auto-fix issues |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check formatting without writing |
| `npm run typecheck` | Type-check all packages |
| `npm run clean` | Clean build artifacts |

### Project Structure

```
crewspace/
├── packages/
│   └── core/              # @crewspace/core
│       ├── src/
│       │   ├── agent/     # Agent class and config
│       │   ├── crew/      # Crew orchestrator
│       │   ├── task/      # Task, scheduler, parallel executor
│       │   ├── engine/    # ExecutionEngine (sequential & parallel)
│       │   ├── llm/       # LLM providers, retry, fallback, streaming
│       │   ├── tool/      # Tool registry, executor, permissions
│       │   ├── tools/     # Built-in tools (file, web, shell)
│       │   ├── types/     # Shared type definitions & enums
│       │   ├── errors/    # Typed error hierarchy
│       │   └── validation/# Zod schemas for runtime validation
│       ├── tests/         # Unit & integration tests
│       ├── package.json   # Package config & dependencies
│       └── tsconfig.json  # Package-level TypeScript config
├── .github/
│   └── workflows/         # CI/CD pipelines
├── package.json           # Root workspace config
├── tsconfig.base.json     # Shared TypeScript config (strict mode)
├── tsconfig.json          # Project references
├── eslint.config.mjs      # ESLint 9 flat config
├── .prettierrc            # Prettier config
└── vitest.workspace.ts    # Vitest monorepo config
```

### Architecture Decisions

- **Monorepo with npm workspaces** — shared tooling, independent versioning
- **TypeScript strict mode** — `strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`
- **ES2022 target** — modern JavaScript with Node16 module resolution
- **ESLint 9 flat config** — TypeScript-strict rules with Prettier integration
- **Vitest** — fast test runner with V8 coverage (80% threshold enforced)
- **GitHub Actions CI** — lint, typecheck, test across Node.js 18/20/22 matrix
- **Zod runtime validation** — all configs validated at construction time
- **EventEmitter3** — lightweight typed event system for lifecycle hooks
- **Immutable by default** — readonly properties and return types throughout the API

## Community

Join the Crewspace community to get help, share your projects, and connect with other developers:

- **[Discord](https://discord.gg/crewspace)** — Chat, ask questions, and showcase your agents
- **[GitHub Issues](https://github.com/aviferdman/ProjectX2-Product/issues)** — Bug reports and feature requests
- **[GitHub Discussions](https://github.com/aviferdman/ProjectX2-Product/discussions)** — General Q&A and ideas

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

This project follows the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

Before submitting a PR:

1. Ensure `npm run lint` passes
2. Ensure `npm run typecheck` passes
3. Ensure `npm run test` passes
4. Add tests for new functionality

## Roadmap

Crewspace development follows a phased approach:

- **Phase 1** (current) — OSS TypeScript framework: core API, LLM providers, tool system, CLI
- **Phase 2** — Visual canvas: drag-and-drop workflow builder, real-time debugging
- **Phase 3** — Templates & marketplace: pre-built agent templates, community sharing
- **Phase 4** — Cloud platform: hosted execution, team collaboration, enterprise features

## License

[MIT](./LICENSE) — Crewspace is free and open-source software.
