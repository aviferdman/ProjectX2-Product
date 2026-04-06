/**
 * OpenAI LLM provider implementation.
 *
 * Supports GPT-4o, GPT-4o-mini, GPT-4 Turbo, and any model available
 * through the OpenAI Chat Completions API. Uses native `fetch` (Node 18+)
 * with no external dependencies.
 *
 * Features:
 * - Text generation via Chat Completions API
 * - Streaming via Server-Sent Events (SSE)
 * - Automatic error mapping (rate limits, auth failures, context overflow)
 * - Configurable base URL for proxies and Azure OpenAI
 * - AbortSignal support for request cancellation
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

const OPENAI_DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const PROVIDER_NAME = 'openai';

// ---------------------------------------------------------------------------
// Internal types for OpenAI API responses
// ---------------------------------------------------------------------------

/** OpenAI Chat Completions API message format. */
interface OpenAIMessage {
  readonly role: string;
  readonly content: string;
  readonly name?: string;
}

/** Token usage from the OpenAI API response. */
interface OpenAIUsage {
  readonly prompt_tokens: number;
  readonly completion_tokens: number;
  readonly total_tokens: number;
}

/** A single choice in a non-streaming Chat Completions response. */
interface OpenAIChoice {
  readonly message: {
    readonly content: string | null;
  };
  readonly finish_reason: string | null;
}

/** Non-streaming Chat Completions response. */
interface OpenAIChatResponse {
  readonly choices: readonly OpenAIChoice[];
  readonly usage?: OpenAIUsage;
}

/** A single choice in a streaming chunk. */
interface OpenAIStreamChoice {
  readonly delta: {
    readonly content?: string | null;
  };
  readonly finish_reason: string | null;
}

/** Streaming Chat Completions chunk. */
interface OpenAIStreamChunk {
  readonly choices: readonly OpenAIStreamChoice[];
  readonly usage?: OpenAIUsage | null;
}

/** OpenAI API error response body. */
interface OpenAIErrorBody {
  readonly error?: {
    readonly message?: string;
    readonly type?: string;
    readonly code?: string;
  };
}

// ---------------------------------------------------------------------------
// OpenAI Provider
// ---------------------------------------------------------------------------

/**
 * LLM provider for the OpenAI Chat Completions API.
 *
 * Requires an API key (passed via config or `OPENAI_API_KEY` env var).
 * Uses native `fetch` — no `openai` npm package needed.
 *
 * @example
 * ```typescript
 * import { OpenAIProvider } from '@crewspace/core';
 *
 * const provider = new OpenAIProvider({
 *   provider: 'openai',
 *   modelId: 'gpt-4o',
 *   apiKey: process.env.OPENAI_API_KEY!,
 * });
 *
 * const response = await provider.generateText([
 *   { role: LLMRole.USER, content: 'Hello!' },
 * ]);
 * console.log(response.content);
 * ```
 */
export class OpenAIProvider extends BaseLLMProvider {
  private readonly _apiKey: string;
  private readonly _baseUrl: string;

  constructor(config: LLMProviderConfig) {
    super({ ...config, provider: PROVIDER_NAME });

    const apiKey = config.apiKey ?? process.env['OPENAI_API_KEY'];
    if (!apiKey || apiKey.trim().length === 0) {
      throw new LLMAuthenticationError(
        PROVIDER_NAME,
        'API key is required. Provide it via config.apiKey or the OPENAI_API_KEY environment variable.',
      );
    }

    this._apiKey = apiKey;
    this._baseUrl = config.baseUrl ?? OPENAI_DEFAULT_BASE_URL;
  }

  // -----------------------------------------------------------------------
  // Text generation
  // -----------------------------------------------------------------------

  protected async _doGenerateText(
    messages: readonly LLMMessage[],
    options: LLMRequestOptions,
  ): Promise<LLMResponse> {
    const body = this._buildRequestBody(messages, options, false);
    const response = await this._fetch('/chat/completions', body, options.signal);

    const data = (await response.json()) as OpenAIChatResponse;

    const choice = data.choices[0];
    if (!choice) {
      throw new LLMProviderError(PROVIDER_NAME, 'OpenAI returned no choices in the response');
    }

    return {
      content: choice.message.content ?? '',
      finishReason: choice.finish_reason ?? 'unknown',
      tokenUsage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
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
    const response = await this._fetch('/chat/completions', body, options.signal);

    const stream = this._parseSSEStream(response);
    return new DefaultLLMStreamResponse(PROVIDER_NAME, stream);
  }

  // -----------------------------------------------------------------------
  // HTTP layer
  // -----------------------------------------------------------------------

  /**
   * Execute an HTTP request against the OpenAI API.
   *
   * @param path   - API endpoint path (e.g. "/chat/completions")
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
          Authorization: `Bearer ${this._apiKey}`,
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
    let errorBody: OpenAIErrorBody | undefined;
    try {
      errorBody = (await response.json()) as OpenAIErrorBody;
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
          (message.includes('maximum context length') || message.includes('too many tokens'))
        ) {
          const maxTokensMatch = /maximum context length is (\d+)/.exec(message);
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
          `OpenAI server error: ${message}`,
          response.status,
        );

      default:
        throw new LLMProviderError(PROVIDER_NAME, message, response.status);
    }
  }

  // -----------------------------------------------------------------------
  // Request building
  // -----------------------------------------------------------------------

  /**
   * Build the JSON body for the Chat Completions API.
   */
  private _buildRequestBody(
    messages: readonly LLMMessage[],
    options: LLMRequestOptions,
    stream: boolean,
  ): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model: this.modelId,
      messages: messages.map((m) => this._toOpenAIMessage(m)),
    };

    if (stream) {
      body['stream'] = true;
      body['stream_options'] = { include_usage: true };
    }

    if (options.temperature !== undefined) {
      body['temperature'] = options.temperature;
    }

    if (options.maxTokens !== undefined) {
      body['max_tokens'] = options.maxTokens;
    }

    if (options.stopSequences !== undefined && options.stopSequences.length > 0) {
      body['stop'] = options.stopSequences;
    }

    return body;
  }

  /**
   * Convert an {@link LLMMessage} to the OpenAI message format.
   */
  private _toOpenAIMessage(message: LLMMessage): OpenAIMessage {
    const mapped: OpenAIMessage = {
      role: this._mapRole(message.role),
      content: message.content,
      ...(message.name !== undefined && { name: message.name }),
    };
    return mapped;
  }

  /**
   * Map {@link LLMRole} to OpenAI role strings.
   */
  private _mapRole(role: LLMRole): string {
    switch (role) {
      case LLMRole.SYSTEM:
        return 'system';
      case LLMRole.USER:
        return 'user';
      case LLMRole.ASSISTANT:
        return 'assistant';
      case LLMRole.TOOL:
        return 'tool';
    }
  }

  // -----------------------------------------------------------------------
  // SSE parsing
  // -----------------------------------------------------------------------

  /**
   * Parse a streaming HTTP response as Server-Sent Events.
   *
   * Yields {@link LLMStreamChunk} objects for each `data:` line in the SSE
   * stream. The stream terminates on `data: [DONE]`.
   */
  private async *_parseSSEStream(response: Response): AsyncGenerator<LLMStreamChunk> {
    const body = response.body;
    if (!body) {
      throw new LLMProviderError(PROVIDER_NAME, 'Streaming response has no body');
    }

    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      for (;;) {
        const result = await reader.read();
        if (result.done) break;

        buffer += decoder.decode(result.value as Uint8Array, { stream: true });

        const lines = buffer.split('\n');
        // Keep the last potentially incomplete line in the buffer
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();

          if (trimmed === '' || trimmed.startsWith(':')) {
            continue;
          }

          if (trimmed === 'data: [DONE]') {
            return;
          }

          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6);
            let chunk: OpenAIStreamChunk;
            try {
              chunk = JSON.parse(jsonStr) as OpenAIStreamChunk;
            } catch {
              continue;
            }

            const choice = chunk.choices[0];
            const content = choice?.delta.content ?? '';
            const finishReason = choice?.finish_reason ?? undefined;

            const streamChunk: LLMStreamChunk = {
              content,
              ...(finishReason !== undefined && { finishReason }),
              ...(chunk.usage !== undefined &&
                chunk.usage !== null && {
                  tokenUsage: {
                    promptTokens: chunk.usage.prompt_tokens,
                    completionTokens: chunk.usage.completion_tokens,
                    totalTokens: chunk.usage.total_tokens,
                  },
                }),
            };

            yield streamChunk;
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
 * Factory function for creating OpenAI providers.
 *
 * Register with {@link LLMProviderRegistry} for dynamic creation:
 * ```typescript
 * registry.register('openai', createOpenAIProvider);
 * ```
 *
 * @param config - Provider configuration
 * @returns A new OpenAIProvider instance
 */
export function createOpenAIProvider(config: LLMProviderConfig): OpenAIProvider {
  return new OpenAIProvider(config);
}
