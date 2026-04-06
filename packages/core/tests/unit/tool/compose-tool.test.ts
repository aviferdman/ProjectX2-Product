/**
 * Unit tests for tool composition (composeTool, isComposableTool, ToolContext).
 */

import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { ToolCompositionError, ToolConfigError } from '../../../src/errors/tool-errors.js';
import { composeTool, isComposableTool } from '../../../src/tool/compose-tool.js';
import { createTool } from '../../../src/tool/create-tool.js';
import {
  PermissionManager,
  ALLOW_ALL_POLICY,
  DENY_ALL_POLICY,
} from '../../../src/tool/permission-manager.js';
import { ToolExecutor } from '../../../src/tool/tool-executor.js';
import { ToolRegistry } from '../../../src/tool/tool-registry.js';
import { DEFAULT_MAX_COMPOSITION_DEPTH } from '../../../src/tool/tool-context.js';
import { ToolCategory, ToolPermission } from '../../../src/types/tool.js';
import type { Tool, ToolResult } from '../../../src/types/tool.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSimpleTool(name: string, result: unknown): Tool {
  return {
    name,
    description: `A simple ${name} tool`,
    async execute() {
      return result;
    },
  };
}

function makeRegistry(...tools: Tool[]): ToolRegistry {
  return ToolRegistry.from(tools);
}

function makeExecutor(
  registry?: ToolRegistry,
  options?: { maxCompositionDepth?: number },
): ToolExecutor {
  return new ToolExecutor(new PermissionManager(ALLOW_ALL_POLICY), {
    registry,
    ...options,
  });
}

// ---------------------------------------------------------------------------
// composeTool factory
// ---------------------------------------------------------------------------

describe('composeTool', () => {
  describe('creation', () => {
    it('should create a composable tool with minimal options', () => {
      const tool = composeTool({
        name: 'myTool',
        description: 'A composable tool',
        async execute(_input, _ctx) {
          return 'result';
        },
      });

      expect(tool.name).toBe('myTool');
      expect(tool.description).toBe('A composable tool');
      expect(typeof tool.execute).toBe('function');
      expect(typeof tool.executeComposed).toBe('function');
    });

    it('should create a composable tool with all options', () => {
      const schema = z.object({ query: z.string() });
      const tool = composeTool({
        name: 'search',
        description: 'Search tool',
        category: ToolCategory.WEB,
        permissions: [ToolPermission.NETWORK],
        schema,
        outputSchema: { type: 'object' },
        timeout: 5000,
        async execute({ query }, _ctx) {
          return { results: [query] };
        },
      });

      expect(tool.name).toBe('search');
      expect(tool.category).toBe(ToolCategory.WEB);
      expect(tool.permissions).toEqual([ToolPermission.NETWORK]);
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputZodSchema).toBe(schema);
      expect(tool.outputSchema).toEqual({ type: 'object' });
      expect(tool.timeout).toBe(5000);
    });

    it('should auto-derive inputSchema from Zod schema', () => {
      const tool = composeTool({
        name: 'myTool',
        description: 'A tool',
        schema: z.object({
          name: z.string(),
          count: z.number().optional(),
        }),
        async execute(_input, _ctx) {
          return null;
        },
      });

      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema?.type).toBe('object');
      expect(tool.inputSchema?.properties?.['name']).toEqual({ type: 'string' });
    });

    it('should freeze the returned tool', () => {
      const tool = composeTool({
        name: 'frozen',
        description: 'Frozen tool',
        async execute() {
          return null;
        },
      });

      expect(Object.isFrozen(tool)).toBe(true);
    });

    it('should throw ToolConfigError for invalid name', () => {
      expect(() =>
        composeTool({
          name: '123invalid',
          description: 'Bad name',
          async execute() {
            return null;
          },
        }),
      ).toThrow(ToolConfigError);
    });

    it('should throw ToolConfigError for empty description', () => {
      expect(() =>
        composeTool({
          name: 'myTool',
          description: '',
          async execute() {
            return null;
          },
        }),
      ).toThrow(ToolConfigError);
    });

    it('should throw ToolConfigError when execute is not a function', () => {
      expect(() =>
        composeTool({
          name: 'myTool',
          description: 'A tool',
          execute: 'not a function' as unknown as () => Promise<unknown>,
        }),
      ).toThrow(ToolConfigError);
    });
  });

  describe('isComposableTool', () => {
    it('should return true for composable tools', () => {
      const tool = composeTool({
        name: 'comp',
        description: 'Composable',
        async execute() {
          return null;
        },
      });

      expect(isComposableTool(tool)).toBe(true);
    });

    it('should return false for regular tools', () => {
      const tool = makeSimpleTool('regular', 'data');
      expect(isComposableTool(tool)).toBe(false);
    });

    it('should return false for createTool results', () => {
      const tool = createTool({
        name: 'created',
        description: 'Created tool',
        async execute() {
          return null;
        },
      });
      expect(isComposableTool(tool)).toBe(false);
    });
  });

  describe('standalone execution (no context)', () => {
    it('should execute with no-op context when called directly', async () => {
      const tool = composeTool({
        name: 'standalone',
        description: 'Works standalone',
        async execute(input) {
          return { echoed: input };
        },
      });

      const result = await tool.execute({ data: 'hello' });
      expect(result).toEqual({ echoed: { data: 'hello' } });
    });

    it('should validate input via Zod schema', async () => {
      const tool = composeTool({
        name: 'validated',
        description: 'Validates input',
        schema: z.object({ name: z.string() }),
        async execute({ name }) {
          return `Hello, ${name}`;
        },
      });

      const result = await tool.execute({ name: 'World' });
      expect(result).toBe('Hello, World');
    });

    it('should throw on invalid input with Zod schema', async () => {
      const tool = composeTool({
        name: 'validated',
        description: 'Validates input',
        schema: z.object({ name: z.string() }),
        async execute({ name }) {
          return name;
        },
      });

      await expect(tool.execute({ name: 123 })).rejects.toThrow();
    });

    it('should throw when callTool is used without a real context', async () => {
      const tool = composeTool({
        name: 'needsCtx',
        description: 'Needs context',
        async execute(_input, ctx) {
          return ctx.callTool('other', {});
        },
      });

      await expect(tool.execute({})).rejects.toThrow('context is not available');
    });
  });
});

// ---------------------------------------------------------------------------
// ToolExecutor composition support
// ---------------------------------------------------------------------------

describe('ToolExecutor with composition', () => {
  describe('constructor options', () => {
    it('should accept registry and maxCompositionDepth options', () => {
      const registry = makeRegistry();
      const executor = new ToolExecutor(new PermissionManager(ALLOW_ALL_POLICY), {
        registry,
        maxCompositionDepth: 5,
      });

      expect(executor.registry).toBe(registry);
      expect(executor.maxCompositionDepth).toBe(5);
    });

    it('should default maxCompositionDepth to DEFAULT_MAX_COMPOSITION_DEPTH', () => {
      const executor = new ToolExecutor(new PermissionManager(ALLOW_ALL_POLICY));
      expect(executor.maxCompositionDepth).toBe(DEFAULT_MAX_COMPOSITION_DEPTH);
    });

    it('should work without a registry (backward compatible)', () => {
      const executor = new ToolExecutor(new PermissionManager(ALLOW_ALL_POLICY));
      expect(executor.registry).toBeUndefined();
    });
  });

  describe('basic composition', () => {
    it('should execute a composable tool that calls another tool', async () => {
      const innerTool = makeSimpleTool('inner', 'inner-result');

      const outerTool = composeTool({
        name: 'outer',
        description: 'Calls inner tool',
        async execute(_input, ctx) {
          const result = await ctx.callTool('inner', {});
          return { fromInner: result.data };
        },
      });

      const registry = makeRegistry(innerTool, outerTool);
      const executor = makeExecutor(registry);

      const result = await executor.execute(outerTool, {});

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ fromInner: 'inner-result' });
    });

    it('should support chaining multiple tool calls', async () => {
      const toolA = makeSimpleTool('toolA', 10);
      const toolB = makeSimpleTool('toolB', 20);

      const aggregate = composeTool({
        name: 'aggregate',
        description: 'Calls multiple tools',
        async execute(_input, ctx) {
          const a = await ctx.callTool('toolA', {});
          const b = await ctx.callTool('toolB', {});
          return { sum: (a.data as number) + (b.data as number) };
        },
      });

      const registry = makeRegistry(toolA, toolB, aggregate);
      const executor = makeExecutor(registry);

      const result = await executor.execute(aggregate, {});

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ sum: 30 });
    });

    it('should pass input through Zod validation before calling execute', async () => {
      const echoTool = makeSimpleTool('echo', 'echoed');

      const validated = composeTool({
        name: 'validated',
        description: 'Validated composite',
        schema: z.object({ query: z.string().min(1) }),
        async execute({ query }, ctx) {
          const result = await ctx.callTool('echo', { q: query });
          return { query, result: result.data };
        },
      });

      const registry = makeRegistry(echoTool, validated);
      const executor = makeExecutor(registry);

      const result = await executor.execute(validated, { query: 'test' });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ query: 'test', result: 'echoed' });
    });

    it('should handle failed inner tool calls gracefully', async () => {
      const failingTool: Tool = {
        name: 'failing',
        description: 'Always fails',
        async execute() {
          throw new Error('inner failure');
        },
      };

      const resilient = composeTool({
        name: 'resilient',
        description: 'Handles inner failures',
        async execute(_input, ctx) {
          const result = await ctx.callTool('failing', {});
          if (!result.success) {
            return { fallback: true, error: result.error };
          }
          return { fallback: false, data: result.data };
        },
      });

      const registry = makeRegistry(failingTool, resilient);
      const executor = makeExecutor(registry);

      const result = await executor.execute(resilient, {});

      expect(result.success).toBe(true);
      expect((result.data as { fallback: boolean }).fallback).toBe(true);
    });
  });

  describe('context methods', () => {
    it('should provide hasTool that reflects registry state', async () => {
      const checker = composeTool({
        name: 'checker',
        description: 'Checks tool availability',
        async execute(_input, ctx) {
          return {
            hasInner: ctx.hasTool('inner'),
            hasMissing: ctx.hasTool('nonexistent'),
          };
        },
      });

      const registry = makeRegistry(makeSimpleTool('inner', null), checker);
      const executor = makeExecutor(registry);

      const result = await executor.execute(checker, {});

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ hasInner: true, hasMissing: false });
    });

    it('should provide getToolNames listing all registered tools', async () => {
      const lister = composeTool({
        name: 'lister',
        description: 'Lists tools',
        async execute(_input, ctx) {
          return { tools: ctx.getToolNames() };
        },
      });

      const registry = makeRegistry(
        makeSimpleTool('alpha', null),
        makeSimpleTool('beta', null),
        lister,
      );
      const executor = makeExecutor(registry);

      const result = await executor.execute(lister, {});

      expect(result.success).toBe(true);
      const tools = (result.data as { tools: string[] }).tools;
      expect(tools).toContain('alpha');
      expect(tools).toContain('beta');
      expect(tools).toContain('lister');
    });

    it('should expose depth and maxDepth in the context', async () => {
      const depthChecker = composeTool({
        name: 'depthChecker',
        description: 'Reports depth info',
        async execute(_input, ctx) {
          return { depth: ctx.depth, maxDepth: ctx.maxDepth };
        },
      });

      const registry = makeRegistry(depthChecker);
      const executor = makeExecutor(registry, { maxCompositionDepth: 7 });

      const result = await executor.execute(depthChecker, {});

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ depth: 0, maxDepth: 7 });
    });
  });

  describe('nested composition (tools calling composable tools)', () => {
    it('should support nested composable tool calls', async () => {
      const leaf = makeSimpleTool('leaf', 'leaf-data');

      const middle = composeTool({
        name: 'middle',
        description: 'Middle-level tool',
        async execute(_input, ctx) {
          const r = await ctx.callTool('leaf', {});
          return { middleWrapped: r.data };
        },
      });

      const top = composeTool({
        name: 'top',
        description: 'Top-level tool',
        async execute(_input, ctx) {
          const r = await ctx.callTool('middle', {});
          return { topWrapped: r.data };
        },
      });

      const registry = makeRegistry(leaf, middle, top);
      const executor = makeExecutor(registry);

      const result = await executor.execute(top, {});

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        topWrapped: { middleWrapped: 'leaf-data' },
      });
    });

    it('should increment depth at each nesting level', async () => {
      const depths: number[] = [];

      const level2 = composeTool({
        name: 'level2',
        description: 'Level 2',
        async execute(_input, ctx) {
          depths.push(ctx.depth);
          return 'done';
        },
      });

      const level1 = composeTool({
        name: 'level1',
        description: 'Level 1',
        async execute(_input, ctx) {
          depths.push(ctx.depth);
          return ctx.callTool('level2', {});
        },
      });

      const level0 = composeTool({
        name: 'level0',
        description: 'Level 0',
        async execute(_input, ctx) {
          depths.push(ctx.depth);
          return ctx.callTool('level1', {});
        },
      });

      const registry = makeRegistry(level0, level1, level2);
      const executor = makeExecutor(registry);

      await executor.execute(level0, {});

      expect(depths).toEqual([0, 1, 2]);
    });
  });

  describe('max depth enforcement', () => {
    it('should fail when max depth is exceeded', async () => {
      // A tool that calls itself and propagates failure
      const recursive = composeTool({
        name: 'recursive',
        description: 'Calls itself',
        async execute(_input, ctx) {
          const r = await ctx.callTool('recursive', {});
          if (!r.success) {
            throw new Error(r.error);
          }
          return r.data;
        },
      });

      const registry = makeRegistry(recursive);
      const executor = makeExecutor(registry, { maxCompositionDepth: 3 });

      const result = await executor.execute(recursive, {});

      // The deepest call exceeds max depth, which propagates up
      expect(result.success).toBe(false);
      expect(result.error).toContain('Maximum composition depth');
    });

    it('should respect custom maxCompositionDepth', async () => {
      let maxCallDepth = 0;

      const depthTracker = composeTool({
        name: 'depthTracker',
        description: 'Tracks depth',
        async execute(_input, ctx) {
          if (ctx.depth > maxCallDepth) {
            maxCallDepth = ctx.depth;
          }
          if (ctx.hasTool('depthTracker')) {
            const r = await ctx.callTool('depthTracker', {});
            if (!r.success) return { maxDepthReached: maxCallDepth };
          }
          return { maxDepthReached: maxCallDepth };
        },
      });

      const registry = makeRegistry(depthTracker);
      const executor = makeExecutor(registry, { maxCompositionDepth: 2 });

      const result = await executor.execute(depthTracker, {});

      expect(result.success).toBe(true);
      // Depth 0 → calls depth 1 → calls depth 2 → tries depth 3 → fails
      // So maxCallDepth should be 2
      expect(maxCallDepth).toBe(2);
    });

    it('should throw ToolCompositionError with correct depth info', async () => {
      let caughtError: ToolCompositionError | undefined;

      const innerCatcher = composeTool({
        name: 'innerCatcher',
        description: 'Catches the error',
        async execute(_input, ctx) {
          try {
            await ctx.callTool('innerCatcher', {});
          } catch (err) {
            if (err instanceof ToolCompositionError) {
              caughtError = err;
            }
            throw err;
          }
          return null;
        },
      });

      const registry = makeRegistry(innerCatcher);
      const executor = makeExecutor(registry, { maxCompositionDepth: 1 });

      // Depth 0 calls innerCatcher → depth 1 tries to call → depth 2 > maxDepth(1)
      await executor.execute(innerCatcher, {});

      expect(caughtError).toBeInstanceOf(ToolCompositionError);
      expect(caughtError!.depth).toBe(2);
      expect(caughtError!.maxDepth).toBe(1);
    });
  });

  describe('no registry configured', () => {
    it('should fail composable tools when no registry is set', async () => {
      const tool = composeTool({
        name: 'needsRegistry',
        description: 'Needs registry',
        async execute(_input, ctx) {
          return ctx.callTool('other', {});
        },
      });

      const executor = new ToolExecutor(new PermissionManager(ALLOW_ALL_POLICY));
      const result = await executor.execute(tool, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('ToolRegistry');
    });
  });

  describe('permission enforcement in composition', () => {
    it('should enforce permissions on inner tool calls', async () => {
      const restricted: Tool = {
        name: 'restricted',
        description: 'Requires file read',
        permissions: [ToolPermission.FILE_READ],
        async execute() {
          return 'secret data';
        },
      };

      const caller = composeTool({
        name: 'caller',
        description: 'Calls restricted tool',
        async execute(_input, ctx) {
          const r = await ctx.callTool('restricted', {});
          return r;
        },
      });

      const registry = makeRegistry(restricted, caller);
      const executor = new ToolExecutor(new PermissionManager(DENY_ALL_POLICY), {
        registry,
      });

      // The caller itself has no permissions so it passes the check,
      // but the inner call to 'restricted' should be denied
      const result = await executor.execute(caller, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('denied');
    });
  });

  describe('events', () => {
    it('should emit events for both outer and inner tool executions', async () => {
      const inner = makeSimpleTool('inner', 42);
      const outer = composeTool({
        name: 'outer',
        description: 'Calls inner',
        async execute(_input, ctx) {
          return ctx.callTool('inner', {});
        },
      });

      const registry = makeRegistry(inner, outer);
      const executor = makeExecutor(registry);

      const startEvents: string[] = [];
      const completeEvents: string[] = [];

      executor.on('tool:execute:start', (name) => startEvents.push(name));
      executor.on('tool:execute:complete', (name) => completeEvents.push(name));

      await executor.execute(outer, {});

      expect(startEvents).toEqual(['outer', 'inner']);
      expect(completeEvents).toEqual(['inner', 'outer']);
    });
  });

  describe('backward compatibility', () => {
    it('should execute non-composable tools normally', async () => {
      const tool = makeSimpleTool('regular', 'data');
      const executor = makeExecutor();

      const result = await executor.execute(tool, {});

      expect(result.success).toBe(true);
      expect(result.data).toBe('data');
    });

    it('should preserve timeout behavior for composable tools', async () => {
      const slow = composeTool({
        name: 'slow',
        description: 'Slow composable',
        timeout: 50,
        async execute() {
          return new Promise((resolve) => setTimeout(() => resolve('done'), 5000));
        },
      });

      const registry = makeRegistry(slow);
      const executor = makeExecutor(registry);

      const result = await executor.execute(slow, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });

    it('should preserve error wrapping for composable tools', async () => {
      const failing = composeTool({
        name: 'failing',
        description: 'Always throws',
        async execute() {
          throw new Error('composition boom');
        },
      });

      const registry = makeRegistry(failing);
      const executor = makeExecutor(registry);

      const result = await executor.execute(failing, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('composition boom');
    });
  });
});

// ---------------------------------------------------------------------------
// ToolCompositionError
// ---------------------------------------------------------------------------

describe('ToolCompositionError', () => {
  it('should have correct properties', () => {
    const err = new ToolCompositionError('myTool', 'too deep', 5, 3);

    expect(err.name).toBe('ToolCompositionError');
    expect(err.toolName).toBe('myTool');
    expect(err.depth).toBe(5);
    expect(err.maxDepth).toBe(3);
    expect(err.message).toContain('myTool');
    expect(err.message).toContain('too deep');
  });

  it('should be an instance of ToolExecutionError', () => {
    const err = new ToolCompositionError('t', 'msg', 1, 1);
    expect(err).toBeInstanceOf(ToolCompositionError);
    expect(err).toBeInstanceOf(Error);
  });
});
