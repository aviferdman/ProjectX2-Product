# @crewspace/core

Core agent orchestration framework for Crewspace — define and run multi-agent workflows in pure TypeScript.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

## Installation

```bash
npm install @crewspace/core
```

## Overview

`@crewspace/core` provides the foundational building blocks for multi-agent orchestration:

- **Agent** — Define specialized AI agents with roles, goals, and backstories
- **Crew** — Compose agents into collaborative teams
- **Task** — Define units of work with inputs, outputs, and agent assignments
- **Execution Engine** — Event-driven orchestration with lifecycle hooks

## Quick Start

```typescript
import { VERSION } from '@crewspace/core';

console.log(`Crewspace Core v${VERSION}`);
```

> **Note:** The Agent, Crew, and Task APIs are under active development. See the [root README](../../README.md) for the planned API design.

## Dependencies

| Package | Purpose |
|---------|---------|
| [`zod`](https://github.com/colinhacks/zod) | Runtime schema validation for agent/crew/task configs |
| [`eventemitter3`](https://github.com/primus/eventemitter3) | Lightweight event system for the execution engine |

## Development

```bash
# Build
npm run build

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Type-check (includes test files)
npm run typecheck

# Clean build artifacts
npm run clean
```

## API Reference

API documentation will be generated from JSDoc comments as the public API stabilizes.

## License

[MIT](../../LICENSE)
