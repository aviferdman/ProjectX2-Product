import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

import { scaffoldProject } from '../../src/commands/scaffold.js';
import { getTemplate, TEMPLATE_NAMES } from '../../src/commands/templates.js';
import { formatScaffoldResult } from '../../src/commands/init.js';
import type { ScaffoldResult } from '../../src/commands/scaffold.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates and returns a unique temp directory for test isolation. */
function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'crewspace-init-test-'));
}

/** Recursively removes a directory tree. */
function cleanDir(dir: string): void {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// Tests — templates
// ---------------------------------------------------------------------------

describe('getTemplate', () => {
  it('should return a Map for the "default" template', () => {
    const tpl = getTemplate('default', 'my-app');
    expect(tpl).toBeInstanceOf(Map);
    expect(tpl.size).toBeGreaterThan(0);
  });

  it('should return a Map for the "minimal" template', () => {
    const tpl = getTemplate('minimal', 'my-app');
    expect(tpl).toBeInstanceOf(Map);
    expect(tpl.size).toBeGreaterThan(0);
  });

  it('default template should include expected files', () => {
    const tpl = getTemplate('default', 'test-project');
    expect(tpl.has('package.json')).toBe(true);
    expect(tpl.has('tsconfig.json')).toBe(true);
    expect(tpl.has('crewspace.config.ts')).toBe(true);
    expect(tpl.has('src/index.ts')).toBe(true);
    expect(tpl.has('.gitignore')).toBe(true);
  });

  it('minimal template should include expected files', () => {
    const tpl = getTemplate('minimal', 'test-project');
    expect(tpl.has('package.json')).toBe(true);
    expect(tpl.has('tsconfig.json')).toBe(true);
    expect(tpl.has('src/index.ts')).toBe(true);
  });

  it('minimal template should NOT include config or gitignore', () => {
    const tpl = getTemplate('minimal', 'test-project');
    expect(tpl.has('crewspace.config.ts')).toBe(false);
    expect(tpl.has('.gitignore')).toBe(false);
  });

  it('should embed the project name in package.json', () => {
    const tpl = getTemplate('default', 'cool-project');
    const pkgJson = JSON.parse(tpl.get('package.json')!);
    expect(pkgJson.name).toBe('cool-project');
  });

  it('default package.json should include @crewspace/core dependency', () => {
    const tpl = getTemplate('default', 'test-project');
    const pkgJson = JSON.parse(tpl.get('package.json')!);
    expect(pkgJson.dependencies['@crewspace/core']).toBeDefined();
  });

  it('should throw on unknown template name', () => {
    expect(() => getTemplate('nonexistent', 'x')).toThrow('Unknown template "nonexistent"');
  });
});

describe('TEMPLATE_NAMES', () => {
  it('should contain "default" and "minimal"', () => {
    expect(TEMPLATE_NAMES).toContain('default');
    expect(TEMPLATE_NAMES).toContain('minimal');
  });
});

// ---------------------------------------------------------------------------
// Tests — scaffoldProject
// ---------------------------------------------------------------------------

describe('scaffoldProject', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    cleanDir(tmpDir);
  });

  it('should create a new project directory and write files', () => {
    const projectDir = path.join(tmpDir, 'my-project');
    const result = scaffoldProject({ directory: projectDir, template: 'default', force: false });

    expect(result.projectDir).toBe(path.resolve(projectDir));
    expect(result.template).toBe('default');
    expect(result.filesCreated.length).toBeGreaterThan(0);
    expect(result.filesSkipped).toHaveLength(0);

    // Verify files on disk
    expect(fs.existsSync(path.join(projectDir, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'tsconfig.json'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'crewspace.config.ts'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'src', 'index.ts'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, '.gitignore'))).toBe(true);
  });

  it('should use the directory name as the project name in package.json', () => {
    const projectDir = path.join(tmpDir, 'awesome-app');
    scaffoldProject({ directory: projectDir, template: 'default', force: false });

    const pkgJson = JSON.parse(fs.readFileSync(path.join(projectDir, 'package.json'), 'utf-8'));
    expect(pkgJson.name).toBe('awesome-app');
  });

  it('should scaffold into an existing empty directory', () => {
    const projectDir = path.join(tmpDir, 'existing');
    fs.mkdirSync(projectDir);

    const result = scaffoldProject({ directory: projectDir, template: 'default', force: false });
    expect(result.filesCreated.length).toBeGreaterThan(0);
  });

  it('should skip existing files without --force', () => {
    const projectDir = path.join(tmpDir, 'has-pkg');
    fs.mkdirSync(projectDir, { recursive: true });
    fs.writeFileSync(path.join(projectDir, 'package.json'), '{"existing":true}\n', 'utf-8');

    const result = scaffoldProject({ directory: projectDir, template: 'default', force: false });

    expect(result.filesSkipped).toContain('package.json');
    // The existing content should be preserved
    const content = fs.readFileSync(path.join(projectDir, 'package.json'), 'utf-8');
    expect(content).toContain('"existing"');
  });

  it('should overwrite existing files with --force', () => {
    const projectDir = path.join(tmpDir, 'force-overwrite');
    fs.mkdirSync(projectDir, { recursive: true });
    fs.writeFileSync(path.join(projectDir, 'package.json'), '{"existing":true}\n', 'utf-8');

    const result = scaffoldProject({ directory: projectDir, template: 'default', force: true });

    expect(result.filesCreated).toContain('package.json');
    expect(result.filesSkipped).toHaveLength(0);
    // Content should now be the template version
    const content = fs.readFileSync(path.join(projectDir, 'package.json'), 'utf-8');
    expect(content).not.toContain('"existing"');
  });

  it('should scaffold with the minimal template', () => {
    const projectDir = path.join(tmpDir, 'minimal-proj');
    const result = scaffoldProject({ directory: projectDir, template: 'minimal', force: false });

    expect(result.template).toBe('minimal');
    expect(result.filesCreated).toContain('package.json');
    expect(result.filesCreated).toContain('tsconfig.json');
    expect(result.filesCreated).toContain('src/index.ts');
    // Minimal should not create config or gitignore
    expect(result.filesCreated).not.toContain('crewspace.config.ts');
    expect(result.filesCreated).not.toContain('.gitignore');
  });

  it('should throw on unknown template', () => {
    const projectDir = path.join(tmpDir, 'bad-template');
    expect(() =>
      scaffoldProject({ directory: projectDir, template: 'nonexistent', force: false }),
    ).toThrow('Unknown template "nonexistent"');
  });

  it('should throw if target path is a file', () => {
    const filePath = path.join(tmpDir, 'not-a-dir');
    fs.writeFileSync(filePath, 'data', 'utf-8');

    expect(() =>
      scaffoldProject({ directory: filePath, template: 'default', force: false }),
    ).toThrow('is not a directory');
  });

  it('should create nested subdirectories for template files', () => {
    const projectDir = path.join(tmpDir, 'nested-test');
    scaffoldProject({ directory: projectDir, template: 'default', force: false });

    expect(fs.existsSync(path.join(projectDir, 'src'))).toBe(true);
    expect(fs.statSync(path.join(projectDir, 'src')).isDirectory()).toBe(true);
  });

  it('should produce valid JSON in generated package.json', () => {
    const projectDir = path.join(tmpDir, 'valid-json');
    scaffoldProject({ directory: projectDir, template: 'default', force: false });

    const raw = fs.readFileSync(path.join(projectDir, 'package.json'), 'utf-8');
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it('should produce valid JSON in generated tsconfig.json', () => {
    const projectDir = path.join(tmpDir, 'valid-tsconfig');
    scaffoldProject({ directory: projectDir, template: 'default', force: false });

    const raw = fs.readFileSync(path.join(projectDir, 'tsconfig.json'), 'utf-8');
    expect(() => JSON.parse(raw)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Tests — formatScaffoldResult
// ---------------------------------------------------------------------------

describe('formatScaffoldResult', () => {
  it('should include the project directory', () => {
    const result: ScaffoldResult = {
      projectDir: '/home/user/my-project',
      filesCreated: ['package.json', 'src/index.ts'],
      filesSkipped: [],
      template: 'default',
    };
    const output = formatScaffoldResult(result);
    expect(output).toContain('/home/user/my-project');
  });

  it('should list created files', () => {
    const result: ScaffoldResult = {
      projectDir: '/tmp/test',
      filesCreated: ['package.json', 'tsconfig.json'],
      filesSkipped: [],
      template: 'default',
    };
    const output = formatScaffoldResult(result);
    expect(output).toContain('+ package.json');
    expect(output).toContain('+ tsconfig.json');
  });

  it('should list skipped files', () => {
    const result: ScaffoldResult = {
      projectDir: '/tmp/test',
      filesCreated: ['tsconfig.json'],
      filesSkipped: ['package.json'],
      template: 'default',
    };
    const output = formatScaffoldResult(result);
    expect(output).toContain('- package.json');
    expect(output).toContain('skipped');
  });

  it('should include next steps', () => {
    const result: ScaffoldResult = {
      projectDir: '/tmp/test',
      filesCreated: ['package.json'],
      filesSkipped: [],
      template: 'default',
    };
    const output = formatScaffoldResult(result);
    expect(output).toContain('npm install');
    expect(output).toContain('npm start');
  });

  it('should display the template name', () => {
    const result: ScaffoldResult = {
      projectDir: '/tmp/test',
      filesCreated: [],
      filesSkipped: [],
      template: 'minimal',
    };
    const output = formatScaffoldResult(result);
    expect(output).toContain('minimal');
  });
});

// ---------------------------------------------------------------------------
// Tests — CLI integration (Commander parsing)
// ---------------------------------------------------------------------------

describe('init command integration', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    cleanDir(tmpDir);
  });

  it('should scaffold via Commander parse with directory argument', async () => {
    // Dynamically import to avoid circular issues
    const { createProgram } = await import('../../src/program.js');
    const program = createProgram();
    program.exitOverride();

    const projectDir = path.join(tmpDir, 'cli-test');
    await program.parseAsync(['init', projectDir], { from: 'user' });

    expect(fs.existsSync(path.join(projectDir, 'package.json'))).toBe(true);
  });

  it('should scaffold with --template minimal via Commander', async () => {
    const { createProgram } = await import('../../src/program.js');
    const program = createProgram();
    program.exitOverride();

    const projectDir = path.join(tmpDir, 'cli-minimal');
    await program.parseAsync(['init', '--template', 'minimal', projectDir], { from: 'user' });

    expect(fs.existsSync(path.join(projectDir, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'crewspace.config.ts'))).toBe(false);
  });

  it('should scaffold with --force via Commander', async () => {
    const { createProgram } = await import('../../src/program.js');
    const program = createProgram();
    program.exitOverride();

    const projectDir = path.join(tmpDir, 'cli-force');
    fs.mkdirSync(projectDir, { recursive: true });
    fs.writeFileSync(path.join(projectDir, 'package.json'), '{"old":true}\n', 'utf-8');

    await program.parseAsync(['init', '--force', projectDir], { from: 'user' });

    const content = fs.readFileSync(path.join(projectDir, 'package.json'), 'utf-8');
    expect(content).not.toContain('"old"');
  });
});
