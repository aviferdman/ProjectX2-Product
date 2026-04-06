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

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`@crewspace/core`](./packages/core) | `0.1.0` | Core agent orchestration — Agent, Crew, Task types and execution engine |

## Quick Start

### Install

```bash
npm install @crewspace/core
```

### Define an Agent

```typescript
import { Agent, Crew } from '@crewspace/core';

// Define a specialized agent
const researcher = new Agent({
  name: 'researcher',
  role: 'Research Analyst',
  goal: 'Find and summarize relevant information',
  backstory: 'You are an expert researcher with deep analytical skills.',
});

// Create a crew of agents
const crew = new Crew({
  name: 'research-team',
  agents: [researcher],
  tasks: [
    {
      description: 'Research the latest trends in AI agent frameworks',
      agent: researcher,
    },
  ],
});

// Execute the workflow
const result = await crew.run();
console.log(result);
```

> **Note:** The Agent and Crew APIs are under active development. The example above shows the intended API design — implementation is in progress.

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
│       ├── src/            # Source code
│       ├── tests/          # Unit & integration tests
│       ├── package.json    # Package config & dependencies
│       └── tsconfig.json   # Package-level TypeScript config
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

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines (coming soon).

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
