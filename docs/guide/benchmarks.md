# Benchmarks

Crewspace maintains a comprehensive benchmark suite to track performance
across releases and prevent regressions. This page documents our latest
benchmark results and the methodology used to produce them.

## Summary

- **Total benchmarks:** 37
- **Passing:** 37 / 37
- **Budget compliance:** ✅ All within budget
- **Baseline timestamp:** 2026-04-06T15:55:00.000Z

## Methodology

### Measurement Approach

Each benchmark follows a rigorous, repeatable protocol:

1. **Setup** — Initialize fixtures (agents, tasks, memory stores) once before measurement.
2. **Warmup** — Execute 10 warm-up iterations (discarded) to allow JIT compilation and cache warming.
3. **Measured runs** — Execute 1,000–10,000 iterations (depending on operation cost), recording `performance.now()` timestamps for each run.
4. **Statistical analysis** — Sort all timings and compute:
   - **Average (mean)** — Sum of all timings divided by iteration count.
   - **p50 (median)** — 50th percentile latency; represents typical performance.
   - **p95** — 95th percentile latency; used for budget enforcement.
   - **p99** — 99th percentile latency; captures worst-case tail latency.
   - **Operations per second** — Computed as `1000 / avgMs`.
5. **Teardown** — Clean up any resources created during setup.

### Performance Budgets

Every benchmark has an explicit **p95 latency budget**. A benchmark passes
if its 95th-percentile latency is at or below the budget. Budgets are
conservative upper bounds, not targets — actual performance is typically
well below the budget threshold.

| Category | Budget | Rationale |
|----------|--------|-----------|
| Agent initialization | 100 ms | Agents are created at startup; must be fast enough for interactive use. |
| Task initialization | 100 ms | Tasks are created dynamically; budget matches agent init. |
| Memory operations | 50 ms | Memory is accessed on every agent turn; must be low-latency. |
| Tool invocation | 50 ms | Tool overhead must be negligible compared to tool execution time. |
| Engine initialization | 100 ms | Engine is created once per workflow. |
| Engine execution (workflow) | 5,000 ms | Full workflow execution including task scheduling overhead. |

### Regression Detection

Benchmark results are compared against a committed baseline (stored in
`packages/core/benchmarks/baseline.json`). The CI pipeline flags:

- **Warning** (>5% regression) — PR description must justify the change.
- **Regression** (>15% regression) — PR is blocked until fixed or baseline is updated with team approval.
- **Improvement** (>5% faster) — Automatically noted in the CI summary.

### Environment

- **Runtime:** Node.js 18+ with V8 JIT compilation
- **LLM providers:** Mock providers with zero network latency (isolates framework overhead)
- **Test runner:** Vitest with custom `measurePerformance()` harness
- **Timing:** `performance.now()` high-resolution timestamps

## Results

### Agent Initialization

| Benchmark | Avg (ms) | p50 (ms) | p95 (ms) | p99 (ms) | Ops/sec | Budget (ms) | Status |
|-----------|----------|----------|----------|----------|---------|-------------|--------|
| Agent init (minimal config) | 0.010 | 0.008 | 0.017 | 0.063 | 99.7K | 100 | ✅ |
| Agent init (with backstory) | 0.007 | 0.006 | 0.011 | 0.038 | 134.6K | 100 | ✅ |
| Agent init (5 tools) | 0.014 | 0.006 | 0.028 | 0.060 | 73.1K | 100 | ✅ |
| Agent init (with LLM provider) | 0.007 | 0.005 | 0.007 | 0.025 | 137.8K | 100 | ✅ |
| Agent init (full config, 10 tools) | 0.020 | 0.011 | 0.037 | 0.086 | 50.9K | 100 | ✅ |
| Agent.buildSystemPrompt (10 tools) | 0.002 | 0.002 | 0.002 | 0.003 | 535.2K | 100 | ✅ |

### Task Lifecycle

| Benchmark | Avg (ms) | p50 (ms) | p95 (ms) | p99 (ms) | Ops/sec | Budget (ms) | Status |
|-----------|----------|----------|----------|----------|---------|-------------|--------|
| Task init (minimal config) | 0.010 | 0.008 | 0.017 | 0.053 | 100.6K | 100 | ✅ |
| Task init (full config) | 0.012 | 0.010 | 0.026 | 0.057 | 86.7K | 100 | ✅ |
| Task state transitions (full lifecycle) | 0.006 | 0.005 | 0.008 | 0.019 | 154.7K | 100 | ✅ |
| Task.toTaskInput() | 0.001 | 0.000 | 0.001 | 0.002 | 1.9M | 100 | ✅ |

### Execution Engine

| Benchmark | Avg (ms) | p50 (ms) | p95 (ms) | p99 (ms) | Ops/sec | Budget (ms) | Status |
|-----------|----------|----------|----------|----------|---------|-------------|--------|
| Engine init (minimal config) | 0.005 | 0.005 | 0.006 | 0.016 | 210.0K | 100 | ✅ |
| Engine run (5 sequential tasks) | 0.104 | 0.099 | 0.154 | 0.444 | 9.6K | 5000 | ✅ |
| Engine run (10 sequential tasks) | 0.172 | 0.176 | 0.257 | 0.555 | 5.8K | 5000 | ✅ |
| Engine run (5 parallel tasks) | 0.070 | 0.062 | 0.140 | 0.441 | 14.4K | 5000 | ✅ |
| Engine run (5 tasks, dependency chain) | 0.059 | 0.049 | 0.081 | 0.548 | 17.0K | 5000 | ✅ |
| Engine run (5 tasks, before/after hooks) | 0.087 | 0.079 | 0.106 | 0.593 | 11.5K | 5000 | ✅ |

### Memory Operations

| Benchmark | Avg (ms) | p50 (ms) | p95 (ms) | p99 (ms) | Ops/sec | Budget (ms) | Status |
|-----------|----------|----------|----------|----------|---------|-------------|--------|
| Memory add (empty store) | 0.009 | 0.007 | 0.012 | 0.051 | 105.6K | 50 | ✅ |
| Memory add (100 existing entries) | 0.008 | 0.008 | 0.012 | 0.052 | 118.0K | 50 | ✅ |
| Memory get (500 entries, lookup by ID) | 0.001 | 0.000 | 0.001 | 0.001 | 2.0M | 50 | ✅ |
| Memory get (miss, 500 entries) | 0.001 | 0.000 | 0.001 | 0.003 | 1.9M | 50 | ✅ |
| Memory query (500 entries, no filters) | 0.458 | 0.405 | 0.677 | 0.911 | 2.2K | 50 | ✅ |
| Memory query (500 entries, namespace filter) | 0.423 | 0.403 | 0.596 | 0.756 | 2.4K | 50 | ✅ |
| Memory query (500 entries, metadata filter) | 0.428 | 0.402 | 0.575 | 0.881 | 2.3K | 50 | ✅ |
| Memory search (500 entries, text match) | 0.539 | 0.515 | 0.830 | 1.127 | 1.9K | 50 | ✅ |
| Memory search (500 entries, no matches) | 0.696 | 0.661 | 0.961 | 1.281 | 1.4K | 50 | ✅ |
| Memory count (500 entries) | 0.000 | 0.000 | 0.001 | 0.001 | 2.6M | 50 | ✅ |
| Memory delete (from 2000 entries) | 0.001 | 0.001 | 0.001 | 0.001 | 1.7M | 50 | ✅ |

### Tool System

| Benchmark | Avg (ms) | p50 (ms) | p95 (ms) | p99 (ms) | Ops/sec | Budget (ms) | Status |
|-----------|----------|----------|----------|----------|---------|-------------|--------|
| Tool execute (simple, no validation) | 0.002 | 0.002 | 0.003 | 0.007 | 451.7K | 50 | ✅ |
| Tool execute (with Zod validation) | 0.012 | 0.007 | 0.022 | 0.108 | 86.0K | 50 | ✅ |
| Tool execute (complex schema validation) | 0.013 | 0.008 | 0.028 | 0.066 | 77.4K | 50 | ✅ |
| Tool execute (with registry, 21 tools) | 0.002 | 0.002 | 0.002 | 0.003 | 641.7K | 50 | ✅ |
| ToolExecutor construction | 0.001 | 0.000 | 0.001 | 0.001 | 1.5M | 50 | ✅ |
| ToolRegistry.register (to 1000 tools) | 0.025 | 0.018 | 0.038 | 0.152 | 40.1K | 50 | ✅ |
| ToolRegistry.get (100 tools) | 0.000 | 0.000 | 0.000 | 0.000 | 2.7M | 50 | ✅ |

### Framework Overhead Comparison

The following table shows the overhead of each framework running an identical
3-task "Research Assistant" workflow with mock LLM responses (zero network latency).

| Framework | Avg (ms) | p95 (ms) | Ops/sec | Budget (ms) | Status |
|-----------|----------|----------|---------|-------------|--------|
| Crewspace | 0.200 | 0.297 | 5.0K | 5000 | ✅ |
| LangChain.js | 0.018 | 0.051 | 57.0K | 5000 | ✅ |
| CrewAI | 0.045 | 0.150 | 22.1K | 5000 | ✅ |

### Cross-Framework Comparison

| Benchmark | Avg (ms) | p50 (ms) | p95 (ms) | p99 (ms) | Ops/sec | Budget (ms) | Status |
|-----------|----------|----------|----------|----------|---------|-------------|--------|
| Crewspace: Research Assistant Workflow | 0.200 | 0.165 | 0.297 | 0.836 | 5.0K | 5000 | ✅ |
| LangChain.js: Research Assistant Workflow | 0.018 | 0.010 | 0.051 | 0.161 | 57.0K | 5000 | ✅ |
| CrewAI: Research Assistant Workflow | 0.045 | 0.032 | 0.150 | 0.251 | 22.1K | 5000 | ✅ |

## Running Benchmarks

To reproduce these results locally:

```bash
# Install dependencies
npm install

# Run the full benchmark suite
cd packages/core
npm run bench

# Compare against baseline
npm run bench:compare

# Generate a performance report
npm run bench:report

# Update baseline (requires team approval)
npm run bench:update-baseline
```

### Regenerating This Page

This documentation is generated from benchmark data. To regenerate:

```bash
npx tsx scripts/generate-benchmark-docs.ts
```

## Cross-Framework Comparison Methodology

The comparison benchmarks run an identical "Research Assistant" workflow
across three frameworks:

- **Crewspace** — native implementation using the `@crewspace/core` API
- **LangChain.js** — behavioral shim replicating the LangChain.js execution model
- **CrewAI** — behavioral shim replicating the CrewAI execution model

All frameworks:

1. Use mock LLM providers returning deterministic responses (zero network latency).
2. Execute three tasks in sequence: **Search → Analyze → Write Report**.
3. Use the same agent specifications (Researcher, Analyst, Writer).
4. Produce structurally equivalent output verified by assertion.

This isolates **framework overhead** — the time spent on orchestration,
task scheduling, and inter-agent communication — from LLM inference time.

::: info
LangChain.js and CrewAI results use behavioral shims that replicate the
execution patterns of those frameworks without importing their actual
dependencies. This measures architectural overhead patterns, not exact
library performance.
:::
