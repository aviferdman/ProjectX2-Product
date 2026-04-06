/**
 * Unit tests for the ToolExecutor.
 */

import { describe, expect, it, vi } from 'vitest';

import { ToolExecutionError, ToolPermissionError } from '../../../src/errors/tool-errors.js';
import { PermissionManager, ALLOW_ALL_POLICY, DENY_ALL_POLICY } from '../../../src/tool/permission-manager.js';
import { ToolExecutor } from '../../../src/tool/tool-executor.js';
import { ToolPermission } from '../../../src/types/tool.js';
import type { Tool, ToolResult } from '../../../src/types/tool.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTool(overrides?: Partial<Tool>): Tool {
  return {
    name: 'test-tool',
    description: 'A test tool',
    execute: async (input: unknown) => input,
    ...overrides,
  };
}

function makeSlowTool(durationMs: number): Tool {
  return {
    name: 'slow-tool',
    description: 'A slow tool for timeout testing',
    timeout: durationMs > 0 ? Math.max(1, Math.floor(durationMs / 10)) : undefined,
    async execute() {
      return new Promise((resolve) => {
        setTimeout(() => resolve('done'), durationMs);
      });
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ToolExecutor', () => {
  // -----------------------------------------------------------------------
  // Basic execution
  // -----------------------------------------------------------------------

  describe('basic execution', () => {
    it('should execute a tool and return a ToolResult', async () => {
      const executor = new ToolExecutor(new PermissionManager(ALLOW_ALL_POLICY));
      const tool = makeTool({
        execute: async (input) => ({ echoed: input }),
      });

      const result = await executor.execute(tool, { message: 'hello' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ echoed: { message: 'hello' } });
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.error).toBeUndefined();
    });

    it('should capture execution duration', async () => {
      const executor = new ToolExecutor(new PermissionManager(ALLOW_ALL_POLICY));
      const tool = makeTool({
        async execute() {
          await new Promise((r) => setTimeout(r, 50));
          return 'ok';
        },
      });

      const result = await executor.execute(tool, undefined);

      expect(result.success).toBe(true);
      expect(result.duration).toBeGreaterThanOrEqual(40);
    });

    it('should expose the permission manager via getter', () => {
      const pm = new PermissionManager(ALLOW_ALL_POLICY);
      const executor = new ToolExecutor(pm);

      expect(executor.permissionManager).toBe(pm);
    });
  });

  // -----------------------------------------------------------------------
  // Permission checking
  // -----------------------------------------------------------------------

  describe('permission checking', () => {
    it('should throw ToolPermissionError when permissions are denied', async () => {
      const executor = new ToolExecutor(new PermissionManager(DENY_ALL_POLICY));
      const tool = makeTool({
        permissions: [ToolPermission.FILE_READ],
      });

      await expect(executor.execute(tool, {})).rejects.toThrow(ToolPermissionError);
    });

    it('should allow execution when permissions are granted', async () => {
      const executor = new ToolExecutor(
        new PermissionManager({
          defaultAction: 'deny',
          allowed: [ToolPermission.FILE_READ],
        }),
      );
      const tool = makeTool({
        permissions: [ToolPermission.FILE_READ],
        execute: async () => 'file contents',
      });

      const result = await executor.execute(tool, {});

      expect(result.success).toBe(true);
      expect(result.data).toBe('file contents');
    });

    it('should allow tools with no permissions under deny-all policy', async () => {
      const executor = new ToolExecutor(new PermissionManager(DENY_ALL_POLICY));
      const tool = makeTool(); // no permissions declared

      const result = await executor.execute(tool, 'hello');

      expect(result.success).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Error handling
  // -----------------------------------------------------------------------

  describe('error handling', () => {
    it('should return failure result when tool throws', async () => {
      const executor = new ToolExecutor(new PermissionManager(ALLOW_ALL_POLICY));
      const tool = makeTool({
        execute: async () => {
          throw new Error('Something went wrong');
        },
      });

      const result = await executor.execute(tool, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Something went wrong');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle non-Error throws', async () => {
      const executor = new ToolExecutor(new PermissionManager(ALLOW_ALL_POLICY));
      const tool = makeTool({
        execute: async () => {
          throw 'string error'; // eslint-disable-line no-throw-literal
        },
      });

      const result = await executor.execute(tool, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('string error');
    });

    it('should pass through ToolExecutionError without double wrapping', async () => {
      const executor = new ToolExecutor(new PermissionManager(ALLOW_ALL_POLICY));
      const originalError = new ToolExecutionError('test-tool', 'custom error');
      const tool = makeTool({
        execute: async () => {
          throw originalError;
        },
      });

      const result = await executor.execute(tool, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('custom error');
    });
  });

  // -----------------------------------------------------------------------
  // Timeout enforcement
  // -----------------------------------------------------------------------

  describe('timeout enforcement', () => {
    it('should enforce tool timeout', async () => {
      const executor = new ToolExecutor(new PermissionManager(ALLOW_ALL_POLICY));
      const tool: Tool = {
        name: 'slow-tool',
        description: 'Very slow tool',
        timeout: 50,
        async execute() {
          return new Promise((resolve) => setTimeout(() => resolve('done'), 5000));
        },
      };

      const result = await executor.execute(tool, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('exceeded timeout');
    });

    it('should not timeout when execution completes in time', async () => {
      const executor = new ToolExecutor(new PermissionManager(ALLOW_ALL_POLICY));
      const tool: Tool = {
        name: 'fast-tool',
        description: 'Quick tool',
        timeout: 5000,
        async execute() {
          return 'quick result';
        },
      };

      const result = await executor.execute(tool, {});

      expect(result.success).toBe(true);
      expect(result.data).toBe('quick result');
    });

    it('should not apply timeout when timeout is 0', async () => {
      const executor = new ToolExecutor(new PermissionManager(ALLOW_ALL_POLICY));
      const tool: Tool = {
        name: 'no-timeout-tool',
        description: 'No timeout',
        timeout: 0,
        async execute() {
          return 'ok';
        },
      };

      const result = await executor.execute(tool, {});

      expect(result.success).toBe(true);
    });

    it('should not apply timeout when timeout is undefined', async () => {
      const executor = new ToolExecutor(new PermissionManager(ALLOW_ALL_POLICY));
      const tool = makeTool({
        execute: async () => 'ok',
      });

      const result = await executor.execute(tool, {});

      expect(result.success).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Events
  // -----------------------------------------------------------------------

  describe('events', () => {
    it('should emit tool:execute:start before execution', async () => {
      const executor = new ToolExecutor(new PermissionManager(ALLOW_ALL_POLICY));
      const tool = makeTool();
      const startHandler = vi.fn();

      executor.on('tool:execute:start', startHandler);
      await executor.execute(tool, { data: 'test' });

      expect(startHandler).toHaveBeenCalledOnce();
      expect(startHandler).toHaveBeenCalledWith('test-tool', { data: 'test' });
    });

    it('should emit tool:execute:complete on success', async () => {
      const executor = new ToolExecutor(new PermissionManager(ALLOW_ALL_POLICY));
      const tool = makeTool({ execute: async () => 42 });
      const completeHandler = vi.fn();

      executor.on('tool:execute:complete', completeHandler);
      await executor.execute(tool, {});

      expect(completeHandler).toHaveBeenCalledOnce();
      const result: ToolResult = completeHandler.mock.calls[0]![1];
      expect(result.success).toBe(true);
      expect(result.data).toBe(42);
    });

    it('should emit tool:execute:error on failure', async () => {
      const executor = new ToolExecutor(new PermissionManager(ALLOW_ALL_POLICY));
      const tool = makeTool({
        execute: async () => {
          throw new Error('boom');
        },
      });
      const errorHandler = vi.fn();

      executor.on('tool:execute:error', errorHandler);
      await executor.execute(tool, {});

      expect(errorHandler).toHaveBeenCalledOnce();
      expect(errorHandler.mock.calls[0]![0]).toBe('test-tool');
      expect(errorHandler.mock.calls[0]![1]).toBeInstanceOf(ToolExecutionError);
    });

    it('should support unsubscribing from events', async () => {
      const executor = new ToolExecutor(new PermissionManager(ALLOW_ALL_POLICY));
      const tool = makeTool();
      const handler = vi.fn();

      executor.on('tool:execute:start', handler);
      executor.off('tool:execute:start', handler);
      await executor.execute(tool, {});

      expect(handler).not.toHaveBeenCalled();
    });
  });
});
