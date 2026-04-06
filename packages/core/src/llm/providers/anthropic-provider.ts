/**
 * Anthropic LLM provider implementation.
 *
 * Supports Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus, and any
 * model available through the Anthropic Messages API. Uses native `fetch`
 * (Node 18+) with no external dependencies.
 *
 * Features:
 * - Text generation via Messages API
 * - Streaming via Server-Sent Events (SSE)
 * - Automatic error mapping (rate limits, auth failures, context overflow)
 * - Configurable base URL for proxies
 * - AbortSignal support for request cancellation
 * - System messages extracted to top-level `system` parameter per API spec
 *
 * @packageDocumentation
 */

import {
  LLMAuthenticationError,
  LLMContextLengthError,
  LLMProviderError,
  LLMRateLimitError,
} from '../../errors/llm-errors.js';
import type {
  LLMMessage,
  LLMProviderConfig,
  LLMRequestOptions,
  LLMResponse,
  LLMStreamChunk,
  LLMStreamResponse,
} from '../../types/llm.js';
import { LLMRole } from '../../types/llm.js';
import { BaseLLMProvider } from '../base-provider.js';
import { DefaultLLMStreamResponse } from '../stream-response.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ANTHROPIC_DEFAULT_BASE_URL = 'https://api.anthropic.com';
const ANTHROPIC_API_VERSION = '2023-06-01';
const PROVIDER_NAME = 'anthropic';
const DEFAULT_MAX_TOKENS = 4_096;

// ---------------------------------------------------------------------------
// Internal types for Anthropic API responses
// ---------------------------------------------------------------------------

/** Anthropic Messages API message format. */
interface AnthropicMessage {
  readonly role: 'user' | 'assistant';
  readonly content: string;
}

/** Token usage from the Anthropic API response. */
interface AnthropicUsage {
  readonly input_tokens: number;
  readonly output_tokens: number;
}

/** A content block in the Messages API response. */
interface AnthropicContentBlock {
  readonly type: 'text';
  readonly text: string;
}

/** Non-streaming Messages API response. */
interface AnthropicMessagesResponse {
  readonly content: readonly AnthropicContentBlock[];
  readonly stop_reason: string | null;
  readonly usage: AnthropicUsage;
}

/** Anthropic API error response body. */
interface AnthropicErrorBody {
  readonly error?: {
    readonly type?: string;
    readonly message?: string;
  };
}

// Streaming event types

/** `message_start` SSE event payload. */
interface AnthropicMessageStartEvent {
  readonly type: 'message_start';
  readonly message: {
    readonly usage: AnthropicUsage;
  };
}

/** `content_block_delta` SSE event payload. */
interface AnthropicContentBlockDeltaEvent {
  readonly type: 'content_block_delta';
  readonly delta: {
    readonly type: 'text_delta';
    readonly text: string;
  };
}

/** `message_delta` SSE event payload (final usage + stop reason). */
interface AnthropicMessageDeltaEvent {
  readonly type: 'message_delta';
  readonly delta: {
    readonly stop_reason: string;
  };
  readonly usage: {
    readonly output_tokens: number;
  };
}

/** Union of relevant Anthropic streaming events. */
type AnthropicStreamEvent =
  | AnthropicMessageStartEvent
  | AnthropicContentBlockDeltaEvent
  | AnthropicMessageDeltaEvent
  | { readonly type: string };

// ---------------------------------------------------------------------------
// Anthropic Provider
// ---------------------------------------------------------------------------

/**
 * LLM provider for the Anthropic Messages API.
 *
 * Requires an API key (passed via config or `ANTHROPIC_API_KEY` env var).
 * Uses native `fetch` — no `@anthropic-ai/sdk` package needed.
 *
 * @example
 * ```typescript
 * import { AnthropicProvider } from '@crewspace/core';
 *
 * const provider = new AnthropicProvider({
 *   provider: 'anthropic',
 *   modelId: 'claude-3-5-sonnet-20241022',
 *   apiKey: process.env.ANTHROPIC_API_KEY!,
 * });
 *
 * const response = await provider.generateText([
 *   { role: LLMRole.USER, content: 'Hello!' },
 * ]);
 * console.log(response.content);
 * ```
 */
export class AnthropicProvider extends BaseLLMProvider {
  private readonly _apiKey: string;
  private readonly _baseUrl: string;

  constructor(config: LLMProviderConfig) {
    super({ ...config, provider: PROVIDER_NAME });

    const apiKey = config.apiKey ?? process.env['ANTHROPIC_API_KEY'];
    if (!apiKey || apiKey.trim().length === 0) {
      throw new LLMAuthenticationError(
        PROVIDER_NAME,
        'API key is required. Provide it via config.apiKey or the ANTHROPIC_API_KEY environment variable.',
      );
    }

    this._apiKey = apiKey;
    this._baseUrl = config.baseUrl ?? ANTHROPIC_DEFAULT_BASE_URL;
  }

  // -----------------------------------------------------------------------
  // Text generation
  // -----------------------------------------------------------------------

  protected async _doGenerateText(
    messages: readonly LLMMessage[],
    options: LLMRequestOptions,
  ): Promise<LLMResponse> {
    const body = this._buildRequestBody(messages, options, false);
    const response = await this._fetch('/v1/messages', body, options.signal);

    const data = (await response.json()) as AnthropicMessagesResponse;

    const content = data.content.map((b) => b.text).join('');

    return {
      content,
      finishReason: data.stop_reason ?? 'unknown',
      tokenUsage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
    };
  }

  // -----------------------------------------------------------------------
  // Streaming generation
  // -----------------------------------------------------------------------

  protected async _doGenerateStream(
    messages: readonly LLMMessage[],
    options: LLMRequestOptions,
  ): Promise<LLMStreamResponse> {
    const body = this._buildRequestBody(messages, options, true);
    const response = await this._fetch('/v1/messages', body, options.signal);

    const stream = this._parseSSEStream(response);
    return new DefaultLLMStreamResponse(PROVIDER_NAME, stream);
  }

  // -----------------------------------------------------------------------
  // HTTP layer
  // -----------------------------------------------------------------------

  /**
   * Execute an HTTP request against the Anthropic API.
   *
   * @param path   - API endpoint path (e.g. "/v1/messages")
   * @param body   - JSON-serializable request body
   * @param signal - Optional AbortSignal for cancellation
   * @returns The fetch Response object (already checked for HTTP errors)
   */
  private async _fetch(
    path: string,
    body: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<Response> {
    const url = `${this._baseUrl}${path}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this._apiKey,
          'anthropic-version': ANTHROPIC_API_VERSION,
        },
        body: JSON.stringify(body),
        ...(signal !== undefined && { signal }),
      });
    } catch (error) {
      const cause = error instanceof Error ? error : new Error(String(error));

      if (cause.name === 'AbortError') {
        throw new LLMProviderError(PROVIDER_NAME, 'Request was aborted', undefined, cause);
      }

      throw new LLMProviderError(
        PROVIDER_NAME,
        `Network error: ${cause.message}`,
        undefined,
        cause,
      );
    }

    if (!response.ok) {
      await this._handleErrorResponse(response);
    }

    return response;
  }

  // -----------------------------------------------------------------------
  // Error handling
  // -----------------------------------------------------------------------

  /**
   * Map an HTTP error response to the appropriate typed error.
   *
   * @param response - The non-OK HTTP response
   * @throws Always throws a typed LLM error
   */
  private async _handleErrorResponse(response: Response): Promise<never> {
    let errorBody: AnthropicErrorBody | undefined;
    try {
      errorBody = (await response.json()) as AnthropicErrorBody;
    } catch {
      // Body wasn't valid JSON — fall through to generic error
    }

    const message =
      errorBody?.error?.message ?? `HTTP ${String(response.status)}: ${response.statusText}`;
    const errorType = errorBody?.error?.type ?? '';

    switch (response.status) {
      case 401:
        throw new LLMAuthenticationError(PROVIDER_NAME, `Authentication failed: ${message}`);

      case 429: {
        const retryAfterHeader = response.headers.get('retry-after');
        const retryAfterMs = retryAfterHeader
          ? Math.round(parseFloat(retryAfterHeader) * 1000)
          : undefined;
        throw new LLMRateLimitError(PROVIDER_NAME, `Rate limit exceeded: ${message}`, retryAfterMs);
      }

      case 400: {
        if (
          errorType === 'invalid_request_error' &&
          (message.includes('token') || message.includes('too long'))
        ) {
          throw new LLMContextLengthError(PROVIDER_NAME, `Context length exceeded: ${message}`);
        }
        throw new LLMProviderError(PROVIDER_NAME, `Bad request: ${message}`, 400);
      }

      case 403:
        throw new LLMProviderError(PROVIDER_NAME, `Access denied: ${message}`, 403);

      case 404:
        throw new LLMProviderError(PROVIDER_NAME, `Model or endpoint not found: ${message}`, 404);

      case 500:
      case 502:
      case 503:
        throw new LLMProviderError(
          PROVIDER_NAME,
          `Anthropic server error: ${message}`,
          response.status,
        );

      case 529:
        throw new LLMProviderError(PROVIDER_NAME, `Anthropic API overloaded: ${message}`, 529);

      default:
        throw new LLMProviderError(PROVIDER_NAME, message, response.status);
    }
  }

  // -----------------------------------------------------------------------
  // Request building
  // -----------------------------------------------------------------------

  /**
   * Build the JSON body for the Anthropic Messages API.
   *
   * Anthropic requires system messages as a top-level `system` parameter,
   * not within the `messages` array.
   */
  private _buildRequestBody(
    messages: readonly LLMMessage[],
    options: LLMRequestOptions,
    stream: boolean,
  ): Record<string, unknown> {
    const { systemMessages, conversationMessages } = this._partitionMessages(messages);

    const body: Record<string, unknown> = {
      model: this.modelId,
      messages: conversationMessages.map((m) => this._toAnthropicMessage(m)),
      max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    };

    if (systemMessages.length > 0) {
      body['system'] = systemMessages.map((m) => m.content).join('\n\n');
    }

    if (stream) {
      body['stream'] = true;
    }

    if (options.temperature !== undefined) {
      body['temperature'] = options.temperature;
    }

    if (options.stopSequences !== undefined && options.stopSequences.length > 0) {
      body['stop_sequences'] = options.stopSequences;
    }

    return body;
  }

  /**
   * Separate system messages from conversation messages.
   *
   * Anthropic's API requires system prompts at the top level, not in the
   * messages array. This method partitions the input accordingly.
   */
  private _partitionMessages(messages: readonly LLMMessage[]): {
    systemMessages: readonly LLMMessage[];
    conversationMessages: readonly LLMMessage[];
  } {
    const systemMessages: LLMMessage[] = [];
    const conversationMessages: LLMMessage[] = [];

    for (const msg of messages) {
      if (msg.role === LLMRole.SYSTEM) {
        systemMessages.push(msg);
      } else {
        conversationMessages.push(msg);
      }
    }

    return { systemMessages, conversationMessages };
  }

  /**
   * Convert an {@link LLMMessage} to the Anthropic message format.
   */
  private _toAnthropicMessage(message: LLMMessage): AnthropicMessage {
    return {
      role: this._mapRole(message.role),
      content: message.content,
    };
  }

  /**
   * Map {@link LLMRole} to Anthropic role strings.
   *
   * Anthropic only supports "user" and "assistant" roles in the messages array.
   * System messages are handled separately via the `system` parameter.
   */
  private _mapRole(role: LLMRole): 'user' | 'assistant' {
    switch (role) {
      case LLMRole.USER:
        return 'user';
      case LLMRole.ASSISTANT:
        return 'assistant';
      case LLMRole.TOOL:
        return 'user';
      case LLMRole.SYSTEM:
        return 'user';
    }
  }

  // -----------------------------------------------------------------------
  // SSE parsing
  // -----------------------------------------------------------------------

  /**
   * Parse a streaming HTTP response as Server-Sent Events.
   *
   * Anthropic SSE uses typed events:
   * - `message_start` — initial message metadata and input token usage
   * - `content_block_start` — start of a content block (ignored)
   * - `content_block_delta` — incremental text content
   * - `message_delta` — stop reason and output token usage
   * - `message_stop` — end of stream
   *
   * Yields {@link LLMStreamChunk} objects for content deltas and the
   * final message delta with usage information.
   */
  private async *_parseSSEStream(response: Response): AsyncGenerator<LLMStreamChunk> {
    const body = response.body;
    if (!body) {
      throw new LLMProviderError(PROVIDER_NAME, 'Streaming response has no body');
    }

    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let inputTokens = 0;

    try {
      for (;;) {
        const result = await reader.read();
        if (result.done) break;

        buffer += decoder.decode(result.value as Uint8Array, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();

          if (trimmed === '' || trimmed.startsWith(':')) {
            continue;
          }

          // Skip event type lines (e.g. "event: message_start")
          if (trimmed.startsWith('event:')) {
            continue;
          }

          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6);
            let event: AnthropicStreamEvent;
            try {
              event = JSON.parse(jsonStr) as AnthropicStreamEvent;
            } catch {
              continue;
            }

            switch (event.type) {
              case 'message_start': {
                const startEvent = event as AnthropicMessageStartEvent;
                inputTokens = startEvent.message.usage.input_tokens;
                break;
              }

              case 'content_block_delta': {
                const deltaEvent = event as AnthropicContentBlockDeltaEvent;
                yield {
                  content: deltaEvent.delta.text,
                };
                break;
              }

              case 'message_delta': {
                const msgDelta = event as AnthropicMessageDeltaEvent;
                const outputTokens = msgDelta.usage.output_tokens;

                yield {
                  content: '',
                  finishReason: msgDelta.delta.stop_reason,
                  tokenUsage: {
                    promptTokens: inputTokens,
                    completionTokens: outputTokens,
                    totalTokens: inputTokens + outputTokens,
                  },
                };
                break;
              }

              default:
                // Ignore other event types (content_block_start, content_block_stop, message_stop, ping)
                break;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Factory function for creating Anthropic providers.
 *
 * Register with {@link LLMProviderRegistry} for dynamic creation:
 * ```typescript
 * registry.register('anthropic', createAnthropicProvider);
 * ```
 *
 * @param config - Provider configuration
 * @returns A new AnthropicProvider instance
 */
export function createAnthropicProvider(config: LLMProviderConfig): AnthropicProvider {
  return new AnthropicProvider(config);
}
