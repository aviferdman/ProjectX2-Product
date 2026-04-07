/**
 * CHANGELOG.md parsing, formatting, and validation utilities.
 * Follows the Keep a Changelog (https://keepachangelog.com/) format.
 */

import { isValidSemVer } from './semver.js';

/** Valid change categories per Keep a Changelog. */
export type ChangeCategory =
  | 'Added'
  | 'Changed'
  | 'Deprecated'
  | 'Removed'
  | 'Fixed'
  | 'Security';

const VALID_CATEGORIES: ReadonlySet<string> = new Set<ChangeCategory>([
  'Added',
  'Changed',
  'Deprecated',
  'Removed',
  'Fixed',
  'Security',
]);

/** A single changelog entry (one version). */
export interface ChangelogEntry {
  readonly version: string;
  readonly date?: string | undefined;
  readonly changes: Partial<Record<ChangeCategory, readonly string[]>>;
}

/** Parsed changelog data. */
export interface ChangelogData {
  readonly title: string;
  readonly description: string;
  readonly entries: readonly ChangelogEntry[];
}

/** Result of changelog validation. */
export interface ChangelogValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

const VERSION_HEADING_REGEX = /^## \[([^\]]+)\](?:\s*-\s*(\d{4}-\d{2}-\d{2}))?/;
const CATEGORY_HEADING_REGEX = /^### (.+)/;
const ITEM_REGEX = /^- (.+)/;

/** Parse a CHANGELOG.md string into structured data. */
export function parseChangelog(content: string): ChangelogData {
  const lines = content.split('\n');
  let title = '';
  let description = '';
  const entries: ChangelogEntry[] = [];

  let currentEntry: ChangelogEntry | null = null;
  let currentCategory: ChangeCategory | null = null;
  let inPreamble = true;
  const descriptionLines: string[] = [];

  for (const line of lines) {
    // Title
    if (line.startsWith('# ') && !title) {
      title = line.slice(2).trim();
      continue;
    }

    // Version heading
    const versionMatch = VERSION_HEADING_REGEX.exec(line);
    if (versionMatch) {
      inPreamble = false;
      if (currentEntry) {
        entries.push(currentEntry);
      }
      currentEntry = {
        version: versionMatch[1] ?? '',
        date: versionMatch[2],
        changes: {},
      };
      currentCategory = null;
      continue;
    }

    // Category heading
    const categoryMatch = CATEGORY_HEADING_REGEX.exec(line);
    if (categoryMatch && currentEntry) {
      const cat = categoryMatch[1]?.trim();
      if (cat && VALID_CATEGORIES.has(cat)) {
        currentCategory = cat as ChangeCategory;
      }
      continue;
    }

    // List item
    const itemMatch = ITEM_REGEX.exec(line);
    if (itemMatch && currentEntry && currentCategory) {
      const item = itemMatch[1]?.trim();
      if (item) {
        const existing = currentEntry.changes[currentCategory] ?? [];
        (currentEntry as unknown as { changes: Record<string, string[]> }).changes[currentCategory] = [
          ...existing,
          item,
        ];
      }
      continue;
    }

    if (inPreamble && title && line.trim()) {
      descriptionLines.push(line.trim());
    }
  }

  if (currentEntry) {
    entries.push(currentEntry);
  }

  description = descriptionLines.join('\n');

  return { title, description, entries };
}

/** Format changelog data back to a markdown string. */
export function formatChangelog(data: ChangelogData): string {
  const lines: string[] = [];

  lines.push(`# ${data.title}`);
  lines.push('');
  if (data.description) {
    lines.push(data.description);
    lines.push('');
  }

  for (const entry of data.entries) {
    const datePart = entry.date ? ` - ${entry.date}` : '';
    lines.push(`## [${entry.version}]${datePart}`);
    lines.push('');

    const categories: ChangeCategory[] = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'];
    for (const cat of categories) {
      const items = entry.changes[cat];
      if (items && items.length > 0) {
        lines.push(`### ${cat}`);
        for (const item of items) {
          lines.push(`- ${item}`);
        }
        lines.push('');
      }
    }
  }

  return lines.join('\n');
}

/** Find an entry by version string. */
export function findVersion(data: ChangelogData, version: string): ChangelogEntry | undefined {
  return data.entries.find((e) => e.version === version);
}

/** Get the latest released (non-Unreleased) version entry. */
export function getLatestVersion(data: ChangelogData): ChangelogEntry | undefined {
  return data.entries.find((e) => e.version !== 'Unreleased');
}

/** Validate a changelog for correctness. */
export function validateChangelog(data: ChangelogData): ChangelogValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data.title) {
    errors.push('Changelog is missing a title');
  }

  if (data.entries.length === 0) {
    errors.push('Changelog has no entries');
  }

  const hasUnreleased = data.entries.some((e) => e.version === 'Unreleased');
  if (!hasUnreleased) {
    warnings.push('Changelog has no [Unreleased] section');
  }

  const versions = new Set<string>();
  for (const entry of data.entries) {
    if (entry.version === 'Unreleased') continue;

    if (!isValidSemVer(entry.version)) {
      errors.push(`Invalid version "${entry.version}" — must follow semantic versioning`);
    }

    if (versions.has(entry.version)) {
      errors.push(`Duplicate version "${entry.version}"`);
    }
    versions.add(entry.version);

    if (!entry.date) {
      warnings.push(`Version "${entry.version}" is missing a release date`);
    }

    const hasChanges = Object.values(entry.changes).some((items) => items && items.length > 0);
    if (!hasChanges) {
      warnings.push(`Version "${entry.version}" has no documented changes`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
