/**
 * Version consistency validation across the monorepo.
 * Ensures the exported VERSION constant matches package.json versions.
 */

/** Information about a package's version. */
export interface PackageVersionInfo {
  readonly name: string;
  readonly packageJsonVersion: string;
  readonly exportedVersion?: string;
}

/** Result of version consistency validation. */
export interface VersionConsistencyResult {
  readonly consistent: boolean;
  readonly errors: readonly string[];
  readonly packages: readonly PackageVersionInfo[];
}

/**
 * Validate that exported VERSION constants match their package.json versions.
 */
export function validateVersionConsistency(
  packages: readonly PackageVersionInfo[],
): VersionConsistencyResult {
  const errors: string[] = [];

  for (const pkg of packages) {
    if (pkg.exportedVersion !== undefined && pkg.exportedVersion !== pkg.packageJsonVersion) {
      errors.push(
        `${pkg.name}: exported VERSION "${pkg.exportedVersion}" does not match package.json version "${pkg.packageJsonVersion}"`,
      );
    }
  }

  return {
    consistent: errors.length === 0,
    errors,
    packages,
  };
}
