import { describe, expect, it } from 'vitest';

import { LLMProviderError } from '../../../src/errors/llm-errors.js';
import { BaseLLMProvider } from '../../../src/llm/base-provider.js';
import type {
  LLMMessage,
  LLMProviderConfig,
  LLMRequestOptions,
  LLMResponse,
  LLMStreamChunk,
  LLMStreamResponse,
} from '../../../src/types/llm.js';
import { LLMRole } from '../../../src/types/llm.js';
import { DefaultLLMStreamResponse } from '../../../src/llm/stream-response.js';

// ---------------------------------------------------------------------------
// Concrete test implementations
// ---------------------------------------------------------------------------

class TestProvider extends BaseLLMProvider {
  public lastMessages: readonly LLMMessage[] = [];
  public lastOptions: LLMRequestOptions = {};

  protected async _doGenerateText(
    messages: readonly LLMMessage[],
    options: LLMRequestOptions,
  ): Promise<LLMResponse> {
    this.lastMessages = messages;
    this.lastOptions = options;
    return {
      content: 'test response',
      finishReason: 'stop',
      tokenUsage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    };
  }
}

class StreamingTestProvider extends BaseLLMProvider {
  protected async _doGenerateText(
    _messages: readonly LLMMessage[],
    _options: LLMRequestOptions,
  ): Promise<LLMResponse> {
    return {
      content: 'non-streaming response',
      finishReason: 'stop',
      tokenUsage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
    };
  }

  protected override async _doGenerateStream(
    _messages: readonly LLMMessage[],
    _options: LLMRequestOptions,
  ): Promise<LLMStreamResponse> {
    async function* gen(): AsyncGenerator<LLMStreamChunk> {
      yield { content: 'streamed ' };
      yield {
        content: 'response',
        finishReason: 'stop' as const,
        tokenUsage: { promptTokens: 5, completionTokens: 3, totalTokens: 8 },
      };
    }
    return new DefaultLLMStreamResponse('streaming-test', gen());
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BaseLLMProvider', () => {
  const validConfig: LLMProviderConfig = {
    provider: 'test',
    modelId: 'test-model',
  };

  const validMessages: LLMMessage[] = [
    { role: LLMRole.SYSTEM, content: 'You are a helpful assistant.' },
    { role: LLMRole.USER, content: 'Hello' },
  ];

  describe('constructor', () => {
    it('should set name and modelId from config', () => {
      const provider = new TestProvider(validConfig);

      expect(provider.name).toBe('test');
      expect(provider.modelId).toBe('test-model');
    });

    it('should use default maxRetries (3) and timeout (30000)', () => {
      const provider = new TestProvider(validConfig);

      expect(provider.maxRetries).toBe(3);
      expect(provider.timeout).toBe(30_000);
    });

    it('should accept custom maxRetries and timeout', () => {
      const provider = new TestProvider({
        ...validConfig,
        maxRetries: 5,
        timeout: 60_000,
      });

      expect(provider.maxRetries).toBe(5);
      expect(provider.timeout).toBe(60_000);
    });

    it('should throw LLMProviderError for empty provider name', () => {
      expect(() => new TestProvider({ provider: '', modelId: 'model' })).toThrow(LLMProviderError);
    });

    it('should throw LLMProviderError for empty modelId', () => {
      expect(() => new TestProvider({ provider: 'test', modelId: '' })).toThrow(LLMProviderError);
    });

    it('should throw LLMProviderError for whitespace-only provider', () => {
      expect(() => new TestProvider({ provider: '   ', modelId: 'model' })).toThrow(
        LLMProviderError,
      );
    });

    it('should throw LLMProviderError for whitespace-only modelId', () => {
      expect(() => new TestProvider({ provider: 'test', modelId: '  ' })).toThrow(LLMProviderError);
    });
  });

  describe('generateText', () => {
    it('should delegate to _doGenerateText and return response', async () => {
      const provider = new TestProvider(validConfig);
      const response = await provider.generateText(validMessages);

      expect(response.content).toBe('test response');
      expect(response.finishReason).toBe('stop');
      expect(response.tokenUsage.totalTokens).toBe(15);
    });

    it('should pass messages to _doGenerateText', async () => {
      const provider = new TestProvider(validConfig);
      await provider.generateText(validMessages);

      expect(provider.lastMessages).toEqual(validMessages);
    });

    it('should throw for empty messages array', async () => {
      const provider = new TestProvider(validConfig);
      await expect(provider.generateText([])).rejects.toThrow(LLMProviderError);
      await expect(provider.generateText([])).rejects.toThrow(/must not be empty/);
    });

    it('should throw when messages have no USER or SYSTEM role', async () => {
      const provider = new TestProvider(validConfig);
      const messages: LLMMessage[] = [{ role: LLMRole.ASSISTANT, content: 'I am an assistant' }];
      await expect(provider.generateText(messages)).rejects.toThrow(LLMProviderError);
      await expect(provider.generateText(messages)).rejects.toThrow(/USER or SYSTEM/);
    });

    it('should accept messages with only USER role', async () => {
      const provider = new TestProvider(validConfig);
      const messages: LLMMessage[] = [{ role: LLMRole.USER, content: 'Hi' }];

      const response = await provider.generateText(messages);
      expect(response.content).toBe('test response');
    });

    it('should accept messages with only SYSTEM role', async () => {
      const provider = new TestProvider(validConfig);
      const messages: LLMMessage[] = [{ role: LLMRole.SYSTEM, content: 'System prompt' }];

      const response = await provider.generateText(messages);
      expect(response.content).toBe('test response');
    });

    it('should accept messages with TOOL role alongside USER', async () => {
      const provider = new TestProvider(validConfig);
      const messages: LLMMessage[] = [
        { role: LLMRole.USER, content: 'Use the tool' },
        { role: LLMRole.TOOL, content: 'tool result', name: 'search' },
      ];

      const response = await provider.generateText(messages);
      expect(response.content).toBe('test response');
    });
  });

  describe('option merging', () => {
    it('should pass through per-call options when no defaults set', async () => {
      const provider = new TestProvider(validConfig);
      const options: LLMRequestOptions = { temperature: 0.5, maxTokens: 100 };

      await provider.generateText(validMessages, options);

      expect(provider.lastOptions).toEqual(options);
    });

    it('should use default options when no per-call options provided', async () => {
      const defaults: LLMRequestOptions = { temperature: 0.7, maxTokens: 200 };
      const provider = new TestProvider({ ...validConfig, defaultOptions: defaults });

      await provider.generateText(validMessages);

      expect(provider.lastOptions).toEqual(defaults);
    });

    it('should merge per-call options over defaults', async () => {
      const defaults: LLMRequestOptions = { temperature: 0.7, maxTokens: 200 };
      const provider = new TestProvider({ ...validConfig, defaultOptions: defaults });

      await provider.generateText(validMessages, { temperature: 0.3 });

      expect(provider.lastOptions.temperature).toBe(0.3);
      expect(provider.lastOptions.maxTokens).toBe(200);
    });

    it('should prefer per-call stopSequences over defaults', async () => {
      const defaults: LLMRequestOptions = { stopSequences: ['STOP'] };
      const provider = new TestProvider({ ...validConfig, defaultOptions: defaults });

      await provider.generateText(validMessages, { stopSequences: ['END'] });

      expect(provider.lastOptions.stopSequences).toEqual(['END']);
    });

    it('should return empty object when no defaults and no per-call options', async () => {
      const provider = new TestProvider(validConfig);

      await provider.generateText(validMessages);

      expect(provider.lastOptions).toEqual({});
    });
  });

  describe('generateStream', () => {
    it('should throw by default (non-streaming provider)', async () => {
      const provider = new TestProvider(validConfig);

      await expect(provider.generateStream(validMessages)).rejects.toThrow(LLMProviderError);
      await expect(provider.generateStream(validMessages)).rejects.toThrow(
        /does not support streaming/,
      );
    });

    it('should validate messages before streaming', async () => {
      const provider = new TestProvider(validConfig);

      await expect(provider.generateStream([])).rejects.toThrow(/must not be empty/);
    });

    it('should work when _doGenerateStream is overridden', async () => {
      const provider = new StreamingTestProvider(validConfig);
      const stream = await provider.generateStream(validMessages);
      const response = await stream.toResponse();

      expect(response.content).toBe('streamed response');
      expect(response.finishReason).toBe('stop');
    });
  });

  describe('generateStream with StreamingTestProvider', () => {
    it('should return iterable chunks', async () => {
      const provider = new StreamingTestProvider(validConfig);
      const stream = await provider.generateStream(validMessages);

      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(2);
      expect(chunks[0]!.content).toBe('streamed ');
      expect(chunks[1]!.content).toBe('response');
    });

    it('should also support non-streaming generateText', async () => {
      const provider = new StreamingTestProvider(validConfig);
      const response = await provider.generateText(validMessages);

      expect(response.content).toBe('non-streaming response');
    });
  });

  describe('config access', () => {
    it('should expose config via protected _config for subclasses', () => {
      const config: LLMProviderConfig = {
        provider: 'test',
        modelId: 'model',
        apiKey: 'sk-test',
        baseUrl: 'https://api.example.com',
      };

      const provider = new TestProvider(config);

      // Access through public properties set in constructor
      expect(provider.name).toBe('test');
      expect(provider.modelId).toBe('model');
    });
  });

  describe('AbortSignal support', () => {
    it('should pass signal through options', async () => {
      const provider = new TestProvider(validConfig);
      const controller = new AbortController();

      await provider.generateText(validMessages, { signal: controller.signal });

      expect(provider.lastOptions.signal).toBe(controller.signal);
    });

    it('should merge signal from per-call options over defaults', async () => {
      const defaultController = new AbortController();
      const callController = new AbortController();
      const provider = new TestProvider({
        ...validConfig,
        defaultOptions: { signal: defaultController.signal },
      });

      await provider.generateText(validMessages, { signal: callController.signal });

      expect(provider.lastOptions.signal).toBe(callController.signal);
    });
  });
});
