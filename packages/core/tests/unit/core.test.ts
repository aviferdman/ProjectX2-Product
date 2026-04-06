import { describe, it, expect } from 'vitest';
import { VERSION } from '../../src/index.js';

describe('Core Package', () => {
  it('should export a version string', () => {
    expect(VERSION).toBeDefined();
    expect(typeof VERSION).toBe('string');
  });

  it('should follow semver format', () => {
    const semverRegex = /^\d+\.\d+\.\d+$/;
    expect(VERSION).toMatch(semverRegex);
  });
});
