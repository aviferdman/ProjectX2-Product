/**
 * `@tool` decorator — mark class methods as tools and collect them.
 *
 * Uses TypeScript experimental decorators (`experimentalDecorators: true`).
 *
 * @example
 * ```typescript
 * import { tool, collectTools, ToolCategory } from '@crewspace/core';
 *
 * class MyToolbox {
 *   \@tool({
 *     description: 'Greet a user by name',
 *     category: ToolCategory.CUSTOM,
 *     inputSchema: {
 *       type: 'object',
 *       properties: { name: { type: 'string' } },
 *       required: ['name'],
 *     },
 *   })
 *   async greet(input: unknown): Promise<string> {
 *     const { name } = input as { name: string };
 *     return `Hello, ${name}!`;
 *   }
 * }
 *
 * const tools = collectTools(new MyToolbox());
 * // → [{ name: 'greet', description: 'Greet a user by name', ... }]
 * ```
 *
 * @packageDocumentation
 */

import { ToolConfigError } from '../errors/tool-errors.js';
import type { Tool, ToolCategory, ToolParameterSchema, ToolPermission } from '../types/tool.js';
import { validateToolConfig } from './validation.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Options for the {@link tool} decorator.
 *
 * When `name` is omitted it defaults to the decorated method's name.
 */
export interface ToolDecoratorOptions {
  /** Tool name override. Defaults to the method name. */
  readonly name?: string;
  /** Human-readable description (required). */
  readonly description: string;
  /** Broad category for grouping. */
  readonly category?: ToolCategory;
  /** Required permissions. */
  readonly permissions?: readonly ToolPermission[];
  /** JSON Schema for input. */
  readonly inputSchema?: ToolParameterSchema;
  /** JSON Schema for output. */
  readonly outputSchema?: ToolParameterSchema;
  /** Max execution time in ms. */
  readonly timeout?: number;
}

/** @internal Stored metadata per decorated method. */
interface StoredToolMeta extends ToolDecoratorOptions {
  readonly resolvedName: string;
  readonly methodName: string;
}

// ---------------------------------------------------------------------------
// Metadata store (class prototype → metadata list)
// ---------------------------------------------------------------------------

/**
 * WeakMap keyed by class **prototype** → array of tool metadata.
 *
 * Legacy TypeScript decorators operate on the prototype, so we store
 * metadata there and read it back from an instance's prototype chain
 * in {@link collectTools}.
 *
 * @internal
 */
const _toolMetadata = new WeakMap<object, StoredToolMeta[]>();

/** @internal Get (or create) the metadata list for a given prototype. */
function _getMetadataList(proto: object): StoredToolMeta[] {
  let list = _toolMetadata.get(proto);
  if (!list) {
    list = [];
    _toolMetadata.set(proto, list);
  }
  return list;
}

// ---------------------------------------------------------------------------
// @tool decorator (legacy TypeScript method decorator)
// ---------------------------------------------------------------------------

const NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

/**
 * Legacy TypeScript method decorator that marks a class method as a tool.
 *
 * The decorated method's signature should match
 * `(input: unknown) => Promise<unknown>`.
 *
 * Use {@link collectTools} to extract `Tool[]` from a class instance.
 *
 * @param options - Tool configuration (at minimum `description`)
 *
 * @example
 * ```typescript
 * class SearchTools {
 *   \@tool({ description: 'Search the web' })
 *   async webSearch(input: unknown): Promise<unknown> {
 *     // ...
 *   }
 * }
 * ```
 */
export function tool(options: ToolDecoratorOptions) {
  return function (
    _target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const methodName = String(propertyKey);
    const resolvedName = options.name ?? methodName;

    // Validate eagerly at decoration time.
    if (!NAME_PATTERN.test(resolvedName)) {
      throw new ToolConfigError(
        `Tool name "${resolvedName}" must start with a letter and contain only letters, digits, hyphens, or underscores`,
        resolvedName,
      );
    }

    if (!options.description || options.description.trim().length === 0) {
      throw new ToolConfigError('description must not be empty', resolvedName);
    }

    // Store metadata on the prototype.
    const proto = _target as object;
    const list = _getMetadataList(proto);
    list.push({
      ...options,
      resolvedName,
      methodName,
    });

    return descriptor;
  };
}

// ---------------------------------------------------------------------------
// collectTools
// ---------------------------------------------------------------------------

/**
 * Extract an array of {@link Tool} objects from a class instance whose
 * methods have been decorated with {@link tool}.
 *
 * Each decorated method becomes a standalone `Tool` that delegates
 * `execute()` to the bound method on the instance.
 *
 * @param instance - An object with `@tool`-decorated methods
 * @returns Array of validated, frozen `Tool` instances
 * @throws {ToolConfigError} If any tool metadata is invalid
 *
 * @example
 * ```typescript
 * const toolbox = new MyToolbox();
 * const tools = collectTools(toolbox);
 * registry.register(tools[0]);
 * ```
 */
export function collectTools(instance: object): Tool[] {
  const proto = Object.getPrototypeOf(instance) as object | null;
  if (!proto) {
    return [];
  }

  const metaList = _toolMetadata.get(proto);
  if (!metaList || metaList.length === 0) {
    return [];
  }

  const tools: Tool[] = [];

  for (const meta of metaList) {
    const method = (instance as Record<string, unknown>)[meta.methodName];
    if (typeof method !== 'function') {
      throw new ToolConfigError(
        `Method "${meta.methodName}" is not a function on the instance`,
        meta.resolvedName,
      );
    }

    const boundExecute = method.bind(instance) as (input: unknown) => Promise<unknown>;

    const config = {
      name: meta.resolvedName,
      description: meta.description,
      ...(meta.category !== undefined && { category: meta.category }),
      ...(meta.permissions !== undefined && { permissions: meta.permissions }),
      ...(meta.inputSchema !== undefined && { inputSchema: meta.inputSchema }),
      ...(meta.outputSchema !== undefined && { outputSchema: meta.outputSchema }),
      ...(meta.timeout !== undefined && { timeout: meta.timeout }),
    };

    try {
      validateToolConfig(config);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new ToolConfigError(message, meta.resolvedName);
    }

    const toolInstance: Tool = {
      ...config,
      execute: boundExecute,
    };

    tools.push(Object.freeze(toolInstance));
  }

  return tools;
}

/**
 * Check whether an object instance has any `@tool`-decorated methods.
 *
 * @param instance - Object to check
 * @returns `true` if at least one method is decorated
 */
export function hasTools(instance: object): boolean {
  const proto = Object.getPrototypeOf(instance) as object | null;
  if (!proto) {
    return false;
  }
  const list = _toolMetadata.get(proto);
  return list !== undefined && list.length > 0;
}
