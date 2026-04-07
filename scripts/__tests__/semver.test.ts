import { describe, it, expect } from 'vitest';
import {
  isValidSemver,
  parseSemver,
  formatSemver,
  compareSemver,
  bumpVersion,
  inferBumpType,
  sortVersions,
} from '../semver.js';

describe('semver', () => {
  describe('isValidSemver', () => {
    it('accepts standard versions', () => {
      expect(isValidSemver('0.0.0')).toBe(true);
      expect(isValidSemver('0.1.0')).toBe(true);
      expect(isValidSemver('1.0.0')).toBe(true);
      expect(isValidSemver('1.2.3')).toBe(true);
      expect(isValidSemver('10.20.30')).toBe(true);
    });

    it('accepts prerelease versions', () => {
      expect(isValidSemver('1.0.0-alpha')).toBe(true);
      expect(isValidSemver('1.0.0-alpha.1')).toBe(true);
      expect(isValidSemver('1.0.0-0.3.7')).toBe(true);
      expect(isValidSemver('1.0.0-x.7.z.92')).toBe(true);
      expect(isValidSemver('1.0.0-beta.11')).toBe(true);
    });

    it('accepts versions with build metadata', () => {
      expect(isValidSemver('1.0.0+build.1')).toBe(true);
      expect(isValidSemver('1.0.0+20130313144700')).toBe(true);
      expect(isValidSemver('1.0.0-beta+exp.sha.5114f85')).toBe(true);
    });

    it('rejects invalid versions', () => {
      expect(isValidSemver('')).toBe(false);
      expect(isValidSemver('v1.0.0')).toBe(false);
      expect(isValidSemver('1')).toBe(false);
      expect(isValidSemver('1.0')).toBe(false);
      expect(isValidSemver('1.0.0.0')).toBe(false);
      expect(isValidSemver('foo')).toBe(false);
      expect(isValidSemver('01.0.0')).toBe(false);
      expect(isValidSemver('1.02.0')).toBe(false);
      expect(isValidSemver('1.0.03')).toBe(false);
    });
  });

  describe('parseSemver', () => {
    it('parses standard version', () => {
      const v = parseSemver('1.2.3');
      expect(v).toEqual({ major: 1, minor: 2, patch: 3, prerelease: [], build: [] });
    });

    it('parses version with prerelease', () => {
      const v = parseSemver('1.0.0-alpha.1');
      expect(v).toEqual({ major: 1, minor: 0, patch: 0, prerelease: ['alpha', '1'], build: [] });
    });

    it('parses version with build metadata', () => {
      const v = parseSemver('1.0.0+build.123');
      expect(v).toEqual({ major: 1, minor: 0, patch: 0, prerelease: [], build: ['build', '123'] });
    });

    it('parses version with prerelease and build', () => {
      const v = parseSemver('1.0.0-beta.1+sha.abc');
      expect(v).toEqual({
        major: 1,
        minor: 0,
        patch: 0,
        prerelease: ['beta', '1'],
        build: ['sha', 'abc'],
      });
    });

    it('returns null for invalid version', () => {
      expect(parseSemver('')).toBeNull();
      expect(parseSemver('v1.0.0')).toBeNull();
      expect(parseSemver('not-a-version')).toBeNull();
    });

    it('parses zero version', () => {
      const v = parseSemver('0.0.0');
      expect(v).toEqual({ major: 0, minor: 0, patch: 0, prerelease: [], build: [] });
    });
  });

  describe('formatSemver', () => {
    it('formats standard version', () => {
      expect(formatSemver({ major: 1, minor: 2, patch: 3, prerelease: [], build: [] })).toBe(
        '1.2.3',
      );
    });

    it('formats version with prerelease', () => {
      expect(
        formatSemver({ major: 1, minor: 0, patch: 0, prerelease: ['beta', '1'], build: [] }),
      ).toBe('1.0.0-beta.1');
    });

    it('formats version with build metadata', () => {
      expect(formatSemver({ major: 1, minor: 0, patch: 0, prerelease: [], build: ['abc'] })).toBe(
        '1.0.0+abc',
      );
    });

    it('roundtrips through parse and format', () => {
      const versions = ['0.1.0', '1.0.0-alpha.1', '2.3.4+build', '1.0.0-rc.1+sha.def'];
      for (const v of versions) {
        const parsed = parseSemver(v);
        expect(parsed).not.toBeNull();
        expect(formatSemver(parsed!)).toBe(v);
      }
    });
  });

  describe('compareSemver', () => {
    it('compares major versions', () => {
      expect(compareSemver('2.0.0', '1.0.0')).toBeGreaterThan(0);
      expect(compareSemver('1.0.0', '2.0.0')).toBeLessThan(0);
    });

    it('compares minor versions', () => {
      expect(compareSemver('1.2.0', '1.1.0')).toBeGreaterThan(0);
      expect(compareSemver('1.1.0', '1.2.0')).toBeLessThan(0);
    });

    it('compares patch versions', () => {
      expect(compareSemver('1.0.2', '1.0.1')).toBeGreaterThan(0);
      expect(compareSemver('1.0.1', '1.0.2')).toBeLessThan(0);
    });

    it('returns zero for equal versions', () => {
      expect(compareSemver('1.0.0', '1.0.0')).toBe(0);
      expect(compareSemver('0.1.0', '0.1.0')).toBe(0);
    });

    it('prerelease has lower precedence than release', () => {
      expect(compareSemver('1.0.0-alpha', '1.0.0')).toBeLessThan(0);
      expect(compareSemver('1.0.0', '1.0.0-alpha')).toBeGreaterThan(0);
    });

    it('compares prerelease identifiers numerically', () => {
      expect(compareSemver('1.0.0-alpha.2', '1.0.0-alpha.1')).toBeGreaterThan(0);
      expect(compareSemver('1.0.0-alpha.1', '1.0.0-alpha.2')).toBeLessThan(0);
    });

    it('numeric identifiers have lower precedence than string', () => {
      expect(compareSemver('1.0.0-1', '1.0.0-alpha')).toBeLessThan(0);
    });

    it('longer prerelease has higher precedence when prefix matches', () => {
      expect(compareSemver('1.0.0-alpha.1', '1.0.0-alpha')).toBeGreaterThan(0);
    });

    it('ignores build metadata', () => {
      expect(compareSemver('1.0.0+build.1', '1.0.0+build.2')).toBe(0);
    });

    it('throws for invalid versions', () => {
      expect(() => compareSemver('invalid', '1.0.0')).toThrow();
      expect(() => compareSemver('1.0.0', 'invalid')).toThrow();
    });

    it('accepts parsed SemverVersion objects', () => {
      const a = parseSemver('1.0.0')!;
      const b = parseSemver('2.0.0')!;
      expect(compareSemver(a, b)).toBeLessThan(0);
    });
  });

  describe('bumpVersion', () => {
    it('bumps major version', () => {
      expect(bumpVersion('1.2.3', 'major')).toBe('2.0.0');
      expect(bumpVersion('0.1.0', 'major')).toBe('1.0.0');
    });

    it('bumps minor version', () => {
      expect(bumpVersion('1.2.3', 'minor')).toBe('1.3.0');
      expect(bumpVersion('0.0.0', 'minor')).toBe('0.1.0');
    });

    it('bumps patch version', () => {
      expect(bumpVersion('1.2.3', 'patch')).toBe('1.2.4');
      expect(bumpVersion('0.1.0', 'patch')).toBe('0.1.1');
    });

    it('patch on prerelease drops prerelease', () => {
      expect(bumpVersion('1.2.3-beta.1', 'patch')).toBe('1.2.3');
    });

    it('bumps premajor', () => {
      expect(bumpVersion('1.2.3', 'premajor')).toBe('2.0.0-0');
    });

    it('bumps premajor with preid', () => {
      expect(bumpVersion('1.2.3', 'premajor', 'alpha')).toBe('2.0.0-alpha.0');
    });

    it('bumps preminor', () => {
      expect(bumpVersion('1.2.3', 'preminor')).toBe('1.3.0-0');
    });

    it('bumps preminor with preid', () => {
      expect(bumpVersion('1.2.3', 'preminor', 'beta')).toBe('1.3.0-beta.0');
    });

    it('bumps prepatch', () => {
      expect(bumpVersion('1.2.3', 'prepatch')).toBe('1.2.4-0');
    });

    it('bumps prepatch with preid', () => {
      expect(bumpVersion('1.2.3', 'prepatch', 'rc')).toBe('1.2.4-rc.0');
    });

    it('bumps prerelease from existing prerelease', () => {
      expect(bumpVersion('1.0.0-beta.0', 'prerelease')).toBe('1.0.0-beta.1');
      expect(bumpVersion('1.0.0-beta.9', 'prerelease')).toBe('1.0.0-beta.10');
    });

    it('bumps prerelease from stable version', () => {
      expect(bumpVersion('1.2.3', 'prerelease')).toBe('1.2.4-0');
    });

    it('bumps prerelease from stable with preid', () => {
      expect(bumpVersion('1.2.3', 'prerelease', 'alpha')).toBe('1.2.4-alpha.0');
    });

    it('throws for invalid version', () => {
      expect(() => bumpVersion('invalid', 'patch')).toThrow('Invalid semver');
    });
  });

  describe('inferBumpType', () => {
    it('infers major bump', () => {
      expect(inferBumpType('1.0.0', '2.0.0')).toBe('major');
    });

    it('infers minor bump', () => {
      expect(inferBumpType('1.0.0', '1.1.0')).toBe('minor');
    });

    it('infers patch bump', () => {
      expect(inferBumpType('1.0.0', '1.0.1')).toBe('patch');
    });

    it('infers prerelease bump', () => {
      expect(inferBumpType('1.0.0', '1.0.1-beta.0')).toBe('prerelease');
    });

    it('returns null when to is not greater', () => {
      expect(inferBumpType('1.0.0', '1.0.0')).toBeNull();
      expect(inferBumpType('2.0.0', '1.0.0')).toBeNull();
    });

    it('returns null for invalid versions', () => {
      expect(inferBumpType('invalid', '1.0.0')).toBeNull();
      expect(inferBumpType('1.0.0', 'invalid')).toBeNull();
    });
  });

  describe('sortVersions', () => {
    it('sorts versions in ascending order', () => {
      const versions = ['2.0.0', '0.1.0', '1.0.0', '0.1.0-alpha', '1.0.0-beta.1'];
      expect(sortVersions(versions)).toEqual([
        '0.1.0-alpha',
        '0.1.0',
        '1.0.0-beta.1',
        '1.0.0',
        '2.0.0',
      ]);
    });

    it('places invalid versions at the end', () => {
      const versions = ['1.0.0', 'invalid', '0.1.0'];
      expect(sortVersions(versions)).toEqual(['0.1.0', '1.0.0', 'invalid']);
    });

    it('handles empty array', () => {
      expect(sortVersions([])).toEqual([]);
    });

    it('does not mutate the original array', () => {
      const versions = ['2.0.0', '1.0.0'];
      sortVersions(versions);
      expect(versions).toEqual(['2.0.0', '1.0.0']);
    });
  });
});
