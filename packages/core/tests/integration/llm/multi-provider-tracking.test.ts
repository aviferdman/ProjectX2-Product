import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  UsageTrackingProvider,
  createUsageTrackingProvider,
} from '../../../src/llm/usage-tracking-provider.js';
import { TokenUsageTracker } from '../../../src/llm/usage-tracker.js';
import { LLMProviderRegistry } from '../../../src/llm/provider-registry.js';
import { RetryLLMProvider, createRetryProvider } from '../../../src/llm/retry-provider.js';
import { ModelCatalog } from '../../../src/llm/model-catalog.js';
import { LLMProviderError, LLMRateLimitError } from '../../../src/errors/llm-errors.js';
import { DefaultLLMStreamResponse } from '../../../src/llm/stream-response.js';
import type {
  LLMProvider,
  LLMResponse,
  LLMStreamChunk,
  LLMStreamResponse,
  StreamingLLMProvider,
  LLMMessage,
  TokenUsage,
} from '../../../src/types/llm.js';
import { LLMRole } from '../../../src/types/llm.js';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

const TEST_MESSAGES: LLMMessage[] = [{ role: LLMRole.USER, content: 'Hello' }];

function createMockProvider(opts: { name: string; modelId: string }): StreamingLLMProvider & {
  modelId: string;
  generateText: ReturnType<typeof vi.fn>;
  generateStream: ReturnType<typeof vi.fn>;
} {
  return {
    name: opts.name,
    modelId: opts.modelId,
    generateText: vi.fn(),
    generateStream: vi.fn(),
  };
}

function okResponse(content: string, tokens: TokenUsage): LLMResponse {
  return { content, finishReason: 'stop', tokenUsage: tokens };
}

function createMockStream(chunks: LLMStreamChunk[]): LLMStreamResponse {
  async function* gen() {
    yield* chunks;
  }
  return new DefaultLLMStreamResponse('mock', gen());
}

// ---------------------------------------------------------------------------
// 1. Shared Tracker Across Multiple Providers
// ---------------------------------------------------------------------------

describe('Shared Tracker Across Multiple Providers', () => {
  let openaiBase: ReturnType<typeof createMockProvider>;
  let anthropicBase: ReturnType<typeof createMockProvider>;
  let sharedTracker: TokenUsageTracker;
  let openaiTracked: UsageTrackingProvider;
  let anthropicTracked: UsageTrackingProvider;

  beforeEach(() => {
    sharedTracker = new TokenUsageTracker();
    openaiBase = createMockProvider({ name: 'openai', modelId: 'gpt-4o' });
    anthropicBase = createMockProvider({
      name: 'anthropic',
      modelId: 'claude-3-5-sonnet-20241022',
    });

    openaiTracked = new UsageTrackingProvider(openaiBase, {
      tracker: sharedTracker,
    });
    anthropicTracked = new UsageTrackingProvider(anthropicBase, {
      tracker: sharedTracker,
    });
  });

  it('accumulates records from both providers in the shared tracker', async () => {
    openaiBase.generateText.mockResolvedValue(
      okResponse('Hi from GPT', { promptTokens: 100, completionTokens: 50, totalTokens: 150 }),
    );
    anthropicBase.generateText.mockResolvedValue(
      okResponse('Hi from Claude', { promptTokens: 200, completionTokens: 80, totalTokens: 280 }),
    );

    await openaiTracked.generateText(TEST_MESSAGES);
    await anthropicTracked.generateText(TEST_MESSAGES);

    expect(sharedTracker.recordCount).toBe(2);
  });

  it('filters records by provider name correctly', async () => {
    openaiBase.generateText.mockResolvedValue(
      okResponse('GPT', { promptTokens: 100, completionTokens: 50, totalTokens: 150 }),
    );
    anthropicBase.generateText.mockResolvedValue(
      okResponse('Claude', { promptTokens: 200, completionTokens: 80, totalTokens: 280 }),
    );

    await openaiTracked.generateText(TEST_MESSAGES);
    await anthropicTracked.generateText(TEST_MESSAGES);

    const openaiRecords = sharedTracker.getRecordsByProvider('openai');
    const anthropicRecords = sharedTracker.getRecordsByProvider('anthropic');

    expect(openaiRecords).toHaveLength(1);
    expect(openaiRecords[0]!.provider).toBe('openai');
    expect(anthropicRecords).toHaveLength(1);
    expect(anthropicRecords[0]!.provider).toBe('anthropic');
  });

  it('filters records by model ID correctly', async () => {
    openaiBase.generateText.mockResolvedValue(
      okResponse('GPT', { promptTokens: 100, completionTokens: 50, totalTokens: 150 }),
    );
    anthropicBase.generateText.mockResolvedValue(
      okResponse('Claude', { promptTokens: 200, completionTokens: 80, totalTokens: 280 }),
    );

    await openaiTracked.generateText(TEST_MESSAGES);
    await anthropicTracked.generateText(TEST_MESSAGES);

    const gptRecords = sharedTracker.getRecordsByModel('gpt-4o');
    const claudeRecords = sharedTracker.getRecordsByModel('claude-3-5-sonnet-20241022');

    expect(gptRecords).toHaveLength(1);
    expect(gptRecords[0]!.modelId).toBe('gpt-4o');
    expect(claudeRecords).toHaveLength(1);
    expect(claudeRecords[0]!.modelId).toBe('claude-3-5-sonnet-20241022');
  });

  it('report byProvider includes both providers with correct summaries', async () => {
    openaiBase.generateText.mockResolvedValue(
      okResponse('GPT', { promptTokens: 100, completionTokens: 50, totalTokens: 150 }),
    );
    anthropicBase.generateText.mockResolvedValue(
      okResponse('Claude', { promptTokens: 200, completionTokens: 80, totalTokens: 280 }),
    );

    await openaiTracked.generateText(TEST_MESSAGES);
    await anthropicTracked.generateText(TEST_MESSAGES);

    const report = sharedTracker.getReport();
    const openaiSummary = report.byProvider.get('openai');
    const anthropicSummary = report.byProvider.get('anthropic');

    expect(openaiSummary).toBeDefined();
    expect(openaiSummary!.requests).toBe(1);
    expect(openaiSummary!.promptTokens).toBe(100);
    expect(openaiSummary!.completionTokens).toBe(50);

    expect(anthropicSummary).toBeDefined();
    expect(anthropicSummary!.requests).toBe(1);
    expect(anthropicSummary!.promptTokens).toBe(200);
    expect(anthropicSummary!.completionTokens).toBe(80);
  });

  it('report byModel includes both models with correct summaries', async () => {
    openaiBase.generateText.mockResolvedValue(
      okResponse('GPT', { promptTokens: 100, completionTokens: 50, totalTokens: 150 }),
    );
    anthropicBase.generateText.mockResolvedValue(
      okResponse('Claude', { promptTokens: 200, completionTokens: 80, totalTokens: 280 }),
    );

    await openaiTracked.generateText(TEST_MESSAGES);
    await anthropicTracked.generateText(TEST_MESSAGES);

    const report = sharedTracker.getReport();
    expect(report.byModel.get('gpt-4o')!.totalTokens).toBe(150);
    expect(report.byModel.get('claude-3-5-sonnet-20241022')!.totalTokens).toBe(280);
  });

  it('total tokens equal the sum of both providers', async () => {
    openaiBase.generateText.mockResolvedValue(
      okResponse('GPT', { promptTokens: 100, completionTokens: 50, totalTokens: 150 }),
    );
    anthropicBase.generateText.mockResolvedValue(
      okResponse('Claude', { promptTokens: 200, completionTokens: 80, totalTokens: 280 }),
    );

    await openaiTracked.generateText(TEST_MESSAGES);
    await anthropicTracked.generateText(TEST_MESSAGES);

    const totals = sharedTracker.getTotalTokens();
    expect(totals.promptTokens).toBe(300);
    expect(totals.completionTokens).toBe(130);
    expect(totals.totalTokens).toBe(430);
  });

  it('total cost equals the sum of both providers costs', async () => {
    openaiBase.generateText.mockResolvedValue(
      okResponse('GPT', { promptTokens: 1000, completionTokens: 500, totalTokens: 1500 }),
    );
    anthropicBase.generateText.mockResolvedValue(
      okResponse('Claude', { promptTokens: 1000, completionTokens: 500, totalTokens: 1500 }),
    );

    await openaiTracked.generateText(TEST_MESSAGES);
    await anthropicTracked.generateText(TEST_MESSAGES);

    const expectedOpenaiCost = ModelCatalog.estimateCost('gpt-4o', 1000, 500)!;
    const expectedAnthropicCost = ModelCatalog.estimateCost(
      'claude-3-5-sonnet-20241022',
      1000,
      500,
    )!;

    expect(sharedTracker.getTotalCost()).toBeCloseTo(
      expectedOpenaiCost + expectedAnthropicCost,
      10,
    );
  });
});

// ---------------------------------------------------------------------------
// 2. Mixed Text and Streaming Tracking
// ---------------------------------------------------------------------------

describe('Mixed Text and Streaming Tracking', () => {
  let base: ReturnType<typeof createMockProvider>;
  let tracker: TokenUsageTracker;
  let tracked: UsageTrackingProvider;

  beforeEach(() => {
    base = createMockProvider({ name: 'openai', modelId: 'gpt-4o' });
    const result = createUsageTrackingProvider(base);
    tracked = result.provider;
    tracker = result.tracker;
  });

  it('records both text and streaming requests', async () => {
    base.generateText.mockResolvedValue(
      okResponse('Text', { promptTokens: 10, completionTokens: 5, totalTokens: 15 }),
    );
    base.generateStream.mockResolvedValue(
      createMockStream([
        { content: 'Stream' },
        {
          content: '!',
          finishReason: 'stop',
          tokenUsage: { promptTokens: 20, completionTokens: 10, totalTokens: 30 },
        },
      ]),
    );

    await tracked.generateText(TEST_MESSAGES);
    const stream = await tracked.generateStream(TEST_MESSAGES);
    await stream.toResponse();

    expect(tracker.recordCount).toBe(2);
    expect(tracker.getTotalTokens().totalTokens).toBe(45);
  });

  it('records streaming usage via toResponse() exactly once', async () => {
    base.generateStream.mockResolvedValue(
      createMockStream([
        { content: 'Hello' },
        {
          content: ' world',
          finishReason: 'stop',
          tokenUsage: { promptTokens: 15, completionTokens: 8, totalTokens: 23 },
        },
      ]),
    );

    const stream = await tracked.generateStream(TEST_MESSAGES);
    await stream.toResponse();

    expect(tracker.recordCount).toBe(1);
    expect(tracker.getRecords()[0]!.streaming).toBe(true);
    expect(tracker.getRecords()[0]!.tokenUsage.totalTokens).toBe(23);
  });

  it('records streaming usage via iteration with tokenUsage in final chunk', async () => {
    const finalTokens: TokenUsage = { promptTokens: 12, completionTokens: 6, totalTokens: 18 };
    base.generateStream.mockResolvedValue(
      createMockStream([
        { content: 'A' },
        { content: 'B' },
        { content: 'C', finishReason: 'stop', tokenUsage: finalTokens },
      ]),
    );

    const stream = await tracked.generateStream(TEST_MESSAGES);
    const chunks: string[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk.content);
    }

    expect(chunks).toEqual(['A', 'B', 'C']);
    expect(tracker.recordCount).toBe(1);
    expect(tracker.getRecords()[0]!.tokenUsage).toEqual(finalTokens);
  });

  it('does not record usage when stream has no tokenUsage in any chunk', async () => {
    base.generateStream.mockResolvedValue(
      createMockStream([{ content: 'A' }, { content: 'B', finishReason: 'stop' }]),
    );

    const stream = await tracked.generateStream(TEST_MESSAGES);
    const chunks: string[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk.content);
    }

    expect(chunks).toEqual(['A', 'B']);
    expect(tracker.recordCount).toBe(0);
  });

  it('accumulates records correctly over multiple sequential requests', async () => {
    const tokens1: TokenUsage = { promptTokens: 10, completionTokens: 5, totalTokens: 15 };
    const tokens2: TokenUsage = { promptTokens: 20, completionTokens: 10, totalTokens: 30 };
    const tokens3: TokenUsage = { promptTokens: 30, completionTokens: 15, totalTokens: 45 };

    base.generateText
      .mockResolvedValueOnce(okResponse('A', tokens1))
      .mockResolvedValueOnce(okResponse('B', tokens2))
      .mockResolvedValueOnce(okResponse('C', tokens3));

    await tracked.generateText(TEST_MESSAGES);
    await tracked.generateText(TEST_MESSAGES);
    await tracked.generateText(TEST_MESSAGES);

    expect(tracker.recordCount).toBe(3);
    expect(tracker.getTotalTokens().promptTokens).toBe(60);
    expect(tracker.getTotalTokens().completionTokens).toBe(30);
    expect(tracker.getTotalTokens().totalTokens).toBe(90);
  });
});

// ---------------------------------------------------------------------------
// 3. Usage Tracking with Retry
// ---------------------------------------------------------------------------

describe('Usage Tracking with Retry', () => {
  it('records usage only for the successful response after retries', async () => {
    const base = createMockProvider({ name: 'openai', modelId: 'gpt-4o' });
    const { provider: tracked, tracker } = createUsageTrackingProvider(base);
    const retry = createRetryProvider(tracked, {
      maxRetries: 3,
      baseDelayMs: 1,
      jitter: 0,
    });

    base.generateText
      .mockRejectedValueOnce(new LLMRateLimitError('openai', 'rate limited'))
      .mockResolvedValueOnce(
        okResponse('Success', { promptTokens: 50, completionTokens: 25, totalTokens: 75 }),
      );

    const response = await retry.generateText(TEST_MESSAGES);

    expect(response.content).toBe('Success');
    expect(tracker.recordCount).toBe(1);
    expect(tracker.getTotalTokens().totalTokens).toBe(75);
  });

  it('does not record usage when all retries fail', async () => {
    const base = createMockProvider({ name: 'openai', modelId: 'gpt-4o' });
    const { provider: tracked, tracker } = createUsageTrackingProvider(base);
    const retry = createRetryProvider(tracked, {
      maxRetries: 2,
      baseDelayMs: 1,
      jitter: 0,
    });

    base.generateText.mockRejectedValue(new LLMRateLimitError('openai', 'rate limited'));

    await expect(retry.generateText(TEST_MESSAGES)).rejects.toThrow(LLMRateLimitError);
    expect(tracker.recordCount).toBe(0);
  });

  it('records a single usage entry for rate-limit then success scenario', async () => {
    const base = createMockProvider({ name: 'anthropic', modelId: 'claude-3-5-sonnet-20241022' });
    const { provider: tracked, tracker } = createUsageTrackingProvider(base);
    const retry = createRetryProvider(tracked, {
      maxRetries: 3,
      baseDelayMs: 1,
      jitter: 0,
    });

    base.generateText
      .mockRejectedValueOnce(new LLMRateLimitError('anthropic', 'rate limited'))
      .mockRejectedValueOnce(new LLMRateLimitError('anthropic', 'rate limited'))
      .mockResolvedValueOnce(
        okResponse('Done', { promptTokens: 80, completionTokens: 40, totalTokens: 120 }),
      );

    await retry.generateText(TEST_MESSAGES);

    expect(tracker.recordCount).toBe(1);
    expect(tracker.getRecords()[0]!.provider).toBe('anthropic');
    expect(retry.stats.retriedSuccesses).toBe(1);
    expect(retry.stats.totalRetryAttempts).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// 4. Cost Calculation Accuracy
// ---------------------------------------------------------------------------

describe('Cost Calculation Accuracy', () => {
  it('calculates correct cost for gpt-4o', async () => {
    const base = createMockProvider({ name: 'openai', modelId: 'gpt-4o' });
    const { provider, tracker } = createUsageTrackingProvider(base);

    base.generateText.mockResolvedValue(
      okResponse('Hi', { promptTokens: 1000, completionTokens: 500, totalTokens: 1500 }),
    );

    await provider.generateText(TEST_MESSAGES);

    const expectedCost = (1000 / 1000) * 0.0025 + (500 / 1000) * 0.01;
    expect(tracker.getRecords()[0]!.costUsd).toBeCloseTo(expectedCost, 10);
  });

  it('calculates correct cost for claude-3-5-sonnet-20241022', async () => {
    const base = createMockProvider({ name: 'anthropic', modelId: 'claude-3-5-sonnet-20241022' });
    const { provider, tracker } = createUsageTrackingProvider(base);

    base.generateText.mockResolvedValue(
      okResponse('Hi', { promptTokens: 1000, completionTokens: 500, totalTokens: 1500 }),
    );

    await provider.generateText(TEST_MESSAGES);

    const expectedCost = (1000 / 1000) * 0.003 + (500 / 1000) * 0.015;
    expect(tracker.getRecords()[0]!.costUsd).toBeCloseTo(expectedCost, 10);
  });

  it('returns undefined cost for unknown model ID', async () => {
    const base = createMockProvider({ name: 'custom', modelId: 'my-custom-model' });
    const { provider, tracker } = createUsageTrackingProvider(base);

    base.generateText.mockResolvedValue(
      okResponse('Hi', { promptTokens: 100, completionTokens: 50, totalTokens: 150 }),
    );

    await provider.generateText(TEST_MESSAGES);

    expect(tracker.getRecords()[0]!.costUsd).toBeUndefined();
  });

  it('returns zero or near-zero cost for zero tokens', async () => {
    const base = createMockProvider({ name: 'openai', modelId: 'gpt-4o' });
    const { provider, tracker } = createUsageTrackingProvider(base);

    base.generateText.mockResolvedValue(
      okResponse('', { promptTokens: 0, completionTokens: 0, totalTokens: 0 }),
    );

    await provider.generateText(TEST_MESSAGES);

    expect(tracker.getRecords()[0]!.costUsd).toBeCloseTo(0, 10);
  });

  it('handles large token counts with correct arithmetic', async () => {
    const base = createMockProvider({ name: 'openai', modelId: 'gpt-4o' });
    const { provider, tracker } = createUsageTrackingProvider(base);

    base.generateText.mockResolvedValue(
      okResponse('Long', { promptTokens: 128_000, completionTokens: 16_384, totalTokens: 144_384 }),
    );

    await provider.generateText(TEST_MESSAGES);

    const expectedCost = (128_000 / 1000) * 0.0025 + (16_384 / 1000) * 0.01;
    expect(tracker.getRecords()[0]!.costUsd).toBeCloseTo(expectedCost, 8);
  });

  it('returns undefined cost for Ollama models (no pricing)', () => {
    const cost = ModelCatalog.estimateCost('llama3.1:8b', 1000, 500);
    expect(cost).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 5. Registry Integration
// ---------------------------------------------------------------------------

describe('Registry Integration', () => {
  let registry: LLMProviderRegistry;

  beforeEach(() => {
    registry = new LLMProviderRegistry();
  });

  it('registers and creates providers from factories', () => {
    registry.register('mock-openai', (config) =>
      createMockProvider({ name: config.provider, modelId: config.modelId }),
    );

    const provider = registry.create({ provider: 'mock-openai', modelId: 'gpt-4o' });

    expect(provider.name).toBe('mock-openai');
  });

  it('overrides an existing registration', () => {
    registry.register('test', () => createMockProvider({ name: 'original', modelId: 'model-a' }));
    registry.override('test', () => createMockProvider({ name: 'overridden', modelId: 'model-b' }));

    const provider = registry.create({ provider: 'test', modelId: 'model-b' });

    expect(provider.name).toBe('overridden');
  });

  it('unregisters a provider and has() returns false', () => {
    registry.register('temp', () => createMockProvider({ name: 'temp', modelId: 'x' }));

    expect(registry.has('temp')).toBe(true);

    const removed = registry.unregister('temp');

    expect(removed).toBe(true);
    expect(registry.has('temp')).toBe(false);
  });

  it('createFromEnv reads environment variables', () => {
    const originalProvider = process.env['CREWSPACE_LLM_PROVIDER'];
    const originalModel = process.env['CREWSPACE_LLM_MODEL'];

    try {
      process.env['CREWSPACE_LLM_PROVIDER'] = 'env-mock';
      process.env['CREWSPACE_LLM_MODEL'] = 'env-model';

      registry.register('env-mock', (config) =>
        createMockProvider({ name: config.provider, modelId: config.modelId }),
      );

      const provider = registry.createFromEnv();

      expect(provider.name).toBe('env-mock');
    } finally {
      if (originalProvider !== undefined) {
        process.env['CREWSPACE_LLM_PROVIDER'] = originalProvider;
      } else {
        delete process.env['CREWSPACE_LLM_PROVIDER'];
      }
      if (originalModel !== undefined) {
        process.env['CREWSPACE_LLM_MODEL'] = originalModel;
      } else {
        delete process.env['CREWSPACE_LLM_MODEL'];
      }
    }
  });

  it('clear() removes all registrations', () => {
    registry.register('a', () => createMockProvider({ name: 'a', modelId: 'x' }));
    registry.register('b', () => createMockProvider({ name: 'b', modelId: 'y' }));

    expect(registry.listProviders()).toHaveLength(2);

    registry.clear();

    expect(registry.listProviders()).toHaveLength(0);
    expect(registry.has('a')).toBe(false);
    expect(registry.has('b')).toBe(false);
  });

  it('throws when creating an unregistered provider', () => {
    expect(() => registry.create({ provider: 'nonexistent', modelId: 'x' })).toThrow(
      LLMProviderError,
    );
  });
});

// ---------------------------------------------------------------------------
// 6. Report Generation
// ---------------------------------------------------------------------------

describe('Report Generation', () => {
  it('returns zero totals and undefined times for empty tracker', () => {
    const tracker = new TokenUsageTracker();
    const report = tracker.getReport();

    expect(report.totals.requests).toBe(0);
    expect(report.totals.promptTokens).toBe(0);
    expect(report.totals.completionTokens).toBe(0);
    expect(report.totals.totalTokens).toBe(0);
    expect(report.totals.totalCostUsd).toBe(0);
    expect(report.startTime).toBeUndefined();
    expect(report.endTime).toBeUndefined();
  });

  it('generates correct report for a single provider and request', async () => {
    const base = createMockProvider({ name: 'openai', modelId: 'gpt-4o' });
    const { provider, tracker } = createUsageTrackingProvider(base);

    base.generateText.mockResolvedValue(
      okResponse('Hi', { promptTokens: 100, completionTokens: 50, totalTokens: 150 }),
    );

    await provider.generateText(TEST_MESSAGES);

    const report = tracker.getReport();

    expect(report.totals.requests).toBe(1);
    expect(report.totals.totalTokens).toBe(150);
    expect(report.byProvider.size).toBe(1);
    expect(report.byModel.size).toBe(1);
    expect(report.startTime).toBeInstanceOf(Date);
    expect(report.endTime).toBeInstanceOf(Date);
  });

  it('generates correct report for multiple providers and requests', async () => {
    const sharedTracker = new TokenUsageTracker();
    const openaiBase = createMockProvider({ name: 'openai', modelId: 'gpt-4o' });
    const anthropicBase = createMockProvider({
      name: 'anthropic',
      modelId: 'claude-3-5-sonnet-20241022',
    });

    const openai = new UsageTrackingProvider(openaiBase, { tracker: sharedTracker });
    const anthropic = new UsageTrackingProvider(anthropicBase, { tracker: sharedTracker });

    openaiBase.generateText
      .mockResolvedValueOnce(
        okResponse('A', { promptTokens: 50, completionTokens: 20, totalTokens: 70 }),
      )
      .mockResolvedValueOnce(
        okResponse('B', { promptTokens: 60, completionTokens: 30, totalTokens: 90 }),
      );
    anthropicBase.generateText.mockResolvedValue(
      okResponse('C', { promptTokens: 100, completionTokens: 40, totalTokens: 140 }),
    );

    await openai.generateText(TEST_MESSAGES);
    await anthropic.generateText(TEST_MESSAGES);
    await openai.generateText(TEST_MESSAGES);

    const report = sharedTracker.getReport();

    expect(report.totals.requests).toBe(3);
    expect(report.totals.totalTokens).toBe(300);
    expect(report.byProvider.get('openai')!.requests).toBe(2);
    expect(report.byProvider.get('openai')!.totalTokens).toBe(160);
    expect(report.byProvider.get('anthropic')!.requests).toBe(1);
    expect(report.byProvider.get('anthropic')!.totalTokens).toBe(140);
    expect(report.byModel.get('gpt-4o')!.requests).toBe(2);
    expect(report.byModel.get('claude-3-5-sonnet-20241022')!.requests).toBe(1);
  });

  it('returns zero totals after reset()', async () => {
    const base = createMockProvider({ name: 'openai', modelId: 'gpt-4o' });
    const { provider, tracker } = createUsageTrackingProvider(base);

    base.generateText.mockResolvedValue(
      okResponse('Hi', { promptTokens: 100, completionTokens: 50, totalTokens: 150 }),
    );

    await provider.generateText(TEST_MESSAGES);

    expect(tracker.recordCount).toBe(1);

    tracker.reset();

    const report = tracker.getReport();

    expect(report.totals.requests).toBe(0);
    expect(report.totals.totalTokens).toBe(0);
    expect(tracker.recordCount).toBe(0);
    expect(report.startTime).toBeUndefined();
    expect(report.endTime).toBeUndefined();
  });

  it('startTime is less than or equal to endTime', async () => {
    const base = createMockProvider({ name: 'openai', modelId: 'gpt-4o' });
    const { provider, tracker } = createUsageTrackingProvider(base);

    base.generateText.mockResolvedValue(
      okResponse('A', { promptTokens: 10, completionTokens: 5, totalTokens: 15 }),
    );

    await provider.generateText(TEST_MESSAGES);
    await provider.generateText(TEST_MESSAGES);

    const report = tracker.getReport();

    expect(report.startTime).toBeDefined();
    expect(report.endTime).toBeDefined();
    expect(report.startTime!.getTime()).toBeLessThanOrEqual(report.endTime!.getTime());
  });
});

// ---------------------------------------------------------------------------
// 7. Stream Tracking Edge Cases
// ---------------------------------------------------------------------------

describe('Stream Tracking Edge Cases', () => {
  let base: ReturnType<typeof createMockProvider>;
  let tracker: TokenUsageTracker;
  let tracked: UsageTrackingProvider;

  beforeEach(() => {
    base = createMockProvider({ name: 'openai', modelId: 'gpt-4o' });
    const result = createUsageTrackingProvider(base);
    tracked = result.provider;
    tracker = result.tracker;
  });

  it('throws LLMStreamError when stream consumed twice via toResponse()', async () => {
    base.generateStream.mockResolvedValue(
      createMockStream([
        {
          content: 'Hello',
          finishReason: 'stop',
          tokenUsage: { promptTokens: 5, completionTokens: 3, totalTokens: 8 },
        },
      ]),
    );

    const stream = await tracked.generateStream(TEST_MESSAGES);
    await stream.toResponse();

    await expect(stream.toResponse()).rejects.toThrow(/already been consumed/);
  });

  it('tracks usage correctly when only the last chunk has tokenUsage', async () => {
    const tokens: TokenUsage = { promptTokens: 30, completionTokens: 15, totalTokens: 45 };
    base.generateStream.mockResolvedValue(
      createMockStream([
        { content: 'chunk1' },
        { content: 'chunk2' },
        { content: 'chunk3' },
        { content: 'chunk4', finishReason: 'stop', tokenUsage: tokens },
      ]),
    );

    const stream = await tracked.generateStream(TEST_MESSAGES);
    const response = await stream.toResponse();

    expect(response.content).toBe('chunk1chunk2chunk3chunk4');
    expect(tracker.recordCount).toBe(1);
    expect(tracker.getRecords()[0]!.tokenUsage).toEqual(tokens);
  });

  it('fires usage callback exactly once for toResponse()', async () => {
    const tokens: TokenUsage = { promptTokens: 10, completionTokens: 5, totalTokens: 15 };
    base.generateStream.mockResolvedValue(
      createMockStream([{ content: 'Hi', finishReason: 'stop', tokenUsage: tokens }]),
    );

    const stream = await tracked.generateStream(TEST_MESSAGES);
    await stream.toResponse();

    expect(tracker.recordCount).toBe(1);
  });

  it('fires usage callback exactly once for iteration', async () => {
    const tokens: TokenUsage = { promptTokens: 10, completionTokens: 5, totalTokens: 15 };
    base.generateStream.mockResolvedValue(
      createMockStream([
        { content: 'A' },
        { content: 'B', finishReason: 'stop', tokenUsage: tokens },
      ]),
    );

    const stream = await tracked.generateStream(TEST_MESSAGES);
    const collected: string[] = [];
    for await (const chunk of stream) {
      collected.push(chunk.content);
    }

    expect(collected).toEqual(['A', 'B']);
    expect(tracker.recordCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 8. Provider Name and Model ID Resolution
// ---------------------------------------------------------------------------

describe('Provider Name and Model ID Resolution', () => {
  it('uses explicit modelId when provided', () => {
    const base = createMockProvider({ name: 'openai', modelId: 'gpt-4o-mini' });
    const tracked = new UsageTrackingProvider(base, { modelId: 'custom-override' });

    expect(tracked.modelId).toBe('custom-override');
  });

  it('falls back to inner provider modelId when not specified', () => {
    const base = createMockProvider({ name: 'openai', modelId: 'gpt-4o' });
    const tracked = new UsageTrackingProvider(base);

    expect(tracked.modelId).toBe('gpt-4o');
  });

  it('uses "unknown" when inner provider has no modelId and none specified', () => {
    const noModelProvider: LLMProvider & { generateStream: ReturnType<typeof vi.fn> } = {
      name: 'custom',
      generateText: vi.fn(),
      generateStream: vi.fn(),
    };
    const tracked = new UsageTrackingProvider(noModelProvider);

    expect(tracked.modelId).toBe('unknown');
  });

  it('records use the inner provider name', async () => {
    const base = createMockProvider({ name: 'my-provider', modelId: 'my-model' });
    const { provider, tracker } = createUsageTrackingProvider(base);

    base.generateText.mockResolvedValue(
      okResponse('Hi', { promptTokens: 10, completionTokens: 5, totalTokens: 15 }),
    );

    await provider.generateText(TEST_MESSAGES);

    expect(tracker.getRecords()[0]!.provider).toBe('my-provider');
  });

  it('tracking provider name matches inner provider name', () => {
    const base = createMockProvider({ name: 'anthropic', modelId: 'claude-3-5-sonnet-20241022' });
    const tracked = new UsageTrackingProvider(base);

    expect(tracked.name).toBe('anthropic');
  });
});

// ---------------------------------------------------------------------------
// 9. Record Metadata
// ---------------------------------------------------------------------------

describe('Record Metadata', () => {
  it('record.streaming is false for text generation', async () => {
    const base = createMockProvider({ name: 'openai', modelId: 'gpt-4o' });
    const { provider, tracker } = createUsageTrackingProvider(base);

    base.generateText.mockResolvedValue(
      okResponse('Hi', { promptTokens: 10, completionTokens: 5, totalTokens: 15 }),
    );

    await provider.generateText(TEST_MESSAGES);

    expect(tracker.getRecords()[0]!.streaming).toBe(false);
  });

  it('record.streaming is true for streaming generation', async () => {
    const base = createMockProvider({ name: 'openai', modelId: 'gpt-4o' });
    const { provider, tracker } = createUsageTrackingProvider(base);

    base.generateStream.mockResolvedValue(
      createMockStream([
        {
          content: 'Hi',
          finishReason: 'stop',
          tokenUsage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        },
      ]),
    );

    const stream = await provider.generateStream(TEST_MESSAGES);
    await stream.toResponse();

    expect(tracker.getRecords()[0]!.streaming).toBe(true);
  });

  it('record.durationMs is a non-negative number', async () => {
    const base = createMockProvider({ name: 'openai', modelId: 'gpt-4o' });
    const { provider, tracker } = createUsageTrackingProvider(base);

    base.generateText.mockResolvedValue(
      okResponse('Hi', { promptTokens: 10, completionTokens: 5, totalTokens: 15 }),
    );

    await provider.generateText(TEST_MESSAGES);

    const record = tracker.getRecords()[0]!;
    expect(record.durationMs).toBeDefined();
    expect(typeof record.durationMs).toBe('number');
    expect(record.durationMs!).toBeGreaterThanOrEqual(0);
  });

  it('record.id is unique across multiple records', async () => {
    const base = createMockProvider({ name: 'openai', modelId: 'gpt-4o' });
    const { provider, tracker } = createUsageTrackingProvider(base);

    base.generateText.mockResolvedValue(
      okResponse('Hi', { promptTokens: 10, completionTokens: 5, totalTokens: 15 }),
    );

    await provider.generateText(TEST_MESSAGES);
    await provider.generateText(TEST_MESSAGES);
    await provider.generateText(TEST_MESSAGES);

    const ids = tracker.getRecords().map((r) => r.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(3);
  });

  it('record.timestamp is a Date instance', async () => {
    const base = createMockProvider({ name: 'openai', modelId: 'gpt-4o' });
    const { provider, tracker } = createUsageTrackingProvider(base);

    base.generateText.mockResolvedValue(
      okResponse('Hi', { promptTokens: 10, completionTokens: 5, totalTokens: 15 }),
    );

    await provider.generateText(TEST_MESSAGES);

    expect(tracker.getRecords()[0]!.timestamp).toBeInstanceOf(Date);
  });

  it('record.modelId reflects the configured model', async () => {
    const base = createMockProvider({ name: 'openai', modelId: 'gpt-4o-mini' });
    const { provider, tracker } = createUsageTrackingProvider(base);

    base.generateText.mockResolvedValue(
      okResponse('Hi', { promptTokens: 10, completionTokens: 5, totalTokens: 15 }),
    );

    await provider.generateText(TEST_MESSAGES);

    expect(tracker.getRecords()[0]!.modelId).toBe('gpt-4o-mini');
  });
});
