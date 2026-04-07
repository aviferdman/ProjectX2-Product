/**
 * QA Validation Tests for TASK-100: PR Template with Checklist
 *
 * Validates that the PR template exists at .github/PULL_REQUEST_TEMPLATE.md
 * with required sections, checklist categories, and inline commands that
 * match the project's CI pipeline and contributing guidelines.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../../../..');
const PR_TEMPLATE_PATH = join(PROJECT_ROOT, '.github', 'PULL_REQUEST_TEMPLATE.md');

describe('TASK-100: PR Template Exists', () => {
  it('should have .github/PULL_REQUEST_TEMPLATE.md', () => {
    expect(existsSync(PR_TEMPLATE_PATH)).toBe(true);
  });
});

describe('TASK-100: PR Template Sections', () => {
  let content: string;

  beforeAll(() => {
    content = readFileSync(PR_TEMPLATE_PATH, 'utf-8');
  });

  it('should have a Description section', () => {
    expect(content).toMatch(/## Description/i);
  });

  it('should have a Related Issue field', () => {
    expect(content).toMatch(/Related Issue/i);
    expect(content).toMatch(/Closes #/);
  });

  it('should have a Type of Change section', () => {
    expect(content).toMatch(/## Type of Change/i);
  });

  it('should have a Changes Made section', () => {
    expect(content).toMatch(/## Changes Made/i);
  });

  it('should have a Checklist section', () => {
    expect(content).toMatch(/## Checklist/i);
  });

  it('should have a Breaking Changes section', () => {
    expect(content).toMatch(/## Breaking Changes/i);
  });

  it('should have a Screenshots / Output section', () => {
    expect(content).toMatch(/## Screenshots/i);
  });

  it('should have an Additional Notes section', () => {
    expect(content).toMatch(/## Additional Notes/i);
  });

  it('should have at least 7 sections', () => {
    const sectionCount = (content.match(/^## /gm) ?? []).length;
    expect(sectionCount).toBeGreaterThanOrEqual(7);
  });
});

describe('TASK-100: Type of Change Options', () => {
  let content: string;

  beforeAll(() => {
    content = readFileSync(PR_TEMPLATE_PATH, 'utf-8');
  });

  it('should include bug fix option', () => {
    expect(content).toMatch(/Bug fix/i);
  });

  it('should include new feature option', () => {
    expect(content).toMatch(/New feature/i);
  });

  it('should include breaking change option', () => {
    expect(content).toMatch(/Breaking change/i);
  });

  it('should include documentation update option', () => {
    expect(content).toMatch(/Documentation update/i);
  });

  it('should include refactoring option', () => {
    expect(content).toMatch(/Refactoring/i);
  });

  it('should include tests option', () => {
    expect(content).toMatch(/Tests/i);
  });

  it('should include CI/Build option', () => {
    expect(content).toMatch(/CI\/Build/i);
  });

  it('should include performance improvement option', () => {
    expect(content).toMatch(/Performance improvement/i);
  });
});

describe('TASK-100: Checklist — Code Quality', () => {
  let content: string;

  beforeAll(() => {
    content = readFileSync(PR_TEMPLATE_PATH, 'utf-8');
  });

  it('should have a Code Quality sub-section', () => {
    expect(content).toMatch(/### Code Quality/i);
  });

  it('should reference npm run build', () => {
    expect(content).toMatch(/npm run build/);
  });

  it('should reference npm run typecheck', () => {
    expect(content).toMatch(/npm run typecheck/);
  });

  it('should reference npm run lint', () => {
    expect(content).toMatch(/npm run lint/);
  });

  it('should reference npm run format:check', () => {
    expect(content).toMatch(/npm run format:check/);
  });
});

describe('TASK-100: Checklist — Testing', () => {
  let content: string;

  beforeAll(() => {
    content = readFileSync(PR_TEMPLATE_PATH, 'utf-8');
  });

  it('should have a Testing sub-section', () => {
    expect(content).toMatch(/### Testing/i);
  });

  it('should require adding tests', () => {
    expect(content).toMatch(/added tests/i);
  });

  it('should reference npm test', () => {
    expect(content).toMatch(/npm test/);
  });

  it('should mention 80% coverage threshold', () => {
    expect(content).toMatch(/80%/);
  });

  it('should reference npm run test:coverage', () => {
    expect(content).toMatch(/npm run test:coverage/);
  });
});

describe('TASK-100: Checklist — Documentation', () => {
  let content: string;

  beforeAll(() => {
    content = readFileSync(PR_TEMPLATE_PATH, 'utf-8');
  });

  it('should have a Documentation sub-section', () => {
    expect(content).toMatch(/### Documentation/i);
  });

  it('should mention JSDoc', () => {
    expect(content).toMatch(/JSDoc/);
  });

  it('should mention README', () => {
    expect(content).toMatch(/README/);
  });

  it('should mention CHANGELOG', () => {
    expect(content).toMatch(/CHANGELOG/);
  });
});

describe('TASK-100: Checklist — Performance', () => {
  let content: string;

  beforeAll(() => {
    content = readFileSync(PR_TEMPLATE_PATH, 'utf-8');
  });

  it('should have a Performance sub-section', () => {
    expect(content).toMatch(/### Performance/i);
  });

  it('should reference benchmark command', () => {
    expect(content).toMatch(/npm run bench/);
  });

  it('should mention performance budgets or regressions', () => {
    expect(content).toMatch(/[Pp]erformance (Budgets|regressions?)/);
  });
});

describe('TASK-100: Checklist — Commit Conventions', () => {
  let content: string;

  beforeAll(() => {
    content = readFileSync(PR_TEMPLATE_PATH, 'utf-8');
  });

  it('should have a Commit Conventions sub-section', () => {
    expect(content).toMatch(/### Commit Conventions/i);
  });

  it('should reference Conventional Commits', () => {
    expect(content).toMatch(/Conventional Commits/);
  });
});

describe('TASK-100: Checklist Items Count', () => {
  let content: string;

  beforeAll(() => {
    content = readFileSync(PR_TEMPLATE_PATH, 'utf-8');
  });

  it('should have at least 15 checklist items total', () => {
    const checklistItems = (content.match(/^- \[ \]/gm) ?? []).length;
    expect(checklistItems).toBeGreaterThanOrEqual(15);
  });

  it('should have at least 5 checklist sub-sections', () => {
    const subSections = (content.match(/^### /gm) ?? []).length;
    expect(subSections).toBeGreaterThanOrEqual(5);
  });
});

describe('TASK-100: Quality', () => {
  let content: string;

  beforeAll(() => {
    content = readFileSync(PR_TEMPLATE_PATH, 'utf-8');
  });

  it('should be at least 800 characters', () => {
    expect(content.length).toBeGreaterThan(800);
  });

  it('should use markdown checkbox syntax', () => {
    expect(content).toMatch(/- \[ \]/);
  });

  it('should contain HTML comments with guidance', () => {
    expect(content).toMatch(/<!--.*-->/s);
  });
});

describe('TASK-100: Cross-References', () => {
  let contributing: string;

  beforeAll(() => {
    contributing = readFileSync(join(PROJECT_ROOT, 'CONTRIBUTING.md'), 'utf-8');
  });

  it('CONTRIBUTING.md should reference the PR template', () => {
    expect(contributing).toMatch(/PR template/i);
  });

  it('CONTRIBUTING.md should describe the pull request process', () => {
    expect(contributing).toMatch(/Pull Request Process/i);
  });
});
