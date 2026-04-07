/**
 * Mock tool factories for testing agent tool interactions.
 *
 * @packageDocumentation
 */

import { vi } from 'vitest';

import type { Tool, ToolCategory, ToolParameterSchema, ToolPermission } from '../types/tool.js';

// ---------------------------------------------------------------------------
// Mock tool options
// ---------------------------------------------------------------------------

/** Options for configuring a mock tool. */
export interface MockToolOptions {
  /** Tool name (default: `"mock-tool"`). */
  readonly name?: string;

  /** Tool description (default: auto-generated from name). */
  readonly description?: string;

  /** Tool category. */
  readonly category?: ToolCategory;

  /** Permissions the tool declares. */
  readonly permissions?: readonly ToolPermission[];

  /** JSON schema for the tool input. */
  readonly inputSchema?: ToolParameterSchema;

  /** Static result to return from `execute` (default: `"tool result"`). */
  readonly result?: unknown;

  /** Artificial delay in milliseconds before resolving (default: `0`). */
  readonly delayMs?: number;

  /** If provided, `execute` will reject with this error. */
  readonly error?: Error;

  /**
   * Dynamic handler called on each `execute` invocation.
   * When set, overrides `result` and `error`.
   */
  readonly handler?: (input: unknown) => Promise<unknown>;
}

// ---------------------------------------------------------------------------
// createMockTool
// ---------------------------------------------------------------------------

/**
 * Create a mock {@link Tool} for testing.
 *
 * The returned tool's `execute` is a Vitest spy that resolves with the
 * configured result. Call assertions (`.toHaveBeenCalledWith(...)`) work
 * out of the box.
 *
 * @example
 * ```typescript
 * const tool = createMockTool({ name: 'search', result: 'search results' });
 * const agent = new Agent({ id: 'a', role: 'R', goal: 'G', tools: [tool] });
 * expect(agent.hasTool('search')).toBe(true);
 * ```
 */
export function createMockTool(
  options: MockToolOptions = {},
): Tool & { execute: ReturnType<typeof vi.fn> } {
  const {
    name = 'mock-tool',
    description,
    category,
    permissions,
    inputSchema,
    result = 'tool result',
    delayMs = 0,
    error,
    handler,
  } = options;

  const execute = vi
    .fn<(input: unknown) => Promise<unknown>>()
    .mockImplementation(async (input) => {
      if (delayMs > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
      }

      if (error) {
        throw error;
      }

      if (handler) {
        return handler(input);
      }

      return result;
    });

  return {
    name,
    description: description ?? `A mock tool called ${name}`,
    ...(category !== undefined ? { category } : {}),
    ...(permissions !== undefined ? { permissions } : {}),
    ...(inputSchema !== undefined ? { inputSchema } : {}),
    execute,
  };
}

// ---------------------------------------------------------------------------
// createTrackingMockTool
// ---------------------------------------------------------------------------

/**
 * Create a mock tool that records each invocation into a shared tracker array.
 *
 * @example
 * ```typescript
 * const calls: Array<{ tool: string; input: unknown }> = [];
 * const tool = createTrackingMockTool('search', calls);
 * await tool.execute({ query: 'AI' });
 * expect(calls).toEqual([{ tool: 'search', input: { query: 'AI' } }]);
 * ```
 */
export function createTrackingMockTool(
  name: string,
  tracker: Array<{ tool: string; input: unknown }>,
  options: Omit<MockToolOptions, 'name' | 'handler'> = {},
): Tool & { execute: ReturnType<typeof vi.fn> } {
  return createMockTool({
    ...options,
    name,
    handler: async (input) => {
      tracker.push({ tool: name, input });
      return options.result ?? `${name} result`;
    },
  });
}
