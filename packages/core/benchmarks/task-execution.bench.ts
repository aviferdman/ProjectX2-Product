/**
 * Task execution benchmarks.
 *
 * Measures Task construction, state transitions, and ExecutionEngine.run performance.
 * Budget: Task init <100ms, Engine run <5s.
 */

import { describe, it, expect } from 'vitest';

import { Agent } from '../src/agent/agent.js';
import { Task } from '../src/task/task.js';
import { ExecutionEngine } from '../src/engine/execution-engine.js';
import { ExecutionStrategy } from '../src/engine/index.js';
import { TaskPriority, TaskStatus } from '../src/types/index.js';
import type { LLMMessage, LLMProvider, LLMResponse } from '../src/types/index.js';
import {
  PERFORMANCE_BUDGETS,
  createMockLLMProvider,
  measurePerformance,
  formatResult,
} from './helpers.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createFastAgent(id: string): Agent {
  const agent = new Agent({
    id,
    role: 'Benchmark Runner',
    goal: 'Execute tasks with zero LLM latency',
  });
  agent.setLLMProvider(createMockLLMProvider(0));
  return agent;
}

// ---------------------------------------------------------------------------
// Task construction benchmarks
// ---------------------------------------------------------------------------

describe('Task Initialization Benchmarks', () => {
  it('should create a minimal task within budget', async () => {
    const result = await measurePerformance(
      'Task init (minimal config)',
      () => {
        new Task({
          id: 'bench-task',
          description: 'Benchmark task',
        });
      },
      { iterations: 5000, budget: PERFORMANCE_BUDGETS.taskInit },
    );

    console.log(formatResult(result));
    expect(result.withinBudget).toBe(true);
  });

  it('should create a fully-configured task within budget', async () => {
    const result = await measurePerformance(
      'Task init (full config)',
      () => {
        new Task({
          id: 'bench-task-full',
          description: 'Benchmark task with all options',
          expectedOutput: 'A detailed performance report',
          agentId: 'bench-agent',
          context: { source: 'benchmark', iteration: 42 },
          dependencies: ['dep-1', 'dep-2', 'dep-3'],
          timeout: 30000,
          retries: 3,
          priority: TaskPriority.HIGH,
          metadata: { suite: 'performance', category: 'init' },
        });
      },
      { iterations: 5000, budget: PERFORMANCE_BUDGETS.taskInit },
    );

    console.log(formatResult(result));
    expect(result.withinBudget).toBe(true);
  });

  it('should handle task state transitions within budget', async () => {
    const result = await measurePerformance(
      'Task state transitions (full lifecycle)',
      () => {
        const task = new Task({
          id: 'bench-lifecycle',
          description: 'State transition benchmark',
          agentId: 'agent-1',
        });
        task.setStatus(TaskStatus.RUNNING);
        task.complete({
          output: 'done',
          agentId: 'agent-1',
          duration: 100,
        });
        task.reset();
      },
      { iterations: 5000, budget: PERFORMANCE_BUDGETS.taskInit },
    );

    console.log(formatResult(result));
    expect(result.withinBudget).toBe(true);
  });

  it('should convert task to TaskInput within budget', async () => {
    const task = new Task({
      id: 'bench-convert',
      description: 'Conversion benchmark',
      expectedOutput: 'A formatted report',
      context: { key: 'value', nested: { deep: true } },
    });

    const result = await measurePerformance(
      'Task.toTaskInput()',
      () => {
        task.toTaskInput();
      },
      { iterations: 10000, budget: PERFORMANCE_BUDGETS.taskInit },
    );

    console.log(formatResult(result));
    expect(result.withinBudget).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Engine execution benchmarks
// ---------------------------------------------------------------------------

describe('ExecutionEngine Benchmarks', () => {
  it('should initialize engine within budget', async () => {
    const result = await measurePerformance(
      'Engine init (minimal config)',
      () => {
        new ExecutionEngine({ id: 'bench-engine' });
      },
      { iterations: 5000, budget: PERFORMANCE_BUDGETS.engineInit },
    );

    console.log(formatResult(result));
    expect(result.withinBudget).toBe(true);
  });

  it('should run 5 sequential tasks within budget', async () => {
    const result = await measurePerformance(
      'Engine run (5 sequential tasks)',
      async () => {
        const engine = new ExecutionEngine({
          id: 'bench-seq-5',
          strategy: ExecutionStrategy.SEQUENTIAL,
        });
        engine.addAgent(createFastAgent('agent-1'));

        for (let i = 0; i < 5; i++) {
          engine.addTask(
            new Task({
              id: `task-${String(i)}`,
              description: `Sequential task ${String(i)}`,
              agentId: 'agent-1',
            }),
          );
        }

        await engine.run();
      },
      { iterations: 100, warmup: 5, budget: PERFORMANCE_BUDGETS.engineSequentialRun },
    );

    console.log(formatResult(result));
    expect(result.withinBudget).toBe(true);
  });

  it('should run 10 sequential tasks within budget', async () => {
    const result = await measurePerformance(
      'Engine run (10 sequential tasks)',
      async () => {
        const engine = new ExecutionEngine({
          id: 'bench-seq-10',
          strategy: ExecutionStrategy.SEQUENTIAL,
        });
        engine.addAgent(createFastAgent('agent-1'));

        for (let i = 0; i < 10; i++) {
          engine.addTask(
            new Task({
              id: `task-${String(i)}`,
              description: `Sequential task ${String(i)}`,
              agentId: 'agent-1',
            }),
          );
        }

        await engine.run();
      },
      { iterations: 50, warmup: 3, budget: PERFORMANCE_BUDGETS.engineSequentialRun },
    );

    console.log(formatResult(result));
    expect(result.withinBudget).toBe(true);
  });

  it('should run 5 parallel tasks within budget', async () => {
    const result = await measurePerformance(
      'Engine run (5 parallel tasks)',
      async () => {
        const engine = new ExecutionEngine({
          id: 'bench-par-5',
          strategy: ExecutionStrategy.PARALLEL,
        });
        engine.addAgent(createFastAgent('agent-1'));

        for (let i = 0; i < 5; i++) {
          engine.addTask(
            new Task({
              id: `task-${String(i)}`,
              description: `Parallel task ${String(i)}`,
              agentId: 'agent-1',
            }),
          );
        }

        await engine.run();
      },
      { iterations: 100, warmup: 5, budget: PERFORMANCE_BUDGETS.engineParallelRun },
    );

    console.log(formatResult(result));
    expect(result.withinBudget).toBe(true);
  });

  it('should run tasks with dependencies within budget', async () => {
    const result = await measurePerformance(
      'Engine run (5 tasks, dependency chain)',
      async () => {
        const engine = new ExecutionEngine({
          id: 'bench-deps',
          strategy: ExecutionStrategy.SEQUENTIAL,
        });
        engine.addAgent(createFastAgent('agent-1'));

        // Create a linear dependency chain: task-0 → task-1 → ... → task-4
        for (let i = 0; i < 5; i++) {
          engine.addTask(
            new Task({
              id: `task-${String(i)}`,
              description: `Chained task ${String(i)}`,
              agentId: 'agent-1',
              dependencies: i > 0 ? [`task-${String(i - 1)}`] : undefined,
            }),
          );
        }

        await engine.run();
      },
      { iterations: 100, warmup: 5, budget: PERFORMANCE_BUDGETS.engineSequentialRun },
    );

    console.log(formatResult(result));
    expect(result.withinBudget).toBe(true);
  });

  it('should handle engine with hooks within budget', async () => {
    const result = await measurePerformance(
      'Engine run (5 tasks, before/after hooks)',
      async () => {
        const engine = new ExecutionEngine({
          id: 'bench-hooks',
          strategy: ExecutionStrategy.SEQUENTIAL,
        });
        engine.addAgent(createFastAgent('agent-1'));

        engine.beforeTask(() => {
          /* noop */
        });
        engine.afterTask(() => {
          /* noop */
        });

        for (let i = 0; i < 5; i++) {
          engine.addTask(
            new Task({
              id: `task-${String(i)}`,
              description: `Hooked task ${String(i)}`,
              agentId: 'agent-1',
            }),
          );
        }

        await engine.run();
      },
      { iterations: 100, warmup: 5, budget: PERFORMANCE_BUDGETS.engineSequentialRun },
    );

    console.log(formatResult(result));
    expect(result.withinBudget).toBe(true);
  });
});
