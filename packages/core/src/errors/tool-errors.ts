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

/** Thrown when tool composition fails (e.g. max depth exceeded). */
export class ToolCompositionError extends ToolExecutionError {
  public readonly depth: number;
  public readonly maxDepth: number;

  constructor(toolName: string, message: string, depth: number, maxDepth: number) {
    super(toolName, message);
    this.name = 'ToolCompositionError';
    this.depth = depth;
    this.maxDepth = maxDepth;
  }
}

/** A single validation issue from Zod-based input validation. */
export interface ToolValidationIssue {
  /** Dot-delimited path to the invalid field (e.g. "path", "options.recursive"). */
  readonly path: string;
  /** Human-readable description of the issue. */
  readonly message: string;
  /** The Zod issue code (e.g. "invalid_type", "too_small"). */
  readonly code: string;
}

/** Thrown when tool composition fails (e.g. max depth exceeded). */
export class ToolCompositionError extends ToolExecutionError {
  public readonly depth: number;
  public readonly maxDepth: number;

  constructor(toolName: string, message: string, depth: number, maxDepth: number) {
    super(toolName, message);
    this.name = 'ToolCompositionError';
    this.depth = depth;
    this.maxDepth = maxDepth;
  }
}

/** Thrown when a tool's input fails Zod schema validation. */
export class ToolInputValidationError extends ToolExecutionError {
  public readonly issues: readonly ToolValidationIssue[];

  constructor(toolName: string, issues: readonly ToolValidationIssue[]) {
    const summary = issues.map((i) => (i.path ? `${i.path}: ${i.message}` : i.message)).join('; ');
    super(toolName, `input validation failed: ${summary}`);
    this.name = 'ToolInputValidationError';
    this.issues = issues;
  }
}
