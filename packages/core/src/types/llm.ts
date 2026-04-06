/**
 * LLM provider interfaces for dependency injection.
 *
 * Agents are LLM-agnostic — any provider implementing {@link LLMProvider}
 * can be injected at runtime (OpenAI, Anthropic, Ollama, etc.).
 *
 * Streaming is supported via {@link StreamingLLMProvider}, which extends
 * {@link LLMProvider} with a `generateStream()` method returning an
 * {@link LLMStreamResponse} (an `AsyncIterable` of {@link LLMStreamChunk}s).
 *
 * @packageDocumentation
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** Role of a message participant in a conversation. */
export enum LLMRole {
  SYSTEM = "system",
  USER = "user",
  ASSISTANT = "assistant",
  /** Used to return tool/function call results to the model. */
  TOOL = "tool",
}

// ---------------------------------------------------------------------------
// Message types
// ---------------------------------------------------------------------------

/** A single message in an LLM conversation. */
export interface LLMMessage {
  readonly role: LLMRole;
  readonly content: string;
  /** Optional name for tool-result messages (identifies which tool produced this). */
  readonly name?: string;
}

// ---------------------------------------------------------------------------
// Request / Response types
// ---------------------------------------------------------------------------

/** Options for an LLM generation request. */
export interface LLMRequestOptions {
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly stopSequences?: readonly string[];
  /** Optional abort signal for cancellation. */
  readonly signal?: AbortSignal;
}

/** Token usage statistics from an LLM call. */
export interface TokenUsage {
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
}

/** Response from an LLM generation call. */
export interface LLMResponse {
  readonly content: string;
  readonly tokenUsage: TokenUsage;
  readonly finishReason: string;
}

// ---------------------------------------------------------------------------
// Streaming types
// ---------------------------------------------------------------------------

/**
 * A single chunk emitted during a streaming LLM response.
 *
 * Chunks arrive incrementally as the model generates tokens.
 * `finishReason` and `tokenUsage` are only populated on the final chunk.
 */
export interface LLMStreamChunk {
  /** Incremental text content for this chunk. */
  readonly content: string;
  /** Present only on the final chunk — indicates why generation stopped. */
  readonly finishReason?: string;
  /** Present only on the final chunk — cumulative token usage. */
  readonly tokenUsage?: TokenUsage;
}

/**
 * A streaming LLM response — an async iterable of chunks with a
 * convenience method to collect the full response.
 *
 * @example
 * ```typescript
 * const stream = await provider.generateStream(messages);
 *
 * // Option A: Process chunks in real-time
 * for await (const chunk of stream) {
 *   process.stdout.write(chunk.content);
 * }
 *
 * // Option B: Collect the full response
 * const response = await stream.toResponse();
 * console.log(response.content);
 * ```
 */
export interface LLMStreamResponse extends AsyncIterable<LLMStreamChunk> {
  /**
   * Consume the entire stream and return a unified {@link LLMResponse}.
   *
   * This is a convenience method for callers that don't need real-time
   * streaming. It concatenates all chunk contents and uses the final
   * chunk's `finishReason` and `tokenUsage`.
   *
   * @throws If the stream has already been consumed (streams are single-use).
   */
  toResponse(): Promise<LLMResponse>;
}

// ---------------------------------------------------------------------------
// Provider interfaces
// ---------------------------------------------------------------------------

/**
 * Abstract LLM provider interface.
 *
 * Implement this interface to integrate any LLM backend with Crewspace agents.
 */
export interface LLMProvider {
  /** Human-readable provider name (e.g. "openai", "anthropic"). */
  readonly name: string;

  /**
   * Generate a text completion from a conversation.
   *
   * @param messages - Ordered conversation messages
   * @param options  - Generation parameters
   * @returns The LLM response with content and usage metadata
   */
  generateText(
    messages: readonly LLMMessage[],
    options?: LLMRequestOptions,
  ): Promise<LLMResponse>;
}

/**
 * LLM provider with streaming support.
 *
 * Extends {@link LLMProvider} with a `generateStream()` method that returns
 * an async iterable of chunks for real-time token delivery.
 *
 * Use the {@link isStreamingProvider} type guard to check at runtime whether
 * a provider supports streaming.
 */
export interface StreamingLLMProvider extends LLMProvider {
  /**
   * Generate a streaming completion from a conversation.
   *
   * @param messages - Ordered conversation messages
   * @param options  - Generation parameters
   * @returns A stream response that can be iterated or collected
   */
  generateStream(
    messages: readonly LLMMessage[],
    options?: LLMRequestOptions,
  ): Promise<LLMStreamResponse>;
}

// ---------------------------------------------------------------------------
// Provider configuration
// ---------------------------------------------------------------------------

/**
 * Configuration for creating an LLM provider instance.
 *
 * @example
 * ```typescript
 * const config: LLMProviderConfig = {
 *   provider: 'openai',
 *   modelId: 'gpt-4o',
 *   apiKey: process.env.OPENAI_API_KEY,
 *   defaultOptions: { temperature: 0.7, maxTokens: 2048 },
 * };
 * ```
 */
export interface LLMProviderConfig {
  /** Provider identifier (e.g. "openai", "anthropic", "ollama"). */
  readonly provider: string;
  /** Model identifier within the provider (e.g. "gpt-4o", "claude-3-5-sonnet-20241022"). */
  readonly modelId: string;
  /** API key for authentication. May be omitted for local providers like Ollama. */
  readonly apiKey?: string;
  /** Custom base URL for API requests (useful for proxies or self-hosted instances). */
  readonly baseUrl?: string;
  /** Maximum number of retries on transient failures (default: 3). */
  readonly maxRetries?: number;
  /** Request timeout in milliseconds (default: 30000). */
  readonly timeout?: number;
  /** Default generation options applied to every request (can be overridden per-call). */
  readonly defaultOptions?: LLMRequestOptions;
}

// ---------------------------------------------------------------------------
// Model information
// ---------------------------------------------------------------------------

/**
 * Static metadata about a specific LLM model.
 *
 * Useful for token budgeting, cost estimation, and capability checks.
 */
export interface LLMModelInfo {
  /** Model identifier (e.g. "gpt-4o"). */
  readonly modelId: string;
  /** Provider that hosts this model. */
  readonly provider: string;
  /** Human-friendly display name. */
  readonly displayName: string;
  /** Maximum input context window in tokens. */
  readonly maxContextTokens: number;
  /** Maximum output tokens the model can generate. */
  readonly maxOutputTokens: number;
  /** Whether the model supports streaming responses. */
  readonly supportsStreaming: boolean;
  /** Cost per 1,000 input tokens in USD (undefined if free/local). */
  readonly costPer1kInputTokens?: number;
  /** Cost per 1,000 output tokens in USD (undefined if free/local). */
  readonly costPer1kOutputTokens?: number;
}

// ---------------------------------------------------------------------------
// Provider factory
// ---------------------------------------------------------------------------

/**
 * Factory function that creates an LLM provider from configuration.
 *
 * Registered with {@link LLMProviderRegistry} to enable dynamic provider
 * creation from config objects or environment variables.
 */
export type LLMProviderFactory = (config: LLMProviderConfig) => LLMProvider;
