import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import {
  RateLimiter,
  ToolRateLimitError,
  DEFAULT_RATE_LIMIT,
} from '../../../../src/tools/web/rate-limiter.js';
import { createWebTools } from '../../../../src/tools/web/index.js';
import { ToolExecutionError } from '../../../../src/errors/tool-errors.js';

// ---------------------------------------------------------------------------
// RateLimiter — unit tests
// ---------------------------------------------------------------------------

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should create a limiter with valid config', () => {
      const limiter = new RateLimiter({ maxRequests: 5, windowMs: 1000 });
      expect(limiter.availableTokens).toBe(5);
    });

    it('should throw when maxRequests < 1', () => {
      expect(() => new RateLimiter({ maxRequests: 0, windowMs: 1000 })).toThrow(
        'maxRequests must be >= 1',
      );
    });

    it('should throw when maxRequests is negative', () => {
      expect(() => new RateLimiter({ maxRequests: -5, windowMs: 1000 })).toThrow(
        'maxRequests must be >= 1',
      );
    });

    it('should throw when maxRequests is NaN', () => {
      expect(() => new RateLimiter({ maxRequests: NaN, windowMs: 1000 })).toThrow(
        'maxRequests must be >= 1',
      );
    });

    it('should throw when maxRequests is Infinity', () => {
      expect(() => new RateLimiter({ maxRequests: Infinity, windowMs: 1000 })).toThrow(
        'maxRequests must be >= 1',
      );
    });

    it('should throw when windowMs <= 0', () => {
      expect(() => new RateLimiter({ maxRequests: 5, windowMs: 0 })).toThrow(
        'windowMs must be > 0',
      );
    });

    it('should throw when windowMs is negative', () => {
      expect(() => new RateLimiter({ maxRequests: 5, windowMs: -100 })).toThrow(
        'windowMs must be > 0',
      );
    });

    it('should throw when windowMs is NaN', () => {
      expect(() => new RateLimiter({ maxRequests: 5, windowMs: NaN })).toThrow(
        'windowMs must be > 0',
      );
    });
  });

  describe('consume', () => {
    it('should consume a token on each call', () => {
      const limiter = new RateLimiter({ maxRequests: 3, windowMs: 1000 });
      expect(limiter.availableTokens).toBe(3);

      limiter.consume('testTool');
      expect(limiter.availableTokens).toBe(2);

      limiter.consume('testTool');
      expect(limiter.availableTokens).toBe(1);

      limiter.consume('testTool');
      // After consuming 3rd, should be approximately 0
      expect(limiter.availableTokens).toBeLessThan(1);
    });

    it('should throw ToolRateLimitError when tokens exhausted', () => {
      const limiter = new RateLimiter({ maxRequests: 2, windowMs: 1000 });

      limiter.consume('myTool');
      limiter.consume('myTool');

      expect(() => limiter.consume('myTool')).toThrow(ToolRateLimitError);
    });

    it('should include tool name in error', () => {
      const limiter = new RateLimiter({ maxRequests: 1, windowMs: 1000 });
      limiter.consume('fetchUrl');

      try {
        limiter.consume('fetchUrl');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ToolRateLimitError);
        expect((err as ToolRateLimitError).toolName).toBe('fetchUrl');
      }
    });

    it('should include retryAfterMs in error', () => {
      const limiter = new RateLimiter({ maxRequests: 1, windowMs: 1000 });
      limiter.consume('testTool');

      try {
        limiter.consume('testTool');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ToolRateLimitError);
        expect((err as ToolRateLimitError).retryAfterMs).toBeGreaterThan(0);
      }
    });

    it('should extend ToolExecutionError', () => {
      const limiter = new RateLimiter({ maxRequests: 1, windowMs: 1000 });
      limiter.consume('fetchUrl');

      try {
        limiter.consume('fetchUrl');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ToolExecutionError);
        expect((err as ToolRateLimitError).name).toBe('ToolRateLimitError');
      }
    });
  });

  describe('token refill', () => {
    it('should refill tokens over time', () => {
      const limiter = new RateLimiter({ maxRequests: 10, windowMs: 1000 });

      // Consume all tokens
      for (let i = 0; i < 10; i++) {
        limiter.consume('testTool');
      }
      expect(limiter.availableTokens).toBeLessThan(1);

      // Advance time by full window -> should refill completely
      vi.advanceTimersByTime(1000);
      expect(limiter.availableTokens).toBe(10);
    });

    it('should partially refill tokens', () => {
      const limiter = new RateLimiter({ maxRequests: 10, windowMs: 1000 });

      // Consume all tokens
      for (let i = 0; i < 10; i++) {
        limiter.consume('testTool');
      }

      // Advance by half the window -> should refill ~5 tokens
      vi.advanceTimersByTime(500);
      expect(limiter.availableTokens).toBeCloseTo(5, 0);
    });

    it('should not exceed max tokens', () => {
      const limiter = new RateLimiter({ maxRequests: 5, windowMs: 1000 });

      // Advance a very long time without consuming
      vi.advanceTimersByTime(100_000);
      expect(limiter.availableTokens).toBe(5);
    });

    it('should allow requests again after refill', () => {
      const limiter = new RateLimiter({ maxRequests: 1, windowMs: 1000 });

      limiter.consume('testTool');
      expect(() => limiter.consume('testTool')).toThrow(ToolRateLimitError);

      // Wait for full refill
      vi.advanceTimersByTime(1000);
      expect(() => limiter.consume('testTool')).not.toThrow();
    });
  });

  describe('reset', () => {
    it('should restore full capacity', () => {
      const limiter = new RateLimiter({ maxRequests: 5, windowMs: 1000 });

      for (let i = 0; i < 5; i++) {
        limiter.consume('testTool');
      }
      expect(limiter.availableTokens).toBeLessThan(1);

      limiter.reset();
      expect(limiter.availableTokens).toBe(5);
    });
  });

  describe('availableTokens', () => {
    it('should report correct initial count', () => {
      const limiter = new RateLimiter({ maxRequests: 42, windowMs: 5000 });
      expect(limiter.availableTokens).toBe(42);
    });
  });
});

// ---------------------------------------------------------------------------
// DEFAULT_RATE_LIMIT
// ---------------------------------------------------------------------------

describe('DEFAULT_RATE_LIMIT', () => {
  it('should have expected defaults', () => {
    expect(DEFAULT_RATE_LIMIT.maxRequests).toBe(30);
    expect(DEFAULT_RATE_LIMIT.windowMs).toBe(60_000);
  });
});

// ---------------------------------------------------------------------------
// ToolRateLimitError
// ---------------------------------------------------------------------------

describe('ToolRateLimitError', () => {
  it('should have correct name', () => {
    const err = new ToolRateLimitError('fetchUrl', 500);
    expect(err.name).toBe('ToolRateLimitError');
  });

  it('should include tool name', () => {
    const err = new ToolRateLimitError('webSearch', 1000);
    expect(err.toolName).toBe('webSearch');
  });

  it('should include retryAfterMs', () => {
    const err = new ToolRateLimitError('fetchUrl', 2500);
    expect(err.retryAfterMs).toBe(2500);
  });

  it('should have a descriptive message', () => {
    const err = new ToolRateLimitError('fetchUrl', 1234);
    expect(err.message).toContain('Rate limit exceeded');
    expect(err.message).toContain('1234');
  });

  it('should be an instance of ToolExecutionError', () => {
    const err = new ToolRateLimitError('fetchUrl', 100);
    expect(err).toBeInstanceOf(ToolExecutionError);
  });
});

// ---------------------------------------------------------------------------
// Integration: createWebTools with rate limiting
// ---------------------------------------------------------------------------

describe('createWebTools rate limiting integration', () => {
  it('should create tools with default rate limiter', () => {
    const tools = createWebTools();
    expect(tools.fetchUrl).toBeDefined();
    expect(tools.webSearch).toBeDefined();
    expect(tools.parseHtml).toBeDefined();
  });

  it('should create tools with custom rate limit', () => {
    const tools = createWebTools({
      rateLimit: { maxRequests: 5, windowMs: 10_000 },
    });
    expect(tools.fetchUrl).toBeDefined();
    expect(tools.webSearch).toBeDefined();
  });

  it('should create tools with rate limiting disabled', () => {
    const tools = createWebTools({ rateLimit: false });
    expect(tools.fetchUrl).toBeDefined();
    expect(tools.webSearch).toBeDefined();
  });
});
