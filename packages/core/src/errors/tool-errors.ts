/**
 * Custom error classes for tool operations.
 *
 * @packageDocumentation
 */

import type { ToolPermission } from '../types/tool.js';

/** Thrown when tool configuration is invalid. */
export class ToolConfigError extends Error {
  public readonly toolName: string | undefined;

  constructor(message: string, toolName?: string) {
    super(toolName ? `Tool "${toolName}": ${message}` : message);
    this.name = 'ToolConfigError';
    this.toolName = toolName;
  }
}

/** Thrown when a tool is not found in the registry. */
export class ToolNotFoundError extends Error {
  public readonly toolName: string;

  constructor(toolName: string) {
    super(`Tool "${toolName}" is not registered`);
    this.name = 'ToolNotFoundError';
    this.toolName = toolName;
  }
}

/** Thrown when tool execution fails. */
export class ToolExecutionError extends Error {
  public readonly toolName: string;
  public override readonly cause: Error | undefined;

  constructor(toolName: string, message: string, cause?: Error) {
    super(`Tool "${toolName}" execution failed: ${message}`);
    this.name = 'ToolExecutionError';
    this.toolName = toolName;
    this.cause = cause;
  }
}

/** Thrown when a tool requires permissions that are denied by the active policy. */
export class ToolPermissionError extends Error {
  public readonly toolName: string;
  public readonly requiredPermissions: readonly ToolPermission[];
  public readonly deniedPermissions: readonly ToolPermission[];

  constructor(
    toolName: string,
    requiredPermissions: readonly ToolPermission[],
    deniedPermissions: readonly ToolPermission[],
  ) {
    const denied = deniedPermissions.join(', ');
    super(`Tool "${toolName}" requires permissions that are denied: ${denied}`);
    this.name = 'ToolPermissionError';
    this.toolName = toolName;
    this.requiredPermissions = requiredPermissions;
    this.deniedPermissions = deniedPermissions;
  }
}

/** Thrown when a tool exceeds its configured execution timeout. */
export class ToolTimeoutError extends Error {
  public readonly toolName: string;
  public readonly timeoutMs: number;

  constructor(toolName: string, timeoutMs: number) {
    super(`Tool "${toolName}" exceeded timeout of ${String(timeoutMs)}ms`);
    this.name = 'ToolTimeoutError';
    this.toolName = toolName;
    this.timeoutMs = timeoutMs;
  }
}
