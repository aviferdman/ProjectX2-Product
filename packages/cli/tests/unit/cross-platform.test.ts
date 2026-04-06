/**
 * Cross-platform CLI tests.
 *
 * Verifies that CLI functionality works correctly on Windows, macOS, and Linux.
 * These tests focus on platform-specific concerns: path handling, temp directories,
 * file operations, line endings, and process spawning.
 *
 * @see TASK-060
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

import { resolveConfigPath, resolveLogLevel } from '../../src/options.js';
import { createProgram } from '../../src/program.js';
import { scaffoldProject } from '../../src/commands/scaffold.js';
import {
  resolveWorkflowFile,
  getRunCommand,
  executeWorkflow,
} from '../../src/commands/runner.js';
import { validateWorkflowFile } from '../../src/commands/validator.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'crewspace-xplat-'));
}

function cleanDir(dir: string): void {
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // On Windows, processes may still lock files briefly
    }
  }
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  const parentDir = path.dirname(filePath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

const isWindows = process.platform === 'win32';

// ---------------------------------------------------------------------------
// Path handling
// ---------------------------------------------------------------------------

describe('cross-platform: path handling', () => {
  it('resolveConfigPath should use platform path separator', () => {
    const cwd = os.tmpdir();
    const result = resolveConfigPath(undefined, cwd);
    expect(result).toBe(path.join(cwd, 'crewspace.config.ts'));
    // The path must use the native separator, not hardcoded "/"
    expect(result).toContain(path.sep);
  });

  it('resolveConfigPath should return custom path as-is', () => {
    expect(resolveConfigPath('my.config.ts', os.tmpdir())).toBe('my.config.ts');
  });

  it('resolveConfigPath should handle cwd with trailing separator', () => {
    const cwd = os.tmpdir() + path.sep;
    const result = resolveConfigPath(undefined, cwd);
    // path.join normalizes trailing separators
    expect(result).toBe(path.join(cwd, 'crewspace.config.ts'));
  });
});

// ---------------------------------------------------------------------------
// Temp directory and file operations
// ---------------------------------------------------------------------------

describe('cross-platform: temp directory operations', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    cleanDir(tmpDir);
  });

  it('should create temp directory in platform temp location', () => {
    expect(fs.existsSync(tmpDir)).toBe(true);
    expect(fs.statSync(tmpDir).isDirectory()).toBe(true);
    // The temp dir should be under os.tmpdir()
    const normalized = path.resolve(tmpDir);
    expect(normalized.startsWith(path.resolve(os.tmpdir()))).toBe(true);
  });

  it('should write and read files with platform line endings', () => {
    const content = 'line1\nline2\nline3\n';
    const filePath = writeFile(tmpDir, 'test.txt', content);
    const read = fs.readFileSync(filePath, 'utf-8');
    expect(read).toBe(content);
  });

  it('should create nested directories with path.join', () => {
    const nested = path.join(tmpDir, 'a', 'b', 'c');
    fs.mkdirSync(nested, { recursive: true });
    expect(fs.existsSync(nested)).toBe(true);
    expect(fs.statSync(nested).isDirectory()).toBe(true);
  });

  it('should handle spaces in directory names', () => {
    const dirWithSpaces = path.join(tmpDir, 'my project');
    fs.mkdirSync(dirWithSpaces);
    expect(fs.existsSync(dirWithSpaces)).toBe(true);
  });

  it('should handle special characters in directory names', () => {
    const dirName = 'project-name_v2.0';
    const dir = path.join(tmpDir, dirName);
    fs.mkdirSync(dir);
    expect(fs.existsSync(dir)).toBe(true);
    expect(path.basename(dir)).toBe(dirName);
  });
});

// ---------------------------------------------------------------------------
// Scaffold cross-platform
// ---------------------------------------------------------------------------

describe('cross-platform: scaffoldProject', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    cleanDir(tmpDir);
  });

  it('should scaffold into a platform temp directory', () => {
    const projectDir = path.join(tmpDir, 'my-project');
    const result = scaffoldProject({ directory: projectDir, template: 'default', force: false });

    expect(result.projectDir).toBe(path.resolve(projectDir));
    expect(fs.existsSync(path.join(projectDir, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'src', 'index.ts'))).toBe(true);
  });

  it('should scaffold into a directory with spaces', () => {
    const projectDir = path.join(tmpDir, 'my cool project');
    const result = scaffoldProject({ directory: projectDir, template: 'minimal', force: false });

    expect(result.projectDir).toBe(path.resolve(projectDir));
    expect(fs.existsSync(path.join(projectDir, 'package.json'))).toBe(true);
  });

  it('should produce valid package.json with correct name from path', () => {
    const projectDir = path.join(tmpDir, 'cross-plat-test');
    scaffoldProject({ directory: projectDir, template: 'default', force: false });

    const pkgJson = JSON.parse(fs.readFileSync(path.join(projectDir, 'package.json'), 'utf-8'));
    expect(pkgJson.name).toBe('cross-plat-test');
  });

  it('should use path.resolve for projectDir in result', () => {
    const projectDir = path.join(tmpDir, 'resolved-test');
    const result = scaffoldProject({ directory: projectDir, template: 'default', force: false });

    expect(path.isAbsolute(result.projectDir)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Workflow file resolution cross-platform
// ---------------------------------------------------------------------------

describe('cross-platform: resolveWorkflowFile', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    cleanDir(tmpDir);
  });

  it('should resolve a relative path using platform cwd', () => {
    writeFile(tmpDir, 'workflow.ts', 'console.log("hello")');
    const resolved = resolveWorkflowFile('workflow.ts', tmpDir);
    expect(resolved).toBe(path.join(tmpDir, 'workflow.ts'));
    expect(path.isAbsolute(resolved)).toBe(true);
  });

  it('should resolve a file in a nested directory', () => {
    writeFile(tmpDir, path.join('src', 'workflow.ts'), 'console.log("hello")');
    const resolved = resolveWorkflowFile(path.join('src', 'workflow.ts'), tmpDir);
    expect(resolved).toBe(path.join(tmpDir, 'src', 'workflow.ts'));
  });

  it('should resolve an absolute path regardless of cwd', () => {
    const filePath = writeFile(tmpDir, 'abs.ts', 'console.log("hello")');
    const resolved = resolveWorkflowFile(filePath, path.join(tmpDir, 'other'));
    expect(resolved).toBe(filePath);
  });

  it('should handle paths with spaces', () => {
    const subDir = path.join(tmpDir, 'my dir');
    fs.mkdirSync(subDir);
    writeFile(subDir, 'workflow.ts', 'console.log("hello")');
    const resolved = resolveWorkflowFile('workflow.ts', subDir);
    expect(resolved).toBe(path.join(subDir, 'workflow.ts'));
  });

  it('should throw for non-existent file with platform path in error', () => {
    expect(() => resolveWorkflowFile('nonexistent.ts', tmpDir)).toThrow('Workflow file not found');
  });
});

// ---------------------------------------------------------------------------
// getRunCommand cross-platform
// ---------------------------------------------------------------------------

describe('cross-platform: getRunCommand', () => {
  it('should handle platform-specific path separators', () => {
    const filePath = path.join('home', 'user', 'project', 'workflow.ts');
    const result = getRunCommand(filePath);
    expect(result.command).toBe('tsx');
    expect(result.args[0]).toBe(filePath);
  });

  it('should handle absolute paths on the current platform', () => {
    const filePath = isWindows
      ? 'C:\\Users\\user\\project\\workflow.js'
      : '/home/user/project/workflow.js';
    const result = getRunCommand(filePath);
    expect(result.command).toBe('node');
    expect(result.args[0]).toBe(filePath);
  });
});

// ---------------------------------------------------------------------------
// Workflow execution cross-platform
// ---------------------------------------------------------------------------

describe('cross-platform: executeWorkflow', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    cleanDir(tmpDir);
  });

  it('should execute a .js file in platform temp directory', async () => {
    writeFile(tmpDir, 'ok.js', 'process.exit(0);');
    const result = await executeWorkflow({ file: 'ok.js', cwd: tmpDir });

    expect(result.exitCode).toBe(0);
    expect(result.timedOut).toBe(false);
    expect(result.file).toBe(path.join(tmpDir, 'ok.js'));
  });

  it('should handle non-zero exit codes', async () => {
    writeFile(tmpDir, 'fail.js', 'process.exit(1);');
    const result = await executeWorkflow({ file: 'fail.js', cwd: tmpDir });

    expect(result.exitCode).toBe(1);
  });

  it('should handle process output with platform line endings', async () => {
    writeFile(tmpDir, 'output.js', 'console.log("hello world"); process.exit(0);');
    const result = await executeWorkflow({ file: 'output.js', cwd: tmpDir });

    expect(result.exitCode).toBe(0);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('should execute in a directory with spaces', async () => {
    const spacedDir = path.join(tmpDir, 'my project');
    fs.mkdirSync(spacedDir);
    writeFile(spacedDir, 'run.js', 'process.exit(0);');
    const result = await executeWorkflow({ file: 'run.js', cwd: spacedDir });

    expect(result.exitCode).toBe(0);
  });

  it('should enforce timeout on the current platform', async () => {
    writeFile(tmpDir, 'slow.js', 'setTimeout(() => process.exit(0), 30000);');
    const result = await executeWorkflow({
      file: 'slow.js',
      cwd: tmpDir,
      timeout: 200,
    });

    expect(result.timedOut).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Validate workflow cross-platform
// ---------------------------------------------------------------------------

describe('cross-platform: validateWorkflowFile', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    cleanDir(tmpDir);
  });

  it('should validate a file in platform temp directory', () => {
    const workflow = `
import { Agent } from '@crewspace/core';
const agent = new Agent({ id: 'a', role: 'R', goal: 'G' });
`;
    writeFile(tmpDir, 'valid.ts', workflow);
    const result = validateWorkflowFile({ file: 'valid.ts', cwd: tmpDir });

    expect(result.valid).toBe(true);
    expect(path.isAbsolute(result.file)).toBe(true);
    expect(result.file).toBe(path.join(tmpDir, 'valid.ts'));
  });

  it('should return absolute platform path for resolved file', () => {
    const workflow = `
import { Agent } from '@crewspace/core';
const agent = new Agent({ id: 'a', role: 'R', goal: 'G' });
`;
    writeFile(tmpDir, 'abs.ts', workflow);
    const result = validateWorkflowFile({ file: 'abs.ts', cwd: tmpDir });

    if (isWindows) {
      expect(result.file).toMatch(/^[A-Z]:\\/);
    } else {
      expect(result.file).toMatch(/^\//);
    }
  });

  it('should handle CRLF line endings in workflow files', () => {
    const workflow =
      "import { Agent } from '@crewspace/core';\r\n" +
      "const agent = new Agent({ id: 'a', role: 'R', goal: 'G' });\r\n";
    writeFile(tmpDir, 'crlf.ts', workflow);
    const result = validateWorkflowFile({ file: 'crlf.ts', cwd: tmpDir });

    expect(result.valid).toBe(true);
  });

  it('should handle LF line endings in workflow files', () => {
    const workflow =
      "import { Agent } from '@crewspace/core';\n" +
      "const agent = new Agent({ id: 'a', role: 'R', goal: 'G' });\n";
    writeFile(tmpDir, 'lf.ts', workflow);
    const result = validateWorkflowFile({ file: 'lf.ts', cwd: tmpDir });

    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// CLI program cross-platform
// ---------------------------------------------------------------------------

describe('cross-platform: CLI program', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    cleanDir(tmpDir);
  });

  it('should parse --cwd with platform-specific path', async () => {
    const program = createProgram();
    program.exitOverride();

    const projectDir = path.join(tmpDir, 'cli-project');
    await program.parseAsync(['init', projectDir], { from: 'user' });

    expect(fs.existsSync(path.join(projectDir, 'package.json'))).toBe(true);
  });

  it('should parse init with directory containing spaces', async () => {
    const program = createProgram();
    program.exitOverride();

    const projectDir = path.join(tmpDir, 'my cool project');
    await program.parseAsync(['init', projectDir], { from: 'user' });

    expect(fs.existsSync(path.join(projectDir, 'package.json'))).toBe(true);
  });

  it('should handle --cwd option with platform path', async () => {
    const program = createProgram();
    program.exitOverride();

    await program.parseAsync(['--cwd', tmpDir, 'init', path.join(tmpDir, 'sub')], {
      from: 'user',
    });

    expect(program.opts()['cwd']).toBe(tmpDir);
  });
});

// ---------------------------------------------------------------------------
// Platform detection and environment
// ---------------------------------------------------------------------------

describe('cross-platform: environment', () => {
  it('should detect a valid platform', () => {
    expect(['win32', 'darwin', 'linux']).toContain(process.platform);
  });

  it('should have a valid os.tmpdir()', () => {
    const tmp = os.tmpdir();
    expect(tmp).toBeTruthy();
    expect(fs.existsSync(tmp)).toBe(true);
  });

  it('should have a valid path.sep', () => {
    if (isWindows) {
      expect(path.sep).toBe('\\');
    } else {
      expect(path.sep).toBe('/');
    }
  });

  it('should resolve paths consistently', () => {
    const resolved = path.resolve('packages', 'cli', 'src');
    expect(path.isAbsolute(resolved)).toBe(true);
  });
});
