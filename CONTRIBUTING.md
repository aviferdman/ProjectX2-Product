# Contributing to Crewspace

Thank you for contributing to Crewspace! This guide covers development workflow, coding standards, and performance requirements.

## Getting Started

```bash
# Clone and install
git clone https://github.com/aviferdman/ProjectX2-Product.git
cd ProjectX2-Product
npm install

# Build all packages
npm run build

# Run tests
npm test

# Run linting
npm run lint
```

## Development Workflow

1. Create a feature branch from `main`
2. Make your changes with tests
3. Ensure all checks pass: `npm run lint && npm run typecheck && npm test`
4. Run performance benchmarks: `npm run bench --workspace=packages/core`
5. Submit a pull request

---

## Performance Budgets

Crewspace enforces performance budgets to prevent regressions. All benchmarks run in CI on every push and pull request.

### Budget Thresholds

| Operation | Budget (p95) | Description |
|---|---|---|
| Agent initialization | **< 100ms** | Constructing an Agent with full config (tools, LLM provider, backstory) |
| Task initialization | **< 100ms** | Constructing a Task with full config (dependencies, metadata, context) |
| Memory add | **< 50ms** | Adding an entry to ShortTermMemory (even with 100+ existing entries) |
| Memory get | **< 50ms** | Retrieving an entry by ID from ShortTermMemory (500 entries) |
| Memory query | **< 50ms** | Querying with namespace/metadata filters (500 entries) |
| Memory search | **< 50ms** | Text search across memory entries (500 entries) |
| Tool invocation | **< 50ms** | ToolExecutor.execute with permission check and Zod validation |
| Engine initialization | **< 100ms** | Constructing an ExecutionEngine with config |
| Engine run (sequential) | **< 5s** | Running 10 tasks sequentially with mock LLM |
| Engine run (parallel) | **< 5s** | Running 5 tasks in parallel with mock LLM |

### Running Benchmarks

```bash
# Run all benchmarks
npm run bench --workspace=packages/core

# Run benchmarks with JSON output (CI mode)
npm run bench:ci --workspace=packages/core
```

### Benchmark Architecture

Benchmarks live in `packages/core/benchmarks/` and use vitest as the test runner with a custom `measurePerformance()` utility that collects:

- **Iterations**: Number of measured runs (after warmup)
- **Percentiles**: p50, p95, p99 latency
- **Throughput**: Operations per second
- **Budget compliance**: Pass/fail against the budget threshold

Each benchmark file focuses on one subsystem:

| File | Subsystem |
|---|---|
| `agent-init.bench.ts` | Agent construction and prompt building |
| `memory-ops.bench.ts` | ShortTermMemory CRUD and search |
| `tool-invocation.bench.ts` | ToolExecutor, ToolRegistry, validation |
| `task-execution.bench.ts` | Task construction, Engine sequential/parallel |

### Adding New Benchmarks

1. Create a new `*.bench.ts` file in `packages/core/benchmarks/`
2. Import `measurePerformance` and `formatResult` from `./helpers.js`
3. Add a budget constant in `helpers.ts` → `PERFORMANCE_BUDGETS`
4. Use the pattern:

```typescript
import { describe, it, expect } from 'vitest';
import { measurePerformance, formatResult, PERFORMANCE_BUDGETS } from './helpers.js';

describe('My Benchmarks', () => {
  it('should do X within budget', async () => {
    const result = await measurePerformance(
      'Descriptive name',
      async () => {
        // Code to benchmark
      },
      { iterations: 1000, budget: PERFORMANCE_BUDGETS.myBudget },
    );

    console.log(formatResult(result));
    expect(result.withinBudget).toBe(true);
  });
});
```

### Performance Regression Policy

- **< 5% regression**: Acceptable (within measurement noise)
- **5-15% regression**: Requires justification in PR description
- **> 15% regression**: Must be fixed before merging, or budget updated with team approval

### Regression Detection in CI

The CI pipeline automatically compares benchmark results against a committed baseline (`packages/core/benchmarks/baseline.json`). If any benchmark's p95 latency regresses beyond 15%, the CI check fails.

**Available scripts:**

```bash
# Run benchmarks and check for regressions against baseline
npm run bench --workspace=packages/core
npm run bench:compare --workspace=packages/core

# Generate a performance dashboard report (markdown)
npm run bench:report --workspace=packages/core

# Update the baseline after intentional performance changes
npm run bench --workspace=packages/core
npm run bench:update-baseline --workspace=packages/core
```

**Updating the baseline:**

When performance characteristics change intentionally (e.g., adding features that add overhead), update the baseline:

1. Run benchmarks: `npm run bench --workspace=packages/core`
2. Update baseline: `npm run bench:update-baseline --workspace=packages/core`
3. Commit the updated `benchmarks/baseline.json`
4. Document the reason in your PR description

### Performance Dashboard

A markdown performance report is generated on every CI run and uploaded as an artifact. The report includes:

- Per-category benchmark results (Agent, Memory, Task, Engine, Tool)
- Trend indicators compared to baseline (🚀 faster, ✅ stable, 🐢 slower, 🆕 new)
- Budget compliance status

Benchmark results are uploaded as CI artifacts for historical tracking. Compare results across runs to identify trends.

---

## Coding Standards

- TypeScript strict mode
- Prettier for formatting
- ESLint for linting
- Vitest for testing
- Minimum 80% code coverage

## Versioning & API Stability

Crewspace follows [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking API changes
- **MINOR**: New features, backward-compatible
- **PATCH**: Bug fixes, backward-compatible

See the deprecation utilities in `src/deprecation/` for safe API evolution patterns.
