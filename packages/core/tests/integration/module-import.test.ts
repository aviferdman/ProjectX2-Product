import { describe, it, expect } from 'vitest';
import { VERSION } from '../../src/index.js';

describe('Core Package Integration', () => {
  it('should be importable as a module', () => {
    expect(VERSION).toBe('0.1.0');
  });
});
