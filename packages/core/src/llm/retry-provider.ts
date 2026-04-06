/**
 * Decorator that wraps an {@link LLMProvider} with automatic retry logic.
 *
 * Uses exponential backoff with jitter to retry transient failures such as
 * rate limits (HTTP 429) and server errors (500, 502, 503). Non-retryable
 * errors (authentication, context length) are thrown immediately.
 *
 * This follows the decorator pattern — compose a `RetryLLMProvider` around
 * any existing provider to add retry behavior without modifying the original.
 *
 * @example
 * ```typescript
 * import { OpenAIProvider, RetryLLMProvider } from '@crewspace/core';
 *
 * const provider = new OpenAIProvider({
 *   provider: 'openai',
 *   modelId: 'gpt-4o',
 *   apiKey: process.env.OPENAI_API_KEY!,
 * });
 *
 * const retryProvider = new RetryLLMProvider(provider, {
 *   maxRetries: 3,
 *   onRetry: (ctx) => console.log(
 *     `Retry ${ctx.attempt}/${ctx.maxRetries} in ${ctx.delayMs}ms`,
 *   ),
 * });
 *
 * // Now all calls automatically retry on transient failures:
 * const response = await retryProvider.generateText(messages);
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
import type { OnRetryCallback, RetryConfig } from './retry.js';
import { buildRetryConfig, withRetry } from './retry.js';
import { isStreamingProvider } from './type-guards.js';

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
}

// ---------------------------------------------------------------------------
// Default retry count
// ---------------------------------------------------------------------------

const DEFAULT_MAX_RETRIES = 3;

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
 */
export class RetryLLMProvider implements StreamingLLMProvider {
  public readonly name: string;
  private readonly _inner: LLMProvider;
  private readonly _retryConfig: RetryConfig;
  private readonly _onRetry: OnRetryCallback | undefined;
  private readonly _innerIsStreaming: boolean;

  constructor(inner: LLMProvider, options?: RetryLLMProviderOptions) {
    this._inner = inner;
    this.name = inner.name;
    this._onRetry = options?.onRetry;
    this._innerIsStreaming = isStreamingProvider(inner);

    // Build overrides only for explicitly-provided values
    // (avoids passing `undefined` with exactOptionalPropertyTypes)
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

  /**
   * Generate text with automatic retry on transient failures.
   */
  async generateText(
    messages: readonly LLMMessage[],
    options?: LLMRequestOptions,
  ): Promise<LLMResponse> {
    return withRetry(() => this._inner.generateText(messages, options), this._retryConfig, {
      ...(this._onRetry !== undefined && { onRetry: this._onRetry }),
      ...(options?.signal !== undefined && { signal: options.signal }),
    });
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

    const streamingInner = this._inner as StreamingLLMProvider;

    return withRetry(() => streamingInner.generateStream(messages, options), this._retryConfig, {
      ...(this._onRetry !== undefined && { onRetry: this._onRetry }),
      ...(options?.signal !== undefined && { signal: options.signal }),
    });
  }

  /** The retry configuration used by this provider. */
  get retryConfig(): Readonly<RetryConfig> {
    return this._retryConfig;
  }
}
