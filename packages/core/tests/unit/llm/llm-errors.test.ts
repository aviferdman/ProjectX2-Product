import { describe, expect, it } from 'vitest';

import {
  LLMAuthenticationError,
  LLMContextLengthError,
  LLMProviderError,
  LLMRateLimitError,
  LLMStreamError,
} from '../../../src/errors/llm-errors.js';

describe('LLM Error Classes', () => {
  describe('LLMProviderError', () => {
    it('should format message with provider name', () => {
      const error = new LLMProviderError('openai', 'Something went wrong');
      expect(error.message).toBe('LLM provider "openai": Something went wrong');
      expect(error.name).toBe('LLMProviderError');
      expect(error.provider).toBe('openai');
    });

    it('should store status code', () => {
      const error = new LLMProviderError('openai', 'Server error', 500);
      expect(error.statusCode).toBe(500);
    });

    it('should store cause', () => {
      const cause = new Error('network failure');
      const error = new LLMProviderError('openai', 'Request failed', 500, cause);
      expect(error.cause).toBe(cause);
    });

    it('should have undefined statusCode when not provided', () => {
      const error = new LLMProviderError('openai', 'Generic error');
      expect(error.statusCode).toBeUndefined();
    });

    it('should be instanceof Error', () => {
      const error = new LLMProviderError('openai', 'test');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(LLMProviderError);
    });
  });

  describe('LLMRateLimitError', () => {
    it('should set status code to 429', () => {
      const error = new LLMRateLimitError('openai', 'Rate limited');
      expect(error.statusCode).toBe(429);
      expect(error.name).toBe('LLMRateLimitError');
    });

    it('should store retryAfterMs', () => {
      const error = new LLMRateLimitError('openai', 'Rate limited', 5000);
      expect(error.retryAfterMs).toBe(5000);
    });

    it('should have undefined retryAfterMs when not provided', () => {
      const error = new LLMRateLimitError('openai', 'Rate limited');
      expect(error.retryAfterMs).toBeUndefined();
    });

    it('should be instanceof LLMProviderError', () => {
      const error = new LLMRateLimitError('openai', 'Rate limited');
      expect(error).toBeInstanceOf(LLMProviderError);
    });

    it('should store cause', () => {
      const cause = new Error('upstream 429');
      const error = new LLMRateLimitError('openai', 'Rate limited', 5000, cause);
      expect(error.cause).toBe(cause);
    });
  });

  describe('LLMAuthenticationError', () => {
    it('should set status code to 401', () => {
      const error = new LLMAuthenticationError('openai', 'Invalid API key');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('LLMAuthenticationError');
    });

    it('should be instanceof LLMProviderError', () => {
      const error = new LLMAuthenticationError('openai', 'Invalid API key');
      expect(error).toBeInstanceOf(LLMProviderError);
    });

    it('should store cause', () => {
      const cause = new Error('401 Unauthorized');
      const error = new LLMAuthenticationError('openai', 'Invalid API key', cause);
      expect(error.cause).toBe(cause);
    });
  });

  describe('LLMContextLengthError', () => {
    it('should set status code to 400', () => {
      const error = new LLMContextLengthError('openai', 'Context too long');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('LLMContextLengthError');
    });

    it('should store token counts', () => {
      const error = new LLMContextLengthError('openai', 'Context too long', 200_000, 128_000);
      expect(error.requestTokens).toBe(200_000);
      expect(error.maxTokens).toBe(128_000);
    });

    it('should have undefined token counts when not provided', () => {
      const error = new LLMContextLengthError('openai', 'Context too long');
      expect(error.requestTokens).toBeUndefined();
      expect(error.maxTokens).toBeUndefined();
    });

    it('should be instanceof LLMProviderError', () => {
      const error = new LLMContextLengthError('openai', 'Context too long');
      expect(error).toBeInstanceOf(LLMProviderError);
    });
  });

  describe('LLMStreamError', () => {
    it('should store chunksReceived and partialContent', () => {
      const error = new LLMStreamError('anthropic', 'Connection reset', 5, 'partial output here');
      expect(error.name).toBe('LLMStreamError');
      expect(error.chunksReceived).toBe(5);
      expect(error.partialContent).toBe('partial output here');
      expect(error.provider).toBe('anthropic');
    });

    it('should have undefined statusCode', () => {
      const error = new LLMStreamError('anthropic', 'Stream failed', 0, '');
      expect(error.statusCode).toBeUndefined();
    });

    it('should be instanceof LLMProviderError', () => {
      const error = new LLMStreamError('anthropic', 'Stream failed', 0, '');
      expect(error).toBeInstanceOf(LLMProviderError);
    });

    it('should store cause', () => {
      const cause = new Error('Socket hang up');
      const error = new LLMStreamError('anthropic', 'Stream failed', 3, 'partial', cause);
      expect(error.cause).toBe(cause);
    });
  });

  describe('error hierarchy', () => {
    it('should catch all LLM errors with LLMProviderError', () => {
      const errors: Error[] = [
        new LLMProviderError('a', 'base'),
        new LLMRateLimitError('b', 'rate'),
        new LLMAuthenticationError('c', 'auth'),
        new LLMContextLengthError('d', 'ctx'),
        new LLMStreamError('e', 'stream', 0, ''),
      ];

      for (const error of errors) {
        expect(error).toBeInstanceOf(LLMProviderError);
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});
