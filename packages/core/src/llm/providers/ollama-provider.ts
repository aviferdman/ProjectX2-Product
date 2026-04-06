/**
 * Ollama LLM provider implementation.
 *
 * Supports any model available through a local Ollama instance (Llama 3.1,
 * Mistral, Code Llama, etc.). Uses native `fetch` (Node 18+) with no
 * external dependencies.
 *
 * Features:
 * - Text generation via Ollama Chat API (`/api/chat`)
 * - Streaming via newline-delimited JSON (NDJSON)
 * - Automatic error mapping (model not found, server errors)
 * - Configurable base URL for remote Ollama instances
 * - AbortSignal support for request cancellation
 * - No API key required (local-first, optional auth support)
 *
 * @packageDocumentation
 */

import { LLMProviderError, LLMRateLimitError } from '../../errors/llm-errors.js';
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

const OLLAMA_DEFAULT_BASE_URL = 'http://localhost:11434';
const PROVIDER_NAME = 'ollama';

// ---------------------------------------------------------------------------
// Internal types for Ollama API responses
// ---------------------------------------------------------------------------

/** Ollama Chat API message format. */
interface OllamaMessage {
  readonly role: string;
  readonly content: string;
}

/** Non-streaming Chat API response. */
interface OllamaChatResponse {
  readonly message: OllamaMessage;
  readonly done: boolean;
  readonly done_reason?: string;
  readonly prompt_eval_count?: number;
  readonly eval_count?: number;
  readonly total_duration?: number;
  readonly load_duration?: number;
  readonly prompt_eval_duration?: number;
  readonly eval_duration?: number;
}

/** Streaming Chat API chunk (NDJSON line). */
interface OllamaStreamChunk {
  readonly message: OllamaMessage;
  readonly done: boolean;
  readonly done_reason?: string;
  readonly prompt_eval_count?: number;
  readonly eval_count?: number;
  readonly total_duration?: number;
}

/** Ollama API error response body. */
interface OllamaErrorBody {
  readonly error?: string;
}

// ---------------------------------------------------------------------------
// Ollama Provider
// ---------------------------------------------------------------------------

/**
 * LLM provider for local Ollama instances.
 *
 * Ollama runs models locally — no API key is required by default.
 * Uses native `fetch` — no external SDK needed.
 *
 * @example
 * ```typescript
 * import { OllamaProvider } from '@crewspace/core';
 *
 * const provider = new OllamaProvider({
 *   provider: 'ollama',
 *   modelId: 'llama3.1:8b',
 * });
 *
 * const response = await provider.generateText([
 *   { role: LLMRole.USER, content: 'Hello!' },
 * ]);
 * console.log(response.content);
 * ```
 */
export class OllamaProvider extends BaseLLMProvider {
  private readonly _baseUrl: string;
  private readonly _apiKey: string | undefined;

  constructor(config: LLMProviderConfig) {
    super({ ...config, provider: PROVIDER_NAME });

    this._baseUrl = config.baseUrl ?? OLLAMA_DEFAULT_BASE_URL;
    this._apiKey = config.apiKey;
  }

  // -----------------------------------------------------------------------
  // Text generation
  // -----------------------------------------------------------------------

  protected async _doGenerateText(
    messages: readonly LLMMessage[],
    options: LLMRequestOptions,
  ): Promise<LLMResponse> {
    const body = this._buildRequestBody(messages, options, false);
    const response = await this._fetch('/api/chat', body, options.signal);

    const data = (await response.json()) as OllamaChatResponse;

    return {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      content: data.message.content ?? '',
      finishReason: this._mapDoneReason(data.done_reason),
      tokenUsage: {
        promptTokens: data.prompt_eval_count ?? 0,
        completionTokens: data.eval_count ?? 0,
        totalTokens: (data.prompt_eval_count ?? 0) + (data.eval_count ?? 0),
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
    const response = await this._fetch('/api/chat', body, options.signal);

    const stream = this._parseNDJSONStream(response);
    return new DefaultLLMStreamResponse(PROVIDER_NAME, stream);
  }

  // -----------------------------------------------------------------------
  // HTTP layer
  // -----------------------------------------------------------------------

  /**
   * Execute an HTTP request against the Ollama API.
   *
   * @param path   - API endpoint path (e.g. "/api/chat")
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

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this._apiKey) {
      headers['Authorization'] = `Bearer ${this._apiKey}`;
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
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
    let errorBody: OllamaErrorBody | undefined;
    try {
      errorBody = (await response.json()) as OllamaErrorBody;
    } catch {
      // Body wasn't valid JSON — fall through to generic error
    }

    const message = errorBody?.error ?? `HTTP ${String(response.status)}: ${response.statusText}`;

    switch (response.status) {
      case 404:
        throw new LLMProviderError(
          PROVIDER_NAME,
          `Model not found: ${message}. Ensure the model is pulled with 'ollama pull ${this.modelId}'.`,
          404,
        );

      case 429: {
        const retryAfterHeader = response.headers.get('retry-after');
        const retryAfterMs = retryAfterHeader
          ? Math.round(parseFloat(retryAfterHeader) * 1000)
          : undefined;
        throw new LLMRateLimitError(PROVIDER_NAME, `Rate limit exceeded: ${message}`, retryAfterMs);
      }

      case 400:
        throw new LLMProviderError(PROVIDER_NAME, `Bad request: ${message}`, 400);

      case 500:
      case 502:
      case 503:
        throw new LLMProviderError(
          PROVIDER_NAME,
          `Ollama server error: ${message}`,
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
   * Build the JSON body for the Ollama Chat API.
   *
   * Ollama uses a `messages` array with `role` and `content` fields,
   * and an `options` object for generation parameters.
   */
  private _buildRequestBody(
    messages: readonly LLMMessage[],
    options: LLMRequestOptions,
    stream: boolean,
  ): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model: this.modelId,
      messages: messages.map((m) => this._toOllamaMessage(m)),
      stream,
    };

    const ollamaOptions: Record<string, unknown> = {};

    if (options.temperature !== undefined) {
      ollamaOptions['temperature'] = options.temperature;
    }

    if (options.maxTokens !== undefined) {
      ollamaOptions['num_predict'] = options.maxTokens;
    }

    if (options.stopSequences !== undefined && options.stopSequences.length > 0) {
      ollamaOptions['stop'] = options.stopSequences;
    }

    if (Object.keys(ollamaOptions).length > 0) {
      body['options'] = ollamaOptions;
    }

    return body;
  }

  /**
   * Convert an {@link LLMMessage} to the Ollama message format.
   */
  private _toOllamaMessage(message: LLMMessage): OllamaMessage {
    return {
      role: this._mapRole(message.role),
      content: message.content,
    };
  }

  /**
   * Map {@link LLMRole} to Ollama role strings.
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

  /**
   * Map Ollama done_reason to a normalized finish reason string.
   */
  private _mapDoneReason(doneReason: string | undefined): string {
    switch (doneReason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'load':
        return 'load';
      case undefined:
        return 'stop';
      default:
        return doneReason;
    }
  }

  // -----------------------------------------------------------------------
  // NDJSON parsing
  // -----------------------------------------------------------------------

  /**
   * Parse a streaming HTTP response as newline-delimited JSON (NDJSON).
   *
   * Ollama streams responses as JSON objects separated by newlines,
   * with each chunk containing a `message` field and a `done` boolean.
   * The final chunk has `done: true` and includes token usage stats.
   */
  private async *_parseNDJSONStream(response: Response): AsyncGenerator<LLMStreamChunk> {
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
          if (trimmed === '') continue;

          let chunk: OllamaStreamChunk;
          try {
            chunk = JSON.parse(trimmed) as OllamaStreamChunk;
          } catch {
            continue;
          }

          if (chunk.done) {
            // Final chunk with token usage
            yield {
              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
              content: chunk.message.content ?? '',
              finishReason: this._mapDoneReason(chunk.done_reason),
              tokenUsage: {
                promptTokens: chunk.prompt_eval_count ?? 0,
                completionTokens: chunk.eval_count ?? 0,
                totalTokens: (chunk.prompt_eval_count ?? 0) + (chunk.eval_count ?? 0),
              },
            };
            return;
          }

          yield {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            content: chunk.message.content ?? '',
          };
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
 * Factory function for creating Ollama providers.
 *
 * Register with {@link LLMProviderRegistry} for dynamic creation:
 * ```typescript
 * registry.register('ollama', createOllamaProvider);
 * ```
 *
 * @param config - Provider configuration
 * @returns A new OllamaProvider instance
 */
export function createOllamaProvider(config: LLMProviderConfig): OllamaProvider {
  return new OllamaProvider(config);
}
