/**
 * Version consistency check script.
 * Validates that VERSION constants in source code match package.json versions
 * and that CHANGELOG.md is well-formed.
 *
 * Usage: npx tsx scripts/check-versions.ts
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

interface PackageJson {
  name: string;
  version: string;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf-8')) as T;
}

function main(): void {
  let hasErrors = false;

  const SEMVER_RE =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

  const packages = [
    { path: 'packages/core', versionExportFile: 'src/index.ts', versionExportName: 'VERSION' },
    { path: 'packages/cli', versionExportFile: 'src/index.ts', versionExportName: 'CLI_VERSION' },
    { path: 'packages/tools-file', versionExportFile: 'src/index.ts', versionExportName: null },
    { path: 'packages/tools-web', versionExportFile: 'src/index.ts', versionExportName: null },
    { path: 'packages/tools-shell', versionExportFile: 'src/index.ts', versionExportName: null },
  ];

  for (const pkg of packages) {
    const pkgJsonPath = join(ROOT, pkg.path, 'package.json');
    if (!existsSync(pkgJsonPath)) {
      console.error(`ERROR: ${pkg.path}/package.json not found`);
      hasErrors = true;
      continue;
    }

    const pkgJson = readJson<PackageJson>(pkgJsonPath);
    console.log(`Package: ${pkgJson.name}@${pkgJson.version}`);

    if (!SEMVER_RE.test(pkgJson.version)) {
      console.error(`  ERROR: Invalid semver: "${pkgJson.version}"`);
      hasErrors = true;
    } else {
      console.log('  OK: Valid semver');
    }

    const versionFile = join(ROOT, pkg.path, pkg.versionExportFile);
    if (pkg.versionExportName === null) {
      console.log('  OK: No VERSION export expected (re-export package)');
    } else if (existsSync(versionFile)) {
      const content = readFileSync(versionFile, 'utf-8');
      const exportName = pkg.versionExportName ?? 'VERSION';
      const match = new RegExp(`export const ${exportName} = '([^']+)'`).exec(content);
      if (match) {
        const exportedVersion = match[1];
        if (exportedVersion !== pkgJson.version) {
          console.error(
            `  ERROR: VERSION mismatch: exported "${exportedVersion}" vs package.json "${pkgJson.version}"`,
          );
          hasErrors = true;
        } else {
          console.log('  OK: VERSION export matches package.json');
        }
      } else {
        console.log('  WARN: No VERSION export found');
      }
    }
  }

  console.log('\nCHANGELOG.md');
  const changelogPath = join(ROOT, 'CHANGELOG.md');
  if (!existsSync(changelogPath)) {
    console.error('  ERROR: CHANGELOG.md not found');
    hasErrors = true;
  } else {
    const content = readFileSync(changelogPath, 'utf-8');

    if (!content.includes('# Changelog')) {
      console.error('  ERROR: Missing "# Changelog" title');
      hasErrors = true;
    } else {
      console.log('  OK: Has title');
    }

    if (!content.includes('[Unreleased]')) {
      console.error('  ERROR: Missing [Unreleased] section');
      hasErrors = true;
    } else {
      console.log('  OK: Has [Unreleased] section');
    }

    if (!content.includes('Semantic Versioning')) {
      console.warn('  WARN: No mention of Semantic Versioning');
    } else {
      console.log('  OK: References Semantic Versioning');
    }

    const versionEntries = content.match(/^## \[\d+\.\d+\.\d+/gm);
    if (!versionEntries || versionEntries.length === 0) {
      console.warn('  WARN: No versioned release entries found');
    } else {
      console.log(`  OK: ${versionEntries.length} release(s) documented`);
    }
  }

  if (hasErrors) {
    console.error('\nVersion check failed');
    process.exit(1);
  } else {
    console.log('\nAll version checks passed');
  }
}

main();
