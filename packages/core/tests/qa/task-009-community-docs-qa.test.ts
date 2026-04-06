/**
 * QA Validation Tests for TASK-009: CONTRIBUTING.md and CODE_OF_CONDUCT.md
 *
 * Validates that both community documents exist, have required content,
 * and are properly cross-referenced from README.md.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../../../..');

describe('TASK-009: CONTRIBUTING.md Validation', () => {
  const contributingPath = join(PROJECT_ROOT, 'CONTRIBUTING.md');
  let content: string;

  it('should exist at project root', () => {
    expect(existsSync(contributingPath)).toBe(true);
    content = readFileSync(contributingPath, 'utf-8');
  });

  describe('Header and Introduction', () => {
    it('should have a title referencing Crewspace', () => {
      expect(content).toMatch(/# .*Crewspace/i);
    });

    it('should welcome contributors', () => {
      expect(content).toMatch(/contribut/i);
    });
  });

  describe('Getting Started Section', () => {
    it('should have a Getting Started section', () => {
      expect(content).toMatch(/Getting Started/i);
    });

    it('should include clone instructions', () => {
      expect(content).toContain('git clone');
    });

    it('should include npm install command', () => {
      expect(content).toContain('npm install');
    });

    it('should include build command', () => {
      expect(content).toContain('npm run build');
    });

    it('should include test command', () => {
      expect(content).toContain('npm test');
    });
  });

  describe('Development Workflow', () => {
    it('should describe a development workflow', () => {
      expect(content).toMatch(/Development Workflow|Workflow/i);
    });

    it('should mention creating a branch', () => {
      expect(content).toMatch(/branch/i);
    });

    it('should mention pull requests', () => {
      expect(content).toMatch(/pull request/i);
    });

    it('should mention running tests', () => {
      expect(content).toMatch(/test/i);
    });
  });

  describe('Coding Standards', () => {
    it('should have a section on coding standards', () => {
      expect(content).toMatch(/Coding Standards|Standards/i);
    });

    it('should mention TypeScript', () => {
      expect(content).toContain('TypeScript');
    });

    it('should mention Prettier', () => {
      expect(content).toContain('Prettier');
    });

    it('should mention ESLint', () => {
      expect(content).toContain('ESLint');
    });

    it('should mention Vitest', () => {
      expect(content).toContain('Vitest');
    });

    it('should mention code coverage requirement', () => {
      expect(content).toMatch(/80%|coverage/i);
    });
  });

  describe('Versioning Section', () => {
    it('should reference semantic versioning', () => {
      expect(content).toMatch(/Semantic Versioning|semver/i);
    });
  });

  describe('Quality Checks', () => {
    it('should be at least 1000 characters', () => {
      expect(content.length).toBeGreaterThan(1000);
    });

    it('should have multiple sections (>= 3)', () => {
      const sectionCount = (content.match(/^## /gm) ?? []).length;
      expect(sectionCount).toBeGreaterThanOrEqual(3);
    });

    it('should not have broken markdown links', () => {
      const brokenLinkPattern = /\]\(\s*\)/;
      expect(content).not.toMatch(brokenLinkPattern);
    });

    it('should end with a newline', () => {
      expect(content.endsWith('\n')).toBe(true);
    });
  });
});

describe('TASK-009: CODE_OF_CONDUCT.md Validation', () => {
  const conductPath = join(PROJECT_ROOT, 'CODE_OF_CONDUCT.md');
  let content: string;

  it('should exist at project root', () => {
    expect(existsSync(conductPath)).toBe(true);
    content = readFileSync(conductPath, 'utf-8');
  });

  describe('Pledge Section', () => {
    it('should contain a pledge section', () => {
      expect(content).toMatch(/Pledge/i);
    });

    it('should pledge to a harassment-free experience', () => {
      expect(content).toMatch(/harassment-free/i);
    });

    it('should mention inclusivity values', () => {
      expect(content).toMatch(/inclusive|welcoming|diverse/i);
    });
  });

  describe('Standards Section', () => {
    it('should define standards of behavior', () => {
      expect(content).toMatch(/Standards/i);
    });

    it('should list positive behaviors', () => {
      expect(content).toMatch(/empathy|kindness|respectful/i);
    });

    it('should list unacceptable behaviors', () => {
      expect(content).toMatch(/unacceptable/i);
    });

    it('should mention harassment as unacceptable', () => {
      expect(content).toMatch(/harassment/i);
    });
  });

  describe('Enforcement Section', () => {
    it('should have enforcement information', () => {
      expect(content).toMatch(/Enforcement/i);
    });

    it('should provide a contact method for reporting', () => {
      expect(content).toMatch(/report|contact|email/i);
    });

    it('should describe enforcement consequences', () => {
      expect(content).toMatch(/Correction|Warning|Ban/i);
    });
  });

  describe('Scope Section', () => {
    it('should define the scope of the code of conduct', () => {
      expect(content).toMatch(/Scope/i);
    });

    it('should mention community spaces', () => {
      expect(content).toMatch(/community spaces|public spaces/i);
    });
  });

  describe('Attribution', () => {
    it('should credit the Contributor Covenant', () => {
      expect(content).toMatch(/Contributor Covenant/i);
    });

    it('should include a link to the Contributor Covenant', () => {
      expect(content).toContain('contributor-covenant.org');
    });
  });

  describe('Quality Checks', () => {
    it('should be at least 2000 characters', () => {
      expect(content.length).toBeGreaterThan(2000);
    });

    it('should have multiple sections (>= 4)', () => {
      const sectionCount = (content.match(/^##+ /gm) ?? []).length;
      expect(sectionCount).toBeGreaterThanOrEqual(4);
    });

    it('should not have broken markdown links', () => {
      const brokenLinkPattern = /\]\(\s*\)/;
      expect(content).not.toMatch(brokenLinkPattern);
    });

    it('should end with a newline', () => {
      expect(content.endsWith('\n')).toBe(true);
    });
  });
});

describe('TASK-009: Cross-Reference Validation', () => {
  const readmePath = join(PROJECT_ROOT, 'README.md');
  let readmeContent: string;

  beforeAll(() => {
    readmeContent = readFileSync(readmePath, 'utf-8');
  });

  it('should reference CONTRIBUTING.md in README', () => {
    expect(readmeContent).toContain('CONTRIBUTING.md');
  });

  it('should reference CODE_OF_CONDUCT.md in README', () => {
    expect(readmeContent).toContain('CODE_OF_CONDUCT.md');
  });

  it('should no longer say "coming soon" for CONTRIBUTING.md', () => {
    const contributingLineMatch = readmeContent.match(/CONTRIBUTING\.md.*coming soon/i);
    expect(contributingLineMatch).toBeNull();
  });

  it('should link to CONTRIBUTING.md with markdown link syntax', () => {
    expect(readmeContent).toMatch(/\[.*\]\(.*CONTRIBUTING\.md\)/);
  });

  it('should link to CODE_OF_CONDUCT.md with markdown link syntax', () => {
    expect(readmeContent).toMatch(/\[.*\]\(.*CODE_OF_CONDUCT\.md\)/);
  });
});
