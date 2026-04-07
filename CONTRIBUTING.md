# Contributing to Crewspace

Thank you for your interest in contributing to Crewspace! Whether you're fixing a bug, proposing a feature, improving documentation, or writing tests, every contribution matters. This guide covers how to get started, our development workflow, coding standards, and performance requirements.

Please note that this project is released with a [Contributor Code of Conduct](./CODE_OF_CONDUCT.md). By participating in this project, you agree to abide by its terms.

## Table of Contents

- [Getting Started](#getting-started)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)
- [Development Workflow](#development-workflow)
- [Commit Message Format](#commit-message-format)
- [Pull Request Process](#pull-request-process)
- [First-Time Contributors](#first-time-contributors)
- [Performance Budgets](#performance-budgets)
- [Coding Standards](#coding-standards)
- [Versioning & API Stability](#versioning--api-stability)
- [Getting Help](#getting-help)

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

## Reporting Bugs

Found a bug? We appreciate your help in making Crewspace better.

1. **Search existing issues** — Check [open issues](https://github.com/aviferdman/ProjectX2-Product/issues) to see if it's already reported.
2. **Open a bug report** — Use the [Bug Report template](https://github.com/aviferdman/ProjectX2-Product/issues/new?template=bug_report.md) and include:
   - A clear description of the problem
   - Minimal code to reproduce the issue
   - Expected vs. actual behavior
   - Your environment (Node.js version, OS, Crewspace version)

## Requesting Features

Have an idea for a new feature or improvement?

1. **Search existing issues** — Someone may have already suggested it.
2. **Open a feature request** — Use the [Feature Request template](https://github.com/aviferdman/ProjectX2-Product/issues/new?template=feature_request.md) and include:
   - The problem the feature would solve
   - A proposed API or usage example
   - Alternatives you've considered

## Development Workflow

1. Fork the repository and clone your fork
2. Create a feature branch from `main`: `git checkout -b feat/my-feature`
3. Make your changes with tests
4. Ensure all checks pass: `npm run lint && npm run typecheck && npm test`
5. Run performance benchmarks if you changed core logic: `npm run bench --workspace=packages/core`
6. Commit using the [commit message format](#commit-message-format)
7. Push to your fork and submit a pull request

---

## Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/) to keep the history readable and enable automated changelog generation.

```
<type>(<scope>): <short summary>

<optional body>

<optional footer>
```

**Types:**

| Type | When to use |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only changes |
| `test` | Adding or updating tests |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `chore` | Build process, CI, tooling changes |

**Examples:**

```
feat(agent): add backstory validation on construction
fix(memory): prevent duplicate entries with same ID
docs(readme): add LLM provider comparison table
test(tool): add permission boundary tests for ToolExecutor
```

## Pull Request Process

1. Fill out the [PR template](.github/PULL_REQUEST_TEMPLATE.md) completely.
2. Link any related issues using `Closes #123` in the PR description.
3. Ensure CI passes — the pipeline runs lint, typecheck, tests, and benchmarks.
4. Request a review. At least one maintainer approval is required to merge.
5. Address review feedback by pushing additional commits (do not force-push during review).
6. Once approved, a maintainer will squash-merge your PR.

**PR size guidelines:**

- **Small** (< 200 lines) — preferred; faster to review
- **Medium** (200–500 lines) — acceptable for features
- **Large** (> 500 lines) — split into smaller PRs when possible

## First-Time Contributors

New to Crewspace? Welcome! Here's how to find your first contribution:

1. Look for issues labeled [`good first issue`](https://github.com/aviferdman/ProjectX2-Product/labels/good%20first%20issue) — these are beginner-friendly tasks.
2. Issues labeled [`help wanted`](https://github.com/aviferdman/ProjectX2-Product/labels/help%20wanted) are open for community contributions.
3. Documentation improvements are always welcome and don't require deep framework knowledge.
4. Writing or improving tests is a great way to learn the codebase.

If you get stuck, open a [question issue](https://github.com/aviferdman/ProjectX2-Product/issues/new?template=question.md) or comment on the issue you're working on.

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

All breaking changes go through a deprecation period before removal. See the full [Deprecation Policy](./docs/guide/deprecation-policy.md) for details on the deprecation lifecycle, runtime warnings, and migration guidelines.

The deprecation utilities in `packages/core/src/deprecation/` provide runtime warnings, function wrappers, and method decorators for safe API evolution.

### CI Semver Enforcement

The CI pipeline includes an automated semver compliance check (`npm run semver:check`) that compares the current public API surface against a committed baseline. If exports are removed or changed in a way that breaks consumers, the check fails.

To acknowledge an intentional breaking change:

1. Bump the version appropriately (minor for pre-1.0, major for post-1.0)
2. Run `npm run semver:update` to regenerate the baseline
3. Commit the updated baseline alongside the breaking change

### Safe API Evolution

For patterns and examples on how to evolve the API without breaking consumers, see the [API Evolution Patterns](./docs/guide/api-evolution-patterns.md) guide.

## Getting Help

- **Discord:** Join us on [Discord](https://discord.gg/crewspace) — the `#help` forum and `#contributing` channel are great places to ask questions
- **Bug reports & feature requests:** [GitHub Issues](https://github.com/aviferdman/ProjectX2-Product/issues)
- **Questions:** Open a [question issue](https://github.com/aviferdman/ProjectX2-Product/issues/new?template=question.md)
- **Code of Conduct:** [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)

Thank you for helping make Crewspace better! 🚀

