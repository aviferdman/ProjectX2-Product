/**
 * Semantic Versioning 2.0.0 utility module.
 *
 * Provides parsing, validation, comparison, and bump operations
 * for semver version strings. Used by release and version-bump scripts.
 *
 * @see https://semver.org/spec/v2.0.0.html
 */

export interface SemverVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
  build: string[];
}

export type BumpType =
  | 'major'
  | 'minor'
  | 'patch'
  | 'premajor'
  | 'preminor'
  | 'prepatch'
  | 'prerelease';

/**
 * Full semver 2.0.0 regex pattern.
 */
const SEMVER_RE =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

/**
 * Test whether a string is a valid semver version.
 */
export function isValidSemver(version: string): boolean {
  return SEMVER_RE.test(version);
}

/**
 * Parse a semver version string into its components.
 * Returns null if the string is not a valid semver version.
 */
export function parseSemver(version: string): SemverVersion | null {
  const match = SEMVER_RE.exec(version);
  if (!match) return null;

  return {
    major: parseInt(match[1]!, 10),
    minor: parseInt(match[2]!, 10),
    patch: parseInt(match[3]!, 10),
    prerelease: match[4] ? match[4].split('.') : [],
    build: match[5] ? match[5].split('.') : [],
  };
}

/**
 * Format a parsed semver version back to a string.
 */
export function formatSemver(version: SemverVersion): string {
  let result = `${version.major}.${version.minor}.${version.patch}`;
  if (version.prerelease.length > 0) {
    result += `-${version.prerelease.join('.')}`;
  }
  if (version.build.length > 0) {
    result += `+${version.build.join('.')}`;
  }
  return result;
}

/**
 * Compare two prerelease arrays per semver 2.0.0 spec (§11).
 * Returns negative if a < b, positive if a > b, zero if equal.
 */
function comparePrereleaseIdentifiers(a: string[], b: string[]): number {
  // No prerelease on either → equal
  if (a.length === 0 && b.length === 0) return 0;
  // A version with prerelease has lower precedence than without
  if (a.length > 0 && b.length === 0) return -1;
  if (a.length === 0 && b.length > 0) return 1;

  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (i >= a.length) return -1; // fewer fields → lower precedence
    if (i >= b.length) return 1;

    const ai = a[i]!;
    const bi = b[i]!;

    const aNum = /^\d+$/.test(ai) ? parseInt(ai, 10) : null;
    const bNum = /^\d+$/.test(bi) ? parseInt(bi, 10) : null;

    if (aNum !== null && bNum !== null) {
      if (aNum !== bNum) return aNum - bNum;
    } else if (aNum !== null) {
      return -1; // numeric < string
    } else if (bNum !== null) {
      return 1;
    } else {
      const cmp = ai.localeCompare(bi);
      if (cmp !== 0) return cmp;
    }
  }

  return 0;
}

/**
 * Compare two semver versions.
 * Returns negative if a < b, positive if a > b, zero if equal.
 * Build metadata is ignored per the semver spec.
 */
export function compareSemver(a: string | SemverVersion, b: string | SemverVersion): number {
  const va = typeof a === 'string' ? parseSemver(a) : a;
  const vb = typeof b === 'string' ? parseSemver(b) : b;

  if (!va || !vb) {
    throw new Error(`Invalid semver: ${!va ? String(a) : String(b)}`);
  }

  if (va.major !== vb.major) return va.major - vb.major;
  if (va.minor !== vb.minor) return va.minor - vb.minor;
  if (va.patch !== vb.patch) return va.patch - vb.patch;

  return comparePrereleaseIdentifiers(va.prerelease, vb.prerelease);
}

/**
 * Compute the next version given a bump type.
 *
 * - `major`: 1.2.3 → 2.0.0
 * - `minor`: 1.2.3 → 1.3.0
 * - `patch`: 1.2.3 → 1.2.4
 * - `premajor`: 1.2.3 → 2.0.0-0
 * - `preminor`: 1.2.3 → 1.3.0-0
 * - `prepatch`: 1.2.3 → 1.2.4-0
 * - `prerelease`: 1.2.3-beta.0 → 1.2.3-beta.1, 1.2.3 → 1.2.4-0
 *
 * @param prereleaseTag Optional prerelease identifier (e.g., "beta", "alpha")
 */
export function bumpVersion(version: string, bump: BumpType, prereleaseTag?: string): string {
  const parsed = parseSemver(version);
  if (!parsed) {
    throw new Error(`Invalid semver version: "${version}"`);
  }

  switch (bump) {
    case 'major':
      return formatSemver({
        major: parsed.major + 1,
        minor: 0,
        patch: 0,
        prerelease: [],
        build: [],
      });

    case 'minor':
      return formatSemver({
        major: parsed.major,
        minor: parsed.minor + 1,
        patch: 0,
        prerelease: [],
        build: [],
      });

    case 'patch':
      // If current version has a prerelease, just drop it (1.2.3-beta.1 → 1.2.3)
      if (parsed.prerelease.length > 0) {
        return formatSemver({ ...parsed, prerelease: [], build: [] });
      }
      return formatSemver({
        major: parsed.major,
        minor: parsed.minor,
        patch: parsed.patch + 1,
        prerelease: [],
        build: [],
      });

    case 'premajor': {
      const pre = prereleaseTag ? [prereleaseTag, '0'] : ['0'];
      return formatSemver({
        major: parsed.major + 1,
        minor: 0,
        patch: 0,
        prerelease: pre,
        build: [],
      });
    }

    case 'preminor': {
      const pre = prereleaseTag ? [prereleaseTag, '0'] : ['0'];
      return formatSemver({
        major: parsed.major,
        minor: parsed.minor + 1,
        patch: 0,
        prerelease: pre,
        build: [],
      });
    }

    case 'prepatch': {
      const pre = prereleaseTag ? [prereleaseTag, '0'] : ['0'];
      return formatSemver({
        major: parsed.major,
        minor: parsed.minor,
        patch: parsed.patch + 1,
        prerelease: pre,
        build: [],
      });
    }

    case 'prerelease': {
      if (parsed.prerelease.length > 0) {
        // Increment the last numeric identifier
        const newPre = [...parsed.prerelease];
        let incremented = false;
        for (let i = newPre.length - 1; i >= 0; i--) {
          if (/^\d+$/.test(newPre[i]!)) {
            newPre[i] = String(parseInt(newPre[i]!, 10) + 1);
            incremented = true;
            break;
          }
        }
        if (!incremented) {
          newPre.push('0');
        }
        return formatSemver({ ...parsed, prerelease: newPre, build: [] });
      }
      // No existing prerelease → bump patch and add prerelease
      const pre = prereleaseTag ? [prereleaseTag, '0'] : ['0'];
      return formatSemver({
        major: parsed.major,
        minor: parsed.minor,
        patch: parsed.patch + 1,
        prerelease: pre,
        build: [],
      });
    }

    default:
      throw new Error(`Unknown bump type: "${bump as string}"`);
  }
}

/**
 * Determine the minimum bump type needed when going from `from` to `to`.
 * Returns null if `to` is not greater than `from`.
 */
export function inferBumpType(from: string, to: string): BumpType | null {
  const a = parseSemver(from);
  const b = parseSemver(to);
  if (!a || !b) return null;

  if (compareSemver(a, b) >= 0) return null;

  if (b.prerelease.length > 0) return 'prerelease';
  if (b.major > a.major) return 'major';
  if (b.minor > a.minor) return 'minor';
  if (b.patch > a.patch) return 'patch';

  return null;
}

/**
 * Sort an array of semver version strings in ascending order.
 * Invalid versions are placed at the end.
 */
export function sortVersions(versions: string[]): string[] {
  return [...versions].sort((a, b) => {
    const pa = parseSemver(a);
    const pb = parseSemver(b);
    if (!pa && !pb) return 0;
    if (!pa) return 1;
    if (!pb) return -1;
    return compareSemver(pa, pb);
  });
}
