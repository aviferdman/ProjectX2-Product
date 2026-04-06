/**
 * Unit tests for the TaskContextManager class.
 *
 * Tests cover:
 * - Construction and configuration
 * - Result storage (set, get, has, remove, clear)
 * - Context resolution with dependencies
 * - Merge strategies (replace, shallow-merge, deep-merge)
 * - Custom context transformers
 * - Metadata inclusion
 * - buildTaskInput integration
 * - Edge cases (empty deps, missing results, no context)
 */

import { describe, expect, it } from 'vitest';

import { TaskContextManager } from '../../../src/task/task-context-manager.js';
import { Task } from '../../../src/task/task.js';
import type { TaskResult } from '../../../src/types/task.js';
import { TaskPriority } from '../../../src/types/task.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createResult(output: string, agentId = 'test-agent'): TaskResult {
  return {
    output,
    agentId,
    duration: 100,
    tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
  };
}

function createTask(
  id: string,
  options?: {
    dependencies?: string[];
    context?: Record<string, unknown>;
    expectedOutput?: string;
    agentId?: string;
  },
): Task {
  return new Task({
    id,
    description: `Task ${id} description`,
    agentId: options?.agentId ?? 'agent-1',
    ...(options?.dependencies ? { dependencies: options.dependencies } : {}),
    ...(options?.context ? { context: options.context } : {}),
    ...(options?.expectedOutput ? { expectedOutput: options.expectedOutput } : {}),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TaskContextManager', () => {
  // =========================================================================
  // Construction
  // =========================================================================

  describe('construction', () => {
    it('should create with default config', () => {
      const mgr = new TaskContextManager();
      expect(mgr.mergeStrategy).toBe('shallow-merge');
      expect(mgr.includeMetadata).toBe(false);
      expect(mgr.size).toBe(0);
    });

    it('should accept custom merge strategy', () => {
      const mgr = new TaskContextManager({ mergeStrategy: 'replace' });
      expect(mgr.mergeStrategy).toBe('replace');
    });

    it('should accept deep-merge strategy', () => {
      const mgr = new TaskContextManager({ mergeStrategy: 'deep-merge' });
      expect(mgr.mergeStrategy).toBe('deep-merge');
    });

    it('should accept includeMetadata option', () => {
      const mgr = new TaskContextManager({ includeMetadata: true });
      expect(mgr.includeMetadata).toBe(true);
    });

    it('should accept a custom transformer', () => {
      const transformer = () => ({ custom: true });
      const mgr = new TaskContextManager({ transformer });
      expect(mgr.mergeStrategy).toBe('shallow-merge');
    });
  });

  // =========================================================================
  // Result management
  // =========================================================================

  describe('result management', () => {
    it('should store and retrieve a result', () => {
      const mgr = new TaskContextManager();
      const result = createResult('hello world');
      mgr.setResult('task-a', result);

      expect(mgr.getResult('task-a')).toEqual(result);
      expect(mgr.hasResult('task-a')).toBe(true);
      expect(mgr.size).toBe(1);
    });

    it('should return undefined for unknown task', () => {
      const mgr = new TaskContextManager();
      expect(mgr.getResult('unknown')).toBeUndefined();
      expect(mgr.hasResult('unknown')).toBe(false);
    });

    it('should overwrite existing result', () => {
      const mgr = new TaskContextManager();
      mgr.setResult('task-a', createResult('first'));
      mgr.setResult('task-a', createResult('second'));

      expect(mgr.getResult('task-a')?.output).toBe('second');
      expect(mgr.size).toBe(1);
    });

    it('should throw on empty taskId', () => {
      const mgr = new TaskContextManager();
      expect(() => mgr.setResult('', createResult('x'))).toThrow('taskId must not be empty');
    });

    it('should remove a result', () => {
      const mgr = new TaskContextManager();
      mgr.setResult('task-a', createResult('data'));

      expect(mgr.removeResult('task-a')).toBe(true);
      expect(mgr.hasResult('task-a')).toBe(false);
      expect(mgr.size).toBe(0);
    });

    it('should return false when removing non-existent result', () => {
      const mgr = new TaskContextManager();
      expect(mgr.removeResult('unknown')).toBe(false);
    });

    it('should clear all results', () => {
      const mgr = new TaskContextManager();
      mgr.setResult('a', createResult('1'));
      mgr.setResult('b', createResult('2'));
      mgr.setResult('c', createResult('3'));

      mgr.clear();
      expect(mgr.size).toBe(0);
      expect(mgr.hasResult('a')).toBe(false);
    });

    it('should return all results via getAllResults', () => {
      const mgr = new TaskContextManager();
      mgr.setResult('a', createResult('1'));
      mgr.setResult('b', createResult('2'));

      const all = mgr.getAllResults();
      expect(all.size).toBe(2);
      expect(all.get('a')?.output).toBe('1');
      expect(all.get('b')?.output).toBe('2');
    });
  });

  // =========================================================================
  // Context resolution — shallow-merge (default)
  // =========================================================================

  describe('resolveContext — shallow-merge (default)', () => {
    it('should return static context when no dependencies', () => {
      const mgr = new TaskContextManager();
      const task = createTask('t1', { context: { key: 'value' } });

      const ctx = mgr.resolveContext(task);
      expect(ctx).toEqual({ key: 'value' });
    });

    it('should return empty object for task with no context or deps', () => {
      const mgr = new TaskContextManager();
      const task = createTask('t1');

      const ctx = mgr.resolveContext(task);
      expect(ctx).toEqual({});
    });

    it('should inject dependency outputs into context', () => {
      const mgr = new TaskContextManager();
      mgr.setResult('dep-a', createResult('output A'));

      const task = createTask('t1', { dependencies: ['dep-a'] });
      const ctx = mgr.resolveContext(task);

      expect(ctx).toEqual({
        dependencyResults: { 'dep-a': 'output A' },
      });
    });

    it('should merge dependency outputs with static context', () => {
      const mgr = new TaskContextManager();
      mgr.setResult('dep-a', createResult('output A'));

      const task = createTask('t1', {
        dependencies: ['dep-a'],
        context: { existingKey: 42 },
      });
      const ctx = mgr.resolveContext(task);

      expect(ctx).toEqual({
        existingKey: 42,
        dependencyResults: { 'dep-a': 'output A' },
      });
    });

    it('should handle multiple dependency outputs', () => {
      const mgr = new TaskContextManager();
      mgr.setResult('dep-a', createResult('output A'));
      mgr.setResult('dep-b', createResult('output B'));

      const task = createTask('t1', { dependencies: ['dep-a', 'dep-b'] });
      const ctx = mgr.resolveContext(task);

      expect(ctx).toEqual({
        dependencyResults: {
          'dep-a': 'output A',
          'dep-b': 'output B',
        },
      });
    });

    it('should skip missing dependency results gracefully', () => {
      const mgr = new TaskContextManager();
      mgr.setResult('dep-a', createResult('output A'));

      const task = createTask('t1', { dependencies: ['dep-a', 'dep-missing'] });
      const ctx = mgr.resolveContext(task);

      expect(ctx).toEqual({
        dependencyResults: { 'dep-a': 'output A' },
      });
    });

    it('should return static context if all deps are missing', () => {
      const mgr = new TaskContextManager();
      const task = createTask('t1', {
        dependencies: ['missing-1', 'missing-2'],
        context: { key: 'val' },
      });

      const ctx = mgr.resolveContext(task);
      expect(ctx).toEqual({ key: 'val' });
    });
  });

  // =========================================================================
  // Context resolution — replace strategy
  // =========================================================================

  describe('resolveContext — replace strategy', () => {
    it('should replace static context with dependency outputs', () => {
      const mgr = new TaskContextManager({ mergeStrategy: 'replace' });
      mgr.setResult('dep-a', createResult('output A'));

      const task = createTask('t1', {
        dependencies: ['dep-a'],
        context: { existingKey: 42 },
      });
      const ctx = mgr.resolveContext(task);

      expect(ctx).toEqual({
        dependencyResults: { 'dep-a': 'output A' },
      });
      expect(ctx).not.toHaveProperty('existingKey');
    });

    it('should return static context when no dependency results exist', () => {
      const mgr = new TaskContextManager({ mergeStrategy: 'replace' });
      const task = createTask('t1', { context: { key: 'value' } });

      const ctx = mgr.resolveContext(task);
      expect(ctx).toEqual({ key: 'value' });
    });
  });

  // =========================================================================
  // Context resolution — deep-merge strategy
  // =========================================================================

  describe('resolveContext — deep-merge strategy', () => {
    it('should deep-merge nested objects', () => {
      const mgr = new TaskContextManager({ mergeStrategy: 'deep-merge' });
      mgr.setResult('dep-a', createResult('output A'));

      const task = createTask('t1', {
        dependencies: ['dep-a'],
        context: {
          nested: { existing: true, deep: { value: 1 } },
        },
      });
      const ctx = mgr.resolveContext(task);

      expect(ctx).toEqual({
        nested: { existing: true, deep: { value: 1 } },
        dependencyResults: { 'dep-a': 'output A' },
      });
    });

    it('should deeply merge overlapping keys', () => {
      const mgr = new TaskContextManager({ mergeStrategy: 'deep-merge' });
      mgr.setResult('dep-a', createResult('output A'));

      const task = createTask('t1', {
        dependencies: ['dep-a'],
        context: {
          dependencyResults: { 'preexisting': 'old value' },
        },
      });
      const ctx = mgr.resolveContext(task);

      expect(ctx).toEqual({
        dependencyResults: {
          preexisting: 'old value',
          'dep-a': 'output A',
        },
      });
    });
  });

  // =========================================================================
  // includeMetadata option
  // =========================================================================

  describe('includeMetadata option', () => {
    it('should include full metadata when enabled', () => {
      const mgr = new TaskContextManager({ includeMetadata: true });
      const result = createResult('output A', 'researcher');
      mgr.setResult('dep-a', result);

      const task = createTask('t1', { dependencies: ['dep-a'] });
      const ctx = mgr.resolveContext(task);

      expect(ctx).toEqual({
        dependencyResults: {
          'dep-a': {
            output: 'output A',
            agentId: 'researcher',
            duration: 100,
            tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
          },
        },
      });
    });

    it('should include result metadata fields when present', () => {
      const mgr = new TaskContextManager({ includeMetadata: true });
      const result: TaskResult = {
        output: 'data',
        agentId: 'agent-1',
        duration: 50,
        metadata: { source: 'web' },
      };
      mgr.setResult('dep-a', result);

      const task = createTask('t1', { dependencies: ['dep-a'] });
      const ctx = mgr.resolveContext(task);

      const depResult = (ctx['dependencyResults'] as Record<string, unknown>)['dep-a'] as Record<
        string,
        unknown
      >;
      expect(depResult).toHaveProperty('metadata', { source: 'web' });
    });

    it('should only include output string when metadata disabled', () => {
      const mgr = new TaskContextManager({ includeMetadata: false });
      mgr.setResult('dep-a', createResult('just the output'));

      const task = createTask('t1', { dependencies: ['dep-a'] });
      const ctx = mgr.resolveContext(task);

      expect(ctx).toEqual({
        dependencyResults: { 'dep-a': 'just the output' },
      });
    });
  });

  // =========================================================================
  // Custom transformers
  // =========================================================================

  describe('custom transformers', () => {
    it('should apply transformer to dependency results', () => {
      const mgr = new TaskContextManager({
        transformer: (depResults, _staticCtx) => {
          const summaries: Record<string, string> = {};
          for (const [id, result] of depResults) {
            summaries[id] = `Summary: ${result.output}`;
          }
          return { summaries };
        },
      });

      mgr.setResult('dep-a', createResult('raw output'));
      const task = createTask('t1', { dependencies: ['dep-a'] });
      const ctx = mgr.resolveContext(task);

      expect(ctx).toEqual({
        summaries: { 'dep-a': 'Summary: raw output' },
      });
    });

    it('should pass static context to transformer', () => {
      const mgr = new TaskContextManager({
        transformer: (_depResults, staticCtx) => {
          return { ...staticCtx, transformed: true };
        },
      });

      const task = createTask('t1', { context: { original: 'value' } });
      const ctx = mgr.resolveContext(task);

      expect(ctx).toEqual({
        original: 'value',
        transformed: true,
      });
    });

    it('should merge transformer output with static context (shallow-merge)', () => {
      const mgr = new TaskContextManager({
        mergeStrategy: 'shallow-merge',
        transformer: (depResults) => {
          const outputs: string[] = [];
          for (const [, result] of depResults) {
            outputs.push(result.output);
          }
          return { allOutputs: outputs };
        },
      });

      mgr.setResult('dep-a', createResult('first'));
      mgr.setResult('dep-b', createResult('second'));

      const task = createTask('t1', {
        dependencies: ['dep-a', 'dep-b'],
        context: { existingKey: 123 },
      });
      const ctx = mgr.resolveContext(task);

      expect(ctx).toEqual({
        existingKey: 123,
        allOutputs: ['first', 'second'],
      });
    });

    it('should use replace strategy with transformer', () => {
      const mgr = new TaskContextManager({
        mergeStrategy: 'replace',
        transformer: (depResults) => {
          const outputs: string[] = [];
          for (const [, result] of depResults) {
            outputs.push(result.output);
          }
          return { replaced: outputs };
        },
      });

      mgr.setResult('dep-a', createResult('data'));

      const task = createTask('t1', {
        dependencies: ['dep-a'],
        context: { willBeReplaced: true },
      });
      const ctx = mgr.resolveContext(task);

      expect(ctx).toEqual({ replaced: ['data'] });
    });

    it('should call transformer even with no dependency results', () => {
      let called = false;
      const mgr = new TaskContextManager({
        transformer: () => {
          called = true;
          return { fromTransformer: true };
        },
      });

      const task = createTask('t1');
      mgr.resolveContext(task);

      expect(called).toBe(true);
    });
  });

  // =========================================================================
  // buildTaskInput
  // =========================================================================

  describe('buildTaskInput', () => {
    it('should build basic task input without context', () => {
      const mgr = new TaskContextManager();
      const task = createTask('t1');

      const input = mgr.buildTaskInput(task);
      expect(input.description).toBe('Task t1 description');
      expect(input.context).toBeUndefined();
      expect(input.expectedOutput).toBeUndefined();
    });

    it('should include expectedOutput when present', () => {
      const mgr = new TaskContextManager();
      const task = createTask('t1', { expectedOutput: 'JSON array' });

      const input = mgr.buildTaskInput(task);
      expect(input.expectedOutput).toBe('JSON array');
    });

    it('should include resolved context with dependencies', () => {
      const mgr = new TaskContextManager();
      mgr.setResult('dep-a', createResult('research findings'));

      const task = createTask('t1', { dependencies: ['dep-a'] });
      const input = mgr.buildTaskInput(task);

      expect(input.context).toEqual({
        dependencyResults: { 'dep-a': 'research findings' },
      });
    });

    it('should include static context in task input', () => {
      const mgr = new TaskContextManager();
      const task = createTask('t1', { context: { topic: 'AI' } });

      const input = mgr.buildTaskInput(task);
      expect(input.context).toEqual({ topic: 'AI' });
    });

    it('should merge static context and dependency outputs in task input', () => {
      const mgr = new TaskContextManager();
      mgr.setResult('dep-a', createResult('dep output'));

      const task = createTask('t1', {
        dependencies: ['dep-a'],
        context: { topic: 'AI' },
      });
      const input = mgr.buildTaskInput(task);

      expect(input.context).toEqual({
        topic: 'AI',
        dependencyResults: { 'dep-a': 'dep output' },
      });
    });
  });

  // =========================================================================
  // Edge cases
  // =========================================================================

  describe('edge cases', () => {
    it('should handle task with empty dependencies array', () => {
      const mgr = new TaskContextManager();
      mgr.setResult('some-task', createResult('unused'));

      const task = createTask('t1', { dependencies: [] });
      const ctx = mgr.resolveContext(task);

      expect(ctx).toEqual({});
    });

    it('should not mutate the task context object', () => {
      const mgr = new TaskContextManager();
      mgr.setResult('dep-a', createResult('output'));

      const originalContext = { key: 'original' };
      const task = createTask('t1', {
        dependencies: ['dep-a'],
        context: originalContext,
      });

      mgr.resolveContext(task);
      expect(task.context).toEqual({ key: 'original' });
    });

    it('should work with multiple managers independently', () => {
      const mgr1 = new TaskContextManager();
      const mgr2 = new TaskContextManager();

      mgr1.setResult('task-a', createResult('from mgr1'));
      mgr2.setResult('task-a', createResult('from mgr2'));

      expect(mgr1.getResult('task-a')?.output).toBe('from mgr1');
      expect(mgr2.getResult('task-a')?.output).toBe('from mgr2');
    });

    it('should handle results with no tokenUsage (includeMetadata)', () => {
      const mgr = new TaskContextManager({ includeMetadata: true });
      const result: TaskResult = {
        output: 'no tokens',
        agentId: 'agent-1',
        duration: 50,
      };
      mgr.setResult('dep-a', result);

      const task = createTask('t1', { dependencies: ['dep-a'] });
      const ctx = mgr.resolveContext(task);

      const depResult = (ctx['dependencyResults'] as Record<string, unknown>)['dep-a'] as Record<
        string,
        unknown
      >;
      expect(depResult).not.toHaveProperty('tokenUsage');
      expect(depResult).toEqual({
        output: 'no tokens',
        agentId: 'agent-1',
        duration: 50,
      });
    });

    it('should handle a chain of 3 tasks passing context', () => {
      const mgr = new TaskContextManager();

      // Task A produces output
      mgr.setResult('task-a', createResult('A output'));

      // Task B depends on A
      const taskB = createTask('task-b', { dependencies: ['task-a'] });
      const ctxB = mgr.resolveContext(taskB);
      expect(ctxB).toEqual({
        dependencyResults: { 'task-a': 'A output' },
      });

      // Simulate B completing
      mgr.setResult('task-b', createResult('B output'));

      // Task C depends on both A and B
      const taskC = createTask('task-c', { dependencies: ['task-a', 'task-b'] });
      const ctxC = mgr.resolveContext(taskC);
      expect(ctxC).toEqual({
        dependencyResults: {
          'task-a': 'A output',
          'task-b': 'B output',
        },
      });
    });

    it('should handle diamond dependency pattern', () => {
      const mgr = new TaskContextManager();

      // A -> B, A -> C, B -> D, C -> D
      mgr.setResult('a', createResult('A result'));
      mgr.setResult('b', createResult('B result'));
      mgr.setResult('c', createResult('C result'));

      const taskD = createTask('d', { dependencies: ['b', 'c'] });
      const ctx = mgr.resolveContext(taskD);

      expect(ctx).toEqual({
        dependencyResults: {
          b: 'B result',
          c: 'C result',
        },
      });
    });
  });
});
