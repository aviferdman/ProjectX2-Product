/**
 * Decorator that wraps an {@link LLMProvider} with automatic retry logic.
 *
 * Uses exponential backoff with jitter to retry transient failures such as
 * rate limits (HTTP 429) and server errors (500, 502, 503). Non-retryable
 * errors (authentication, context length) are thrown immediately.
 *
 * Optionally integrates a {@link CircuitBreaker} to prevent hammering a
 * provider that is consistently failing — requests are rejected immediately
 * when the circuit is open, saving latency and API quota.
 *
 * This follows the decorator pattern — compose a `RetryLLMProvider` around
 * any existing provider to add retry behavior without modifying the original.
 *
 * @example
 * ```typescript
 * import { createRetryProvider, OpenAIProvider } from '@crewspace/core';
 *
 * const provider = new OpenAIProvider({
 *   provider: 'openai',
 *   modelId: 'gpt-4o',
 *   apiKey: process.env.OPENAI_API_KEY!,
 * });
 *
 * // Convenience factory:
 * const retryProvider = createRetryProvider(provider, {
 *   maxRetries: 3,
 *   circuitBreaker: { failureThreshold: 5, cooldownMs: 30_000 },
 *   onRetry: (ctx) => console.log(
 *     `Retry ${ctx.attempt}/${ctx.maxRetries} in ${ctx.delayMs}ms`,
 *   ),
 * });
 *
 * // All calls automatically retry on transient failures:
 * const response = await retryProvider.generateText(messages);
 *
 * // Check retry statistics:
 * console.log(retryProvider.stats);
 * ```
 *
 * @packageDocumentation
 */

import type {
  LLMMessage,
  LLMProvider,
  LLMRequestOptions,
  LLMResponse,
  LLMStreamResponse,
  StreamingLLMProvider,
} from '../types/llm.js';
import { CircuitBreaker } from './circuit-breaker.js';
import type { CircuitBreakerConfig } from './circuit-breaker.js';
import { LLMProviderError } from '../errors/llm-errors.js';
import type { OnRetryCallback, RetryConfig } from './retry.js';
import { buildRetryConfig, isRetryableError, withRetry } from './retry.js';
import { isStreamingProvider } from './type-guards.js';

// ---------------------------------------------------------------------------
// Retry statistics
// ---------------------------------------------------------------------------

/**
 * Read-only snapshot of retry statistics for observability.
 */
export interface RetryStats {
  /** Total number of generateText/generateStream calls. */
  readonly totalRequests: number;
  /** Requests that succeeded on the first attempt (no retries needed). */
  readonly immediateSuccesses: number;
  /** Requests that succeeded after one or more retries. */
  readonly retriedSuccesses: number;
  /** Requests that failed after exhausting all retries. */
  readonly exhaustedFailures: number;
  /** Total number of individual retry attempts across all requests. */
  readonly totalRetryAttempts: number;
  /** Requests rejected by the circuit breaker without attempting the operation. */
  readonly circuitBreakerRejections: number;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Options for creating a {@link RetryLLMProvider}.
 */
export interface RetryLLMProviderOptions {
  /**
   * Maximum number of retry attempts (default: 3).
   * Set to 0 to disable retries.
   */
  readonly maxRetries?: number;
  /** Initial delay before the first retry in ms (default: 1000). */
  readonly baseDelayMs?: number;
  /** Upper bound on delay between retries in ms (default: 60000). */
  readonly maxDelayMs?: number;
  /** Multiplier applied to delay after each attempt (default: 2). */
  readonly backoffMultiplier?: number;
  /**
   * Jitter factor between 0 and 1 (default: 1).
   * 0 = deterministic delays, 1 = full jitter.
   */
  readonly jitter?: number;
  /**
   * Callback invoked before each retry attempt.
   * Use for logging, metrics, or custom abort logic.
   */
  readonly onRetry?: OnRetryCallback;
  /**
   * Optional circuit breaker configuration.
   * When provided, enables the circuit breaker to short-circuit requests
   * when the provider is consistently failing.
   */
  readonly circuitBreaker?: Partial<CircuitBreakerConfig>;
}

// ---------------------------------------------------------------------------
// Default retry count
// ---------------------------------------------------------------------------

const DEFAULT_MAX_RETRIES = 3;

// ---------------------------------------------------------------------------
// Internal mutable stats
// ---------------------------------------------------------------------------

interface MutableRetryStats {
  totalRequests: number;
  immediateSuccesses: number;
  retriedSuccesses: number;
  exhaustedFailures: number;
  totalRetryAttempts: number;
  circuitBreakerRejections: number;
}

// ---------------------------------------------------------------------------
// RetryLLMProvider
// ---------------------------------------------------------------------------

/**
 * Wraps an existing LLM provider with automatic exponential backoff retry.
 *
 * Retries only on transient errors:
 * - {@link LLMRateLimitError} (HTTP 429)
 * - {@link LLMProviderError} with status 500, 502, or 503
 *
 * Non-retryable errors are re-thrown immediately.
 *
 * If the wrapped provider implements {@link StreamingLLMProvider},
 * `RetryLLMProvider` also exposes `generateStream()` with retry on the
 * initial connection (not mid-stream errors).
 *
 * Optionally integrates a {@link CircuitBreaker} that rejects requests
 * immediately when the provider is in a failure state.
 */
export class RetryLLMProvider implements StreamingLLMProvider {
  public readonly name: string;
  private readonly _inner: LLMProvider;
  private readonly _retryConfig: RetryConfig;
  private readonly _onRetry: OnRetryCallback | undefined;
  private readonly _innerIsStreaming: boolean;
  private readonly _circuitBreaker: CircuitBreaker | undefined;
  private readonly _stats: MutableRetryStats = {
    totalRequests: 0,
    immediateSuccesses: 0,
    retriedSuccesses: 0,
    exhaustedFailures: 0,
    totalRetryAttempts: 0,
    circuitBreakerRejections: 0,
  };

  constructor(inner: LLMProvider, options?: RetryLLMProviderOptions) {
    this._inner = inner;
    this.name = inner.name;
    this._onRetry = options?.onRetry;
    this._innerIsStreaming = isStreamingProvider(inner);

    if (options?.circuitBreaker) {
      this._circuitBreaker = new CircuitBreaker(options.circuitBreaker);
    }

    // Build overrides only for explicitly-provided values
    const overrides: Record<string, number> = {};
    if (options?.baseDelayMs !== undefined) overrides['baseDelayMs'] = options.baseDelayMs;
    if (options?.maxDelayMs !== undefined) overrides['maxDelayMs'] = options.maxDelayMs;
    if (options?.backoffMultiplier !== undefined)
      overrides['backoffMultiplier'] = options.backoffMultiplier;
    if (options?.jitter !== undefined) overrides['jitter'] = options.jitter;

    this._retryConfig = buildRetryConfig(
      options?.maxRetries ?? DEFAULT_MAX_RETRIES,
      overrides as Partial<RetryConfig>,
    );
  }

  /** The wrapped inner provider. */
  get innerProvider(): LLMProvider {
    return this._inner;
  }

  /** Model ID from the inner provider (if available). */
  get modelId(): string | undefined {
    return 'modelId' in this._inner ? (this._inner as { modelId: string }).modelId : undefined;
  }

  /** The retry configuration used by this provider. */
  get retryConfig(): Readonly<RetryConfig> {
    return this._retryConfig;
  }

  /** Read-only snapshot of retry statistics. */
  get stats(): RetryStats {
    return { ...this._stats };
  }

  /** The circuit breaker instance (if configured). */
  get circuitBreaker(): CircuitBreaker | undefined {
    return this._circuitBreaker;
  }

  /**
   * Reset retry statistics to zero.
   */
  resetStats(): void {
    this._stats.totalRequests = 0;
    this._stats.immediateSuccesses = 0;
    this._stats.retriedSuccesses = 0;
    this._stats.exhaustedFailures = 0;
    this._stats.totalRetryAttempts = 0;
    this._stats.circuitBreakerRejections = 0;
  }

  /**
   * Generate text with automatic retry on transient failures.
   */
  async generateText(
    messages: readonly LLMMessage[],
    options?: LLMRequestOptions,
  ): Promise<LLMResponse> {
    this._checkCircuitBreaker();

    return this._executeWithStats(
      () => this._inner.generateText(messages, options),
      options?.signal,
    );
  }

  /**
   * Generate a streaming response with automatic retry on the initial
   * connection. If the wrapped provider does not support streaming, this
   * method throws.
   *
   * Note: Only connection-level failures are retried. Once the stream is
   * established and chunks start flowing, mid-stream errors are NOT retried.
   */
  async generateStream(
    messages: readonly LLMMessage[],
    options?: LLMRequestOptions,
  ): Promise<LLMStreamResponse> {
    if (!this._innerIsStreaming) {
      throw new Error(
        `Provider "${this.name}" does not support streaming. ` +
          'Wrap a StreamingLLMProvider to use generateStream().',
      );
    }

    this._checkCircuitBreaker();

    const streamingInner = this._inner as StreamingLLMProvider;

    return this._executeWithStats(
      () => streamingInner.generateStream(messages, options),
      options?.signal,
    );
  }

  // -------------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------------

  /**
   * Check the circuit breaker and throw if the circuit is open.
   */
  private _checkCircuitBreaker(): void {
    if (this._circuitBreaker && !this._circuitBreaker.isAllowed()) {
      this._stats.totalRequests++;
      this._stats.circuitBreakerRejections++;
      throw new LLMProviderError(
        this.name,
        `Circuit breaker is open — provider "${this.name}" is temporarily unavailable. ` +
          'Too many consecutive failures detected.',
      );
    }
  }

  /**
   * Execute an operation with retry, tracking stats and circuit breaker state.
   */
  private async _executeWithStats<T>(
    operation: () => Promise<T>,
    signal?: AbortSignal,
  ): Promise<T> {
    this._stats.totalRequests++;
    let retryCount = 0;

    const onRetry: OnRetryCallback = (ctx) => {
      retryCount++;
      this._stats.totalRetryAttempts++;
      this._onRetry?.(ctx);
    };

    try {
      const result = await withRetry(operation, this._retryConfig, {
        onRetry,
        ...(signal !== undefined && { signal }),
      });

      // Record success in circuit breaker
      this._circuitBreaker?.recordSuccess();

      if (retryCount === 0) {
        this._stats.immediateSuccesses++;
      } else {
        this._stats.retriedSuccesses++;
      }

      return result;
    } catch (error) {
      // Record failure in circuit breaker only for retryable errors
      if (isRetryableError(error)) {
        this._circuitBreaker?.recordFailure();
      }
      this._stats.exhaustedFailures++;
      throw error;
    }
  }
}

// ---------------------------------------------------------------------------
// Factory function
// ---------------------------------------------------------------------------

/**
 * Create a {@link RetryLLMProvider} wrapping the given provider.
 *
 * This is a convenience factory that mirrors `createOpenAIProvider()` and
 * `createAnthropicProvider()` for API consistency.
 *
 * @param provider - The LLM provider to wrap with retry logic
 * @param options  - Retry configuration options
 * @returns A new RetryLLMProvider
 *
 * @example
 * ```typescript
 * import { createOpenAIProvider, createRetryProvider } from '@crewspace/core';
 *
 * const openai = createOpenAIProvider({
 *   provider: 'openai',
 *   modelId: 'gpt-4o',
 *   apiKey: process.env.OPENAI_API_KEY!,
 * });
 *
 * const provider = createRetryProvider(openai, {
 *   maxRetries: 5,
 *   baseDelayMs: 500,
 *   circuitBreaker: { failureThreshold: 10, cooldownMs: 60_000 },
 * });
 * ```
 */
export function createRetryProvider(
  provider: LLMProvider,
  options?: RetryLLMProviderOptions,
): RetryLLMProvider {
  return new RetryLLMProvider(provider, options);
}
