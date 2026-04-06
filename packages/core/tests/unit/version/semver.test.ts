import { describe, it, expect } from 'vitest';
import {
  parseSemVer,
  isValidSemVer,
  formatSemVer,
  compareSemVer,
  bumpVersion,
} from '../../../src/version/semver.js';
import type { SemVer } from '../../../src/version/semver.js';

describe('parseSemVer', () => {
  it('should parse a simple version', () => {
    const result = parseSemVer('1.2.3');
    expect(result).toEqual({ major: 1, minor: 2, patch: 3 });
  });

  it('should parse version 0.0.0', () => {
    expect(parseSemVer('0.0.0')).toEqual({ major: 0, minor: 0, patch: 0 });
  });

  it('should parse version with prerelease', () => {
    const result = parseSemVer('1.0.0-alpha.1');
    expect(result).toEqual({ major: 1, minor: 0, patch: 0, prerelease: ['alpha', '1'] });
  });

  it('should parse version with build metadata', () => {
    const result = parseSemVer('1.0.0+build.123');
    expect(result).toEqual({ major: 1, minor: 0, patch: 0, build: ['build', '123'] });
  });

  it('should parse version with both prerelease and build', () => {
    const result = parseSemVer('1.0.0-beta.2+build.456');
    expect(result).toEqual({ major: 1, minor: 0, patch: 0, prerelease: ['beta', '2'] });
  });

  it('should trim whitespace', () => {
    expect(parseSemVer('  1.2.3  ')).toEqual({ major: 1, minor: 2, patch: 3 });
  });

  it('should return null for invalid versions', () => {
    expect(parseSemVer('')).toBeNull();
    expect(parseSemVer('1')).toBeNull();
    expect(parseSemVer('1.2')).toBeNull();
    expect(parseSemVer('v1.2.3')).toBeNull();
    expect(parseSemVer('1.2.3.4')).toBeNull();
    expect(parseSemVer('a.b.c')).toBeNull();
    expect(parseSemVer('01.2.3')).toBeNull();
    expect(parseSemVer('1.02.3')).toBeNull();
  });
});

describe('isValidSemVer', () => {
  it('should return true for valid versions', () => {
    expect(isValidSemVer('0.1.0')).toBe(true);
    expect(isValidSemVer('1.0.0')).toBe(true);
    expect(isValidSemVer('1.0.0-alpha')).toBe(true);
    expect(isValidSemVer('1.0.0+build')).toBe(true);
  });

  it('should return false for invalid versions', () => {
    expect(isValidSemVer('not-a-version')).toBe(false);
    expect(isValidSemVer('1.2')).toBe(false);
    expect(isValidSemVer('')).toBe(false);
  });
});

describe('formatSemVer', () => {
  it('should format a simple version', () => {
    expect(formatSemVer({ major: 1, minor: 2, patch: 3 })).toBe('1.2.3');
  });

  it('should format with prerelease', () => {
    expect(formatSemVer({ major: 1, minor: 0, patch: 0, prerelease: ['alpha', '1'] })).toBe(
      '1.0.0-alpha.1',
    );
  });

  it('should format with build metadata', () => {
    expect(formatSemVer({ major: 1, minor: 0, patch: 0, build: ['build', '42'] })).toBe(
      '1.0.0+build.42',
    );
  });

  it('should roundtrip parse -> format', () => {
    const versions = ['0.1.0', '1.0.0', '2.3.4-beta.1', '1.0.0+meta'];
    for (const v of versions) {
      const parsed = parseSemVer(v);
      expect(parsed).not.toBeNull();
      expect(formatSemVer(parsed!)).toBe(v);
    }
  });
});

describe('compareSemVer', () => {
  it('should compare major versions', () => {
    const a: SemVer = { major: 2, minor: 0, patch: 0 };
    const b: SemVer = { major: 1, minor: 0, patch: 0 };
    expect(compareSemVer(a, b)).toBe(1);
    expect(compareSemVer(b, a)).toBe(-1);
  });

  it('should compare minor versions', () => {
    const a: SemVer = { major: 1, minor: 2, patch: 0 };
    const b: SemVer = { major: 1, minor: 1, patch: 0 };
    expect(compareSemVer(a, b)).toBe(1);
  });

  it('should compare patch versions', () => {
    const a: SemVer = { major: 1, minor: 0, patch: 2 };
    const b: SemVer = { major: 1, minor: 0, patch: 1 };
    expect(compareSemVer(a, b)).toBe(1);
  });

  it('should return 0 for equal versions', () => {
    const v: SemVer = { major: 1, minor: 2, patch: 3 };
    expect(compareSemVer(v, v)).toBe(0);
  });

  it('should rank release higher than prerelease', () => {
    const release: SemVer = { major: 1, minor: 0, patch: 0 };
    const prerelease: SemVer = { major: 1, minor: 0, patch: 0, prerelease: ['alpha'] };
    expect(compareSemVer(release, prerelease)).toBe(1);
    expect(compareSemVer(prerelease, release)).toBe(-1);
  });

  it('should compare prerelease identifiers', () => {
    const alpha: SemVer = { major: 1, minor: 0, patch: 0, prerelease: ['alpha'] };
    const beta: SemVer = { major: 1, minor: 0, patch: 0, prerelease: ['beta'] };
    expect(compareSemVer(alpha, beta)).toBe(-1);
  });

  it('should compare numeric prerelease identifiers', () => {
    const v1: SemVer = { major: 1, minor: 0, patch: 0, prerelease: ['alpha', '1'] };
    const v2: SemVer = { major: 1, minor: 0, patch: 0, prerelease: ['alpha', '2'] };
    expect(compareSemVer(v1, v2)).toBe(-1);
    expect(compareSemVer(v2, v1)).toBe(1);
  });

  it('should rank numeric < string in prerelease', () => {
    const num: SemVer = { major: 1, minor: 0, patch: 0, prerelease: ['1'] };
    const str: SemVer = { major: 1, minor: 0, patch: 0, prerelease: ['alpha'] };
    expect(compareSemVer(num, str)).toBe(-1);
  });

  it('should handle different prerelease lengths', () => {
    const shorter: SemVer = { major: 1, minor: 0, patch: 0, prerelease: ['alpha'] };
    const longer: SemVer = { major: 1, minor: 0, patch: 0, prerelease: ['alpha', '1'] };
    expect(compareSemVer(shorter, longer)).toBe(-1);
  });
});

describe('bumpVersion', () => {
  const base: SemVer = { major: 1, minor: 2, patch: 3 };

  it('should bump major', () => {
    expect(bumpVersion(base, 'major')).toEqual({ major: 2, minor: 0, patch: 0 });
  });

  it('should bump minor', () => {
    expect(bumpVersion(base, 'minor')).toEqual({ major: 1, minor: 3, patch: 0 });
  });

  it('should bump patch', () => {
    expect(bumpVersion(base, 'patch')).toEqual({ major: 1, minor: 2, patch: 4 });
  });

  it('should create premajor', () => {
    expect(bumpVersion(base, 'premajor')).toEqual({
      major: 2,
      minor: 0,
      patch: 0,
      prerelease: ['0'],
    });
  });

  it('should create preminor', () => {
    expect(bumpVersion(base, 'preminor')).toEqual({
      major: 1,
      minor: 3,
      patch: 0,
      prerelease: ['0'],
    });
  });

  it('should create prepatch', () => {
    expect(bumpVersion(base, 'prepatch')).toEqual({
      major: 1,
      minor: 2,
      patch: 4,
      prerelease: ['0'],
    });
  });

  it('should increment prerelease number', () => {
    const preV: SemVer = { major: 1, minor: 0, patch: 0, prerelease: ['alpha', '3'] };
    expect(bumpVersion(preV, 'prerelease')).toEqual({
      major: 1,
      minor: 0,
      patch: 0,
      prerelease: ['alpha', '4'],
    });
  });

  it('should create prerelease from release version', () => {
    expect(bumpVersion(base, 'prerelease')).toEqual({
      major: 1,
      minor: 2,
      patch: 4,
      prerelease: ['0'],
    });
  });

  it('should append 0 to non-numeric prerelease', () => {
    const preV: SemVer = { major: 1, minor: 0, patch: 0, prerelease: ['alpha'] };
    expect(bumpVersion(preV, 'prerelease')).toEqual({
      major: 1,
      minor: 0,
      patch: 0,
      prerelease: ['alpha', '0'],
    });
  });
});
