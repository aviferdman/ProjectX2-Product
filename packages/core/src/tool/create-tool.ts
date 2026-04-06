/**
 * Factory function for creating validated {@link Tool} instances.
 *
 * `createTool` provides a simple, validated way to construct tools
 * without manually satisfying the full {@link Tool} interface.
 *
 * @packageDocumentation
 */

import type { ZodType } from 'zod';

import { ToolConfigError } from '../errors/tool-errors.js';
import type { Tool, ToolCategory, ToolParameterSchema, ToolPermission } from '../types/tool.js';
import { zodToToolSchema } from './define-tool.js';
import { parseToolInput, validateToolConfig } from './validation.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Options accepted by {@link createTool}.
 *
 * Mirrors the {@link Tool} interface but makes `execute` a required explicit
 * property so the factory can validate the full configuration.
 */
export interface CreateToolOptions {
  /** Unique tool name. Must match `^[a-zA-Z][a-zA-Z0-9_-]*$`. */
  readonly name: string;
  /** Human-readable description. */
  readonly description: string;
  /** Broad category for grouping. */
  readonly category?: ToolCategory;
  /** Required permissions. */
  readonly permissions?: readonly ToolPermission[];
  /** JSON Schema for input validation / LLM function calling. */
  readonly inputSchema?: ToolParameterSchema;
  /**
   * Optional Zod schema for runtime input validation.
   *
   * When provided, `execute` is wrapped to validate input via
   * `parseToolInput` before calling the user-supplied function.
   * The Zod schema is also auto-converted to a JSON Schema
   * (`inputSchema`) if `inputSchema` is not explicitly provided.
   */
  readonly inputZodSchema?: ZodType;
  /** JSON Schema for output (informational). */
  readonly outputSchema?: ToolParameterSchema;
  /** Maximum execution time in ms (0 = no limit). */
  readonly timeout?: number;
  /** The function that performs the tool's work. */
  readonly execute: (input: unknown) => Promise<unknown>;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a validated {@link Tool} from the given options.
 *
 * All configuration properties are validated via the existing Zod schemas
 * and a runtime check ensures `execute` is a function.
 *
 * @param options - Tool configuration
 * @returns A frozen, valid {@link Tool} instance
 * @throws {ToolConfigError} If any option is invalid
 *
 * @example
 * ```typescript
 * import { createTool, ToolCategory, ToolPermission } from '@crewspace/core';
 *
 * const greetTool = createTool({
 *   name: 'greet',
 *   description: 'Greet a user by name',
 *   category: ToolCategory.CUSTOM,
 *   inputSchema: {
 *     type: 'object',
 *     properties: { name: { type: 'string', description: 'Person name' } },
 *     required: ['name'],
 *   },
 *   async execute(input) {
 *     const { name } = input as { name: string };
 *     return `Hello, ${name}!`;
 *   },
 * });
 * ```
 */
export function createTool(options: CreateToolOptions): Tool {
  // Derive inputSchema from Zod schema when not explicitly provided
  const inputSchema =
    options.inputSchema ?? (options.inputZodSchema ? zodToToolSchema(options.inputZodSchema) : undefined);

  // Build config object for validation
  const configForValidation = {
    name: options.name,
    description: options.description,
    ...(options.category !== undefined && { category: options.category }),
    ...(options.permissions !== undefined && { permissions: options.permissions }),
    ...(inputSchema !== undefined && { inputSchema }),
    ...(options.outputSchema !== undefined && { outputSchema: options.outputSchema }),
    ...(options.timeout !== undefined && { timeout: options.timeout }),
  };

  // Validate static config (name, description, schemas, timeout, etc.)
  try {
    validateToolConfig(configForValidation);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new ToolConfigError(message, options.name);
  }

  // Validate execute is a function
  if (typeof options.execute !== 'function') {
    throw new ToolConfigError('execute must be a function', options.name);
  }

  const zodSchema = options.inputZodSchema;
  const userExecute = options.execute;

  const tool: Tool = {
    name: options.name,
    description: options.description,
    ...(options.category !== undefined && { category: options.category }),
    ...(options.permissions !== undefined && { permissions: options.permissions }),
    ...(inputSchema !== undefined && { inputSchema }),
    ...(zodSchema !== undefined && { inputZodSchema: zodSchema }),
    ...(options.outputSchema !== undefined && { outputSchema: options.outputSchema }),
    ...(options.timeout !== undefined && { timeout: options.timeout }),
    async execute(input: unknown): Promise<unknown> {
      if (zodSchema) {
        const parsed = parseToolInput(options.name, zodSchema, input);
        return userExecute(parsed);
      }
      return userExecute(input);
    },
  };

  return Object.freeze(tool);
}
