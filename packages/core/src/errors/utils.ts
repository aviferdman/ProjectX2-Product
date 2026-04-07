/**
 * Error utility functions for the Crewspace framework.
 *
 * @packageDocumentation
 */

import { CrewspaceError, ErrorCode } from './base.js';

// ---------------------------------------------------------------------------
// normalizeError
// ---------------------------------------------------------------------------

/**
 * Wraps an unknown thrown value into a proper `Error`.
 *
 * - If the value is already an `Error`, returns it as-is.
 * - Otherwise, converts it to a string and wraps it in a plain `Error`.
 *
 * @example
 * ```typescript
 * try {
 *   somethingRisky();
 * } catch (err) {
 *   const error = normalizeError(err);
 *   console.error(error.message); // always safe
 * }
 * ```
 */
export function normalizeError(value: unknown): Error {
  if (value instanceof Error) {
    return value;
  }
  if (typeof value === 'string') {
    return new Error(value);
  }
  return new Error(String(value));
}

// ---------------------------------------------------------------------------
// getErrorChain
// ---------------------------------------------------------------------------

/**
 * Walks the `.cause` chain and returns all errors in order (outermost first).
 *
 * Stops at the first cause that is not an `Error` instance or when there is
 * no further cause.  Protects against circular cause chains.
 *
 * @example
 * ```typescript
 * const chain = getErrorChain(topLevelError);
 * chain.forEach(e => console.log(e.message));
 * ```
 */
export function getErrorChain(error: Error): Error[] {
  const chain: Error[] = [error];
  const seen = new Set<Error>([error]);
  let current: unknown = error.cause;

  while (current instanceof Error && !seen.has(current)) {
    seen.add(current);
    chain.push(current);
    current = current.cause;
  }

  return chain;
}

// ---------------------------------------------------------------------------
// isCrewspaceError (standalone function)
// ---------------------------------------------------------------------------

/**
 * Standalone type guard equivalent to {@link CrewspaceError.isCrewspaceError}.
 */
export function isCrewspaceError(value: unknown): value is CrewspaceError {
  return CrewspaceError.isCrewspaceError(value);
}

// ---------------------------------------------------------------------------
// hasErrorCode
// ---------------------------------------------------------------------------

/**
 * Checks whether a value is a {@link CrewspaceError} with a specific {@link ErrorCode}.
 */
export function hasErrorCode(value: unknown, code: ErrorCode): boolean {
  return isCrewspaceError(value) && value.code === code;
}

// ---------------------------------------------------------------------------
// formatErrorForLog
// ---------------------------------------------------------------------------

/** Structured object returned by {@link formatErrorForLog}. */
export interface FormattedError {
  readonly name: string;
  readonly message: string;
  readonly code: ErrorCode | undefined;
  readonly isRetryable: boolean | undefined;
  readonly stack: string | undefined;
  readonly causeChain: string[];
}

/**
 * Formats any error into a structured log-friendly object.
 *
 * For {@link CrewspaceError} instances, includes `code` and `isRetryable`.
 * Always includes the full cause chain as an array of messages.
 */
export function formatErrorForLog(error: Error): FormattedError {
  const chain = getErrorChain(error);
  const isCE = isCrewspaceError(error);

  return {
    name: error.name,
    message: error.message,
    code: isCE ? error.code : undefined,
    isRetryable: isCE ? error.isRetryable : undefined,
    stack: error.stack,
    causeChain: chain.map((e) => e.message),
  };
}

// ---------------------------------------------------------------------------
// AggregateCrewspaceError
// ---------------------------------------------------------------------------

/**
 * Collects multiple errors from parallel operations into a single error.
 *
 * Useful when executing tasks concurrently where multiple can fail.
 *
 * @example
 * ```typescript
 * const errors = results.filter(r => r.error).map(r => r.error!);
 * if (errors.length > 0) {
 *   throw new AggregateCrewspaceError('Parallel execution failed', errors);
 * }
 * ```
 */
export class AggregateCrewspaceError extends CrewspaceError {
  /** Individual errors collected from the parallel operations. */
  public readonly errors: readonly Error[];

  constructor(message: string, errors: readonly Error[]) {
    super(
      `${message} (${String(errors.length)} error${errors.length === 1 ? '' : 's'})`,
      ErrorCode.UNKNOWN,
    );
    this.name = 'AggregateCrewspaceError';
    this.errors = errors;
  }

  protected override getDetails(): Record<string, unknown> {
    return {
      errorCount: this.errors.length,
      errors: this.errors.map((e) =>
        isCrewspaceError(e) ? e.toJSON() : { name: e.name, message: e.message },
      ),
    };
  }
}
