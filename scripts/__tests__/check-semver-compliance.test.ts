import { describe, it, expect } from 'vitest';
import {
  extractExports,
  compareExports,
  isBreakingBumpRequired,
} from '../check-semver-compliance.js';
import type { ExportEntry } from '../check-semver-compliance.js';

describe('check-semver-compliance', () => {
  describe('extractExports', () => {
    it('extracts value re-exports', () => {
      const source = `export { Foo, Bar } from './module.js';`;
      const result = extractExports(source);
      expect(result).toEqual([
        { name: 'Bar', typeOnly: false },
        { name: 'Foo', typeOnly: false },
      ]);
    });

    it('extracts type-only re-exports', () => {
      const source = `export type { Baz, Qux } from './module.js';`;
      const result = extractExports(source);
      expect(result).toEqual([
        { name: 'Baz', typeOnly: true },
        { name: 'Qux', typeOnly: true },
      ]);
    });

    it('extracts export const', () => {
      const source = `export const VERSION = '0.1.0';`;
      const result = extractExports(source);
      expect(result).toEqual([{ name: 'VERSION', typeOnly: false }]);
    });

    it('extracts export function', () => {
      const source = `export function doSomething(arg: string): void { }`;
      const result = extractExports(source);
      expect(result).toEqual([{ name: 'doSomething', typeOnly: false }]);
    });

    it('extracts export class', () => {
      const source = `export class MyAgent { }`;
      const result = extractExports(source);
      expect(result).toEqual([{ name: 'MyAgent', typeOnly: false }]);
    });

    it('extracts export enum', () => {
      const source = `export enum Status { Active, Idle }`;
      const result = extractExports(source);
      expect(result).toEqual([{ name: 'Status', typeOnly: false }]);
    });

    it('extracts export type alias', () => {
      const source = `export type Config = { key: string };`;
      const result = extractExports(source);
      expect(result).toEqual([{ name: 'Config', typeOnly: true }]);
    });

    it('extracts export interface', () => {
      const source = `export interface Options { verbose: boolean; }`;
      const result = extractExports(source);
      expect(result).toEqual([{ name: 'Options', typeOnly: true }]);
    });

    it('handles aliased re-exports (tracks exported name)', () => {
      const source = `export { InternalName as PublicName } from './module.js';`;
      const result = extractExports(source);
      expect(result).toEqual([{ name: 'PublicName', typeOnly: false }]);
    });

    it('de-duplicates symbols', () => {
      const source = [
        `export { Foo } from './a.js';`,
        `export { Foo } from './b.js';`,
      ].join('\n');
      const result = extractExports(source);
      expect(result).toEqual([{ name: 'Foo', typeOnly: false }]);
    });

    it('sorts exports alphabetically', () => {
      const source = [
        `export { Zeta } from './z.js';`,
        `export { Alpha } from './a.js';`,
        `export { Mu } from './m.js';`,
      ].join('\n');
      const result = extractExports(source);
      expect(result.map((e) => e.name)).toEqual(['Alpha', 'Mu', 'Zeta']);
    });

    it('handles mixed export styles in one file', () => {
      const source = [
        `export const VERSION = '1.0.0';`,
        `export { Agent } from './agent.js';`,
        `export type { AgentConfig } from './types.js';`,
        `export function createAgent() { }`,
        `export class Crew { }`,
      ].join('\n');
      const result = extractExports(source);
      expect(result).toHaveLength(5);
      const names = result.map((e) => e.name);
      expect(names).toContain('VERSION');
      expect(names).toContain('Agent');
      expect(names).toContain('AgentConfig');
      expect(names).toContain('createAgent');
      expect(names).toContain('Crew');
    });

    it('returns empty array for no exports', () => {
      const source = `const x = 1;\nfunction foo() {}`;
      const result = extractExports(source);
      expect(result).toEqual([]);
    });
  });

  describe('compareExports', () => {
    it('returns no changes when baseline equals current', () => {
      const entries: ExportEntry[] = [
        { name: 'Foo', typeOnly: false },
        { name: 'Bar', typeOnly: true },
      ];
      const result = compareExports(entries, entries);
      expect(result.breaking).toEqual([]);
      expect(result.added).toEqual([]);
    });

    it('detects removed exports as breaking', () => {
      const baseline: ExportEntry[] = [
        { name: 'Foo', typeOnly: false },
        { name: 'Bar', typeOnly: false },
      ];
      const current: ExportEntry[] = [{ name: 'Foo', typeOnly: false }];
      const result = compareExports(baseline, current);
      expect(result.breaking).toHaveLength(1);
      expect(result.breaking[0]!.kind).toBe('removed');
      expect(result.breaking[0]!.symbol).toBe('Bar');
    });

    it('detects value-to-type change as breaking', () => {
      const baseline: ExportEntry[] = [{ name: 'Foo', typeOnly: false }];
      const current: ExportEntry[] = [{ name: 'Foo', typeOnly: true }];
      const result = compareExports(baseline, current);
      expect(result.breaking).toHaveLength(1);
      expect(result.breaking[0]!.kind).toBe('changed-to-type');
    });

    it('detects type-to-value change as breaking', () => {
      const baseline: ExportEntry[] = [{ name: 'Foo', typeOnly: true }];
      const current: ExportEntry[] = [{ name: 'Foo', typeOnly: false }];
      const result = compareExports(baseline, current);
      expect(result.breaking).toHaveLength(1);
      expect(result.breaking[0]!.kind).toBe('changed-to-value');
    });

    it('detects new exports as additions', () => {
      const baseline: ExportEntry[] = [{ name: 'Foo', typeOnly: false }];
      const current: ExportEntry[] = [
        { name: 'Foo', typeOnly: false },
        { name: 'Bar', typeOnly: false },
        { name: 'Baz', typeOnly: true },
      ];
      const result = compareExports(baseline, current);
      expect(result.breaking).toEqual([]);
      expect(result.added).toEqual(['Bar', 'Baz']);
    });

    it('detects multiple breaking changes simultaneously', () => {
      const baseline: ExportEntry[] = [
        { name: 'A', typeOnly: false },
        { name: 'B', typeOnly: false },
        { name: 'C', typeOnly: true },
      ];
      const current: ExportEntry[] = [
        { name: 'A', typeOnly: true }, // value → type
        // B removed
        { name: 'D', typeOnly: false }, // added
      ];
      const result = compareExports(baseline, current);
      expect(result.breaking).toHaveLength(3);
      const kinds = result.breaking.map((b) => `${b.symbol}:${b.kind}`);
      expect(kinds).toContain('A:changed-to-type');
      expect(kinds).toContain('B:removed');
      expect(kinds).toContain('C:removed');
      expect(result.added).toEqual(['D']);
    });

    it('handles empty baseline (fresh project)', () => {
      const current: ExportEntry[] = [
        { name: 'Foo', typeOnly: false },
      ];
      const result = compareExports([], current);
      expect(result.breaking).toEqual([]);
      expect(result.added).toEqual(['Foo']);
    });

    it('handles empty current (everything removed)', () => {
      const baseline: ExportEntry[] = [
        { name: 'Foo', typeOnly: false },
        { name: 'Bar', typeOnly: true },
      ];
      const result = compareExports(baseline, []);
      expect(result.breaking).toHaveLength(2);
      expect(result.added).toEqual([]);
    });
  });

  describe('isBreakingBumpRequired', () => {
    it('returns true when pre-1.0 minor is not bumped', () => {
      expect(isBreakingBumpRequired('0.1.0', '0.1.1')).toBe(true);
      expect(isBreakingBumpRequired('0.1.0', '0.1.0')).toBe(true);
    });

    it('returns false when pre-1.0 minor is bumped', () => {
      expect(isBreakingBumpRequired('0.1.0', '0.2.0')).toBe(false);
      expect(isBreakingBumpRequired('0.1.5', '0.3.0')).toBe(false);
    });

    it('returns true when post-1.0 major is not bumped', () => {
      expect(isBreakingBumpRequired('1.0.0', '1.1.0')).toBe(true);
      expect(isBreakingBumpRequired('1.0.0', '1.0.1')).toBe(true);
      expect(isBreakingBumpRequired('2.3.4', '2.4.0')).toBe(true);
    });

    it('returns false when post-1.0 major is bumped', () => {
      expect(isBreakingBumpRequired('1.0.0', '2.0.0')).toBe(false);
      expect(isBreakingBumpRequired('2.3.4', '3.0.0')).toBe(false);
    });

    it('returns true for invalid versions (conservative)', () => {
      expect(isBreakingBumpRequired('invalid', '1.0.0')).toBe(true);
      expect(isBreakingBumpRequired('1.0.0', 'bad')).toBe(true);
    });
  });
});
