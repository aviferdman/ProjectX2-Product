import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  validateRequiredFields,
  validateName,
  validateVersion,
  validateLicense,
  validateKeywords,
  validateRepository,
  validateHomepageAndBugs,
  validateAuthor,
  validateEngines,
  validateTypeField,
  validatePublishConfig,
  validatePackage,
  validateCrossPackageConsistency,
  applyFixes,
  discoverPackages,
  formatValidationResults,
  parseArgs,
  type PackageJson,
} from '../validate-package-metadata.js';

function makePackageJson(overrides: Partial<PackageJson> = {}): PackageJson {
  return {
    name: '@crewspace/test-pkg',
    version: '0.1.0',
    description: 'Test package',
    license: 'MIT',
    type: 'module',
    main: './dist/index.js',
    types: './dist/index.d.ts',
    keywords: ['crewspace', 'typescript', 'test'],
    homepage: 'https://github.com/aviferdman/ProjectX2-Product#readme',
    bugs: { url: 'https://github.com/aviferdman/ProjectX2-Product/issues' },
    repository: {
      type: 'git',
      url: 'https://github.com/aviferdman/ProjectX2-Product.git',
      directory: 'packages/test-pkg',
    },
    author: 'Crewspace Contributors',
    engines: { node: '>=18.0.0' },
    publishConfig: { access: 'public', registry: 'https://registry.npmjs.org/' },
    ...overrides,
  };
}

describe('validate-package-metadata', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'validate-pkg-meta-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('validateRequiredFields', () => {
    it('passes for complete package', () => {
      const checks = validateRequiredFields(makePackageJson());
      expect(checks.every((c) => c.status === 'pass')).toBe(true);
    });

    it('fails for missing name', () => {
      const checks = validateRequiredFields(makePackageJson({ name: undefined }));
      expect(checks.some((c) => c.status === 'fail' && c.name === 'required-name')).toBe(true);
    });

    it('fails for missing version', () => {
      const checks = validateRequiredFields(makePackageJson({ version: undefined }));
      expect(checks.some((c) => c.status === 'fail' && c.name === 'required-version')).toBe(true);
    });

    it('fails for missing description', () => {
      const checks = validateRequiredFields(makePackageJson({ description: undefined }));
      expect(checks.some((c) => c.status === 'fail' && c.name === 'required-description')).toBe(
        true,
      );
    });

    it('fails for empty keywords array', () => {
      const checks = validateRequiredFields(makePackageJson({ keywords: [] }));
      expect(checks.some((c) => c.status === 'fail' && c.name === 'required-keywords')).toBe(true);
    });

    it('fails for empty string fields', () => {
      const checks = validateRequiredFields(makePackageJson({ license: '' }));
      expect(checks.some((c) => c.status === 'fail' && c.name === 'required-license')).toBe(true);
    });
  });

  describe('validateName', () => {
    it('passes for @crewspace/ scoped name', () => {
      const checks = validateName(makePackageJson({ name: '@crewspace/core' }));
      expect(checks.every((c) => c.status === 'pass')).toBe(true);
    });

    it('fails for non-scoped name', () => {
      const checks = validateName(makePackageJson({ name: 'crewspace-core' }));
      expect(checks.some((c) => c.status === 'fail' && c.name === 'name-scope')).toBe(true);
    });

    it('fails when name is missing', () => {
      const checks = validateName(makePackageJson({ name: undefined }));
      expect(checks.some((c) => c.status === 'fail')).toBe(true);
    });

    it('passes for valid unscoped portion', () => {
      const checks = validateName(makePackageJson({ name: '@crewspace/tools-file' }));
      expect(checks.find((c) => c.name === 'name-format')?.status).toBe('pass');
    });
  });

  describe('validateVersion', () => {
    it('passes for valid semver', () => {
      const checks = validateVersion(makePackageJson({ version: '0.1.0' }));
      expect(checks[0]?.status).toBe('pass');
    });

    it('passes for semver with prerelease', () => {
      const checks = validateVersion(makePackageJson({ version: '1.0.0-alpha.1' }));
      expect(checks[0]?.status).toBe('pass');
    });

    it('fails for invalid semver', () => {
      const checks = validateVersion(makePackageJson({ version: 'not-semver' }));
      expect(checks[0]?.status).toBe('fail');
    });

    it('fails when version is missing', () => {
      const checks = validateVersion(makePackageJson({ version: undefined }));
      expect(checks[0]?.status).toBe('fail');
    });
  });

  describe('validateLicense', () => {
    it('passes for MIT', () => {
      const checks = validateLicense(makePackageJson({ license: 'MIT' }));
      expect(checks[0]?.status).toBe('pass');
    });

    it('fails for non-MIT', () => {
      const checks = validateLicense(makePackageJson({ license: 'Apache-2.0' }));
      expect(checks[0]?.status).toBe('fail');
    });

    it('fails when missing', () => {
      const checks = validateLicense(makePackageJson({ license: undefined }));
      expect(checks[0]?.status).toBe('fail');
    });
  });

  describe('validateKeywords', () => {
    it('passes with baseline keywords present', () => {
      const checks = validateKeywords(
        makePackageJson({ keywords: ['crewspace', 'typescript', 'agent'] }),
      );
      expect(checks.every((c) => c.status === 'pass')).toBe(true);
    });

    it('warns when baseline keywords are missing', () => {
      const checks = validateKeywords(makePackageJson({ keywords: ['agent', 'ai'] }));
      expect(checks.some((c) => c.status === 'warn' && c.name === 'keywords-baseline')).toBe(true);
    });

    it('fails when keywords is not an array', () => {
      const checks = validateKeywords(makePackageJson({ keywords: undefined }));
      expect(checks.some((c) => c.status === 'fail')).toBe(true);
    });

    it('fails when keywords is empty', () => {
      const checks = validateKeywords(makePackageJson({ keywords: [] }));
      expect(checks.some((c) => c.status === 'fail')).toBe(true);
    });
  });

  describe('validateRepository', () => {
    it('passes for correct repository object', () => {
      const pkgDir = join(tempDir, 'test-pkg');
      mkdirSync(pkgDir, { recursive: true });
      const checks = validateRepository(makePackageJson(), pkgDir);
      expect(checks.every((c) => c.status === 'pass')).toBe(true);
    });

    it('fails when repository is missing', () => {
      const checks = validateRepository(makePackageJson({ repository: undefined }), tempDir);
      expect(checks.some((c) => c.status === 'fail')).toBe(true);
    });

    it('warns for string repository', () => {
      const checks = validateRepository(
        makePackageJson({ repository: 'github:test/repo' } as unknown as PackageJson),
        tempDir,
      );
      expect(checks.some((c) => c.status === 'warn' && c.name === 'repository-format')).toBe(true);
    });
  });

  describe('validateHomepageAndBugs', () => {
    it('passes when both are present', () => {
      const checks = validateHomepageAndBugs(makePackageJson());
      expect(checks.every((c) => c.status === 'pass')).toBe(true);
    });

    it('fails when homepage is missing', () => {
      const checks = validateHomepageAndBugs(makePackageJson({ homepage: undefined }));
      expect(checks.some((c) => c.status === 'fail' && c.name === 'homepage-present')).toBe(true);
    });

    it('fails when bugs is missing', () => {
      const checks = validateHomepageAndBugs(makePackageJson({ bugs: undefined }));
      expect(checks.some((c) => c.status === 'fail' && c.name === 'bugs-present')).toBe(true);
    });
  });

  describe('validateAuthor', () => {
    it('passes when author is present', () => {
      const checks = validateAuthor(makePackageJson({ author: 'Test Author' }));
      expect(checks[0]?.status).toBe('pass');
    });

    it('warns when author is missing', () => {
      const checks = validateAuthor(makePackageJson({ author: undefined }));
      expect(checks[0]?.status).toBe('warn');
    });
  });

  describe('validateEngines', () => {
    it('passes for correct node engine', () => {
      const checks = validateEngines(makePackageJson({ engines: { node: '>=18.0.0' } }));
      expect(checks[0]?.status).toBe('pass');
    });

    it('warns when engines is missing', () => {
      const checks = validateEngines(makePackageJson({ engines: undefined }));
      expect(checks[0]?.status).toBe('warn');
    });

    it('warns when node engine differs', () => {
      const checks = validateEngines(makePackageJson({ engines: { node: '>=16.0.0' } }));
      expect(checks[0]?.status).toBe('warn');
    });
  });

  describe('validateTypeField', () => {
    it('passes for type "module"', () => {
      const checks = validateTypeField(makePackageJson({ type: 'module' }));
      expect(checks[0]?.status).toBe('pass');
    });

    it('warns when type is missing', () => {
      const checks = validateTypeField(makePackageJson({ type: undefined }));
      expect(checks[0]?.status).toBe('warn');
    });

    it('warns when type is not "module"', () => {
      const checks = validateTypeField(makePackageJson({ type: 'commonjs' }));
      expect(checks[0]?.status).toBe('warn');
    });
  });

  describe('validatePublishConfig', () => {
    it('passes with correct publishConfig', () => {
      const checks = validatePublishConfig(
        makePackageJson({ publishConfig: { access: 'public', registry: 'https://registry.npmjs.org/' } }),
      );
      expect(checks.every((c) => c.status === 'pass')).toBe(true);
    });

    it('fails when publishConfig is missing', () => {
      const checks = validatePublishConfig(makePackageJson({ publishConfig: undefined }));
      expect(checks.some((c) => c.status === 'fail' && c.name === 'publish-config-present')).toBe(true);
    });

    it('fails when access is not public', () => {
      const checks = validatePublishConfig(
        makePackageJson({ publishConfig: { access: 'restricted' } }),
      );
      expect(checks.some((c) => c.status === 'fail' && c.name === 'publish-config-access')).toBe(true);
    });

    it('warns when registry is non-standard', () => {
      const checks = validatePublishConfig(
        makePackageJson({ publishConfig: { access: 'public', registry: 'https://custom.registry.com/' } }),
      );
      expect(checks.some((c) => c.status === 'warn' && c.name === 'publish-config-registry')).toBe(true);
    });

    it('passes when registry matches without trailing slash', () => {
      const checks = validatePublishConfig(
        makePackageJson({ publishConfig: { access: 'public', registry: 'https://registry.npmjs.org' } }),
      );
      const registryCheck = checks.find((c) => c.name === 'publish-config-registry');
      expect(registryCheck?.status).toBe('pass');
    });
  });

  describe('validatePackage', () => {
    it('passes for a fully valid package', () => {
      const pkgDir = join(tempDir, 'test-pkg');
      mkdirSync(pkgDir, { recursive: true });
      writeFileSync(join(pkgDir, 'package.json'), JSON.stringify(makePackageJson()));

      const result = validatePackage(pkgDir);
      expect(result.passed).toBe(true);
      expect(result.packageName).toBe('@crewspace/test-pkg');
    });

    it('fails when package.json is missing', () => {
      const pkgDir = join(tempDir, 'missing');
      const result = validatePackage(pkgDir);
      expect(result.passed).toBe(false);
      expect(result.packageName).toBe('unknown');
    });

    it('fails for package with missing required fields', () => {
      const pkgDir = join(tempDir, 'incomplete');
      mkdirSync(pkgDir, { recursive: true });
      writeFileSync(
        join(pkgDir, 'package.json'),
        JSON.stringify({ name: '@crewspace/incomplete', version: '0.1.0' }),
      );

      const result = validatePackage(pkgDir);
      expect(result.passed).toBe(false);
    });
  });

  describe('validateCrossPackageConsistency', () => {
    it('passes when all packages have same version', () => {
      const dir1 = join(tempDir, 'pkg1');
      const dir2 = join(tempDir, 'pkg2');
      mkdirSync(dir1, { recursive: true });
      mkdirSync(dir2, { recursive: true });
      writeFileSync(
        join(dir1, 'package.json'),
        JSON.stringify(makePackageJson({ name: '@crewspace/pkg1' })),
      );
      writeFileSync(
        join(dir2, 'package.json'),
        JSON.stringify(makePackageJson({ name: '@crewspace/pkg2' })),
      );

      const results = [validatePackage(dir1), validatePackage(dir2)];
      const checks = validateCrossPackageConsistency(results);
      expect(checks.some((c) => c.status === 'pass' && c.name === 'version-consistency')).toBe(
        true,
      );
    });

    it('warns when packages have different versions', () => {
      const dir1 = join(tempDir, 'pkg1');
      const dir2 = join(tempDir, 'pkg2');
      mkdirSync(dir1, { recursive: true });
      mkdirSync(dir2, { recursive: true });
      writeFileSync(
        join(dir1, 'package.json'),
        JSON.stringify(makePackageJson({ name: '@crewspace/pkg1', version: '0.1.0' })),
      );
      writeFileSync(
        join(dir2, 'package.json'),
        JSON.stringify(makePackageJson({ name: '@crewspace/pkg2', version: '0.2.0' })),
      );

      const results = [validatePackage(dir1), validatePackage(dir2)];
      const checks = validateCrossPackageConsistency(results);
      expect(checks.some((c) => c.status === 'warn' && c.name === 'version-consistency')).toBe(
        true,
      );
    });
  });

  describe('applyFixes', () => {
    it('adds missing homepage', () => {
      const pkgDir = join(tempDir, 'fixme');
      mkdirSync(pkgDir, { recursive: true });
      writeFileSync(
        join(pkgDir, 'package.json'),
        JSON.stringify(makePackageJson({ homepage: undefined })),
      );

      const { fixed, pkg } = applyFixes(pkgDir);
      expect(fixed).toContain('Added homepage');
      expect(pkg.homepage).toBe('https://github.com/aviferdman/ProjectX2-Product#readme');

      const written = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf-8'));
      expect(written.homepage).toBe('https://github.com/aviferdman/ProjectX2-Product#readme');
    });

    it('adds missing bugs URL', () => {
      const pkgDir = join(tempDir, 'fixme');
      mkdirSync(pkgDir, { recursive: true });
      writeFileSync(
        join(pkgDir, 'package.json'),
        JSON.stringify(makePackageJson({ bugs: undefined })),
      );

      const { fixed, pkg } = applyFixes(pkgDir);
      expect(fixed).toContain('Added bugs URL');
      expect(pkg.bugs).toEqual({
        url: 'https://github.com/aviferdman/ProjectX2-Product/issues',
      });
    });

    it('adds missing author', () => {
      const pkgDir = join(tempDir, 'fixme');
      mkdirSync(pkgDir, { recursive: true });
      writeFileSync(
        join(pkgDir, 'package.json'),
        JSON.stringify(makePackageJson({ author: undefined })),
      );

      const { fixed } = applyFixes(pkgDir);
      expect(fixed).toContain('Added author');
    });

    it('adds missing baseline keywords', () => {
      const pkgDir = join(tempDir, 'fixme');
      mkdirSync(pkgDir, { recursive: true });
      writeFileSync(
        join(pkgDir, 'package.json'),
        JSON.stringify(makePackageJson({ keywords: ['agent'] })),
      );

      const { fixed, pkg } = applyFixes(pkgDir);
      expect(fixed.some((f) => f.includes('baseline keywords'))).toBe(true);
      expect(pkg.keywords).toContain('crewspace');
      expect(pkg.keywords).toContain('typescript');
    });

    it('adds missing publishConfig', () => {
      const pkgDir = join(tempDir, 'fixme');
      mkdirSync(pkgDir, { recursive: true });
      writeFileSync(
        join(pkgDir, 'package.json'),
        JSON.stringify(makePackageJson({ publishConfig: undefined })),
      );

      const { fixed, pkg } = applyFixes(pkgDir);
      expect(fixed.some((f) => f.includes('publishConfig'))).toBe(true);
      expect(pkg.publishConfig?.access).toBe('public');
      expect(pkg.publishConfig?.registry).toBe('https://registry.npmjs.org/');
    });

    it('fixes publishConfig access when not public', () => {
      const pkgDir = join(tempDir, 'fixme');
      mkdirSync(pkgDir, { recursive: true });
      writeFileSync(
        join(pkgDir, 'package.json'),
        JSON.stringify(makePackageJson({ publishConfig: { access: 'restricted' } })),
      );

      const { fixed, pkg } = applyFixes(pkgDir);
      expect(fixed.some((f) => f.includes('publishConfig.access'))).toBe(true);
      expect(pkg.publishConfig?.access).toBe('public');
    });

    it('does nothing when everything is present', () => {
      const pkgDir = join(tempDir, 'good');
      mkdirSync(pkgDir, { recursive: true });
      writeFileSync(join(pkgDir, 'package.json'), JSON.stringify(makePackageJson()));

      const { fixed } = applyFixes(pkgDir);
      expect(fixed).toHaveLength(0);
    });
  });

  describe('discoverPackages', () => {
    it('discovers packages with package.json', () => {
      const root = join(tempDir, 'repo');
      const pkg1 = join(root, 'packages', 'core');
      const pkg2 = join(root, 'packages', 'cli');
      const pkg3 = join(root, 'packages', 'empty');
      mkdirSync(pkg1, { recursive: true });
      mkdirSync(pkg2, { recursive: true });
      mkdirSync(pkg3, { recursive: true });
      writeFileSync(join(pkg1, 'package.json'), '{}');
      writeFileSync(join(pkg2, 'package.json'), '{}');

      const dirs = discoverPackages(root);
      expect(dirs).toHaveLength(2);
    });

    it('returns empty array when packages dir does not exist', () => {
      const dirs = discoverPackages(join(tempDir, 'nonexistent'));
      expect(dirs).toHaveLength(0);
    });
  });

  describe('formatValidationResults', () => {
    it('formats passing results', () => {
      const output = formatValidationResults([
        {
          packageName: '@crewspace/core',
          packageDir: '/tmp/core',
          checks: [{ name: 'test', status: 'pass', message: 'All good' }],
          passed: true,
        },
      ]);
      expect(output).toContain('@crewspace/core');
      expect(output).toContain('All package metadata is valid');
    });

    it('formats failing results', () => {
      const output = formatValidationResults([
        {
          packageName: '@crewspace/broken',
          packageDir: '/tmp/broken',
          checks: [
            { name: 'test', status: 'fail', message: 'Missing field', fixable: true },
          ],
          passed: false,
        },
      ]);
      expect(output).toContain('Validation failed');
      expect(output).toContain('--fix');
    });
  });

  describe('parseArgs', () => {
    it('parses --fix flag', () => {
      expect(parseArgs(['--fix'])).toEqual({ fix: true });
    });

    it('defaults to no fix', () => {
      expect(parseArgs([])).toEqual({ fix: false });
    });
  });
});
