/**
 * Standalone validation functions for all Crewspace configuration objects.
 *
 * Each config type has two validation variants:
 * - **`validate*()`** — throws a {@link ValidationError} on invalid input
 * - **`safeValidate*()`** — returns a result object (never throws)
 *
 * These let consumers validate configs before passing them to
 * constructors, enabling early error detection and better DX.
 *
 * @packageDocumentation
 */

import { ZodError, type ZodSchema } from 'zod';

import type { AgentConfig } from '../types/agent.js';
import type { CrewConfig, CrewTask } from '../types/crew.js';
import type { LLMRequestOptions } from '../types/llm.js';
import type { TaskConfig } from '../types/task.js';
import type { ExecutionEngineConfig } from '../engine/types.js';

import {
  AgentConfigSchema,
  CrewConfigSchema,
  CrewTaskSchema,
  ExecutionEngineConfigSchema,
  LLMRequestOptionsSchema,
  TaskConfigSchema,
} from './schemas.js';

// ---------------------------------------------------------------------------
// Validation result type
// ---------------------------------------------------------------------------

/** Successful validation result. */
export interface ValidationSuccess<T> {
  readonly success: true;
  readonly data: T;
  readonly error: undefined;
}

/** Failed validation result. */
export interface ValidationFailure {
  readonly success: false;
  readonly data: undefined;
  readonly error: ValidationError;
}

/** Discriminated union of validation outcomes. */
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

// ---------------------------------------------------------------------------
// Validation error
// ---------------------------------------------------------------------------

/** Individual field-level validation issue. */
export interface ValidationIssue {
  /** Dot-separated path to the invalid field (e.g. "tasks.0.agentId"). */
  readonly path: string;
  /** Human-readable error message. */
  readonly message: string;
  /** Zod error code (e.g. "too_small", "invalid_type"). */
  readonly code: string;
}

/**
 * Error thrown by `validate*` functions when input is invalid.
 *
 * Provides structured access to all validation issues through the
 * {@link ValidationError.issues} array.
 */
export class ValidationError extends Error {
  /** Structured list of field-level issues. */
  public readonly issues: readonly ValidationIssue[];

  constructor(message: string, issues: readonly ValidationIssue[]) {
    super(message);
    this.name = 'ValidationError';
    this.issues = issues;
  }

  /**
   * Create a ValidationError from a ZodError.
   * @internal
   */
  static fromZodError(zodError: ZodError): ValidationError {
    const issues: ValidationIssue[] = zodError.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
      code: e.code,
    }));

    const message = issues.map((i) => (i.path ? `${i.path}: ${i.message}` : i.message)).join('; ');
    return new ValidationError(message, issues);
  }
}

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- TReturn needed for type-safe casting
function runValidation<TSchema, TReturn>(schema: ZodSchema<TSchema>, input: unknown): TReturn {
  try {
    return schema.parse(input) as unknown as TReturn;
  } catch (error) {
    if (error instanceof ZodError) {
      throw ValidationError.fromZodError(error);
    }
    throw error;
  }
}

function runSafeValidation<TSchema, TReturn>(
  schema: ZodSchema<TSchema>,
  input: unknown,
): ValidationResult<TReturn> {
  const result = schema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data as unknown as TReturn, error: undefined };
  }
  return {
    success: false,
    data: undefined,
    error: ValidationError.fromZodError(result.error),
  };
}

// ---------------------------------------------------------------------------
// Agent validation
// ---------------------------------------------------------------------------

/**
 * Validate an {@link AgentConfig} object.
 *
 * @param input - Raw config to validate
 * @returns The validated config
 * @throws {ValidationError} If the input is invalid
 *
 * @example
 * ```typescript
 * try {
 *   const config = validateAgentConfig({ id: 'researcher', role: 'Analyst', goal: 'Find data' });
 *   const agent = new Agent(config);
 * } catch (err) {
 *   if (err instanceof ValidationError) {
 *     console.error(err.issues);
 *   }
 * }
 * ```
 */
export function validateAgentConfig(input: unknown): AgentConfig {
  return runValidation(AgentConfigSchema, input);
}

/**
 * Safely validate an {@link AgentConfig} without throwing.
 *
 * @param input - Raw config to validate
 * @returns A discriminated result with `success`, `data`, and `error` fields
 *
 * @example
 * ```typescript
 * const result = safeValidateAgentConfig(userInput);
 * if (result.success) {
 *   const agent = new Agent(result.data);
 * } else {
 *   console.error(result.error.issues);
 * }
 * ```
 */
export function safeValidateAgentConfig(input: unknown): ValidationResult<AgentConfig> {
  return runSafeValidation(AgentConfigSchema, input);
}

// ---------------------------------------------------------------------------
// Task validation
// ---------------------------------------------------------------------------

/**
 * Validate a {@link TaskConfig} object.
 *
 * @throws {ValidationError} If the input is invalid
 */
export function validateTaskConfig(input: unknown): TaskConfig {
  return runValidation(TaskConfigSchema, input);
}

/**
 * Safely validate a {@link TaskConfig} without throwing.
 */
export function safeValidateTaskConfig(input: unknown): ValidationResult<TaskConfig> {
  return runSafeValidation(TaskConfigSchema, input);
}

// ---------------------------------------------------------------------------
// Crew validation
// ---------------------------------------------------------------------------

/**
 * Validate a {@link CrewTask} object.
 *
 * @throws {ValidationError} If the input is invalid
 */
export function validateCrewTask(input: unknown): CrewTask {
  return runValidation(CrewTaskSchema, input);
}

/**
 * Safely validate a {@link CrewTask} without throwing.
 */
export function safeValidateCrewTask(input: unknown): ValidationResult<CrewTask> {
  return runSafeValidation(CrewTaskSchema, input);
}

/**
 * Validate a {@link CrewConfig} object.
 *
 * Validates structure only. Cross-reference validation (e.g. task agentIds
 * matching registered agents) is performed by the Crew constructor.
 *
 * @throws {ValidationError} If the input is invalid
 */
export function validateCrewConfig(input: unknown): CrewConfig {
  return runValidation(CrewConfigSchema, input);
}

/**
 * Safely validate a {@link CrewConfig} without throwing.
 */
export function safeValidateCrewConfig(input: unknown): ValidationResult<CrewConfig> {
  return runSafeValidation(CrewConfigSchema, input);
}

// ---------------------------------------------------------------------------
// ExecutionEngine validation
// ---------------------------------------------------------------------------

/**
 * Validate an {@link ExecutionEngineConfig} object.
 *
 * @throws {ValidationError} If the input is invalid
 */
export function validateEngineConfig(input: unknown): ExecutionEngineConfig {
  return runValidation(ExecutionEngineConfigSchema, input);
}

/**
 * Safely validate an {@link ExecutionEngineConfig} without throwing.
 */
export function safeValidateEngineConfig(input: unknown): ValidationResult<ExecutionEngineConfig> {
  return runSafeValidation(ExecutionEngineConfigSchema, input);
}

// ---------------------------------------------------------------------------
// LLM validation
// ---------------------------------------------------------------------------

/**
 * Validate {@link LLMRequestOptions}.
 *
 * @throws {ValidationError} If the input is invalid
 */
export function validateLLMRequestOptions(input: unknown): LLMRequestOptions {
  return runValidation(LLMRequestOptionsSchema, input);
}

/**
 * Safely validate {@link LLMRequestOptions} without throwing.
 */
export function safeValidateLLMRequestOptions(input: unknown): ValidationResult<LLMRequestOptions> {
  return runSafeValidation(LLMRequestOptionsSchema, input);
}
