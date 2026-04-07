import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  extractReleaseNotes,
  buildReleaseBody,
  isPreRelease,
  createGitHubRelease,
  formatGitHubReleaseOutput,
  parseGitHubReleaseArgs,
} from '../github-release.js';

const SAMPLE_CHANGELOG = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Something in progress

## [0.2.0] - 2026-04-07

### Added
- New feature X
- New feature Y

### Fixed
- Bug fix Z

## [0.1.0] - 2026-04-06

### Added
- Core agent orchestration framework
- Agent, Crew, and Task primitives
- Execution engine with sequential and parallel strategies

[Unreleased]: https://github.com/aviferdman/ProjectX2-Product/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/aviferdman/ProjectX2-Product/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/aviferdman/ProjectX2-Product/releases/tag/v0.1.0
`;

describe('github-release', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'gh-release-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('extractReleaseNotes', () => {
    it('extracts notes for a specific version', () => {
      const changelogPath = join(tempDir, 'CHANGELOG.md');
      writeFileSync(changelogPath, SAMPLE_CHANGELOG);

      const notes = extractReleaseNotes(changelogPath, '0.2.0');
      expect(notes).not.toBeNull();
      expect(notes).toContain('### Added');
      expect(notes).toContain('New feature X');
      expect(notes).toContain('New feature Y');
      expect(notes).toContain('### Fixed');
      expect(notes).toContain('Bug fix Z');
    });

    it('extracts notes for the first release', () => {
      const changelogPath = join(tempDir, 'CHANGELOG.md');
      writeFileSync(changelogPath, SAMPLE_CHANGELOG);

      const notes = extractReleaseNotes(changelogPath, '0.1.0');
      expect(notes).not.toBeNull();
      expect(notes).toContain('Core agent orchestration framework');
      expect(notes).toContain('Agent, Crew, and Task primitives');
    });

    it('returns null for non-existent version', () => {
      const changelogPath = join(tempDir, 'CHANGELOG.md');
      writeFileSync(changelogPath, SAMPLE_CHANGELOG);

      const notes = extractReleaseNotes(changelogPath, '9.9.9');
      expect(notes).toBeNull();
    });

    it('returns null for non-existent changelog file', () => {
      const notes = extractReleaseNotes(join(tempDir, 'missing.md'), '0.1.0');
      expect(notes).toBeNull();
    });

    it('returns null for Unreleased section (not a version)', () => {
      const changelogPath = join(tempDir, 'CHANGELOG.md');
      writeFileSync(changelogPath, SAMPLE_CHANGELOG);

      const notes = extractReleaseNotes(changelogPath, 'Unreleased');
      expect(notes).not.toBeNull();
      expect(notes).toContain('Something in progress');
    });

    it('handles changelog with only one version', () => {
      const changelogPath = join(tempDir, 'CHANGELOG.md');
      writeFileSync(
        changelogPath,
        `# Changelog\n\n## [0.1.0] - 2026-04-06\n\n### Added\n- Initial release\n`,
      );

      const notes = extractReleaseNotes(changelogPath, '0.1.0');
      expect(notes).not.toBeNull();
      expect(notes).toContain('Initial release');
    });

    it('does not include notes from a different version', () => {
      const changelogPath = join(tempDir, 'CHANGELOG.md');
      writeFileSync(changelogPath, SAMPLE_CHANGELOG);

      const notes = extractReleaseNotes(changelogPath, '0.2.0');
      expect(notes).not.toContain('Core agent orchestration framework');
    });

    it('handles version heading without date', () => {
      const changelogPath = join(tempDir, 'CHANGELOG.md');
      writeFileSync(changelogPath, `# Changelog\n\n## [1.0.0]\n\n### Added\n- Big release\n`);

      const notes = extractReleaseNotes(changelogPath, '1.0.0');
      expect(notes).not.toBeNull();
      expect(notes).toContain('Big release');
    });
  });

  describe('buildReleaseBody', () => {
    it('includes release notes when available', () => {
      const body = buildReleaseBody('0.1.0', '### Added\n- Feature A', ['@crewspace/core']);
      expect(body).toContain('### Added');
      expect(body).toContain('Feature A');
    });

    it('includes package links', () => {
      const body = buildReleaseBody('0.1.0', '### Added\n- Feature A', ['@crewspace/core']);
      expect(body).toContain('📦 Packages');
      expect(body).toContain('`@crewspace/core@0.1.0`');
      expect(body).toContain('npmjs.com/package/@crewspace/core/v/0.1.0');
    });

    it('shows fallback when no release notes found', () => {
      const body = buildReleaseBody('0.1.0', null, ['@crewspace/core']);
      expect(body).toContain('No release notes found');
    });

    it('includes changelog link', () => {
      const body = buildReleaseBody('0.1.0', 'notes', ['@crewspace/core']);
      expect(body).toContain('CHANGELOG.md');
      expect(body).toContain('v0.1.0');
    });

    it('handles multiple packages', () => {
      const body = buildReleaseBody('0.1.0', 'notes', ['@crewspace/core', '@crewspace/cli']);
      expect(body).toContain('@crewspace/core@0.1.0');
      expect(body).toContain('@crewspace/cli@0.1.0');
    });

    it('handles empty packages array', () => {
      const body = buildReleaseBody('0.1.0', 'notes', []);
      expect(body).not.toContain('📦 Packages');
    });
  });

  describe('isPreRelease', () => {
    it('returns false for stable versions', () => {
      expect(isPreRelease('0.1.0')).toBe(false);
      expect(isPreRelease('1.0.0')).toBe(false);
      expect(isPreRelease('2.3.4')).toBe(false);
    });

    it('returns true for alpha versions', () => {
      expect(isPreRelease('0.1.0-alpha.1')).toBe(true);
    });

    it('returns true for beta versions', () => {
      expect(isPreRelease('0.1.0-beta.1')).toBe(true);
    });

    it('returns true for rc versions', () => {
      expect(isPreRelease('1.0.0-rc.1')).toBe(true);
    });

    it('returns true for canary versions', () => {
      expect(isPreRelease('0.2.0-canary.5')).toBe(true);
    });

    it('returns true for next versions', () => {
      expect(isPreRelease('1.0.0-next.0')).toBe(true);
    });

    it('returns true for dev versions', () => {
      expect(isPreRelease('0.1.0-dev.3')).toBe(true);
    });
  });

  describe('createGitHubRelease', () => {
    it('returns success in dry-run mode without API call', async () => {
      const changelogPath = join(tempDir, 'CHANGELOG.md');
      writeFileSync(changelogPath, SAMPLE_CHANGELOG);

      const result = await createGitHubRelease({
        tag: 'v0.2.0',
        rootDir: tempDir,
        repo: 'aviferdman/ProjectX2-Product',
        token: '',
        dryRun: true,
      });

      expect(result.success).toBe(true);
      expect(result.tag).toBe('v0.2.0');
      expect(result.body).toContain('New feature X');
      expect(result.releaseUrl).toContain('dry-run');
    });

    it('includes release notes in dry-run body', async () => {
      const changelogPath = join(tempDir, 'CHANGELOG.md');
      writeFileSync(changelogPath, SAMPLE_CHANGELOG);

      const result = await createGitHubRelease({
        tag: 'v0.1.0',
        rootDir: tempDir,
        repo: 'aviferdman/ProjectX2-Product',
        token: '',
        dryRun: true,
      });

      expect(result.body).toContain('Core agent orchestration framework');
      expect(result.body).toContain('@crewspace/core@0.1.0');
    });

    it('handles missing changelog gracefully in dry-run', async () => {
      const result = await createGitHubRelease({
        tag: 'v0.1.0',
        rootDir: tempDir,
        repo: 'aviferdman/ProjectX2-Product',
        token: '',
        dryRun: true,
      });

      expect(result.success).toBe(true);
      expect(result.body).toContain('No release notes found');
    });

    it('strips v prefix from tag when looking up version', async () => {
      const changelogPath = join(tempDir, 'CHANGELOG.md');
      writeFileSync(
        changelogPath,
        `# Changelog\n\n## [0.1.0] - 2026-04-06\n\n### Added\n- Initial\n`,
      );

      const result = await createGitHubRelease({
        tag: 'v0.1.0',
        rootDir: tempDir,
        repo: 'test/repo',
        token: '',
        dryRun: true,
      });

      expect(result.body).toContain('### Added');
      expect(result.body).toContain('Initial');
    });

    it('detects pre-release versions automatically', async () => {
      const changelogPath = join(tempDir, 'CHANGELOG.md');
      writeFileSync(
        changelogPath,
        `# Changelog\n\n## [1.0.0-beta.1] - 2026-04-06\n\n### Added\n- Beta feature\n`,
      );

      const result = await createGitHubRelease({
        tag: 'v1.0.0-beta.1',
        rootDir: tempDir,
        repo: 'test/repo',
        token: '',
        dryRun: true,
      });

      expect(result.success).toBe(true);
      expect(result.body).toContain('Beta feature');
    });

    it('reports API error on failed fetch', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        text: async () => '{"message":"Validation Failed"}',
      });

      try {
        const result = await createGitHubRelease({
          tag: 'v0.1.0',
          rootDir: tempDir,
          repo: 'test/repo',
          token: 'fake-token',
          dryRun: false,
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain('422');
        expect(result.error).toContain('Validation Failed');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('returns release URL on success', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          html_url: 'https://github.com/test/repo/releases/tag/v0.1.0',
        }),
      });

      try {
        const result = await createGitHubRelease({
          tag: 'v0.1.0',
          rootDir: tempDir,
          repo: 'test/repo',
          token: 'fake-token',
          dryRun: false,
        });

        expect(result.success).toBe(true);
        expect(result.releaseUrl).toBe('https://github.com/test/repo/releases/tag/v0.1.0');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('sends correct request payload', async () => {
      const originalFetch = globalThis.fetch;
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ html_url: 'https://example.com' }),
      });
      globalThis.fetch = mockFetch;

      const changelogPath = join(tempDir, 'CHANGELOG.md');
      writeFileSync(
        changelogPath,
        `# Changelog\n\n## [0.1.0] - 2026-04-06\n\n### Added\n- Feature\n`,
      );

      try {
        await createGitHubRelease({
          tag: 'v0.1.0',
          rootDir: tempDir,
          repo: 'owner/repo',
          token: 'test-token',
          dryRun: false,
          draft: true,
        });

        expect(mockFetch).toHaveBeenCalledOnce();
        const [url, options] = mockFetch.mock.calls[0]!;
        expect(url).toBe('https://api.github.com/repos/owner/repo/releases');
        expect(options.method).toBe('POST');
        expect(options.headers['Authorization']).toBe('Bearer test-token');

        const body = JSON.parse(options.body as string);
        expect(body.tag_name).toBe('v0.1.0');
        expect(body.name).toBe('v0.1.0');
        expect(body.draft).toBe(true);
        expect(body.prerelease).toBe(false);
        expect(body.generate_release_notes).toBe(false);
        expect(body.body).toContain('Feature');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe('formatGitHubReleaseOutput', () => {
    it('formats successful release output', () => {
      const output = formatGitHubReleaseOutput(
        {
          success: true,
          tag: 'v0.1.0',
          body: '### Added\n- Feature',
          releaseUrl: 'https://github.com/test/repo/releases/tag/v0.1.0',
        },
        false,
      );

      expect(output).toContain('GitHub Release: v0.1.0');
      expect(output).toContain('✓');
      expect(output).toContain('https://github.com/test/repo/releases/tag/v0.1.0');
      expect(output).not.toContain('DRY RUN');
    });

    it('formats dry-run output', () => {
      const output = formatGitHubReleaseOutput(
        {
          success: true,
          tag: 'v0.1.0',
          body: '### Added\n- Feature',
        },
        true,
      );

      expect(output).toContain('DRY RUN');
      expect(output).toContain('### Added');
    });

    it('formats failed release output', () => {
      const output = formatGitHubReleaseOutput(
        {
          success: false,
          tag: 'v0.1.0',
          body: '',
          error: 'API rate limited',
        },
        false,
      );

      expect(output).toContain('✗');
      expect(output).toContain('API rate limited');
    });
  });

  describe('parseGitHubReleaseArgs', () => {
    it('parses --tag flag', () => {
      const args = parseGitHubReleaseArgs(['--tag', 'v0.1.0']);
      expect(args.tag).toBe('v0.1.0');
    });

    it('parses --dry-run flag', () => {
      const args = parseGitHubReleaseArgs(['--tag', 'v0.1.0', '--dry-run']);
      expect(args.dryRun).toBe(true);
    });

    it('parses --draft flag', () => {
      const args = parseGitHubReleaseArgs(['--tag', 'v0.1.0', '--draft']);
      expect(args.draft).toBe(true);
    });

    it('parses --repo flag', () => {
      const args = parseGitHubReleaseArgs(['--tag', 'v0.1.0', '--repo', 'owner/repo']);
      expect(args.repo).toBe('owner/repo');
    });

    it('parses --token flag', () => {
      const args = parseGitHubReleaseArgs(['--tag', 'v0.1.0', '--token', 'ghp_abc123']);
      expect(args.token).toBe('ghp_abc123');
    });

    it('returns empty tag when not provided', () => {
      const args = parseGitHubReleaseArgs([]);
      expect(args.tag).toBe('');
    });

    it('parses all flags together', () => {
      const args = parseGitHubReleaseArgs([
        '--tag',
        'v1.0.0',
        '--repo',
        'test/repo',
        '--token',
        'tok',
        '--dry-run',
        '--draft',
      ]);
      expect(args.tag).toBe('v1.0.0');
      expect(args.repo).toBe('test/repo');
      expect(args.token).toBe('tok');
      expect(args.dryRun).toBe(true);
      expect(args.draft).toBe(true);
    });
  });
});
