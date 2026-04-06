<<<<<<< HEAD
/**
 * Tests for memory error classes.
 */

=======
>>>>>>> agent/developer/development-developer-c66
import { describe, expect, it } from 'vitest';

import {
  MemoryConfigError,
  MemoryOperationError,
  MemoryQueryError,
} from '../../../src/errors/memory-errors.js';

describe('MemoryConfigError', () => {
  it('formats message without provider', () => {
    const err = new MemoryConfigError('bad config');
    expect(err.message).toBe('bad config');
    expect(err.name).toBe('MemoryConfigError');
    expect(err.provider).toBeUndefined();
  });

  it('formats message with provider', () => {
    const err = new MemoryConfigError('bad config', 'sqlite');
    expect(err.message).toBe('Memory provider "sqlite": bad config');
    expect(err.provider).toBe('sqlite');
  });

  it('is an instance of Error', () => {
    expect(new MemoryConfigError('x')).toBeInstanceOf(Error);
  });
});

describe('MemoryOperationError', () => {
  it('formats message correctly', () => {
    const err = new MemoryOperationError('short-term', 'add', 'duplicate id');
    expect(err.message).toBe('Memory "short-term" add failed: duplicate id');
    expect(err.name).toBe('MemoryOperationError');
    expect(err.provider).toBe('short-term');
    expect(err.operation).toBe('add');
    expect(err.cause).toBeUndefined();
  });

  it('includes cause when provided', () => {
    const cause = new Error('root cause');
    const err = new MemoryOperationError('sqlite', 'query', 'failed', cause);
    expect(err.cause).toBe(cause);
  });

  it('is an instance of Error', () => {
    expect(new MemoryOperationError('p', 'op', 'm')).toBeInstanceOf(Error);
  });
});

describe('MemoryQueryError', () => {
  it('formats message correctly', () => {
    const err = new MemoryQueryError('short-term', 'invalid filter');
    expect(err.message).toBe('Memory "short-term" query error: invalid filter');
    expect(err.name).toBe('MemoryQueryError');
    expect(err.provider).toBe('short-term');
  });

  it('is an instance of Error', () => {
    expect(new MemoryQueryError('p', 'm')).toBeInstanceOf(Error);
  });
<<<<<<< HEAD
});
=======
});
>>>>>>> agent/developer/development-developer-c66
