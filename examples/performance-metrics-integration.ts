/**
 * Crewspace — Performance Metrics Integration Example
 *
 * This example demonstrates how to integrate the performance metrics system
 * with agents and crews for production-grade observability:
 *
 *   1. **Attach to Agent** — track per-agent execution time, token usage,
 *      and LLM call performance using lifecycle events
 *   2. **Attach to Crew** — aggregate metrics across all tasks and agents
 *      in a crew workflow
 *   3. **Export** — serialize metrics to JSON for external dashboards
 *   4. **Visualize** — render a console-based performance summary
 *
 * Key concepts:
 *   - Using PerformanceMetricsTracker with Agent lifecycle events
 *   - Using MetricsCollector with Crew lifecycle events
 *   - Exporting PerformanceMetricsReport and UnifiedMetricsReport as JSON
 *   - Console visualization of metrics with bar charts and tables
 *
 * Prerequisites:
 *   npm install @crewspace/core
 *
 * Usage:
 *   npx tsx examples/performance-metrics-integration.ts
 *
 * Note: This example uses a mock LLM provider for demonstration purposes.
 * Replace it with a real provider (OpenAI, Anthropic, Ollama) for production use.
 */

import {
  Agent,
  Crew,
  PerformanceMetricsTracker,
  MetricsCollector,
  ApiCallCategory,
} from '@crewspace/core';
import type {
  LLMProvider,
  LLMMessage,
  LLMResponse,
  TaskResult,
  PerformanceMetricsReport,
  UnifiedMetricsReport,
  ApiCallSummary,
} from '@crewspace/core';

// ---------------------------------------------------------------------------
// Mock LLM provider with simulated latency
// ---------------------------------------------------------------------------

function createMetricsMockProvider(name: string, latencyMs: number): LLMProvider {
  return {
    name,
    async generateText(messages: readonly LLMMessage[]): Promise<LLMResponse> {
      await new Promise((resolve) => setTimeout(resolve, latencyMs));
      return {
        content: `[${name}] Generated response for: ${messages[messages.length - 1]?.content?.slice(0, 50) ?? 'unknown'}`,
        tokenUsage: {
          promptTokens: 100 + Math.floor(Math.random() * 200),
          completionTokens: 50 + Math.floor(Math.random() * 100),
          totalTokens: 0, // filled below
        },
        finishReason: 'stop',
      };
    },
  };
}

// ---------------------------------------------------------------------------
// 1. Attach PerformanceMetricsTracker to a single Agent
// ---------------------------------------------------------------------------

/**
 * Wires an Agent's lifecycle events to a PerformanceMetricsTracker.
 * Every LLM call is automatically recorded as an API-call metric.
 */
function attachMetricsToAgent(agent: Agent, tracker: PerformanceMetricsTracker): void {
  const timers = new Map<string, ReturnType<PerformanceMetricsTracker['startTimer']>>();

  agent.on('agent:llm:start', (agentId) => {
    const timer = tracker.startTimer(ApiCallCategory.LLM, agentId, { agentId });
    timers.set(agentId, timer);
  });

  agent.on('agent:llm:complete', (agentId, response) => {
    const timer = timers.get(agentId);
    if (timer) {
      timer.stop({
        success: true,
        tokenUsage: response.tokenUsage
          ? {
              promptTokens: response.tokenUsage.promptTokens,
              completionTokens: response.tokenUsage.completionTokens,
              totalTokens: response.tokenUsage.totalTokens,
            }
          : undefined,
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
}

// ---------------------------------------------------------------------------
// 2. Attach MetricsCollector to a Crew
// ---------------------------------------------------------------------------

/**
 * Wires a Crew's lifecycle events to a MetricsCollector.
 * Records execution time for each task and token usage from task results.
 */
function attachMetricsToCrew(crew: Crew, collector: MetricsCollector): void {
  const taskStartTimes = new Map<string, number>();

  crew.on('crew:task:start', (_crewId, taskId) => {
    taskStartTimes.set(taskId, Date.now());
  });

  crew.on('crew:task:complete', (_crewId, taskId, result: TaskResult) => {
    const startTime = taskStartTimes.get(taskId);
    const durationMs = startTime !== undefined ? Date.now() - startTime : result.duration;

    collector.recordExecutionTime({
      label: taskId,
      category: 'task',
      durationMs,
      success: true,
    });

    if (result.tokenUsage) {
      collector.recordTokenUsage({
        operationType: 'llm-call',
        operationId: taskId,
        promptTokens: result.tokenUsage.promptTokens,
        completionTokens: result.tokenUsage.completionTokens,
        totalTokens: result.tokenUsage.totalTokens,
        durationMs,
      });
    }

    taskStartTimes.delete(taskId);
  });

  crew.on('crew:task:error', (_crewId, taskId) => {
    const startTime = taskStartTimes.get(taskId);
    const durationMs = startTime !== undefined ? Date.now() - startTime : 0;

    collector.recordExecutionTime({
      label: taskId,
      category: 'task',
      durationMs,
      success: false,
    });

    taskStartTimes.delete(taskId);
  });
}

// ---------------------------------------------------------------------------
// 3. Export metrics to JSON
// ---------------------------------------------------------------------------

/**
 * Serialize a PerformanceMetricsReport to a JSON-friendly object.
 * Maps are converted to plain objects for standard JSON output.
 */
function exportPerformanceReport(report: PerformanceMetricsReport): string {
  const serializable = {
    ...report,
    byCategory: Object.fromEntries(report.byCategory),
    byEndpoint: Object.fromEntries(report.byEndpoint),
  };
  return JSON.stringify(serializable, null, 2);
}

/**
 * Serialize a UnifiedMetricsReport to a JSON-friendly object.
 */
function exportUnifiedReport(report: UnifiedMetricsReport): string {
  const serializable = {
    ...report,
    executionTime: {
      ...report.executionTime,
      byCategory: Object.fromEntries(report.executionTime.byCategory),
    },
  };
  return JSON.stringify(serializable, null, 2);
}

// ---------------------------------------------------------------------------
// 4. Console visualization
// ---------------------------------------------------------------------------

function renderBar(value: number, maxValue: number, width: number = 30): string {
  const filled = maxValue > 0 ? Math.round((value / maxValue) * width) : 0;
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function visualizeApiCallSummary(label: string, summary: ApiCallSummary): void {
  console.log(`\n  ${label}`);
  console.log(`  ${'─'.repeat(50)}`);
  console.log(`  Total calls:   ${String(summary.totalCalls)}`);
  console.log(`  Success rate:  ${(summary.successRate * 100).toFixed(1)}%`);
  console.log(`  Avg duration:  ${summary.avgDurationMs.toFixed(1)}ms`);
  console.log(`  P50 duration:  ${summary.p50DurationMs.toFixed(1)}ms`);
  console.log(`  P95 duration:  ${summary.p95DurationMs.toFixed(1)}ms`);
  console.log(`  P99 duration:  ${summary.p99DurationMs.toFixed(1)}ms`);
  if (summary.totalTokens > 0) {
    console.log(`  Total tokens:  ${String(summary.totalTokens)}`);
    console.log(`  Throughput:    ${summary.tokensPerSecond.toFixed(1)} tokens/sec`);
  }
}

function visualizePerformanceReport(report: PerformanceMetricsReport): void {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║          Performance Metrics Report                 ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  visualizeApiCallSummary('Overall Totals', report.totals);

  console.log('\n  Call Rate');
  console.log(`  ${'─'.repeat(50)}`);
  console.log(`  Overall:  ${report.overallRate.callsPerMinute.toFixed(1)} calls/min`);
  console.log(`  Recent:   ${report.recentRate.callsPerMinute.toFixed(1)} calls/min`);

  if (report.byCategory.size > 0) {
    console.log('\n  By Category');
    console.log(`  ${'─'.repeat(50)}`);
    const maxCalls = Math.max(...[...report.byCategory.values()].map((s) => s.totalCalls));
    for (const [category, summary] of report.byCategory) {
      const bar = renderBar(summary.totalCalls, maxCalls, 20);
      console.log(
        `  ${category.padEnd(10)} ${bar} ${String(summary.totalCalls)} calls (${summary.avgDurationMs.toFixed(0)}ms avg)`,
      );
    }
  }

  if (report.byEndpoint.size > 0) {
    console.log('\n  By Endpoint');
    console.log(`  ${'─'.repeat(50)}`);
    for (const [endpoint, breakdown] of report.byEndpoint) {
      console.log(
        `  ${endpoint}: ${String(breakdown.summary.totalCalls)} calls, ${breakdown.summary.avgDurationMs.toFixed(0)}ms avg [${breakdown.category}]`,
      );
    }
  }
}

function visualizeUnifiedReport(report: UnifiedMetricsReport): void {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║            Unified Metrics Report                   ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  const et = report.executionTime;
  console.log('\n  Execution Time');
  console.log(`  ${'─'.repeat(50)}`);
  console.log(`  Operations:  ${String(et.count)}`);
  console.log(`  Total:       ${et.totalMs.toFixed(1)}ms`);
  console.log(`  Average:     ${et.avgMs.toFixed(1)}ms`);
  console.log(`  Min:         ${et.minMs.toFixed(1)}ms`);
  console.log(`  Max:         ${et.maxMs.toFixed(1)}ms`);
  console.log(`  P50:         ${et.p50Ms.toFixed(1)}ms`);
  console.log(`  P95:         ${et.p95Ms.toFixed(1)}ms`);
  console.log(`  Success:     ${String(et.successCount)}/${String(et.count)}`);

  if (et.byCategory.size > 0) {
    console.log('\n  Execution Time by Category');
    console.log(`  ${'─'.repeat(50)}`);
    const maxDuration = Math.max(...[...et.byCategory.values()].map((c) => c.totalMs));
    for (const [, cat] of et.byCategory) {
      const bar = renderBar(cat.totalMs, maxDuration, 20);
      console.log(
        `  ${cat.category.padEnd(10)} ${bar} ${cat.totalMs.toFixed(0)}ms total (${String(cat.count)} ops)`,
      );
    }
  }

  const te = report.tokenEfficiency;
  if (te.operationCount > 0) {
    console.log('\n  Token Efficiency');
    console.log(`  ${'─'.repeat(50)}`);
    console.log(`  Records:     ${String(te.operationCount)}`);
    console.log(`  Tokens:      ${String(te.totalTokens)}`);
    console.log(`  Throughput:  ${te.avgTokensPerSecond.toFixed(1)} tokens/sec`);
  }

  console.log(`\n  Generated at: ${report.generatedAt}`);
}

// ---------------------------------------------------------------------------
// Main: run the example
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('=== Crewspace Performance Metrics Integration Example ===\n');

  // Create trackers
  const agentTracker = new PerformanceMetricsTracker();
  const crewCollector = new MetricsCollector();

  // Create agents
  const researcher = new Agent({
    id: 'researcher',
    role: 'Research Analyst',
    goal: 'Find key insights on AI trends',
    llmProvider: createMetricsMockProvider('researcher-llm', 50),
  });

  const writer = new Agent({
    id: 'writer',
    role: 'Content Writer',
    goal: 'Write clear and concise technical summaries',
    llmProvider: createMetricsMockProvider('writer-llm', 80),
  });

  const reviewer = new Agent({
    id: 'reviewer',
    role: 'Quality Reviewer',
    goal: 'Review content for accuracy and completeness',
    llmProvider: createMetricsMockProvider('reviewer-llm', 30),
  });

  // Attach performance metrics trackers to agents
  attachMetricsToAgent(researcher, agentTracker);
  attachMetricsToAgent(writer, agentTracker);
  attachMetricsToAgent(reviewer, agentTracker);

  // Build a crew with task dependencies
  const crew = new Crew({
    id: 'metrics-demo-crew',
    name: 'Metrics Demo Crew',
    agents: [researcher, writer, reviewer],
    tasks: [
      {
        id: 'research',
        description: 'Research the latest trends in AI observability and monitoring',
        agentId: 'researcher',
      },
      {
        id: 'write-report',
        description: 'Write a technical summary of the research findings',
        agentId: 'writer',
        dependencies: ['research'],
      },
      {
        id: 'review',
        description: 'Review the report for accuracy and completeness',
        agentId: 'reviewer',
        dependencies: ['write-report'],
      },
    ],
  });

  // Attach metrics collector to crew
  attachMetricsToCrew(crew, crewCollector);

  // Run the workflow
  console.log('Running crew workflow...\n');
  const result = await crew.run();

  console.log(`Crew finished: ${String(result.success)} (${String(result.duration)}ms)`);
  console.log(`Tasks completed: ${String(result.taskResults.size)}`);

  // Generate and visualize the agent-level performance report
  const perfReport = agentTracker.getReport();
  visualizePerformanceReport(perfReport);

  // Generate and visualize the crew-level unified report
  const unifiedReport = crewCollector.getReport();
  visualizeUnifiedReport(unifiedReport);

  // Export to JSON
  console.log('\n=== Exported JSON (Agent Performance) ===');
  const perfJson = exportPerformanceReport(perfReport);
  console.log(perfJson.slice(0, 500) + '\n... (truncated)');

  console.log('\n=== Exported JSON (Crew Unified Metrics) ===');
  const unifiedJson = exportUnifiedReport(unifiedReport);
  console.log(unifiedJson.slice(0, 500) + '\n... (truncated)');

  console.log('\n✅ Performance metrics integration example complete.');
}

main().catch((error) => {
  console.error('Error running example:', error);
  process.exit(1);
});
