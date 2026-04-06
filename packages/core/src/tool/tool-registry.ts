/**
 * Tool registry — central registration and lookup for tools.
 *
 * The registry enforces unique tool names and provides lookup, iteration,
 * and filtering by category or permission.
 *
 * @packageDocumentation
 */

import { ToolConfigError, ToolNotFoundError } from '../errors/tool-errors.js';
import type { Tool, ToolCategory, ToolPermission } from '../types/tool.js';

// ---------------------------------------------------------------------------
// Tool Registry
// ---------------------------------------------------------------------------

/**
 * Central registry for managing tool instances.
 *
 * @example
 * ```typescript
 * const registry = new ToolRegistry();
 * registry.register(readFileTool);
 * registry.register(webFetchTool);
 *
 * const tool = registry.get('readFile');
 * const fileTools = registry.getByCategory(ToolCategory.FILE);
 * ```
 */
export class ToolRegistry {
  private readonly _tools = new Map<string, Tool>();

  /** Number of registered tools. */
  get size(): number {
    return this._tools.size;
  }

  /**
   * Register a tool.
   *
   * @param tool - Tool to register
   * @throws {ToolConfigError} If a tool with the same name is already registered
   * @throws {ToolConfigError} If the tool name is empty
   */
  register(tool: Tool): void {
    if (!tool.name || tool.name.trim().length === 0) {
      throw new ToolConfigError('Tool name must not be empty');
    }

    if (this._tools.has(tool.name)) {
      throw new ToolConfigError(
        `Tool "${tool.name}" is already registered. Use unregister() first to replace it.`,
        tool.name,
      );
    }

    this._tools.set(tool.name, tool);
  }

  /**
   * Remove a tool by name.
   *
   * @returns `true` if the tool was found and removed
   */
  unregister(name: string): boolean {
    return this._tools.delete(name);
  }

  /**
   * Look up a tool by name.
   *
   * @throws {ToolNotFoundError} If no tool with that name is registered
   */
  get(name: string): Tool {
    const tool = this._tools.get(name);
    if (!tool) {
      throw new ToolNotFoundError(name);
    }
    return tool;
  }

  /**
   * Look up a tool by name, returning `undefined` if not found.
   */
  find(name: string): Tool | undefined {
    return this._tools.get(name);
  }

  /** Check whether a tool with the given name is registered. */
  has(name: string): boolean {
    return this._tools.has(name);
  }

  /** Return all registered tools. */
  getAll(): readonly Tool[] {
    return Array.from(this._tools.values());
  }

  /** Return all registered tool names. */
  getNames(): readonly string[] {
    return Array.from(this._tools.keys());
  }

  /**
   * Return tools that belong to the specified category.
   */
  getByCategory(category: ToolCategory): readonly Tool[] {
    return this.getAll().filter((t) => t.category === category);
  }

  /**
   * Return tools that require the specified permission.
   */
  getByPermission(permission: ToolPermission): readonly Tool[] {
    return this.getAll().filter((t) => t.permissions?.includes(permission) ?? false);
  }

  /** Remove all registered tools. */
  clear(): void {
    this._tools.clear();
  }

  /** Iterate over registered tools. */
  [Symbol.iterator](): IterableIterator<Tool> {
    return this._tools.values();
  }

  /**
   * Create a registry pre-populated with the given tools.
   *
   * @param tools - Tools to register
   * @throws {ToolConfigError} If any tool has a duplicate name
   */
  static from(tools: readonly Tool[]): ToolRegistry {
    const registry = new ToolRegistry();
    for (const tool of tools) {
      registry.register(tool);
    }
    return registry;
  }
}
