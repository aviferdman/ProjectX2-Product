import { describe, expect, it } from 'vitest';

import type { LLMProvider, LLMStreamChunk, StreamingLLMProvider } from '../../../src/types/llm.js';
import { isStreamingProvider } from '../../../src/llm/type-guards.js';

describe('isStreamingProvider', () => {
  it('should return false for a basic LLMProvider without generateStream', () => {
    const provider: LLMProvider = {
      name: 'basic',
      generateText: async () => ({
        content: 'hello',
        finishReason: 'stop',
        tokenUsage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
      }),
    };

    expect(isStreamingProvider(provider)).toBe(false);
  });

  it('should return true for a StreamingLLMProvider with generateStream', () => {
    const provider: StreamingLLMProvider = {
      name: 'streaming',
      generateText: async () => ({
        content: 'hello',
        finishReason: 'stop',
        tokenUsage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
      }),
      generateStream: async () => {
        async function* gen(): AsyncGenerator<LLMStreamChunk> {
          yield { content: 'hello' };
        }
        return {
          [Symbol.asyncIterator]: () => gen()[Symbol.asyncIterator](),
          toResponse: async () => ({
            content: 'hello',
            finishReason: 'stop',
            tokenUsage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
          }),
        };
      },
    };

    expect(isStreamingProvider(provider)).toBe(true);
  });

  it('should return false when generateStream is not a function', () => {
    const provider = {
      name: 'bad',
      generateText: async () => ({
        content: '',
        finishReason: 'stop',
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      }),
      generateStream: 'not a function',
    } as unknown as LLMProvider;

    expect(isStreamingProvider(provider)).toBe(false);
  });
});
