import { describe, expect, it } from 'vitest';

import { LLMStreamError } from '../../../src/errors/llm-errors.js';
import { DefaultLLMStreamResponse } from '../../../src/llm/stream-response.js';
import type { LLMStreamChunk } from '../../../src/types/llm.js';

function asyncIterableFrom(chunks: LLMStreamChunk[]): AsyncIterable<LLMStreamChunk> {
  return {
    async *[Symbol.asyncIterator]() {
      for (const chunk of chunks) {
        yield chunk;
      }
    },
  };
}

function failingAsyncIterable(
  successChunks: LLMStreamChunk[],
  error: Error,
): AsyncIterable<LLMStreamChunk> {
  return {
    async *[Symbol.asyncIterator]() {
      for (const chunk of successChunks) {
        yield chunk;
      }
      throw error;
    },
  };
}

describe('DefaultLLMStreamResponse', () => {
  describe('toResponse', () => {
    it('should concatenate all chunk contents into a single response', async () => {
      const chunks: LLMStreamChunk[] = [
        { content: 'Hello' },
        { content: ' ' },
        { content: 'world' },
        {
          content: '!',
          finishReason: 'stop',
          tokenUsage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        },
      ];

      const stream = new DefaultLLMStreamResponse('test', asyncIterableFrom(chunks));
      const response = await stream.toResponse();

      expect(response.content).toBe('Hello world!');
      expect(response.finishReason).toBe('stop');
      expect(response.tokenUsage).toEqual({
        promptTokens: 10,
        completionTokens: 5,
        totalTokens: 15,
      });
    });

    it('should use "unknown" as finishReason when no chunk provides it', async () => {
      const chunks: LLMStreamChunk[] = [{ content: 'Hello' }];

      const stream = new DefaultLLMStreamResponse('test', asyncIterableFrom(chunks));
      const response = await stream.toResponse();

      expect(response.finishReason).toBe('unknown');
    });

    it('should use zero token usage when no chunk provides it', async () => {
      const chunks: LLMStreamChunk[] = [{ content: 'data' }];

      const stream = new DefaultLLMStreamResponse('test', asyncIterableFrom(chunks));
      const response = await stream.toResponse();

      expect(response.tokenUsage).toEqual({
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      });
    });

    it('should handle a single chunk stream', async () => {
      const chunks: LLMStreamChunk[] = [
        {
          content: 'Complete in one chunk',
          finishReason: 'stop',
          tokenUsage: { promptTokens: 3, completionTokens: 5, totalTokens: 8 },
        },
      ];

      const stream = new DefaultLLMStreamResponse('test', asyncIterableFrom(chunks));
      const response = await stream.toResponse();

      expect(response.content).toBe('Complete in one chunk');
      expect(response.finishReason).toBe('stop');
    });

    it('should handle an empty stream', async () => {
      const stream = new DefaultLLMStreamResponse('test', asyncIterableFrom([]));
      const response = await stream.toResponse();

      expect(response.content).toBe('');
      expect(response.finishReason).toBe('unknown');
    });

    it('should throw LLMStreamError when stream fails', async () => {
      const source = failingAsyncIterable([{ content: 'partial' }], new Error('Connection reset'));

      const stream = new DefaultLLMStreamResponse('openai', source);

      await expect(stream.toResponse()).rejects.toThrow(LLMStreamError);
      try {
        const retryStream = new DefaultLLMStreamResponse(
          'openai',
          failingAsyncIterable([{ content: 'partial' }], new Error('Connection reset')),
        );
        await retryStream.toResponse();
      } catch (error) {
        expect(error).toBeInstanceOf(LLMStreamError);
        const streamError = error as LLMStreamError;
        expect(streamError.chunksReceived).toBe(1);
        expect(streamError.partialContent).toBe('partial');
        expect(streamError.provider).toBe('openai');
      }
    });

    it('should throw when consumed twice via toResponse', async () => {
      const stream = new DefaultLLMStreamResponse('test', asyncIterableFrom([{ content: 'data' }]));

      await stream.toResponse();
      await expect(stream.toResponse()).rejects.toThrow(LLMStreamError);
      await expect(stream.toResponse()).rejects.toThrow(/already been consumed/);
    });
  });

  describe('async iteration', () => {
    it('should yield chunks via for-await-of', async () => {
      const chunks: LLMStreamChunk[] = [
        { content: 'A' },
        { content: 'B' },
        { content: 'C', finishReason: 'stop' },
      ];

      const stream = new DefaultLLMStreamResponse('test', asyncIterableFrom(chunks));

      const received: LLMStreamChunk[] = [];
      for await (const chunk of stream) {
        received.push(chunk);
      }

      expect(received).toHaveLength(3);
      expect(received[0]!.content).toBe('A');
      expect(received[1]!.content).toBe('B');
      expect(received[2]!.content).toBe('C');
      expect(received[2]!.finishReason).toBe('stop');
    });

    it('should throw when consumed twice via iteration', async () => {
      const stream = new DefaultLLMStreamResponse('test', asyncIterableFrom([{ content: 'data' }]));

      // First consumption
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _chunk of stream) {
        // consume
      }

      // Second consumption should throw
      expect(() => stream[Symbol.asyncIterator]()).toThrow(LLMStreamError);
    });

    it('should throw when iteration follows toResponse', async () => {
      const stream = new DefaultLLMStreamResponse('test', asyncIterableFrom([{ content: 'data' }]));

      await stream.toResponse();

      expect(() => stream[Symbol.asyncIterator]()).toThrow(LLMStreamError);
    });

    it('should throw when toResponse follows iteration', async () => {
      const stream = new DefaultLLMStreamResponse('test', asyncIterableFrom([{ content: 'data' }]));

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _chunk of stream) {
        // consume
      }

      await expect(stream.toResponse()).rejects.toThrow(LLMStreamError);
    });
  });

  describe('finishReason from last chunk', () => {
    it('should use the last finish reason when multiple chunks have it', async () => {
      const chunks: LLMStreamChunk[] = [
        { content: 'A', finishReason: 'length' },
        { content: 'B', finishReason: 'stop' },
      ];

      const stream = new DefaultLLMStreamResponse('test', asyncIterableFrom(chunks));
      const response = await stream.toResponse();

      expect(response.finishReason).toBe('stop');
    });
  });
});
