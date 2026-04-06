/**
 * Tool executor — safe tool invocation with permission checks and timeouts.
 *
 * The executor wraps a tool's `execute()` call with:
 * 1. Permission validation (via {@link PermissionManager})
 * 2. Timeout enforcement
 * 3. Error wrapping into typed {@link ToolExecutionError}
 * 4. Result normalization into {@link ToolResult}
 *
 * @packageDocumentation
 */

import { EventEmitter } from 'eventemitter3';

import {
  ToolExecutionError,
  ToolTimeoutError,
} from '../errors/tool-errors.js';
import type { Tool, ToolEventMap, ToolResult } from '../types/tool.js';
import type { PermissionManager } from './permission-manager.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_TIMEOUT_MS = 0; // 0 means no timeout

// ---------------------------------------------------------------------------
// Tool Executor
// ---------------------------------------------------------------------------

/**
 * Safe tool executor with permission checks, timeouts, and event emission.
 *
 * @example
 * ```typescript
 * const executor = new ToolExecutor(permissionManager);
 * const result = await executor.execute(readFileTool, { path: '/tmp/data.txt' });
 * console.log(result.success, result.data);
 * ```
 */
export class ToolExecutor {
  private readonly _permissionManager: PermissionManager;
  private readonly _emitter = new EventEmitter<ToolEventMap>();

  constructor(permissionManager: PermissionManager) {
    this._permissionManager = permissionManager;
  }

  /** The active permission manager. */
  get permissionManager(): PermissionManager {
    return this._permissionManager;
  }

  /**
   * Execute a tool with permission checking, timeout enforcement, and
   * structured result wrapping.
   *
   * @param tool  - The tool to execute
   * @param input - Input to pass to the tool
   * @returns A normalized {@link ToolResult}
   * @throws {ToolPermissionError} If the tool's permissions are denied
   */
  async execute(tool: Tool, input: unknown): Promise<ToolResult> {
    // 1. Permission check (throws ToolPermissionError if denied)
    this._permissionManager.checkTool(tool);

    this._emit('tool:execute:start', tool.name, input);

    const startTime = Date.now();
    const timeoutMs = tool.timeout ?? DEFAULT_TIMEOUT_MS;

    try {
      const data = timeoutMs > 0
        ? await this._executeWithTimeout(tool, input, timeoutMs)
        : await tool.execute(input);

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

  // -------------------------------------------------------------------------
  // Events
  // -------------------------------------------------------------------------

  on<E extends keyof ToolEventMap>(event: E, listener: ToolEventMap[E]): this {
    this._emitter.on(event, listener as (...args: unknown[]) => void);
    return this;
  }

  off<E extends keyof ToolEventMap>(event: E, listener: ToolEventMap[E]): this {
    this._emitter.off(event, listener as (...args: unknown[]) => void);
    return this;
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private async _executeWithTimeout(
    tool: Tool,
    input: unknown,
    timeoutMs: number,
  ): Promise<unknown> {
    return new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new ToolTimeoutError(tool.name, timeoutMs));
      }, timeoutMs);

      tool.execute(input).then(
        (result) => {
          clearTimeout(timer);
          resolve(result);
        },
        (error: unknown) => {
          clearTimeout(timer);
          reject(error);
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
