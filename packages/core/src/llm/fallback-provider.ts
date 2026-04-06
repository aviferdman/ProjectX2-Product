/**
 * Provider fallback mechanism — tries a primary provider first and
 * falls back to secondary providers on transient failures.
 *
 * This follows the decorator pattern: compose a `FallbackLLMProvider`
 * around multiple providers to get automatic failover without modifying
 * the original providers.
 *
 * Non-retryable errors (authentication, context length) are thrown
 * immediately — falling back to a different provider would not help.
 *
 * @example
 * ```typescript
 * import {
 *   createFallbackProvider,
 *   createOpenAIProvider,
 *   createAnthropicProvider,
 * } from '@crewspace/core';
 *
 * const primary = createOpenAIProvider({ ... });
 * const secondary = createAnthropicProvider({ ... });
 *
 * const provider = createFallbackProvider([primary, secondary], {
 *   onFallback: ({ from, to, error }) =>
 *     console.warn(`Falling back from ${from} to ${to}: ${error.message}`),
 * });
 *
 * // Automatically falls back to Anthropic if OpenAI fails:
 * const response = await provider.generateText(messages);
 * console.log(provider.stats); // { totalRequests: 1, ... }
 * ```
 *
 * @packageDocumentation
 */

import { LLMAuthenticationError, LLMContextLengthError } from '../errors/llm-errors.js';
import type {
  LLMMessage,
  LLMProvider,
  LLMRequestOptions,
  LLMResponse,
  LLMStreamResponse,
  StreamingLLMProvider,
} from '../types/llm.js';
import { isStreamingProvider } from './type-guards.js';

// ---------------------------------------------------------------------------
// Callback types
// ---------------------------------------------------------------------------

/**
 * Context passed to the {@link FallbackLLMProviderOptions.onFallback} callback.
 */
export interface FallbackContext {
  /** Name of the provider that failed. */
  readonly from: string;
  /** Name of the provider being tried next. */
  readonly to: string;
  /** The error that triggered the fallback. */
  readonly error: Error;
  /** Zero-based index of the provider that failed. */
  readonly failedIndex: number;
  /** Zero-based index of the provider being tried next. */
  readonly nextIndex: number;
}

/**
 * Callback invoked each time a provider fails and the next one is tried.
 */
export type OnFallbackCallback = (context: FallbackContext) => void;

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------

/**
 * Read-only snapshot of fallback statistics for observability.
 */
export interface FallbackStats {
  /** Total number of generateText/generateStream calls. */
  readonly totalRequests: number;
  /** Requests handled successfully by the primary (first) provider. */
  readonly primarySuccesses: number;
  /** Requests handled by a fallback provider after the primary failed. */
  readonly fallbackSuccesses: number;
  /** Requests that failed across all providers. */
  readonly totalFailures: number;
  /** Per-provider success counts, keyed by provider name. */
  readonly providerSuccessCounts: Readonly<Record<string, number>>;
  /** Per-provider failure counts, keyed by provider name. */
  readonly providerFailureCounts: Readonly<Record<string, number>>;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Options for creating a {@link FallbackLLMProvider}.
 */
export interface FallbackLLMProviderOptions {
  /**
   * Callback invoked each time a provider fails and the next one is tried.
   * Use for logging, alerting, or metrics.
   */
  readonly onFallback?: OnFallbackCallback;

  /**
   * If `true`, non-retryable errors (authentication, context length) also
   * trigger fallback. Default: `false` — these errors are thrown immediately
   * because a different provider is unlikely to help.
   */
  readonly fallbackOnAllErrors?: boolean;
}

// ---------------------------------------------------------------------------
// Internal mutable stats
// ---------------------------------------------------------------------------

interface MutableFallbackStats {
  totalRequests: number;
  primarySuccesses: number;
  fallbackSuccesses: number;
  totalFailures: number;
  providerSuccessCounts: Record<string, number>;
  providerFailureCounts: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determine whether an error should trigger fallback to the next provider.
 *
 * By default, authentication and context-length errors are NOT retryable
 * — they indicate problems that won't be fixed by switching providers.
 */
function shouldFallback(error: unknown, fallbackOnAll: boolean): boolean {
  if (fallbackOnAll) return true;
  if (error instanceof LLMAuthenticationError) return false;
  if (error instanceof LLMContextLengthError) return false;
  return true;
}

// ---------------------------------------------------------------------------
// FallbackLLMProvider
// ---------------------------------------------------------------------------

/**
 * Wraps multiple LLM providers with automatic failover.
 *
 * Tries each provider in order — if the primary fails with a retryable
 * error, the next provider is attempted. Non-retryable errors (auth,
 * context length) are thrown immediately unless `fallbackOnAllErrors`
 * is enabled.
 *
 * If the primary provider supports streaming, `generateStream()` is
 * available. When falling back, streaming is attempted on fallback
 * providers that support it; for non-streaming fallbacks, an error
 * is thrown.
 */
export class FallbackLLMProvider implements StreamingLLMProvider {
  /** Composite name of all providers (e.g. "openai → anthropic → ollama"). */
  public readonly name: string;

  private readonly _providers: readonly LLMProvider[];
  private readonly _onFallback: OnFallbackCallback | undefined;
  private readonly _fallbackOnAll: boolean;
  private readonly _stats: MutableFallbackStats;

  constructor(providers: readonly LLMProvider[], options?: FallbackLLMProviderOptions) {
    if (providers.length === 0) {
      throw new Error('FallbackLLMProvider requires at least one provider');
    }

    this._providers = providers;
    this._onFallback = options?.onFallback;
    this._fallbackOnAll = options?.fallbackOnAllErrors ?? false;
    this.name = providers.map((p) => p.name).join(' → ');

    this._stats = {
      totalRequests: 0,
      primarySuccesses: 0,
      fallbackSuccesses: 0,
      totalFailures: 0,
      providerSuccessCounts: {},
      providerFailureCounts: {},
    };
  }

  /** The ordered list of providers (primary first). */
  get providers(): readonly LLMProvider[] {
    return this._providers;
  }

  /** The primary (first) provider. */
  get primaryProvider(): LLMProvider {
    return this._providers[0];
  }

  /** Read-only snapshot of fallback statistics. */
  get stats(): FallbackStats {
    return {
      totalRequests: this._stats.totalRequests,
      primarySuccesses: this._stats.primarySuccesses,
      fallbackSuccesses: this._stats.fallbackSuccesses,
      totalFailures: this._stats.totalFailures,
      providerSuccessCounts: { ...this._stats.providerSuccessCounts },
      providerFailureCounts: { ...this._stats.providerFailureCounts },
    };
  }

  /** Reset fallback statistics to zero. */
  resetStats(): void {
    this._stats.totalRequests = 0;
    this._stats.primarySuccesses = 0;
    this._stats.fallbackSuccesses = 0;
    this._stats.totalFailures = 0;
    this._stats.providerSuccessCounts = {};
    this._stats.providerFailureCounts = {};
  }

  /**
   * Generate text, falling back through providers on transient failures.
   */
  async generateText(
    messages: readonly LLMMessage[],
    options?: LLMRequestOptions,
  ): Promise<LLMResponse> {
    return this._executeWithFallback((provider) => provider.generateText(messages, options));
  }

  /**
   * Generate a streaming response, falling back through providers on
   * transient failures.
   *
   * Only providers that support streaming are attempted. If no remaining
   * provider supports streaming, the last error is thrown.
   */
  async generateStream(
    messages: readonly LLMMessage[],
    options?: LLMRequestOptions,
  ): Promise<LLMStreamResponse> {
    return this._executeWithFallback((provider) => {
      if (!isStreamingProvider(provider)) {
        throw new Error(
          `Provider "${provider.name}" does not support streaming. ` +
            'Wrap a StreamingLLMProvider to use generateStream().',
        );
      }
      return provider.generateStream(messages, options);
    });
  }

  // -------------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------------

  /**
   * Try each provider in order until one succeeds or all fail.
   */
  private async _executeWithFallback<T>(
    operation: (provider: LLMProvider) => Promise<T>,
  ): Promise<T> {
    this._stats.totalRequests++;

    let lastError: Error | undefined;

    for (let i = 0; i < this._providers.length; i++) {
      const provider = this._providers[i];

      try {
        const result = await operation(provider);

        // Record success
        this._recordSuccess(provider.name, i === 0);
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        lastError = err;

        // Record failure for this provider
        this._recordProviderFailure(provider.name);

        // If this is a non-fallbackable error, throw immediately
        if (!shouldFallback(error, this._fallbackOnAll)) {
          this._stats.totalFailures++;
          throw error;
        }

        // If there's a next provider, invoke the fallback callback
        if (i < this._providers.length - 1) {
          const nextProvider = this._providers[i + 1];
          this._onFallback?.({
            from: provider.name,
            to: nextProvider.name,
            error: err,
            failedIndex: i,
            nextIndex: i + 1,
          });
        }
      }
    }

    // All providers failed
    this._stats.totalFailures++;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    throw lastError!;
  }

  private _recordSuccess(providerName: string, isPrimary: boolean): void {
    if (isPrimary) {
      this._stats.primarySuccesses++;
    } else {
      this._stats.fallbackSuccesses++;
    }
    this._stats.providerSuccessCounts[providerName] =
      (this._stats.providerSuccessCounts[providerName] ?? 0) + 1;
  }

  private _recordProviderFailure(providerName: string): void {
    this._stats.providerFailureCounts[providerName] =
      (this._stats.providerFailureCounts[providerName] ?? 0) + 1;
  }
}

// ---------------------------------------------------------------------------
// Factory function
// ---------------------------------------------------------------------------

/**
 * Create a {@link FallbackLLMProvider} from the given providers.
 *
 * The first provider in the array is treated as the primary. Subsequent
 * providers are tried in order when the previous one fails.
 *
 * @param providers - Ordered list of providers (primary first)
 * @param options   - Fallback configuration options
 * @returns A new FallbackLLMProvider
 *
 * @example
 * ```typescript
 * import {
 *   createFallbackProvider,
 *   createOpenAIProvider,
 *   createAnthropicProvider,
 * } from '@crewspace/core';
 *
 * const openai = createOpenAIProvider({ ... });
 * const anthropic = createAnthropicProvider({ ... });
 *
 * const provider = createFallbackProvider([openai, anthropic], {
 *   onFallback: ({ from, to, error }) =>
 *     console.warn(`Falling back from ${from} to ${to}: ${error.message}`),
 * });
 * ```
 */
export function createFallbackProvider(
  providers: readonly LLMProvider[],
  options?: FallbackLLMProviderOptions,
): FallbackLLMProvider {
  return new FallbackLLMProvider(providers, options);
}
