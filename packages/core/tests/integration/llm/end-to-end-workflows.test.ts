/**
 * End-to-end workflow integration tests for the LLM provider system.
 *
 * Tests complete lifecycle scenarios: registry → create → request → track → retry → report.
 * Uses mocked HTTP responses to simulate real API interactions without network calls.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  OpenAIProvider,
  createOpenAIProvider,
} from '../../../src/llm/providers/openai-provider.js';
import {
  AnthropicProvider,
  createAnthropicProvider,
} from '../../../src/llm/providers/anthropic-provider.js';
import { LLMProviderRegistry } from '../../../src/llm/provider-registry.js';
import {
  createUsageTrackingProvider,
  UsageTrackingProvider,
} from '../../../src/llm/usage-tracking-provider.js';
import { createRetryProvider, RetryLLMProvider } from '../../../src/llm/retry-provider.js';
import { TokenUsageTracker } from '../../../src/llm/usage-tracker.js';
import {
  LLMAuthenticationError,
  LLMProviderError,
  LLMRateLimitError,
} from '../../../src/errors/llm-errors.js';
import type {
  LLMMessage,
  LLMProviderConfig,
  LLMResponse,
  LLMStreamChunk,
} from '../../../src/types/llm.js';
import { LLMRole } from '../../../src/types/llm.js';

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const OPENAI_KEY = 'sk-test-openai-key';
const ANTHROPIC_KEY = 'sk-ant-test-anthropic-key';

const USER_MESSAGES: LLMMessage[] = [{ role: LLMRole.USER, content: 'Hello, world!' }];

const SYSTEM_USER_MESSAGES: LLMMessage[] = [
  { role: LLMRole.SYSTEM, content: 'You are a helpful assistant.' },
  { role: LLMRole.USER, content: 'Hello!' },
];

function openaiTextResponse(content: string, promptTokens = 10, completionTokens = 5): unknown {
  return {
    choices: [{ message: { content }, finish_reason: 'stop' }],
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
    },
  };
}

function anthropicTextResponse(content: string, inputTokens = 12, outputTokens = 8): unknown {
  return {
    content: [{ type: 'text', text: content }],
    stop_reason: 'end_turn',
    usage: { input_tokens: inputTokens, output_tokens: outputTokens },
  };
}

function makeJsonResponse(body: unknown, status = 200, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function makeOpenAIStreamResponse(chunks: string[]): Response {
  const lines: string[] = [];
  for (const chunk of chunks) {
    lines.push(
      `data: ${JSON.stringify({
        choices: [{ delta: { content: chunk }, finish_reason: null }],
      })}`,
    );
    lines.push('');
  }
  lines.push(
    `data: ${JSON.stringify({
      choices: [{ delta: { content: '' }, finish_reason: 'stop' }],
      usage: {
        prompt_tokens: 10,
        completion_tokens: chunks.length,
        total_tokens: 10 + chunks.length,
      },
    })}`,
  );
  lines.push('');
  lines.push('data: [DONE]');
  lines.push('');

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(lines.join('\n')));
      controller.close();
    },
  });
  return new Response(stream, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
}

let originalFetch: typeof globalThis.fetch;

beforeEach(() => {
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Registry → Provider creation → Text generation', () => {
  it('should create OpenAI provider from registry and generate text', async () => {
    const registry = new LLMProviderRegistry();
    registry.register('openai', createOpenAIProvider);

    const provider = registry.create({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    }) as OpenAIProvider;

    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse(openaiTextResponse('Registry works!')));

    const response = await provider.generateText(USER_MESSAGES);
    expect(response.content).toBe('Registry works!');
    expect(response.finishReason).toBe('stop');
    expect(response.tokenUsage.totalTokens).toBe(15);
  });

  it('should create Anthropic provider from registry and generate text', async () => {
    const registry = new LLMProviderRegistry();
    registry.register('anthropic', createAnthropicProvider);

    const provider = registry.create({
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20241022',
      apiKey: ANTHROPIC_KEY,
    }) as AnthropicProvider;

    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse(anthropicTextResponse('Claude from registry!')));

    const response = await provider.generateText(USER_MESSAGES);
    expect(response.content).toBe('Claude from registry!');
    expect(response.finishReason).toBe('stop');
    expect(response.tokenUsage.totalTokens).toBe(20);
  });

  it('should throw when creating from unregistered provider', () => {
    const registry = new LLMProviderRegistry();
    expect(() =>
      registry.create({ provider: 'unknown', modelId: 'model-x', apiKey: 'key' }),
    ).toThrow(LLMProviderError);
  });
});

describe('Full lifecycle: create → request → track usage → generate report', () => {
  it('should track OpenAI usage across multiple text requests', async () => {
    const openai = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });
    const { provider, tracker } = createUsageTrackingProvider(openai);

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse(openaiTextResponse('First', 10, 5)))
      .mockResolvedValueOnce(makeJsonResponse(openaiTextResponse('Second', 20, 15)))
      .mockResolvedValueOnce(makeJsonResponse(openaiTextResponse('Third', 8, 3)));

    globalThis.fetch = fetchMock;

    const r1 = await provider.generateText(USER_MESSAGES);
    const r2 = await provider.generateText(USER_MESSAGES);
    const r3 = await provider.generateText(USER_MESSAGES);

    expect(r1.content).toBe('First');
    expect(r2.content).toBe('Second');
    expect(r3.content).toBe('Third');

    const totals = tracker.getTotalTokens();
    expect(totals.promptTokens).toBe(38);
    expect(totals.completionTokens).toBe(23);
    expect(totals.totalTokens).toBe(61);

    const report = tracker.getReport();
    expect(report.totals.requests).toBe(3);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('should track Anthropic usage and produce per-provider report', async () => {
    const anthropic = new AnthropicProvider({
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20241022',
      apiKey: ANTHROPIC_KEY,
    });

    const tracker = new TokenUsageTracker();
    const { provider } = createUsageTrackingProvider(anthropic, { tracker });

    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse(anthropicTextResponse('Hello', 15, 10)))
      .mockResolvedValueOnce(makeJsonResponse(anthropicTextResponse('World', 20, 12)));

    await provider.generateText(USER_MESSAGES);
    await provider.generateText(SYSTEM_USER_MESSAGES);

    const report = tracker.getReport();
    expect(report.totals.requests).toBe(2);
    expect(report.totals.promptTokens).toBe(35);
    expect(report.totals.completionTokens).toBe(22);
  });

  it('should aggregate usage across OpenAI and Anthropic with shared tracker', async () => {
    const tracker = new TokenUsageTracker();

    const openai = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });
    const anthropic = new AnthropicProvider({
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20241022',
      apiKey: ANTHROPIC_KEY,
    });

    const { provider: openaiTracked } = createUsageTrackingProvider(openai, { tracker });
    const { provider: anthropicTracked } = createUsageTrackingProvider(anthropic, { tracker });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse(openaiTextResponse('OpenAI response', 10, 5)))
      .mockResolvedValueOnce(makeJsonResponse(anthropicTextResponse('Anthropic response', 12, 8)));

    globalThis.fetch = fetchMock;

    await openaiTracked.generateText(USER_MESSAGES);
    await anthropicTracked.generateText(USER_MESSAGES);

    const report = tracker.getReport();
    expect(report.totals.requests).toBe(2);
    expect(report.totals.totalTokens).toBe(35);
  });
});

describe('Full lifecycle with retry: create → fail → retry → succeed → track', () => {
  it('should retry on server error then succeed and track final usage', async () => {
    const openai = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });
    const tracker = new TokenUsageTracker();
    const { provider: tracked } = createUsageTrackingProvider(openai, { tracker });
    const retryProvider = createRetryProvider(tracked, {
      maxRetries: 3,
      baseDelayMs: 1,
      jitter: 0,
    });

    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse({ error: { message: 'Server error' } }, 500))
      .mockResolvedValueOnce(makeJsonResponse({ error: { message: 'Server error' } }, 502))
      .mockResolvedValueOnce(makeJsonResponse(openaiTextResponse('Recovery!', 10, 5)));

    const response = await retryProvider.generateText(USER_MESSAGES);
    expect(response.content).toBe('Recovery!');

    const stats = retryProvider.stats;
    expect(stats.totalRequests).toBe(1);
    expect(stats.totalRetryAttempts).toBe(2);
    expect(stats.retriedSuccesses).toBe(1);

    expect(tracker.getTotalTokens().totalTokens).toBe(15);
  });

  it('should fail after exhausting retries and NOT record usage', async () => {
    const openai = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });
    const tracker = new TokenUsageTracker();
    const { provider: tracked } = createUsageTrackingProvider(openai, { tracker });
    const retryProvider = createRetryProvider(tracked, {
      maxRetries: 2,
      baseDelayMs: 1,
      jitter: 0,
    });

    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(makeJsonResponse({ error: { message: 'Down' } }, 500));

    await expect(retryProvider.generateText(USER_MESSAGES)).rejects.toThrow(LLMProviderError);

    expect(retryProvider.stats.exhaustedFailures).toBe(1);
    expect(tracker.getTotalTokens().totalTokens).toBe(0);
  });

  it('should not retry authentication errors', async () => {
    const openai = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });
    const retryProvider = createRetryProvider(openai, {
      maxRetries: 3,
      baseDelayMs: 1,
      jitter: 0,
    });

    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse({ error: { message: 'Invalid API key' } }, 401));

    await expect(retryProvider.generateText(USER_MESSAGES)).rejects.toThrow(LLMAuthenticationError);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(retryProvider.stats.totalRetryAttempts).toBe(0);
  });
});

describe('Full lifecycle with streaming', () => {
  it('should stream OpenAI response and track usage via toResponse()', async () => {
    const openai = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });
    const { provider, tracker } = createUsageTrackingProvider(openai);

    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeOpenAIStreamResponse(['Hello', ' ', 'world', '!']));

    const stream = await provider.generateStream(USER_MESSAGES);
    const response = await stream.toResponse();

    expect(response.content).toBe('Hello world!');
    expect(response.finishReason).toBe('stop');
    expect(tracker.getTotalTokens().totalTokens).toBe(14);
  });

  it('should stream OpenAI response and track usage via async iteration', async () => {
    const openai = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });
    const { provider, tracker } = createUsageTrackingProvider(openai);

    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeOpenAIStreamResponse(['Chunk', '1', 'Chunk', '2']));

    const stream = await provider.generateStream(USER_MESSAGES);
    const chunks: LLMStreamChunk[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    expect(chunks.length).toBeGreaterThanOrEqual(4);
    const content = chunks.map((c) => c.content).join('');
    expect(content).toBe('Chunk1Chunk2');

    expect(tracker.getTotalTokens().totalTokens).toBe(14);
  });
});

describe('Circuit breaker recovery workflow', () => {
  it('should open circuit after failures, reject requests, then recover', async () => {
    const openai = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });

    const retryProvider = createRetryProvider(openai, {
      maxRetries: 0,
      circuitBreaker: { failureThreshold: 2, cooldownMs: 50 },
    });

    const serverError = makeJsonResponse({ error: { message: 'Down' } }, 500);
    globalThis.fetch = vi.fn().mockResolvedValue(serverError);

    // Two failures → circuit opens
    await expect(retryProvider.generateText(USER_MESSAGES)).rejects.toThrow();
    await expect(retryProvider.generateText(USER_MESSAGES)).rejects.toThrow();

    // Third request → circuit breaker rejects immediately
    await expect(retryProvider.generateText(USER_MESSAGES)).rejects.toThrow(/circuit breaker/i);
    expect(retryProvider.stats.circuitBreakerRejections).toBe(1);

    // Wait for cooldown
    await new Promise((resolve) => setTimeout(resolve, 60));

    // Circuit is now half-open → next request is a probe
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse(openaiTextResponse('Recovered!')));

    const response = await retryProvider.generateText(USER_MESSAGES);
    expect(response.content).toBe('Recovered!');
  });
});

describe('Multi-model workflow with registry', () => {
  it('should create different models from same provider via registry', async () => {
    const registry = new LLMProviderRegistry();
    registry.register('openai', createOpenAIProvider);

    const gpt4o = registry.create({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });
    const gpt4oMini = registry.create({
      provider: 'openai',
      modelId: 'gpt-4o-mini',
      apiKey: OPENAI_KEY,
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse(openaiTextResponse('GPT-4o says hi')))
      .mockResolvedValueOnce(makeJsonResponse(openaiTextResponse('Mini says hi')));

    globalThis.fetch = fetchMock;

    const r1 = await gpt4o.generateText(USER_MESSAGES);
    const r2 = await gpt4oMini.generateText(USER_MESSAGES);

    expect(r1.content).toBe('GPT-4o says hi');
    expect(r2.content).toBe('Mini says hi');

    // Verify different model IDs sent
    const firstCall = (fetchMock.mock.calls[0] as [string, RequestInit])[1];
    const secondCall = (fetchMock.mock.calls[1] as [string, RequestInit])[1];
    expect(JSON.parse(firstCall.body as string)).toHaveProperty('model', 'gpt-4o');
    expect(JSON.parse(secondCall.body as string)).toHaveProperty('model', 'gpt-4o-mini');
  });

  it('should track usage per model in shared tracker', async () => {
    const tracker = new TokenUsageTracker();
    const registry = new LLMProviderRegistry();
    registry.register('openai', createOpenAIProvider);

    const gpt4o = registry.create({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });
    const gpt4oMini = registry.create({
      provider: 'openai',
      modelId: 'gpt-4o-mini',
      apiKey: OPENAI_KEY,
    });

    const { provider: gpt4oTracked } = createUsageTrackingProvider(gpt4o, { tracker });
    const { provider: gpt4oMiniTracked } = createUsageTrackingProvider(gpt4oMini, {
      tracker,
    });

    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse(openaiTextResponse('response1', 100, 50)))
      .mockResolvedValueOnce(makeJsonResponse(openaiTextResponse('response2', 20, 10)));

    await gpt4oTracked.generateText(USER_MESSAGES);
    await gpt4oMiniTracked.generateText(USER_MESSAGES);

    const report = tracker.getReport();
    expect(report.totals.requests).toBe(2);
    expect(report.totals.totalTokens).toBe(180);
  });
});

describe('Decorator stacking: Retry(UsageTracking(Provider))', () => {
  it('should retry, track usage only on success, and accumulate stats', async () => {
    const openai = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });
    const tracker = new TokenUsageTracker();
    const { provider: tracked } = createUsageTrackingProvider(openai, { tracker });
    const retryProvider = createRetryProvider(tracked, {
      maxRetries: 3,
      baseDelayMs: 1,
      jitter: 0,
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse({ error: { message: 'Rate limited' } }, 429))
      .mockResolvedValueOnce(makeJsonResponse(openaiTextResponse('OK', 10, 5)));

    globalThis.fetch = fetchMock;

    const response = await retryProvider.generateText(USER_MESSAGES);
    expect(response.content).toBe('OK');

    expect(retryProvider.stats.retriedSuccesses).toBe(1);
    expect(retryProvider.stats.totalRetryAttempts).toBe(1);

    expect(tracker.getTotalTokens().totalTokens).toBe(15);
    expect(tracker.getReport().totals.requests).toBe(1);
  });
});

describe('Custom base URL', () => {
  it('should use custom base URL for OpenAI proxy', async () => {
    const provider = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
      baseUrl: 'https://my-proxy.example.com/v1',
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse(openaiTextResponse('Proxied!')));
    globalThis.fetch = fetchMock;

    await provider.generateText(USER_MESSAGES);

    const calledUrl = (fetchMock.mock.calls[0] as [string])[0];
    expect(calledUrl).toBe('https://my-proxy.example.com/v1/chat/completions');
  });

  it('should use custom base URL for Anthropic proxy', async () => {
    const provider = new AnthropicProvider({
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20241022',
      apiKey: ANTHROPIC_KEY,
      baseUrl: 'https://my-proxy.example.com',
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse(anthropicTextResponse('Proxied!')));
    globalThis.fetch = fetchMock;

    await provider.generateText(USER_MESSAGES);

    const calledUrl = (fetchMock.mock.calls[0] as [string])[0];
    expect(calledUrl).toBe('https://my-proxy.example.com/v1/messages');
  });
});

describe('Request options forwarding', () => {
  it('should forward temperature, maxTokens, and stopSequences to OpenAI', async () => {
    const provider = new OpenAIProvider({
      provider: 'openai',
      modelId: 'gpt-4o',
      apiKey: OPENAI_KEY,
    });

    const fetchMock = vi.fn().mockResolvedValueOnce(makeJsonResponse(openaiTextResponse('OK')));
    globalThis.fetch = fetchMock;

    await provider.generateText(USER_MESSAGES, {
      temperature: 0.3,
      maxTokens: 500,
      stopSequences: ['END', 'STOP'],
    });

    const body = JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body.temperature).toBe(0.3);
    expect(body.max_tokens).toBe(500);
    expect(body.stop).toEqual(['END', 'STOP']);
  });

  it('should forward temperature, maxTokens, and stopSequences to Anthropic', async () => {
    const provider = new AnthropicProvider({
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20241022',
      apiKey: ANTHROPIC_KEY,
    });

    const fetchMock = vi.fn().mockResolvedValueOnce(makeJsonResponse(anthropicTextResponse('OK')));
    globalThis.fetch = fetchMock;

    await provider.generateText(USER_MESSAGES, {
      temperature: 0.7,
      maxTokens: 1000,
      stopSequences: ['END'],
    });

    const body = JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body.temperature).toBe(0.7);
    expect(body.max_tokens).toBe(1000);
    expect(body.stop_sequences).toEqual(['END']);
  });
});
