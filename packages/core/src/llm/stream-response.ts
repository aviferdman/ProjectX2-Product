/**
 * Default implementation of {@link LLMStreamResponse}.
 *
 * Wraps an `AsyncIterable<LLMStreamChunk>` and provides the `toResponse()`
 * convenience method for collecting all chunks into a single {@link LLMResponse}.
 *
 * @packageDocumentation
 */

import { LLMStreamError } from "../errors/llm-errors.js";
import type {
  LLMResponse,
  LLMStreamChunk,
  LLMStreamResponse,
  TokenUsage,
} from "../types/llm.js";

/**
 * Concrete stream response that wraps an async iterable of chunks.
 *
 * Streams are single-use: calling `toResponse()` or iterating consumes the
 * underlying source. Attempting to consume a stream twice throws an error.
 *
 * @example
 * ```typescript
 * const chunks: LLMStreamChunk[] = [
 *   { content: 'Hello' },
 *   { content: ' world', finishReason: 'stop', tokenUsage: { ... } },
 * ];
 *
 * async function* generate() { yield* chunks; }
 * const stream = new DefaultLLMStreamResponse('openai', generate());
 *
 * const response = await stream.toResponse();
 * // response.content === 'Hello world'
 * ```
 */
export class DefaultLLMStreamResponse implements LLMStreamResponse {
  private readonly _provider: string;
  private readonly _source: AsyncIterable<LLMStreamChunk>;
  private _consumed = false;

  constructor(provider: string, source: AsyncIterable<LLMStreamChunk>) {
    this._provider = provider;
    this._source = source;
  }

  [Symbol.asyncIterator](): AsyncIterator<LLMStreamChunk> {
    this._assertNotConsumed();
    this._consumed = true;

    const source = this._source;
    const iterator = source[Symbol.asyncIterator]();
    return iterator;
  }

  async toResponse(): Promise<LLMResponse> {
    this._assertNotConsumed();
    this._consumed = true;

    const parts: string[] = [];
    let finishReason = "unknown";
    let tokenUsage: TokenUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };
    let chunkCount = 0;

    try {
      for await (const chunk of this._source) {
        parts.push(chunk.content);
        chunkCount++;

        if (chunk.finishReason !== undefined) {
          finishReason = chunk.finishReason;
        }

        if (chunk.tokenUsage !== undefined) {
          tokenUsage = chunk.tokenUsage;
        }
      }
    } catch (error) {
      const cause = error instanceof Error ? error : new Error(String(error));
      throw new LLMStreamError(
        this._provider,
        `Stream failed after ${String(chunkCount)} chunks: ${cause.message}`,
        chunkCount,
        parts.join(""),
        cause,
      );
    }

    return {
      content: parts.join(""),
      finishReason,
      tokenUsage,
    };
  }

  private _assertNotConsumed(): void {
    if (this._consumed) {
      throw new LLMStreamError(
        this._provider,
        "Stream has already been consumed. LLM streams are single-use.",
        0,
        "",
      );
    }
  }
}
