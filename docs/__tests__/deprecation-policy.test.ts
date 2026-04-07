import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const docsRoot = resolve(__dirname, '..');
const policyPath = join(docsRoot, 'guide', 'deprecation-policy.md');

function getContent(): string {
  return readFileSync(policyPath, 'utf-8');
}

describe('Deprecation policy content', () => {
  const content = getContent();

  it('should have a top-level heading', () => {
    expect(content).toMatch(/^# Deprecation Policy/m);
  });

  it('should document guiding principles', () => {
    expect(content).toContain('Guiding Principles');
    expect(content).toContain('No surprise removals');
    expect(content).toContain('Runtime warnings');
    expect(content).toContain('Clear migration path');
    expect(content).toContain('Semantic Versioning alignment');
  });

  it('should cover versioning and breaking changes', () => {
    expect(content).toContain('Versioning & Breaking Changes');
    expect(content).toContain('Semantic Versioning 2.0.0');
    expect(content).toContain('Pre-1.0');
    expect(content).toContain('Post-1.0');
  });

  it('should document pre-1.0 policy', () => {
    expect(content).toContain('Pre-1.0 policy');
    expect(content).toContain('minor release');
  });

  it('should document post-1.0 policy', () => {
    expect(content).toContain('Post-1.0 policy');
    expect(content).toContain('major version');
  });

  it('should describe the full deprecation lifecycle', () => {
    expect(content).toContain('Deprecation Lifecycle');
    expect(content).toContain('Stage 1');
    expect(content).toContain('Announce');
    expect(content).toContain('Stage 2');
    expect(content).toContain('Warn');
    expect(content).toContain('Stage 3');
    expect(content).toContain('Remove');
  });

  it('should document all deprecation utility APIs', () => {
    expect(content).toContain('Using the Deprecation Utilities');
    expect(content).toContain('emitDeprecationWarning');
    expect(content).toContain('deprecatedFunction');
    expect(content).toContain('@deprecated');
    expect(content).toContain('DeprecationRegistry');
  });

  it('should include code examples for each utility', () => {
    expect(content).toContain("from '@crewspace/core'");
    // imperative
    expect(content).toContain('emitDeprecationWarning({');
    // function wrapper
    expect(content).toContain('deprecatedFunction(');
    // decorator
    expect(content).toContain('@deprecated({');
    // custom registry
    expect(content).toContain('new DeprecationRegistry()');
  });

  it('should document DeprecationInfo fields', () => {
    expect(content).toContain('DeprecationInfo Fields');
    expect(content).toContain('| `name`');
    expect(content).toContain('| `message`');
    expect(content).toContain('| `since`');
    expect(content).toContain('| `removeIn`');
    expect(content).toContain('| `replacement`');
  });

  it('should cover changelog conventions', () => {
    expect(content).toContain('Changelog Conventions');
    expect(content).toContain('Deprecated');
    expect(content).toContain('Removed');
    expect(content).toContain('Keep a Changelog');
  });

  it('should include a maintainer checklist', () => {
    expect(content).toContain('Checklist for Maintainers');
    expect(content).toContain('JSDoc');
    expect(content).toContain('CHANGELOG.md');
  });

  it('should document how to suppress warnings', () => {
    expect(content).toContain('Suppressing Warnings');
    expect(content).toContain('setEnabled(false)');
    expect(content).toContain('setHandler');
    expect(content).toContain('reset()');
  });

  it('should have a summary table', () => {
    expect(content).toContain('## Summary');
    expect(content).toContain('| Aspect |');
    expect(content).toContain('SemVer compliance');
  });

  it('should mention SemVer compliance for removals', () => {
    expect(content).toContain('Removals never in patch releases');
  });
});

describe('Deprecation policy structure', () => {
  const content = getContent();

  it('should have the expected major sections', () => {
    const h2Headings = content.match(/^## .+$/gm) || [];
    const headingTexts = h2Headings.map((h) => h.replace(/^## /, ''));

    expect(headingTexts).toContain('Guiding Principles');
    expect(headingTexts).toContain('Versioning & Breaking Changes');
    expect(headingTexts).toContain('Deprecation Lifecycle');
    expect(headingTexts).toContain('Using the Deprecation Utilities');
    expect(headingTexts).toContain('DeprecationInfo Fields');
    expect(headingTexts).toContain('Changelog Conventions');
    expect(headingTexts).toContain('Checklist for Maintainers');
    expect(headingTexts).toContain('Suppressing Warnings');
    expect(headingTexts).toContain('Summary');
  });

  it('should contain TypeScript code blocks', () => {
    const tsCodeBlocks = content.match(/```typescript/g) || [];
    expect(tsCodeBlocks.length).toBeGreaterThanOrEqual(4);
  });

  it('should contain markdown code blocks for changelog examples', () => {
    const mdCodeBlocks = content.match(/```markdown/g) || [];
    expect(mdCodeBlocks.length).toBeGreaterThanOrEqual(1);
  });

  it('should reference the @crewspace/core package', () => {
    expect(content).toContain('@crewspace/core');
  });
});
