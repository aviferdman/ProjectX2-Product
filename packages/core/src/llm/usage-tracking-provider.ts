/**
 * Decorator that wraps an {@link LLMProvider} with automatic token usage
 * tracking and cost calculation.
 *
 * Every `generateText()` and `generateStream()` call is intercepted. Once
 * the response is received, the token usage is automatically recorded in
 * the attached {@link TokenUsageTracker}.
 *
 * For streaming responses, usage is recorded when the stream is fully
 * consumed via {@link LLMStreamResponse.toResponse} or when the final
 * chunk (containing `tokenUsage`) is emitted.
 *
 * @example
 * ```typescript
 * import {
 *   createOpenAIProvider,
 *   createUsageTrackingProvider,
 * } from '@crewspace/core';
 *
 * const openai = createOpenAIProvider({
 *   provider: 'openai',
 *   modelId: 'gpt-4o',
 *   apiKey: process.env.OPENAI_API_KEY!,
 * });
 *
 * const { provider, tracker } = createUsageTrackingProvider(openai, 'gpt-4o');
 *
 * await provider.generateText(messages);
 * await provider.generateText(messages);
 *
 * console.log(tracker.getTotalCost());   // aggregated cost in USD
 * console.log(tracker.getReport());      // full report with breakdowns
 * ```
 *
 * @packageDocumentation
 */

import type {
  LLMMessage,
  LLMProvider,
  LLMRequestOptions,
  LLMResponse,
  LLMStreamChunk,
  LLMStreamResponse,
  StreamingLLMProvider,
  TokenUsage,
} from '../types/llm.js';
import { isStreamingProvider } from './type-guards.js';
import { TokenUsageTracker } from './usage-tracker.js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Options for creating a {@link UsageTrackingProvider}.
 */
export interface UsageTrackingProviderOptions {
  /**
   * Model ID for cost calculation. Required when the inner provider doesn't
   * expose `modelId` (e.g. a custom wrapper). If omitted, the provider
   * tries to read `modelId` from the inner provider.
   */
  readonly modelId?: string;

  /**
   * Existing tracker to use. If omitted, a new tracker is created.
   * Share a tracker across multiple providers to aggregate usage globally.
   */
  readonly tracker?: TokenUsageTracker;
}

// ---------------------------------------------------------------------------
// Tracked stream wrapper
// ---------------------------------------------------------------------------

/**
 * Wraps an {@link LLMStreamResponse} to record token usage when the stream
 * completes.
 */
class TrackedStreamResponse implements LLMStreamResponse {
  private readonly _inner: LLMStreamResponse;
  private readonly _onComplete: (usage: TokenUsage) => void;
  private _consumed = false;

  constructor(inner: LLMStreamResponse, onComplete: (usage: TokenUsage) => void) {
    this._inner = inner;
    this._onComplete = onComplete;
  }

  async toResponse(): Promise<LLMResponse> {
    const response = await this._inner.toResponse();
    if (!this._consumed) {
      this._consumed = true;
      this._onComplete(response.tokenUsage);
    }
    return response;
  }

  [Symbol.asyncIterator](): AsyncIterator<LLMStreamChunk> {
    const innerIterator = this._inner[Symbol.asyncIterator]();
    const onComplete = this._onComplete;
    let consumed = false;

    // Capture `this._consumed` reference for the closure
    const markConsumed = () => {
      this._consumed = true;
    };

    return {
      async next(): Promise<IteratorResult<LLMStreamChunk>> {
        const result = await innerIterator.next();

        if (result.done) {
          return result;
        }

        // If this is the final chunk with usage, record it
        if (result.value.tokenUsage && !consumed) {
          consumed = true;
          markConsumed();
          onComplete(result.value.tokenUsage);
        }

        return result;
      },
    };
  }
}

// ---------------------------------------------------------------------------
// UsageTrackingProvider
// ---------------------------------------------------------------------------

/**
 * Wraps an LLM provider to automatically record token usage and calculate
 * cost for every request.
 *
 * Usage data is stored in the attached {@link TokenUsageTracker} which can
 * be queried for totals, per-model/per-provider breakdowns, and full reports.
 */
export class UsageTrackingProvider implements StreamingLLMProvider {
  public readonly name: string;

  private readonly _inner: LLMProvider;
  private readonly _modelId: string;
  private readonly _tracker: TokenUsageTracker;
  private readonly _innerIsStreaming: boolean;

  constructor(inner: LLMProvider, options?: UsageTrackingProviderOptions) {
    this._inner = inner;
    this.name = inner.name;
    this._innerIsStreaming = isStreamingProvider(inner);

    // Resolve modelId
    const providedModelId = options?.modelId;
    const innerModelId = 'modelId' in inner ? (inner as { modelId: string }).modelId : undefined;
    this._modelId = providedModelId ?? innerModelId ?? 'unknown';

    this._tracker = options?.tracker ?? new TokenUsageTracker();
  }

  /** The wrapped inner provider. */
  get innerProvider(): LLMProvider {
    return this._inner;
  }

  /** The model ID used for cost calculation. */
  get modelId(): string {
    return this._modelId;
  }

  /** The usage tracker accumulating request data. */
  get tracker(): TokenUsageTracker {
    return this._tracker;
  }

  /**
   * Generate text and automatically record token usage.
   */
  async generateText(
    messages: readonly LLMMessage[],
    options?: LLMRequestOptions,
  ): Promise<LLMResponse> {
    const startTime = Date.now();
    const response = await this._inner.generateText(messages, options);
    const durationMs = Date.now() - startTime;

    this._tracker.record({
      modelId: this._modelId,
      provider: this.name,
      tokenUsage: response.tokenUsage,
      durationMs,
      streaming: false,
    });

    return response;
  }

  /**
   * Generate a streaming response and automatically record token usage
   * when the stream completes.
   *
   * Usage is recorded when either:
   * - The stream is collected via `toResponse()`
   * - The final chunk with `tokenUsage` is iterated
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
    const startTime = Date.now();
    const stream = await streamingInner.generateStream(messages, options);

    return new TrackedStreamResponse(stream, (tokenUsage) => {
      const durationMs = Date.now() - startTime;
      this._tracker.record({
        modelId: this._modelId,
        provider: this.name,
        tokenUsage,
        durationMs,
        streaming: true,
      });
    });
  }
}

// ---------------------------------------------------------------------------
// Factory function
// ---------------------------------------------------------------------------

/**
 * Result of {@link createUsageTrackingProvider}.
 */
export interface UsageTrackingProviderResult {
  /** The wrapped provider with automatic usage tracking. */
  readonly provider: UsageTrackingProvider;
  /** The tracker instance — query it for costs and reports. */
  readonly tracker: TokenUsageTracker;
}

/**
 * Create a {@link UsageTrackingProvider} wrapping the given provider.
 *
 * Returns both the wrapped provider and the tracker for convenient access.
 *
 * @param provider - The LLM provider to wrap
 * @param options  - Configuration options
 * @returns Object with the wrapped provider and its tracker
 *
 * @example
 * ```typescript
 * import { createOpenAIProvider, createUsageTrackingProvider } from '@crewspace/core';
 *
 * const openai = createOpenAIProvider({
 *   provider: 'openai',
 *   modelId: 'gpt-4o',
 *   apiKey: process.env.OPENAI_API_KEY!,
 * });
 *
 * const { provider, tracker } = createUsageTrackingProvider(openai);
 *
 * // Use provider normally — usage is tracked automatically
 * await provider.generateText([{ role: LLMRole.USER, content: 'Hello' }]);
 *
 * console.log(`Total cost: $${tracker.getTotalCost().toFixed(6)}`);
 * console.log(`Total tokens: ${tracker.getTotalTokens().totalTokens}`);
 * ```
 */
export function createUsageTrackingProvider(
  provider: LLMProvider,
  options?: UsageTrackingProviderOptions,
): UsageTrackingProviderResult {
  const trackingProvider = new UsageTrackingProvider(provider, options);
  return {
    provider: trackingProvider,
    tracker: trackingProvider.tracker,
  };
}
