/**
 * Package metadata validation script for @crewspace packages.
 *
 * Validates that every workspace package has correct and consistent metadata:
 * - Required fields: name, version, description, license, keywords, repository, homepage, bugs
 * - @crewspace/ scope naming convention
 * - Valid semver version
 * - Consistent license (MIT) and engines across packages
 * - Keywords include baseline terms
 * - Author information present
 *
 * Usage:
 *   npx tsx scripts/validate-package-metadata.ts
 *   npx tsx scripts/validate-package-metadata.ts --fix   (auto-fix where possible)
 */

import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// --- Types ---

export interface ValidationResult {
  packageName: string;
  packageDir: string;
  checks: ValidationCheck[];
  passed: boolean;
}

export interface ValidationCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  fixable?: boolean;
}

export interface PackageJson {
  name?: string;
  version?: string;
  description?: string;
  license?: string;
  type?: string;
  main?: string;
  module?: string;
  types?: string;
  exports?: Record<string, unknown>;
  files?: string[];
  sideEffects?: boolean | string[];
  engines?: Record<string, string>;
  keywords?: string[];
  homepage?: string;
  bugs?: { url: string } | string;
  repository?: { type: string; url: string; directory?: string } | string;
  author?: string | { name: string; url?: string };
  publishConfig?: { access?: string; registry?: string };
  private?: boolean;
  [key: string]: unknown;
}

export interface ValidateOptions {
  rootDir: string;
  fix?: boolean;
}

// --- Constants ---

const EXPECTED_SCOPE = '@crewspace/';
const EXPECTED_LICENSE = 'MIT';
const EXPECTED_NODE_ENGINE = '>=18.0.0';
const REPO_URL = 'https://github.com/aviferdman/ProjectX2-Product.git';
const HOMEPAGE_BASE = 'https://github.com/aviferdman/ProjectX2-Product#readme';
const BUGS_URL = 'https://github.com/aviferdman/ProjectX2-Product/issues';
const EXPECTED_AUTHOR = 'Crewspace Contributors';

const SEMVER_RE =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

const BASELINE_KEYWORDS = ['crewspace', 'typescript'];

// --- Discovery ---

export function discoverPackages(rootDir: string): string[] {
  const packagesDir = join(rootDir, 'packages');
  if (!existsSync(packagesDir)) {
    return [];
  }
  return readdirSync(packagesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => join(packagesDir, d.name))
    .filter((dir) => existsSync(join(dir, 'package.json')));
}

// --- Validation Functions ---

export function validateRequiredFields(pkg: PackageJson): ValidationCheck[] {
  const checks: ValidationCheck[] = [];
  const requiredFields: Array<keyof PackageJson> = [
    'name',
    'version',
    'description',
    'license',
    'keywords',
    'repository',
  ];

  for (const field of requiredFields) {
    const value = pkg[field];
    if (value === undefined || value === null || value === '') {
      checks.push({
        name: `required-${field}`,
        status: 'fail',
        message: `Missing required field: "${field}"`,
      });
    } else if (Array.isArray(value) && value.length === 0) {
      checks.push({
        name: `required-${field}`,
        status: 'fail',
        message: `Field "${field}" is an empty array`,
      });
    } else {
      checks.push({
        name: `required-${field}`,
        status: 'pass',
        message: `"${field}" is present`,
      });
    }
  }

  return checks;
}

export function validateName(pkg: PackageJson): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  if (!pkg.name) {
    return [{ name: 'name-scope', status: 'fail', message: 'Package name is missing' }];
  }

  if (!pkg.name.startsWith(EXPECTED_SCOPE)) {
    checks.push({
      name: 'name-scope',
      status: 'fail',
      message: `Package name "${pkg.name}" does not use @crewspace/ scope`,
    });
  } else {
    checks.push({
      name: 'name-scope',
      status: 'pass',
      message: `Package name uses @crewspace/ scope`,
    });
  }

  const unscoped = pkg.name.replace(EXPECTED_SCOPE, '');
  if (!/^[a-z][a-z0-9-]*$/.test(unscoped)) {
    checks.push({
      name: 'name-format',
      status: 'warn',
      message: `Unscoped name "${unscoped}" may not follow npm naming conventions`,
    });
  } else {
    checks.push({
      name: 'name-format',
      status: 'pass',
      message: 'Package name follows npm naming conventions',
    });
  }

  return checks;
}

export function validateVersion(pkg: PackageJson): ValidationCheck[] {
  if (!pkg.version) {
    return [{ name: 'version-semver', status: 'fail', message: 'Version is missing' }];
  }

  if (!SEMVER_RE.test(pkg.version)) {
    return [
      {
        name: 'version-semver',
        status: 'fail',
        message: `Version "${pkg.version}" is not valid semver`,
      },
    ];
  }

  return [
    {
      name: 'version-semver',
      status: 'pass',
      message: `Version "${pkg.version}" is valid semver`,
    },
  ];
}

export function validateLicense(pkg: PackageJson): ValidationCheck[] {
  if (!pkg.license) {
    return [{ name: 'license-value', status: 'fail', message: 'License is missing' }];
  }

  if (pkg.license !== EXPECTED_LICENSE) {
    return [
      {
        name: 'license-value',
        status: 'fail',
        message: `License "${pkg.license}" does not match expected "${EXPECTED_LICENSE}"`,
      },
    ];
  }

  return [
    {
      name: 'license-value',
      status: 'pass',
      message: `License is ${EXPECTED_LICENSE}`,
    },
  ];
}

export function validateKeywords(pkg: PackageJson): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  if (!pkg.keywords || !Array.isArray(pkg.keywords)) {
    return [
      {
        name: 'keywords-present',
        status: 'fail',
        message: 'Keywords field is missing or not an array',
      },
    ];
  }

  if (pkg.keywords.length === 0) {
    return [{ name: 'keywords-present', status: 'fail', message: 'Keywords array is empty' }];
  }

  checks.push({
    name: 'keywords-present',
    status: 'pass',
    message: `Has ${pkg.keywords.length} keywords`,
  });

  const missingBaseline = BASELINE_KEYWORDS.filter((kw) => !pkg.keywords!.includes(kw));
  if (missingBaseline.length > 0) {
    checks.push({
      name: 'keywords-baseline',
      status: 'warn',
      message: `Missing baseline keywords: ${missingBaseline.join(', ')}`,
      fixable: true,
    });
  } else {
    checks.push({
      name: 'keywords-baseline',
      status: 'pass',
      message: 'All baseline keywords present',
    });
  }

  return checks;
}

export function validateRepository(pkg: PackageJson, pkgDir: string): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  if (!pkg.repository) {
    return [
      {
        name: 'repository-present',
        status: 'fail',
        message: 'Repository field is missing',
        fixable: true,
      },
    ];
  }

  if (typeof pkg.repository === 'string') {
    checks.push({
      name: 'repository-format',
      status: 'warn',
      message: 'Repository should be an object with type, url, and directory fields',
    });
    return checks;
  }

  checks.push({
    name: 'repository-present',
    status: 'pass',
    message: 'Repository field is present',
  });

  if (pkg.repository.url !== REPO_URL) {
    checks.push({
      name: 'repository-url',
      status: 'warn',
      message: `Repository URL "${pkg.repository.url}" differs from expected "${REPO_URL}"`,
    });
  } else {
    checks.push({
      name: 'repository-url',
      status: 'pass',
      message: 'Repository URL is correct',
    });
  }

  const expectedDir = 'packages/' + pkgDir.split(/[\\/]/).pop();
  if (pkg.repository.directory !== expectedDir) {
    checks.push({
      name: 'repository-directory',
      status: 'warn',
      message: `Repository directory "${pkg.repository.directory}" differs from expected "${expectedDir}"`,
      fixable: true,
    });
  } else {
    checks.push({
      name: 'repository-directory',
      status: 'pass',
      message: 'Repository directory is correct',
    });
  }

  return checks;
}

export function validateHomepageAndBugs(pkg: PackageJson): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  if (!pkg.homepage) {
    checks.push({
      name: 'homepage-present',
      status: 'fail',
      message: 'Homepage field is missing',
      fixable: true,
    });
  } else {
    checks.push({
      name: 'homepage-present',
      status: 'pass',
      message: 'Homepage field is present',
    });
  }

  if (!pkg.bugs) {
    checks.push({
      name: 'bugs-present',
      status: 'fail',
      message: 'Bugs field is missing',
      fixable: true,
    });
  } else {
    checks.push({
      name: 'bugs-present',
      status: 'pass',
      message: 'Bugs field is present',
    });
  }

  return checks;
}

export function validateAuthor(pkg: PackageJson): ValidationCheck[] {
  if (!pkg.author) {
    return [
      {
        name: 'author-present',
        status: 'warn',
        message: 'Author field is missing (recommended for npm discoverability)',
        fixable: true,
      },
    ];
  }

  return [
    {
      name: 'author-present',
      status: 'pass',
      message: 'Author field is present',
    },
  ];
}

export function validateEngines(pkg: PackageJson): ValidationCheck[] {
  if (!pkg.engines) {
    return [
      {
        name: 'engines-present',
        status: 'warn',
        message: 'Engines field is missing',
        fixable: true,
      },
    ];
  }

  if (pkg.engines.node !== EXPECTED_NODE_ENGINE) {
    return [
      {
        name: 'engines-node',
        status: 'warn',
        message: `Node engine "${pkg.engines.node}" differs from expected "${EXPECTED_NODE_ENGINE}"`,
      },
    ];
  }

  return [
    {
      name: 'engines-node',
      status: 'pass',
      message: `Node engine requirement is ${EXPECTED_NODE_ENGINE}`,
    },
  ];
}

export function validateTypeField(pkg: PackageJson): ValidationCheck[] {
  if (!pkg.type) {
    return [
      {
        name: 'type-present',
        status: 'warn',
        message: 'Type field is missing (should be "module" for ESM)',
      },
    ];
  }

  if (pkg.type !== 'module') {
    return [
      {
        name: 'type-value',
        status: 'warn',
        message: `Type is "${pkg.type}", expected "module" for ESM packages`,
      },
    ];
  }

  return [
    {
      name: 'type-value',
      status: 'pass',
      message: 'Package type is "module"',
    },
  ];
}

export function validatePublishConfig(pkg: PackageJson): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  if (!pkg.publishConfig) {
    checks.push({
      name: 'publish-config-present',
      status: 'fail',
      message: 'publishConfig is missing — scoped packages default to restricted access',
      fixable: true,
    });
    return checks;
  }

  checks.push({
    name: 'publish-config-present',
    status: 'pass',
    message: 'publishConfig is present',
  });

  if (pkg.publishConfig.access === 'public') {
    checks.push({
      name: 'publish-config-access',
      status: 'pass',
      message: 'publishConfig.access is "public"',
    });
  } else {
    checks.push({
      name: 'publish-config-access',
      status: 'fail',
      message: `publishConfig.access is "${pkg.publishConfig.access ?? 'unset'}", expected "public"`,
      fixable: true,
    });
  }

  const expectedRegistry = 'https://registry.npmjs.org/';
  if (pkg.publishConfig.registry) {
    if (
      pkg.publishConfig.registry === expectedRegistry ||
      pkg.publishConfig.registry === expectedRegistry.replace(/\/$/, '')
    ) {
      checks.push({
        name: 'publish-config-registry',
        status: 'pass',
        message: 'publishConfig.registry points to npmjs.org',
      });
    } else {
      checks.push({
        name: 'publish-config-registry',
        status: 'warn',
        message: `publishConfig.registry is "${pkg.publishConfig.registry}", expected "${expectedRegistry}"`,
      });
    }
  }

  return checks;
}

// --- Main Validation ---

export function validatePackage(pkgDir: string): ValidationResult {
  const pkgJsonPath = join(pkgDir, 'package.json');

  if (!existsSync(pkgJsonPath)) {
    return {
      packageName: 'unknown',
      packageDir: pkgDir,
      checks: [{ name: 'package-json', status: 'fail', message: 'package.json not found' }],
      passed: false,
    };
  }

  const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8')) as PackageJson;
  const checks: ValidationCheck[] = [];

  checks.push(...validateRequiredFields(pkg));
  checks.push(...validateName(pkg));
  checks.push(...validateVersion(pkg));
  checks.push(...validateLicense(pkg));
  checks.push(...validateKeywords(pkg));
  checks.push(...validateRepository(pkg, pkgDir));
  checks.push(...validateHomepageAndBugs(pkg));
  checks.push(...validateAuthor(pkg));
  checks.push(...validateEngines(pkg));
  checks.push(...validateTypeField(pkg));
  checks.push(...validatePublishConfig(pkg));

  const passed = checks.every((c) => c.status !== 'fail');

  return {
    packageName: pkg.name ?? 'unknown',
    packageDir: pkgDir,
    checks,
    passed,
  };
}

// --- Fix Logic ---

export function applyFixes(pkgDir: string): { fixed: string[]; pkg: PackageJson } {
  const pkgJsonPath = join(pkgDir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8')) as PackageJson;
  const fixed: string[] = [];

  if (!pkg.homepage) {
    pkg.homepage = HOMEPAGE_BASE;
    fixed.push('Added homepage');
  }

  if (!pkg.bugs) {
    pkg.bugs = { url: BUGS_URL };
    fixed.push('Added bugs URL');
  }

  if (!pkg.author) {
    pkg.author = EXPECTED_AUTHOR;
    fixed.push('Added author');
  }

  if (pkg.keywords && Array.isArray(pkg.keywords)) {
    const missingBaseline = BASELINE_KEYWORDS.filter((kw) => !pkg.keywords!.includes(kw));
    if (missingBaseline.length > 0) {
      pkg.keywords.push(...missingBaseline);
      fixed.push(`Added missing baseline keywords: ${missingBaseline.join(', ')}`);
    }
  }

  if (!pkg.engines) {
    pkg.engines = { node: EXPECTED_NODE_ENGINE };
    fixed.push('Added engines field');
  }

  if (!pkg.publishConfig) {
    pkg.publishConfig = { access: 'public', registry: 'https://registry.npmjs.org/' };
    fixed.push('Added publishConfig with access: "public"');
  } else if (pkg.publishConfig.access !== 'public') {
    pkg.publishConfig.access = 'public';
    fixed.push('Set publishConfig.access to "public"');
  }

  if (fixed.length > 0) {
    writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + '\n');
  }

  return { fixed, pkg };
}

// --- Output Formatting ---

export function formatValidationResults(results: ValidationResult[]): string {
  const lines: string[] = [];

  lines.push('=== Package Metadata Validation ===');
  lines.push('');

  for (const result of results) {
    const icon = result.passed ? '✓' : '✗';
    lines.push(`${icon} ${result.packageName}`);

    for (const check of result.checks) {
      const checkIcon = check.status === 'pass' ? '  ✓' : check.status === 'fail' ? '  ✗' : '  ⚠';
      lines.push(`${checkIcon} ${check.message}`);
    }

    lines.push('');
  }

  const totalPackages = results.length;
  const passedPackages = results.filter((r) => r.passed).length;
  const totalChecks = results.reduce((sum, r) => sum + r.checks.length, 0);
  const failedChecks = results.reduce(
    (sum, r) => sum + r.checks.filter((c) => c.status === 'fail').length,
    0,
  );
  const warnChecks = results.reduce(
    (sum, r) => sum + r.checks.filter((c) => c.status === 'warn').length,
    0,
  );
  const passedChecks = totalChecks - failedChecks - warnChecks;

  lines.push('---');
  lines.push(
    `Packages: ${passedPackages}/${totalPackages} passed | Checks: ${passedChecks} passed, ${failedChecks} failed, ${warnChecks} warnings`,
  );
  lines.push('');

  if (failedChecks === 0) {
    lines.push('✓ All package metadata is valid!');
  } else {
    lines.push('✗ Validation failed — fix the errors above');
    const fixable = results.some((r) => r.checks.some((c) => c.fixable));
    if (fixable) {
      lines.push('  Tip: Run with --fix to auto-fix some issues');
    }
  }

  return lines.join('\n');
}

// --- Cross-Package Consistency ---

export function validateCrossPackageConsistency(results: ValidationResult[]): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  const versions = new Set<string>();
  for (const result of results) {
    const pkg = JSON.parse(
      readFileSync(join(result.packageDir, 'package.json'), 'utf-8'),
    ) as PackageJson;
    if (pkg.version) versions.add(pkg.version);
  }

  if (versions.size > 1) {
    checks.push({
      name: 'version-consistency',
      status: 'warn',
      message: `Multiple versions found across packages: ${Array.from(versions).join(', ')}`,
    });
  } else if (versions.size === 1) {
    checks.push({
      name: 'version-consistency',
      status: 'pass',
      message: `All packages use version ${Array.from(versions)[0]}`,
    });
  }

  return checks;
}

// --- CLI Entry Point ---

export function parseArgs(argv: string[]): { fix: boolean } {
  return { fix: argv.includes('--fix') };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

  const packageDirs = discoverPackages(ROOT);
  if (packageDirs.length === 0) {
    console.error('No packages found in packages/ directory');
    process.exit(1);
  }

  console.log(`Found ${packageDirs.length} packages\n`);

  if (args.fix) {
    console.log('Running in --fix mode\n');
    for (const dir of packageDirs) {
      const { fixed, pkg } = applyFixes(dir);
      if (fixed.length > 0) {
        console.log(`Fixed ${pkg.name}:`);
        for (const f of fixed) {
          console.log(`  • ${f}`);
        }
      }
    }
    console.log('');
  }

  const results = packageDirs.map((dir) => validatePackage(dir));
  const crossChecks = validateCrossPackageConsistency(results);

  console.log(formatValidationResults(results));

  if (crossChecks.length > 0) {
    console.log('\n--- Cross-Package Consistency ---');
    for (const check of crossChecks) {
      const icon = check.status === 'pass' ? '✓' : check.status === 'fail' ? '✗' : '⚠';
      console.log(`${icon} ${check.message}`);
    }
  }

  const allPassed = results.every((r) => r.passed);
  if (!allPassed) {
    process.exit(1);
  }
}

const isDirectExecution = process.argv[1]?.endsWith('validate-package-metadata.ts') ?? false;
if (isDirectExecution) {
  main();
}
