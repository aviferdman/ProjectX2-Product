/**
 * Tests for TASK-123: Performance Metrics Integration Examples
 *
 * Validates the patterns demonstrated in examples/performance-metrics-integration.ts:
 *   1. Attaching PerformanceMetricsTracker to an Agent via lifecycle events
 *   2. Attaching MetricsCollector to a Crew via lifecycle events
 *   3. Exporting metrics reports to JSON
 *   4. Console visualization helpers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Agent } from '../../src/agent/agent.js';
import { Crew } from '../../src/crew/crew.js';
import {
  PerformanceMetricsTracker,
  ApiCallCategory,
  MetricsCollector,
} from '../../src/metrics/index.js';
import { _resetApiCallIdCounter } from '../../src/metrics/performance-metrics-tracker.js';
import type { LLMProvider, LLMMessage, LLMResponse, TaskResult } from '../../src/types/index.js';
import type {
  PerformanceMetricsReport,
  UnifiedMetricsReport,
  ApiCallSummary,
} from '../../src/metrics/index.js';

const currentFilename = fileURLToPath(import.meta.url);
const currentDirname = dirname(currentFilename);
const PROJECT_ROOT = join(currentDirname, '../../../..');
const EXAMPLES_DIR = join(PROJECT_ROOT, 'examples');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockLLMProvider(content?: string): LLMProvider {
  return {
    name: 'mock-provider',
    generateText: vi
      .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
      .mockResolvedValue({
        content: content ?? 'Mock response',
        tokenUsage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        finishReason: 'stop',
      }),
  };
}

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

function exportPerformanceReport(report: PerformanceMetricsReport): string {
  const serializable = {
    ...report,
    byCategory: Object.fromEntries(report.byCategory),
    byEndpoint: Object.fromEntries(report.byEndpoint),
  };
  return JSON.stringify(serializable, null, 2);
}

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

function renderBar(value: number, maxValue: number, width: number = 30): string {
  const filled = maxValue > 0 ? Math.round((value / maxValue) * width) : 0;
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

// ---------------------------------------------------------------------------
// Example file existence
// ---------------------------------------------------------------------------

describe('TASK-123: Performance Metrics Integration — Example File', () => {
  const examplePath = join(EXAMPLES_DIR, 'performance-metrics-integration.ts');
  let content: string;

  it('should exist at examples/performance-metrics-integration.ts', () => {
    expect(existsSync(examplePath)).toBe(true);
    content = readFileSync(examplePath, 'utf-8');
  });

  it('should import Agent, Crew, and metrics from @crewspace/core', () => {
    expect(content).toContain('Agent');
    expect(content).toContain('Crew');
    expect(content).toContain('PerformanceMetricsTracker');
    expect(content).toContain('MetricsCollector');
    expect(content).toContain('ApiCallCategory');
  });

  it('should demonstrate attaching metrics to an Agent', () => {
    expect(content).toContain('attachMetricsToAgent');
    expect(content).toContain("agent.on('agent:llm:start'");
    expect(content).toContain("agent.on('agent:llm:complete'");
  });

  it('should demonstrate attaching metrics to a Crew', () => {
    expect(content).toContain('attachMetricsToCrew');
    expect(content).toContain("crew.on('crew:task:start'");
    expect(content).toContain("crew.on('crew:task:complete'");
  });

  it('should demonstrate export to JSON', () => {
    expect(content).toContain('exportPerformanceReport');
    expect(content).toContain('exportUnifiedReport');
    expect(content).toContain('JSON.stringify');
  });

  it('should demonstrate visualization', () => {
    expect(content).toContain('visualizePerformanceReport');
    expect(content).toContain('visualizeUnifiedReport');
    expect(content).toContain('renderBar');
  });

  it('should include a file header comment', () => {
    expect(content).toMatch(/^\/\*\*/);
  });

  it('should call crew.run()', () => {
    expect(content).toContain('crew.run()');
  });
});

// ---------------------------------------------------------------------------
// 1. Attach PerformanceMetricsTracker to Agent
// ---------------------------------------------------------------------------

describe('TASK-123: Attach PerformanceMetricsTracker to Agent', () => {
  beforeEach(() => {
    _resetApiCallIdCounter();
  });

  it('should record an LLM API call when agent executes successfully', async () => {
    const tracker = new PerformanceMetricsTracker();
    const agent = new Agent({
      id: 'test-agent',
      role: 'Tester',
      goal: 'Test metrics attachment',
      llmProvider: createMockLLMProvider('Test output'),
    });

    attachMetricsToAgent(agent, tracker);
    await agent.execute({ description: 'Test task' });

    expect(tracker.recordCount).toBe(1);
    const records = tracker.getRecords();
    expect(records[0]!.category).toBe(ApiCallCategory.LLM);
    expect(records[0]!.endpoint).toBe('test-agent');
    expect(records[0]!.success).toBe(true);
    expect(records[0]!.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('should capture token usage from LLM response', async () => {
    const tracker = new PerformanceMetricsTracker();
    const agent = new Agent({
      id: 'token-agent',
      role: 'Token Tester',
      goal: 'Test token tracking',
      llmProvider: createMockLLMProvider('Tokens response'),
    });

    attachMetricsToAgent(agent, tracker);
    await agent.execute({ description: 'Track tokens' });

    const records = tracker.getRecords();
    expect(records[0]!.tokenUsage).toBeDefined();
    expect(records[0]!.tokenUsage!.promptTokens).toBe(100);
    expect(records[0]!.tokenUsage!.completionTokens).toBe(50);
    expect(records[0]!.tokenUsage!.totalTokens).toBe(150);
  });

  it('should record a failed call when agent errors', async () => {
    const tracker = new PerformanceMetricsTracker();
    const failingProvider: LLMProvider = {
      name: 'failing-provider',
      generateText: vi.fn().mockRejectedValue(new Error('LLM failure')),
    };
    const agent = new Agent({
      id: 'fail-agent',
      role: 'Failure Tester',
      goal: 'Test error tracking',
      llmProvider: failingProvider,
    });

    attachMetricsToAgent(agent, tracker);

    await expect(agent.execute({ description: 'Fail' })).rejects.toThrow();

    expect(tracker.recordCount).toBe(1);
    const records = tracker.getRecords();
    expect(records[0]!.success).toBe(false);
    expect(records[0]!.errorMessage).toBe('Agent execution failed');
  });

  it('should track multiple agents independently', async () => {
    const tracker = new PerformanceMetricsTracker();

    const agent1 = new Agent({
      id: 'agent-1',
      role: 'Agent One',
      goal: 'First agent',
      llmProvider: createMockLLMProvider('Response 1'),
    });

    const agent2 = new Agent({
      id: 'agent-2',
      role: 'Agent Two',
      goal: 'Second agent',
      llmProvider: createMockLLMProvider('Response 2'),
    });

    attachMetricsToAgent(agent1, tracker);
    attachMetricsToAgent(agent2, tracker);

    await agent1.execute({ description: 'Task 1' });
    await agent2.execute({ description: 'Task 2' });

    expect(tracker.recordCount).toBe(2);
    const records = tracker.getRecords();
    expect(records[0]!.endpoint).toBe('agent-1');
    expect(records[1]!.endpoint).toBe('agent-2');
  });

  it('should generate a report with category breakdowns', async () => {
    const tracker = new PerformanceMetricsTracker();
    const agent = new Agent({
      id: 'report-agent',
      role: 'Reporter',
      goal: 'Generate report data',
      llmProvider: createMockLLMProvider('Report output'),
    });

    attachMetricsToAgent(agent, tracker);
    await agent.execute({ description: 'Task 1' });
    await agent.execute({ description: 'Task 2' });

    const report = tracker.getReport();
    expect(report.totals.totalCalls).toBe(2);
    expect(report.byCategory.get(ApiCallCategory.LLM)).toBeDefined();
    expect(report.byCategory.get(ApiCallCategory.LLM)!.totalCalls).toBe(2);
    expect(report.byEndpoint.get('report-agent')).toBeDefined();
    expect(report.generatedAt).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// 2. Attach MetricsCollector to Crew
// ---------------------------------------------------------------------------

describe('TASK-123: Attach MetricsCollector to Crew', () => {
  it('should record execution time for each task in the crew', async () => {
    const collector = new MetricsCollector();

    const agent = new Agent({
      id: 'crew-agent',
      role: 'Worker',
      goal: 'Do work',
      llmProvider: createMockLLMProvider('Work done'),
    });

    const crew = new Crew({
      id: 'test-crew',
      agents: [agent],
      tasks: [
        { id: 'task-a', description: 'First task', agentId: 'crew-agent' },
        {
          id: 'task-b',
          description: 'Second task',
          agentId: 'crew-agent',
          dependencies: ['task-a'],
        },
      ],
    });

    attachMetricsToCrew(crew, collector);
    await crew.run();

    const times = collector.getExecutionTimes();
    expect(times.length).toBe(2);
    expect(times[0]!.label).toBe('task-a');
    expect(times[1]!.label).toBe('task-b');
    expect(times[0]!.category).toBe('task');
    expect(times[0]!.success).toBe(true);
  });

  it('should record token usage for each task', async () => {
    const collector = new MetricsCollector();

    const agent = new Agent({
      id: 'token-crew-agent',
      role: 'Worker',
      goal: 'Do work',
      llmProvider: createMockLLMProvider('Done'),
    });

    const crew = new Crew({
      id: 'token-crew',
      agents: [agent],
      tasks: [{ id: 'task-1', description: 'A task', agentId: 'token-crew-agent' }],
    });

    attachMetricsToCrew(crew, collector);
    await crew.run();

    const tokenReport = collector.getTokenEfficiencyReport();
    expect(tokenReport.operationCount).toBe(1);
    expect(tokenReport.totalTokens).toBe(150);
  });

  it('should generate a unified report combining all metrics', async () => {
    const collector = new MetricsCollector();

    const researcher = new Agent({
      id: 'researcher',
      role: 'Researcher',
      goal: 'Research',
      llmProvider: createMockLLMProvider('Research output'),
    });

    const writer = new Agent({
      id: 'writer',
      role: 'Writer',
      goal: 'Write',
      llmProvider: createMockLLMProvider('Written report'),
    });

    const crew = new Crew({
      id: 'unified-crew',
      agents: [researcher, writer],
      tasks: [
        { id: 'research', description: 'Research', agentId: 'researcher' },
        { id: 'write', description: 'Write', agentId: 'writer', dependencies: ['research'] },
      ],
    });

    attachMetricsToCrew(crew, collector);
    await crew.run();

    const report = collector.getReport();
    expect(report.executionTime.count).toBe(2);
    expect(report.executionTime.successCount).toBe(2);
    expect(report.executionTime.byCategory.get('task')).toBeDefined();
    expect(report.tokenEfficiency.operationCount).toBe(2);
    expect(report.generatedAt).toBeTruthy();
  });

  it('should record failure metrics when a task errors', async () => {
    const collector = new MetricsCollector();

    const failProvider: LLMProvider = {
      name: 'fail-provider',
      generateText: vi.fn().mockRejectedValue(new Error('Task failed')),
    };

    const agent = new Agent({
      id: 'fail-crew-agent',
      role: 'Worker',
      goal: 'Fail',
      llmProvider: failProvider,
    });

    const crew = new Crew({
      id: 'fail-crew',
      agents: [agent],
      tasks: [{ id: 'failing-task', description: 'Will fail', agentId: 'fail-crew-agent' }],
    });

    attachMetricsToCrew(crew, collector);

    await expect(crew.run()).rejects.toThrow();

    const times = collector.getExecutionTimes();
    expect(times.length).toBe(1);
    expect(times[0]!.label).toBe('failing-task');
    expect(times[0]!.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. Export metrics to JSON
// ---------------------------------------------------------------------------

describe('TASK-123: Export Metrics to JSON', () => {
  beforeEach(() => {
    _resetApiCallIdCounter();
  });

  it('should export PerformanceMetricsReport as valid JSON', async () => {
    const tracker = new PerformanceMetricsTracker();
    const agent = new Agent({
      id: 'export-agent',
      role: 'Exporter',
      goal: 'Test export',
      llmProvider: createMockLLMProvider('Export data'),
    });

    attachMetricsToAgent(agent, tracker);
    await agent.execute({ description: 'Generate data' });

    const report = tracker.getReport();
    const json = exportPerformanceReport(report);

    const parsed = JSON.parse(json);
    expect(parsed.totals).toBeDefined();
    expect(parsed.totals.totalCalls).toBe(1);
    expect(parsed.byCategory).toBeDefined();
    expect(typeof parsed.byCategory).toBe('object');
    expect(parsed.byCategory[ApiCallCategory.LLM]).toBeDefined();
    expect(parsed.byEndpoint).toBeDefined();
    expect(parsed.generatedAt).toBeTruthy();
  });

  it('should export UnifiedMetricsReport as valid JSON', async () => {
    const collector = new MetricsCollector();

    const agent = new Agent({
      id: 'unified-export-agent',
      role: 'Worker',
      goal: 'Export',
      llmProvider: createMockLLMProvider('Export data'),
    });

    const crew = new Crew({
      id: 'export-crew',
      agents: [agent],
      tasks: [{ id: 'export-task', description: 'A task', agentId: 'unified-export-agent' }],
    });

    attachMetricsToCrew(crew, collector);
    await crew.run();

    const report = collector.getReport();
    const json = exportUnifiedReport(report);

    const parsed = JSON.parse(json);
    expect(parsed.executionTime).toBeDefined();
    expect(parsed.executionTime.count).toBe(1);
    expect(parsed.executionTime.byCategory).toBeDefined();
    expect(typeof parsed.executionTime.byCategory).toBe('object');
    expect(parsed.tokenEfficiency).toBeDefined();
    expect(parsed.generatedAt).toBeTruthy();
  });

  it('should export empty report when no data recorded', () => {
    const tracker = new PerformanceMetricsTracker();
    const report = tracker.getReport();
    const json = exportPerformanceReport(report);

    const parsed = JSON.parse(json);
    expect(parsed.totals.totalCalls).toBe(0);
    expect(Object.keys(parsed.byCategory)).toHaveLength(0);
    expect(Object.keys(parsed.byEndpoint)).toHaveLength(0);
  });

  it('should preserve all report fields through serialization', async () => {
    const tracker = new PerformanceMetricsTracker();
    tracker.recordApiCall({
      category: ApiCallCategory.LLM,
      endpoint: 'gpt-4o',
      durationMs: 500,
      tokenUsage: { promptTokens: 200, completionTokens: 100, totalTokens: 300 },
    });
    tracker.recordApiCall({
      category: ApiCallCategory.TOOL,
      endpoint: 'web-search',
      durationMs: 150,
    });

    const report = tracker.getReport();
    const json = exportPerformanceReport(report);
    const parsed = JSON.parse(json);

    expect(parsed.totals.totalCalls).toBe(2);
    expect(parsed.totals.totalTokens).toBe(300);
    expect(parsed.byCategory[ApiCallCategory.LLM].totalCalls).toBe(1);
    expect(parsed.byCategory[ApiCallCategory.TOOL].totalCalls).toBe(1);
    expect(parsed.byEndpoint['gpt-4o']).toBeDefined();
    expect(parsed.byEndpoint['web-search']).toBeDefined();
    expect(parsed.overallRate).toBeDefined();
    expect(parsed.recentRate).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 4. Console visualization helpers
// ---------------------------------------------------------------------------

describe('TASK-123: Visualization Helpers', () => {
  it('should render a bar chart with correct proportions', () => {
    expect(renderBar(10, 10, 10)).toBe('██████████');
    expect(renderBar(5, 10, 10)).toBe('█████░░░░░');
    expect(renderBar(0, 10, 10)).toBe('░░░░░░░░░░');
    expect(renderBar(0, 0, 10)).toBe('░░░░░░░░░░');
  });

  it('should render a bar at the default width of 30', () => {
    const bar = renderBar(15, 30);
    expect(bar.length).toBe(30);
    expect(bar).toBe('███████████████░░░░░░░░░░░░░░░');
  });

  it('should handle edge cases for bar rendering', () => {
    expect(renderBar(1, 1, 5)).toBe('█████');
    expect(renderBar(1, 100, 10)).toBe('░░░░░░░░░░');
    expect(renderBar(99, 100, 10)).toBe('██████████');
  });
});

// ---------------------------------------------------------------------------
// End-to-end: combined Agent + Crew metrics
// ---------------------------------------------------------------------------

describe('TASK-123: End-to-end Agent + Crew Metrics', () => {
  beforeEach(() => {
    _resetApiCallIdCounter();
  });

  it('should track both agent-level and crew-level metrics in a single workflow', async () => {
    const agentTracker = new PerformanceMetricsTracker();
    const crewCollector = new MetricsCollector();

    const agent1 = new Agent({
      id: 'alpha',
      role: 'Alpha Agent',
      goal: 'Do alpha work',
      llmProvider: createMockLLMProvider('Alpha output'),
    });

    const agent2 = new Agent({
      id: 'beta',
      role: 'Beta Agent',
      goal: 'Do beta work',
      llmProvider: createMockLLMProvider('Beta output'),
    });

    attachMetricsToAgent(agent1, agentTracker);
    attachMetricsToAgent(agent2, agentTracker);

    const crew = new Crew({
      id: 'e2e-crew',
      agents: [agent1, agent2],
      tasks: [
        { id: 'task-alpha', description: 'Alpha task', agentId: 'alpha' },
        {
          id: 'task-beta',
          description: 'Beta task',
          agentId: 'beta',
          dependencies: ['task-alpha'],
        },
      ],
    });

    attachMetricsToCrew(crew, crewCollector);
    const result = await crew.run();

    expect(result.success).toBe(true);

    // Agent-level: 2 LLM calls tracked
    const agentReport = agentTracker.getReport();
    expect(agentReport.totals.totalCalls).toBe(2);
    expect(agentReport.byEndpoint.get('alpha')).toBeDefined();
    expect(agentReport.byEndpoint.get('beta')).toBeDefined();

    // Crew-level: 2 tasks tracked
    const crewReport = crewCollector.getReport();
    expect(crewReport.executionTime.count).toBe(2);
    expect(crewReport.tokenEfficiency.operationCount).toBe(2);

    // Both can be exported
    const agentJson = exportPerformanceReport(agentReport);
    const crewJson = exportUnifiedReport(crewReport);
    expect(() => JSON.parse(agentJson)).not.toThrow();
    expect(() => JSON.parse(crewJson)).not.toThrow();
  });
});
