import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LLMProviderError, LLMRateLimitError } from '../../../src/errors/llm-errors.js';
import {
  OllamaProvider,
  createOllamaProvider,
} from '../../../src/llm/providers/ollama-provider.js';
import type { LLMProviderConfig, LLMStreamChunk } from '../../../src/types/llm.js';
import { LLMRole } from '../../../src/types/llm.js';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

const TEST_MODEL = 'llama3.1:8b';

function makeConfig(overrides?: Partial<LLMProviderConfig>): LLMProviderConfig {
  return {
    provider: 'ollama',
    modelId: TEST_MODEL,
    ...overrides,
  };
}

function makeChatResponse(
  content: string,
  doneReason = 'stop',
  promptEvalCount = 10,
  evalCount = 5,
) {
  return {
    message: { role: 'assistant', content },
    done: true,
    done_reason: doneReason,
    prompt_eval_count: promptEvalCount,
    eval_count: evalCount,
    total_duration: 5000000000,
    load_duration: 1000000000,
    prompt_eval_duration: 2000000000,
    eval_duration: 2000000000,
  };
}

function makeNDJSONLines(
  chunks: Array<{
    content?: string;
    done?: boolean;
    done_reason?: string;
    prompt_eval_count?: number;
    eval_count?: number;
  }>,
): string {
  const lines: string[] = [];
  for (const chunk of chunks) {
    const data = {
      message: { role: 'assistant', content: chunk.content ?? '' },
      done: chunk.done ?? false,
      ...(chunk.done_reason !== undefined && { done_reason: chunk.done_reason }),
      ...(chunk.prompt_eval_count !== undefined && {
        prompt_eval_count: chunk.prompt_eval_count,
      }),
      ...(chunk.eval_count !== undefined && { eval_count: chunk.eval_count }),
    };
    lines.push(JSON.stringify(data));
  }
  return lines.join('\n') + '\n';
}

function makeStreamResponse(ndjsonText: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(ndjsonText));
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'application/x-ndjson' },
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

describe('OllamaProvider', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Construction
  // -------------------------------------------------------------------------

  describe('constructor', () => {
    it('should create provider with valid config', () => {
      const provider = new OllamaProvider(makeConfig());
      expect(provider.name).toBe('ollama');
      expect(provider.modelId).toBe(TEST_MODEL);
    });

    it('should use default maxRetries and timeout', () => {
      const provider = new OllamaProvider(makeConfig());
      expect(provider.maxRetries).toBe(3);
      expect(provider.timeout).toBe(30_000);
    });

    it('should accept custom maxRetries and timeout', () => {
      const provider = new OllamaProvider(makeConfig({ maxRetries: 5, timeout: 60_000 }));
      expect(provider.maxRetries).toBe(5);
      expect(provider.timeout).toBe(60_000);
    });

    it('should not require an API key', () => {
      const provider = new OllamaProvider({ provider: 'ollama', modelId: TEST_MODEL });
      expect(provider.name).toBe('ollama');
    });

    it('should accept an optional API key', () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new OllamaProvider(makeConfig({ apiKey: 'test-key' }));
      void provider.generateText([{ role: LLMRole.USER, content: 'test' }]);

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const headers = callArgs[1].headers as Record<string, string>;
      expect(headers['Authorization']).toBe('Bearer test-key');
    });

    it('should not send Authorization header when no API key provided', () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new OllamaProvider(makeConfig());
      void provider.generateText([{ role: LLMRole.USER, content: 'test' }]);

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const headers = callArgs[1].headers as Record<string, string>;
      expect(headers['Authorization']).toBeUndefined();
    });

    it('should use custom baseUrl when provided', () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new OllamaProvider(makeConfig({ baseUrl: 'http://remote-ollama:11434' }));
      void provider.generateText([{ role: LLMRole.USER, content: 'test' }]);

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(callArgs[0]).toBe('http://remote-ollama:11434/api/chat');
    });

    it('should use default Ollama base URL when none provided', () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new OllamaProvider(makeConfig());
      void provider.generateText([{ role: LLMRole.USER, content: 'test' }]);

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(callArgs[0]).toBe('http://localhost:11434/api/chat');
    });

    it('should set provider name to ollama regardless of config.provider', () => {
      const provider = new OllamaProvider(makeConfig({ provider: 'something-else' }));
      expect(provider.name).toBe('ollama');
    });
  });

  // -------------------------------------------------------------------------
  // generateText
  // -------------------------------------------------------------------------

  describe('generateText', () => {
    it('should send correct request to Ollama Chat API', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(makeJsonResponse(makeChatResponse('Hello world')));
      globalThis.fetch = fetchMock;

      const provider = new OllamaProvider(makeConfig());
      await provider.generateText([
        { role: LLMRole.SYSTEM, content: 'You are helpful.' },
        { role: LLMRole.USER, content: 'Say hello' },
      ]);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('http://localhost:11434/api/chat');
      expect(init.method).toBe('POST');

      const body = JSON.parse(init.body as string) as Record<string, unknown>;
      expect(body['model']).toBe(TEST_MODEL);
      expect(body['messages']).toEqual([
        { role: 'system', content: 'You are helpful.' },
        { role: 'user', content: 'Say hello' },
      ]);
      expect(body['stream']).toBe(false);
    });

    it('should return correct LLMResponse from API', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(makeJsonResponse(makeChatResponse('Hello!', 'stop', 20, 3)));

      const provider = new OllamaProvider(makeConfig());
      const response = await provider.generateText([{ role: LLMRole.USER, content: 'Say hello' }]);

      expect(response.content).toBe('Hello!');
      expect(response.finishReason).toBe('stop');
      expect(response.tokenUsage).toEqual({
        promptTokens: 20,
        completionTokens: 3,
        totalTokens: 23,
      });
    });

    it('should pass temperature option', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new OllamaProvider(makeConfig());
      await provider.generateText([{ role: LLMRole.USER, content: 'test' }], {
        temperature: 0.5,
      });

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      const options = body['options'] as Record<string, unknown>;
      expect(options['temperature']).toBe(0.5);
    });

    it('should pass maxTokens as num_predict', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new OllamaProvider(makeConfig());
      await provider.generateText([{ role: LLMRole.USER, content: 'test' }], {
        maxTokens: 100,
      });

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      const options = body['options'] as Record<string, unknown>;
      expect(options['num_predict']).toBe(100);
    });

    it('should pass stopSequences as stop', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new OllamaProvider(makeConfig());
      await provider.generateText([{ role: LLMRole.USER, content: 'test' }], {
        stopSequences: ['END', 'STOP'],
      });

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      const options = body['options'] as Record<string, unknown>;
      expect(options['stop']).toEqual(['END', 'STOP']);
    });

    it('should not include options object when no options provided', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new OllamaProvider(makeConfig());
      await provider.generateText([{ role: LLMRole.USER, content: 'test' }]);

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      expect(body['options']).toBeUndefined();
    });

    it('should map all LLM roles correctly', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new OllamaProvider(makeConfig());
      await provider.generateText([
        { role: LLMRole.SYSTEM, content: 'system msg' },
        { role: LLMRole.USER, content: 'user msg' },
        { role: LLMRole.ASSISTANT, content: 'assistant msg' },
        { role: LLMRole.TOOL, content: 'tool msg' },
      ]);

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      expect(body['messages']).toEqual([
        { role: 'system', content: 'system msg' },
        { role: 'user', content: 'user msg' },
        { role: 'assistant', content: 'assistant msg' },
        { role: 'tool', content: 'tool msg' },
      ]);
    });

    it('should handle missing token counts gracefully', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse({
          message: { role: 'assistant', content: 'Hello' },
          done: true,
        }),
      );

      const provider = new OllamaProvider(makeConfig());
      const response = await provider.generateText([{ role: LLMRole.USER, content: 'test' }]);

      expect(response.tokenUsage).toEqual({
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      });
    });

    it('should handle missing done_reason with default stop', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        makeJsonResponse({
          message: { role: 'assistant', content: 'Hello' },
          done: true,
        }),
      );

      const provider = new OllamaProvider(makeConfig());
      const response = await provider.generateText([{ role: LLMRole.USER, content: 'test' }]);

      expect(response.finishReason).toBe('stop');
    });

    it('should map length done_reason correctly', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(makeJsonResponse(makeChatResponse('truncated', 'length', 10, 100)));

      const provider = new OllamaProvider(makeConfig());
      const response = await provider.generateText([{ role: LLMRole.USER, content: 'test' }]);

      expect(response.finishReason).toBe('length');
    });

    it('should reject empty message array', async () => {
      const provider = new OllamaProvider(makeConfig());
      await expect(provider.generateText([])).rejects.toThrow(LLMProviderError);
    });

    it('should reject messages without user or system content', async () => {
      const provider = new OllamaProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.ASSISTANT, content: 'hello' }]),
      ).rejects.toThrow(LLMProviderError);
    });

    it('should use defaultOptions from config', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new OllamaProvider(
        makeConfig({
          defaultOptions: { temperature: 0.3, maxTokens: 500 },
        }),
      );
      await provider.generateText([{ role: LLMRole.USER, content: 'test' }]);

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      const options = body['options'] as Record<string, unknown>;
      expect(options['temperature']).toBe(0.3);
      expect(options['num_predict']).toBe(500);
    });

    it('should allow per-call options to override defaults', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new OllamaProvider(
        makeConfig({
          defaultOptions: { temperature: 0.3, maxTokens: 500 },
        }),
      );
      await provider.generateText([{ role: LLMRole.USER, content: 'test' }], {
        temperature: 0.9,
      });

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      const options = body['options'] as Record<string, unknown>;
      expect(options['temperature']).toBe(0.9);
      expect(options['num_predict']).toBe(500);
    });
  });

  // -------------------------------------------------------------------------
  // generateStream
  // -------------------------------------------------------------------------

  describe('generateStream', () => {
    it('should send correct streaming request', async () => {
      const ndjson = makeNDJSONLines([
        { content: 'Hello' },
        {
          content: ' world',
          done: true,
          done_reason: 'stop',
          prompt_eval_count: 10,
          eval_count: 5,
        },
      ]);
      const fetchMock = vi.fn().mockResolvedValue(makeStreamResponse(ndjson));
      globalThis.fetch = fetchMock;

      const provider = new OllamaProvider(makeConfig());
      await provider.generateStream([{ role: LLMRole.USER, content: 'test' }]);

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('http://localhost:11434/api/chat');
      const body = JSON.parse(init.body as string) as Record<string, unknown>;
      expect(body['stream']).toBe(true);
    });

    it('should yield content chunks and final token usage', async () => {
      const ndjson = makeNDJSONLines([
        { content: 'Hello' },
        { content: ' world' },
        { content: '!', done: true, done_reason: 'stop', prompt_eval_count: 10, eval_count: 8 },
      ]);
      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(ndjson));

      const provider = new OllamaProvider(makeConfig());
      const stream = await provider.generateStream([{ role: LLMRole.USER, content: 'test' }]);

      const chunks: LLMStreamChunk[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(3);
      expect(chunks[0]).toEqual({ content: 'Hello' });
      expect(chunks[1]).toEqual({ content: ' world' });
      expect(chunks[2]).toEqual({
        content: '!',
        finishReason: 'stop',
        tokenUsage: {
          promptTokens: 10,
          completionTokens: 8,
          totalTokens: 18,
        },
      });
    });

    it('should collect full response via toResponse()', async () => {
      const ndjson = makeNDJSONLines([
        { content: 'Hello' },
        { content: ' world' },
        { content: '', done: true, done_reason: 'stop', prompt_eval_count: 15, eval_count: 6 },
      ]);
      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(ndjson));

      const provider = new OllamaProvider(makeConfig());
      const stream = await provider.generateStream([{ role: LLMRole.USER, content: 'test' }]);

      const response = await stream.toResponse();
      expect(response.content).toBe('Hello world');
      expect(response.finishReason).toBe('stop');
      expect(response.tokenUsage).toEqual({
        promptTokens: 15,
        completionTokens: 6,
        totalTokens: 21,
      });
    });

    it('should handle streaming with no body', async () => {
      const response = new Response(null, { status: 200 });
      globalThis.fetch = vi.fn().mockResolvedValue(response);

      const provider = new OllamaProvider(makeConfig());
      const stream = await provider.generateStream([{ role: LLMRole.USER, content: 'test' }]);

      await expect(stream.toResponse()).rejects.toThrow('Streaming response has no body');
    });

    it('should handle empty content in stream chunks', async () => {
      const ndjson = makeNDJSONLines([
        { content: '' },
        { content: 'data' },
        { content: '', done: true, done_reason: 'stop', prompt_eval_count: 5, eval_count: 2 },
      ]);
      globalThis.fetch = vi.fn().mockResolvedValue(makeStreamResponse(ndjson));

      const provider = new OllamaProvider(makeConfig());
      const stream = await provider.generateStream([{ role: LLMRole.USER, content: 'test' }]);

      const response = await stream.toResponse();
      expect(response.content).toBe('data');
    });

    it('should skip invalid JSON lines in NDJSON stream', async () => {
      const encoder = new TextEncoder();
      const invalidNdjson =
        '{"message":{"role":"assistant","content":"Hello"},"done":false}\nnot-json\n{"message":{"role":"assistant","content":""},"done":true,"done_reason":"stop","prompt_eval_count":5,"eval_count":2}\n';

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(invalidNdjson));
          controller.close();
        },
      });

      const response = new Response(stream, { status: 200 });
      globalThis.fetch = vi.fn().mockResolvedValue(response);

      const provider = new OllamaProvider(makeConfig());
      const streamResp = await provider.generateStream([{ role: LLMRole.USER, content: 'test' }]);

      const result = await streamResp.toResponse();
      expect(result.content).toBe('Hello');
      expect(result.finishReason).toBe('stop');
    });
  });

  // -------------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------------

  describe('error handling', () => {
    it('should throw LLMProviderError with model guidance on 404', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(makeJsonResponse({ error: 'model "nonexistent" not found' }, 404));

      const provider = new OllamaProvider(makeConfig({ modelId: 'nonexistent' }));
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow(/Model not found.*ollama pull/);
    });

    it('should throw LLMProviderError on 400', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(makeJsonResponse({ error: 'invalid request body' }, 400));

      const provider = new OllamaProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow(LLMProviderError);
    });

    it('should throw LLMRateLimitError on 429', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(
          makeJsonResponse({ error: 'too many requests' }, 429, { 'retry-after': '5' }),
        );

      const provider = new OllamaProvider(makeConfig());
      const error = await provider
        .generateText([{ role: LLMRole.USER, content: 'test' }])
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(LLMRateLimitError);
      expect((error as LLMRateLimitError).retryAfterMs).toBe(5000);
    });

    it('should throw LLMProviderError on 500', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(makeJsonResponse({ error: 'internal server error' }, 500));

      const provider = new OllamaProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow(/Ollama server error/);
    });

    it('should throw LLMProviderError on 502', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(makeJsonResponse({ error: 'bad gateway' }, 502));

      const provider = new OllamaProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow(/Ollama server error/);
    });

    it('should throw LLMProviderError on 503', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(makeJsonResponse({ error: 'service unavailable' }, 503));

      const provider = new OllamaProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow(/Ollama server error/);
    });

    it('should handle non-JSON error bodies', async () => {
      const response = new Response('plain text error', {
        status: 500,
        statusText: 'Internal Server Error',
      });
      globalThis.fetch = vi.fn().mockResolvedValue(response);

      const provider = new OllamaProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow(LLMProviderError);
    });

    it('should throw LLMProviderError on unknown status codes', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(makeJsonResponse({ error: 'unknown error' }, 418));

      const provider = new OllamaProvider(makeConfig());
      const error = await provider
        .generateText([{ role: LLMRole.USER, content: 'test' }])
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(LLMProviderError);
      expect((error as LLMProviderError).statusCode).toBe(418);
    });

    it('should throw on network error', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

      const provider = new OllamaProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow(/Network error: Connection refused/);
    });

    it('should throw on AbortError with specific message', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      globalThis.fetch = vi.fn().mockRejectedValue(abortError);

      const provider = new OllamaProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow(/Request was aborted/);
    });

    it('should handle non-Error fetch failures', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue('string error');

      const provider = new OllamaProvider(makeConfig());
      await expect(
        provider.generateText([{ role: LLMRole.USER, content: 'test' }]),
      ).rejects.toThrow(LLMProviderError);
    });
  });

  // -------------------------------------------------------------------------
  // AbortSignal support
  // -------------------------------------------------------------------------

  describe('AbortSignal support', () => {
    it('should pass signal to fetch', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const controller = new AbortController();
      const provider = new OllamaProvider(makeConfig());
      await provider.generateText([{ role: LLMRole.USER, content: 'test' }], {
        signal: controller.signal,
      });

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(callArgs[1].signal).toBe(controller.signal);
    });
  });

  // -------------------------------------------------------------------------
  // Factory function
  // -------------------------------------------------------------------------

  describe('createOllamaProvider', () => {
    it('should create an OllamaProvider instance', () => {
      const provider = createOllamaProvider(makeConfig());
      expect(provider).toBeInstanceOf(OllamaProvider);
      expect(provider.name).toBe('ollama');
      expect(provider.modelId).toBe(TEST_MODEL);
    });

    it('should pass config through to provider', () => {
      const provider = createOllamaProvider(makeConfig({ maxRetries: 7, timeout: 120_000 }));
      expect(provider.maxRetries).toBe(7);
      expect(provider.timeout).toBe(120_000);
    });
  });

  // -------------------------------------------------------------------------
  // Different model types
  // -------------------------------------------------------------------------

  describe('model support', () => {
    it('should work with mistral model ID', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new OllamaProvider(makeConfig({ modelId: 'mistral:7b' }));
      await provider.generateText([{ role: LLMRole.USER, content: 'test' }]);

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      expect(body['model']).toBe('mistral:7b');
    });

    it('should work with codellama model ID', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeChatResponse('ok')));
      globalThis.fetch = fetchMock;

      const provider = new OllamaProvider(makeConfig({ modelId: 'codellama:13b' }));
      await provider.generateText([{ role: LLMRole.USER, content: 'test' }]);

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      expect(body['model']).toBe('codellama:13b');
    });
  });
});
