import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  readCurrentVersion,
  computeTargetVersion,
  updatePackageJson,
  updateVersionExport,
  runVersionBump,
  formatBumpOutput,
  parseBumpArgs,
} from '../version-bump.js';
import type { PackageBumpInfo } from '../version-bump.js';

describe('version-bump', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'version-bump-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  function setupPackage(opts: {
    path: string;
    name: string;
    version: string;
    exportName: string;
    exportFile: string;
  }): PackageBumpInfo {
    const pkgDir = join(tempDir, opts.path);
    mkdirSync(join(pkgDir, 'src'), { recursive: true });

    writeFileSync(
      join(pkgDir, 'package.json'),
      JSON.stringify({ name: opts.name, version: opts.version }, null, 2) + '\n',
    );
    writeFileSync(
      join(pkgDir, opts.exportFile),
      `export const ${opts.exportName} = '${opts.version}';\n`,
    );

    return {
      path: opts.path,
      name: opts.name,
      versionExportFile: opts.exportFile,
      versionExportName: opts.exportName,
    };
  }

  describe('parseBumpArgs', () => {
    it('parses --bump flag', () => {
      const result = parseBumpArgs(['--bump', 'minor']);
      expect(result.bump).toBe('minor');
      expect(result.dryRun).toBe(false);
    });

    it('parses --to flag', () => {
      const result = parseBumpArgs(['--to', '2.0.0']);
      expect(result.to).toBe('2.0.0');
    });

    it('parses --preid flag', () => {
      const result = parseBumpArgs(['--bump', 'prerelease', '--preid', 'beta']);
      expect(result.bump).toBe('prerelease');
      expect(result.preid).toBe('beta');
    });

    it('parses --dry-run flag', () => {
      const result = parseBumpArgs(['--bump', 'patch', '--dry-run']);
      expect(result.bump).toBe('patch');
      expect(result.dryRun).toBe(true);
    });

    it('returns undefined for missing flags', () => {
      const result = parseBumpArgs([]);
      expect(result.bump).toBeUndefined();
      expect(result.to).toBeUndefined();
      expect(result.preid).toBeUndefined();
      expect(result.dryRun).toBe(false);
    });
  });

  describe('readCurrentVersion', () => {
    it('reads version from package.json', () => {
      setupPackage({
        path: 'packages/core',
        name: '@crewspace/core',
        version: '0.1.0',
        exportName: 'VERSION',
        exportFile: 'src/index.ts',
      });
      expect(readCurrentVersion(tempDir, 'packages/core')).toBe('0.1.0');
    });

    it('returns null when package.json does not exist', () => {
      expect(readCurrentVersion(tempDir, 'packages/nonexistent')).toBeNull();
    });
  });

  describe('computeTargetVersion', () => {
    it('computes bump from current version', () => {
      const result = computeTargetVersion('0.1.0', { bump: 'minor' });
      expect(result.version).toBe('0.2.0');
      expect(result.error).toBeNull();
    });

    it('computes patch bump', () => {
      const result = computeTargetVersion('0.1.0', { bump: 'patch' });
      expect(result.version).toBe('0.1.1');
      expect(result.error).toBeNull();
    });

    it('computes major bump', () => {
      const result = computeTargetVersion('0.1.0', { bump: 'major' });
      expect(result.version).toBe('1.0.0');
      expect(result.error).toBeNull();
    });

    it('accepts explicit --to version', () => {
      const result = computeTargetVersion('0.1.0', { to: '1.0.0' });
      expect(result.version).toBe('1.0.0');
      expect(result.error).toBeNull();
    });

    it('rejects --to version that is not greater', () => {
      const result = computeTargetVersion('1.0.0', { to: '0.1.0' });
      expect(result.version).toBeNull();
      expect(result.error).toContain('must be greater');
    });

    it('rejects invalid --to version', () => {
      const result = computeTargetVersion('0.1.0', { to: 'invalid' });
      expect(result.version).toBeNull();
      expect(result.error).toContain('Invalid');
    });

    it('errors when neither bump nor to specified', () => {
      const result = computeTargetVersion('0.1.0', {});
      expect(result.version).toBeNull();
      expect(result.error).toContain('must be specified');
    });

    it('computes prerelease bump with preid', () => {
      const result = computeTargetVersion('0.1.0', { bump: 'prerelease', preid: 'beta' });
      expect(result.version).toBe('0.1.1-beta.0');
      expect(result.error).toBeNull();
    });
  });

  describe('updatePackageJson', () => {
    it('updates version in package.json', () => {
      setupPackage({
        path: 'packages/core',
        name: '@crewspace/core',
        version: '0.1.0',
        exportName: 'VERSION',
        exportFile: 'src/index.ts',
      });

      const result = updatePackageJson(tempDir, 'packages/core', '0.2.0', false);
      expect(result.error).toBeNull();

      const content = JSON.parse(readFileSync(join(tempDir, 'packages/core/package.json'), 'utf-8'));
      expect(content.version).toBe('0.2.0');
    });

    it('does not modify file in dry-run', () => {
      setupPackage({
        path: 'packages/core',
        name: '@crewspace/core',
        version: '0.1.0',
        exportName: 'VERSION',
        exportFile: 'src/index.ts',
      });

      updatePackageJson(tempDir, 'packages/core', '0.2.0', true);

      const content = JSON.parse(readFileSync(join(tempDir, 'packages/core/package.json'), 'utf-8'));
      expect(content.version).toBe('0.1.0');
    });

    it('returns error when package.json is missing', () => {
      const result = updatePackageJson(tempDir, 'packages/missing', '0.2.0', false);
      expect(result.error).toContain('not found');
    });
  });

  describe('updateVersionExport', () => {
    it('updates VERSION export in source file', () => {
      setupPackage({
        path: 'packages/core',
        name: '@crewspace/core',
        version: '0.1.0',
        exportName: 'VERSION',
        exportFile: 'src/index.ts',
      });

      const result = updateVersionExport(tempDir, 'packages/core', 'src/index.ts', 'VERSION', '0.2.0', false);
      expect(result.error).toBeNull();

      const content = readFileSync(join(tempDir, 'packages/core/src/index.ts'), 'utf-8');
      expect(content).toContain("export const VERSION = '0.2.0'");
    });

    it('updates CLI_VERSION export', () => {
      setupPackage({
        path: 'packages/cli',
        name: '@crewspace/cli',
        version: '0.1.0',
        exportName: 'CLI_VERSION',
        exportFile: 'src/index.ts',
      });

      const result = updateVersionExport(tempDir, 'packages/cli', 'src/index.ts', 'CLI_VERSION', '0.2.0', false);
      expect(result.error).toBeNull();

      const content = readFileSync(join(tempDir, 'packages/cli/src/index.ts'), 'utf-8');
      expect(content).toContain("export const CLI_VERSION = '0.2.0'");
    });

    it('does not modify file in dry-run', () => {
      setupPackage({
        path: 'packages/core',
        name: '@crewspace/core',
        version: '0.1.0',
        exportName: 'VERSION',
        exportFile: 'src/index.ts',
      });

      updateVersionExport(tempDir, 'packages/core', 'src/index.ts', 'VERSION', '0.2.0', true);

      const content = readFileSync(join(tempDir, 'packages/core/src/index.ts'), 'utf-8');
      expect(content).toContain("export const VERSION = '0.1.0'");
    });

    it('returns error when file is missing', () => {
      const result = updateVersionExport(tempDir, 'packages/missing', 'src/index.ts', 'VERSION', '0.2.0', false);
      expect(result.error).toContain('not found');
    });

    it('returns error when export is not found', () => {
      const pkgDir = join(tempDir, 'packages/core/src');
      mkdirSync(pkgDir, { recursive: true });
      writeFileSync(join(pkgDir, 'index.ts'), 'export const FOO = 42;\n');

      const result = updateVersionExport(tempDir, 'packages/core', 'src/index.ts', 'VERSION', '0.2.0', false);
      expect(result.error).toContain('No "VERSION" export found');
    });
  });

  describe('runVersionBump', () => {
    it('bumps version across multiple packages', () => {
      const corePkg = setupPackage({
        path: 'packages/core',
        name: '@crewspace/core',
        version: '0.1.0',
        exportName: 'VERSION',
        exportFile: 'src/index.ts',
      });
      const cliPkg = setupPackage({
        path: 'packages/cli',
        name: '@crewspace/cli',
        version: '0.1.0',
        exportName: 'CLI_VERSION',
        exportFile: 'src/index.ts',
      });

      const result = runVersionBump({
        rootDir: tempDir,
        packages: [corePkg, cliPkg],
        bump: 'minor',
      });

      expect(result.success).toBe(true);
      expect(result.fromVersion).toBe('0.1.0');
      expect(result.toVersion).toBe('0.2.0');
      expect(result.updatedFiles).toHaveLength(4); // 2 package.json + 2 index.ts

      // Verify files were updated
      const coreJson = JSON.parse(readFileSync(join(tempDir, 'packages/core/package.json'), 'utf-8'));
      expect(coreJson.version).toBe('0.2.0');

      const cliJson = JSON.parse(readFileSync(join(tempDir, 'packages/cli/package.json'), 'utf-8'));
      expect(cliJson.version).toBe('0.2.0');

      const coreSrc = readFileSync(join(tempDir, 'packages/core/src/index.ts'), 'utf-8');
      expect(coreSrc).toContain("export const VERSION = '0.2.0'");

      const cliSrc = readFileSync(join(tempDir, 'packages/cli/src/index.ts'), 'utf-8');
      expect(cliSrc).toContain("export const CLI_VERSION = '0.2.0'");
    });

    it('dry-run does not modify files', () => {
      const corePkg = setupPackage({
        path: 'packages/core',
        name: '@crewspace/core',
        version: '0.1.0',
        exportName: 'VERSION',
        exportFile: 'src/index.ts',
      });

      const result = runVersionBump({
        rootDir: tempDir,
        packages: [corePkg],
        bump: 'patch',
        dryRun: true,
      });

      expect(result.success).toBe(true);
      expect(result.toVersion).toBe('0.1.1');

      const json = JSON.parse(readFileSync(join(tempDir, 'packages/core/package.json'), 'utf-8'));
      expect(json.version).toBe('0.1.0');
    });

    it('bumps to explicit version', () => {
      const corePkg = setupPackage({
        path: 'packages/core',
        name: '@crewspace/core',
        version: '0.1.0',
        exportName: 'VERSION',
        exportFile: 'src/index.ts',
      });

      const result = runVersionBump({
        rootDir: tempDir,
        packages: [corePkg],
        to: '1.0.0',
      });

      expect(result.success).toBe(true);
      expect(result.toVersion).toBe('1.0.0');
    });

    it('fails when no packages configured', () => {
      const result = runVersionBump({
        rootDir: tempDir,
        packages: [],
        bump: 'patch',
      });
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('No packages configured');
    });

    it('fails when package.json is missing', () => {
      const result = runVersionBump({
        rootDir: tempDir,
        packages: [
          {
            path: 'packages/missing',
            name: '@crewspace/missing',
            versionExportFile: 'src/index.ts',
            versionExportName: 'VERSION',
          },
        ],
        bump: 'patch',
      });
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Could not read current version');
    });

    it('fails when neither bump nor to specified', () => {
      const corePkg = setupPackage({
        path: 'packages/core',
        name: '@crewspace/core',
        version: '0.1.0',
        exportName: 'VERSION',
        exportFile: 'src/index.ts',
      });

      const result = runVersionBump({
        rootDir: tempDir,
        packages: [corePkg],
      });
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('must be specified');
    });
  });

  describe('formatBumpOutput', () => {
    it('formats successful bump', () => {
      const output = formatBumpOutput(
        {
          success: true,
          fromVersion: '0.1.0',
          toVersion: '0.2.0',
          updatedFiles: ['packages/core/package.json', 'packages/core/src/index.ts'],
          errors: [],
        },
        false,
      );
      expect(output).toContain('0.1.0 → 0.2.0');
      expect(output).toContain('Updated files');
      expect(output).toContain('Next steps');
    });

    it('formats dry-run output', () => {
      const output = formatBumpOutput(
        {
          success: true,
          fromVersion: '0.1.0',
          toVersion: '0.2.0',
          updatedFiles: ['packages/core/package.json'],
          errors: [],
        },
        true,
      );
      expect(output).toContain('DRY RUN');
    });

    it('formats failed bump', () => {
      const output = formatBumpOutput(
        {
          success: false,
          fromVersion: '0.1.0',
          toVersion: '',
          updatedFiles: [],
          errors: ['Something went wrong'],
        },
        false,
      );
      expect(output).toContain('failed');
      expect(output).toContain('Something went wrong');
    });
  });
});
