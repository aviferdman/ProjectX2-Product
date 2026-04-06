/**
 * Version management utilities for semantic versioning.
 *
 * @packageDocumentation
 */

export { parseSemVer, compareSemVer, isValidSemVer, formatSemVer, bumpVersion } from './semver.js';
export type { SemVer, BumpType } from './semver.js';

export {
  parseChangelog,
  formatChangelog,
  findVersion,
  getLatestVersion,
  validateChangelog,
} from './changelog.js';
export type {
  ChangelogEntry,
  ChangelogData,
  ChangeCategory,
  ChangelogValidationResult,
} from './changelog.js';

export { validateVersionConsistency } from './consistency.js';
export type { VersionConsistencyResult, PackageVersionInfo } from './consistency.js';
