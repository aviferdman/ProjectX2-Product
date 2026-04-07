import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');

describe('script path resolution', () => {
  const scripts = [
    'scripts/release.ts',
    'scripts/prepare-publish.ts',
    'scripts/check-versions.ts',
    'scripts/github-release.ts',
    'scripts/publish-check.ts',
    'scripts/version-bump.ts',
  ];

  for (const script of scripts) {
    it(`${script} uses fileURLToPath instead of import.meta.dirname`, () => {
      const content = readFileSync(resolve(ROOT, script), 'utf-8');
      expect(content).not.toContain('import.meta.dirname');
      expect(content).toContain('fileURLToPath');
    });
  }

  it('check-versions.ts resolves paths correctly via tsx', () => {
    const output = execSync('npx tsx scripts/check-versions.ts', {
      cwd: ROOT,
      encoding: 'utf-8',
      timeout: 30000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    expect(output).toContain('All version checks passed');
  });

  it('release.ts dry-run resolves package paths correctly', () => {
    const output = execSync(
      'npx tsx scripts/release.ts --version 0.1.0 --dry-run',
      {
        cwd: ROOT,
        encoding: 'utf-8',
        timeout: 30000,
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );
    expect(output).toContain('All publish validations passed');
    expect(output).toContain('Dry run passed');
    expect(output).not.toContain('package.json not found');
  });

  it('publish-check.ts resolves package paths correctly', () => {
    const output = execSync('npx tsx scripts/publish-check.ts', {
      cwd: ROOT,
      encoding: 'utf-8',
      timeout: 30000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    expect(output).toContain('Ready to publish');
    expect(output).not.toContain('not found');
  });
});
