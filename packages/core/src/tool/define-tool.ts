/**
 * Type-safe tool definition with Zod schema integration.
 *
 * `defineTool` lets you declare a tool's input shape as a Zod schema,
 * giving you **typed `execute` parameters** and automatic JSON Schema
 * generation for LLM function-calling.
 *
 * @packageDocumentation
 */

import type { ZodType } from 'zod';

import { ToolConfigError } from '../errors/tool-errors.js';
import type { Tool, ToolCategory, ToolParameterSchema, ToolPermission } from '../types/tool.js';
import { validateToolConfig } from './validation.js';

// ---------------------------------------------------------------------------
// Zod → JSON Schema converter (lightweight, covers common types)
// ---------------------------------------------------------------------------

/**
 * Convert a Zod schema to a simplified {@link ToolParameterSchema}.
 *
 * This handles the most common Zod types that appear in tool input schemas.
 * For exotic types the converter falls back to `{ type: 'unknown' }`.
 */
export function zodToToolSchema(schema: ZodType): ToolParameterSchema {
  return convertZodNode(schema);
}

/** @internal */
function convertZodNode(node: ZodType): ToolParameterSchema {
  // Access Zod internals via the _def property.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  const def = (node as any)._def as Record<string, unknown>;
  const typeName = def['typeName'] as string | undefined;

  switch (typeName) {
    case 'ZodString':
      return withDescription(def, { type: 'string' });
    case 'ZodNumber':
      return withDescription(def, { type: 'number' });
    case 'ZodBoolean':
      return withDescription(def, { type: 'boolean' });
    case 'ZodLiteral':
      return withDescription(def, {
        type: typeof def['value'] === 'string' ? 'string' : typeof def['value'] === 'number' ? 'number' : 'string',
        enum: [def['value']],
      });
    case 'ZodEnum': {
      const values = def['values'] as readonly unknown[];
      return withDescription(def, { type: 'string', enum: values });
    }
    case 'ZodNativeEnum': {
      const enumObj = def['values'] as Record<string, unknown>;
      const values = Object.values(enumObj).filter((v) => typeof v === 'string' || typeof v === 'number');
      return withDescription(def, { type: 'string', enum: values });
    }
    case 'ZodArray': {
      const innerType = def['type'] as ZodType;
      return withDescription(def, { type: 'array', items: convertZodNode(innerType) });
    }
    case 'ZodObject': {
      const shape = def['shape'] as (() => Record<string, ZodType>) | Record<string, ZodType>;
      const resolvedShape = typeof shape === 'function' ? shape() : shape;
      const properties: Record<string, ToolParameterSchema> = {};
      const required: string[] = [];

      for (const [key, value] of Object.entries(resolvedShape)) {
        properties[key] = convertZodNode(value);
        if (!isOptionalZod(value)) {
          required.push(key);
        }
      }

      const result: ToolParameterSchema = {
        type: 'object',
        properties,
        ...(required.length > 0 && { required }),
      };
      return withDescription(def, result);
    }
    case 'ZodOptional':
    case 'ZodNullable': {
      const inner = def['innerType'] as ZodType;
      return convertZodNode(inner);
    }
    case 'ZodDefault': {
      const inner = def['innerType'] as ZodType;
      return convertZodNode(inner);
    }
    case 'ZodEffects': {
      const inner = def['schema'] as ZodType;
      return convertZodNode(inner);
    }
    case 'ZodUnion': {
      const options = def['options'] as ZodType[];
      if (options.length === 1) {
        return convertZodNode(options[0]!);
      }
      // Simple heuristic: if all options are the same primitive, use that type
      const types = options.map((o) => convertZodNode(o));
      const uniqueTypes = new Set(types.map((t) => t.type));
      if (uniqueTypes.size === 1) {
        return { type: types[0]!.type };
      }
      return { type: 'string', description: 'union type' };
    }
    case 'ZodRecord': {
      return withDescription(def, { type: 'object' });
    }
    default:
      return { type: 'string' };
  }
}

/** @internal */
function isOptionalZod(node: ZodType): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  const typeName = ((node as any)._def as Record<string, unknown>)['typeName'] as string | undefined;
  return typeName === 'ZodOptional' || typeName === 'ZodDefault';
}

/** @internal */
function withDescription(
  def: Record<string, unknown>,
  base: ToolParameterSchema,
): ToolParameterSchema {
  const description = def['description'] as string | undefined;
  if (description) {
    return { ...base, description };
  }
  return base;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Options accepted by {@link defineTool}.
 *
 * @typeParam TInput  - The Zod-inferred input type
 * @typeParam TOutput - The return type of `execute`
 */
export interface DefineToolOptions<TInput, TOutput> {
  /** Unique tool name. Must match `^[a-zA-Z][a-zA-Z0-9_-]*$`. */
  readonly name: string;
  /** Human-readable description. */
  readonly description: string;
  /** Broad category for grouping. */
  readonly category?: ToolCategory;
  /** Required permissions. */
  readonly permissions?: readonly ToolPermission[];
  /** Zod schema for input — provides both runtime validation and type inference. */
  readonly schema: ZodType<TInput>;
  /** JSON Schema for output (informational). */
  readonly outputSchema?: ToolParameterSchema;
  /** Maximum execution time in ms (0 = no limit). */
  readonly timeout?: number;
  /**
   * The function that performs the tool's work.
   *
   * The `input` parameter is fully typed according to the Zod `schema`.
   */
  readonly execute: (input: TInput) => Promise<TOutput>;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a type-safe {@link Tool} whose input is validated at runtime by
 * a Zod schema. The `execute` callback receives the **parsed & typed** input.
 *
 * The Zod schema is also converted to a {@link ToolParameterSchema} (JSON Schema
 * subset) so LLM providers can use it for function-calling parameter generation.
 *
 * @param options - Tool definition with Zod schema
 * @returns A frozen, valid {@link Tool}
 * @throws {ToolConfigError} If static config is invalid
 *
 * @example
 * ```typescript
 * import { defineTool, ToolCategory } from '@crewspace/core';
 * import { z } from 'zod';
 *
 * const calculatorTool = defineTool({
 *   name: 'calculator',
 *   description: 'Perform basic arithmetic',
 *   category: ToolCategory.DATA,
 *   schema: z.object({
 *     operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
 *     a: z.number(),
 *     b: z.number(),
 *   }),
 *   async execute({ operation, a, b }) {
 *     switch (operation) {
 *       case 'add': return a + b;
 *       case 'subtract': return a - b;
 *       case 'multiply': return a * b;
 *       case 'divide': return a / b;
 *     }
 *   },
 * });
 * ```
 */
export function defineTool<TInput, TOutput>(
  options: DefineToolOptions<TInput, TOutput>,
): Tool {
  // Convert Zod schema to JSON Schema for the Tool interface
  const inputSchema = zodToToolSchema(options.schema);

  // Build a config object for validation (without execute)
  const configForValidation = {
    name: options.name,
    description: options.description,
    ...(options.category !== undefined && { category: options.category }),
    ...(options.permissions !== undefined && { permissions: options.permissions }),
    inputSchema,
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

  const zodSchema = options.schema;
  const userExecute = options.execute;

  const tool: Tool = {
    name: options.name,
    description: options.description,
    ...(options.category !== undefined && { category: options.category }),
    ...(options.permissions !== undefined && { permissions: options.permissions }),
    inputSchema,
    ...(options.outputSchema !== undefined && { outputSchema: options.outputSchema }),
    ...(options.timeout !== undefined && { timeout: options.timeout }),
    async execute(input: unknown): Promise<unknown> {
      const parsed = zodSchema.parse(input) as TInput;
      return userExecute(parsed);
    },
  };

  return Object.freeze(tool);
}
