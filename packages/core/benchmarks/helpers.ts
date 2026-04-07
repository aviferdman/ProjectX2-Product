/**
 * Shared helpers for performance benchmarks.
 *
 * Provides mock factories and timing utilities used across all benchmark files.
 *
 * @packageDocumentation
 */

import { appendFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Agent } from '../src/agent/agent.js';
import { Task } from '../src/task/task.js';
import { createMemoryEntry, ShortTermMemory } from '../src/memory/index.js';
import { PermissionManager, ALLOW_ALL_POLICY } from '../src/tool/permission-manager.js';
import { ToolExecutor } from '../src/tool/tool-executor.js';
import { ExecutionEngine } from '../src/engine/execution-engine.js';
import { ExecutionStrategy } from '../src/engine/index.js';
import { MemoryNamespace, MemoryRole, TaskPriority } from '../src/types/index.js';
import type { LLMProvider, LLMMessage, LLMResponse, Tool } from '../src/types/index.js';

// ---------------------------------------------------------------------------
// Result collection — writes each benchmark result to a JSONL file for
// downstream regression detection and dashboard generation.
// ---------------------------------------------------------------------------

const BENCH_DIR = dirname(fileURLToPath(import.meta.url));
const RESULTS_FILE = resolve(BENCH_DIR, '..', 'benchmark-results-detailed.jsonl');

function collectResult(result: BenchmarkResult): void {
  try {
    appendFileSync(RESULTS_FILE, JSON.stringify(result) + '\n', 'utf-8');
  } catch {
    // Best-effort — do not fail benchmarks if collection fails
  }
}

// ---------------------------------------------------------------------------
// Performance budgets (max allowed time in milliseconds)
// ---------------------------------------------------------------------------

export const PERFORMANCE_BUDGETS = {
  agentInit: 100,
  taskInit: 100,
  memoryAdd: 50,
  memoryGet: 50,
  memoryQuery: 50,
  memorySearch: 50,
  toolInvocation: 50,
  engineInit: 100,
  engineSequentialRun: 5000,
  engineParallelRun: 5000,
} as const;

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

export function createMockLLMProvider(latencyMs = 0, response?: Partial<LLMResponse>): LLMProvider {
  return {
    name: 'bench-mock-provider',
    async generateText(_messages: readonly LLMMessage[]): Promise<LLMResponse> {
      if (latencyMs > 0) {
        await new Promise((r) => setTimeout(r, latencyMs));
      }
      return {
        content: response?.content ?? 'Benchmark mock response',
        tokenUsage: response?.tokenUsage ?? {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
        finishReason: response?.finishReason ?? 'stop',
      };
    },
  };
}

export function createMockTool(name = 'bench-tool'): Tool {
  return {
    name,
    description: `Benchmark tool: ${name}`,
    async execute(input: unknown) {
      return { echoed: input };
    },
  };
}

export function createBenchAgent(
  id: string,
  options?: { toolCount?: number; llmLatencyMs?: number },
): Agent {
  const tools: Tool[] = [];
  for (let i = 0; i < (options?.toolCount ?? 0); i++) {
    tools.push(createMockTool(`tool-${String(i)}`));
  }

  const agent = new Agent({
    id,
    role: 'Benchmark Agent',
    goal: 'Execute performance benchmarks',
    backstory: 'A test agent for benchmarking framework operations.',
    tools,
  });

  agent.setLLMProvider(createMockLLMProvider(options?.llmLatencyMs ?? 0));
  return agent;
}

export function createBenchTask(
  id: string,
  agentId: string,
  options?: { deps?: string[]; priority?: TaskPriority },
): Task {
  return new Task({
    id,
    description: `Benchmark task: ${id}`,
    expectedOutput: 'Benchmark result',
    agentId,
    dependencies: options?.deps,
    priority: options?.priority,
  });
}

export function createBenchMemory(_entryCount = 0): ShortTermMemory {
  const memory = new ShortTermMemory({
    defaultNamespace: MemoryNamespace.AGENT,
  });

  // Pre-populate if requested (synchronously enqueue, await in the bench setup)
  return memory;
}

export async function populateMemory(memory: ShortTermMemory, count: number): Promise<string[]> {
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const entry = createMemoryEntry(
      `Benchmark memory entry #${String(i)}: ${randomContent()}`,
      MemoryRole.ASSISTANT,
      MemoryNamespace.AGENT,
      { index: i, source: 'benchmark' },
    );
    await memory.add(entry);
    ids.push(entry.id);
  }
  return ids;
}

export function createBenchToolExecutor(): ToolExecutor {
  return new ToolExecutor(new PermissionManager(ALLOW_ALL_POLICY));
}

export function createBenchEngine(
  id: string,
  taskCount: number,
  options?: { strategy?: 'sequential' | 'parallel' },
): { engine: ExecutionEngine; taskIds: string[] } {
  const strategy =
    options?.strategy === 'parallel' ? ExecutionStrategy.PARALLEL : ExecutionStrategy.SEQUENTIAL;

  const engine = new ExecutionEngine({ id, strategy });
  const agent = createBenchAgent('bench-agent', { llmLatencyMs: 0 });
  engine.addAgent(agent);

  const taskIds: string[] = [];
  for (let i = 0; i < taskCount; i++) {
    const taskId = `task-${String(i)}`;
    const task = createBenchTask(taskId, 'bench-agent');
    engine.addTask(task);
    taskIds.push(taskId);
  }

  return { engine, taskIds };
}

// ---------------------------------------------------------------------------
// Timing utility
// ---------------------------------------------------------------------------

export interface BenchmarkResult {
  name: string;
  iterations: number;
  totalMs: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  opsPerSecond: number;
  budget: number;
  withinBudget: boolean;
}

export async function measurePerformance(
  name: string,
  fn: () => void | Promise<void>,
  options: { iterations?: number; warmup?: number; budget: number },
): Promise<BenchmarkResult> {
  const iterations = options.iterations ?? 1000;
  const warmup = options.warmup ?? 10;

  // Warmup runs
  for (let i = 0; i < warmup; i++) {
    await fn();
  }

  // Measured runs
  const timings: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const elapsed = performance.now() - start;
    timings.push(elapsed);
  }

  timings.sort((a, b) => a - b);

  const totalMs = timings.reduce((s, t) => s + t, 0);
  const avgMs = totalMs / iterations;
  const minMs = timings[0]!;
  const maxMs = timings[timings.length - 1]!;
  const p50Ms = timings[Math.floor(iterations * 0.5)]!;
  const p95Ms = timings[Math.floor(iterations * 0.95)]!;
  const p99Ms = timings[Math.floor(iterations * 0.99)]!;
  const opsPerSecond = 1000 / avgMs;

  const benchResult: BenchmarkResult = {
    name,
    iterations,
    totalMs,
    avgMs,
    minMs,
    maxMs,
    p50Ms,
    p95Ms,
    p99Ms,
    opsPerSecond,
    budget: options.budget,
    withinBudget: p95Ms <= options.budget,
  };

  collectResult(benchResult);
  return benchResult;
}

export function formatResult(result: BenchmarkResult): string {
  const status = result.withinBudget ? '✅ PASS' : '❌ FAIL';
  return [
    `${status} ${result.name}`,
    `  avg: ${result.avgMs.toFixed(3)}ms | p50: ${result.p50Ms.toFixed(3)}ms | p95: ${result.p95Ms.toFixed(3)}ms | p99: ${result.p99Ms.toFixed(3)}ms`,
    `  min: ${result.minMs.toFixed(3)}ms | max: ${result.maxMs.toFixed(3)}ms | ops/s: ${result.opsPerSecond.toFixed(0)}`,
    `  budget: ${String(result.budget)}ms | iterations: ${String(result.iterations)}`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomContent(): string {
  const words = [
    'agent',
    'task',
    'memory',
    'tool',
    'engine',
    'benchmark',
    'performance',
    'orchestration',
    'workflow',
    'execution',
    'parallel',
    'sequential',
    'context',
    'provider',
    'result',
  ];
  const count = 5 + Math.floor(Math.random() * 15);
  return Array.from({ length: count }, () => words[Math.floor(Math.random() * words.length)]).join(
    ' ',
  );
}
