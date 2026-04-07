/**
 * Base error class and error codes for the Crewspace framework.
 *
 * All Crewspace errors extend {@link CrewspaceError}, providing:
 * - Machine-readable {@link ErrorCode} for programmatic handling
 * - `toJSON()` for structured logging and serialization
 * - `isRetryable` flag for retry logic
 * - `timestamp` for error chronology
 * - Static `isCrewspaceError()` type guard
 *
 * @packageDocumentation
 */

// ---------------------------------------------------------------------------
// Error Codes
// ---------------------------------------------------------------------------

/**
 * Machine-readable error codes for all Crewspace errors.
 *
 * Codes follow the pattern `DOMAIN_CATEGORY` (e.g. `AGENT_CONFIG`, `LLM_RATE_LIMIT`).
 */
export enum ErrorCode {
  // Generic
  UNKNOWN = 'UNKNOWN',

  // Agent
  AGENT_CONFIG = 'AGENT_CONFIG',
  AGENT_EXECUTION = 'AGENT_EXECUTION',

  // Crew
  CREW_CONFIG = 'CREW_CONFIG',
  CREW_EXECUTION = 'CREW_EXECUTION',

  // Engine
  ENGINE_CONFIG = 'ENGINE_CONFIG',
  ENGINE_EXECUTION = 'ENGINE_EXECUTION',

  // Task
  TASK_CONFIG = 'TASK_CONFIG',
  TASK_EXECUTION = 'TASK_EXECUTION',
  TASK_TIMEOUT = 'TASK_TIMEOUT',
  TASK_CIRCULAR_DEPENDENCY = 'TASK_CIRCULAR_DEPENDENCY',

  // LLM
  LLM_PROVIDER = 'LLM_PROVIDER',
  LLM_RATE_LIMIT = 'LLM_RATE_LIMIT',
  LLM_AUTHENTICATION = 'LLM_AUTHENTICATION',
  LLM_CONTEXT_LENGTH = 'LLM_CONTEXT_LENGTH',
  LLM_STREAM = 'LLM_STREAM',

  // Tool
  TOOL_CONFIG = 'TOOL_CONFIG',
  TOOL_NOT_FOUND = 'TOOL_NOT_FOUND',
  TOOL_EXECUTION = 'TOOL_EXECUTION',
  TOOL_PERMISSION = 'TOOL_PERMISSION',
  TOOL_TIMEOUT = 'TOOL_TIMEOUT',
  TOOL_COMPOSITION = 'TOOL_COMPOSITION',
  TOOL_INPUT_VALIDATION = 'TOOL_INPUT_VALIDATION',

  // Memory
  MEMORY_CONFIG = 'MEMORY_CONFIG',
  MEMORY_OPERATION = 'MEMORY_OPERATION',
  MEMORY_QUERY = 'MEMORY_QUERY',
}

// ---------------------------------------------------------------------------
// Serialized shape
// ---------------------------------------------------------------------------

/** JSON representation of a {@link CrewspaceError}. */
export interface SerializedError {
  readonly name: string;
  readonly message: string;
  readonly code: ErrorCode;
  readonly isRetryable: boolean;
  readonly timestamp: string;
  readonly stack: string | undefined;
  readonly cause: SerializedError | { message: string } | undefined;
  readonly details: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Base error
// ---------------------------------------------------------------------------

/**
 * Abstract base class for all Crewspace errors.
 *
 * Provides a consistent interface with error codes, structured serialization,
 * and retryable semantics across the entire framework.
 *
 * @example
 * ```typescript
 * try {
 *   await crew.run();
 * } catch (err) {
 *   if (CrewspaceError.isCrewspaceError(err)) {
 *     console.log(err.code);        // e.g. ErrorCode.LLM_RATE_LIMIT
 *     console.log(err.isRetryable);  // true
 *     console.log(JSON.stringify(err.toJSON()));
 *   }
 * }
 * ```
 */
export abstract class CrewspaceError extends Error {
  /** Machine-readable error code. */
  public readonly code: ErrorCode;

  /** Whether the operation that caused this error can be retried. */
  public readonly isRetryable: boolean;

  /** ISO-8601 timestamp of when the error was created. */
  public readonly timestamp: string;

  public override readonly cause: Error | undefined;

  constructor(
    message: string,
    code: ErrorCode,
    options?: { cause?: Error | undefined; isRetryable?: boolean | undefined },
  ) {
    super(message);
    this.code = code;
    this.isRetryable = options?.isRetryable ?? false;
    this.cause = options?.cause;
    this.timestamp = new Date().toISOString();

    // Maintain correct prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Type guard that checks whether an unknown value is a {@link CrewspaceError}.
   */
  static isCrewspaceError(value: unknown): value is CrewspaceError {
    return value instanceof CrewspaceError;
  }

  /**
   * Return domain-specific extra fields for JSON serialization.
   * Subclasses override this to include their custom properties.
   */
  protected getDetails(): Record<string, unknown> {
    return {};
  }

  /** Structured JSON representation for logging and transport. */
  toJSON(): SerializedError {
    let serializedCause: SerializedError | { message: string } | undefined;
    if (this.cause) {
      if (CrewspaceError.isCrewspaceError(this.cause)) {
        serializedCause = this.cause.toJSON();
      } else {
        serializedCause = { message: this.cause.message };
      }
    }

    return {
      name: this.name,
      message: this.message,
      code: this.code,
      isRetryable: this.isRetryable,
      timestamp: this.timestamp,
      stack: this.stack,
      cause: serializedCause,
      details: this.getDetails(),
    };
  }
}
