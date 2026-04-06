import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  LLMAuthenticationError,
  LLMContextLengthError,
  LLMProviderError,
  LLMRateLimitError,
} from '../../../src/errors/llm-errors.js';
import {
  AnthropicProvider,
  createAnthropicProvider,
} from '../../../src/llm/providers/anthropic-provider.js';
import { LLMProviderRegistry } from '../../../src/llm/provider-registry.js';
import type { LLMProviderConfig, LLMStreamChunk } from '../../../src/types/llm.js';
import { LLMRole } from '../../../src/types/llm.js';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

const TEST_API_KEY = 'sk-ant-test-key-1234567890abcdef';
const TEST_MODEL = 'claude-3-5-sonnet-20241022';

function makeConfig(overrides?: Partial<LLMProviderConfig>): LLMProviderConfig {
  return {
    provider: 'anthropic',
    modelId: TEST_MODEL,
    apiKey: TEST_API_KEY,
    ...overrides,
  };
}

function makeMessagesResponse(
  content: string,
  stopReason: string | null = 'end_turn',
  usage = { input_tokens: 10, output_tokens: 5 },
) {
  return {
    id: 'msg_test123',
    type: 'message',
    role: 'assistant',
    content: [{ type: 'text', text: content }],
    model: TEST_MODEL,
    stop_reason: stopReason,
    usage,
  };
}

function makeSSEText(events: { event: string; data: Record<string, unknown> }[]): string {
  const lines: string[] = [];
  for (const ev of events) {
    lines.push(`event: ${ev.event}`);
    lines.push(`data: ${JSON.stringify(ev.data)}`);
    lines.push('');
  }
  return lines.join('\n') + '\n';
}

function makeStreamEvents(
  chunks: string[],
  options?: {
    inputTokens?: number;
    outputTokens?: number;
    stopReason?: string;
  },
): { event: string; data: Record<string, unknown> }[] {
  const inputTokens = options?.inputTokens ?? 10;
  const outputTokens = options?.outputTokens ?? 5;
  const stopReason = options?.stopReason ?? 'end_turn';

  const events: { event: string; data: Record<string, unknown> }[] = [
    {
      event: 'message_start',
      data: {
        type: 'message_start',
        message: {
          id: 'msg_test123',
          type: 'message',
          role: 'assistant',
          usage: { input_tokens: inputTokens, output_tokens: 0 },
        },
      },
    },
    {
      event: 'content_block_start',
      data: { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
    },
  ];

  for (const chunk of chunks) {
    events.push({
      event: 'content_block_delta',
      data: {
        type: 'content_block_delta',
        index: 0,
        delta: { type: 'text_delta', text: chunk },
      },
    });
  }

  events.push({
    event: 'content_block_stop',
    data: { type: 'content_block_stop', index: 0 },
  });

  events.push({
    event: 'message_delta',
    data: {
      type: 'message_delta',
      delta: { stop_reason: stopReason },
      usage: { output_tokens: outputTokens },
    },
  });

  events.push({
    event: 'message_stop',
    data: { type: 'message_stop' },
  });

  return events;
}

function makeStreamResponse(sseText: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(sseText));
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

function makeJsonResponse(body: unknown, status = 200, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AnthropicProvider', () => {
  let originalFetch: typeof globalThis.fetch;
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    originalEnv = process.env['ANTHROPIC_API_KEY'];
    delete process.env['ANTHROPIC_API_KEY'];
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalEnv !== undefined) {
      process.env['ANTHROPIC_API_KEY'] = originalEnv;
    } else {
      delete process.env['ANTHROPIC_API_KEY'];
    }
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Construction
  // -------------------------------------------------------------------------

  describe('constructor', () => {
    it('should create provider with valid config', () => {
      const provider = new AnthropicProvider(makeConfig());
      expect(provider.name).toBe('anthropic');
      expect(provider.modelId).toBe(TEST_MODEL);
    });

    it('should use default maxRetries and timeout', () => {
      const provider = new AnthropicProvider(makeConfig());
      expect(provider.maxRetries).toBe(3);
      expect(provider.timeout).toBe(30_000);
    });

    it('should accept custom maxRetries and timeout', () => {
      const provider = new AnthropicProvider(makeConfig({ maxRetries: 5, timeout: 60_000 }));
      expect(provider.maxRetries).toBe(5);
      expect(provider.timeout).toBe(60_000);
    });

    it('should throw LLMAuthenticationError when API key is missing', () => {
      expect(() => new AnthropicProvider({ provider: 'anthropic', modelId: TEST_MODEL })).toThrow(
        LLMAuthenticationError,
      );
    });

    it('should throw LLMAuthenticationError when API key is empty', () => {
      expect(() => new AnthropicProvider(makeConfig({ apiKey: '' }))).toThrow(
        LLMAuthenticationError,
      );
    });

    it('should throw LLMAuthenticationError when API key is whitespace', () => {
      expect(() => new AnthropicProvider(makeConfig({ apiKey: '   ' }))).toThrow(
        LLMAuthenticationError,
      );
    });

    it('should read API key from ANTHROPIC_API_KEY env var when not in config', () => {
      process.env['ANTHROPIC_API_KEY'] = 'sk-ant-env-key';
      const provider = new AnthropicProvider({ provider: 'anthropic', modelId: TEST_MODEL });
      expect(provider.name).toBe('anthropic');
    });

    it('should prefer config API key over env var', () => {
      process.env['ANTHROPIC_API_KEY'] = 'sk-ant-env-key';
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider(makeConfig({ apiKey: 'sk-ant-config-key' }));
      void provider.generateText([{ role: LLMRole.USER, content: 'test' }]);

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const headers = callArgs[1].headers as Record<string, string>;
      expect(headers['x-api-key']).toBe('sk-ant-config-key');
    });

    it('should use custom baseUrl when provided', () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider(
        makeConfig({ baseUrl: 'https://custom-api.example.com' }),
      );
      void provider.generateText([{ role: LLMRole.USER, content: 'test' }]);

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(callArgs[0]).toBe('https://custom-api.example.com/v1/messages');
    });

    it('should use default Anthropic base URL when none provided', () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider(makeConfig());
      void provider.generateText([{ role: LLMRole.USER, content: 'test' }]);

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(callArgs[0]).toBe('https://api.anthropic.com/v1/messages');
    });

    it('should set provider name to anthropic regardless of config.provider', () => {
      const provider = new AnthropicProvider(makeConfig({ provider: 'something-else' }));
      expect(provider.name).toBe('anthropic');
    });
  });

  // -------------------------------------------------------------------------
  // generateText
  // -------------------------------------------------------------------------

  describe('generateText', () => {
    it('should send correct request to Messages API', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(makeJsonResponse(makeMessagesResponse('Hello world')));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText([{ role: LLMRole.USER, content: 'Say hello' }]);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('https://api.anthropic.com/v1/messages');
      expect(init.method).toBe('POST');

      const headers = init.headers as Record<string, string>;
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['x-api-key']).toBe(TEST_API_KEY);
      expect(headers['anthropic-version']).toBe('2023-06-01');

      const body = JSON.parse(init.body as string) as Record<string, unknown>;
      expect(body['model']).toBe(TEST_MODEL);
      expect(body['messages']).toEqual([{ role: 'user', content: 'Say hello' }]);
      expect(body['stream']).toBeUndefined();
    });

    it('should extract system message to top-level system field', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('Hello')));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText([
        { role: LLMRole.SYSTEM, content: 'You are helpful.' },
        { role: LLMRole.USER, content: 'Say hello' },
      ]);

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;

      expect(body['system']).toBe('You are helpful.');
      expect(body['messages']).toEqual([{ role: 'user', content: 'Say hello' }]);
    });

    it('should concatenate multiple system messages', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText([
        { role: LLMRole.SYSTEM, content: 'You are helpful.' },
        { role: LLMRole.SYSTEM, content: 'Be concise.' },
        { role: LLMRole.USER, content: 'test' },
      ]);

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;

      expect(body['system']).toBe('You are helpful.\n\nBe concise.');
    });

    it('should not include system field when no system messages', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText([{ role: LLMRole.USER, content: 'test' }]);

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;

      expect(body['system']).toBeUndefined();
    });

    it('should return correct LLMResponse from API', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse(
          makeMessagesResponse('Hello!', 'end_turn', {
            input_tokens: 20,
            output_tokens: 3,
          }),
        ),
      );

      const provider = new AnthropicProvider(makeConfig());
      const result = await provider.generateText([{ role: LLMRole.USER, content: 'Hi' }]);

      expect(result.content).toBe('Hello!');
      expect(result.finishReason).toBe('stop');
      expect(result.tokenUsage).toEqual({
        promptTokens: 20,
        completionTokens: 3,
        totalTokens: 23,
      });
    });

    it('should map end_turn stop_reason to stop', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok', 'end_turn')));

      const provider = new AnthropicProvider(makeConfig());
      const result = await provider.generateText([{ role: LLMRole.USER, content: 'test' }]);
      expect(result.finishReason).toBe('stop');
    });

    it('should map max_tokens stop_reason to length', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok', 'max_tokens')));

      const provider = new AnthropicProvider(makeConfig());
      const result = await provider.generateText([{ role: LLMRole.USER, content: 'test' }]);
      expect(result.finishReason).toBe('length');
    });

    it('should map stop_sequence stop_reason correctly', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok', 'stop_sequence')));

      const provider = new AnthropicProvider(makeConfig());
      const result = await provider.generateText([{ role: LLMRole.USER, content: 'test' }]);
      expect(result.finishReason).toBe('stop_sequence');
    });

    it('should handle null stop_reason as unknown', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok', null)));

      const provider = new AnthropicProvider(makeConfig());
      const result = await provider.generateText([{ role: LLMRole.USER, content: 'test' }]);
      expect(result.finishReason).toBe('unknown');
    });

    it('should pass temperature option', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText([{ role: LLMRole.USER, content: 'test' }], {
        temperature: 0.7,
      });

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      expect(body['temperature']).toBe(0.7);
    });

    it('should pass maxTokens as max_tokens', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText([{ role: LLMRole.USER, content: 'test' }], { maxTokens: 256 });

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      expect(body['max_tokens']).toBe(256);
    });

    it('should use default max_tokens of 4096 when not specified', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText([{ role: LLMRole.USER, content: 'test' }]);

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      expect(body['max_tokens']).toBe(4096);
    });

    it('should pass stopSequences as stop_sequences', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText([{ role: LLMRole.USER, content: 'test' }], {
        stopSequences: ['END', '###'],
      });

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      expect(body['stop_sequences']).toEqual(['END', '###']);
    });

    it('should not include stop_sequences when stopSequences is empty', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText([{ role: LLMRole.USER, content: 'test' }], {
        stopSequences: [],
      });

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      expect(body['stop_sequences']).toBeUndefined();
    });

    it('should map user and assistant roles correctly', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText([
        { role: LLMRole.USER, content: 'user msg' },
        { role: LLMRole.ASSISTANT, content: 'assistant msg' },
        { role: LLMRole.USER, content: 'follow up' },
      ]);

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      const messages = body['messages'] as { role: string; content: string }[];

      expect(messages[0]).toEqual({ role: 'user', content: 'user msg' });
      expect(messages[1]).toEqual({ role: 'assistant', content: 'assistant msg' });
      expect(messages[2]).toEqual({ role: 'user', content: 'follow up' });
    });

    it('should map tool role to user', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText([
        { role: LLMRole.USER, content: 'call a tool' },
        { role: LLMRole.TOOL, content: 'tool result', name: 'myTool' },
      ]);

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      const messages = body['messages'] as { role: string; content: string }[];

      expect(messages[1]).toEqual({ role: 'user', content: 'tool result' });
    });

    it('should handle empty content array in response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse({
          content: [],
          stop_reason: 'end_turn',
          usage: { input_tokens: 5, output_tokens: 0 },
        }),
      );

      const provider = new AnthropicProvider(makeConfig());
      const result = await provider.generateText([{ role: LLMRole.USER, content: 'test' }]);
      expect(result.content).toBe('');
    });

    it('should handle response with missing usage gracefully', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse({
          content: [{ type: 'text', text: 'Hello' }],
          stop_reason: 'end_turn',
          usage: { input_tokens: 0, output_tokens: 0 },
        }),
      );

      const provider = new AnthropicProvider(makeConfig());
      const result = await provider.generateText([{ role: LLMRole.USER, content: 'test' }]);
      expect(result.content).toBe('Hello');
      expect(result.tokenUsage.totalTokens).toBe(0);
    });

    it('should merge default options with per-call options', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider(
        makeConfig({ defaultOptions: { temperature: 0.5, maxTokens: 100 } }),
      );
      await provider.generateText([{ role: LLMRole.USER, content: 'test' }], {
        temperature: 0.9,
      });

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      expect(body['temperature']).toBe(0.9);
      expect(body['max_tokens']).toBe(100);
    });

    it('should pass AbortSignal to fetch', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok')));
      globalThis.fetch = fetchMock;

      const controller = new AbortController();
      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText([{ role: LLMRole.USER, content: 'test' }], {
        signal: controller.signal,
      });

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(callArgs[1].signal).toBe(controller.signal);
    });

    it('should throw LLMProviderError on abort', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      globalThis.fetch = vi.fn().mockRejectedValue(abortError);

      const provider = new AnthropicProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow('aborted');
    });

    it('should throw LLMProviderError on network error', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

      const provider = new AnthropicProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow(LLMProviderError);
    });

    it('should validate messages are not empty', async () => {
      const provider = new AnthropicProvider(makeConfig());
      await expect(provider.generateText([])).rejects.toThrow('must not be empty');
    });

    it('should validate messages have user or system message', async () => {
      const provider = new AnthropicProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.ASSISTANT, content: 'only assistant' }]),
      ).rejects.toThrow('at least one USER or SYSTEM');
    });
  });

  // -------------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------------

  describe('error handling', () => {
    it('should throw LLMAuthenticationError on 401', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(
          makeJsonResponse(
            { error: { type: 'authentication_error', message: 'Invalid API key' } },
            401,
          ),
        );

      const provider = new AnthropicProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow(LLMAuthenticationError);
    });

    it('should throw LLMRateLimitError on 429', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse({ error: { type: 'rate_limit_error', message: 'Rate limited' } }, 429, {
          'retry-after': '30',
        }),
      );

      const provider = new AnthropicProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow(LLMRateLimitError);
    });

    it('should include retryAfterMs from retry-after header', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse({ error: { type: 'rate_limit_error', message: 'Rate limited' } }, 429, {
          'retry-after': '2.5',
        }),
      );

      const provider = new AnthropicProvider(makeConfig());
      try {
        await provider.generateText([{ role: LLMRole.USER, content: 'test' }]);
      } catch (error) {
        expect(error).toBeInstanceOf(LLMRateLimitError);
        expect((error as LLMRateLimitError).retryAfterMs).toBe(2500);
      }
    });

    it('should throw LLMContextLengthError on 400 with context length message', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse(
          {
            error: {
              type: 'invalid_request_error',
              message:
                'context length exceeded, maximum token limit is 200000, you requested 250000',
            },
          },
          400,
        ),
      );

      const provider = new AnthropicProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow(LLMContextLengthError);
    });

    it('should throw generic LLMProviderError on 400 without context length', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(
          makeJsonResponse(
            { error: { type: 'invalid_request_error', message: 'Invalid parameter' } },
            400,
          ),
        );

      const provider = new AnthropicProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow(LLMProviderError);
    });

    it('should throw on 403 access denied', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(
          makeJsonResponse({ error: { type: 'forbidden', message: 'Not allowed' } }, 403),
        );

      const provider = new AnthropicProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow('Access denied');
    });

    it('should throw on 404 model not found', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(
          makeJsonResponse({ error: { type: 'not_found_error', message: 'Model not found' } }, 404),
        );

      const provider = new AnthropicProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow('not found');
    });

    it('should throw on 500 server error', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(
          makeJsonResponse({ error: { type: 'api_error', message: 'Internal error' } }, 500),
        );

      const provider = new AnthropicProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow('server error');
    });

    it('should throw on 529 overloaded', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(
          makeJsonResponse(
            { error: { type: 'overloaded_error', message: 'API is overloaded' } },
            529,
          ),
        );

      const provider = new AnthropicProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow('overloaded');
    });

    it('should handle non-JSON error response body', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response('Internal Server Error', {
          status: 500,
          statusText: 'Internal Server Error',
        }),
      );

      const provider = new AnthropicProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow(LLMProviderError);
    });

    it('should handle unknown status code', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(makeJsonResponse({ error: { message: 'Something weird' } }, 418));

      const provider = new AnthropicProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow(LLMProviderError);
    });
  });

  // -------------------------------------------------------------------------
  // generateStream
  // -------------------------------------------------------------------------

  describe('generateStream', () => {
    it('should send correct streaming request', async () => {
      const events = makeStreamEvents(['Hello', ' world']);
      const sseText = makeSSEText(events);
      const fetchMock = vi.fn().mockResolvedValue(makeStreamResponse(sseText));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider(makeConfig());
      const stream = await provider.generateStream([{ role: LLMRole.USER, content: 'Say hello' }]);

      // Consume stream
      const chunks: LLMStreamChunk[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      expect(body['stream']).toBe(true);
      expect(body['model']).toBe(TEST_MODEL);
    });

    it('should yield content chunks from content_block_delta events', async () => {
      const events = makeStreamEvents(['Hello', ', ', 'world!']);
      const sseText = makeSSEText(events);
      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(sseText));

      const provider = new AnthropicProvider(makeConfig());
      const stream = await provider.generateStream([{ role: LLMRole.USER, content: 'test' }]);

      const chunks: LLMStreamChunk[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      // content_block_delta chunks + message_delta chunk
      expect(chunks.length).toBe(4);
      expect(chunks[0]!.content).toBe('Hello');
      expect(chunks[1]!.content).toBe(', ');
      expect(chunks[2]!.content).toBe('world!');
    });

    it('should include finish reason and token usage from message_delta', async () => {
      const events = makeStreamEvents(['Hi'], {
        inputTokens: 15,
        outputTokens: 3,
        stopReason: 'end_turn',
      });
      const sseText = makeSSEText(events);
      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(sseText));

      const provider = new AnthropicProvider(makeConfig());
      const stream = await provider.generateStream([{ role: LLMRole.USER, content: 'test' }]);

      const chunks: LLMStreamChunk[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const lastChunk = chunks[chunks.length - 1]!;
      expect(lastChunk.finishReason).toBe('stop');
      expect(lastChunk.tokenUsage).toEqual({
        promptTokens: 15,
        completionTokens: 3,
        totalTokens: 18,
      });
    });

    it('should collect stream into full response via toResponse()', async () => {
      const events = makeStreamEvents(['Hello', ' world'], {
        inputTokens: 10,
        outputTokens: 4,
      });
      const sseText = makeSSEText(events);
      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(sseText));

      const provider = new AnthropicProvider(makeConfig());
      const stream = await provider.generateStream([{ role: LLMRole.USER, content: 'test' }]);

      const response = await stream.toResponse();
      expect(response.content).toBe('Hello world');
      expect(response.finishReason).toBe('stop');
      expect(response.tokenUsage).toEqual({
        promptTokens: 10,
        completionTokens: 4,
        totalTokens: 14,
      });
    });

    it('should throw when streaming response has no body', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));

      const provider = new AnthropicProvider(makeConfig());
      const stream = await provider.generateStream([{ role: LLMRole.USER, content: 'test' }]);

      await expect(async () => {
        for await (const _chunk of stream) {
          // Should throw
        }
      }).rejects.toThrow('no body');
    });

    it('should be single-use (cannot iterate twice)', async () => {
      const events = makeStreamEvents(['ok']);
      const sseText = makeSSEText(events);
      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(sseText));

      const provider = new AnthropicProvider(makeConfig());
      const stream = await provider.generateStream([{ role: LLMRole.USER, content: 'test' }]);

      // First consumption
      for await (const _chunk of stream) {
        // consume
      }

      // Second consumption should throw
      expect(() => {
        const _iter = stream[Symbol.asyncIterator]();
      }).toThrow('already been consumed');
    });

    it('should extract system message for streaming request', async () => {
      const events = makeStreamEvents(['ok']);
      const sseText = makeSSEText(events);
      const fetchMock = vi.fn().mockResolvedValue(makeStreamResponse(sseText));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider(makeConfig());
      const stream = await provider.generateStream([
        { role: LLMRole.SYSTEM, content: 'Be helpful' },
        { role: LLMRole.USER, content: 'test' },
      ]);

      for await (const _chunk of stream) {
        // consume
      }

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      expect(body['system']).toBe('Be helpful');
      expect(body['messages']).toEqual([{ role: 'user', content: 'test' }]);
    });

    it('should handle stream with max_tokens stop reason', async () => {
      const events = makeStreamEvents(['truncated'], {
        stopReason: 'max_tokens',
        outputTokens: 100,
      });
      const sseText = makeSSEText(events);
      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(sseText));

      const provider = new AnthropicProvider(makeConfig());
      const stream = await provider.generateStream([
        { role: LLMRole.USER, content: 'write a long story' },
      ]);

      const response = await stream.toResponse();
      expect(response.finishReason).toBe('length');
    });

    it('should handle SSE with comment lines', async () => {
      const sseText =
        [
          ': this is a comment',
          'event: message_start',
          `data: ${JSON.stringify({ type: 'message_start', message: { usage: { input_tokens: 5, output_tokens: 0 } } })}`,
          '',
          'event: content_block_start',
          `data: ${JSON.stringify({ type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } })}`,
          '',
          ': another comment',
          'event: content_block_delta',
          `data: ${JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Hi' } })}`,
          '',
          'event: message_delta',
          `data: ${JSON.stringify({ type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 1 } })}`,
          '',
          'event: message_stop',
          `data: ${JSON.stringify({ type: 'message_stop' })}`,
          '',
        ].join('\n') + '\n';

      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(sseText));

      const provider = new AnthropicProvider(makeConfig());
      const stream = await provider.generateStream([{ role: LLMRole.USER, content: 'test' }]);

      const response = await stream.toResponse();
      expect(response.content).toBe('Hi');
    });

    it('should handle malformed JSON in SSE data gracefully', async () => {
      const sseText =
        [
          'event: message_start',
          `data: ${JSON.stringify({ type: 'message_start', message: { usage: { input_tokens: 5, output_tokens: 0 } } })}`,
          '',
          'event: content_block_delta',
          'data: {not valid json',
          '',
          'event: content_block_delta',
          `data: ${JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'OK' } })}`,
          '',
          'event: message_delta',
          `data: ${JSON.stringify({ type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 1 } })}`,
          '',
          'event: message_stop',
          `data: ${JSON.stringify({ type: 'message_stop' })}`,
          '',
        ].join('\n') + '\n';

      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(sseText));

      const provider = new AnthropicProvider(makeConfig());
      const stream = await provider.generateStream([{ role: LLMRole.USER, content: 'test' }]);

      const response = await stream.toResponse();
      expect(response.content).toBe('OK');
    });
  });

  // -------------------------------------------------------------------------
  // Registry integration
  // -------------------------------------------------------------------------

  describe('registry integration', () => {
    it('should work with LLMProviderRegistry', () => {
      const registry = new LLMProviderRegistry();
      registry.register('anthropic', createAnthropicProvider);

      const provider = registry.create({
        provider: 'anthropic',
        modelId: TEST_MODEL,
        apiKey: TEST_API_KEY,
      });

      expect(provider).toBeInstanceOf(AnthropicProvider);
      expect(provider.name).toBe('anthropic');
    });

    it('should create provider via factory function', () => {
      const provider = createAnthropicProvider(makeConfig());
      expect(provider).toBeInstanceOf(AnthropicProvider);
      expect(provider.name).toBe('anthropic');
      expect(provider.modelId).toBe(TEST_MODEL);
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  describe('edge cases', () => {
    it('should handle response with multiple content blocks (use first text)', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse({
          content: [
            { type: 'text', text: 'First block' },
            { type: 'text', text: 'Second block' },
          ],
          stop_reason: 'end_turn',
          usage: { input_tokens: 5, output_tokens: 5 },
        }),
      );

      const provider = new AnthropicProvider(makeConfig());
      const result = await provider.generateText([{ role: LLMRole.USER, content: 'test' }]);
      expect(result.content).toBe('First block');
    });

    it('should handle response with non-text content blocks', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse({
          content: [
            { type: 'tool_use', id: 'tool_123', name: 'calculator', input: { expression: '2+2' } },
          ],
          stop_reason: 'tool_use',
          usage: { input_tokens: 5, output_tokens: 10 },
        }),
      );

      const provider = new AnthropicProvider(makeConfig());
      const result = await provider.generateText([{ role: LLMRole.USER, content: 'test' }]);
      expect(result.content).toBe('');
    });

    it('should send anthropic-version header', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText([{ role: LLMRole.USER, content: 'test' }]);

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const headers = callArgs[1].headers as Record<string, string>;
      expect(headers['anthropic-version']).toBe('2023-06-01');
    });

    it('should use x-api-key header (not Authorization Bearer)', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText([{ role: LLMRole.USER, content: 'test' }]);

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const headers = callArgs[1].headers as Record<string, string>;
      expect(headers['x-api-key']).toBe(TEST_API_KEY);
      expect(headers['Authorization']).toBeUndefined();
    });

    it('should handle non-Error throw in fetch', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue('string error');

      const provider = new AnthropicProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow(LLMProviderError);
    });
  });
});
