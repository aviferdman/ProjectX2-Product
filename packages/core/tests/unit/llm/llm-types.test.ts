import { describe, expect, it } from 'vitest';

import { LLMRole } from '../../../src/types/llm.js';
import type {
  LLMMessage,
  LLMModelInfo,
  LLMProviderConfig,
  LLMRequestOptions,
  LLMResponse,
  LLMStreamChunk,
  TokenUsage,
} from '../../../src/types/llm.js';

describe('LLM Types', () => {
  describe('LLMRole', () => {
    it('should have SYSTEM, USER, ASSISTANT, and TOOL values', () => {
      expect(LLMRole.SYSTEM).toBe('system');
      expect(LLMRole.USER).toBe('user');
      expect(LLMRole.ASSISTANT).toBe('assistant');
      expect(LLMRole.TOOL).toBe('tool');
    });

    it('should have exactly 4 members', () => {
      const values = Object.values(LLMRole);
      expect(values).toHaveLength(4);
    });
  });

  describe('LLMMessage', () => {
    it('should accept valid message structure', () => {
      const message: LLMMessage = {
        role: LLMRole.USER,
        content: 'Hello, world!',
      };

      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello, world!');
    });

    it('should support optional name field for tool messages', () => {
      const message: LLMMessage = {
        role: LLMRole.TOOL,
        content: '{"result": 42}',
        name: 'calculator',
      };

      expect(message.name).toBe('calculator');
    });
  });

  describe('LLMRequestOptions', () => {
    it('should allow all optional fields', () => {
      const options: LLMRequestOptions = {};
      expect(options.temperature).toBeUndefined();
      expect(options.maxTokens).toBeUndefined();
      expect(options.stopSequences).toBeUndefined();
    });

    it('should support AbortSignal', () => {
      const controller = new AbortController();
      const options: LLMRequestOptions = { signal: controller.signal };
      expect(options.signal).toBe(controller.signal);
    });
  });

  describe('TokenUsage', () => {
    it('should require all three token fields', () => {
      const usage: TokenUsage = {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      };

      expect(usage.promptTokens + usage.completionTokens).toBe(usage.totalTokens);
    });
  });

  describe('LLMResponse', () => {
    it('should contain content, tokenUsage, and finishReason', () => {
      const response: LLMResponse = {
        content: 'Hello!',
        tokenUsage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        finishReason: 'stop',
      };

      expect(response.content).toBe('Hello!');
      expect(response.finishReason).toBe('stop');
      expect(response.tokenUsage.totalTokens).toBe(15);
    });
  });

  describe('LLMStreamChunk', () => {
    it('should require only content', () => {
      const chunk: LLMStreamChunk = { content: 'partial' };
      expect(chunk.content).toBe('partial');
      expect(chunk.finishReason).toBeUndefined();
      expect(chunk.tokenUsage).toBeUndefined();
    });

    it('should support finishReason and tokenUsage on final chunk', () => {
      const chunk: LLMStreamChunk = {
        content: '',
        finishReason: 'stop',
        tokenUsage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      };

      expect(chunk.finishReason).toBe('stop');
      expect(chunk.tokenUsage?.totalTokens).toBe(15);
    });
  });

  describe('LLMProviderConfig', () => {
    it('should require provider and modelId', () => {
      const config: LLMProviderConfig = {
        provider: 'openai',
        modelId: 'gpt-4o',
      };

      expect(config.provider).toBe('openai');
      expect(config.modelId).toBe('gpt-4o');
    });

    it('should support all optional fields', () => {
      const config: LLMProviderConfig = {
        provider: 'openai',
        modelId: 'gpt-4o',
        apiKey: 'sk-test',
        baseUrl: 'https://api.openai.com/v1',
        maxRetries: 5,
        timeout: 60_000,
        defaultOptions: { temperature: 0.7 },
      };

      expect(config.apiKey).toBe('sk-test');
      expect(config.timeout).toBe(60_000);
    });
  });

  describe('LLMModelInfo', () => {
    it('should represent model capabilities', () => {
      const model: LLMModelInfo = {
        modelId: 'gpt-4o',
        provider: 'openai',
        displayName: 'GPT-4o',
        maxContextTokens: 128_000,
        maxOutputTokens: 16_384,
        supportsStreaming: true,
        costPer1kInputTokens: 0.005,
        costPer1kOutputTokens: 0.015,
      };

      expect(model.supportsStreaming).toBe(true);
      expect(model.maxContextTokens).toBe(128_000);
    });

    it('should allow undefined cost for local models', () => {
      const model: LLMModelInfo = {
        modelId: 'llama3',
        provider: 'ollama',
        displayName: 'Llama 3',
        maxContextTokens: 8_192,
        maxOutputTokens: 4_096,
        supportsStreaming: true,
      };

      expect(model.costPer1kInputTokens).toBeUndefined();
      expect(model.costPer1kOutputTokens).toBeUndefined();
    });
  });
});
