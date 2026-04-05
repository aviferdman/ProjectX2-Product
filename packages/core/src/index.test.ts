import { describe, it, expect } from 'vitest';
import { VERSION } from './index';

describe('@crewspace/core', () => {
  describe('VERSION export', () => {
    it('should export VERSION constant', () => {
      expect(VERSION).toBeDefined();
    });

    it('should have VERSION matching package.json version', () => {
      expect(VERSION).toBe('0.1.0');
    });

    it('should be a string', () => {
      expect(typeof VERSION).toBe('string');
    });

    it('should follow semver format', () => {
      const semverRegex = /^\d+\.\d+\.\d+$/;
      expect(VERSION).toMatch(semverRegex);
    });
  });
});
