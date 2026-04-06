import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AnthropicProvider,
  createAnthropicProvider,
} from '../../../src/llm/providers/anthropic-provider.js';
import {
  LLMAuthenticationError,
  LLMContextLengthError,
  LLMProviderError,
  LLMRateLimitError,
} from '../../../src/errors/llm-errors.js';
import type { LLMProviderConfig, LLMStreamChunk } from '../../../src/types/llm.js';
import { LLMRole } from '../../../src/types/llm.js';

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const TEST_API_KEY = 'sk-ant-test-key-1234567890abcdef';
const TEST_MODEL = 'claude-3-5-sonnet-20241022';

function makeConfig(overrides?: Partial<LLMProviderConfig>): LLMProviderConfig {
  return { provider: 'anthropic', modelId: TEST_MODEL, apiKey: TEST_API_KEY, ...overrides };
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
  options?: { inputTokens?: number; outputTokens?: number; stopReason?: string },
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

  events.push({ event: 'content_block_stop', data: { type: 'content_block_stop', index: 0 } });
  events.push({
    event: 'message_delta',
    data: {
      type: 'message_delta',
      delta: { stop_reason: stopReason },
      usage: { output_tokens: outputTokens },
    },
  });
  events.push({ event: 'message_stop', data: { type: 'message_stop' } });

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

function makeChunkedStreamResponse(sseText: string, chunkSize: number): Response {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(sseText);
  const stream = new ReadableStream({
    start(controller) {
      for (let i = 0; i < bytes.length; i += chunkSize) {
        controller.enqueue(bytes.slice(i, i + chunkSize));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

function makeAsyncChunkedStreamResponse(
  deliverChunks: (controller: ReadableStreamDefaultController) => Promise<void>,
): Response {
  const stream = new ReadableStream({
    async start(controller) {
      await deliverChunks(controller);
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

const SIMPLE_MESSAGES = [{ role: LLMRole.USER as const, content: 'Hello' }];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AnthropicProvider — integration (mocked HTTP)', () => {
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
  // 1. Anthropic-Specific System Message Handling
  // -------------------------------------------------------------------------

  describe('system message handling', () => {
    it('should join multiple system messages with \\n\\n separator', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText([
        { role: LLMRole.SYSTEM, content: 'You are a helpful assistant.' },
        { role: LLMRole.SYSTEM, content: 'Respond in English only.' },
        { role: LLMRole.SYSTEM, content: 'Be concise.' },
        { role: LLMRole.USER, content: 'Hi' },
      ]);

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;

      expect(body['system']).toBe(
        'You are a helpful assistant.\n\nRespond in English only.\n\nBe concise.',
      );
      expect(body['messages']).toEqual([{ role: 'user', content: 'Hi' }]);
    });

    it('should extract system messages while preserving user/assistant order', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText([
        { role: LLMRole.SYSTEM, content: 'System prompt' },
        { role: LLMRole.USER, content: 'First user message' },
        { role: LLMRole.ASSISTANT, content: 'First response' },
        { role: LLMRole.SYSTEM, content: 'Additional context' },
        { role: LLMRole.USER, content: 'Second user message' },
      ]);

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;

      expect(body['system']).toBe('System prompt\n\nAdditional context');
      const messages = body['messages'] as { role: string; content: string }[];
      expect(messages).toHaveLength(3);
      expect(messages[0]).toEqual({ role: 'user', content: 'First user message' });
      expect(messages[1]).toEqual({ role: 'assistant', content: 'First response' });
      expect(messages[2]).toEqual({ role: 'user', content: 'Second user message' });
    });

    it('should omit system field when no system messages are present', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText([
        { role: LLMRole.USER, content: 'Hello' },
        { role: LLMRole.ASSISTANT, content: 'Hi there' },
        { role: LLMRole.USER, content: 'How are you?' },
      ]);

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;

      expect(body).not.toHaveProperty('system');
    });

    it('should handle system-only messages by extracting system and leaving conversation', async () => {
      const provider = new AnthropicProvider(makeConfig());
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok')));
      globalThis.fetch = fetchMock;

      await provider.generateText([
        { role: LLMRole.SYSTEM, content: 'You are helpful.' },
        { role: LLMRole.USER, content: 'test' },
      ]);

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;

      expect(body['system']).toBe('You are helpful.');
      expect((body['messages'] as unknown[]).length).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Streaming SSE Edge Cases
  // -------------------------------------------------------------------------

  describe('streaming SSE edge cases', () => {
    it('should reassemble SSE data delivered in many small ReadableStream chunks', async () => {
      const events = makeStreamEvents(['Hello', ', ', 'world!'], {
        inputTokens: 8,
        outputTokens: 3,
      });
      const sseText = makeSSEText(events);
      globalThis.fetch = vi.fn().mockResolvedValue(makeChunkedStreamResponse(sseText, 12));

      const provider = new AnthropicProvider(makeConfig());
      const stream = await provider.generateStream(SIMPLE_MESSAGES);
      const response = await stream.toResponse();

      expect(response.content).toBe('Hello, world!');
      expect(response.finishReason).toBe('stop');
      expect(response.tokenUsage).toEqual({
        promptTokens: 8,
        completionTokens: 3,
        totalTokens: 11,
      });
    });

    it('should handle SSE event line split at arbitrary byte boundaries', async () => {
      const events = makeStreamEvents(['Split']);
      const sseText = makeSSEText(events);
      const encoder = new TextEncoder();
      const bytes = encoder.encode(sseText);
      const splitAt = Math.floor(bytes.length / 3);

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(bytes.slice(0, splitAt));
          controller.enqueue(bytes.slice(splitAt, splitAt * 2));
          controller.enqueue(bytes.slice(splitAt * 2));
          controller.close();
        },
      });
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(new Response(stream, { status: 200, headers: { 'Content-Type': 'text/event-stream' } }));

      const provider = new AnthropicProvider(makeConfig());
      const result = await provider.generateStream(SIMPLE_MESSAGES);
      const resp = await result.toResponse();

      expect(resp.content).toBe('Split');
    });

    it('should skip SSE comment lines (starting with :)', async () => {
      const sseText =
        [
          ': keepalive comment',
          'event: message_start',
          `data: ${JSON.stringify({ type: 'message_start', message: { usage: { input_tokens: 5, output_tokens: 0 } } })}`,
          '',
          ': another comment before content',
          'event: content_block_start',
          `data: ${JSON.stringify({ type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } })}`,
          '',
          'event: content_block_delta',
          `data: ${JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Works' } })}`,
          '',
          ': mid-stream comment',
          'event: content_block_stop',
          `data: ${JSON.stringify({ type: 'content_block_stop', index: 0 })}`,
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
      const stream = await provider.generateStream(SIMPLE_MESSAGES);
      const response = await stream.toResponse();

      expect(response.content).toBe('Works');
      expect(response.finishReason).toBe('stop');
    });

    it('should skip malformed JSON in SSE data and continue processing', async () => {
      const sseText =
        [
          'event: message_start',
          `data: ${JSON.stringify({ type: 'message_start', message: { usage: { input_tokens: 4, output_tokens: 0 } } })}`,
          '',
          'event: content_block_delta',
          'data: }{broken json!!!',
          '',
          'event: content_block_delta',
          `data: ${JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Survived' } })}`,
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
      const stream = await provider.generateStream(SIMPLE_MESSAGES);
      const response = await stream.toResponse();

      expect(response.content).toBe('Survived');
    });

    it('should throw LLMProviderError when streaming response has no body', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));

      const provider = new AnthropicProvider(makeConfig());
      const stream = await provider.generateStream(SIMPLE_MESSAGES);

      await expect(async () => {
        for await (const _chunk of stream) {
          // should throw
        }
      }).rejects.toThrow('no body');
    });

    it('should handle unicode and emoji content in streaming chunks', async () => {
      const events = makeStreamEvents(['こんにちは', ' 🚀🌍', ' café'], {
        inputTokens: 12,
        outputTokens: 8,
      });
      const sseText = makeSSEText(events);
      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(sseText));

      const provider = new AnthropicProvider(makeConfig());
      const stream = await provider.generateStream(SIMPLE_MESSAGES);
      const response = await stream.toResponse();

      expect(response.content).toBe('こんにちは 🚀🌍 café');
    });

    it('should accumulate input_tokens from message_start event', async () => {
      const events = makeStreamEvents(['text'], {
        inputTokens: 42,
        outputTokens: 7,
      });
      const sseText = makeSSEText(events);
      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(sseText));

      const provider = new AnthropicProvider(makeConfig());
      const stream = await provider.generateStream(SIMPLE_MESSAGES);

      const chunks: LLMStreamChunk[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const finalChunk = chunks[chunks.length - 1]!;
      expect(finalChunk.tokenUsage).toBeDefined();
      expect(finalChunk.tokenUsage!.promptTokens).toBe(42);
      expect(finalChunk.tokenUsage!.completionTokens).toBe(7);
      expect(finalChunk.tokenUsage!.totalTokens).toBe(49);
    });

    it('should report output_tokens from message_delta in final chunk', async () => {
      const events = makeStreamEvents(['a', 'b', 'c'], {
        inputTokens: 20,
        outputTokens: 30,
      });
      const sseText = makeSSEText(events);
      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(sseText));

      const provider = new AnthropicProvider(makeConfig());
      const stream = await provider.generateStream(SIMPLE_MESSAGES);

      const chunks: LLMStreamChunk[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const finalChunk = chunks[chunks.length - 1]!;
      expect(finalChunk.tokenUsage!.promptTokens).toBe(20);
      expect(finalChunk.tokenUsage!.completionTokens).toBe(30);
      expect(finalChunk.tokenUsage!.totalTokens).toBe(50);
    });

    it('should map end_turn stop reason in streaming to stop', async () => {
      const events = makeStreamEvents(['done'], { stopReason: 'end_turn' });
      const sseText = makeSSEText(events);
      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(sseText));

      const provider = new AnthropicProvider(makeConfig());
      const stream = await provider.generateStream(SIMPLE_MESSAGES);
      const response = await stream.toResponse();

      expect(response.finishReason).toBe('stop');
    });

    it('should map max_tokens stop reason in streaming to length', async () => {
      const events = makeStreamEvents(['truncated'], { stopReason: 'max_tokens' });
      const sseText = makeSSEText(events);
      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(sseText));

      const provider = new AnthropicProvider(makeConfig());
      const stream = await provider.generateStream(SIMPLE_MESSAGES);
      const response = await stream.toResponse();

      expect(response.finishReason).toBe('length');
    });

    it('should map stop_sequence stop reason in streaming correctly', async () => {
      const events = makeStreamEvents(['stopped'], { stopReason: 'stop_sequence' });
      const sseText = makeSSEText(events);
      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(sseText));

      const provider = new AnthropicProvider(makeConfig());
      const stream = await provider.generateStream(SIMPLE_MESSAGES);
      const response = await stream.toResponse();

      expect(response.finishReason).toBe('stop_sequence');
    });

    it('should handle chunked delivery with byte-level splits on multibyte chars', async () => {
      const events = makeStreamEvents(['Hello 🌍'], { inputTokens: 5, outputTokens: 3 });
      const sseText = makeSSEText(events);
      globalThis.fetch = vi.fn().mockResolvedValue(makeChunkedStreamResponse(sseText, 7));

      const provider = new AnthropicProvider(makeConfig());
      const stream = await provider.generateStream(SIMPLE_MESSAGES);
      const response = await stream.toResponse();

      expect(response.content).toBe('Hello 🌍');
    });

    it('should stop iteration on message_stop event', async () => {
      const sseText =
        [
          'event: message_start',
          `data: ${JSON.stringify({ type: 'message_start', message: { usage: { input_tokens: 5, output_tokens: 0 } } })}`,
          '',
          'event: content_block_delta',
          `data: ${JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Before stop' } })}`,
          '',
          'event: message_delta',
          `data: ${JSON.stringify({ type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 2 } })}`,
          '',
          'event: message_stop',
          `data: ${JSON.stringify({ type: 'message_stop' })}`,
          '',
          'event: content_block_delta',
          `data: ${JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'SHOULD NOT APPEAR' } })}`,
          '',
        ].join('\n') + '\n';

      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(sseText));

      const provider = new AnthropicProvider(makeConfig());
      const stream = await provider.generateStream(SIMPLE_MESSAGES);
      const response = await stream.toResponse();

      expect(response.content).toBe('Before stop');
      expect(response.content).not.toContain('SHOULD NOT APPEAR');
    });
  });

  // -------------------------------------------------------------------------
  // 3. Network Error Handling
  // -------------------------------------------------------------------------

  describe('network error handling', () => {
    it('should throw LLMProviderError when AbortSignal is pre-aborted', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      globalThis.fetch = vi.fn().mockRejectedValue(abortError);

      const controller = new AbortController();
      controller.abort();

      const provider = new AnthropicProvider(makeConfig());
      await expect(
        provider.generateText(SIMPLE_MESSAGES, { signal: controller.signal }),
      ).rejects.toThrow(LLMProviderError);
    });

    it('should include abort message in error when request is aborted', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      globalThis.fetch = vi.fn().mockRejectedValue(abortError);

      const provider = new AnthropicProvider(makeConfig());
      await expect(provider.generateText(SIMPLE_MESSAGES)).rejects.toThrow(/aborted/i);
    });

    it('should throw LLMProviderError on network failure (TypeError)', async () => {
      globalThis.fetch = vi
        .fn()
        .mockRejectedValue(new TypeError('Failed to fetch'));

      const provider = new AnthropicProvider(makeConfig());
      const error = await provider
        .generateText(SIMPLE_MESSAGES)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(LLMProviderError);
      expect((error as LLMProviderError).message).toContain('Network error');
      expect((error as LLMProviderError).message).toContain('Failed to fetch');
    });

    it('should throw LLMProviderError on DNS resolution failure', async () => {
      globalThis.fetch = vi
        .fn()
        .mockRejectedValue(new TypeError('getaddrinfo ENOTFOUND api.anthropic.com'));

      const provider = new AnthropicProvider(makeConfig());
      await expect(provider.generateText(SIMPLE_MESSAGES)).rejects.toThrow(LLMProviderError);
    });

    it('should wrap non-Error thrown values from fetch', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue('raw string error');

      const provider = new AnthropicProvider(makeConfig());
      await expect(provider.generateText(SIMPLE_MESSAGES)).rejects.toThrow(LLMProviderError);
    });
  });

  // -------------------------------------------------------------------------
  // 4. HTTP Error Edge Cases
  // -------------------------------------------------------------------------

  describe('HTTP error edge cases', () => {
    it('should handle malformed (non-JSON) error response body', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response('<html>502 Bad Gateway</html>', {
          status: 502,
          statusText: 'Bad Gateway',
        }),
      );

      const provider = new AnthropicProvider(makeConfig());
      await expect(provider.generateText(SIMPLE_MESSAGES)).rejects.toThrow(LLMProviderError);
    });

    it('should throw with overloaded message on status 529', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse(
          { error: { type: 'overloaded_error', message: 'API is temporarily overloaded' } },
          529,
        ),
      );

      const provider = new AnthropicProvider(makeConfig());
      const error = await provider
        .generateText(SIMPLE_MESSAGES)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(LLMProviderError);
      expect((error as LLMProviderError).statusCode).toBe(529);
      expect((error as LLMProviderError).message).toContain('overloaded');
    });

    it('should throw LLMProviderError with 403 status on forbidden', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse(
          { error: { type: 'forbidden', message: 'You do not have permission' } },
          403,
        ),
      );

      const provider = new AnthropicProvider(makeConfig());
      const error = await provider
        .generateText(SIMPLE_MESSAGES)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(LLMProviderError);
      expect((error as LLMProviderError).statusCode).toBe(403);
      expect((error as LLMProviderError).message).toContain('Access denied');
    });

    it('should throw LLMProviderError with 404 status on not found', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse(
          { error: { type: 'not_found_error', message: 'Model claude-9 not found' } },
          404,
        ),
      );

      const provider = new AnthropicProvider(makeConfig());
      const error = await provider
        .generateText(SIMPLE_MESSAGES)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(LLMProviderError);
      expect((error as LLMProviderError).statusCode).toBe(404);
      expect((error as LLMProviderError).message).toContain('not found');
    });

    it('should throw LLMProviderError for non-standard status codes', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse({ error: { message: 'I am a teapot' } }, 418),
      );

      const provider = new AnthropicProvider(makeConfig());
      const error = await provider
        .generateText(SIMPLE_MESSAGES)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(LLMProviderError);
      expect((error as LLMProviderError).statusCode).toBe(418);
    });

    it('should parse Retry-After header into retryAfterMs on rate limit', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse(
          { error: { type: 'rate_limit_error', message: 'Too many requests' } },
          429,
          { 'retry-after': '3.5' },
        ),
      );

      const provider = new AnthropicProvider(makeConfig());
      const error = await provider
        .generateText(SIMPLE_MESSAGES)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(LLMRateLimitError);
      expect((error as LLMRateLimitError).retryAfterMs).toBe(3500);
    });

    it('should handle rate limit without Retry-After header', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse(
          { error: { type: 'rate_limit_error', message: 'Rate limited' } },
          429,
        ),
      );

      const provider = new AnthropicProvider(makeConfig());
      const error = await provider
        .generateText(SIMPLE_MESSAGES)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(LLMRateLimitError);
      expect((error as LLMRateLimitError).retryAfterMs).toBeUndefined();
    });

    it('should throw LLMContextLengthError when message contains "token limit"', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse(
          {
            error: {
              type: 'invalid_request_error',
              message: 'Your request exceeded the token limit for this model',
            },
          },
          400,
        ),
      );

      const provider = new AnthropicProvider(makeConfig());
      await expect(provider.generateText(SIMPLE_MESSAGES)).rejects.toThrow(LLMContextLengthError);
    });

    it('should throw LLMContextLengthError when message contains "too many tokens"', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse(
          {
            error: {
              type: 'invalid_request_error',
              message: 'too many tokens: your messages had 300000 tokens',
            },
          },
          400,
        ),
      );

      const provider = new AnthropicProvider(makeConfig());
      await expect(provider.generateText(SIMPLE_MESSAGES)).rejects.toThrow(LLMContextLengthError);
    });

    it('should throw LLMAuthenticationError on 401', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse(
          { error: { type: 'authentication_error', message: 'Invalid API key provided' } },
          401,
        ),
      );

      const provider = new AnthropicProvider(makeConfig());
      await expect(provider.generateText(SIMPLE_MESSAGES)).rejects.toThrow(
        LLMAuthenticationError,
      );
    });

    it('should throw on server errors (500, 502, 503) with Anthropic server error message', async () => {
      for (const status of [500, 502, 503]) {
        globalThis.fetch = vi.fn().mockResolvedValue(
          makeJsonResponse(
            { error: { type: 'api_error', message: `Server error ${status}` } },
            status,
          ),
        );

        const provider = new AnthropicProvider(makeConfig());
        const error = await provider
          .generateText(SIMPLE_MESSAGES)
          .catch((e: unknown) => e);

        expect(error).toBeInstanceOf(LLMProviderError);
        expect((error as LLMProviderError).statusCode).toBe(status);
        expect((error as LLMProviderError).message).toContain('server error');
      }
    });

    it('should fallback to HTTP status text when error body is empty JSON', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse({}, 500),
      );

      const provider = new AnthropicProvider(makeConfig());
      const error = await provider
        .generateText(SIMPLE_MESSAGES)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(LLMProviderError);
      expect((error as LLMProviderError).message).toContain('HTTP 500');
    });
  });

  // -------------------------------------------------------------------------
  // 5. Request Building Verification
  // -------------------------------------------------------------------------

  describe('request building', () => {
    it('should default max_tokens to 4096 when not specified', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText(SIMPLE_MESSAGES);

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;

      expect(body['max_tokens']).toBe(4096);
    });

    it('should use provided maxTokens value as max_tokens', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText(SIMPLE_MESSAGES, { maxTokens: 1024 });

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;

      expect(body['max_tokens']).toBe(1024);
    });

    it('should forward temperature to the request body', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText(SIMPLE_MESSAGES, { temperature: 0.3 });

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;

      expect(body['temperature']).toBe(0.3);
    });

    it('should forward stopSequences as stop_sequences', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText(SIMPLE_MESSAGES, {
        stopSequences: ['STOP', '---', '\n\n'],
      });

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;

      expect(body['stop_sequences']).toEqual(['STOP', '---', '\n\n']);
    });

    it('should set stream: true for streaming requests', async () => {
      const events = makeStreamEvents(['ok']);
      const sseText = makeSSEText(events);
      const fetchMock = vi.fn().mockResolvedValue(makeStreamResponse(sseText));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider(makeConfig());
      const stream = await provider.generateStream(SIMPLE_MESSAGES);
      for await (const _chunk of stream) {
        // consume
      }

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;

      expect(body['stream']).toBe(true);
    });

    it('should not set stream field for non-streaming requests', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText(SIMPLE_MESSAGES);

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;

      expect(body['stream']).toBeUndefined();
    });

    it('should include anthropic-version header set to 2023-06-01', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText(SIMPLE_MESSAGES);

      const headers = (fetchMock.mock.calls[0] as [string, RequestInit])[1]
        .headers as Record<string, string>;

      expect(headers['anthropic-version']).toBe('2023-06-01');
    });

    it('should use custom baseUrl for API requests', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider(
        makeConfig({ baseUrl: 'https://my-proxy.example.com' }),
      );
      await provider.generateText(SIMPLE_MESSAGES);

      const url = (fetchMock.mock.calls[0] as [string, RequestInit])[0];
      expect(url).toBe('https://my-proxy.example.com/v1/messages');
    });

    it('should map TOOL role to user in request messages', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText([
        { role: LLMRole.USER, content: 'Use the calculator' },
        { role: LLMRole.TOOL, content: '{"result": 42}', name: 'calculator' },
      ]);

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      const messages = body['messages'] as { role: string; content: string }[];

      expect(messages[0]!.role).toBe('user');
      expect(messages[1]!.role).toBe('user');
      expect(messages[1]!.content).toBe('{"result": 42}');
    });

    it('should include model ID in request body', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider(
        makeConfig({ modelId: 'claude-3-haiku-20240307' }),
      );
      await provider.generateText(SIMPLE_MESSAGES);

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;

      expect(body['model']).toBe('claude-3-haiku-20240307');
    });
  });

  // -------------------------------------------------------------------------
  // 6. Response Parsing Edge Cases
  // -------------------------------------------------------------------------

  describe('response parsing edge cases', () => {
    it('should use first text content block when multiple are returned', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse({
          content: [
            { type: 'text', text: 'Primary answer' },
            { type: 'text', text: 'Secondary content' },
          ],
          stop_reason: 'end_turn',
          usage: { input_tokens: 10, output_tokens: 8 },
        }),
      );

      const provider = new AnthropicProvider(makeConfig());
      const result = await provider.generateText(SIMPLE_MESSAGES);

      expect(result.content).toBe('Primary answer');
    });

    it('should return empty string when no text content blocks exist', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse({
          content: [
            { type: 'tool_use', id: 'tool_1', name: 'search', input: { query: 'test' } },
          ],
          stop_reason: 'tool_use',
          usage: { input_tokens: 10, output_tokens: 5 },
        }),
      );

      const provider = new AnthropicProvider(makeConfig());
      const result = await provider.generateText(SIMPLE_MESSAGES);

      expect(result.content).toBe('');
    });

    it('should return empty string when content array is empty', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse({
          content: [],
          stop_reason: 'end_turn',
          usage: { input_tokens: 5, output_tokens: 0 },
        }),
      );

      const provider = new AnthropicProvider(makeConfig());
      const result = await provider.generateText(SIMPLE_MESSAGES);

      expect(result.content).toBe('');
    });

    it('should map null stop_reason to unknown', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(makeJsonResponse(makeMessagesResponse('done', null)));

      const provider = new AnthropicProvider(makeConfig());
      const result = await provider.generateText(SIMPLE_MESSAGES);

      expect(result.finishReason).toBe('unknown');
    });

    it('should pass through unrecognized stop_reason values as-is', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(makeJsonResponse(makeMessagesResponse('done', 'tool_use')));

      const provider = new AnthropicProvider(makeConfig());
      const result = await provider.generateText(SIMPLE_MESSAGES);

      expect(result.finishReason).toBe('tool_use');
    });

    it('should correctly calculate totalTokens as sum of input and output', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse(
          makeMessagesResponse('result', 'end_turn', {
            input_tokens: 150,
            output_tokens: 75,
          }),
        ),
      );

      const provider = new AnthropicProvider(makeConfig());
      const result = await provider.generateText(SIMPLE_MESSAGES);

      expect(result.tokenUsage.promptTokens).toBe(150);
      expect(result.tokenUsage.completionTokens).toBe(75);
      expect(result.tokenUsage.totalTokens).toBe(225);
    });
  });

  // -------------------------------------------------------------------------
  // 7. Chunked Stream Delivery
  // -------------------------------------------------------------------------

  describe('chunked stream delivery', () => {
    it('should reassemble a stream delivered one byte at a time', async () => {
      const events = makeStreamEvents(['Byte'], { inputTokens: 3, outputTokens: 1 });
      const sseText = makeSSEText(events);
      globalThis.fetch = vi.fn().mockResolvedValue(makeChunkedStreamResponse(sseText, 1));

      const provider = new AnthropicProvider(makeConfig());
      const stream = await provider.generateStream(SIMPLE_MESSAGES);
      const response = await stream.toResponse();

      expect(response.content).toBe('Byte');
      expect(response.finishReason).toBe('stop');
    });

    it('should handle multiple content chunks delivered via async ReadableStream', async () => {
      const encoder = new TextEncoder();
      const events = makeStreamEvents(['async', ' chunk', ' delivery'], {
        inputTokens: 6,
        outputTokens: 3,
      });
      const sseText = makeSSEText(events);

      const lines = sseText.split('\n');
      const mid = Math.floor(lines.length / 2);
      const part1 = lines.slice(0, mid).join('\n') + '\n';
      const part2 = lines.slice(mid).join('\n');

      const resp = makeAsyncChunkedStreamResponse(async (controller) => {
        controller.enqueue(encoder.encode(part1));
        await new Promise((r) => setTimeout(r, 5));
        controller.enqueue(encoder.encode(part2));
      });
      globalThis.fetch = vi.fn().mockResolvedValue(resp);

      const provider = new AnthropicProvider(makeConfig());
      const stream = await provider.generateStream(SIMPLE_MESSAGES);
      const response = await stream.toResponse();

      expect(response.content).toBe('async chunk delivery');
    });

    it('should handle stream where event and data lines span different ReadableStream chunks', async () => {
      const encoder = new TextEncoder();
      const eventLine = 'event: content_block_delta\n';
      const dataLine = `data: ${JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Spanning' } })}\n\n`;

      const sseText =
        `event: message_start\ndata: ${JSON.stringify({ type: 'message_start', message: { usage: { input_tokens: 5, output_tokens: 0 } } })}\n\n` +
        eventLine +
        dataLine +
        `event: message_delta\ndata: ${JSON.stringify({ type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 1 } })}\n\n` +
        `event: message_stop\ndata: ${JSON.stringify({ type: 'message_stop' })}\n\n`;

      const bytes = encoder.encode(sseText);
      const splitPoints = [
        Math.floor(bytes.length * 0.15),
        Math.floor(bytes.length * 0.45),
        Math.floor(bytes.length * 0.75),
      ];

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(bytes.slice(0, splitPoints[0]!));
          controller.enqueue(bytes.slice(splitPoints[0]!, splitPoints[1]!));
          controller.enqueue(bytes.slice(splitPoints[1]!, splitPoints[2]!));
          controller.enqueue(bytes.slice(splitPoints[2]!));
          controller.close();
        },
      });

      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(stream, { status: 200, headers: { 'Content-Type': 'text/event-stream' } }),
      );

      const provider = new AnthropicProvider(makeConfig());
      const result = await provider.generateStream(SIMPLE_MESSAGES);
      const response = await result.toResponse();

      expect(response.content).toBe('Spanning');
    });
  });

  // -------------------------------------------------------------------------
  // 8. Factory and Provider Identity
  // -------------------------------------------------------------------------

  describe('factory and provider identity', () => {
    it('should create provider via createAnthropicProvider factory', () => {
      const provider = createAnthropicProvider(makeConfig());
      expect(provider).toBeInstanceOf(AnthropicProvider);
      expect(provider.name).toBe('anthropic');
      expect(provider.modelId).toBe(TEST_MODEL);
    });

    it('should use x-api-key header instead of Authorization Bearer', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText(SIMPLE_MESSAGES);

      const headers = (fetchMock.mock.calls[0] as [string, RequestInit])[1]
        .headers as Record<string, string>;

      expect(headers['x-api-key']).toBe(TEST_API_KEY);
      expect(headers['Authorization']).toBeUndefined();
    });

    it('should read API key from ANTHROPIC_API_KEY env var when config omits it', async () => {
      process.env['ANTHROPIC_API_KEY'] = 'sk-ant-from-env';
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new AnthropicProvider({ provider: 'anthropic', modelId: TEST_MODEL });
      await provider.generateText(SIMPLE_MESSAGES);

      const headers = (fetchMock.mock.calls[0] as [string, RequestInit])[1]
        .headers as Record<string, string>;

      expect(headers['x-api-key']).toBe('sk-ant-from-env');
    });
  });
});
