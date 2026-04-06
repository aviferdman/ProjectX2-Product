import { describe, expect, it, vi } from 'vitest';

import {
  LLMAuthenticationError,
  LLMContextLengthError,
  LLMProviderError,
  LLMRateLimitError,
} from '../../../src/errors/llm-errors.js';
import {
  createFallbackProvider,
  FallbackLLMProvider,
} from '../../../src/llm/fallback-provider.js';
import type {
  LLMMessage,
  LLMProvider,
  LLMResponse,
  LLMStreamChunk,
  LLMStreamResponse,
  StreamingLLMProvider,
} from '../../../src/types/llm.js';
import { LLMRole } from '../../../src/types/llm.js';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const validMessages: LLMMessage[] = [{ role: LLMRole.USER, content: 'Hello' }];

const successResponse: LLMResponse = {
  content: 'Hi there!',
  finishReason: 'stop',
  tokenUsage: { promptTokens: 5, completionTokens: 3, totalTokens: 8 },
};

const secondaryResponse: LLMResponse = {
  content: 'Hello from secondary!',
  finishReason: 'stop',
  tokenUsage: { promptTokens: 5, completionTokens: 4, totalTokens: 9 },
};

const tertiaryResponse: LLMResponse = {
  content: 'Hello from tertiary!',
  finishReason: 'stop',
  tokenUsage: { promptTokens: 5, completionTokens: 4, totalTokens: 9 },
};

// ---------------------------------------------------------------------------
// Mock provider factories
// ---------------------------------------------------------------------------

function createMockProvider(
  name: string,
  overrides?: Partial<LLMProvider>,
): LLMProvider {
  return {
    name,
    generateText: vi.fn().mockResolvedValue(successResponse),
    ...overrides,
  };
}

function createMockStreamingProvider(
  name: string,
  overrides?: Partial<StreamingLLMProvider>,
): StreamingLLMProvider {
  const mockStream: LLMStreamResponse = {
    async *[Symbol.asyncIterator](): AsyncIterator<LLMStreamChunk> {
      yield { content: 'streamed ' };
      yield {
        content: 'response',
        finishReason: 'stop',
        tokenUsage: { promptTokens: 5, completionTokens: 3, totalTokens: 8 },
      };
    },
    async toResponse(): Promise<LLMResponse> {
      return {
        content: 'streamed response',
        finishReason: 'stop',
        tokenUsage: { promptTokens: 5, completionTokens: 3, totalTokens: 8 },
      };
    },
  };

  return {
    name,
    generateText: vi.fn().mockResolvedValue(successResponse),
    generateStream: vi.fn().mockResolvedValue(mockStream),
    ...overrides,
  };
}

function createFailingProvider(
  name: string,
  error: Error,
): LLMProvider {
  return {
    name,
    generateText: vi.fn().mockRejectedValue(error),
  };
}

function createFailingStreamingProvider(
  name: string,
  error: Error,
): StreamingLLMProvider {
  return {
    name,
    generateText: vi.fn().mockRejectedValue(error),
    generateStream: vi.fn().mockRejectedValue(error),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FallbackLLMProvider', () => {
  // -----------------------------------------------------------------------
  // Construction
  // -----------------------------------------------------------------------

  describe('constructor', () => {
    it('should require at least one provider', () => {
      expect(() => new FallbackLLMProvider([])).toThrow(
        'FallbackLLMProvider requires at least one provider',
      );
    });

    it('should accept a single provider', () => {
      const provider = createMockProvider('openai');
      const fallback = new FallbackLLMProvider([provider]);

      expect(fallback.name).toBe('openai');
      expect(fallback.providers).toHaveLength(1);
      expect(fallback.primaryProvider).toBe(provider);
    });

    it('should compose name from all provider names', () => {
      const primary = createMockProvider('openai');
      const secondary = createMockProvider('anthropic');
      const tertiary = createMockProvider('ollama');
      const fallback = new FallbackLLMProvider([primary, secondary, tertiary]);

      expect(fallback.name).toBe('openai → anthropic → ollama');
    });

    it('should expose providers list', () => {
      const primary = createMockProvider('openai');
      const secondary = createMockProvider('anthropic');
      const fallback = new FallbackLLMProvider([primary, secondary]);

      expect(fallback.providers).toEqual([primary, secondary]);
      expect(fallback.primaryProvider).toBe(primary);
    });

    it('should start with zero stats', () => {
      const fallback = new FallbackLLMProvider([createMockProvider('openai')]);
      const stats = fallback.stats;

      expect(stats.totalRequests).toBe(0);
      expect(stats.primarySuccesses).toBe(0);
      expect(stats.fallbackSuccesses).toBe(0);
      expect(stats.totalFailures).toBe(0);
      expect(stats.providerSuccessCounts).toEqual({});
      expect(stats.providerFailureCounts).toEqual({});
    });
  });

  // -----------------------------------------------------------------------
  // generateText — Primary success
  // -----------------------------------------------------------------------

  describe('generateText — primary success', () => {
    it('should use the primary provider when it succeeds', async () => {
      const primary = createMockProvider('openai');
      const secondary = createMockProvider('anthropic');
      const fallback = new FallbackLLMProvider([primary, secondary]);

      const result = await fallback.generateText(validMessages);

      expect(result).toEqual(successResponse);
      expect(primary.generateText).toHaveBeenCalledWith(validMessages, undefined);
      expect(secondary.generateText).not.toHaveBeenCalled();
    });

    it('should track primary success in stats', async () => {
      const primary = createMockProvider('openai');
      const secondary = createMockProvider('anthropic');
      const fallback = new FallbackLLMProvider([primary, secondary]);

      await fallback.generateText(validMessages);

      const stats = fallback.stats;
      expect(stats.totalRequests).toBe(1);
      expect(stats.primarySuccesses).toBe(1);
      expect(stats.fallbackSuccesses).toBe(0);
      expect(stats.totalFailures).toBe(0);
      expect(stats.providerSuccessCounts).toEqual({ openai: 1 });
      expect(stats.providerFailureCounts).toEqual({});
    });

    it('should pass options through to the provider', async () => {
      const primary = createMockProvider('openai');
      const fallback = new FallbackLLMProvider([primary]);
      const options = { temperature: 0.5, maxTokens: 100 };

      await fallback.generateText(validMessages, options);

      expect(primary.generateText).toHaveBeenCalledWith(validMessages, options);
    });
  });

  // -----------------------------------------------------------------------
  // generateText — Fallback
  // -----------------------------------------------------------------------

  describe('generateText — fallback', () => {
    it('should fall back to secondary when primary fails with retryable error', async () => {
      const error = new LLMProviderError('openai', 'Server error', 500);
      const primary = createFailingProvider('openai', error);
      const secondary = {
        name: 'anthropic',
        generateText: vi.fn().mockResolvedValue(secondaryResponse),
      };
      const fallback = new FallbackLLMProvider([primary, secondary]);

      const result = await fallback.generateText(validMessages);

      expect(result).toEqual(secondaryResponse);
      expect(primary.generateText).toHaveBeenCalledOnce();
      expect(secondary.generateText).toHaveBeenCalledOnce();
    });

    it('should track fallback success in stats', async () => {
      const error = new LLMRateLimitError('openai', 'Rate limited', 1000);
      const primary = createFailingProvider('openai', error);
      const secondary = {
        name: 'anthropic',
        generateText: vi.fn().mockResolvedValue(secondaryResponse),
      };
      const fallback = new FallbackLLMProvider([primary, secondary]);

      await fallback.generateText(validMessages);

      const stats = fallback.stats;
      expect(stats.totalRequests).toBe(1);
      expect(stats.primarySuccesses).toBe(0);
      expect(stats.fallbackSuccesses).toBe(1);
      expect(stats.totalFailures).toBe(0);
      expect(stats.providerSuccessCounts).toEqual({ anthropic: 1 });
      expect(stats.providerFailureCounts).toEqual({ openai: 1 });
    });

    it('should try all providers in order before giving up', async () => {
      const err1 = new LLMProviderError('openai', 'Down', 502);
      const err2 = new LLMProviderError('anthropic', 'Down', 503);
      const primary = createFailingProvider('openai', err1);
      const secondary = createFailingProvider('anthropic', err2);
      const tertiary = {
        name: 'ollama',
        generateText: vi.fn().mockResolvedValue(tertiaryResponse),
      };
      const fallback = new FallbackLLMProvider([primary, secondary, tertiary]);

      const result = await fallback.generateText(validMessages);

      expect(result).toEqual(tertiaryResponse);
      expect(primary.generateText).toHaveBeenCalledOnce();
      expect(secondary.generateText).toHaveBeenCalledOnce();
      expect(tertiary.generateText).toHaveBeenCalledOnce();

      const stats = fallback.stats;
      expect(stats.providerFailureCounts).toEqual({ openai: 1, anthropic: 1 });
      expect(stats.providerSuccessCounts).toEqual({ ollama: 1 });
      expect(stats.fallbackSuccesses).toBe(1);
    });

    it('should throw last error when all providers fail', async () => {
      const err1 = new LLMProviderError('openai', 'Down', 500);
      const err2 = new LLMProviderError('anthropic', 'Also down', 503);
      const primary = createFailingProvider('openai', err1);
      const secondary = createFailingProvider('anthropic', err2);
      const fallback = new FallbackLLMProvider([primary, secondary]);

      await expect(fallback.generateText(validMessages)).rejects.toThrow('Also down');

      const stats = fallback.stats;
      expect(stats.totalRequests).toBe(1);
      expect(stats.totalFailures).toBe(1);
      expect(stats.primarySuccesses).toBe(0);
      expect(stats.fallbackSuccesses).toBe(0);
    });

    it('should invoke onFallback callback when falling back', async () => {
      const error = new LLMProviderError('openai', 'Server error', 500);
      const primary = createFailingProvider('openai', error);
      const secondary = {
        name: 'anthropic',
        generateText: vi.fn().mockResolvedValue(secondaryResponse),
      };
      const onFallback = vi.fn();
      const fallback = new FallbackLLMProvider([primary, secondary], { onFallback });

      await fallback.generateText(validMessages);

      expect(onFallback).toHaveBeenCalledOnce();
      expect(onFallback).toHaveBeenCalledWith({
        from: 'openai',
        to: 'anthropic',
        error,
        failedIndex: 0,
        nextIndex: 1,
      });
    });

    it('should invoke onFallback for each transition in a chain', async () => {
      const err1 = new LLMProviderError('openai', 'Down', 500);
      const err2 = new LLMProviderError('anthropic', 'Down', 502);
      const primary = createFailingProvider('openai', err1);
      const secondary = createFailingProvider('anthropic', err2);
      const tertiary = {
        name: 'ollama',
        generateText: vi.fn().mockResolvedValue(tertiaryResponse),
      };
      const onFallback = vi.fn();
      const fallback = new FallbackLLMProvider([primary, secondary, tertiary], { onFallback });

      await fallback.generateText(validMessages);

      expect(onFallback).toHaveBeenCalledTimes(2);
      expect(onFallback).toHaveBeenNthCalledWith(1, {
        from: 'openai',
        to: 'anthropic',
        error: err1,
        failedIndex: 0,
        nextIndex: 1,
      });
      expect(onFallback).toHaveBeenNthCalledWith(2, {
        from: 'anthropic',
        to: 'ollama',
        error: err2,
        failedIndex: 1,
        nextIndex: 2,
      });
    });
  });

  // -----------------------------------------------------------------------
  // generateText — Non-retryable errors
  // -----------------------------------------------------------------------

  describe('generateText — non-retryable errors', () => {
    it('should NOT fall back on LLMAuthenticationError by default', async () => {
      const authError = new LLMAuthenticationError('openai', 'Invalid API key');
      const primary = createFailingProvider('openai', authError);
      const secondary = createMockProvider('anthropic');
      const fallback = new FallbackLLMProvider([primary, secondary]);

      await expect(fallback.generateText(validMessages)).rejects.toThrow('Invalid API key');
      expect(secondary.generateText).not.toHaveBeenCalled();

      const stats = fallback.stats;
      expect(stats.totalFailures).toBe(1);
      expect(stats.providerFailureCounts).toEqual({ openai: 1 });
    });

    it('should NOT fall back on LLMContextLengthError by default', async () => {
      const ctxError = new LLMContextLengthError(
        'openai',
        'Context too long',
        10000,
        4096,
      );
      const primary = createFailingProvider('openai', ctxError);
      const secondary = createMockProvider('anthropic');
      const fallback = new FallbackLLMProvider([primary, secondary]);

      await expect(fallback.generateText(validMessages)).rejects.toThrow('Context too long');
      expect(secondary.generateText).not.toHaveBeenCalled();
    });

    it('should fall back on auth errors when fallbackOnAllErrors is true', async () => {
      const authError = new LLMAuthenticationError('openai', 'Invalid API key');
      const primary = createFailingProvider('openai', authError);
      const secondary = {
        name: 'anthropic',
        generateText: vi.fn().mockResolvedValue(secondaryResponse),
      };
      const fallback = new FallbackLLMProvider([primary, secondary], {
        fallbackOnAllErrors: true,
      });

      const result = await fallback.generateText(validMessages);

      expect(result).toEqual(secondaryResponse);
      expect(secondary.generateText).toHaveBeenCalledOnce();
    });

    it('should fall back on context length errors when fallbackOnAllErrors is true', async () => {
      const ctxError = new LLMContextLengthError('openai', 'Context too long', 10000, 4096);
      const primary = createFailingProvider('openai', ctxError);
      const secondary = {
        name: 'anthropic',
        generateText: vi.fn().mockResolvedValue(secondaryResponse),
      };
      const fallback = new FallbackLLMProvider([primary, secondary], {
        fallbackOnAllErrors: true,
      });

      const result = await fallback.generateText(validMessages);

      expect(result).toEqual(secondaryResponse);
    });

    it('should fall back on generic errors (non-LLM)', async () => {
      const genericError = new Error('Network timeout');
      const primary = createFailingProvider('openai', genericError);
      const secondary = {
        name: 'anthropic',
        generateText: vi.fn().mockResolvedValue(secondaryResponse),
      };
      const fallback = new FallbackLLMProvider([primary, secondary]);

      const result = await fallback.generateText(validMessages);

      expect(result).toEqual(secondaryResponse);
    });

    it('should fall back on LLMRateLimitError', async () => {
      const rateError = new LLMRateLimitError('openai', 'Rate limited', 5000);
      const primary = createFailingProvider('openai', rateError);
      const secondary = {
        name: 'anthropic',
        generateText: vi.fn().mockResolvedValue(secondaryResponse),
      };
      const fallback = new FallbackLLMProvider([primary, secondary]);

      const result = await fallback.generateText(validMessages);

      expect(result).toEqual(secondaryResponse);
    });

    it('should fall back on LLMProviderError with 500 status', async () => {
      const serverError = new LLMProviderError('openai', 'Internal error', 500);
      const primary = createFailingProvider('openai', serverError);
      const secondary = {
        name: 'anthropic',
        generateText: vi.fn().mockResolvedValue(secondaryResponse),
      };
      const fallback = new FallbackLLMProvider([primary, secondary]);

      const result = await fallback.generateText(validMessages);

      expect(result).toEqual(secondaryResponse);
    });
  });

  // -----------------------------------------------------------------------
  // generateStream — Primary success
  // -----------------------------------------------------------------------

  describe('generateStream — primary success', () => {
    it('should stream from primary provider when it succeeds', async () => {
      const primary = createMockStreamingProvider('openai');
      const secondary = createMockStreamingProvider('anthropic');
      const fallback = new FallbackLLMProvider([primary, secondary]);

      const stream = await fallback.generateStream(validMessages);
      const chunks: LLMStreamChunk[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(2);
      expect(chunks[0].content).toBe('streamed ');
      expect(chunks[1].content).toBe('response');
      expect(primary.generateStream).toHaveBeenCalledOnce();
      expect(secondary.generateStream).not.toHaveBeenCalled();
    });

    it('should track primary stream success in stats', async () => {
      const primary = createMockStreamingProvider('openai');
      const fallback = new FallbackLLMProvider([primary]);

      await fallback.generateStream(validMessages);

      const stats = fallback.stats;
      expect(stats.totalRequests).toBe(1);
      expect(stats.primarySuccesses).toBe(1);
    });
  });

  // -----------------------------------------------------------------------
  // generateStream — Fallback
  // -----------------------------------------------------------------------

  describe('generateStream — fallback', () => {
    it('should fall back to secondary streaming provider on failure', async () => {
      const error = new LLMProviderError('openai', 'Server error', 500);
      const primary = createFailingStreamingProvider('openai', error);
      const secondary = createMockStreamingProvider('anthropic');
      const fallback = new FallbackLLMProvider([primary, secondary]);

      const stream = await fallback.generateStream(validMessages);
      const response = await stream.toResponse();

      expect(response.content).toBe('streamed response');
      expect(primary.generateStream).toHaveBeenCalledOnce();
      expect(secondary.generateStream).toHaveBeenCalledOnce();
    });

    it('should throw when falling back to non-streaming provider', async () => {
      const error = new LLMProviderError('openai', 'Server error', 500);
      const primary = createFailingStreamingProvider('openai', error);
      const secondary = createMockProvider('anthropic'); // NOT streaming
      const fallback = new FallbackLLMProvider([primary, secondary]);

      await expect(fallback.generateStream(validMessages)).rejects.toThrow(
        'does not support streaming',
      );
    });

    it('should track streaming fallback success', async () => {
      const error = new LLMProviderError('openai', 'Down', 502);
      const primary = createFailingStreamingProvider('openai', error);
      const secondary = createMockStreamingProvider('anthropic');
      const fallback = new FallbackLLMProvider([primary, secondary]);

      await fallback.generateStream(validMessages);

      const stats = fallback.stats;
      expect(stats.fallbackSuccesses).toBe(1);
      expect(stats.providerFailureCounts).toEqual({ openai: 1 });
      expect(stats.providerSuccessCounts).toEqual({ anthropic: 1 });
    });
  });

  // -----------------------------------------------------------------------
  // Stats management
  // -----------------------------------------------------------------------

  describe('stats', () => {
    it('should accumulate stats across multiple requests', async () => {
      const primary = createMockProvider('openai');
      const fallback = new FallbackLLMProvider([primary]);

      await fallback.generateText(validMessages);
      await fallback.generateText(validMessages);
      await fallback.generateText(validMessages);

      const stats = fallback.stats;
      expect(stats.totalRequests).toBe(3);
      expect(stats.primarySuccesses).toBe(3);
      expect(stats.providerSuccessCounts).toEqual({ openai: 3 });
    });

    it('should reset stats', async () => {
      const primary = createMockProvider('openai');
      const fallback = new FallbackLLMProvider([primary]);

      await fallback.generateText(validMessages);
      expect(fallback.stats.totalRequests).toBe(1);

      fallback.resetStats();

      const stats = fallback.stats;
      expect(stats.totalRequests).toBe(0);
      expect(stats.primarySuccesses).toBe(0);
      expect(stats.fallbackSuccesses).toBe(0);
      expect(stats.totalFailures).toBe(0);
      expect(stats.providerSuccessCounts).toEqual({});
      expect(stats.providerFailureCounts).toEqual({});
    });

    it('should return a snapshot (not live reference)', async () => {
      const primary = createMockProvider('openai');
      const fallback = new FallbackLLMProvider([primary]);

      const statsBefore = fallback.stats;
      await fallback.generateText(validMessages);
      const statsAfter = fallback.stats;

      expect(statsBefore.totalRequests).toBe(0);
      expect(statsAfter.totalRequests).toBe(1);
    });
  });

  // -----------------------------------------------------------------------
  // Single provider (no fallback)
  // -----------------------------------------------------------------------

  describe('single provider (no fallback)', () => {
    it('should work with a single provider', async () => {
      const provider = createMockProvider('openai');
      const fallback = new FallbackLLMProvider([provider]);

      const result = await fallback.generateText(validMessages);

      expect(result).toEqual(successResponse);
    });

    it('should throw when single provider fails', async () => {
      const error = new LLMProviderError('openai', 'Server error', 500);
      const provider = createFailingProvider('openai', error);
      const fallback = new FallbackLLMProvider([provider]);

      await expect(fallback.generateText(validMessages)).rejects.toThrow('Server error');

      const stats = fallback.stats;
      expect(stats.totalFailures).toBe(1);
    });
  });

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------

  describe('edge cases', () => {
    it('should handle providers with the same name', async () => {
      const err = new LLMProviderError('openai', 'Down', 500);
      const primary = createFailingProvider('openai', err);
      const secondary = {
        name: 'openai',
        generateText: vi.fn().mockResolvedValue(secondaryResponse),
      };
      const fallback = new FallbackLLMProvider([primary, secondary]);

      const result = await fallback.generateText(validMessages);
      expect(result).toEqual(secondaryResponse);

      expect(fallback.name).toBe('openai → openai');
      // Counts accumulate under same key
      expect(fallback.stats.providerSuccessCounts).toEqual({ openai: 1 });
      expect(fallback.stats.providerFailureCounts).toEqual({ openai: 1 });
    });

    it('should not call onFallback when there is no next provider', async () => {
      const error = new LLMProviderError('openai', 'Down', 500);
      const provider = createFailingProvider('openai', error);
      const onFallback = vi.fn();
      const fallback = new FallbackLLMProvider([provider], { onFallback });

      await expect(fallback.generateText(validMessages)).rejects.toThrow();
      expect(onFallback).not.toHaveBeenCalled();
    });

    it('should handle non-Error throws gracefully', async () => {
      const primary: LLMProvider = {
        name: 'openai',
        generateText: vi.fn().mockRejectedValue('string error'),
      };
      const secondary = {
        name: 'anthropic',
        generateText: vi.fn().mockResolvedValue(secondaryResponse),
      };
      const fallback = new FallbackLLMProvider([primary, secondary]);

      const result = await fallback.generateText(validMessages);
      expect(result).toEqual(secondaryResponse);
    });

    it('should handle non-Error throws when all fail', async () => {
      const primary: LLMProvider = {
        name: 'openai',
        generateText: vi.fn().mockRejectedValue('string error'),
      };
      const secondary: LLMProvider = {
        name: 'anthropic',
        generateText: vi.fn().mockRejectedValue('another string error'),
      };
      const fallback = new FallbackLLMProvider([primary, secondary]);

      await expect(fallback.generateText(validMessages)).rejects.toThrow(
        'another string error',
      );
    });
  });
});

// ---------------------------------------------------------------------------
// createFallbackProvider factory
// ---------------------------------------------------------------------------

describe('createFallbackProvider', () => {
  it('should create a FallbackLLMProvider', () => {
    const primary = createMockProvider('openai');
    const secondary = createMockProvider('anthropic');
    const provider = createFallbackProvider([primary, secondary]);

    expect(provider).toBeInstanceOf(FallbackLLMProvider);
    expect(provider.name).toBe('openai → anthropic');
  });

  it('should pass options through', () => {
    const primary = createMockProvider('openai');
    const onFallback = vi.fn();
    const provider = createFallbackProvider([primary], {
      onFallback,
      fallbackOnAllErrors: true,
    });

    expect(provider).toBeInstanceOf(FallbackLLMProvider);
  });

  it('should work end-to-end with fallback', async () => {
    const error = new LLMProviderError('openai', 'Down', 500);
    const primary = createFailingProvider('openai', error);
    const secondary = {
      name: 'anthropic',
      generateText: vi.fn().mockResolvedValue(secondaryResponse),
    };
    const onFallback = vi.fn();
    const provider = createFallbackProvider([primary, secondary], { onFallback });

    const result = await provider.generateText(validMessages);

    expect(result).toEqual(secondaryResponse);
    expect(onFallback).toHaveBeenCalledOnce();
  });
});
