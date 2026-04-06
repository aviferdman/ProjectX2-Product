import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { LLMProviderError } from '../../../src/errors/llm-errors.js';
import { LLMProviderRegistry } from '../../../src/llm/provider-registry.js';
import type { LLMProvider, LLMProviderConfig } from '../../../src/types/llm.js';

function makeMockProvider(name: string): LLMProvider {
  return {
    name,
    generateText: async () => ({
      content: `response from ${name}`,
      finishReason: 'stop',
      tokenUsage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
    }),
  };
}

describe('LLMProviderRegistry', () => {
  let registry: LLMProviderRegistry;

  beforeEach(() => {
    registry = new LLMProviderRegistry();
  });

  describe('register', () => {
    it('should register a factory by name', () => {
      registry.register('openai', () => makeMockProvider('openai'));

      expect(registry.has('openai')).toBe(true);
    });

    it('should throw when registering a duplicate name', () => {
      registry.register('openai', () => makeMockProvider('openai'));

      expect(() => registry.register('openai', () => makeMockProvider('openai'))).toThrow(
        LLMProviderError,
      );
      expect(() => registry.register('openai', () => makeMockProvider('openai'))).toThrow(
        /already registered/,
      );
    });
  });

  describe('override', () => {
    it('should replace an existing factory', () => {
      registry.register('openai', () => makeMockProvider('openai-v1'));
      registry.override('openai', () => makeMockProvider('openai-v2'));

      const provider = registry.create({ provider: 'openai', modelId: 'gpt-4o' });
      expect(provider.name).toBe('openai-v2');
    });

    it('should create a new registration if name does not exist', () => {
      registry.override('new-provider', () => makeMockProvider('new'));

      expect(registry.has('new-provider')).toBe(true);
    });
  });

  describe('unregister', () => {
    it('should remove a registered factory', () => {
      registry.register('openai', () => makeMockProvider('openai'));
      const result = registry.unregister('openai');

      expect(result).toBe(true);
      expect(registry.has('openai')).toBe(false);
    });

    it('should return false when unregistering a non-existent factory', () => {
      expect(registry.unregister('missing')).toBe(false);
    });
  });

  describe('has', () => {
    it('should return false for unregistered providers', () => {
      expect(registry.has('missing')).toBe(false);
    });
  });

  describe('listProviders', () => {
    it('should return empty array initially', () => {
      expect(registry.listProviders()).toEqual([]);
    });

    it('should return all registered provider names', () => {
      registry.register('openai', () => makeMockProvider('openai'));
      registry.register('anthropic', () => makeMockProvider('anthropic'));

      const providers = registry.listProviders();
      expect(providers).toContain('openai');
      expect(providers).toContain('anthropic');
      expect(providers).toHaveLength(2);
    });
  });

  describe('create', () => {
    it('should create a provider from config', () => {
      registry.register('openai', (config) => makeMockProvider(config.modelId));

      const provider = registry.create({ provider: 'openai', modelId: 'gpt-4o' });
      expect(provider.name).toBe('gpt-4o');
    });

    it('should pass full config to factory', () => {
      const factorySpy = vi.fn(() => makeMockProvider('test'));
      registry.register('custom', factorySpy);

      const config: LLMProviderConfig = {
        provider: 'custom',
        modelId: 'model-1',
        apiKey: 'key-123',
        baseUrl: 'https://api.custom.com',
        maxRetries: 5,
        timeout: 60_000,
      };

      registry.create(config);

      expect(factorySpy).toHaveBeenCalledWith(config);
    });

    it('should throw for unregistered provider', () => {
      expect(() => registry.create({ provider: 'missing', modelId: 'model' })).toThrow(
        LLMProviderError,
      );
      expect(() => registry.create({ provider: 'missing', modelId: 'model' })).toThrow(
        /No factory registered.*missing/,
      );
    });

    it('should list available providers in error message', () => {
      registry.register('openai', () => makeMockProvider('openai'));
      registry.register('anthropic', () => makeMockProvider('anthropic'));

      try {
        registry.create({ provider: 'missing', modelId: 'model' });
      } catch (error) {
        expect(error).toBeInstanceOf(LLMProviderError);
        expect((error as Error).message).toContain('openai');
        expect((error as Error).message).toContain('anthropic');
      }
    });
  });

  describe('createFromEnv', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should create provider from environment variables', () => {
      process.env['CREWSPACE_LLM_PROVIDER'] = 'openai';
      process.env['CREWSPACE_LLM_MODEL'] = 'gpt-4o';
      process.env['OPENAI_API_KEY'] = 'sk-test-123';

      registry.register('openai', (config) => {
        expect(config.provider).toBe('openai');
        expect(config.modelId).toBe('gpt-4o');
        expect(config.apiKey).toBe('sk-test-123');
        return makeMockProvider('openai');
      });

      const provider = registry.createFromEnv();
      expect(provider.name).toBe('openai');
    });

    it('should throw when CREWSPACE_LLM_PROVIDER is not set', () => {
      delete process.env['CREWSPACE_LLM_PROVIDER'];

      expect(() => registry.createFromEnv()).toThrow(LLMProviderError);
      expect(() => registry.createFromEnv()).toThrow(/CREWSPACE_LLM_PROVIDER/);
    });

    it('should throw when CREWSPACE_LLM_MODEL is not set', () => {
      process.env['CREWSPACE_LLM_PROVIDER'] = 'openai';
      delete process.env['CREWSPACE_LLM_MODEL'];

      expect(() => registry.createFromEnv()).toThrow(LLMProviderError);
      expect(() => registry.createFromEnv()).toThrow(/CREWSPACE_LLM_MODEL/);
    });

    it('should accept overrides that take precedence over env vars', () => {
      process.env['CREWSPACE_LLM_PROVIDER'] = 'openai';
      process.env['CREWSPACE_LLM_MODEL'] = 'gpt-4o';

      registry.register('anthropic', (config) => {
        expect(config.provider).toBe('anthropic');
        expect(config.modelId).toBe('claude-3');
        return makeMockProvider('anthropic');
      });

      const provider = registry.createFromEnv({
        provider: 'anthropic',
        modelId: 'claude-3',
      });

      expect(provider.name).toBe('anthropic');
    });

    it('should read ANTHROPIC_API_KEY for anthropic provider', () => {
      process.env['CREWSPACE_LLM_PROVIDER'] = 'anthropic';
      process.env['CREWSPACE_LLM_MODEL'] = 'claude-3-5-sonnet';
      process.env['ANTHROPIC_API_KEY'] = 'sk-ant-test';

      registry.register('anthropic', (config) => {
        expect(config.apiKey).toBe('sk-ant-test');
        return makeMockProvider('anthropic');
      });

      registry.createFromEnv();
    });

    it('should not require API key for local providers', () => {
      process.env['CREWSPACE_LLM_PROVIDER'] = 'ollama';
      process.env['CREWSPACE_LLM_MODEL'] = 'llama3';

      registry.register('ollama', (config) => {
        expect(config.apiKey).toBeUndefined();
        return makeMockProvider('ollama');
      });

      registry.createFromEnv();
    });
  });

  describe('clear', () => {
    it('should remove all factories', () => {
      registry.register('a', () => makeMockProvider('a'));
      registry.register('b', () => makeMockProvider('b'));

      registry.clear();

      expect(registry.listProviders()).toEqual([]);
      expect(registry.has('a')).toBe(false);
      expect(registry.has('b')).toBe(false);
    });
  });
});
