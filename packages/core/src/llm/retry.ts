/**
 * Exponential backoff retry logic for LLM provider operations.
 *
 * Provides configurable retry behavior with:
 * - Exponential backoff with jitter
 * - Respect for `Retry-After` headers via {@link LLMRateLimitError.retryAfterMs}
 * - Configurable max retries, base delay, max delay, and backoff multiplier
 * - Abort signal support for cancellation during wait periods
 * - Detailed retry event callbacks for observability
 *
 * @packageDocumentation
 */

import {
  LLMAuthenticationError,
  LLMContextLengthError,
  LLMProviderError,
  LLMRateLimitError,
} from '../errors/llm-errors.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default base delay between retries in milliseconds. */
const DEFAULT_BASE_DELAY_MS = 1_000;

/** Default maximum delay cap in milliseconds. */
const DEFAULT_MAX_DELAY_MS = 60_000;

/** Default backoff multiplier applied after each retry. */
const DEFAULT_BACKOFF_MULTIPLIER = 2;

/** Default jitter factor (0 = no jitter, 1 = full jitter). */
const DEFAULT_JITTER = 1;

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Configuration for the retry mechanism.
 *
 * All fields are optional — sensible defaults are provided.
 *
 * @example
 * ```typescript
 * const config: RetryConfig = {
 *   maxRetries: 5,
 *   baseDelayMs: 500,
 *   maxDelayMs: 30_000,
 *   backoffMultiplier: 2,
 *   jitter: 1,
 * };
 * ```
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3). */
  readonly maxRetries: number;
  /** Initial delay before the first retry in ms (default: 1000). */
  readonly baseDelayMs: number;
  /** Upper bound on delay between retries in ms (default: 60000). */
  readonly maxDelayMs: number;
  /** Multiplier applied to delay after each attempt (default: 2). */
  readonly backoffMultiplier: number;
  /**
   * Jitter factor between 0 and 1 (default: 1).
   * 0 = no jitter (deterministic delays), 1 = full jitter (random between 0 and computed delay).
   */
  readonly jitter: number;
}

// ---------------------------------------------------------------------------
// Retry context & callbacks
// ---------------------------------------------------------------------------

/**
 * Context passed to {@link OnRetryCallback} for observability.
 */
export interface RetryContext {
  /** The current attempt number (1-based; attempt 1 = first retry). */
  readonly attempt: number;
  /** Total maximum retries configured. */
  readonly maxRetries: number;
  /** Delay in ms before this retry will be executed. */
  readonly delayMs: number;
  /** The error that triggered this retry. */
  readonly error: Error;
}

/**
 * Callback invoked before each retry attempt.
 *
 * Use this for logging, metrics, or custom abort logic.
 */
export type OnRetryCallback = (context: RetryContext) => void;

// ---------------------------------------------------------------------------
// Retry state (internal)
// ---------------------------------------------------------------------------

/** Internal mutable state tracked across retry attempts. */
interface RetryState {
  attempt: number;
  lastError: Error | undefined;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build a complete {@link RetryConfig} by merging partial overrides with defaults.
 *
 * @param maxRetries - Maximum retries from provider config
 * @param overrides  - Partial config overrides
 * @returns A complete RetryConfig
 */
export function buildRetryConfig(
  maxRetries: number,
  overrides?: Partial<RetryConfig>,
): RetryConfig {
  return {
    maxRetries: overrides?.maxRetries ?? maxRetries,
    baseDelayMs: overrides?.baseDelayMs ?? DEFAULT_BASE_DELAY_MS,
    maxDelayMs: overrides?.maxDelayMs ?? DEFAULT_MAX_DELAY_MS,
    backoffMultiplier: overrides?.backoffMultiplier ?? DEFAULT_BACKOFF_MULTIPLIER,
    jitter: overrides?.jitter ?? DEFAULT_JITTER,
  };
}

/**
 * Determine whether an error is retryable.
 *
 * Retryable errors:
 * - {@link LLMRateLimitError} (HTTP 429)
 * - {@link LLMProviderError} with status 500, 502, or 503 (server errors)
 *
 * Non-retryable errors:
 * - {@link LLMAuthenticationError} (HTTP 401 — wrong credentials won't fix themselves)
 * - {@link LLMContextLengthError} (HTTP 400 — payload is too large)
 * - Any non-LLM error (programming bugs, type errors, etc.)
 * - {@link LLMProviderError} with other status codes (4xx client errors)
 *
 * @param error - The error to evaluate
 * @returns `true` if the operation should be retried
 */
export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof LLMProviderError)) {
    return false;
  }

  if (error instanceof LLMAuthenticationError) {
    return false;
  }

  if (error instanceof LLMContextLengthError) {
    return false;
  }

  if (error instanceof LLMRateLimitError) {
    return true;
  }

  const RETRYABLE_STATUS_CODES = new Set([500, 502, 503]);
  return error.statusCode !== undefined && RETRYABLE_STATUS_CODES.has(error.statusCode);
}

/**
 * Calculate the delay for a given retry attempt using exponential backoff with jitter.
 *
 * The formula is:
 * ```
 * base = baseDelayMs * (backoffMultiplier ^ attempt)
 * capped = min(base, maxDelayMs)
 * delay = capped * (1 - jitter) + capped * jitter * random()
 * ```
 *
 * If the error is an {@link LLMRateLimitError} with a `retryAfterMs` value,
 * that value is used as the minimum delay (the backoff may be higher).
 *
 * @param attempt - Current attempt number (0-based)
 * @param config  - Retry configuration
 * @param error   - The triggering error (checked for retryAfterMs)
 * @param random  - Random number generator (0–1), injectable for testing
 * @returns Delay in milliseconds before the next retry
 */
export function calculateDelay(
  attempt: number,
  config: RetryConfig,
  error?: Error,
  random: () => number = Math.random,
): number {
  const exponentialDelay = config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);

  const jitterFactor = config.jitter;
  const deterministicPart = cappedDelay * (1 - jitterFactor);
  const randomPart = cappedDelay * jitterFactor * random();
  let delay = deterministicPart + randomPart;

  // Respect Retry-After header from rate-limit errors
  if (error instanceof LLMRateLimitError && error.retryAfterMs !== undefined) {
    delay = Math.max(delay, error.retryAfterMs);
  }

  return Math.round(delay);
}

/**
 * Execute an async operation with exponential backoff retry.
 *
 * Retries only on retryable errors (rate limits and server errors).
 * Non-retryable errors are thrown immediately.
 *
 * @param operation - The async operation to execute (called on each attempt)
 * @param config    - Retry configuration
 * @param options   - Optional callbacks and abort signal
 * @returns The result of the operation
 * @throws The last error if all retries are exhausted, or a non-retryable error
 *
 * @example
 * ```typescript
 * const response = await withRetry(
 *   () => provider.generateText(messages),
 *   { maxRetries: 3, baseDelayMs: 1000, maxDelayMs: 60000, backoffMultiplier: 2, jitter: 1 },
 *   {
 *     onRetry: (ctx) => console.log(`Retry ${ctx.attempt}/${ctx.maxRetries} after ${ctx.delayMs}ms`),
 *   },
 * );
 * ```
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig,
  options?: {
    readonly onRetry?: OnRetryCallback;
    readonly signal?: AbortSignal;
    /** Injectable sleep function for testing (default: real setTimeout-based sleep). */
    readonly sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
    /** Injectable random function for testing (default: Math.random). */
    readonly random?: () => number;
  },
): Promise<T> {
  const sleepFn = options?.sleep ?? defaultSleep;
  const randomFn = options?.random ?? Math.random;

  const state: RetryState = { attempt: 0, lastError: undefined };

  for (;;) {
    try {
      return await operation();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      state.lastError = err;

      if (!isRetryableError(err) || state.attempt >= config.maxRetries) {
        throw err;
      }

      const delayMs = calculateDelay(state.attempt, config, err, randomFn);

      const context: RetryContext = {
        attempt: state.attempt + 1,
        maxRetries: config.maxRetries,
        delayMs,
        error: err,
      };
      options?.onRetry?.(context);

      await sleepFn(delayMs, options?.signal);

      state.attempt++;
    }
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Default sleep implementation using setTimeout.
 *
 * Supports AbortSignal for cancellation during the wait period.
 *
 * @param ms     - Duration to sleep in milliseconds
 * @param signal - Optional abort signal
 */
function defaultSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new LLMProviderError('retry', 'Retry aborted'));
      return;
    }

    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    const onAbort = (): void => {
      clearTimeout(timer);
      cleanup();
      reject(new LLMProviderError('retry', 'Retry aborted'));
    };

    const cleanup = (): void => {
      signal?.removeEventListener('abort', onAbort);
    };

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
