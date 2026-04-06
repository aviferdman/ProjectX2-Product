import { describe, it, expect } from 'vitest';
import {
  parseChangelog,
  formatChangelog,
  findVersion,
  getLatestVersion,
  validateChangelog,
} from '../../../src/version/changelog.js';
import type { ChangelogData } from '../../../src/version/changelog.js';

const SAMPLE_CHANGELOG = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New feature X

## [1.1.0] - 2026-03-15

### Added
- Feature A
- Feature B

### Fixed
- Bug fix C

## [1.0.0] - 2026-01-01

### Added
- Initial release
`;

describe('parseChangelog', () => {
  it('should parse the title', () => {
    const result = parseChangelog(SAMPLE_CHANGELOG);
    expect(result.title).toBe('Changelog');
  });

  it('should parse the description', () => {
    const result = parseChangelog(SAMPLE_CHANGELOG);
    expect(result.description).toContain('Keep a Changelog');
  });

  it('should parse all version entries', () => {
    const result = parseChangelog(SAMPLE_CHANGELOG);
    expect(result.entries).toHaveLength(3);
  });

  it('should parse the Unreleased entry', () => {
    const result = parseChangelog(SAMPLE_CHANGELOG);
    const unreleased = result.entries[0];
    expect(unreleased?.version).toBe('Unreleased');
    expect(unreleased?.date).toBeUndefined();
    expect(unreleased?.changes.Added).toEqual(['New feature X']);
  });

  it('should parse versioned entries with dates', () => {
    const result = parseChangelog(SAMPLE_CHANGELOG);
    const v110 = result.entries[1];
    expect(v110?.version).toBe('1.1.0');
    expect(v110?.date).toBe('2026-03-15');
    expect(v110?.changes.Added).toEqual(['Feature A', 'Feature B']);
    expect(v110?.changes.Fixed).toEqual(['Bug fix C']);
  });

  it('should handle empty input', () => {
    const result = parseChangelog('');
    expect(result.title).toBe('');
    expect(result.entries).toHaveLength(0);
  });
});

describe('formatChangelog', () => {
  it('should format a changelog to markdown', () => {
    const data: ChangelogData = {
      title: 'Changelog',
      description: 'All notable changes.',
      entries: [
        {
          version: 'Unreleased',
          changes: { Added: ['New thing'] },
        },
        {
          version: '1.0.0',
          date: '2026-01-01',
          changes: { Added: ['Initial release'] },
        },
      ],
    };

    const output = formatChangelog(data);
    expect(output).toContain('# Changelog');
    expect(output).toContain('## [Unreleased]');
    expect(output).toContain('## [1.0.0] - 2026-01-01');
    expect(output).toContain('### Added');
    expect(output).toContain('- New thing');
    expect(output).toContain('- Initial release');
  });

  it('should order categories correctly', () => {
    const data: ChangelogData = {
      title: 'Changelog',
      description: '',
      entries: [
        {
          version: '1.0.0',
          date: '2026-01-01',
          changes: {
            Fixed: ['Bug fix'],
            Added: ['New feature'],
            Security: ['Security patch'],
          },
        },
      ],
    };

    const output = formatChangelog(data);
    const addedIdx = output.indexOf('### Added');
    const fixedIdx = output.indexOf('### Fixed');
    const securityIdx = output.indexOf('### Security');

    // Categories should appear in standard order: Added, ..., Fixed, Security
    expect(addedIdx).toBeLessThan(fixedIdx);
    expect(fixedIdx).toBeLessThan(securityIdx);
  });
});

describe('findVersion', () => {
  it('should find existing version', () => {
    const data = parseChangelog(SAMPLE_CHANGELOG);
    const entry = findVersion(data, '1.0.0');
    expect(entry).toBeDefined();
    expect(entry?.version).toBe('1.0.0');
  });

  it('should return undefined for missing version', () => {
    const data = parseChangelog(SAMPLE_CHANGELOG);
    expect(findVersion(data, '9.9.9')).toBeUndefined();
  });
});

describe('getLatestVersion', () => {
  it('should return the latest non-Unreleased entry', () => {
    const data = parseChangelog(SAMPLE_CHANGELOG);
    const latest = getLatestVersion(data);
    expect(latest?.version).toBe('1.1.0');
  });

  it('should return undefined when only Unreleased exists', () => {
    const data: ChangelogData = {
      title: 'Changelog',
      description: '',
      entries: [{ version: 'Unreleased', changes: {} }],
    };
    expect(getLatestVersion(data)).toBeUndefined();
  });
});

describe('validateChangelog', () => {
  it('should validate a correct changelog', () => {
    const data = parseChangelog(SAMPLE_CHANGELOG);
    const result = validateChangelog(data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should error on missing title', () => {
    const data: ChangelogData = { title: '', description: '', entries: [] };
    const result = validateChangelog(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Changelog is missing a title');
  });

  it('should error on no entries', () => {
    const data: ChangelogData = { title: 'Changelog', description: '', entries: [] };
    const result = validateChangelog(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Changelog has no entries');
  });

  it('should warn when no Unreleased section', () => {
    const data: ChangelogData = {
      title: 'Changelog',
      description: '',
      entries: [
        { version: '1.0.0', date: '2026-01-01', changes: { Added: ['Something'] } },
      ],
    };
    const result = validateChangelog(data);
    expect(result.warnings).toContain('Changelog has no [Unreleased] section');
  });

  it('should error on invalid version numbers', () => {
    const data: ChangelogData = {
      title: 'Changelog',
      description: '',
      entries: [{ version: 'not-semver', changes: {} }],
    };
    const result = validateChangelog(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Invalid version'))).toBe(true);
  });

  it('should error on duplicate versions', () => {
    const data: ChangelogData = {
      title: 'Changelog',
      description: '',
      entries: [
        { version: '1.0.0', date: '2026-01-01', changes: { Added: ['A'] } },
        { version: '1.0.0', date: '2026-01-02', changes: { Added: ['B'] } },
      ],
    };
    const result = validateChangelog(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Duplicate version'))).toBe(true);
  });

  it('should warn on missing date', () => {
    const data: ChangelogData = {
      title: 'Changelog',
      description: '',
      entries: [
        { version: 'Unreleased', changes: {} },
        { version: '1.0.0', changes: { Added: ['Something'] } },
      ],
    };
    const result = validateChangelog(data);
    expect(result.warnings.some((w) => w.includes('missing a release date'))).toBe(true);
  });

  it('should warn on empty changes', () => {
    const data: ChangelogData = {
      title: 'Changelog',
      description: '',
      entries: [
        { version: 'Unreleased', changes: {} },
        { version: '1.0.0', date: '2026-01-01', changes: {} },
      ],
    };
    const result = validateChangelog(data);
    expect(result.warnings.some((w) => w.includes('no documented changes'))).toBe(true);
  });
});
