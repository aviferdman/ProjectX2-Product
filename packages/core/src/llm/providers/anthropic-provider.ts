/**
 * Anthropic LLM provider implementation.
 *
 * Supports Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus, and any model
 * available through the Anthropic Messages API. Uses native `fetch` (Node 18+)
 * with no external dependencies.
 *
 * Features:
 * - Text generation via Messages API
 * - Streaming via Server-Sent Events (SSE)
 * - Automatic error mapping (rate limits, auth failures, context overflow)
 * - Configurable base URL for proxies
 * - AbortSignal support for request cancellation
 * - System message extraction (Anthropic uses a top-level `system` field)
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
const PROVIDER_NAME = 'anthropic';
const ANTHROPIC_API_VERSION = '2023-06-01';
const DEFAULT_MAX_TOKENS = 4096;

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

/** A single content block in a Messages API response. */
interface AnthropicContentBlock {
  readonly type: string;
  readonly text?: string;
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

/** Streaming event types from Anthropic. */
interface AnthropicStreamContentDelta {
  readonly type: 'content_block_delta';
  readonly delta: {
    readonly type: 'text_delta';
    readonly text: string;
  };
}

interface AnthropicStreamMessageDelta {
  readonly type: 'message_delta';
  readonly delta: {
    readonly stop_reason: string | null;
  };
  readonly usage?: {
    readonly output_tokens: number;
  };
}

interface AnthropicStreamMessageStart {
  readonly type: 'message_start';
  readonly message: {
    readonly usage?: AnthropicUsage;
  };
}

type AnthropicStreamEvent =
  | AnthropicStreamContentDelta
  | AnthropicStreamMessageDelta
  | AnthropicStreamMessageStart
  | { readonly type: string };

// ---------------------------------------------------------------------------
// Anthropic Provider
// ---------------------------------------------------------------------------

/**
 * LLM provider for the Anthropic Messages API.
 *
 * Requires an API key (passed via config or `ANTHROPIC_API_KEY` env var).
 * Uses native `fetch` — no `@anthropic-ai/sdk` npm package needed.
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

    const textBlock = data.content.find((b) => b.type === 'text');
    const content = textBlock?.text ?? '';

    return {
      content,
      finishReason: this._mapStopReason(data.stop_reason),
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
          (message.includes('context length') ||
            message.includes('too many tokens') ||
            message.includes('token limit'))
        ) {
          const maxTokensMatch = /maximum (?:context length|token limit) is (\d+)/.exec(message);
          const requestTokensMatch = /you requested (\d+)/.exec(message);

          const requestTokenStr = requestTokensMatch?.[1];
          const maxTokenStr = maxTokensMatch?.[1];

          throw new LLMContextLengthError(
            PROVIDER_NAME,
            `Context length exceeded: ${message}`,
            requestTokenStr !== undefined ? parseInt(requestTokenStr, 10) : undefined,
            maxTokenStr !== undefined ? parseInt(maxTokenStr, 10) : undefined,
          );
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
   * Anthropic separates system messages from the conversation:
   * - System messages become the top-level `system` field
   * - User/assistant messages go in the `messages` array
   * - Tool messages are mapped to `user` role
   */
  private _buildRequestBody(
    messages: readonly LLMMessage[],
    options: LLMRequestOptions,
    stream: boolean,
  ): Record<string, unknown> {
    const { systemPrompt, conversationMessages } = this._extractSystemMessages(messages);

    const body: Record<string, unknown> = {
      model: this.modelId,
      messages: conversationMessages.map((m) => this._toAnthropicMessage(m)),
      max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    };

    if (systemPrompt) {
      body['system'] = systemPrompt;
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
   * Extract system messages from the conversation and return them separately.
   *
   * Anthropic requires system messages to be passed as a top-level `system`
   * field rather than in the messages array.
   */
  private _extractSystemMessages(messages: readonly LLMMessage[]): {
    systemPrompt: string | undefined;
    conversationMessages: readonly LLMMessage[];
  } {
    const systemMessages: string[] = [];
    const conversationMessages: LLMMessage[] = [];

    for (const msg of messages) {
      if (msg.role === LLMRole.SYSTEM) {
        systemMessages.push(msg.content);
      } else {
        conversationMessages.push(msg);
      }
    }

    return {
      systemPrompt: systemMessages.length > 0 ? systemMessages.join('\n\n') : undefined,
      conversationMessages,
    };
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
   * Anthropic only supports 'user' and 'assistant' roles in the messages
   * array. System messages are handled separately, and tool messages are
   * mapped to 'user'.
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

  /**
   * Map Anthropic stop_reason to a normalized finish reason string.
   */
  private _mapStopReason(stopReason: string | null): string {
    switch (stopReason) {
      case 'end_turn':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'stop_sequence':
        return 'stop_sequence';
      case null:
        return 'unknown';
      default:
        return stopReason;
    }
  }

  // -----------------------------------------------------------------------
  // SSE parsing
  // -----------------------------------------------------------------------

  /**
   * Parse a streaming HTTP response as Server-Sent Events.
   *
   * Anthropic streams use typed SSE events:
   * - `message_start` — contains initial usage info
   * - `content_block_delta` — contains text chunks
   * - `message_delta` — contains stop_reason and final usage
   * - `message_stop` — signals end of stream
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
    let outputTokens = 0;

    try {
      for (;;) {
        const result = await reader.read();
        if (result.done) break;

        buffer += decoder.decode(result.value as Uint8Array, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        let currentEventType = '';

        for (const line of lines) {
          const trimmed = line.trim();

          if (trimmed === '' || trimmed.startsWith(':')) {
            continue;
          }

          if (trimmed.startsWith('event: ')) {
            currentEventType = trimmed.slice(7).trim();
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

            if (currentEventType === 'message_stop') {
              return;
            }

            if (event.type === 'message_start') {
              const startEvent = event as AnthropicStreamMessageStart;
              if (startEvent.message.usage) {
                inputTokens = startEvent.message.usage.input_tokens;
              }
              continue;
            }

            if (event.type === 'content_block_delta') {
              const deltaEvent = event as AnthropicStreamContentDelta;
              yield {
                content: deltaEvent.delta.text,
              };
            }

            if (event.type === 'message_delta') {
              const messageDelta = event as AnthropicStreamMessageDelta;
              if (messageDelta.usage) {
                outputTokens = messageDelta.usage.output_tokens;
              }
              yield {
                content: '',
                finishReason: this._mapStopReason(messageDelta.delta.stop_reason),
                tokenUsage: {
                  promptTokens: inputTokens,
                  completionTokens: outputTokens,
                  totalTokens: inputTokens + outputTokens,
                },
              };
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
