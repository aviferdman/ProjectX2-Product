import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  compareSemver,
  checkNpmVersion,
  checkNpmAuth,
  checkNpmrc,
  checkPackagePublishConfig,
  checkOrgAccess,
  validateNpmCredentials,
  formatCredentialOutput,
  parseArgs,
} from '../validate-npm-credentials.js';

describe('validate-npm-credentials', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'npm-creds-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('compareSemver', () => {
    it('returns 0 for equal versions', () => {
      expect(compareSemver('1.2.3', '1.2.3')).toBe(0);
    });

    it('returns -1 when first is less', () => {
      expect(compareSemver('1.0.0', '2.0.0')).toBe(-1);
      expect(compareSemver('1.0.0', '1.1.0')).toBe(-1);
      expect(compareSemver('1.0.0', '1.0.1')).toBe(-1);
    });

    it('returns 1 when first is greater', () => {
      expect(compareSemver('2.0.0', '1.0.0')).toBe(1);
      expect(compareSemver('1.1.0', '1.0.0')).toBe(1);
      expect(compareSemver('1.0.1', '1.0.0')).toBe(1);
    });

    it('handles major version differences', () => {
      expect(compareSemver('10.0.0', '9.0.0')).toBe(1);
      expect(compareSemver('8.0.0', '10.0.0')).toBe(-1);
    });
  });

  describe('checkNpmVersion', () => {
    it('detects npm CLI availability', () => {
      const { checks, version } = checkNpmVersion();
      // npm should be available in test environment
      expect(checks.some((c) => c.name === 'npm-available')).toBe(true);
      if (version) {
        expect(checks.find((c) => c.name === 'npm-available')?.status).toBe('pass');
        expect(version).toMatch(/^\d+\.\d+\.\d+/);
      }
    });
  });

  describe('checkNpmAuth', () => {
    it('skips auth check when skipAuth is true', () => {
      const { checks, user } = checkNpmAuth(true);
      expect(checks).toHaveLength(1);
      expect(checks[0]!.status).toBe('skip');
      expect(checks[0]!.message).toContain('skipped');
      expect(user).toBeNull();
    });

    it('attempts auth check when skipAuth is false', () => {
      const { checks } = checkNpmAuth(false);
      expect(checks).toHaveLength(1);
      expect(checks[0]!.name).toBe('npm-auth');
      // Will be 'pass' or 'fail' depending on whether user is logged in
      expect(['pass', 'fail']).toContain(checks[0]!.status);
    });
  });

  describe('checkNpmrc', () => {
    it('fails when .npmrc does not exist', () => {
      const checks = checkNpmrc(join(tempDir, 'nonexistent'));
      expect(checks.some((c) => c.status === 'fail' && c.name === 'npmrc-exists')).toBe(true);
    });

    it('passes for a well-configured .npmrc', () => {
      writeFileSync(
        join(tempDir, '.npmrc'),
        'registry=https://registry.npmjs.org/\n@crewspace:registry=https://registry.npmjs.org/\naccess=public\nprovenance=true\n',
      );

      const checks = checkNpmrc(tempDir);
      expect(checks.find((c) => c.name === 'npmrc-exists')?.status).toBe('pass');
      expect(checks.find((c) => c.name === 'npmrc-registry')?.status).toBe('pass');
      expect(checks.find((c) => c.name === 'npmrc-scope')?.status).toBe('pass');
      expect(checks.find((c) => c.name === 'npmrc-access')?.status).toBe('pass');
      expect(checks.find((c) => c.name === 'npmrc-no-secrets')?.status).toBe('pass');
    });

    it('fails when registry is missing', () => {
      writeFileSync(join(tempDir, '.npmrc'), 'access=public\n');

      const checks = checkNpmrc(tempDir);
      expect(checks.find((c) => c.name === 'npmrc-registry')?.status).toBe('fail');
    });

    it('fails when access=public is missing', () => {
      writeFileSync(
        join(tempDir, '.npmrc'),
        'registry=https://registry.npmjs.org/\n',
      );

      const checks = checkNpmrc(tempDir);
      expect(checks.find((c) => c.name === 'npmrc-access')?.status).toBe('fail');
    });

    it('fails when auth tokens are present', () => {
      writeFileSync(
        join(tempDir, '.npmrc'),
        'registry=https://registry.npmjs.org/\naccess=public\n//registry.npmjs.org/:_authToken=secret123\n',
      );

      const checks = checkNpmrc(tempDir);
      expect(checks.find((c) => c.name === 'npmrc-no-secrets')?.status).toBe('fail');
    });

    it('warns when scope registry is not set', () => {
      writeFileSync(
        join(tempDir, '.npmrc'),
        'registry=https://registry.npmjs.org/\naccess=public\n',
      );

      const checks = checkNpmrc(tempDir);
      expect(checks.find((c) => c.name === 'npmrc-scope')?.status).toBe('warn');
    });
  });

  describe('checkPackagePublishConfig', () => {
    it('fails when packages/ directory does not exist', () => {
      const checks = checkPackagePublishConfig(join(tempDir, 'nonexistent'));
      expect(checks.some((c) => c.status === 'fail' && c.name === 'packages-dir')).toBe(true);
    });

    it('passes when all packages have correct publishConfig', () => {
      const pkgsDir = join(tempDir, 'packages');
      const pkg1 = join(pkgsDir, 'core');
      const pkg2 = join(pkgsDir, 'cli');
      mkdirSync(pkg1, { recursive: true });
      mkdirSync(pkg2, { recursive: true });

      writeFileSync(
        join(pkg1, 'package.json'),
        JSON.stringify({
          name: '@crewspace/core',
          publishConfig: { access: 'public', registry: 'https://registry.npmjs.org/' },
        }),
      );
      writeFileSync(
        join(pkg2, 'package.json'),
        JSON.stringify({
          name: '@crewspace/cli',
          publishConfig: { access: 'public', registry: 'https://registry.npmjs.org/' },
        }),
      );

      const checks = checkPackagePublishConfig(tempDir);
      expect(checks.find((c) => c.name === 'packages-scoped')?.status).toBe('pass');
      expect(checks.find((c) => c.name === 'packages-publish-config')?.status).toBe('pass');
      expect(checks.find((c) => c.name === 'packages-public-access')?.status).toBe('pass');
      expect(checks.find((c) => c.name === 'packages-registry')?.status).toBe('pass');
    });

    it('fails when publishConfig is missing', () => {
      const pkgsDir = join(tempDir, 'packages');
      const pkg1 = join(pkgsDir, 'core');
      mkdirSync(pkg1, { recursive: true });

      writeFileSync(
        join(pkg1, 'package.json'),
        JSON.stringify({ name: '@crewspace/core' }),
      );

      const checks = checkPackagePublishConfig(tempDir);
      expect(checks.find((c) => c.name === 'packages-publish-config')?.status).toBe('fail');
    });

    it('fails when access is not public', () => {
      const pkgsDir = join(tempDir, 'packages');
      const pkg1 = join(pkgsDir, 'core');
      mkdirSync(pkg1, { recursive: true });

      writeFileSync(
        join(pkg1, 'package.json'),
        JSON.stringify({
          name: '@crewspace/core',
          publishConfig: { access: 'restricted' },
        }),
      );

      const checks = checkPackagePublishConfig(tempDir);
      expect(checks.find((c) => c.name === 'packages-public-access')?.status).toBe('fail');
    });

    it('fails when package is not scoped', () => {
      const pkgsDir = join(tempDir, 'packages');
      const pkg1 = join(pkgsDir, 'core');
      mkdirSync(pkg1, { recursive: true });

      writeFileSync(
        join(pkg1, 'package.json'),
        JSON.stringify({
          name: 'core',
          publishConfig: { access: 'public' },
        }),
      );

      const checks = checkPackagePublishConfig(tempDir);
      expect(checks.find((c) => c.name === 'packages-scoped')?.status).toBe('fail');
    });
  });

  describe('checkOrgAccess', () => {
    it('skips when skipAuth is true', () => {
      const checks = checkOrgAccess(true);
      expect(checks).toHaveLength(1);
      expect(checks[0]!.status).toBe('skip');
    });

    it('returns a result when skipAuth is false', () => {
      const checks = checkOrgAccess(false);
      expect(checks).toHaveLength(1);
      // Will be 'pass' or 'warn' depending on auth/org status
      expect(['pass', 'warn']).toContain(checks[0]!.status);
    });
  });

  describe('validateNpmCredentials', () => {
    it('runs full validation with --skip-auth', () => {
      // Set up a minimal valid structure
      mkdirSync(join(tempDir, 'packages', 'core'), { recursive: true });
      writeFileSync(
        join(tempDir, 'packages', 'core', 'package.json'),
        JSON.stringify({
          name: '@crewspace/core',
          publishConfig: { access: 'public', registry: 'https://registry.npmjs.org/' },
        }),
      );
      writeFileSync(
        join(tempDir, '.npmrc'),
        'registry=https://registry.npmjs.org/\n@crewspace:registry=https://registry.npmjs.org/\naccess=public\n',
      );

      const result = validateNpmCredentials({ rootDir: tempDir, skipAuth: true });

      expect(result.scope).toBe('@crewspace');
      expect(result.registry).toBe('https://registry.npmjs.org/');
      expect(result.checks.length).toBeGreaterThan(0);

      // Auth and org checks should be skipped
      const skippedChecks = result.checks.filter((c) => c.status === 'skip');
      expect(skippedChecks.length).toBe(2); // npm-auth + org-access
    });

    it('fails when .npmrc is missing', () => {
      mkdirSync(join(tempDir, 'packages', 'core'), { recursive: true });
      writeFileSync(
        join(tempDir, 'packages', 'core', 'package.json'),
        JSON.stringify({
          name: '@crewspace/core',
          publishConfig: { access: 'public' },
        }),
      );

      const result = validateNpmCredentials({ rootDir: tempDir, skipAuth: true });
      expect(result.passed).toBe(false);
    });
  });

  describe('formatCredentialOutput', () => {
    it('formats passing result', () => {
      const output = formatCredentialOutput({
        passed: true,
        checks: [
          { name: 'npm-available', status: 'pass', message: 'npm CLI available (v10.0.0)' },
          { name: 'npm-auth', status: 'skip', message: 'Auth skipped' },
        ],
        npmVersion: '10.0.0',
        authenticatedUser: null,
        scope: '@crewspace',
        registry: 'https://registry.npmjs.org/',
      });

      expect(output).toContain('@crewspace');
      expect(output).toContain('npmjs.org');
      expect(output).toContain('10.0.0');
      expect(output).toContain('publishing configuration is valid');
    });

    it('formats failing result', () => {
      const output = formatCredentialOutput({
        passed: false,
        checks: [
          { name: 'npmrc-exists', status: 'fail', message: '.npmrc not found' },
        ],
        npmVersion: '10.0.0',
        authenticatedUser: null,
        scope: '@crewspace',
        registry: 'https://registry.npmjs.org/',
      });

      expect(output).toContain('issues found');
      expect(output).toContain('1 failed');
    });

    it('shows authenticated user when available', () => {
      const output = formatCredentialOutput({
        passed: true,
        checks: [],
        npmVersion: '10.0.0',
        authenticatedUser: 'testuser',
        scope: '@crewspace',
        registry: 'https://registry.npmjs.org/',
      });

      expect(output).toContain('testuser');
    });
  });

  describe('parseArgs', () => {
    it('parses --skip-auth flag', () => {
      expect(parseArgs(['--skip-auth'])).toEqual({ skipAuth: true });
    });

    it('defaults to no skip', () => {
      expect(parseArgs([])).toEqual({ skipAuth: false });
    });
  });
});
