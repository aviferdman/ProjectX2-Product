/**
 * QA Validation Tests for TASK-098: Enhanced CONTRIBUTING.md and CODE_OF_CONDUCT.md
 *
 * Validates that community documents include comprehensive contributor guidance:
 * bug reporting, feature requests, commit conventions, PR process,
 * first-time contributor section, and cross-references.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../../../..');

describe('TASK-098: CONTRIBUTING.md Enhanced Sections', () => {
  let content: string;

  beforeAll(() => {
    const contributingPath = join(PROJECT_ROOT, 'CONTRIBUTING.md');
    expect(existsSync(contributingPath)).toBe(true);
    content = readFileSync(contributingPath, 'utf-8');
  });

  describe('Table of Contents', () => {
    it('should have a table of contents', () => {
      expect(content).toMatch(/Table of Contents/i);
    });

    it('should link to major sections', () => {
      expect(content).toMatch(/\[.*Getting Started.*\]/);
      expect(content).toMatch(/\[.*Development Workflow.*\]/);
      expect(content).toMatch(/\[.*Coding Standards.*\]/);
    });
  });

  describe('Code of Conduct Reference', () => {
    it('should reference the code of conduct at the top', () => {
      const firstSection = content.split('## Getting Started')[0];
      expect(firstSection).toMatch(/Code of Conduct/i);
    });

    it('should link to CODE_OF_CONDUCT.md', () => {
      expect(content).toContain('CODE_OF_CONDUCT.md');
    });
  });

  describe('Reporting Bugs Section', () => {
    it('should have a bug reporting section', () => {
      expect(content).toMatch(/## Reporting Bugs/i);
    });

    it('should mention searching existing issues', () => {
      expect(content).toMatch(/search.*existing.*issues/i);
    });

    it('should link to the bug report template', () => {
      expect(content).toMatch(/bug.report/i);
    });

    it('should list what to include in a bug report', () => {
      expect(content).toMatch(/reproduce/i);
      expect(content).toMatch(/environment/i);
    });
  });

  describe('Requesting Features Section', () => {
    it('should have a feature request section', () => {
      expect(content).toMatch(/## Requesting Features/i);
    });

    it('should link to the feature request template', () => {
      expect(content).toMatch(/feature.request/i);
    });
  });

  describe('Commit Message Format Section', () => {
    it('should have a commit message section', () => {
      expect(content).toMatch(/Commit Message/i);
    });

    it('should reference conventional commits', () => {
      expect(content).toMatch(/Conventional Commits/i);
    });

    it('should document commit types', () => {
      expect(content).toContain('feat');
      expect(content).toContain('fix');
      expect(content).toContain('docs');
      expect(content).toContain('test');
      expect(content).toContain('refactor');
    });

    it('should include commit message examples', () => {
      expect(content).toMatch(/feat\(.*\):/);
      expect(content).toMatch(/fix\(.*\):/);
    });
  });

  describe('Pull Request Process Section', () => {
    it('should have a PR process section', () => {
      expect(content).toMatch(/Pull Request Process/i);
    });

    it('should mention PR template', () => {
      expect(content).toMatch(/PR template/i);
    });

    it('should mention CI checks', () => {
      expect(content).toMatch(/CI/i);
    });

    it('should mention review requirement', () => {
      expect(content).toMatch(/review/i);
    });

    it('should mention linking related issues', () => {
      expect(content).toMatch(/Closes #/i);
    });
  });

  describe('First-Time Contributors Section', () => {
    it('should have a first-time contributors section', () => {
      expect(content).toMatch(/First-Time Contributors/i);
    });

    it('should mention good first issue label', () => {
      expect(content).toMatch(/good first issue/i);
    });

    it('should mention help wanted label', () => {
      expect(content).toMatch(/help wanted/i);
    });

    it('should be welcoming to newcomers', () => {
      expect(content).toMatch(/welcome/i);
    });
  });

  describe('Getting Help Section', () => {
    it('should have a getting help section', () => {
      expect(content).toMatch(/Getting Help/i);
    });

    it('should link to GitHub Issues', () => {
      expect(content).toMatch(/GitHub Issues/i);
    });
  });

  describe('Overall Quality', () => {
    it('should have at least 6 major sections', () => {
      const sectionCount = (content.match(/^## /gm) ?? []).length;
      expect(sectionCount).toBeGreaterThanOrEqual(6);
    });

    it('should be comprehensive (at least 3000 characters)', () => {
      expect(content.length).toBeGreaterThan(3000);
    });

    it('should end with a newline', () => {
      expect(content.endsWith('\n')).toBe(true);
    });

    it('should not have broken markdown links', () => {
      const brokenLinkPattern = /\]\(\s*\)/;
      expect(content).not.toMatch(brokenLinkPattern);
    });
  });
});

describe('TASK-098: CODE_OF_CONDUCT.md Completeness', () => {
  let content: string;

  beforeAll(() => {
    const conductPath = join(PROJECT_ROOT, 'CODE_OF_CONDUCT.md');
    expect(existsSync(conductPath)).toBe(true);
    content = readFileSync(conductPath, 'utf-8');
  });

  it('should exist and be based on Contributor Covenant', () => {
    expect(content).toMatch(/Contributor Covenant/i);
  });

  it('should include all required sections', () => {
    expect(content).toMatch(/## Our Pledge/i);
    expect(content).toMatch(/## Our Standards/i);
    expect(content).toMatch(/## Enforcement/i);
    expect(content).toMatch(/## Scope/i);
    expect(content).toMatch(/## Attribution/i);
  });

  it('should include enforcement guidelines with escalation levels', () => {
    expect(content).toMatch(/Correction/i);
    expect(content).toMatch(/Warning/i);
    expect(content).toMatch(/Temporary Ban/i);
    expect(content).toMatch(/Permanent Ban/i);
  });

  it('should provide a contact email for reporting', () => {
    expect(content).toMatch(/conduct@crewspace\.dev/);
  });

  it('should end with a newline', () => {
    expect(content.endsWith('\n')).toBe(true);
  });
});

describe('TASK-098: Cross-References Between Docs', () => {
  let readme: string;
  let contributing: string;

  beforeAll(() => {
    readme = readFileSync(join(PROJECT_ROOT, 'README.md'), 'utf-8');
    contributing = readFileSync(join(PROJECT_ROOT, 'CONTRIBUTING.md'), 'utf-8');
  });

  it('README should link to CONTRIBUTING.md', () => {
    expect(readme).toMatch(/\[.*\]\(.*CONTRIBUTING\.md\)/);
  });

  it('README should link to CODE_OF_CONDUCT.md', () => {
    expect(readme).toMatch(/\[.*\]\(.*CODE_OF_CONDUCT\.md\)/);
  });

  it('CONTRIBUTING.md should reference CODE_OF_CONDUCT.md', () => {
    expect(contributing).toMatch(/\[.*\]\(.*CODE_OF_CONDUCT\.md\)/);
  });

  it('CONTRIBUTING.md should link to the GitHub repository', () => {
    expect(contributing).toContain('github.com/aviferdman/ProjectX2-Product');
  });
});
