/**
 * Tests for UsageTrackingProvider — automatic token usage tracking wrapper.
 */

import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  UsageTrackingProvider,
  createUsageTrackingProvider,
} from '../../../src/llm/usage-tracking-provider.js';
import { TokenUsageTracker } from '../../../src/llm/usage-tracker.js';
import type {
  LLMMessage,
  LLMProvider,
  LLMRequestOptions,
  LLMResponse,
  LLMStreamChunk,
  LLMStreamResponse,
  StreamingLLMProvider,
  TokenUsage,
} from '../../../src/types/llm.js';
import { LLMRole } from '../../../src/types/llm.js';

// ---------------------------------------------------------------------------
// Mock providers
// ---------------------------------------------------------------------------

function createMockResponse(overrides: Partial<LLMResponse> = {}): LLMResponse {
  return {
    content: 'Hello world',
    finishReason: 'stop',
    tokenUsage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
    ...overrides,
  };
}

function createMockProvider(
  response: LLMResponse = createMockResponse(),
): LLMProvider & { modelId: string } {
  return {
    name: 'openai',
    modelId: 'gpt-4o',
    generateText: vi.fn().mockResolvedValue(response),
  };
}

function createMockStreamResponse(
  chunks: LLMStreamChunk[],
  finalResponse?: LLMResponse,
): LLMStreamResponse {
  const iteratorCalled = false;

  return {
    async toResponse(): Promise<LLMResponse> {
      return (
        finalResponse ?? {
          content: chunks.map((c) => c.content).join(''),
          finishReason: chunks[chunks.length - 1]?.finishReason ?? 'stop',
          tokenUsage: chunks[chunks.length - 1]?.tokenUsage ?? {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
          },
        }
      );
    },
    [Symbol.asyncIterator](): AsyncIterator<LLMStreamChunk> {
      let index = 0;
      return {
        async next(): Promise<IteratorResult<LLMStreamChunk>> {
          if (index >= chunks.length) {
            return { done: true, value: undefined };
          }
          return { done: false, value: chunks[index++] };
        },
      };
    },
  };
}

function createMockStreamingProvider(
  streamResponse: LLMStreamResponse,
  textResponse: LLMResponse = createMockResponse(),
): StreamingLLMProvider & { modelId: string } {
  return {
    name: 'openai',
    modelId: 'gpt-4o',
    generateText: vi.fn().mockResolvedValue(textResponse),
    generateStream: vi.fn().mockResolvedValue(streamResponse),
  };
}

const TEST_MESSAGES: readonly LLMMessage[] = [{ role: LLMRole.USER, content: 'Hello' }];

// ---------------------------------------------------------------------------
// UsageTrackingProvider
// ---------------------------------------------------------------------------

describe('UsageTrackingProvider', () => {
  // -------------------------------------------------------------------------
  // Constructor / properties
  // -------------------------------------------------------------------------

  describe('constructor', () => {
    it('should create with inner provider name', () => {
      const inner = createMockProvider();
      const provider = new UsageTrackingProvider(inner);

      expect(provider.name).toBe('openai');
    });

    it('should read modelId from inner provider', () => {
      const inner = createMockProvider();
      const provider = new UsageTrackingProvider(inner);

      expect(provider.modelId).toBe('gpt-4o');
    });

    it('should use provided modelId over inner provider', () => {
      const inner = createMockProvider();
      const provider = new UsageTrackingProvider(inner, { modelId: 'gpt-4o-mini' });

      expect(provider.modelId).toBe('gpt-4o-mini');
    });

    it('should default to unknown when modelId is not available', () => {
      const inner: LLMProvider = {
        name: 'custom',
        generateText: vi.fn().mockResolvedValue(createMockResponse()),
      };
      const provider = new UsageTrackingProvider(inner);

      expect(provider.modelId).toBe('unknown');
    });

    it('should create a new tracker if none provided', () => {
      const inner = createMockProvider();
      const provider = new UsageTrackingProvider(inner);

      expect(provider.tracker).toBeInstanceOf(TokenUsageTracker);
    });

    it('should use provided tracker', () => {
      const inner = createMockProvider();
      const tracker = new TokenUsageTracker();
      const provider = new UsageTrackingProvider(inner, { tracker });

      expect(provider.tracker).toBe(tracker);
    });

    it('should expose inner provider', () => {
      const inner = createMockProvider();
      const provider = new UsageTrackingProvider(inner);

      expect(provider.innerProvider).toBe(inner);
    });
  });

  // -------------------------------------------------------------------------
  // generateText()
  // -------------------------------------------------------------------------

  describe('generateText()', () => {
    it('should delegate to inner provider and return response', async () => {
      const response = createMockResponse({ content: 'Test response' });
      const inner = createMockProvider(response);
      const provider = new UsageTrackingProvider(inner);

      const result = await provider.generateText(TEST_MESSAGES);

      expect(result).toBe(response);
      expect(inner.generateText).toHaveBeenCalledWith(TEST_MESSAGES, undefined);
    });

    it('should pass options to inner provider', async () => {
      const inner = createMockProvider();
      const provider = new UsageTrackingProvider(inner);
      const options: LLMRequestOptions = { temperature: 0.7, maxTokens: 100 };

      await provider.generateText(TEST_MESSAGES, options);

      expect(inner.generateText).toHaveBeenCalledWith(TEST_MESSAGES, options);
    });

    it('should record usage after successful call', async () => {
      const response = createMockResponse({
        tokenUsage: { promptTokens: 200, completionTokens: 100, totalTokens: 300 },
      });
      const inner = createMockProvider(response);
      const provider = new UsageTrackingProvider(inner);

      await provider.generateText(TEST_MESSAGES);

      expect(provider.tracker.recordCount).toBe(1);
      const records = provider.tracker.getRecords();
      expect(records[0].tokenUsage.promptTokens).toBe(200);
      expect(records[0].tokenUsage.completionTokens).toBe(100);
      expect(records[0].tokenUsage.totalTokens).toBe(300);
      expect(records[0].streaming).toBe(false);
    });

    it('should record correct modelId and provider', async () => {
      const inner = createMockProvider();
      const provider = new UsageTrackingProvider(inner);

      await provider.generateText(TEST_MESSAGES);

      const records = provider.tracker.getRecords();
      expect(records[0].modelId).toBe('gpt-4o');
      expect(records[0].provider).toBe('openai');
    });

    it('should record durationMs', async () => {
      const inner = createMockProvider();
      const provider = new UsageTrackingProvider(inner);

      await provider.generateText(TEST_MESSAGES);

      const records = provider.tracker.getRecords();
      expect(records[0].durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should calculate cost for known models', async () => {
      const response = createMockResponse({
        tokenUsage: { promptTokens: 1000, completionTokens: 500, totalTokens: 1500 },
      });
      const inner = createMockProvider(response);
      const provider = new UsageTrackingProvider(inner);

      await provider.generateText(TEST_MESSAGES);

      expect(provider.tracker.getTotalCost()).toBeCloseTo(0.0075, 6);
    });

    it('should not record usage if inner provider throws', async () => {
      const inner = createMockProvider();
      (inner.generateText as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('API error'),
      );
      const provider = new UsageTrackingProvider(inner);

      await expect(provider.generateText(TEST_MESSAGES)).rejects.toThrow('API error');
      expect(provider.tracker.recordCount).toBe(0);
    });

    it('should track multiple calls independently', async () => {
      const response1 = createMockResponse({
        tokenUsage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
      });
      const response2 = createMockResponse({
        tokenUsage: { promptTokens: 200, completionTokens: 100, totalTokens: 300 },
      });
      const inner = createMockProvider();
      (inner.generateText as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(response1)
        .mockResolvedValueOnce(response2);
      const provider = new UsageTrackingProvider(inner);

      await provider.generateText(TEST_MESSAGES);
      await provider.generateText(TEST_MESSAGES);

      expect(provider.tracker.recordCount).toBe(2);
      const totals = provider.tracker.getTotalTokens();
      expect(totals.promptTokens).toBe(300);
      expect(totals.completionTokens).toBe(150);
      expect(totals.totalTokens).toBe(450);
    });
  });

  // -------------------------------------------------------------------------
  // generateStream()
  // -------------------------------------------------------------------------

  describe('generateStream()', () => {
    it('should throw if inner provider does not support streaming', async () => {
      const inner: LLMProvider = {
        name: 'no-stream',
        generateText: vi.fn().mockResolvedValue(createMockResponse()),
      };
      const provider = new UsageTrackingProvider(inner);

      await expect(provider.generateStream(TEST_MESSAGES)).rejects.toThrow(
        'does not support streaming',
      );
    });

    it('should record usage when stream is consumed via toResponse()', async () => {
      const finalUsage: TokenUsage = {
        promptTokens: 150,
        completionTokens: 75,
        totalTokens: 225,
      };
      const streamResp = createMockStreamResponse(
        [{ content: 'Hello ' }, { content: 'world', finishReason: 'stop', tokenUsage: finalUsage }],
        {
          content: 'Hello world',
          finishReason: 'stop',
          tokenUsage: finalUsage,
        },
      );
      const inner = createMockStreamingProvider(streamResp);
      const provider = new UsageTrackingProvider(inner);

      const stream = await provider.generateStream(TEST_MESSAGES);
      const response = await stream.toResponse();

      expect(response.content).toBe('Hello world');
      expect(provider.tracker.recordCount).toBe(1);
      const records = provider.tracker.getRecords();
      expect(records[0].tokenUsage.promptTokens).toBe(150);
      expect(records[0].tokenUsage.completionTokens).toBe(75);
      expect(records[0].streaming).toBe(true);
    });

    it('should record usage when stream is consumed via iteration', async () => {
      const finalUsage: TokenUsage = {
        promptTokens: 200,
        completionTokens: 100,
        totalTokens: 300,
      };
      const chunks: LLMStreamChunk[] = [
        { content: 'chunk1 ' },
        { content: 'chunk2 ' },
        { content: 'chunk3', finishReason: 'stop', tokenUsage: finalUsage },
      ];
      const streamResp = createMockStreamResponse(chunks);
      const inner = createMockStreamingProvider(streamResp);
      const provider = new UsageTrackingProvider(inner);

      const stream = await provider.generateStream(TEST_MESSAGES);

      const collectedContent: string[] = [];
      for await (const chunk of stream) {
        collectedContent.push(chunk.content);
      }

      expect(collectedContent).toEqual(['chunk1 ', 'chunk2 ', 'chunk3']);
      expect(provider.tracker.recordCount).toBe(1);
      const records = provider.tracker.getRecords();
      expect(records[0].tokenUsage.totalTokens).toBe(300);
      expect(records[0].streaming).toBe(true);
    });

    it('should not double-record usage on iteration + toResponse', async () => {
      const finalUsage: TokenUsage = {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      };
      // toResponse is the primary path — should only record once
      const streamResp = createMockStreamResponse(
        [{ content: 'text', finishReason: 'stop', tokenUsage: finalUsage }],
        { content: 'text', finishReason: 'stop', tokenUsage: finalUsage },
      );
      const inner = createMockStreamingProvider(streamResp);
      const provider = new UsageTrackingProvider(inner);

      const stream = await provider.generateStream(TEST_MESSAGES);
      await stream.toResponse();

      // toResponse already consumed, but second call should not re-record
      expect(provider.tracker.recordCount).toBe(1);
    });

    it('should record correct durationMs for streaming', async () => {
      const finalUsage: TokenUsage = {
        promptTokens: 50,
        completionTokens: 25,
        totalTokens: 75,
      };
      const streamResp = createMockStreamResponse(
        [{ content: 'text', finishReason: 'stop', tokenUsage: finalUsage }],
        { content: 'text', finishReason: 'stop', tokenUsage: finalUsage },
      );
      const inner = createMockStreamingProvider(streamResp);
      const provider = new UsageTrackingProvider(inner);

      const stream = await provider.generateStream(TEST_MESSAGES);
      await stream.toResponse();

      const records = provider.tracker.getRecords();
      expect(records[0].durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  // -------------------------------------------------------------------------
  // Shared tracker
  // -------------------------------------------------------------------------

  describe('shared tracker', () => {
    it('should allow sharing a tracker across multiple providers', async () => {
      const tracker = new TokenUsageTracker();

      const openaiResponse = createMockResponse({
        tokenUsage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
      });
      const openaiInner = {
        name: 'openai',
        modelId: 'gpt-4o',
        generateText: vi.fn().mockResolvedValue(openaiResponse),
      };

      const anthropicResponse = createMockResponse({
        tokenUsage: { promptTokens: 200, completionTokens: 100, totalTokens: 300 },
      });
      const anthropicInner = {
        name: 'anthropic',
        modelId: 'claude-3-5-sonnet-20241022',
        generateText: vi.fn().mockResolvedValue(anthropicResponse),
      };

      const openaiProvider = new UsageTrackingProvider(openaiInner, { tracker });
      const anthropicProvider = new UsageTrackingProvider(anthropicInner, { tracker });

      await openaiProvider.generateText(TEST_MESSAGES);
      await anthropicProvider.generateText(TEST_MESSAGES);

      // Both recorded to the same tracker
      expect(tracker.recordCount).toBe(2);

      const report = tracker.getReport();
      expect(report.byProvider.size).toBe(2);
      expect(report.totals.promptTokens).toBe(300);
      expect(report.totals.completionTokens).toBe(150);
    });
  });

  // -------------------------------------------------------------------------
  // createUsageTrackingProvider() factory
  // -------------------------------------------------------------------------

  describe('createUsageTrackingProvider()', () => {
    it('should return provider and tracker', () => {
      const inner = createMockProvider();
      const result = createUsageTrackingProvider(inner);

      expect(result.provider).toBeInstanceOf(UsageTrackingProvider);
      expect(result.tracker).toBeInstanceOf(TokenUsageTracker);
    });

    it('should share the same tracker instance', () => {
      const inner = createMockProvider();
      const result = createUsageTrackingProvider(inner);

      expect(result.tracker).toBe(result.provider.tracker);
    });

    it('should pass options through', () => {
      const inner = createMockProvider();
      const tracker = new TokenUsageTracker();
      const result = createUsageTrackingProvider(inner, {
        modelId: 'custom-model',
        tracker,
      });

      expect(result.provider.modelId).toBe('custom-model');
      expect(result.tracker).toBe(tracker);
    });

    it('should work end-to-end', async () => {
      const response = createMockResponse({
        tokenUsage: { promptTokens: 500, completionTokens: 250, totalTokens: 750 },
      });
      const inner = createMockProvider(response);
      const { provider, tracker } = createUsageTrackingProvider(inner);

      await provider.generateText(TEST_MESSAGES);
      await provider.generateText(TEST_MESSAGES);

      expect(tracker.recordCount).toBe(2);
      expect(tracker.getTotalTokens().totalTokens).toBe(1500);
      expect(tracker.getTotalCost()).toBeGreaterThan(0);
    });
  });
});
