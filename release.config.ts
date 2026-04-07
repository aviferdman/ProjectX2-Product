/**
 * Release configuration for the Crewspace monorepo.
 *
 * Defines versioning policies, changelog conventions, and release workflow.
 * This is consumed by CI/CD tooling and release scripts.
 */

export interface ReleaseConfig {
  /** Versioning strategy */
  versioning: {
    /** Follow Semantic Versioning 2.0.0 */
    scheme: 'semver';
    /** Pre-1.0 versions may include breaking changes in minor bumps */
    preV1Policy: 'breaking-in-minor';
  };
  /** Changelog configuration */
  changelog: {
    /** Follow Keep a Changelog format */
    format: 'keep-a-changelog';
    /** Path to CHANGELOG.md */
    file: string;
    /** Valid change categories */
    categories: readonly string[];
  };
  /** Package release settings */
  packages: readonly {
    /** Package path relative to repo root */
    path: string;
    /** npm package name */
    name: string;
    /** File containing VERSION export */
    versionExport: string;
  }[];
  /** Git tag format (e.g., "v1.0.0") */
  tagFormat: string;
}

const releaseConfig: ReleaseConfig = {
  versioning: {
    scheme: 'semver',
    preV1Policy: 'breaking-in-minor',
  },
  changelog: {
    format: 'keep-a-changelog',
    file: 'CHANGELOG.md',
    categories: ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'],
  },
  packages: [
    {
      path: 'packages/core',
      name: '@crewspace/core',
      versionExport: 'src/index.ts',
    },
    {
      path: 'packages/cli',
      name: '@crewspace/cli',
      versionExport: 'src/index.ts',
    },
  ],
  tagFormat: 'v${version}',
};

export default releaseConfig;
