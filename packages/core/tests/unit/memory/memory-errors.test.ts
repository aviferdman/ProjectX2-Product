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
    expect(err.message).toContain('sqlite');
    expect(err.message).toContain('bad config');
    expect(err.provider).toBe('sqlite');
  });

  it('is an instance of Error', () => {
    expect(new MemoryConfigError('x')).toBeInstanceOf(Error);
  });

  it('includes provider in toJSON details', () => {
    const err = new MemoryConfigError('bad config', 'sqlite');
    const json = err.toJSON();
    expect(json.details).toEqual({ provider: 'sqlite' });
  });

  it('includes undefined provider in toJSON details when no provider', () => {
    const err = new MemoryConfigError('bad config');
    const json = err.toJSON();
    expect(json.details).toEqual({ provider: undefined });
  });
});

describe('MemoryOperationError', () => {
  it('formats message correctly', () => {
    const err = new MemoryOperationError('short-term', 'add', 'duplicate id');
    expect(err.message).toContain('short-term');
    expect(err.message).toContain('add');
    expect(err.message).toContain('duplicate id');
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

  it('includes provider and operation in toJSON details', () => {
    const err = new MemoryOperationError('sqlite', 'add', 'fail');
    const json = err.toJSON();
    expect(json.details).toEqual({ provider: 'sqlite', operation: 'add' });
  });
});

describe('MemoryQueryError', () => {
  it('formats message correctly', () => {
    const err = new MemoryQueryError('short-term', 'invalid filter');
    expect(err.message).toContain('short-term');
    expect(err.message).toContain('invalid filter');
    expect(err.name).toBe('MemoryQueryError');
    expect(err.provider).toBe('short-term');
  });

  it('is an instance of Error', () => {
    expect(new MemoryQueryError('p', 'm')).toBeInstanceOf(Error);
  });

  it('includes provider in toJSON details', () => {
    const err = new MemoryQueryError('short-term', 'bad filter');
    const json = err.toJSON();
    expect(json.details).toEqual({ provider: 'short-term' });
  });
});
