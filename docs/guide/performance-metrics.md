# Performance Metrics Tracker

The `PerformanceMetricsTracker` provides a unified API for tracking performance across your Crewspace workflows. It captures three key dimensions: **duration**, **token usage**, and **API call metrics** — giving you full observability into agent and crew execution.

## Overview

When building production AI workflows, you need visibility into:

- How long LLM calls take (and their p50/p95/p99 latencies)
- How many tokens are consumed per call and per workflow
- Which endpoints are slowest or have the highest failure rates

The `PerformanceMetricsTracker` collects all of this in a single, lightweight tracker that can be attached to agents, engines, or crews.

## Quick Start

```typescript
import { PerformanceMetricsTracker, ApiCallCategory } from '@crewspace/core';

const tracker = new PerformanceMetricsTracker();

// Record an LLM call with token usage
tracker.recordApiCall({
  category: ApiCallCategory.LLM,
  endpoint: 'gpt-4o',
  durationMs: 1200,
  tokenUsage: { promptTokens: 500, completionTokens: 200, totalTokens: 700 },
});

// Get a full performance report
const report = tracker.getReport();
console.log(`Total calls: ${report.totals.totalCalls}`);
console.log(`Avg latency: ${report.totals.avgDurationMs}ms`);
```

## Recording API Calls

### Manual Recording

Use `recordApiCall()` to record a completed API call with all its metrics:

```typescript
tracker.recordApiCall({
  category: ApiCallCategory.LLM,
  endpoint: 'gpt-4o',
  durationMs: 850,
  tokenUsage: {
    promptTokens: 300,
    completionTokens: 150,
    totalTokens: 450,
  },
  success: true,
  statusCode: 200,
  metadata: { model: 'gpt-4o', temperature: 0.7 },
});
```

The `success` field defaults to `true` if omitted. To record a failed call:

```typescript
tracker.recordApiCall({
  category: ApiCallCategory.HTTP,
  endpoint: 'https://api.example.com/data',
  durationMs: 5000,
  success: false,
  errorMessage: 'Request timed out',
  statusCode: 504,
});
```

### Timer API

For automatic duration measurement, use the timer API:

```typescript
const timer = tracker.startTimer(ApiCallCategory.LLM, 'gpt-4o');

// ... perform the API call ...

const record = timer.stop({
  tokenUsage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
  success: true,
});
```

The timer calculates the duration automatically from when it was started to when `stop()` is called.

::: warning
A timer can only be stopped once. Calling `stop()` a second time throws an error. Check `timer.stopped` if needed.
:::

### Async Timing

For the simplest integration, wrap an async operation with `timeApiCall()`:

```typescript
const result = await tracker.timeApiCall(
  ApiCallCategory.TOOL,
  'web-search',
  async () => {
    return await searchApi.query('AI trends 2025');
  },
);
```

If the function throws, the call is automatically recorded as failed with the error message captured.

## API Call Categories

The `ApiCallCategory` enum classifies calls for grouped analysis:

| Category | Value | Description |
|----------|-------|-------------|
| `LLM` | `'llm'` | LLM text-generation or chat-completion calls |
| `TOOL` | `'tool'` | Tool invocations (web search, file read, etc.) |
| `HTTP` | `'http'` | External HTTP API calls |
| `CUSTOM` | `'custom'` | Custom or uncategorized calls |

```typescript
import { ApiCallCategory } from '@crewspace/core';

// Use categories when recording calls
tracker.recordApiCall({ category: ApiCallCategory.LLM, endpoint: 'gpt-4o', durationMs: 500 });
tracker.recordApiCall({ category: ApiCallCategory.TOOL, endpoint: 'web-search', durationMs: 200 });
tracker.recordApiCall({ category: ApiCallCategory.HTTP, endpoint: '/api/data', durationMs: 150 });
tracker.recordApiCall({ category: ApiCallCategory.CUSTOM, endpoint: 'my-op', durationMs: 80 });
```

## Querying Records

Filter and retrieve recorded calls:

```typescript
// All records
const allRecords = tracker.getRecords();

// By category
const llmCalls = tracker.getRecordsByCategory(ApiCallCategory.LLM);

// By endpoint
const gptCalls = tracker.getRecordsByEndpoint('gpt-4o');

// By time window (last 5 minutes)
const recentCalls = tracker.getRecordsSince(Date.now() - 5 * 60_000);

// Total count
console.log(`Tracked ${tracker.recordCount} calls`);
```

## Reports and Summaries

### Summary Statistics

Get aggregate statistics across all recorded calls:

```typescript
const summary = tracker.getSummary();

console.log(`Total calls:    ${summary.totalCalls}`);
console.log(`Success rate:   ${(summary.successRate * 100).toFixed(1)}%`);
console.log(`Avg duration:   ${summary.avgDurationMs.toFixed(1)}ms`);
console.log(`P95 duration:   ${summary.p95DurationMs.toFixed(1)}ms`);
console.log(`Total tokens:   ${summary.totalTokens}`);
console.log(`Throughput:     ${summary.tokensPerSecond.toFixed(1)} tokens/sec`);
```

### Category and Endpoint Summaries

Drill down into specific categories or endpoints:

```typescript
const llmSummary = tracker.getCategorySummary(ApiCallCategory.LLM);
const gptSummary = tracker.getEndpointSummary('gpt-4o');
```

### Call Rate

Measure call throughput over a time window:

```typescript
// Calls in the last minute (default)
const rate = tracker.getCallRate();
console.log(`${rate.callsPerMinute.toFixed(1)} calls/min`);

// Custom window (last 5 minutes)
const rate5m = tracker.getCallRate(5 * 60_000);
```

### Full Report

Generate a comprehensive performance report with breakdowns:

```typescript
const report = tracker.getReport();

// Overall totals
console.log(`Total calls: ${report.totals.totalCalls}`);

// Breakdown by category
for (const [category, summary] of report.byCategory) {
  console.log(`${category}: ${summary.totalCalls} calls, ${summary.avgDurationMs.toFixed(0)}ms avg`);
}

// Breakdown by endpoint
for (const [endpoint, breakdown] of report.byEndpoint) {
  console.log(`${endpoint}: ${breakdown.summary.totalCalls} calls [${breakdown.category}]`);
}

// Call rates
console.log(`Overall: ${report.overallRate.callsPerMinute.toFixed(1)} calls/min`);
console.log(`Recent:  ${report.recentRate.callsPerMinute.toFixed(1)} calls/min`);
```

## Integration with Agents

Attach a tracker to an agent's lifecycle events for automatic LLM call recording:

```typescript
import { Agent, PerformanceMetricsTracker, ApiCallCategory } from '@crewspace/core';

const tracker = new PerformanceMetricsTracker();
const agent = new Agent({
  id: 'researcher',
  role: 'Research Analyst',
  goal: 'Find key insights on AI trends',
});

const timers = new Map<string, ReturnType<PerformanceMetricsTracker['startTimer']>>();

agent.on('agent:llm:start', (agentId) => {
  timers.set(agentId, tracker.startTimer(ApiCallCategory.LLM, agentId));
});

agent.on('agent:llm:complete', (agentId, response) => {
  const timer = timers.get(agentId);
  if (timer) {
    timer.stop({
      success: true,
      tokenUsage: response.tokenUsage,
    });
    timers.delete(agentId);
  }
});

agent.on('agent:error', (agentId) => {
  const timer = timers.get(agentId);
  if (timer) {
    timer.stop({ success: false, errorMessage: 'Agent execution failed' });
    timers.delete(agentId);
  }
});
```

## Configuration

```typescript
const tracker = new PerformanceMetricsTracker({
  maxRecords: 50_000,  // Max records retained (default: 10,000)
  now: () => Date.now(), // Custom clock (useful for testing)
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxRecords` | `number` | `10_000` | Maximum records retained. Oldest records are evicted when the limit is exceeded. |
| `now` | `() => number` | `Date.now` | Clock function for timestamps. Override for deterministic testing. |

## Exporting Metrics

The report contains `Map` objects, which need conversion for JSON serialization:

```typescript
const report = tracker.getReport();

const serializable = {
  ...report,
  byCategory: Object.fromEntries(report.byCategory),
  byEndpoint: Object.fromEntries(report.byEndpoint),
};

const json = JSON.stringify(serializable, null, 2);
```

## Resetting

Clear all recorded metrics:

```typescript
tracker.reset();
console.log(tracker.recordCount); // 0
```

## See Also

- [API Reference — PerformanceMetricsTracker](../api-reference.md#performancemetricstracker)
- [Benchmarks](./benchmarks.md)
- [Example: Performance Metrics Integration](https://github.com/aviferdman/ProjectX2-Product/blob/main/examples/performance-metrics-integration.ts)
