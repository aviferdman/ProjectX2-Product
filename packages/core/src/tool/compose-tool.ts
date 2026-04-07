/**
 * Tool composition — create tools that can invoke other tools.
 *
 * {@link composeTool} produces a {@link ComposableTool} whose `execute`
 * callback receives a {@link ToolContext}, giving it the ability to call
 * other tools in the registry. The {@link ToolExecutor} detects composable
 * tools automatically and wires the context at execution time.
 *
 * @packageDocumentation
 */

import type { ZodType } from 'zod';

import { ToolConfigError } from '../errors/tool-errors.js';
import type { Tool, ToolCategory, ToolParameterSchema, ToolPermission } from '../types/tool.js';
import { zodToToolSchema } from './define-tool.js';
import { parseToolInput, validateToolConfig } from './validation.js';
import type { ToolContext } from './tool-context.js';

// ---------------------------------------------------------------------------
// Marker for composable tools
// ---------------------------------------------------------------------------

/** @internal Symbol used to identify composable tools at runtime. */
const COMPOSABLE_MARKER = Symbol.for('crewspace:composable');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Options accepted by {@link composeTool}.
 *
 * @typeParam TInput  - The (optionally Zod-inferred) input type
 * @typeParam TOutput - The return type of `execute`
 */
export interface ComposeToolOptions<TInput = unknown, TOutput = unknown> {
  /** Unique tool name. Must match `^[a-zA-Z][a-zA-Z0-9_-]*$`. */
  readonly name: string;
  /** Human-readable description. */
  readonly description: string;
  /** Broad category for grouping. */
  readonly category?: ToolCategory;
  /** Required permissions. */
  readonly permissions?: readonly ToolPermission[];
  /** JSON Schema for input (auto-derived from `schema` when omitted). */
  readonly inputSchema?: ToolParameterSchema;
  /** Zod schema for runtime input validation and type inference. */
  readonly schema?: ZodType<TInput>;
  /** JSON Schema for output (informational). */
  readonly outputSchema?: ToolParameterSchema;
  /** Maximum execution time in ms (0 = no limit). */
  readonly timeout?: number;
  /**
   * The function that performs the tool's work.
   *
   * @param input   - Validated input (typed via Zod schema if provided)
   * @param context - {@link ToolContext} for invoking other tools
   */
  readonly execute: (input: TInput, context: ToolContext) => Promise<TOutput>;
}

/**
 * A {@link Tool} that supports composition — its execution can call
 * other tools through a {@link ToolContext}.
 *
 * Created by {@link composeTool}. The {@link ToolExecutor} detects
 * composable tools via {@link isComposableTool} and provides the
 * context automatically.
 */
export interface ComposableTool extends Tool {
  /**
   * Execute the tool with a provided {@link ToolContext}.
   *
   * Called by the {@link ToolExecutor} when it detects a composable tool.
   * External callers should use the standard `execute()` method (which
   * uses a no-op context that throws on `callTool`).
   */
  executeComposed(input: unknown, context: ToolContext): Promise<unknown>;
}

/**
 * Runtime type guard — checks whether a tool is a {@link ComposableTool}.
 *
 * @param tool - The tool to check
 * @returns `true` if the tool was created by {@link composeTool}
 */
export function isComposableTool(tool: Tool): tool is ComposableTool {
  const record = tool as unknown as Record<string | symbol, unknown>;
  return (
    COMPOSABLE_MARKER in tool &&
    record[COMPOSABLE_MARKER] === true &&
    typeof record['executeComposed'] === 'function'
  );
}

// ---------------------------------------------------------------------------
// No-op context (used when a composable tool is called without a context)
// ---------------------------------------------------------------------------

/** @internal */
const NO_OP_CONTEXT: ToolContext = Object.freeze({
  callTool(): Promise<never> {
    throw new Error(
      'Tool composition context is not available. ' +
        'Use ToolExecutor to execute composable tools so the context is wired automatically.',
    );
  },
  hasTool(): boolean {
    return false;
  },
  getToolNames(): readonly string[] {
    return [];
  },
  depth: 0,
  maxDepth: 0,
});

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a tool that can invoke other tools during execution.
 *
 * The `execute` callback receives a {@link ToolContext} as its second
 * parameter, providing `callTool`, `hasTool`, and `getToolNames`.
 *
 * When executed through the {@link ToolExecutor} the context is wired
 * to the executor's registry and permission manager automatically.
 * When called directly via `tool.execute(input)`, a no-op context is
 * provided that throws on `callTool`.
 *
 * @param options - Tool definition with a context-aware execute function
 * @returns A frozen {@link ComposableTool}
 * @throws {ToolConfigError} If static config is invalid
 *
 * @example
 * ```typescript
 * import { composeTool, ToolCategory } from '@crewspace/core';
 * import { z } from 'zod';
 *
 * const researchTool = composeTool({
 *   name: 'research',
 *   description: 'Search the web and extract text from results',
 *   category: ToolCategory.WEB,
 *   schema: z.object({ topic: z.string() }),
 *   async execute({ topic }, ctx) {
 *     const search = await ctx.callTool('webSearch', { query: topic });
 *     if (!search.success) return { error: search.error };
 *     const parse = await ctx.callTool('parseHtml', {
 *       html: search.data,
 *       extract: 'text',
 *     });
 *     return { topic, text: parse.data };
 *   },
 * });
 * ```
 */
export function composeTool<TInput = unknown, TOutput = unknown>(
  options: ComposeToolOptions<TInput, TOutput>,
): ComposableTool {
  const zodSchema = options.schema;

  // Derive inputSchema from Zod schema when not explicitly provided
  const inputSchema = options.inputSchema ?? (zodSchema ? zodToToolSchema(zodSchema) : undefined);

  // Build config for validation (without execute)
  const configForValidation = {
    name: options.name,
    description: options.description,
    ...(options.category !== undefined && { category: options.category }),
    ...(options.permissions !== undefined && { permissions: options.permissions }),
    ...(inputSchema !== undefined && { inputSchema }),
    ...(options.outputSchema !== undefined && { outputSchema: options.outputSchema }),
    ...(options.timeout !== undefined && { timeout: options.timeout }),
  };

  try {
    validateToolConfig(configForValidation);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new ToolConfigError(message, options.name);
  }

  if (typeof options.execute !== 'function') {
    throw new ToolConfigError('execute must be a function', options.name);
  }

  const userExecute = options.execute;

  /** Validate + invoke the user's execute with a context. */
  function runWithContext(input: unknown, context: ToolContext): Promise<unknown> {
    if (zodSchema) {
      const parsed = parseToolInput(options.name, zodSchema, input) as TInput;
      return userExecute(parsed, context);
    }
    return userExecute(input as TInput, context);
  }

  const tool = {
    name: options.name,
    description: options.description,
    ...(options.category !== undefined && { category: options.category }),
    ...(options.permissions !== undefined && { permissions: options.permissions }),
    ...(inputSchema !== undefined && { inputSchema }),
    ...(zodSchema !== undefined && { inputZodSchema: zodSchema }),
    ...(options.outputSchema !== undefined && { outputSchema: options.outputSchema }),
    ...(options.timeout !== undefined && { timeout: options.timeout }),

    // Standard execute — uses no-op context
    async execute(input: unknown): Promise<unknown> {
      return runWithContext(input, NO_OP_CONTEXT);
    },

    // Composed execute — receives a real context from ToolExecutor
    async executeComposed(input: unknown, context: ToolContext): Promise<unknown> {
      return runWithContext(input, context);
    },
  } as ComposableTool;

  // Attach the composable marker (not in the interface, used by isComposableTool)
  Object.defineProperty(tool, COMPOSABLE_MARKER, {
    value: true,
    enumerable: false,
    writable: false,
    configurable: false,
  });

  return Object.freeze(tool);
}
