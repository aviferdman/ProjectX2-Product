import { describe, it, expect } from 'vitest';
import { validateVersionConsistency } from '../../../src/version/consistency.js';
import type { PackageVersionInfo } from '../../../src/version/consistency.js';

describe('validateVersionConsistency', () => {
  it('should pass when versions match', () => {
    const packages: PackageVersionInfo[] = [
      { name: '@crewspace/core', packageJsonVersion: '0.1.0', exportedVersion: '0.1.0' },
    ];
    const result = validateVersionConsistency(packages);
    expect(result.consistent).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail when versions mismatch', () => {
    const packages: PackageVersionInfo[] = [
      { name: '@crewspace/core', packageJsonVersion: '0.1.0', exportedVersion: '0.2.0' },
    ];
    const result = validateVersionConsistency(packages);
    expect(result.consistent).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('@crewspace/core');
    expect(result.errors[0]).toContain('0.2.0');
    expect(result.errors[0]).toContain('0.1.0');
  });

  it('should pass when no exported version is provided', () => {
    const packages: PackageVersionInfo[] = [
      { name: '@crewspace/utils', packageJsonVersion: '1.0.0' },
    ];
    const result = validateVersionConsistency(packages);
    expect(result.consistent).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate multiple packages independently', () => {
    const packages: PackageVersionInfo[] = [
      { name: '@crewspace/core', packageJsonVersion: '0.1.0', exportedVersion: '0.1.0' },
      { name: '@crewspace/utils', packageJsonVersion: '1.0.0', exportedVersion: '2.0.0' },
    ];
    const result = validateVersionConsistency(packages);
    expect(result.consistent).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('@crewspace/utils');
  });

  it('should return package info in the result', () => {
    const packages: PackageVersionInfo[] = [
      { name: '@crewspace/core', packageJsonVersion: '0.1.0', exportedVersion: '0.1.0' },
    ];
    const result = validateVersionConsistency(packages);
    expect(result.packages).toEqual(packages);
  });

  it('should handle empty package list', () => {
    const result = validateVersionConsistency([]);
    expect(result.consistent).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.packages).toHaveLength(0);
  });
});
