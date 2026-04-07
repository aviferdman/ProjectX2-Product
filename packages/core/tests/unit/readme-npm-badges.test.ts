/**
 * TASK-115: Verify npm badges in README.md
 *
 * Validates that the root README includes npm badges for
 * version, downloads, and license linking to the @crewspace/core package.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(currentDir, '../../../..');

let content: string;

beforeAll(() => {
  content = readFileSync(join(PROJECT_ROOT, 'README.md'), 'utf-8');
});

describe('TASK-115: npm badges in README', () => {
  it('should have an npm version badge linking to npmjs.com', () => {
    expect(content).toContain(
      '[![npm version](https://img.shields.io/npm/v/@crewspace/core)]',
    );
    expect(content).toContain('https://www.npmjs.com/package/@crewspace/core');
  });

  it('should have an npm downloads badge linking to npmjs.com', () => {
    expect(content).toContain(
      '[![npm downloads](https://img.shields.io/npm/dm/@crewspace/core)]',
    );
  });

  it('should have an npm license badge linking to npmjs.com', () => {
    expect(content).toContain(
      '[![npm license](https://img.shields.io/npm/l/@crewspace/core)]',
    );
  });

  it('should place npm badges in the header badge section', () => {
    const headerEnd = content.indexOf('</div>');
    const versionBadgePos = content.indexOf('img.shields.io/npm/v/@crewspace/core');
    const downloadsBadgePos = content.indexOf('img.shields.io/npm/dm/@crewspace/core');
    const licenseBadgePos = content.indexOf('img.shields.io/npm/l/@crewspace/core');

    expect(versionBadgePos).toBeGreaterThan(-1);
    expect(downloadsBadgePos).toBeGreaterThan(-1);
    expect(licenseBadgePos).toBeGreaterThan(-1);
    expect(versionBadgePos).toBeLessThan(headerEnd);
    expect(downloadsBadgePos).toBeLessThan(headerEnd);
    expect(licenseBadgePos).toBeLessThan(headerEnd);
  });

  it('should have badges in order: version, downloads, license', () => {
    const versionPos = content.indexOf('npm/v/@crewspace/core');
    const downloadsPos = content.indexOf('npm/dm/@crewspace/core');
    const licensePos = content.indexOf('npm/l/@crewspace/core');

    expect(versionPos).toBeLessThan(downloadsPos);
    expect(downloadsPos).toBeLessThan(licensePos);
  });
});
