/**
 * QA Validation Tests for TASK-007: README.md and LICENSE
 *
 * Validates documentation completeness, accuracy, and compliance
 * with project requirements.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ESLint naming exceptions for ESM compatibility
// eslint-disable-next-line @typescript-eslint/naming-convention
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../../../..');
const CORE_PACKAGE_ROOT = join(__dirname, '../..');

describe('TASK-007: LICENSE Validation', () => {
  const licensePath = join(PROJECT_ROOT, 'LICENSE');

  it('should exist at project root', () => {
    expect(existsSync(licensePath)).toBe(true);
  });

  it('should be MIT license', () => {
    const content = readFileSync(licensePath, 'utf-8');
    expect(content).toContain('MIT License');
  });

  it('should include copyright year 2026', () => {
    const content = readFileSync(licensePath, 'utf-8');
    expect(content).toContain('Copyright (c) 2026');
  });

  it('should include Crewspace Contributors', () => {
    const content = readFileSync(licensePath, 'utf-8');
    expect(content).toContain('Crewspace Contributors');
  });

  it('should contain standard MIT license text', () => {
    const content = readFileSync(licensePath, 'utf-8');
    expect(content).toContain('Permission is hereby granted, free of charge');
    expect(content).toContain('THE SOFTWARE IS PROVIDED "AS IS"');
    expect(content).toContain('WITHOUT WARRANTY OF ANY KIND');
  });

  it('should not exceed 1500 characters', () => {
    const content = readFileSync(licensePath, 'utf-8');
    expect(content.length).toBeLessThan(1500);
  });
});

describe('TASK-007: Root README.md Validation', () => {
  const readmePath = join(PROJECT_ROOT, 'README.md');
  let content: string;

  it('should exist at project root', () => {
    expect(existsSync(readmePath)).toBe(true);
    content = readFileSync(readmePath, 'utf-8');
  });

  describe('Header Section', () => {
    it('should have project title "Crewspace"', () => {
      expect(content).toContain('# 🚀 Crewspace');
    });

    it('should have tagline', () => {
      expect(content).toContain('TypeScript-native agent orchestration framework');
    });

    it('should include CI badge', () => {
      expect(content).toMatch(/\[!\[CI\]\(.*badge\.svg\)\]/);
    });

    it('should include MIT license badge', () => {
      expect(content).toMatch(/\[!\[License: MIT\]\(.*MIT.*\)\]/);
    });

    it('should include TypeScript badge', () => {
      expect(content).toMatch(/\[!\[TypeScript\]\(.*TypeScript.*\)\]/);
    });

    it('should include Node.js badge', () => {
      expect(content).toMatch(/\[!\[Node\.js\]\(.*Node\.js.*\)\]/);
    });

    it('should specify Node.js 18+ requirement in badge', () => {
      expect(content).toContain('Node.js-18+');
    });

    it('should specify TypeScript 5.4+ in badge', () => {
      expect(content).toMatch(/TypeScript-5\.4\+/);
    });
  });

  describe('What is Crewspace Section', () => {
    it('should have "What is Crewspace?" section', () => {
      expect(content).toContain('## What is Crewspace?');
    });

    it('should describe framework purpose', () => {
      expect(content).toContain('TypeScript-native framework');
      expect(content).toContain('multi-agent');
    });
  });

  describe('Key Features Section', () => {
    it('should have Key Features section', () => {
      expect(content).toContain('### Key Features');
    });

    it('should list type-safety feature', () => {
      expect(content).toMatch(/Type-safe|type.safe/i);
      expect(content).toContain('TypeScript');
    });

    it('should list event-driven execution', () => {
      expect(content).toContain('Event-driven');
      expect(content).toContain('EventEmitter');
    });

    it('should list provider-agnostic feature', () => {
      expect(content).toContain('Provider-agnostic');
      expect(content).toContain('OpenAI');
      expect(content).toContain('Anthropic');
      expect(content).toContain('Ollama');
    });

    it('should mention monorepo support', () => {
      expect(content).toContain('Monorepo');
    });

    it('should mention test-friendly design', () => {
      expect(content).toMatch(/Test-friendly|testability/i);
    });

    it('should highlight performance (fast/low memory)', () => {
      expect(content).toMatch(/Fast|performance|startup time|memory/i);
    });
  });

  describe('Packages Section', () => {
    it('should have Packages section', () => {
      expect(content).toContain('## Packages');
    });

    it('should list @crewspace/core package', () => {
      expect(content).toContain('@crewspace/core');
    });

    it('should include package version', () => {
      expect(content).toContain('0.1.0');
    });

    it('should describe core package purpose', () => {
      expect(content).toContain('Core agent orchestration');
      expect(content).toMatch(/Agent.*Crew.*Task/);
    });
  });

  describe('Quick Start Section', () => {
    it('should have Quick Start section', () => {
      expect(content).toContain('## Quick Start');
    });

    it('should include installation instructions', () => {
      expect(content).toContain('npm install @crewspace/core');
    });

    it('should show Agent example', () => {
      expect(content).toContain('new Agent');
    });

    it('should show Crew example', () => {
      expect(content).toContain('new Crew');
    });

    it('should show import statement', () => {
      expect(content).toContain("import { Agent, Crew } from '@crewspace/core'");
    });

    it('should show example agent configuration', () => {
      expect(content).toContain('name:');
      expect(content).toContain('role:');
      expect(content).toContain('goal:');
    });

    it('should include note about API under development', () => {
      expect(content).toContain('under active development');
    });
  });

  describe('Development Section', () => {
    it('should have Development section', () => {
      expect(content).toContain('## Development');
    });

    it('should list prerequisites', () => {
      expect(content).toContain('Prerequisites');
      expect(content).toContain('Node.js');
      expect(content).toContain('npm');
    });

    it('should specify Node.js 18+', () => {
      expect(content).toMatch(/Node\.js.*18/);
    });

    it('should include setup instructions', () => {
      expect(content).toContain('git clone');
      expect(content).toContain('npm install');
      expect(content).toContain('npm run build');
    });

    it('should include correct repository URL', () => {
      expect(content).toContain('https://github.com/aviferdman/ProjectX2-Product.git');
    });
  });

  describe('Available Scripts', () => {
    it('should have Available Scripts section or table', () => {
      expect(content).toMatch(/Available Scripts|Scripts/);
    });

    const requiredScripts = [
      'build',
      'test',
      'test:watch',
      'test:coverage',
      'lint',
      'lint:fix',
      'format',
      'format:check',
      'typecheck',
      'clean',
    ];

    requiredScripts.forEach((script) => {
      it(`should document "${script}" script`, () => {
        expect(content).toContain(script);
      });
    });
  });

  describe('Project Structure', () => {
    it('should show project structure', () => {
      expect(content).toContain('Project Structure');
    });

    it('should show packages directory', () => {
      expect(content).toMatch(/packages\/|packages\//);
    });

    it('should show core package', () => {
      expect(content).toContain('core');
    });

    it('should show GitHub workflows directory', () => {
      expect(content).toMatch(/\.github|github/);
    });

    it('should mention key config files', () => {
      expect(content).toContain('package.json');
      expect(content).toContain('tsconfig');
      expect(content).toContain('eslint');
    });
  });

  describe('Architecture Decisions', () => {
    it('should document architecture decisions', () => {
      expect(content).toContain('Architecture');
    });

    it('should mention monorepo with npm workspaces', () => {
      expect(content).toContain('npm workspaces');
    });

    it('should mention TypeScript strict mode', () => {
      expect(content).toContain('strict');
    });

    it('should specify ES2022 target', () => {
      expect(content).toContain('ES2022');
    });

    it('should mention ESLint 9 flat config', () => {
      expect(content).toContain('ESLint 9');
    });

    it('should mention Vitest', () => {
      expect(content).toContain('Vitest');
    });

    it('should mention 80% coverage threshold', () => {
      expect(content).toContain('80%');
    });

    it('should mention GitHub Actions CI', () => {
      expect(content).toContain('GitHub Actions');
    });
  });

  describe('Contributing Section', () => {
    it('should have Contributing section', () => {
      expect(content).toContain('## Contributing');
    });

    it('should mention lint requirement', () => {
      expect(content).toContain('npm run lint');
    });

    it('should mention typecheck requirement', () => {
      expect(content).toContain('npm run typecheck');
    });

    it('should mention test requirement', () => {
      expect(content).toContain('npm run test');
    });
  });

  describe('Roadmap Section', () => {
    it('should have Roadmap section', () => {
      expect(content).toContain('## Roadmap');
    });

    it('should mention Phase 1 (OSS framework)', () => {
      expect(content).toMatch(/Phase 1.*OSS|Phase 1.*framework/i);
    });

    it('should mention Phase 2 (Visual canvas)', () => {
      expect(content).toMatch(/Phase 2.*visual|Phase 2.*canvas/i);
    });

    it('should mention Phase 3 (Templates)', () => {
      expect(content).toMatch(/Phase 3.*template/i);
    });

    it('should mention Phase 4 (Cloud platform)', () => {
      expect(content).toMatch(/Phase 4.*cloud|Phase 4.*platform/i);
    });
  });

  describe('License Section', () => {
    it('should have License section', () => {
      expect(content).toContain('## License');
    });

    it('should reference MIT license', () => {
      expect(content).toMatch(/\[MIT\]|MIT/);
    });

    it('should link to LICENSE file', () => {
      expect(content).toMatch(/LICENSE/);
    });
  });

  describe('README Quality Checks', () => {
    it('should be at least 3000 characters', () => {
      expect(content.length).toBeGreaterThan(3000);
    });

    it('should not exceed 10000 characters', () => {
      expect(content.length).toBeLessThan(10000);
    });

    it('should have multiple sections (>= 7)', () => {
      const sectionCount = (content.match(/^## /gm) ?? []).length;
      expect(sectionCount).toBeGreaterThanOrEqual(7);
    });

    it('should not have broken markdown links', () => {
      const brokenLinkPattern = /\]\(\s*\)/;
      expect(content).not.toMatch(brokenLinkPattern);
    });

    it('should use proper markdown headings', () => {
      const lines = content.split('\n');
      const headings = lines.filter((line) => line.startsWith('#'));
      expect(headings.length).toBeGreaterThan(5);
    });
  });
});

describe('TASK-007: Core Package README.md Validation', () => {
  const readmePath = join(CORE_PACKAGE_ROOT, 'README.md');
  let content: string;

  it('should exist in packages/core', () => {
    expect(existsSync(readmePath)).toBe(true);
    content = readFileSync(readmePath, 'utf-8');
  });

  it('should have package title', () => {
    expect(content).toContain('# @crewspace/core');
  });

  it('should include MIT license badge', () => {
    expect(content).toMatch(/\[!\[License: MIT\]/);
  });

  it('should include TypeScript badge', () => {
    expect(content).toMatch(/\[!\[TypeScript\]/);
  });

  describe('Installation', () => {
    it('should have Installation section', () => {
      expect(content).toContain('## Installation');
    });

    it('should show npm install command', () => {
      expect(content).toContain('npm install @crewspace/core');
    });
  });

  describe('Overview', () => {
    it('should have Overview section', () => {
      expect(content).toContain('## Overview');
    });

    it('should describe Agent', () => {
      expect(content).toContain('Agent');
    });

    it('should describe Crew', () => {
      expect(content).toContain('Crew');
    });

    it('should describe Task', () => {
      expect(content).toContain('Task');
    });

    it('should describe Execution Engine', () => {
      expect(content).toContain('Execution Engine');
    });
  });

  describe('Quick Start', () => {
    it('should have Quick Start section', () => {
      expect(content).toContain('## Quick Start');
    });

    it('should show import example', () => {
      expect(content).toContain("import { VERSION } from '@crewspace/core'");
    });
  });

  describe('Dependencies', () => {
    it('should have Dependencies section', () => {
      expect(content).toContain('## Dependencies');
    });

    it('should list zod dependency', () => {
      expect(content).toContain('zod');
    });

    it('should list eventemitter3 dependency', () => {
      expect(content).toContain('eventemitter3');
    });

    it('should explain zod purpose', () => {
      expect(content).toMatch(/zod.*validation|validation.*zod/i);
    });

    it('should explain eventemitter3 purpose', () => {
      expect(content).toMatch(/eventemitter3.*event|event.*eventemitter3/i);
    });
  });

  describe('Development', () => {
    it('should have Development section', () => {
      expect(content).toContain('## Development');
    });

    it('should include build command', () => {
      expect(content).toContain('npm run build');
    });

    it('should include test command', () => {
      expect(content).toContain('npm run test');
    });

    it('should include typecheck command', () => {
      expect(content).toContain('npm run typecheck');
    });
  });

  describe('License', () => {
    it('should have License section', () => {
      expect(content).toContain('## License');
    });

    it('should reference LICENSE file', () => {
      expect(content).toMatch(/LICENSE/);
    });
  });

  it('should be at least 800 characters', () => {
    expect(content.length).toBeGreaterThan(800);
  });

  it('should not exceed 5000 characters', () => {
    expect(content.length).toBeLessThan(5000);
  });
});

describe('TASK-007: Documentation Cross-References', () => {
  const rootReadme = readFileSync(join(PROJECT_ROOT, 'README.md'), 'utf-8');
  const coreReadme = readFileSync(join(CORE_PACKAGE_ROOT, 'README.md'), 'utf-8');

  it('core README should link back to root README', () => {
    expect(coreReadme).toMatch(/root.*README|\.\.\/\.\.\/README/i);
  });

  it('root README should link to core package', () => {
    expect(rootReadme).toContain('./packages/core');
  });

  it('both READMEs should reference same license file', () => {
    expect(rootReadme).toContain('LICENSE');
    expect(coreReadme).toContain('LICENSE');
  });

  it('package versions should be consistent', () => {
    // Hardcoded version check - matches package.json
    expect(rootReadme).toContain('0.1.0');
  });
});

describe('TASK-007: CONTRIBUTING.md Existence Check', () => {
  it('should reference CONTRIBUTING.md in root README', () => {
    const rootReadme = readFileSync(join(PROJECT_ROOT, 'README.md'), 'utf-8');
    expect(rootReadme).toContain('CONTRIBUTING.md');
  });

  it('should note CONTRIBUTING.md is coming soon', () => {
    const rootReadme = readFileSync(join(PROJECT_ROOT, 'README.md'), 'utf-8');
    expect(rootReadme).toMatch(/coming soon/i);
  });
});
