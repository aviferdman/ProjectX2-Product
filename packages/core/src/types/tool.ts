/**
 * Tool interface for agent capabilities.
 *
 * Tools extend an agent's abilities beyond LLM text generation — file I/O,
 * web requests, shell execution, or any custom operation.
 *
 * Each tool declares its required {@link ToolPermission}s so the framework
 * can enforce security policies before execution.
 *
 * @packageDocumentation
 */

import type { ZodType } from 'zod';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/**
 * Permission categories that tools can request.
 *
 * Agents must be granted these permissions via a {@link ToolPermissionPolicy}
 * before a tool requiring them can be executed.
 */
export enum ToolPermission {
  /** Read files from the local file system. */
  FILE_READ = 'file:read',
  /** Write or modify files on the local file system. */
  FILE_WRITE = 'file:write',
  /** Make outbound HTTP/HTTPS requests. */
  NETWORK = 'network',
  /** Execute shell commands or spawn child processes. */
  SHELL_EXEC = 'shell:exec',
  /** Access environment variables. */
  ENV_ACCESS = 'env:access',
}

/**
 * Broad category for grouping tools in registries and documentation.
 */
export enum ToolCategory {
  FILE = 'file',
  WEB = 'web',
  SHELL = 'shell',
  DATA = 'data',
  CUSTOM = 'custom',
}

// ---------------------------------------------------------------------------
// JSON Schema (subset for tool parameter descriptions)
// ---------------------------------------------------------------------------

/**
 * Simplified JSON Schema object used to describe tool input/output shapes.
 *
 * Aligned with the OpenAI / Anthropic function-calling schema format so
 * that LLM providers can generate valid tool calls automatically.
 */
export interface ToolParameterSchema {
  /** JSON Schema type (e.g. "object", "string", "number"). */
  readonly type: string;
  /** Human-readable description of the schema. */
  readonly description?: string;
  /** Property definitions (when `type` is "object"). */
  readonly properties?: Readonly<Record<string, ToolParameterSchema>>;
  /** Required property names (when `type` is "object"). */
  readonly required?: readonly string[];
  /** Item schema (when `type` is "array"). */
  readonly items?: ToolParameterSchema;
  /** Allowed literal values (for enums). */
  readonly enum?: readonly unknown[];
}

// ---------------------------------------------------------------------------
// Tool result
// ---------------------------------------------------------------------------

/** Result of a single tool execution. */
export interface ToolResult {
  /** Whether the execution succeeded. */
  readonly success: boolean;
  /** Output data returned by the tool (any JSON-serialisable value). */
  readonly data?: unknown;
  /** Error message when `success` is false. */
  readonly error?: string;
  /** Execution duration in milliseconds. */
  readonly duration: number;
}

// ---------------------------------------------------------------------------
// Core Tool interface
// ---------------------------------------------------------------------------

/**
 * A tool that an agent can invoke during task execution.
 *
 * @example
 * ```typescript
 * const readFile: Tool = {
 *   name: 'readFile',
 *   description: 'Read the contents of a file from disk',
 *   category: ToolCategory.FILE,
 *   permissions: [ToolPermission.FILE_READ],
 *   inputSchema: {
 *     type: 'object',
 *     properties: {
 *       path: { type: 'string', description: 'Absolute file path' },
 *     },
 *     required: ['path'],
 *   },
 *   async execute(input) {
 *     const { path } = input as { path: string };
 *     return fs.promises.readFile(path, 'utf-8');
 *   },
 * };
 * ```
 */
export interface Tool {
  /** Unique tool name used for identification and LLM function calling. */
  readonly name: string;

  /** Human-readable description of what the tool does. */
  readonly description: string;

  /** Broad category for grouping and filtering (default: CUSTOM). */
  readonly category?: ToolCategory;

  /** Permissions this tool requires to operate. */
  readonly permissions?: readonly ToolPermission[];

  /**
   * JSON Schema describing the expected input.
   *
   * When provided the framework validates input before `execute()` is called,
   * and LLM providers can use it for function-calling parameter generation.
   */
  readonly inputSchema?: ToolParameterSchema;

  /**
   * Optional Zod schema for runtime input validation.
   *
   * When set, the {@link ToolExecutor} will parse input through this schema
   * before calling `execute()`, providing structured validation errors.
   * Tools created with {@link defineTool} set this automatically.
   */
  readonly inputZodSchema?: ZodType;

  /**
   * JSON Schema describing the output shape (informational — no runtime
   * validation is applied to outputs).
   */
  readonly outputSchema?: ToolParameterSchema;

  /** Maximum execution time in milliseconds (0 = no limit). */
  readonly timeout?: number;

  /**
   * Execute the tool with the given input.
   *
   * @param input - Tool-specific input (validated by the framework if `inputSchema` is set)
   * @returns The tool's output
   * @throws If the tool execution fails
   */
  execute(input: unknown): Promise<unknown>;
}

// ---------------------------------------------------------------------------
// Permission policy
// ---------------------------------------------------------------------------

/**
 * Policy that controls which {@link ToolPermission}s are available.
 *
 * Designed so that orchestrators, crews, or individual agents can declare
 * a security boundary for tool execution.
 *
 * @example
 * ```typescript
 * // Only allow file reads and network — deny everything else.
 * const policy: ToolPermissionPolicy = {
 *   defaultAction: 'deny',
 *   allowed: [ToolPermission.FILE_READ, ToolPermission.NETWORK],
 * };
 * ```
 *
 * @example
 * ```typescript
 * // Allow everything except shell execution.
 * const policy: ToolPermissionPolicy = {
 *   defaultAction: 'allow',
 *   denied: [ToolPermission.SHELL_EXEC],
 * };
 * ```
 */
export interface ToolPermissionPolicy {
  /** Fallback action when a permission is not listed in `allowed` or `denied`. */
  readonly defaultAction: 'allow' | 'deny';

  /** Permissions explicitly granted regardless of `defaultAction`. */
  readonly allowed?: readonly ToolPermission[];

  /** Permissions explicitly denied regardless of `defaultAction`. */
  readonly denied?: readonly ToolPermission[];
}

// ---------------------------------------------------------------------------
// Tool event map
// ---------------------------------------------------------------------------

/** Map of tool-system event names to their listener signatures. */
export interface ToolEventMap {
  /** Emitted before a tool starts executing. */
  'tool:execute:start': (toolName: string, input: unknown) => void;
  /** Emitted after a tool finishes executing. */
  'tool:execute:complete': (toolName: string, result: ToolResult) => void;
  /** Emitted when a tool execution fails. */
  'tool:execute:error': (toolName: string, error: Error) => void;
  /** Emitted when a permission check denies tool execution. */
  'tool:permission:denied': (
    toolName: string,
    required: readonly ToolPermission[],
    denied: readonly ToolPermission[],
  ) => void;
}
