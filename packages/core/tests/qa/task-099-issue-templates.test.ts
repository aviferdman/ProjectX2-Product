/**
 * QA Validation Tests for TASK-099: GitHub Issue Templates (bug, feature, question)
 *
 * Validates that all three issue templates exist under .github/ISSUE_TEMPLATE/
 * with correct frontmatter, required sections, and a config.yml template chooser.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../../../..');
const TEMPLATE_DIR = join(PROJECT_ROOT, '.github', 'ISSUE_TEMPLATE');

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const result: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx > 0) {
      result[line.slice(0, idx).trim()] = line
        .slice(idx + 1)
        .trim()
        .replace(/^["']|["']$/g, '');
    }
  }
  return result;
}

describe('TASK-099: Issue Template Directory', () => {
  it('should have .github/ISSUE_TEMPLATE/ directory', () => {
    expect(existsSync(TEMPLATE_DIR)).toBe(true);
  });

  it('should contain bug_report.md', () => {
    expect(existsSync(join(TEMPLATE_DIR, 'bug_report.md'))).toBe(true);
  });

  it('should contain feature_request.md', () => {
    expect(existsSync(join(TEMPLATE_DIR, 'feature_request.md'))).toBe(true);
  });

  it('should contain question.md', () => {
    expect(existsSync(join(TEMPLATE_DIR, 'question.md'))).toBe(true);
  });

  it('should contain config.yml', () => {
    expect(existsSync(join(TEMPLATE_DIR, 'config.yml'))).toBe(true);
  });
});

describe('TASK-099: Bug Report Template', () => {
  let content: string;
  let frontmatter: Record<string, string>;

  beforeAll(() => {
    content = readFileSync(join(TEMPLATE_DIR, 'bug_report.md'), 'utf-8');
    frontmatter = parseFrontmatter(content);
  });

  describe('Frontmatter', () => {
    it('should have a name field', () => {
      expect(frontmatter.name).toBeTruthy();
      expect(frontmatter.name).toMatch(/bug/i);
    });

    it('should have an about field', () => {
      expect(frontmatter.about).toBeTruthy();
    });

    it('should set the bug label', () => {
      expect(frontmatter.labels).toMatch(/bug/i);
    });

    it('should have a title prefix', () => {
      expect(frontmatter.title).toBeTruthy();
      expect(frontmatter.title).toMatch(/bug/i);
    });
  });

  describe('Sections', () => {
    it('should have a Description section', () => {
      expect(content).toMatch(/## Description/i);
    });

    it('should have a Steps to Reproduce section', () => {
      expect(content).toMatch(/## Steps to Reproduce/i);
    });

    it('should have an Expected Behavior section', () => {
      expect(content).toMatch(/## Expected Behavior/i);
    });

    it('should have an Actual Behavior section', () => {
      expect(content).toMatch(/## Actual Behavior/i);
    });

    it('should have an Environment section', () => {
      expect(content).toMatch(/## Environment/i);
    });

    it('should ask for Crewspace version', () => {
      expect(content).toMatch(/Crewspace version/i);
    });

    it('should ask for Node.js version', () => {
      expect(content).toMatch(/Node\.js version/i);
    });

    it('should ask for OS information', () => {
      expect(content).toMatch(/OS/);
    });

    it('should include a code sample section', () => {
      expect(content).toMatch(/Code Sample/i);
    });
  });

  describe('Quality', () => {
    it('should be at least 400 characters', () => {
      expect(content.length).toBeGreaterThan(400);
    });

    it('should have at least 4 sections', () => {
      const sectionCount = (content.match(/^## /gm) ?? []).length;
      expect(sectionCount).toBeGreaterThanOrEqual(4);
    });
  });
});

describe('TASK-099: Feature Request Template', () => {
  let content: string;
  let frontmatter: Record<string, string>;

  beforeAll(() => {
    content = readFileSync(join(TEMPLATE_DIR, 'feature_request.md'), 'utf-8');
    frontmatter = parseFrontmatter(content);
  });

  describe('Frontmatter', () => {
    it('should have a name field', () => {
      expect(frontmatter.name).toBeTruthy();
      expect(frontmatter.name).toMatch(/feature/i);
    });

    it('should have an about field', () => {
      expect(frontmatter.about).toBeTruthy();
    });

    it('should set the enhancement label', () => {
      expect(frontmatter.labels).toMatch(/enhancement/i);
    });

    it('should have a title prefix', () => {
      expect(frontmatter.title).toBeTruthy();
      expect(frontmatter.title).toMatch(/feature/i);
    });
  });

  describe('Sections', () => {
    it('should have a Problem Statement section', () => {
      expect(content).toMatch(/## Problem Statement/i);
    });

    it('should have a Proposed Solution section', () => {
      expect(content).toMatch(/## Proposed Solution/i);
    });

    it('should have an Example Usage section with code block', () => {
      expect(content).toMatch(/## Example Usage/i);
      expect(content).toContain('```typescript');
    });

    it('should have an Alternatives Considered section', () => {
      expect(content).toMatch(/## Alternatives Considered/i);
    });
  });

  describe('Quality', () => {
    it('should be at least 300 characters', () => {
      expect(content.length).toBeGreaterThan(300);
    });

    it('should have at least 3 sections', () => {
      const sectionCount = (content.match(/^## /gm) ?? []).length;
      expect(sectionCount).toBeGreaterThanOrEqual(3);
    });
  });
});

describe('TASK-099: Question Template', () => {
  let content: string;
  let frontmatter: Record<string, string>;

  beforeAll(() => {
    content = readFileSync(join(TEMPLATE_DIR, 'question.md'), 'utf-8');
    frontmatter = parseFrontmatter(content);
  });

  describe('Frontmatter', () => {
    it('should have a name field', () => {
      expect(frontmatter.name).toBeTruthy();
      expect(frontmatter.name).toMatch(/question/i);
    });

    it('should have an about field', () => {
      expect(frontmatter.about).toBeTruthy();
    });

    it('should set the question label', () => {
      expect(frontmatter.labels).toMatch(/question/i);
    });

    it('should have a title prefix', () => {
      expect(frontmatter.title).toBeTruthy();
      expect(frontmatter.title).toMatch(/question/i);
    });
  });

  describe('Sections', () => {
    it('should have a Question section', () => {
      expect(content).toMatch(/## Question/i);
    });

    it('should have a Context section', () => {
      expect(content).toMatch(/## Context/i);
    });

    it("should have a What I've Tried section", () => {
      expect(content).toMatch(/## What I.*Tried/i);
    });

    it('should have Environment info', () => {
      expect(content).toMatch(/## Environment/i);
    });
  });

  describe('Quality', () => {
    it('should be at least 200 characters', () => {
      expect(content.length).toBeGreaterThan(200);
    });

    it('should have at least 3 sections', () => {
      const sectionCount = (content.match(/^## /gm) ?? []).length;
      expect(sectionCount).toBeGreaterThanOrEqual(3);
    });
  });
});

describe('TASK-099: Template Chooser Config', () => {
  let content: string;

  beforeAll(() => {
    content = readFileSync(join(TEMPLATE_DIR, 'config.yml'), 'utf-8');
  });

  it('should disable blank issues', () => {
    expect(content).toMatch(/blank_issues_enabled:\s*false/);
  });

  it('should have contact links', () => {
    expect(content).toMatch(/contact_links/);
  });

  it('should link to community resources', () => {
    expect(content).toMatch(/url:/);
  });
});

describe('TASK-099: Cross-References', () => {
  let contributing: string;

  beforeAll(() => {
    contributing = readFileSync(join(PROJECT_ROOT, 'CONTRIBUTING.md'), 'utf-8');
  });

  it('CONTRIBUTING.md should reference the bug report template', () => {
    expect(contributing).toMatch(/bug.report/i);
  });

  it('CONTRIBUTING.md should reference the feature request template', () => {
    expect(contributing).toMatch(/feature.request/i);
  });

  it('CONTRIBUTING.md should reference the question template', () => {
    expect(contributing).toMatch(/question/i);
  });
});
