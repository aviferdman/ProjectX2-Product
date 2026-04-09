/**
 * npm organization and publishing credentials validation script.
 *
 * Validates that the @crewspace npm organization is properly configured
 * and publishing credentials are in place:
 * - npm CLI is available and meets minimum version
 * - npm authentication is configured (logged in or token present)
 * - @crewspace scope resolves to the correct registry
 * - All workspace packages have publishConfig with access: "public"
 * - .npmrc has correct scope and registry settings
 * - npm org access is available for @crewspace (when authenticated)
 *
 * Usage:
 *   npx tsx scripts/validate-npm-credentials.ts
 *   npx tsx scripts/validate-npm-credentials.ts --skip-auth   (skip live auth checks)
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

// --- Types ---

export interface CredentialCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn' | 'skip';
  message: string;
}

export interface CredentialValidationResult {
  passed: boolean;
  checks: CredentialCheck[];
  npmVersion: string | null;
  authenticatedUser: string | null;
  scope: string;
  registry: string;
}

export interface CredentialValidationOptions {
  rootDir: string;
  skipAuth?: boolean;
}

// --- Constants ---

const EXPECTED_SCOPE = '@crewspace';
const EXPECTED_REGISTRY = 'https://registry.npmjs.org/';
const MIN_NPM_VERSION = '8.0.0';

// --- Helpers ---

function execSafe(cmd: string, cwd?: string): { stdout: string; error: boolean } {
  try {
    const stdout = execSync(cmd, {
      encoding: 'utf-8',
      cwd,
      timeout: 15000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    return { stdout, error: false };
  } catch {
    return { stdout: '', error: true };
  }
}

/**
 * Compare two semver version strings.
 * Returns -1 if a < b, 0 if equal, 1 if a > b.
 */
export function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const av = pa[i] ?? 0;
    const bv = pb[i] ?? 0;
    if (av < bv) return -1;
    if (av > bv) return 1;
  }
  return 0;
}

// --- Validation Functions ---

/**
 * Check that npm CLI is available and meets minimum version.
 */
export function checkNpmVersion(): { checks: CredentialCheck[]; version: string | null } {
  const checks: CredentialCheck[] = [];
  const result = execSafe('npm --version');

  if (result.error || !result.stdout) {
    checks.push({
      name: 'npm-available',
      status: 'fail',
      message: 'npm CLI not found — install Node.js/npm first',
    });
    return { checks, version: null };
  }

  const version = result.stdout.trim();
  checks.push({
    name: 'npm-available',
    status: 'pass',
    message: `npm CLI available (v${version})`,
  });

  if (compareSemver(version, MIN_NPM_VERSION) < 0) {
    checks.push({
      name: 'npm-version',
      status: 'fail',
      message: `npm v${version} is below minimum v${MIN_NPM_VERSION} — upgrade npm`,
    });
  } else {
    checks.push({
      name: 'npm-version',
      status: 'pass',
      message: `npm v${version} meets minimum requirement (>=${MIN_NPM_VERSION})`,
    });
  }

  return { checks, version };
}

/**
 * Check npm authentication status.
 */
export function checkNpmAuth(
  skipAuth: boolean,
): { checks: CredentialCheck[]; user: string | null } {
  const checks: CredentialCheck[] = [];

  if (skipAuth) {
    checks.push({
      name: 'npm-auth',
      status: 'skip',
      message: 'Authentication check skipped (--skip-auth)',
    });
    return { checks, user: null };
  }

  const result = execSafe('npm whoami');

  if (result.error || !result.stdout) {
    checks.push({
      name: 'npm-auth',
      status: 'fail',
      message:
        'Not authenticated with npm — run "npm login" or set NPM_TOKEN environment variable',
    });
    return { checks, user: null };
  }

  const user = result.stdout.trim();
  checks.push({
    name: 'npm-auth',
    status: 'pass',
    message: `Authenticated as "${user}"`,
  });

  return { checks, user };
}

/**
 * Check that the @crewspace scope resolves to the correct registry.
 */
export function checkScopeRegistry(
  rootDir: string,
): CredentialCheck[] {
  const checks: CredentialCheck[] = [];

  const result = execSafe(`npm config get ${EXPECTED_SCOPE}:registry`, rootDir);

  if (result.error) {
    checks.push({
      name: 'scope-registry',
      status: 'warn',
      message: `Could not query npm config for ${EXPECTED_SCOPE}:registry`,
    });
    return checks;
  }

  const registry = result.stdout.trim();

  if (registry === 'undefined' || !registry) {
    // No scope-specific config; check if default .npmrc handles it
    checks.push({
      name: 'scope-registry',
      status: 'warn',
      message: `No explicit ${EXPECTED_SCOPE}:registry config — will use default registry`,
    });
  } else if (registry === EXPECTED_REGISTRY || registry === EXPECTED_REGISTRY.replace(/\/$/, '')) {
    checks.push({
      name: 'scope-registry',
      status: 'pass',
      message: `${EXPECTED_SCOPE} scope maps to ${registry}`,
    });
  } else {
    checks.push({
      name: 'scope-registry',
      status: 'fail',
      message: `${EXPECTED_SCOPE} scope maps to "${registry}", expected "${EXPECTED_REGISTRY}"`,
    });
  }

  return checks;
}

/**
 * Check that .npmrc exists and has correct configuration.
 */
export function checkNpmrc(rootDir: string): CredentialCheck[] {
  const checks: CredentialCheck[] = [];
  const npmrcPath = join(rootDir, '.npmrc');

  if (!existsSync(npmrcPath)) {
    checks.push({
      name: 'npmrc-exists',
      status: 'fail',
      message: '.npmrc not found in repository root',
    });
    return checks;
  }

  checks.push({
    name: 'npmrc-exists',
    status: 'pass',
    message: '.npmrc exists in repository root',
  });

  const content = readFileSync(npmrcPath, 'utf-8');

  if (content.includes('registry=https://registry.npmjs.org/')) {
    checks.push({
      name: 'npmrc-registry',
      status: 'pass',
      message: 'Default registry is set to npmjs.org',
    });
  } else {
    checks.push({
      name: 'npmrc-registry',
      status: 'fail',
      message: '.npmrc missing default registry (registry=https://registry.npmjs.org/)',
    });
  }

  if (content.includes(`${EXPECTED_SCOPE}:registry=`)) {
    checks.push({
      name: 'npmrc-scope',
      status: 'pass',
      message: `${EXPECTED_SCOPE} scope registry configured in .npmrc`,
    });
  } else {
    checks.push({
      name: 'npmrc-scope',
      status: 'warn',
      message: `${EXPECTED_SCOPE} scope registry not explicitly set in .npmrc`,
    });
  }

  if (content.includes('access=public')) {
    checks.push({
      name: 'npmrc-access',
      status: 'pass',
      message: 'Default access is set to "public"',
    });
  } else {
    checks.push({
      name: 'npmrc-access',
      status: 'fail',
      message: '.npmrc missing access=public (required for scoped packages)',
    });
  }

  // Ensure no tokens are committed
  if (content.includes('_authToken') || content.includes('_auth=')) {
    checks.push({
      name: 'npmrc-no-secrets',
      status: 'fail',
      message: '.npmrc contains authentication tokens — remove secrets from version control!',
    });
  } else {
    checks.push({
      name: 'npmrc-no-secrets',
      status: 'pass',
      message: 'No authentication tokens in .npmrc (secrets are safe)',
    });
  }

  return checks;
}

/**
 * Discover workspace packages and validate publishConfig.
 */
export function checkPackagePublishConfig(rootDir: string): CredentialCheck[] {
  const checks: CredentialCheck[] = [];
  const packagesDir = join(rootDir, 'packages');

  if (!existsSync(packagesDir)) {
    checks.push({
      name: 'packages-dir',
      status: 'fail',
      message: 'packages/ directory not found',
    });
    return checks;
  }

  const packageDirs = readdirSync(packagesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => ({ name: d.name, path: join(packagesDir, d.name) }))
    .filter(({ path }) => existsSync(join(path, 'package.json')));

  let allHavePublishConfig = true;
  let allPublic = true;
  let allCorrectRegistry = true;
  let allScoped = true;
  const issues: string[] = [];

  for (const { name: dirName, path: pkgDir } of packageDirs) {
    const pkgJson = JSON.parse(
      readFileSync(join(pkgDir, 'package.json'), 'utf-8'),
    ) as Record<string, unknown>;

    const pkgName = String(pkgJson['name'] ?? dirName);

    if (!pkgName.startsWith(EXPECTED_SCOPE + '/')) {
      allScoped = false;
      issues.push(`${pkgName}: not scoped under ${EXPECTED_SCOPE}`);
    }

    const publishConfig = pkgJson['publishConfig'] as
      | { access?: string; registry?: string }
      | undefined;

    if (!publishConfig) {
      allHavePublishConfig = false;
      issues.push(`${pkgName}: missing publishConfig`);
      continue;
    }

    if (publishConfig.access !== 'public') {
      allPublic = false;
      issues.push(`${pkgName}: publishConfig.access is "${publishConfig.access}", expected "public"`);
    }

    if (
      publishConfig.registry &&
      publishConfig.registry !== EXPECTED_REGISTRY &&
      publishConfig.registry !== EXPECTED_REGISTRY.replace(/\/$/, '')
    ) {
      allCorrectRegistry = false;
      issues.push(
        `${pkgName}: publishConfig.registry is "${publishConfig.registry}", expected "${EXPECTED_REGISTRY}"`,
      );
    }
  }

  if (allScoped) {
    checks.push({
      name: 'packages-scoped',
      status: 'pass',
      message: `All ${packageDirs.length} packages use ${EXPECTED_SCOPE}/ scope`,
    });
  } else {
    checks.push({
      name: 'packages-scoped',
      status: 'fail',
      message: `Some packages are not scoped under ${EXPECTED_SCOPE}/`,
    });
  }

  if (allHavePublishConfig) {
    checks.push({
      name: 'packages-publish-config',
      status: 'pass',
      message: `All ${packageDirs.length} packages have publishConfig`,
    });
  } else {
    checks.push({
      name: 'packages-publish-config',
      status: 'fail',
      message: 'Some packages are missing publishConfig',
    });
  }

  if (allPublic) {
    checks.push({
      name: 'packages-public-access',
      status: 'pass',
      message: 'All packages have publishConfig.access = "public"',
    });
  } else {
    checks.push({
      name: 'packages-public-access',
      status: 'fail',
      message: 'Some packages do not have publishConfig.access = "public"',
    });
  }

  if (allCorrectRegistry) {
    checks.push({
      name: 'packages-registry',
      status: 'pass',
      message: 'All packages target the correct registry',
    });
  } else {
    checks.push({
      name: 'packages-registry',
      status: 'fail',
      message: 'Some packages target an incorrect registry',
    });
  }

  for (const issue of issues) {
    checks.push({
      name: 'package-issue',
      status: 'fail',
      message: issue,
    });
  }

  return checks;
}

/**
 * Check org access for @crewspace on npm (requires authentication).
 */
export function checkOrgAccess(skipAuth: boolean): CredentialCheck[] {
  const checks: CredentialCheck[] = [];

  if (skipAuth) {
    checks.push({
      name: 'org-access',
      status: 'skip',
      message: 'Organization access check skipped (--skip-auth)',
    });
    return checks;
  }

  const result = execSafe(`npm org ls ${EXPECTED_SCOPE.replace('@', '')} 2>&1`);

  if (result.error) {
    checks.push({
      name: 'org-access',
      status: 'warn',
      message: `Could not verify ${EXPECTED_SCOPE} org access — org may not exist yet or you may not have access`,
    });
  } else if (result.stdout.includes('404') || result.stdout.includes('not found')) {
    checks.push({
      name: 'org-access',
      status: 'warn',
      message: `${EXPECTED_SCOPE} organization not found on npm — create it at https://www.npmjs.com/org/create`,
    });
  } else {
    checks.push({
      name: 'org-access',
      status: 'pass',
      message: `${EXPECTED_SCOPE} organization is accessible on npm`,
    });
  }

  return checks;
}

// --- Main Validation ---

export function validateNpmCredentials(
  options: CredentialValidationOptions,
): CredentialValidationResult {
  const allChecks: CredentialCheck[] = [];

  const npmResult = checkNpmVersion();
  allChecks.push(...npmResult.checks);

  const authResult = checkNpmAuth(options.skipAuth ?? false);
  allChecks.push(...authResult.checks);

  allChecks.push(...checkNpmrc(options.rootDir));
  allChecks.push(...checkScopeRegistry(options.rootDir));
  allChecks.push(...checkPackagePublishConfig(options.rootDir));
  allChecks.push(...checkOrgAccess(options.skipAuth ?? false));

  const passed = allChecks
    .filter((c) => c.status !== 'skip')
    .every((c) => c.status !== 'fail');

  return {
    passed,
    checks: allChecks,
    npmVersion: npmResult.version,
    authenticatedUser: authResult.user,
    scope: EXPECTED_SCOPE,
    registry: EXPECTED_REGISTRY,
  };
}

// --- Output Formatting ---

export function formatCredentialOutput(result: CredentialValidationResult): string {
  const lines: string[] = [];

  lines.push('=== npm Organization & Credentials Validation ===');
  lines.push('');
  lines.push(`Scope: ${result.scope}`);
  lines.push(`Registry: ${result.registry}`);
  if (result.npmVersion) {
    lines.push(`npm version: ${result.npmVersion}`);
  }
  if (result.authenticatedUser) {
    lines.push(`Authenticated as: ${result.authenticatedUser}`);
  }
  lines.push('');

  for (const check of result.checks) {
    const icon =
      check.status === 'pass'
        ? '✓'
        : check.status === 'fail'
          ? '✗'
          : check.status === 'skip'
            ? '⊘'
            : '⚠';
    lines.push(`  ${icon} ${check.message}`);
  }

  lines.push('');

  const failCount = result.checks.filter((c) => c.status === 'fail').length;
  const warnCount = result.checks.filter((c) => c.status === 'warn').length;
  const passCount = result.checks.filter((c) => c.status === 'pass').length;
  const skipCount = result.checks.filter((c) => c.status === 'skip').length;

  lines.push(
    `Results: ${passCount} passed, ${failCount} failed, ${warnCount} warnings, ${skipCount} skipped`,
  );
  lines.push('');
  lines.push(
    result.passed
      ? '✓ npm publishing configuration is valid!'
      : '✗ Publishing configuration issues found — fix errors before publishing',
  );

  return lines.join('\n');
}

// --- CLI Entry Point ---

export function parseArgs(argv: string[]): { skipAuth: boolean } {
  return { skipAuth: argv.includes('--skip-auth') };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

  const result = validateNpmCredentials({
    rootDir: ROOT,
    skipAuth: args.skipAuth,
  });

  console.log(formatCredentialOutput(result));

  if (!result.passed) {
    process.exit(1);
  }
}

const isDirectExecution = process.argv[1]?.endsWith('validate-npm-credentials.ts') ?? false;
if (isDirectExecution) {
  main();
}
