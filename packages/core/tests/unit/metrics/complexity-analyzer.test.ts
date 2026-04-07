/**
 * Tests for the complexity analyzer module.
 *
 * Covers: analyzeComplexity, gradeComplexity, dependency depth,
 * parallel width, scoring, and edge cases.
 */

import { describe, it, expect } from 'vitest';

import { analyzeComplexity, gradeComplexity } from '../../../src/metrics/index.js';

import type {
  AgentDescriptor,
  ComplexityGrade,
  ComplexityReport,
  TaskDescriptor,
  WorkflowDescriptor,
} from '../../../src/metrics/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAgent(overrides?: Partial<AgentDescriptor>): AgentDescriptor {
  return {
    id: overrides?.id ?? 'agent-1',
    toolCount: overrides?.toolCount ?? 0,
    hasLLMProvider: overrides?.hasLLMProvider ?? true,
    hasBackstory: overrides?.hasBackstory ?? false,
  };
}

function makeTask(overrides?: Partial<TaskDescriptor>): TaskDescriptor {
  return {
    id: overrides?.id ?? 'task-1',
    agentId: overrides?.agentId ?? 'agent-1',
    dependencies: overrides?.dependencies ?? [],
    hasTimeout: overrides?.hasTimeout ?? false,
    hasRetry: overrides?.hasRetry ?? false,
  };
}

function makeWorkflow(overrides?: Partial<WorkflowDescriptor>): WorkflowDescriptor {
  return {
    id: overrides?.id ?? 'wf-1',
    agents: overrides?.agents ?? [makeAgent()],
    tasks: overrides?.tasks ?? [makeTask()],
    strategy: overrides?.strategy ?? 'sequential',
    hasHooks: overrides?.hasHooks ?? false,
  };
}

// ---------------------------------------------------------------------------
// gradeComplexity
// ---------------------------------------------------------------------------

describe('gradeComplexity', () => {
  it('should return trivial for score 0-10', () => {
    expect(gradeComplexity(0)).toBe('trivial');
    expect(gradeComplexity(5)).toBe('trivial');
    expect(gradeComplexity(10)).toBe('trivial');
  });

  it('should return simple for score 11-30', () => {
    expect(gradeComplexity(11)).toBe('simple');
    expect(gradeComplexity(20)).toBe('simple');
    expect(gradeComplexity(30)).toBe('simple');
  });

  it('should return moderate for score 31-55', () => {
    expect(gradeComplexity(31)).toBe('moderate');
    expect(gradeComplexity(55)).toBe('moderate');
  });

  it('should return complex for score 56-80', () => {
    expect(gradeComplexity(56)).toBe('complex');
    expect(gradeComplexity(80)).toBe('complex');
  });

  it('should return highly-complex for score 81-100', () => {
    expect(gradeComplexity(81)).toBe('highly-complex');
    expect(gradeComplexity(100)).toBe('highly-complex');
  });
});

// ---------------------------------------------------------------------------
// analyzeComplexity
// ---------------------------------------------------------------------------

describe('analyzeComplexity', () => {
  // -----------------------------------------------------------------------
  // Basic counts
  // -----------------------------------------------------------------------

  describe('basic counts', () => {
    it('should count agents and tasks', () => {
      const report = analyzeComplexity(
        makeWorkflow({
          agents: [makeAgent({ id: 'a1' }), makeAgent({ id: 'a2' })],
          tasks: [makeTask({ id: 't1' }), makeTask({ id: 't2' }), makeTask({ id: 't3' })],
        }),
      );

      expect(report.agentCount).toBe(2);
      expect(report.taskCount).toBe(3);
    });

    it('should count dependencies', () => {
      const report = analyzeComplexity(
        makeWorkflow({
          tasks: [
            makeTask({ id: 't1', dependencies: [] }),
            makeTask({ id: 't2', dependencies: ['t1'] }),
            makeTask({ id: 't3', dependencies: ['t1', 't2'] }),
          ],
        }),
      );

      expect(report.dependencyCount).toBe(3);
    });

    it('should count total tools across agents', () => {
      const report = analyzeComplexity(
        makeWorkflow({
          agents: [makeAgent({ id: 'a1', toolCount: 5 }), makeAgent({ id: 'a2', toolCount: 3 })],
        }),
      );

      expect(report.totalToolCount).toBe(8);
      expect(report.avgToolsPerAgent).toBe(4);
    });

    it('should count agents with LLM providers', () => {
      const report = analyzeComplexity(
        makeWorkflow({
          agents: [
            makeAgent({ id: 'a1', hasLLMProvider: true }),
            makeAgent({ id: 'a2', hasLLMProvider: false }),
            makeAgent({ id: 'a3', hasLLMProvider: true }),
          ],
        }),
      );

      expect(report.agentsWithLLM).toBe(2);
    });

    it('should count tasks with timeout and retry', () => {
      const report = analyzeComplexity(
        makeWorkflow({
          tasks: [
            makeTask({ id: 't1', hasTimeout: true, hasRetry: false }),
            makeTask({ id: 't2', hasTimeout: false, hasRetry: true }),
            makeTask({ id: 't3', hasTimeout: true, hasRetry: true }),
          ],
        }),
      );

      expect(report.tasksWithTimeout).toBe(2);
      expect(report.tasksWithRetry).toBe(2);
    });
  });

  // -----------------------------------------------------------------------
  // Dependency depth
  // -----------------------------------------------------------------------

  describe('dependency depth', () => {
    it('should return 0 for no dependencies', () => {
      const report = analyzeComplexity(
        makeWorkflow({
          tasks: [makeTask({ id: 't1' }), makeTask({ id: 't2' })],
        }),
      );

      expect(report.maxDependencyDepth).toBe(0);
    });

    it('should compute linear chain depth', () => {
      const report = analyzeComplexity(
        makeWorkflow({
          tasks: [
            makeTask({ id: 't1', dependencies: [] }),
            makeTask({ id: 't2', dependencies: ['t1'] }),
            makeTask({ id: 't3', dependencies: ['t2'] }),
            makeTask({ id: 't4', dependencies: ['t3'] }),
          ],
        }),
      );

      expect(report.maxDependencyDepth).toBe(3);
    });

    it('should compute diamond dependency depth', () => {
      const report = analyzeComplexity(
        makeWorkflow({
          tasks: [
            makeTask({ id: 't1', dependencies: [] }),
            makeTask({ id: 't2', dependencies: ['t1'] }),
            makeTask({ id: 't3', dependencies: ['t1'] }),
            makeTask({ id: 't4', dependencies: ['t2', 't3'] }),
          ],
        }),
      );

      expect(report.maxDependencyDepth).toBe(2);
    });

    it('should detect circular dependencies', () => {
      const report = analyzeComplexity(
        makeWorkflow({
          tasks: [
            makeTask({ id: 't1', dependencies: ['t2'] }),
            makeTask({ id: 't2', dependencies: ['t1'] }),
          ],
        }),
      );

      expect(report.hasCircularDeps).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Parallel width
  // -----------------------------------------------------------------------

  describe('parallel width', () => {
    it('should return 0 for empty tasks', () => {
      const report = analyzeComplexity(
        makeWorkflow({
          tasks: [],
        }),
      );

      expect(report.maxParallelWidth).toBe(0);
    });

    it('should return task count when all are independent', () => {
      const report = analyzeComplexity(
        makeWorkflow({
          tasks: [makeTask({ id: 't1' }), makeTask({ id: 't2' }), makeTask({ id: 't3' })],
        }),
      );

      expect(report.maxParallelWidth).toBe(3);
    });

    it('should return 1 for a fully sequential chain', () => {
      const report = analyzeComplexity(
        makeWorkflow({
          tasks: [
            makeTask({ id: 't1', dependencies: [] }),
            makeTask({ id: 't2', dependencies: ['t1'] }),
            makeTask({ id: 't3', dependencies: ['t2'] }),
          ],
        }),
      );

      expect(report.maxParallelWidth).toBe(1);
    });

    it('should compute width for fan-out patterns', () => {
      const report = analyzeComplexity(
        makeWorkflow({
          tasks: [
            makeTask({ id: 'root', dependencies: [] }),
            makeTask({ id: 'a', dependencies: ['root'] }),
            makeTask({ id: 'b', dependencies: ['root'] }),
            makeTask({ id: 'c', dependencies: ['root'] }),
            makeTask({ id: 'join', dependencies: ['a', 'b', 'c'] }),
          ],
        }),
      );

      expect(report.maxParallelWidth).toBe(3);
    });
  });

  // -----------------------------------------------------------------------
  // Complexity scoring
  // -----------------------------------------------------------------------

  describe('complexity scoring', () => {
    it('should give low score to minimal workflow', () => {
      const report = analyzeComplexity(
        makeWorkflow({
          agents: [makeAgent()],
          tasks: [makeTask()],
          strategy: 'sequential',
          hasHooks: false,
        }),
      );

      expect(report.complexityScore).toBeLessThanOrEqual(10);
      expect(report.complexityGrade).toBe('trivial');
    });

    it('should give high score to complex workflow', () => {
      const agents = Array.from({ length: 10 }, (_, i) =>
        makeAgent({ id: `agent-${i}`, toolCount: 5, hasLLMProvider: true }),
      );

      const tasks: TaskDescriptor[] = [];
      for (let i = 0; i < 20; i++) {
        tasks.push(
          makeTask({
            id: `task-${i}`,
            agentId: `agent-${i % 10}`,
            dependencies: i > 0 ? [`task-${i - 1}`] : [],
            hasTimeout: true,
            hasRetry: true,
          }),
        );
      }

      const report = analyzeComplexity(
        makeWorkflow({
          agents,
          tasks,
          strategy: 'parallel',
          hasHooks: true,
        }),
      );

      expect(report.complexityScore).toBeGreaterThanOrEqual(50);
      expect(['complex', 'highly-complex']).toContain(report.complexityGrade);
    });

    it('should increase score with parallel strategy', () => {
      const base = makeWorkflow({
        agents: [makeAgent({ toolCount: 5 })],
        tasks: [makeTask({ id: 't1' }), makeTask({ id: 't2' }), makeTask({ id: 't3' })],
        strategy: 'sequential',
      });

      const parallel = makeWorkflow({
        ...base,
        strategy: 'parallel',
      });

      const seqReport = analyzeComplexity(base);
      const parReport = analyzeComplexity(parallel);

      expect(parReport.complexityScore).toBeGreaterThanOrEqual(seqReport.complexityScore);
    });
  });

  // -----------------------------------------------------------------------
  // Metadata passthrough
  // -----------------------------------------------------------------------

  describe('metadata passthrough', () => {
    it('should pass through strategy and hasHooks', () => {
      const report = analyzeComplexity(
        makeWorkflow({
          strategy: 'parallel',
          hasHooks: true,
        }),
      );

      expect(report.strategy).toBe('parallel');
      expect(report.hasHooks).toBe(true);
    });
  });
});
