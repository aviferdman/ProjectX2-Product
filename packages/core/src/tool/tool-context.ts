/**
 * Tool context for tool composition — allows tools to invoke other tools.
 *
 * A {@link ToolContext} is provided to composable tools (created via
 * {@link composeTool}) during execution, giving them access to the
 * tool registry and executor so they can orchestrate lower-level tools.
 *
 * @packageDocumentation
 */

import type { ToolResult } from '../types/tool.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Default maximum call depth for nested tool composition.
 *
 * Prevents infinite recursion when tools call each other.
 */
export const DEFAULT_MAX_COMPOSITION_DEPTH = 10;

// ---------------------------------------------------------------------------
// ToolContext interface
// ---------------------------------------------------------------------------

/**
 * Execution context provided to composable tools.
 *
 * Allows a tool's `execute` function to invoke other registered tools,
 * enabling composition patterns where a high-level tool orchestrates
 * multiple lower-level tools.
 *
 * @example
 * ```typescript
 * const researchTool = composeTool({
 *   name: 'research',
 *   description: 'Search the web and summarise results',
 *   async execute(input, ctx) {
 *     const searchResult = await ctx.callTool('webSearch', { query: input.topic });
 *     if (!searchResult.success) return { error: searchResult.error };
 *
 *     const parsed = await ctx.callTool('parseHtml', {
 *       html: searchResult.data,
 *       extract: 'text',
 *     });
 *     return { summary: parsed.data };
 *   },
 * });
 * ```
 */
export interface ToolContext {
  /**
   * Invoke another tool by name.
   *
   * The call goes through the same permission checks, input validation,
   * and timeout enforcement as a direct {@link ToolExecutor.execute} call.
   *
   * @param toolName - Name of the registered tool to invoke
   * @param input    - Input to pass to the tool
   * @returns A normalised {@link ToolResult}
   * @throws {ToolNotFoundError} If the tool is not registered
   * @throws {ToolCompositionError} If max call depth is exceeded
   */
  callTool(toolName: string, input: unknown): Promise<ToolResult>;

  /** Check whether a tool is available in the registry. */
  hasTool(toolName: string): boolean;

  /** List all available tool names in the registry. */
  getToolNames(): readonly string[];

  /** Current nesting depth (0 = top-level call). */
  readonly depth: number;

  /** Maximum allowed nesting depth. */
  readonly maxDepth: number;
}
