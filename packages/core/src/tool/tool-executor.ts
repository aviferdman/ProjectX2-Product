/**
 * Tool executor — safe tool invocation with permission checks and timeouts.
 *
 * The executor wraps a tool's `execute()` call with:
 * 1. Permission validation (via {@link PermissionManager})
 * 2. Timeout enforcement
 * 3. Error wrapping into typed {@link ToolExecutionError}
 * 4. Result normalization into {@link ToolResult}
 * 5. Automatic context wiring for composable tools
 *
 * @packageDocumentation
 */

import { EventEmitter } from 'eventemitter3';
import { ZodError } from 'zod';

import {
  ToolCompositionError,
  ToolExecutionError,
  ToolInputValidationError,
  ToolTimeoutError,
} from '../errors/tool-errors.js';
import type { ToolValidationIssue } from '../errors/tool-errors.js';
import type { Tool, ToolEventMap, ToolResult } from '../types/tool.js';
import { isComposableTool } from './compose-tool.js';
import type { ToolContext } from './tool-context.js';
import { DEFAULT_MAX_COMPOSITION_DEPTH } from './tool-context.js';
import type { PermissionManager } from './permission-manager.js';
import type { ToolRegistry } from './tool-registry.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_TIMEOUT_MS = 0; // 0 means no timeout

// ---------------------------------------------------------------------------
// Tool Executor
// ---------------------------------------------------------------------------

/**
 * Safe tool executor with permission checks, timeouts, event emission,
 * and automatic context wiring for composable tools.
 *
 * @example
 * ```typescript
 * const executor = new ToolExecutor(permissionManager);
 * const result = await executor.execute(readFileTool, { path: '/tmp/data.txt' });
 * console.log(result.success, result.data);
 * ```
 *
 * @example
 * ```typescript
 * // With a registry for tool composition support
 * const executor = new ToolExecutor(permissionManager, { registry });
 * const result = await executor.execute(composedTool, { topic: 'AI' });
 * ```
 */
export class ToolExecutor {
  private readonly _permissionManager: PermissionManager;
  private readonly _emitter = new EventEmitter<ToolEventMap>();
  private readonly _registry: ToolRegistry | undefined;
  private readonly _maxCompositionDepth: number;

  constructor(
    permissionManager: PermissionManager,
    options?: {
      /** Tool registry for resolving tool names in composition contexts. */
      registry?: ToolRegistry;
      /** Maximum nesting depth for tool composition (default: 10). */
      maxCompositionDepth?: number;
    },
  ) {
    this._permissionManager = permissionManager;
    this._registry = options?.registry;
    this._maxCompositionDepth = options?.maxCompositionDepth ?? DEFAULT_MAX_COMPOSITION_DEPTH;
  }

  /** The active permission manager. */
  get permissionManager(): PermissionManager {
    return this._permissionManager;
  }

  /** The tool registry (if configured). */
  get registry(): ToolRegistry | undefined {
    return this._registry;
  }

  /** Maximum composition depth. */
  get maxCompositionDepth(): number {
    return this._maxCompositionDepth;
  }

  /**
   * Execute a tool with permission checking, input validation, timeout
   * enforcement, and structured result wrapping.
   *
   * Composable tools (created via {@link composeTool}) automatically
   * receive a {@link ToolContext} wired to the executor's registry.
   *
   * @param tool  - The tool to execute
   * @param input - Input to pass to the tool
   * @returns A normalized {@link ToolResult}
   * @throws {ToolPermissionError} If the tool's permissions are denied
   * @throws {ToolInputValidationError} If input fails Zod schema validation
   */
  async execute(tool: Tool, input: unknown): Promise<ToolResult> {
    return this._executeAtDepth(tool, input, 0);
  }

  // -------------------------------------------------------------------------
  // Events
  // -------------------------------------------------------------------------

  /**
   * Subscribe to a tool execution lifecycle event.
   *
   * @param event    - The event name to listen for
   * @param listener - The callback to invoke when the event fires
   */
  on<E extends keyof ToolEventMap>(event: E, listener: ToolEventMap[E]): this {
    this._emitter.on(event, listener as (...args: unknown[]) => void);
    return this;
  }

  /**
   * Unsubscribe from a tool execution lifecycle event.
   *
   * @param event    - The event name to unsubscribe from
   * @param listener - The callback to remove
   */
  off<E extends keyof ToolEventMap>(event: E, listener: ToolEventMap[E]): this {
    this._emitter.off(event, listener as (...args: unknown[]) => void);
    return this;
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /** @internal Execute a tool at a given composition depth. */
  private async _executeAtDepth(tool: Tool, input: unknown, depth: number): Promise<ToolResult> {
    // 1. Permission check (throws ToolPermissionError if denied)
    this._permissionManager.checkTool(tool);

    // 2. Input validation (throws ToolInputValidationError if invalid)
    if (tool.inputZodSchema) {
      this._validateInput(tool.name, tool.inputZodSchema, input);
    }

    this._emit('tool:execute:start', tool.name, input);

    const startTime = Date.now();
    const timeoutMs = tool.timeout ?? DEFAULT_TIMEOUT_MS;

    try {
      let data: unknown;

      if (isComposableTool(tool)) {
        const context = this._createContext(depth);
        const executePromise = tool.executeComposed(input, context);
        data =
          timeoutMs > 0
            ? await this._raceTimeout(tool.name, executePromise, timeoutMs)
            : await executePromise;
      } else {
        data =
          timeoutMs > 0
            ? await this._executeWithTimeout(tool, input, timeoutMs)
            : await tool.execute(input);
      }

      const result: ToolResult = {
        success: true,
        data,
        duration: Date.now() - startTime,
      };

      this._emit('tool:execute:complete', tool.name, result);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const wrappedError = this._wrapError(tool.name, error);
      this._emit('tool:execute:error', tool.name, wrappedError);

      return {
        success: false,
        error: wrappedError.message,
        duration,
      };
    }
  }

  /** @internal Create a ToolContext for a composable tool at the given depth. */
  private _createContext(currentDepth: number): ToolContext {
    const executor = this;
    const maxDepth = this._maxCompositionDepth;
    const nextDepth = currentDepth + 1;

    return {
      depth: currentDepth,
      maxDepth,

      async callTool(toolName: string, input: unknown): Promise<ToolResult> {
        if (nextDepth > maxDepth) {
          throw new ToolCompositionError(
            toolName,
            `Maximum composition depth (${String(maxDepth)}) exceeded at depth ${String(nextDepth)}`,
            nextDepth,
            maxDepth,
          );
        }

        if (!executor._registry) {
          throw new ToolCompositionError(
            toolName,
            'Tool composition requires a ToolRegistry. Pass { registry } to the ToolExecutor constructor.',
            nextDepth,
            maxDepth,
          );
        }

        const tool = executor._registry.get(toolName);
        return executor._executeAtDepth(tool, input, nextDepth);
      },

      hasTool(toolName: string): boolean {
        return executor._registry?.has(toolName) ?? false;
      },

      getToolNames(): readonly string[] {
        return executor._registry?.getNames() ?? [];
      },
    };
  }

  private _validateInput(toolName: string, schema: import('zod').ZodType, input: unknown): void {
    try {
      schema.parse(input);
    } catch (err: unknown) {
      if (err instanceof ZodError) {
        const issues: ToolValidationIssue[] = err.issues.map((issue) => ({
          path: issue.path.map(String).join('.'),
          message: issue.message,
          code: issue.code,
        }));
        throw new ToolInputValidationError(toolName, issues);
      }
      throw err;
    }
  }

  private async _executeWithTimeout(
    tool: Tool,
    input: unknown,
    timeoutMs: number,
  ): Promise<unknown> {
    return this._raceTimeout(tool.name, tool.execute(input), timeoutMs);
  }

  private async _raceTimeout(
    toolName: string,
    promise: Promise<unknown>,
    timeoutMs: number,
  ): Promise<unknown> {
    return new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new ToolTimeoutError(toolName, timeoutMs));
      }, timeoutMs);

      promise.then(
        (result) => {
          clearTimeout(timer);
          resolve(result);
        },
        (error: unknown) => {
          clearTimeout(timer);
          reject(error instanceof Error ? error : new Error(String(error)));
        },
      );
    });
  }

  private _wrapError(toolName: string, error: unknown): ToolExecutionError {
    if (error instanceof ToolExecutionError) {
      return error;
    }
    if (error instanceof ToolTimeoutError) {
      return new ToolExecutionError(toolName, error.message, error);
    }
    const cause = error instanceof Error ? error : new Error(String(error));
    return new ToolExecutionError(toolName, cause.message, cause);
  }

  private _emit<E extends keyof ToolEventMap>(
    event: E,
    ...args: Parameters<ToolEventMap[E]>
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this._emitter.emit as (event: string, ...args: any[]) => boolean)(event, ...args);
  }
}
