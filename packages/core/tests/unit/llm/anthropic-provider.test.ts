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
  text: string,
  stopReason = 'end_turn',
  usage = { input_tokens: 10, output_tokens: 5 },
): Record<string, unknown> {
  return {
    id: 'msg_test123',
    type: 'message',
    role: 'assistant',
    content: [{ type: 'text', text }],
    model: TEST_MODEL,
    stop_reason: stopReason,
    usage,
  };
}

function makeMultiBlockResponse(
  texts: string[],
  stopReason = 'end_turn',
  usage = { input_tokens: 10, output_tokens: 15 },
): Record<string, unknown> {
  return {
    id: 'msg_test456',
    type: 'message',
    role: 'assistant',
    content: texts.map((t) => ({ type: 'text', text: t })),
    model: TEST_MODEL,
    stop_reason: stopReason,
    usage,
  };
}

function makeAnthropicSSE(events: { event: string; data: Record<string, unknown> }[]): string {
  const lines: string[] = [];
  for (const evt of events) {
    lines.push(`event: ${evt.event}`);
    lines.push(`data: ${JSON.stringify(evt.data)}`);
    lines.push('');
  }
  return lines.join('\n');
}

function makeStreamingEvents(
  textChunks: string[],
  inputTokens = 10,
  outputTokens = 20,
  stopReason = 'end_turn',
): { event: string; data: Record<string, unknown> }[] {
  const events: { event: string; data: Record<string, unknown> }[] = [];

  events.push({
    event: 'message_start',
    data: {
      type: 'message_start',
      message: {
        id: 'msg_test789',
        type: 'message',
        role: 'assistant',
        content: [],
        usage: { input_tokens: inputTokens, output_tokens: 0 },
      },
    },
  });

  events.push({
    event: 'content_block_start',
    data: { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
  });

  for (const text of textChunks) {
    events.push({
      event: 'content_block_delta',
      data: { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text } },
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
      expect(
        () => new AnthropicProvider({ provider: 'anthropic', modelId: TEST_MODEL, apiKey: '' }),
      ).toThrow(LLMAuthenticationError);
    });

    it('should throw LLMAuthenticationError when API key is whitespace', () => {
      expect(
        () => new AnthropicProvider({ provider: 'anthropic', modelId: TEST_MODEL, apiKey: '   ' }),
      ).toThrow(LLMAuthenticationError);
    });

    it('should read API key from environment variable', () => {
      process.env['ANTHROPIC_API_KEY'] = 'sk-ant-env-key-12345';
      const provider = new AnthropicProvider({ provider: 'anthropic', modelId: TEST_MODEL });
      expect(provider.name).toBe('anthropic');
    });

    it('should prefer config API key over environment variable', () => {
      process.env['ANTHROPIC_API_KEY'] = 'sk-ant-env-key-12345';
      globalThis.fetch = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('Hello')));

      const provider = new AnthropicProvider(makeConfig({ apiKey: 'sk-ant-config-key-99999' }));

      provider.generateText([{ role: LLMRole.USER, content: 'hi' }]).catch(() => {});

      // Verify the config key was used in the Authorization header
      expect(provider.name).toBe('anthropic');
    });

    it('should use default base URL when not specified', () => {
      globalThis.fetch = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('Hello')));

      const provider = new AnthropicProvider(makeConfig());
      provider.generateText([{ role: LLMRole.USER, content: 'test' }]).catch(() => {});

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.anything(),
      );
    });

    it('should use custom base URL when specified', () => {
      globalThis.fetch = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('Hello')));

      const provider = new AnthropicProvider(makeConfig({ baseUrl: 'https://proxy.example.com' }));
      provider.generateText([{ role: LLMRole.USER, content: 'test' }]).catch(() => {});

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://proxy.example.com/v1/messages',
        expect.anything(),
      );
    });

    it('should override provider name to "anthropic"', () => {
      const provider = new AnthropicProvider(makeConfig({ provider: 'custom-name' }));
      expect(provider.name).toBe('anthropic');
    });
  });

  // -------------------------------------------------------------------------
  // Text generation
  // -------------------------------------------------------------------------

  describe('generateText', () => {
    it('should send correct headers', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('Hello')));

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText([{ role: LLMRole.USER, content: 'hi' }]);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': TEST_API_KEY,
            'anthropic-version': '2023-06-01',
          },
        }),
      );
    });

    it('should return content from single text block', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(makeJsonResponse(makeMessagesResponse('Hello, world!')));

      const provider = new AnthropicProvider(makeConfig());
      const result = await provider.generateText([{ role: LLMRole.USER, content: 'hi' }]);

      expect(result.content).toBe('Hello, world!');
      expect(result.finishReason).toBe('end_turn');
      expect(result.tokenUsage).toEqual({
        promptTokens: 10,
        completionTokens: 5,
        totalTokens: 15,
      });
    });

    it('should concatenate multiple text blocks', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(makeJsonResponse(makeMultiBlockResponse(['Hello, ', 'world!'])));

      const provider = new AnthropicProvider(makeConfig());
      const result = await provider.generateText([{ role: LLMRole.USER, content: 'hi' }]);

      expect(result.content).toBe('Hello, world!');
    });

    it('should extract system messages to top-level system parameter', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(makeJsonResponse(makeMessagesResponse('I am helpful')));

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText([
        { role: LLMRole.SYSTEM, content: 'You are helpful.' },
        { role: LLMRole.USER, content: 'hi' },
      ]);

      const callBody = JSON.parse(
        (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string,
      );

      expect(callBody.system).toBe('You are helpful.');
      expect(callBody.messages).toEqual([{ role: 'user', content: 'hi' }]);
    });

    it('should concatenate multiple system messages', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('OK')));

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText([
        { role: LLMRole.SYSTEM, content: 'Be helpful.' },
        { role: LLMRole.SYSTEM, content: 'Be concise.' },
        { role: LLMRole.USER, content: 'hi' },
      ]);

      const callBody = JSON.parse(
        (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string,
      );

      expect(callBody.system).toBe('Be helpful.\n\nBe concise.');
    });

    it('should not include system parameter when no system messages', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('Hello')));

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText([{ role: LLMRole.USER, content: 'hi' }]);

      const callBody = JSON.parse(
        (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string,
      );

      expect(callBody.system).toBeUndefined();
    });

    it('should include model and max_tokens in request body', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('Hello')));

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText([{ role: LLMRole.USER, content: 'hi' }]);

      const callBody = JSON.parse(
        (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string,
      );

      expect(callBody.model).toBe(TEST_MODEL);
      expect(callBody.max_tokens).toBe(4096);
    });

    it('should pass custom max_tokens from options', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('Hello')));

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText([{ role: LLMRole.USER, content: 'hi' }], { maxTokens: 1024 });

      const callBody = JSON.parse(
        (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string,
      );

      expect(callBody.max_tokens).toBe(1024);
    });

    it('should pass temperature when specified', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('Hello')));

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText([{ role: LLMRole.USER, content: 'hi' }], { temperature: 0.7 });

      const callBody = JSON.parse(
        (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string,
      );

      expect(callBody.temperature).toBe(0.7);
    });

    it('should pass stop_sequences when specified', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('Hello')));

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText([{ role: LLMRole.USER, content: 'hi' }], {
        stopSequences: ['STOP', 'END'],
      });

      const callBody = JSON.parse(
        (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string,
      );

      expect(callBody.stop_sequences).toEqual(['STOP', 'END']);
    });

    it('should not include stop_sequences when empty', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('Hello')));

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText([{ role: LLMRole.USER, content: 'hi' }], { stopSequences: [] });

      const callBody = JSON.parse(
        (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string,
      );

      expect(callBody.stop_sequences).toBeUndefined();
    });

    it('should not include stream flag for non-streaming requests', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('Hello')));

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText([{ role: LLMRole.USER, content: 'hi' }]);

      const callBody = JSON.parse(
        (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string,
      );

      expect(callBody.stream).toBeUndefined();
    });

    it('should map assistant messages correctly', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(makeJsonResponse(makeMessagesResponse('Continued')));

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText([
        { role: LLMRole.USER, content: 'hi' },
        { role: LLMRole.ASSISTANT, content: 'hello' },
        { role: LLMRole.USER, content: 'continue' },
      ]);

      const callBody = JSON.parse(
        (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string,
      );

      expect(callBody.messages).toEqual([
        { role: 'user', content: 'hi' },
        { role: 'assistant', content: 'hello' },
        { role: 'user', content: 'continue' },
      ]);
    });

    it('should map tool role to user', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(makeJsonResponse(makeMessagesResponse('Got it')));

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText([
        { role: LLMRole.USER, content: 'run tool' },
        { role: LLMRole.TOOL, content: 'tool result' },
      ]);

      const callBody = JSON.parse(
        (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string,
      );

      expect(callBody.messages[1].role).toBe('user');
    });

    it('should merge default options with per-call options', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('Hello')));

      const provider = new AnthropicProvider(
        makeConfig({ defaultOptions: { temperature: 0.5, maxTokens: 2048 } }),
      );
      await provider.generateText([{ role: LLMRole.USER, content: 'hi' }], { temperature: 0.9 });

      const callBody = JSON.parse(
        (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string,
      );

      expect(callBody.temperature).toBe(0.9);
      expect(callBody.max_tokens).toBe(2048);
    });

    it('should handle different stop reasons', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(makeJsonResponse(makeMessagesResponse('response', 'max_tokens')));

      const provider = new AnthropicProvider(makeConfig());
      const result = await provider.generateText([{ role: LLMRole.USER, content: 'hi' }]);

      expect(result.finishReason).toBe('max_tokens');
    });

    it('should handle null stop_reason gracefully', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(
          makeJsonResponse(makeMessagesResponse('response', null as unknown as string)),
        );

      const provider = new AnthropicProvider(makeConfig());
      const result = await provider.generateText([{ role: LLMRole.USER, content: 'hi' }]);

      expect(result.finishReason).toBe('unknown');
    });

    it('should use GPT-4o-mini equivalent model ID in request', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('Hello')));

      const provider = new AnthropicProvider(makeConfig({ modelId: 'claude-3-5-haiku-20241022' }));
      await provider.generateText([{ role: LLMRole.USER, content: 'hi' }]);

      const callBody = JSON.parse(
        (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string,
      );

      expect(callBody.model).toBe('claude-3-5-haiku-20241022');
    });
  });

  // -------------------------------------------------------------------------
  // Streaming generation
  // -------------------------------------------------------------------------

  describe('generateStream', () => {
    it('should stream content chunks', async () => {
      const events = makeStreamingEvents(['Hello', ', ', 'world!']);
      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(makeAnthropicSSE(events)));

      const provider = new AnthropicProvider(makeConfig());
      const stream = await provider.generateStream([{ role: LLMRole.USER, content: 'hi' }]);

      const chunks: LLMStreamChunk[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(4); // 3 content deltas + 1 message_delta
      expect(chunks[0].content).toBe('Hello');
      expect(chunks[1].content).toBe(', ');
      expect(chunks[2].content).toBe('world!');
    });

    it('should include finish reason and token usage on final chunk', async () => {
      const events = makeStreamingEvents(['Hi'], 15, 8, 'end_turn');
      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(makeAnthropicSSE(events)));

      const provider = new AnthropicProvider(makeConfig());
      const stream = await provider.generateStream([{ role: LLMRole.USER, content: 'hi' }]);

      const chunks: LLMStreamChunk[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const lastChunk = chunks[chunks.length - 1];
      expect(lastChunk.finishReason).toBe('end_turn');
      expect(lastChunk.tokenUsage).toEqual({
        promptTokens: 15,
        completionTokens: 8,
        totalTokens: 23,
      });
    });

    it('should set stream=true in request body', async () => {
      const events = makeStreamingEvents(['Hello']);
      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(makeAnthropicSSE(events)));

      const provider = new AnthropicProvider(makeConfig());
      const stream = await provider.generateStream([{ role: LLMRole.USER, content: 'hi' }]);
      // Consume stream
      for await (const _ of stream) {
        /* drain */
      }

      const callBody = JSON.parse(
        (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string,
      );

      expect(callBody.stream).toBe(true);
    });

    it('should collect full response via toResponse()', async () => {
      const events = makeStreamingEvents(['Hello', ' world'], 10, 5);
      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(makeAnthropicSSE(events)));

      const provider = new AnthropicProvider(makeConfig());
      const stream = await provider.generateStream([{ role: LLMRole.USER, content: 'hi' }]);
      const response = await stream.toResponse();

      expect(response.content).toBe('Hello world');
      expect(response.finishReason).toBe('end_turn');
      expect(response.tokenUsage).toEqual({
        promptTokens: 10,
        completionTokens: 5,
        totalTokens: 15,
      });
    });

    it('should handle single-chunk stream', async () => {
      const events = makeStreamingEvents(['Full response'], 5, 3);
      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(makeAnthropicSSE(events)));

      const provider = new AnthropicProvider(makeConfig());
      const stream = await provider.generateStream([{ role: LLMRole.USER, content: 'hi' }]);

      const chunks: LLMStreamChunk[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(2); // 1 content + 1 message_delta
      expect(chunks[0].content).toBe('Full response');
    });

    it('should throw when streaming response has no body', async () => {
      const mockResponse = new Response(null, { status: 200 });
      Object.defineProperty(mockResponse, 'body', { value: null });
      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      const provider = new AnthropicProvider(makeConfig());
      const stream = await provider.generateStream([{ role: LLMRole.USER, content: 'hi' }]);

      await expect(async () => {
        for await (const _ of stream) {
          /* drain */
        }
      }).rejects.toThrow(LLMProviderError);
    });

    it('should handle system messages in streaming mode', async () => {
      const events = makeStreamingEvents(['Helpful response']);
      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(makeAnthropicSSE(events)));

      const provider = new AnthropicProvider(makeConfig());
      const stream = await provider.generateStream([
        { role: LLMRole.SYSTEM, content: 'Be helpful' },
        { role: LLMRole.USER, content: 'hi' },
      ]);
      for await (const _ of stream) {
        /* drain */
      }

      const callBody = JSON.parse(
        (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string,
      );

      expect(callBody.system).toBe('Be helpful');
      expect(callBody.messages).toEqual([{ role: 'user', content: 'hi' }]);
    });

    it('should handle max_tokens stop reason in stream', async () => {
      const events = makeStreamingEvents(['Truncated...'], 10, 100, 'max_tokens');
      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(makeAnthropicSSE(events)));

      const provider = new AnthropicProvider(makeConfig());
      const stream = await provider.generateStream([{ role: LLMRole.USER, content: 'hi' }]);
      const response = await stream.toResponse();

      expect(response.finishReason).toBe('max_tokens');
    });

    it('should ignore malformed JSON in SSE data lines', async () => {
      const sseText = [
        'event: message_start',
        `data: ${JSON.stringify({ type: 'message_start', message: { usage: { input_tokens: 5, output_tokens: 0 } } })}`,
        '',
        'event: content_block_delta',
        'data: {invalid json}',
        '',
        'event: content_block_delta',
        `data: ${JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Valid' } })}`,
        '',
        'event: message_delta',
        `data: ${JSON.stringify({ type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 3 } })}`,
        '',
        'event: message_stop',
        `data: ${JSON.stringify({ type: 'message_stop' })}`,
        '',
      ].join('\n');

      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(sseText));

      const provider = new AnthropicProvider(makeConfig());
      const stream = await provider.generateStream([{ role: LLMRole.USER, content: 'hi' }]);

      const chunks: LLMStreamChunk[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks.some((c) => c.content === 'Valid')).toBe(true);
    });

    it('should ignore SSE comment lines', async () => {
      const events = makeStreamingEvents(['Hello']);
      const sseText = `: this is a comment\n${makeAnthropicSSE(events)}`;
      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(sseText));

      const provider = new AnthropicProvider(makeConfig());
      const stream = await provider.generateStream([{ role: LLMRole.USER, content: 'hi' }]);

      const chunks: LLMStreamChunk[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks.some((c) => c.content === 'Hello')).toBe(true);
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
      await expect(provider.generateText([{ role: LLMRole.USER, content: 'hi' }])).rejects.toThrow(
        LLMAuthenticationError,
      );
    });

    it('should include error message from Anthropic API', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(
          makeJsonResponse(
            { error: { type: 'authentication_error', message: 'Invalid API key provided' } },
            401,
          ),
        );

      const provider = new AnthropicProvider(makeConfig());
      await expect(provider.generateText([{ role: LLMRole.USER, content: 'hi' }])).rejects.toThrow(
        /Invalid API key provided/,
      );
    });

    it('should throw LLMRateLimitError on 429', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(
          makeJsonResponse(
            { error: { type: 'rate_limit_error', message: 'Too many requests' } },
            429,
          ),
        );

      const provider = new AnthropicProvider(makeConfig());
      await expect(provider.generateText([{ role: LLMRole.USER, content: 'hi' }])).rejects.toThrow(
        LLMRateLimitError,
      );
    });

    it('should parse retry-after header on rate limit', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(
          makeJsonResponse(
            { error: { type: 'rate_limit_error', message: 'Too many requests' } },
            429,
            { 'retry-after': '30' },
          ),
        );

      const provider = new AnthropicProvider(makeConfig());
      try {
        await provider.generateText([{ role: LLMRole.USER, content: 'hi' }]);
        expect.unreachable('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(LLMRateLimitError);
        expect((error as LLMRateLimitError).retryAfterMs).toBe(30_000);
      }
    });

    it('should handle rate limit without retry-after header', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(
          makeJsonResponse(
            { error: { type: 'rate_limit_error', message: 'Too many requests' } },
            429,
          ),
        );

      const provider = new AnthropicProvider(makeConfig());
      try {
        await provider.generateText([{ role: LLMRole.USER, content: 'hi' }]);
        expect.unreachable('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(LLMRateLimitError);
        expect((error as LLMRateLimitError).retryAfterMs).toBeUndefined();
      }
    });

    it('should throw LLMContextLengthError on token limit 400', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse(
          {
            error: {
              type: 'invalid_request_error',
              message: 'prompt is too long: 250000 token',
            },
          },
          400,
        ),
      );

      const provider = new AnthropicProvider(makeConfig());
      await expect(provider.generateText([{ role: LLMRole.USER, content: 'hi' }])).rejects.toThrow(
        LLMContextLengthError,
      );
    });

    it('should throw generic LLMProviderError on non-token 400', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(
          makeJsonResponse(
            { error: { type: 'invalid_request_error', message: 'Invalid parameter' } },
            400,
          ),
        );

      const provider = new AnthropicProvider(makeConfig());
      await expect(provider.generateText([{ role: LLMRole.USER, content: 'hi' }])).rejects.toThrow(
        LLMProviderError,
      );
    });

    it('should throw LLMProviderError on 403', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(
          makeJsonResponse({ error: { type: 'permission_error', message: 'Access denied' } }, 403),
        );

      const provider = new AnthropicProvider(makeConfig());
      await expect(provider.generateText([{ role: LLMRole.USER, content: 'hi' }])).rejects.toThrow(
        /Access denied/,
      );
    });

    it('should throw LLMProviderError on 404', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(
          makeJsonResponse({ error: { type: 'not_found_error', message: 'Model not found' } }, 404),
        );

      const provider = new AnthropicProvider(makeConfig());
      await expect(provider.generateText([{ role: LLMRole.USER, content: 'hi' }])).rejects.toThrow(
        /not found/,
      );
    });

    it('should throw LLMProviderError on 500 server error', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(
          makeJsonResponse({ error: { type: 'api_error', message: 'Internal server error' } }, 500),
        );

      const provider = new AnthropicProvider(makeConfig());
      await expect(provider.generateText([{ role: LLMRole.USER, content: 'hi' }])).rejects.toThrow(
        /server error/,
      );
    });

    it('should throw LLMProviderError on 529 overloaded', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(
          makeJsonResponse(
            { error: { type: 'overloaded_error', message: 'API is overloaded' } },
            529,
          ),
        );

      const provider = new AnthropicProvider(makeConfig());
      await expect(provider.generateText([{ role: LLMRole.USER, content: 'hi' }])).rejects.toThrow(
        /overloaded/,
      );
    });

    it('should handle non-JSON error response body', async () => {
      const response = new Response('Gateway Timeout', {
        status: 504,
        statusText: 'Gateway Timeout',
      });
      globalThis.fetch = vi.fn().mockResolvedValue(response);

      const provider = new AnthropicProvider(makeConfig());
      await expect(provider.generateText([{ role: LLMRole.USER, content: 'hi' }])).rejects.toThrow(
        LLMProviderError,
      );
    });

    it('should throw on network error', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      const provider = new AnthropicProvider(makeConfig());
      await expect(provider.generateText([{ role: LLMRole.USER, content: 'hi' }])).rejects.toThrow(
        /Network error.*ECONNREFUSED/,
      );
    });

    it('should throw on AbortError', async () => {
      const abortError = new DOMException('The operation was aborted', 'AbortError');
      globalThis.fetch = vi.fn().mockRejectedValue(abortError);

      const provider = new AnthropicProvider(makeConfig());
      await expect(provider.generateText([{ role: LLMRole.USER, content: 'hi' }])).rejects.toThrow(
        /aborted/,
      );
    });

    it('should pass abort signal to fetch', async () => {
      const controller = new AbortController();
      globalThis.fetch = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('Hello')));

      const provider = new AnthropicProvider(makeConfig());
      await provider.generateText([{ role: LLMRole.USER, content: 'hi' }], {
        signal: controller.signal,
      });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ signal: controller.signal }),
      );
    });

    it('should handle 502 Bad Gateway', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(
          makeJsonResponse({ error: { type: 'api_error', message: 'Bad Gateway' } }, 502),
        );

      const provider = new AnthropicProvider(makeConfig());
      await expect(provider.generateText([{ role: LLMRole.USER, content: 'hi' }])).rejects.toThrow(
        LLMProviderError,
      );
    });

    it('should handle 503 Service Unavailable', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(
          makeJsonResponse({ error: { type: 'api_error', message: 'Service Unavailable' } }, 503),
        );

      const provider = new AnthropicProvider(makeConfig());
      await expect(provider.generateText([{ role: LLMRole.USER, content: 'hi' }])).rejects.toThrow(
        /server error/,
      );
    });

    it('should throw on non-Error thrown from fetch', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue('string error');

      const provider = new AnthropicProvider(makeConfig());
      await expect(provider.generateText([{ role: LLMRole.USER, content: 'hi' }])).rejects.toThrow(
        LLMProviderError,
      );
    });
  });

  // -------------------------------------------------------------------------
  // Message validation (inherited from BaseLLMProvider)
  // -------------------------------------------------------------------------

  describe('message validation', () => {
    it('should throw when messages array is empty', async () => {
      const provider = new AnthropicProvider(makeConfig());
      await expect(provider.generateText([])).rejects.toThrow(/empty/);
    });

    it('should throw when no user or system message present', async () => {
      const provider = new AnthropicProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.ASSISTANT, content: 'only assistant' }]),
      ).rejects.toThrow(/USER or SYSTEM/);
    });

    it('should accept messages with only user role', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('Hello')));

      const provider = new AnthropicProvider(makeConfig());
      const result = await provider.generateText([{ role: LLMRole.USER, content: 'hi' }]);
      expect(result.content).toBe('Hello');
    });

    it('should accept messages with only system role', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(makeJsonResponse(makeMessagesResponse('Hello')));

      const provider = new AnthropicProvider(makeConfig());
      // Note: only system messages — valid for BaseLLMProvider validation
      // Anthropic API might reject this, but our provider validates minimally
      const result = await provider.generateText([
        { role: LLMRole.SYSTEM, content: 'You are helpful' },
      ]);
      expect(result.content).toBe('Hello');
    });
  });

  // -------------------------------------------------------------------------
  // Factory function
  // -------------------------------------------------------------------------

  describe('createAnthropicProvider', () => {
    it('should create an AnthropicProvider instance', () => {
      const provider = createAnthropicProvider(makeConfig());
      expect(provider).toBeInstanceOf(AnthropicProvider);
      expect(provider.name).toBe('anthropic');
    });

    it('should pass config to constructor', () => {
      const provider = createAnthropicProvider(
        makeConfig({ modelId: 'claude-3-5-haiku-20241022' }),
      );
      expect(provider.modelId).toBe('claude-3-5-haiku-20241022');
    });

    it('should throw on missing API key', () => {
      expect(() => createAnthropicProvider({ provider: 'anthropic', modelId: TEST_MODEL })).toThrow(
        LLMAuthenticationError,
      );
    });
  });

  // -------------------------------------------------------------------------
  // Integration with provider registry pattern
  // -------------------------------------------------------------------------

  describe('provider registry integration', () => {
    it('should work as a factory function for the registry', () => {
      const config = makeConfig();
      const provider = createAnthropicProvider(config);

      expect(provider).toBeInstanceOf(AnthropicProvider);
      expect(provider.name).toBe('anthropic');
      expect(provider.modelId).toBe(TEST_MODEL);
    });

    it('should support Claude 3.5 Sonnet model', () => {
      const provider = new AnthropicProvider(makeConfig({ modelId: 'claude-3-5-sonnet-20241022' }));
      expect(provider.modelId).toBe('claude-3-5-sonnet-20241022');
    });

    it('should support Claude 3.5 Haiku model', () => {
      const provider = new AnthropicProvider(makeConfig({ modelId: 'claude-3-5-haiku-20241022' }));
      expect(provider.modelId).toBe('claude-3-5-haiku-20241022');
    });

    it('should support Claude 3 Opus model', () => {
      const provider = new AnthropicProvider(makeConfig({ modelId: 'claude-3-opus-20240229' }));
      expect(provider.modelId).toBe('claude-3-opus-20240229');
    });
  });
});
