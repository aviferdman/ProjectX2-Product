/**
 * Semantic versioning parsing, validation, and comparison utilities.
 */

/** Parsed semantic version. */
export interface SemVer {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly prerelease?: readonly string[];
  readonly build?: readonly string[];
}

/** Version bump type. */
export type BumpType = 'major' | 'minor' | 'patch' | 'premajor' | 'preminor' | 'prepatch' | 'prerelease';

const SEMVER_REGEX =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

/**
 * Parse a version string into a SemVer object.
 * Returns null if the string is not a valid semantic version.
 */
export function parseSemVer(version: string): SemVer | null {
  const match = SEMVER_REGEX.exec(version.trim());
  if (!match) return null;

  const [, majorStr, minorStr, patchStr, prereleaseStr, buildStr] = match;
  if (majorStr === undefined || minorStr === undefined || patchStr === undefined) return null;

  const result: SemVer = {
    major: parseInt(majorStr, 10),
    minor: parseInt(minorStr, 10),
    patch: parseInt(patchStr, 10),
  };

  if (prereleaseStr !== undefined) {
    return { ...result, prerelease: prereleaseStr.split('.') };
  }
  if (buildStr !== undefined) {
    return { ...result, build: buildStr.split('.') };
  }

  return result;
}

/** Check if a string is a valid semantic version. */
export function isValidSemVer(version: string): boolean {
  return parseSemVer(version) !== null;
}

/** Format a SemVer object back to a string. */
export function formatSemVer(version: SemVer): string {
  let result = `${version.major}.${version.minor}.${version.patch}`;
  if (version.prerelease && version.prerelease.length > 0) {
    result += `-${version.prerelease.join('.')}`;
  }
  if (version.build && version.build.length > 0) {
    result += `+${version.build.join('.')}`;
  }
  return result;
}

/**
 * Compare two SemVer objects.
 * Returns -1 if a < b, 0 if a === b, 1 if a > b.
 * Follows semver precedence rules (build metadata is ignored).
 */
export function compareSemVer(a: SemVer, b: SemVer): -1 | 0 | 1 {
  if (a.major !== b.major) return a.major > b.major ? 1 : -1;
  if (a.minor !== b.minor) return a.minor > b.minor ? 1 : -1;
  if (a.patch !== b.patch) return a.patch > b.patch ? 1 : -1;

  const aPre = a.prerelease ?? [];
  const bPre = b.prerelease ?? [];

  // No prerelease on both means equal
  if (aPre.length === 0 && bPre.length === 0) return 0;
  // A release version has higher precedence than a prerelease
  if (aPre.length === 0) return 1;
  if (bPre.length === 0) return -1;

  const maxLen = Math.max(aPre.length, bPre.length);
  for (let i = 0; i < maxLen; i++) {
    const aId = aPre[i];
    const bId = bPre[i];

    if (aId === undefined) return -1;
    if (bId === undefined) return 1;

    const aNum = /^\d+$/.test(aId) ? parseInt(aId, 10) : null;
    const bNum = /^\d+$/.test(bId) ? parseInt(bId, 10) : null;

    if (aNum !== null && bNum !== null) {
      if (aNum !== bNum) return aNum > bNum ? 1 : -1;
    } else if (aNum !== null) {
      return -1; // numeric < string
    } else if (bNum !== null) {
      return 1; // string > numeric
    } else {
      if (aId < bId) return -1;
      if (aId > bId) return 1;
    }
  }

  return 0;
}

/**
 * Bump a version according to the specified type.
 * Returns a new SemVer object.
 */
export function bumpVersion(version: SemVer, type: BumpType): SemVer {
  switch (type) {
    case 'major':
      return { major: version.major + 1, minor: 0, patch: 0 };
    case 'minor':
      return { major: version.major, minor: version.minor + 1, patch: 0 };
    case 'patch':
      return { major: version.major, minor: version.minor, patch: version.patch + 1 };
    case 'premajor':
      return { major: version.major + 1, minor: 0, patch: 0, prerelease: ['0'] };
    case 'preminor':
      return { major: version.major, minor: version.minor + 1, patch: 0, prerelease: ['0'] };
    case 'prepatch':
      return { major: version.major, minor: version.minor, patch: version.patch + 1, prerelease: ['0'] };
    case 'prerelease': {
      const pre = version.prerelease ?? [];
      if (pre.length === 0) {
        return { ...version, patch: version.patch + 1, prerelease: ['0'] };
      }
      const lastIdx = pre.length - 1;
      const last = pre[lastIdx];
      if (last !== undefined && /^\d+$/.test(last)) {
        const newPre = [...pre];
        newPre[lastIdx] = String(parseInt(last, 10) + 1);
        return { major: version.major, minor: version.minor, patch: version.patch, prerelease: newPre };
      }
      return { major: version.major, minor: version.minor, patch: version.patch, prerelease: [...pre, '0'] };
    }
  }
}
