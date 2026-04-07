/**
 * Graceful degradation for non-critical failures.
 *
 * Provides a mechanism to classify errors by severity and continue
 * execution with fallback values when non-critical components fail,
 * rather than halting the entire workflow.
 *
 * @packageDocumentation
 */

import { EventEmitter } from 'eventemitter3';

import { CrewspaceError, ErrorCode } from './base.js';
import { normalizeError } from './utils.js';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** Severity classification for failures. */
export enum FailureSeverity {
  /** The failure is fatal and must halt execution. */
  CRITICAL = 'critical',
  /** The failure is recoverable — execution can continue with a fallback. */
  NON_CRITICAL = 'non-critical',
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Classifies an error as critical or non-critical.
 *
 * Implement this interface to provide custom classification logic
 * based on error type, code, context, or any other criteria.
 */
export interface FailureClassifier {
  /**
   * Classify the severity of the given error.
   *
   * @param error   - The error to classify
   * @param context - Optional context about where the error occurred
   * @returns The severity classification
   */
  classify(error: Error, context?: FailureContext): FailureSeverity;
}

/** Context about where a failure occurred, used by classifiers. */
export interface FailureContext {
  /** Identifier of the operation that failed (e.g., task ID, tool name). */
  readonly operationId?: string;

  /** The type/domain of the operation (e.g., "task", "tool", "llm"). */
  readonly operationType?: string;

  /** Arbitrary metadata for classifier decisions. */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/** A record of a non-critical failure that was gracefully degraded. */
export interface DegradationRecord {
  /** The original error that was caught. */
  readonly error: Error;

  /** Severity as classified. */
  readonly severity: FailureSeverity;

  /** Context about where the failure occurred. */
  readonly context: FailureContext | undefined;

  /** ISO-8601 timestamp of when degradation occurred. */
  readonly timestamp: string;

  /** The fallback value that was used. */
  readonly fallbackUsed: boolean;
}

/**
 * Result of a gracefully degraded operation.
 *
 * @typeParam T - The expected return type of the operation
 */
export interface DegradedResult<T> {
  /** The value — either the real result or a fallback. */
  readonly value: T;

  /** Whether a fallback was used (true) or the operation succeeded (false). */
  readonly degraded: boolean;

  /** The error that triggered degradation, if any. */
  readonly error?: Error;
}

/** A function that provides a fallback value when an operation fails. */
export type FallbackProvider<T> = (error: Error, context?: FailureContext) => T | Promise<T>;

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/** Map of degradation event names to their listener signatures. */
export interface DegradationEventMap {
  /** Emitted when a non-critical failure is gracefully degraded. */
  'degradation:fallback': (record: DegradationRecord) => void;

  /** Emitted when a critical failure is detected and re-thrown. */
  'degradation:critical': (error: Error, context: FailureContext | undefined) => void;

  /** Emitted when an operation succeeds without degradation. */
  'degradation:success': (operationId: string | undefined) => void;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Configuration for a {@link GracefulDegradationHandler}. */
export interface GracefulDegradationConfig {
  /** The failure classifier to use (default: {@link DefaultFailureClassifier}). */
  readonly classifier?: FailureClassifier;

  /**
   * Maximum number of degradation records to keep in history.
   * Older records are evicted when the limit is reached.
   * Default: 100.
   */
  readonly maxHistorySize?: number;

  /**
   * If true, log degradation events to stderr (default: false).
   * Useful for debugging without subscribing to events.
   */
  readonly verbose?: boolean;
}

// ---------------------------------------------------------------------------
// Default classifier
// ---------------------------------------------------------------------------

/**
 * Error codes that are considered critical by default.
 * Config errors and authentication errors are always critical because
 * they indicate fundamental problems that cannot be resolved by fallbacks.
 */
const CRITICAL_ERROR_CODES = new Set<ErrorCode>([
  ErrorCode.AGENT_CONFIG,
  ErrorCode.CREW_CONFIG,
  ErrorCode.ENGINE_CONFIG,
  ErrorCode.TASK_CONFIG,
  ErrorCode.TOOL_CONFIG,
  ErrorCode.MEMORY_CONFIG,
  ErrorCode.LLM_AUTHENTICATION,
  ErrorCode.TASK_CIRCULAR_DEPENDENCY,
]);

/**
 * Error codes that are always considered non-critical by default.
 * These represent transient or recoverable failures.
 */
const NON_CRITICAL_ERROR_CODES = new Set<ErrorCode>([
  ErrorCode.TOOL_EXECUTION,
  ErrorCode.TOOL_TIMEOUT,
  ErrorCode.TOOL_COMPOSITION,
  ErrorCode.TOOL_INPUT_VALIDATION,
  ErrorCode.LLM_RATE_LIMIT,
  ErrorCode.LLM_STREAM,
  ErrorCode.LLM_CONTEXT_LENGTH,
  ErrorCode.MEMORY_QUERY,
  ErrorCode.MEMORY_OPERATION,
]);

/**
 * Default failure classifier that uses {@link ErrorCode} to determine severity.
 *
 * Classification rules (in order):
 * 1. Configuration and authentication errors are always **critical**.
 * 2. Tool execution, LLM transient, and memory operation errors are **non-critical**.
 * 3. Errors with `isRetryable === true` are **non-critical**.
 * 4. Unknown errors default to **critical** (fail-safe).
 *
 * @example
 * ```typescript
 * const classifier = new DefaultFailureClassifier();
 * const severity = classifier.classify(new ToolTimeoutError('search', 5000));
 * // severity === FailureSeverity.NON_CRITICAL
 * ```
 */
export class DefaultFailureClassifier implements FailureClassifier {
  classify(error: Error): FailureSeverity {
    if (CrewspaceError.isCrewspaceError(error)) {
      if (CRITICAL_ERROR_CODES.has(error.code)) {
        return FailureSeverity.CRITICAL;
      }
      if (NON_CRITICAL_ERROR_CODES.has(error.code)) {
        return FailureSeverity.NON_CRITICAL;
      }
      // Retryable errors are generally non-critical
      if (error.isRetryable) {
        return FailureSeverity.NON_CRITICAL;
      }
    }

    // Non-Crewspace errors and unrecognized codes default to critical
    return FailureSeverity.CRITICAL;
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

const DEFAULT_MAX_HISTORY = 100;

/**
 * Handles graceful degradation for non-critical failures.
 *
 * Wraps operations with try/catch logic that classifies failures and
 * either re-throws critical errors or returns a fallback value for
 * non-critical ones. Maintains a history of degradation events for
 * monitoring and observability.
 *
 * @example
 * ```typescript
 * const handler = new GracefulDegradationHandler();
 *
 * // Wrap an operation with a static fallback
 * const result = await handler.execute(
 *   async () => await riskyToolCall(),
 *   { fallback: 'default value' },
 * );
 *
 * if (result.degraded) {
 *   console.warn('Used fallback due to:', result.error?.message);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Use a dynamic fallback provider
 * const result = await handler.execute(
 *   async () => await fetchData(),
 *   {
 *     fallback: (error) => ({ data: [], error: error.message }),
 *     context: { operationId: 'fetch-data', operationType: 'tool' },
 *   },
 * );
 * ```
 */
export class GracefulDegradationHandler {
  private readonly _classifier: FailureClassifier;
  private readonly _maxHistorySize: number;
  private readonly _verbose: boolean;
  private readonly _history: DegradationRecord[];
  private readonly _emitter: EventEmitter<DegradationEventMap>;

  constructor(config?: GracefulDegradationConfig) {
    this._classifier = config?.classifier ?? new DefaultFailureClassifier();
    this._maxHistorySize = config?.maxHistorySize ?? DEFAULT_MAX_HISTORY;
    this._verbose = config?.verbose ?? false;
    this._history = [];
    this._emitter = new EventEmitter<DegradationEventMap>();
  }

  // -------------------------------------------------------------------------
  // Read-only accessors
  // -------------------------------------------------------------------------

  /** Degradation history (most recent last). */
  get history(): readonly DegradationRecord[] {
    return this._history;
  }

  /** Number of non-critical failures that have been gracefully degraded. */
  get degradationCount(): number {
    return this._history.length;
  }

  // -------------------------------------------------------------------------
  // Event system
  // -------------------------------------------------------------------------

  /** Subscribe to a degradation event. */
  on<E extends keyof DegradationEventMap>(event: E, listener: DegradationEventMap[E]): this {
    this._emitter.on(event, listener as (...args: unknown[]) => void);
    return this;
  }

  /** Unsubscribe from a degradation event. */
  off<E extends keyof DegradationEventMap>(event: E, listener: DegradationEventMap[E]): this {
    this._emitter.off(event, listener as (...args: unknown[]) => void);
    return this;
  }

  // -------------------------------------------------------------------------
  // Core execution
  // -------------------------------------------------------------------------

  /**
   * Execute an operation with graceful degradation.
   *
   * If the operation throws a non-critical error (as determined by the
   * configured classifier), the fallback value is returned instead.
   * Critical errors are always re-thrown.
   *
   * @typeParam T - The return type of the operation
   * @param operation - The async operation to execute
   * @param options   - Fallback and context configuration
   * @returns A {@link DegradedResult} indicating success or degradation
   * @throws The original error if classified as critical
   */
  async execute<T>(
    operation: () => T | Promise<T>,
    options: {
      /** Static fallback value or dynamic fallback provider function. */
      readonly fallback: T | FallbackProvider<T>;
      /** Optional context about the operation. */
      readonly context?: FailureContext;
    },
  ): Promise<DegradedResult<T>> {
    try {
      const value = await operation();
      this._emit('degradation:success', options.context?.operationId);
      return { value, degraded: false };
    } catch (thrown: unknown) {
      const error = normalizeError(thrown);
      const severity = this._classifier.classify(error, options.context);

      if (severity === FailureSeverity.CRITICAL) {
        this._emit('degradation:critical', error, options.context);
        throw error;
      }

      // Non-critical — apply fallback
      const fallbackValue =
        typeof options.fallback === 'function'
          ? await (options.fallback as FallbackProvider<T>)(error, options.context)
          : options.fallback;

      const record: DegradationRecord = {
        error,
        severity,
        context: options.context,
        timestamp: new Date().toISOString(),
        fallbackUsed: true,
      };

      this._addToHistory(record);
      this._emit('degradation:fallback', record);

      if (this._verbose) {
        const opId = options.context?.operationId ?? 'unknown';
        // eslint-disable-next-line no-console
        console.warn(
          `[GracefulDegradation] Non-critical failure in "${opId}": ${error.message}. Using fallback.`,
        );
      }

      return { value: fallbackValue, degraded: true, error };
    }
  }

  /**
   * Execute an operation that may fail non-critically, returning `undefined`
   * as the fallback. Convenience wrapper around {@link execute}.
   *
   * @typeParam T - The return type of the operation
   * @param operation - The async operation to execute
   * @param context   - Optional failure context
   * @returns The result or `undefined` if degraded
   */
  async executeOptional<T>(
    operation: () => T | Promise<T>,
    context?: FailureContext,
  ): Promise<DegradedResult<T | undefined>> {
    const options: {
      readonly fallback: undefined;
      readonly context?: FailureContext;
    } = { fallback: undefined };

    if (context !== undefined) {
      return this.execute(operation, { fallback: undefined, context });
    }

    return this.execute(operation, options);
  }

  /**
   * Classify an error without executing an operation.
   * Useful for external decision-making.
   *
   * @param error   - The error to classify
   * @param context - Optional failure context
   * @returns The severity classification
   */
  classify(error: Error, context?: FailureContext): FailureSeverity {
    return this._classifier.classify(error, context);
  }

  /** Clear the degradation history. */
  clearHistory(): void {
    this._history.length = 0;
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private _addToHistory(record: DegradationRecord): void {
    this._history.push(record);
    // Evict oldest records if over the limit
    while (this._history.length > this._maxHistorySize) {
      this._history.shift();
    }
  }

  /** Type-safe event emission helper. */
  private _emit<E extends keyof DegradationEventMap>(
    event: E,
    ...args: Parameters<DegradationEventMap[E]>
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this._emitter.emit as (event: string, ...args: any[]) => boolean)(event, ...args);
  }
}
