/**
 * QA validation tests for TASK-015: MIT LICENSE in @crewspace/core package
 *
 * These tests validate:
 * - LICENSE file exists in the core package
 * - LICENSE content matches MIT license standard
 * - LICENSE is included in package.json files array
 * - LICENSE file formatting and structure
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CORE_PACKAGE_ROOT = join(__dirname, '../..');
const LICENSE_PATH = join(CORE_PACKAGE_ROOT, 'LICENSE');
const PACKAGE_JSON_PATH = join(CORE_PACKAGE_ROOT, 'package.json');

describe('TASK-015 QA: MIT LICENSE in @crewspace/core', () => {
  describe('LICENSE File Existence', () => {
    it('should have LICENSE file in package root', () => {
      expect(existsSync(LICENSE_PATH)).toBe(true);
    });

    it('should have LICENSE file readable with valid content', () => {
      expect(() => readFileSync(LICENSE_PATH, 'utf-8')).not.toThrow();

      const content = readFileSync(LICENSE_PATH, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });
  });

  describe('LICENSE Content Validation', () => {
    let licenseContent: string;

    beforeAll(() => {
      licenseContent = readFileSync(LICENSE_PATH, 'utf-8');
    });

    it('should contain "MIT License" header', () => {
      expect(licenseContent).toContain('MIT License');
    });

    it('should contain copyright notice with year and holder', () => {
      expect(licenseContent).toMatch(/Copyright \(c\) \d{4}/);
      expect(licenseContent).toContain('Crewspace Contributors');
    });

    it('should contain standard MIT license permissions grant', () => {
      expect(licenseContent).toContain(
        'Permission is hereby granted, free of charge, to any person obtaining a copy',
      );
      expect(licenseContent).toContain('of this software and associated documentation files');
    });

    it('should contain required MIT license clauses', () => {
      // Permission to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
      expect(licenseContent).toContain('to use, copy, modify, merge, publish, distribute');
      expect(licenseContent).toContain('sublicense, and/or sell');

      // Copyright notice requirement
      expect(licenseContent).toContain(
        'The above copyright notice and this permission notice shall be included in all',
      );
      expect(licenseContent).toContain('copies or substantial portions of the Software');
    });

    it('should contain MIT license disclaimer', () => {
      expect(licenseContent).toContain('THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND');
      // Note: These may be on the same or next line in the file
      expect(licenseContent).toContain('IMPLIED');
      expect(licenseContent).toContain('MERCHANTABILITY');
      expect(licenseContent).toContain('FITNESS FOR A PARTICULAR PURPOSE');
      expect(licenseContent).toContain('NONINFRINGEMENT');
    });

    it('should contain liability limitation clause', () => {
      // Note: These phrases may span multiple lines
      expect(licenseContent).toContain('AUTHORS OR COPYRIGHT HOLDERS BE LIABLE');
      expect(licenseContent).toContain('FOR ANY CLAIM, DAMAGES OR OTHER');
    });

    it('should not contain excessive trailing whitespace on lines', () => {
      // Normalize line endings first, allow single \r from Windows line endings
      const lines = licenseContent.split('\n');
      lines.forEach((line) => {
        // Remove \r if present and check for other trailing whitespace
        const normalized = line.replace(/\r$/, '');
        expect(normalized).not.toMatch(/\s$/);
      });
    });
  });

  describe('LICENSE Copyright Year', () => {
    it('should have current or recent year in copyright', () => {
      const licenseContent = readFileSync(LICENSE_PATH, 'utf-8');
      const currentYear = new Date().getFullYear();

      // Accept current year or one year back (for year-end transitions)
      const yearMatch = licenseContent.match(/Copyright \(c\) (\d{4})/);
      expect(yearMatch).not.toBeNull();

      if (yearMatch) {
        const copyrightYear = parseInt(yearMatch[1], 10);
        expect(copyrightYear).toBeGreaterThanOrEqual(currentYear - 1);
        expect(copyrightYear).toBeLessThanOrEqual(currentYear);
      }
    });
  });

  describe('package.json Integration', () => {
    let packageJson: { files?: string[]; license?: string };

    beforeAll(() => {
      const packageJsonContent = readFileSync(PACKAGE_JSON_PATH, 'utf-8');
      packageJson = JSON.parse(packageJsonContent);
    });

    it('should include LICENSE in package.json files array', () => {
      expect(packageJson.files).toBeDefined();
      expect(packageJson.files).toContain('LICENSE');
    });

    it('should declare MIT license in package.json', () => {
      expect(packageJson.license).toBe('MIT');
    });
  });

  describe('LICENSE File Formatting', () => {
    let licenseContent: string;

    beforeAll(() => {
      licenseContent = readFileSync(LICENSE_PATH, 'utf-8');
    });

    it('should start with "MIT License" as first line', () => {
      const lines = licenseContent.trim().split('\n');
      expect(lines[0].trim()).toBe('MIT License');
    });

    it('should have proper line breaks and structure', () => {
      const lines = licenseContent.trim().split('\n');

      // Should have multiple lines (MIT license is ~21 lines)
      expect(lines.length).toBeGreaterThan(15);
      expect(lines.length).toBeLessThan(30);
    });

    it('should not have excessive blank lines', () => {
      const lines = licenseContent.split('\n');
      let consecutiveBlankLines = 0;

      for (const line of lines) {
        if (line.trim() === '') {
          consecutiveBlankLines++;
        } else {
          consecutiveBlankLines = 0;
        }

        // No more than 2 consecutive blank lines
        expect(consecutiveBlankLines).toBeLessThanOrEqual(2);
      }
    });

    it('should end with a newline character', () => {
      expect(licenseContent.endsWith('\n')).toBe(true);
    });
  });

  describe('LICENSE Compliance', () => {
    it('should match OSI-approved MIT License template structure', () => {
      const licenseContent = readFileSync(LICENSE_PATH, 'utf-8');

      // Key phrases that must appear in this order for OSI compliance
      const keyPhrases = [
        'MIT License',
        'Copyright',
        'Permission is hereby granted',
        'free of charge',
        'without restriction',
        'THE SOFTWARE IS PROVIDED "AS IS"',
        'WITHOUT WARRANTY OF ANY KIND',
      ];

      let lastIndex = 0;
      for (const phrase of keyPhrases) {
        const index = licenseContent.indexOf(phrase, lastIndex);
        expect(index).toBeGreaterThanOrEqual(0); // Use >= 0 instead of > -1
        lastIndex = index;
      }
    });
  });
});
