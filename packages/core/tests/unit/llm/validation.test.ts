import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import {
  LLMMessageSchema,
  LLMMessagesSchema,
  LLMModelInfoSchema,
  LLMProviderConfigSchema,
  LLMRequestOptionsSchema,
  validateLLMMessages,
  validateLLMProviderConfig,
} from '../../../src/llm/validation.js';
import { LLMRole } from '../../../src/types/llm.js';

// ---------------------------------------------------------------------------
// LLMRequestOptionsSchema
// ---------------------------------------------------------------------------

describe('LLMRequestOptionsSchema', () => {
  it('should accept valid options with all fields', () => {
    const result = LLMRequestOptionsSchema.parse({
      temperature: 0.7,
      maxTokens: 1024,
      stopSequences: ['END', 'STOP'],
    });
    expect(result.temperature).toBe(0.7);
    expect(result.maxTokens).toBe(1024);
    expect(result.stopSequences).toEqual(['END', 'STOP']);
  });

  it('should accept empty object', () => {
    const result = LLMRequestOptionsSchema.parse({});
    expect(result).toEqual({});
  });

  it('should reject temperature below 0', () => {
    expect(() => LLMRequestOptionsSchema.parse({ temperature: -0.1 })).toThrow(ZodError);
  });

  it('should reject temperature above 2', () => {
    expect(() => LLMRequestOptionsSchema.parse({ temperature: 2.1 })).toThrow(ZodError);
  });

  it('should accept temperature of exactly 0', () => {
    const result = LLMRequestOptionsSchema.parse({ temperature: 0 });
    expect(result.temperature).toBe(0);
  });

  it('should accept temperature of exactly 2', () => {
    const result = LLMRequestOptionsSchema.parse({ temperature: 2 });
    expect(result.temperature).toBe(2);
  });

  it('should reject non-integer maxTokens', () => {
    expect(() => LLMRequestOptionsSchema.parse({ maxTokens: 1024.5 })).toThrow(ZodError);
  });

  it('should reject non-positive maxTokens', () => {
    expect(() => LLMRequestOptionsSchema.parse({ maxTokens: 0 })).toThrow(ZodError);
    expect(() => LLMRequestOptionsSchema.parse({ maxTokens: -1 })).toThrow(ZodError);
  });

  it('should reject unknown properties in strict mode', () => {
    expect(() => LLMRequestOptionsSchema.parse({ temperature: 0.5, unknownField: true })).toThrow(
      ZodError,
    );
  });
});

// ---------------------------------------------------------------------------
// LLMMessageSchema
// ---------------------------------------------------------------------------

describe('LLMMessageSchema', () => {
  it('should accept a valid user message', () => {
    const result = LLMMessageSchema.parse({
      role: LLMRole.USER,
      content: 'Hello, world!',
    });
    expect(result.role).toBe(LLMRole.USER);
    expect(result.content).toBe('Hello, world!');
  });

  it('should accept all valid roles', () => {
    for (const role of Object.values(LLMRole)) {
      const result = LLMMessageSchema.parse({ role, content: 'test' });
      expect(result.role).toBe(role);
    }
  });

  it('should accept optional name field', () => {
    const result = LLMMessageSchema.parse({
      role: LLMRole.TOOL,
      content: 'result data',
      name: 'search_tool',
    });
    expect(result.name).toBe('search_tool');
  });

  it('should reject empty content', () => {
    expect(() => LLMMessageSchema.parse({ role: LLMRole.USER, content: '' })).toThrow(ZodError);
  });

  it('should reject invalid role', () => {
    expect(() => LLMMessageSchema.parse({ role: 'invalid', content: 'test' })).toThrow(ZodError);
  });
});

// ---------------------------------------------------------------------------
// LLMMessagesSchema
// ---------------------------------------------------------------------------

describe('LLMMessagesSchema', () => {
  it('should accept valid messages with at least one user message', () => {
    const result = LLMMessagesSchema.parse([
      { role: LLMRole.SYSTEM, content: 'You are helpful.' },
      { role: LLMRole.USER, content: 'Hello' },
    ]);
    expect(result).toHaveLength(2);
  });

  it('should accept a single user message', () => {
    const result = LLMMessagesSchema.parse([{ role: LLMRole.USER, content: 'Hello' }]);
    expect(result).toHaveLength(1);
  });

  it('should accept a single system message', () => {
    const result = LLMMessagesSchema.parse([{ role: LLMRole.SYSTEM, content: 'System prompt' }]);
    expect(result).toHaveLength(1);
  });

  it('should reject empty array', () => {
    expect(() => LLMMessagesSchema.parse([])).toThrow(ZodError);
  });

  it('should reject messages with only assistant role', () => {
    expect(() =>
      LLMMessagesSchema.parse([{ role: LLMRole.ASSISTANT, content: 'response' }]),
    ).toThrow(ZodError);
  });

  it('should reject messages with only tool role', () => {
    expect(() =>
      LLMMessagesSchema.parse([{ role: LLMRole.TOOL, content: 'result', name: 'tool' }]),
    ).toThrow(ZodError);
  });

  it('should accept tool messages alongside user messages', () => {
    const result = LLMMessagesSchema.parse([
      { role: LLMRole.USER, content: 'Query' },
      { role: LLMRole.TOOL, content: 'Data', name: 'search' },
    ]);
    expect(result).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// LLMProviderConfigSchema
// ---------------------------------------------------------------------------

describe('LLMProviderConfigSchema', () => {
  const validConfig = {
    provider: 'openai',
    modelId: 'gpt-4o',
  };

  it('should accept minimal valid config', () => {
    const result = LLMProviderConfigSchema.parse(validConfig);
    expect(result.provider).toBe('openai');
    expect(result.modelId).toBe('gpt-4o');
  });

  it('should accept full config with all optional fields', () => {
    const result = LLMProviderConfigSchema.parse({
      ...validConfig,
      apiKey: 'sk-test-key-123',
      baseUrl: 'https://api.openai.com/v1',
      maxRetries: 5,
      timeout: 60_000,
      defaultOptions: { temperature: 0.7, maxTokens: 2048 },
    });
    expect(result.apiKey).toBe('sk-test-key-123');
    expect(result.baseUrl).toBe('https://api.openai.com/v1');
    expect(result.maxRetries).toBe(5);
    expect(result.timeout).toBe(60_000);
    expect(result.defaultOptions?.temperature).toBe(0.7);
  });

  it('should reject empty provider name', () => {
    expect(() => LLMProviderConfigSchema.parse({ provider: '', modelId: 'gpt-4o' })).toThrow(
      ZodError,
    );
  });

  it('should reject provider name starting with uppercase', () => {
    expect(() => LLMProviderConfigSchema.parse({ provider: 'OpenAI', modelId: 'gpt-4o' })).toThrow(
      ZodError,
    );
  });

  it('should reject provider name starting with digit', () => {
    expect(() => LLMProviderConfigSchema.parse({ provider: '1openai', modelId: 'gpt-4o' })).toThrow(
      ZodError,
    );
  });

  it('should accept provider names with hyphens and underscores', () => {
    const result = LLMProviderConfigSchema.parse({
      provider: 'my-custom_provider',
      modelId: 'model-1',
    });
    expect(result.provider).toBe('my-custom_provider');
  });

  it('should reject empty modelId', () => {
    expect(() => LLMProviderConfigSchema.parse({ provider: 'openai', modelId: '' })).toThrow(
      ZodError,
    );
  });

  it('should reject empty apiKey', () => {
    expect(() => LLMProviderConfigSchema.parse({ ...validConfig, apiKey: '' })).toThrow(ZodError);
  });

  it('should reject invalid baseUrl', () => {
    expect(() => LLMProviderConfigSchema.parse({ ...validConfig, baseUrl: 'not-a-url' })).toThrow(
      ZodError,
    );
  });

  it('should reject negative maxRetries', () => {
    expect(() => LLMProviderConfigSchema.parse({ ...validConfig, maxRetries: -1 })).toThrow(
      ZodError,
    );
  });

  it('should accept maxRetries of 0', () => {
    const result = LLMProviderConfigSchema.parse({
      ...validConfig,
      maxRetries: 0,
    });
    expect(result.maxRetries).toBe(0);
  });

  it('should reject maxRetries above 10', () => {
    expect(() => LLMProviderConfigSchema.parse({ ...validConfig, maxRetries: 11 })).toThrow(
      ZodError,
    );
  });

  it('should reject timeout below 1000ms', () => {
    expect(() => LLMProviderConfigSchema.parse({ ...validConfig, timeout: 500 })).toThrow(ZodError);
  });

  it('should reject timeout above 300000ms', () => {
    expect(() => LLMProviderConfigSchema.parse({ ...validConfig, timeout: 300_001 })).toThrow(
      ZodError,
    );
  });

  it('should accept boundary timeout values', () => {
    const low = LLMProviderConfigSchema.parse({
      ...validConfig,
      timeout: 1_000,
    });
    expect(low.timeout).toBe(1_000);

    const high = LLMProviderConfigSchema.parse({
      ...validConfig,
      timeout: 300_000,
    });
    expect(high.timeout).toBe(300_000);
  });

  it('should validate nested defaultOptions', () => {
    expect(() =>
      LLMProviderConfigSchema.parse({
        ...validConfig,
        defaultOptions: { temperature: 3 },
      }),
    ).toThrow(ZodError);
  });
});

// ---------------------------------------------------------------------------
// LLMModelInfoSchema
// ---------------------------------------------------------------------------

describe('LLMModelInfoSchema', () => {
  const validModelInfo = {
    modelId: 'gpt-4o',
    provider: 'openai',
    displayName: 'GPT-4o',
    maxContextTokens: 128_000,
    maxOutputTokens: 16_384,
    supportsStreaming: true,
    costPer1kInputTokens: 0.0025,
    costPer1kOutputTokens: 0.01,
  };

  it('should accept valid model info', () => {
    const result = LLMModelInfoSchema.parse(validModelInfo);
    expect(result.modelId).toBe('gpt-4o');
  });

  it('should accept model info without cost fields', () => {
    const { costPer1kInputTokens, costPer1kOutputTokens, ...noCost } = validModelInfo;
    const result = LLMModelInfoSchema.parse(noCost);
    expect(result.costPer1kInputTokens).toBeUndefined();
    expect(result.costPer1kOutputTokens).toBeUndefined();
    // Suppress unused variable warnings
    void costPer1kInputTokens;
    void costPer1kOutputTokens;
  });

  it('should reject negative context tokens', () => {
    expect(() => LLMModelInfoSchema.parse({ ...validModelInfo, maxContextTokens: -1 })).toThrow(
      ZodError,
    );
  });

  it('should reject empty modelId', () => {
    expect(() => LLMModelInfoSchema.parse({ ...validModelInfo, modelId: '' })).toThrow(ZodError);
  });

  it('should reject negative cost values', () => {
    expect(() =>
      LLMModelInfoSchema.parse({
        ...validModelInfo,
        costPer1kInputTokens: -0.001,
      }),
    ).toThrow(ZodError);
  });
});

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

describe('validateLLMProviderConfig', () => {
  it('should return parsed config on valid input', () => {
    const result = validateLLMProviderConfig({
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20241022',
      apiKey: 'sk-ant-test',
    });
    expect(result.provider).toBe('anthropic');
  });

  it('should throw ZodError on invalid input', () => {
    expect(() => validateLLMProviderConfig({ provider: '' })).toThrow(ZodError);
  });
});

describe('validateLLMMessages', () => {
  it('should return parsed messages on valid input', () => {
    const result = validateLLMMessages([{ role: LLMRole.USER, content: 'test' }]);
    expect(result).toHaveLength(1);
  });

  it('should throw ZodError on empty array', () => {
    expect(() => validateLLMMessages([])).toThrow(ZodError);
  });

  it('should throw ZodError on non-array input', () => {
    expect(() => validateLLMMessages('not an array')).toThrow(ZodError);
  });
});
