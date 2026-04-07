/**
 * Cross-framework comparison benchmarks.
 *
 * Runs the canonical "Research Assistant" workflow in Crewspace,
 * LangChain.js (shim), and CrewAI (shim), measuring framework
 * overhead with identical mock LLM latency.
 *
 * Budget: each framework must complete the 3-task workflow in <5s.
 *
 * @packageDocumentation
 */

import { describe, it, expect } from 'vitest';

import { CrewspaceWorkflowRunner } from './crewspace-workflow.js';
import { LangChainWorkflowRunner } from './langchain-workflow.js';
import { CrewAIWorkflowRunner } from './crewai-workflow.js';
import {
  measurePerformance,
  formatResult,
  PERFORMANCE_BUDGETS,
} from '../helpers.js';
import type { ComparisonWorkflowRunner, WorkflowResult } from './workflow-spec.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const COMPARISON_BUDGET = PERFORMANCE_BUDGETS.engineSequentialRun; // 5000ms

function validateWorkflowResult(result: WorkflowResult, framework: string): void {
  expect(result.framework).toBe(framework);
  expect(result.success).toBe(true);
  expect(result.taskResults.length).toBe(3);
  expect(result.totalDurationMs).toBeGreaterThan(0);

  // Each task must have produced output
  for (const tr of result.taskResults) {
    expect(tr.output.length).toBeGreaterThan(0);
    expect(tr.agentId.length).toBeGreaterThan(0);
    expect(tr.taskId.length).toBeGreaterThan(0);
  }
}

// ---------------------------------------------------------------------------
// Individual framework benchmarks
// ---------------------------------------------------------------------------

describe('Cross-Framework Comparison Benchmarks', () => {
  describe('Crewspace', () => {
    it('should complete the research workflow within budget', async () => {
      const runner = new CrewspaceWorkflowRunner();
      const benchResult = await measurePerformance(
        'Crewspace: Research Assistant Workflow',
        async () => {
          await runner.run();
        },
        { iterations: 50, warmup: 3, budget: COMPARISON_BUDGET },
      );

      console.log(formatResult(benchResult));
      expect(benchResult.withinBudget).toBe(true);
    });

    it('should produce valid workflow results', async () => {
      const runner = new CrewspaceWorkflowRunner();
      const result = await runner.run();
      validateWorkflowResult(result, 'crewspace');
    });
  });

  describe('LangChain.js (shim)', () => {
    it('should complete the research workflow within budget', async () => {
      const runner = new LangChainWorkflowRunner();
      const benchResult = await measurePerformance(
        'LangChain.js: Research Assistant Workflow',
        async () => {
          await runner.run();
        },
        { iterations: 50, warmup: 3, budget: COMPARISON_BUDGET },
      );

      console.log(formatResult(benchResult));
      expect(benchResult.withinBudget).toBe(true);
    });

    it('should produce valid workflow results', async () => {
      const runner = new LangChainWorkflowRunner();
      const result = await runner.run();
      validateWorkflowResult(result, 'langchain');
    });
  });

  describe('CrewAI (shim)', () => {
    it('should complete the research workflow within budget', async () => {
      const runner = new CrewAIWorkflowRunner();
      const benchResult = await measurePerformance(
        'CrewAI: Research Assistant Workflow',
        async () => {
          await runner.run();
        },
        { iterations: 50, warmup: 3, budget: COMPARISON_BUDGET },
      );

      console.log(formatResult(benchResult));
      expect(benchResult.withinBudget).toBe(true);
    });

    it('should produce valid workflow results', async () => {
      const runner = new CrewAIWorkflowRunner();
      const result = await runner.run();
      validateWorkflowResult(result, 'crewai');
    });
  });

  // ---------------------------------------------------------------------------
  // Head-to-head comparison
  // ---------------------------------------------------------------------------

  describe('Head-to-Head', () => {
    it('should run all frameworks and report comparative results', async () => {
      const runners: ComparisonWorkflowRunner[] = [
        new CrewspaceWorkflowRunner(),
        new LangChainWorkflowRunner(),
        new CrewAIWorkflowRunner(),
      ];

      const results: WorkflowResult[] = [];

      for (const runner of runners) {
        const result = await runner.run();
        results.push(result);
      }

      // All must succeed
      for (const r of results) {
        expect(r.success).toBe(true);
        expect(r.taskResults.length).toBe(3);
      }

      // All must produce output for the same task IDs
      const expectedTaskIds = ['search', 'analyze', 'write-report'];
      for (const r of results) {
        const taskIds = r.taskResults.map((tr) => tr.taskId);
        expect(taskIds).toEqual(expectedTaskIds);
      }

      // Log comparison table
      console.log('\n=== Cross-Framework Comparison ===');
      console.log('| Framework    | Duration (ms) | Tasks |');
      console.log('|--------------|---------------|-------|');
      for (const r of results) {
        console.log(
          `| ${r.framework.padEnd(12)} | ${r.totalDurationMs.toFixed(2).padStart(13)} | ${String(r.taskResults.length).padStart(5)} |`,
        );
      }
    });
  });
});
