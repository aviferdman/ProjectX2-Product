import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

import {
  resolveWorkflowFile,
  getRunCommand,
  parseTimeout,
  executeWorkflow,
  SUPPORTED_EXTENSIONS,
} from '../../src/commands/runner.js';
import { createProgram } from '../../src/program.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'crewspace-run-test-'));
}

function cleanDir(dir: string): void {
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // On Windows, killed processes may still lock files briefly — ignore cleanup errors
    }
  }
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

// ---------------------------------------------------------------------------
// Tests — SUPPORTED_EXTENSIONS
// ---------------------------------------------------------------------------

describe('SUPPORTED_EXTENSIONS', () => {
  it('should include .ts, .mts, .js, and .mjs', () => {
    expect(SUPPORTED_EXTENSIONS).toContain('.ts');
    expect(SUPPORTED_EXTENSIONS).toContain('.mts');
    expect(SUPPORTED_EXTENSIONS).toContain('.js');
    expect(SUPPORTED_EXTENSIONS).toContain('.mjs');
  });
});

// ---------------------------------------------------------------------------
// Tests — resolveWorkflowFile
// ---------------------------------------------------------------------------

describe('resolveWorkflowFile', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    cleanDir(tmpDir);
  });

  it('should resolve an existing .ts file', () => {
    const filePath = writeFile(tmpDir, 'workflow.ts', 'console.log("hi")');
    const resolved = resolveWorkflowFile('workflow.ts', tmpDir);
    expect(resolved).toBe(filePath);
  });

  it('should resolve an existing .js file', () => {
    const filePath = writeFile(tmpDir, 'workflow.js', 'console.log("hi")');
    const resolved = resolveWorkflowFile('workflow.js', tmpDir);
    expect(resolved).toBe(filePath);
  });

  it('should resolve an existing .mts file', () => {
    const filePath = writeFile(tmpDir, 'workflow.mts', 'console.log("hi")');
    const resolved = resolveWorkflowFile('workflow.mts', tmpDir);
    expect(resolved).toBe(filePath);
  });

  it('should resolve an existing .mjs file', () => {
    const filePath = writeFile(tmpDir, 'workflow.mjs', 'console.log("hi")');
    const resolved = resolveWorkflowFile('workflow.mjs', tmpDir);
    expect(resolved).toBe(filePath);
  });

  it('should resolve an absolute path', () => {
    const filePath = writeFile(tmpDir, 'absolute.ts', 'console.log("hi")');
    const resolved = resolveWorkflowFile(filePath, '/some/other/dir');
    expect(resolved).toBe(filePath);
  });

  it('should throw if the file does not exist', () => {
    expect(() => resolveWorkflowFile('nonexistent.ts', tmpDir)).toThrow('Workflow file not found');
  });

  it('should throw if the path is a directory', () => {
    const subDir = path.join(tmpDir, 'subdir');
    fs.mkdirSync(subDir);
    expect(() => resolveWorkflowFile('subdir', tmpDir)).toThrow('Not a file');
  });

  it('should throw on unsupported extension', () => {
    writeFile(tmpDir, 'workflow.py', 'print("hi")');
    expect(() => resolveWorkflowFile('workflow.py', tmpDir)).toThrow(
      'Unsupported file extension ".py"',
    );
  });

  it('should throw on file with no extension', () => {
    writeFile(tmpDir, 'Makefile', 'all:');
    expect(() => resolveWorkflowFile('Makefile', tmpDir)).toThrow('Unsupported file extension');
  });
});

// ---------------------------------------------------------------------------
// Tests — getRunCommand
// ---------------------------------------------------------------------------

describe('getRunCommand', () => {
  it('should use tsx for .ts files', () => {
    const result = getRunCommand('/path/to/workflow.ts');
    expect(result.command).toBe('tsx');
    expect(result.args).toEqual(['/path/to/workflow.ts']);
  });

  it('should use tsx for .mts files', () => {
    const result = getRunCommand('/path/to/workflow.mts');
    expect(result.command).toBe('tsx');
    expect(result.args).toEqual(['/path/to/workflow.mts']);
  });

  it('should use node for .js files', () => {
    const result = getRunCommand('/path/to/workflow.js');
    expect(result.command).toBe('node');
    expect(result.args).toEqual(['/path/to/workflow.js']);
  });

  it('should use node for .mjs files', () => {
    const result = getRunCommand('/path/to/workflow.mjs');
    expect(result.command).toBe('node');
    expect(result.args).toEqual(['/path/to/workflow.mjs']);
  });

  it('should include the full file path in args', () => {
    const result = getRunCommand('/home/user/project/src/crew.ts');
    expect(result.args[0]).toBe('/home/user/project/src/crew.ts');
  });
});

// ---------------------------------------------------------------------------
// Tests — parseTimeout
// ---------------------------------------------------------------------------

describe('parseTimeout', () => {
  it('should return undefined for undefined input', () => {
    expect(parseTimeout(undefined)).toBeUndefined();
  });

  it('should parse a valid integer string', () => {
    expect(parseTimeout('5000')).toBe(5000);
  });

  it('should parse "1" as 1ms', () => {
    expect(parseTimeout('1')).toBe(1);
  });

  it('should throw on zero', () => {
    expect(() => parseTimeout('0')).toThrow('Invalid timeout "0"');
  });

  it('should throw on negative value', () => {
    expect(() => parseTimeout('-100')).toThrow('Invalid timeout "-100"');
  });

  it('should throw on non-numeric string', () => {
    expect(() => parseTimeout('abc')).toThrow('Invalid timeout "abc"');
  });

  it('should throw on float value', () => {
    expect(() => parseTimeout('3.14')).toThrow('Invalid timeout "3.14"');
  });

  it('should throw on empty string', () => {
    expect(() => parseTimeout('')).toThrow('Invalid timeout ""');
  });

  it('should throw on Infinity', () => {
    expect(() => parseTimeout('Infinity')).toThrow('Invalid timeout "Infinity"');
  });
});

// ---------------------------------------------------------------------------
// Tests — executeWorkflow (integration)
// ---------------------------------------------------------------------------

describe('executeWorkflow', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    cleanDir(tmpDir);
  });

  it('should execute a .js file successfully', async () => {
    writeFile(tmpDir, 'ok.js', 'process.exit(0);');
    const result = await executeWorkflow({ file: 'ok.js', cwd: tmpDir });

    expect(result.exitCode).toBe(0);
    expect(result.timedOut).toBe(false);
    expect(result.file).toBe(path.join(tmpDir, 'ok.js'));
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('should capture a non-zero exit code', async () => {
    writeFile(tmpDir, 'fail.js', 'process.exit(42);');
    const result = await executeWorkflow({ file: 'fail.js', cwd: tmpDir });

    expect(result.exitCode).toBe(42);
    expect(result.timedOut).toBe(false);
  });

  it('should report timedOut when process exceeds timeout', async () => {
    writeFile(tmpDir, 'slow.js', 'setTimeout(() => { process.exit(0); }, 30000);');
    const result = await executeWorkflow({
      file: 'slow.js',
      cwd: tmpDir,
      timeout: 200,
    });

    expect(result.timedOut).toBe(true);
  });

  it('should reject if file does not exist', async () => {
    await expect(executeWorkflow({ file: 'nope.js', cwd: tmpDir })).rejects.toThrow(
      'Workflow file not found',
    );
  });

  it('should reject on unsupported extension', async () => {
    writeFile(tmpDir, 'script.py', 'print("hi")');
    await expect(executeWorkflow({ file: 'script.py', cwd: tmpDir })).rejects.toThrow(
      'Unsupported file extension',
    );
  });

  it('should track duration in durationMs', async () => {
    writeFile(tmpDir, 'fast.js', 'process.exit(0);');
    const result = await executeWorkflow({ file: 'fast.js', cwd: tmpDir });

    expect(typeof result.durationMs).toBe('number');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// Tests — CLI integration (Commander parsing for `run`)
// ---------------------------------------------------------------------------

describe('run command integration', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    cleanDir(tmpDir);
  });

  it('should parse run command with file argument', async () => {
    const program = createProgram();
    program.exitOverride();

    const runCmd = program.commands.find((c) => c.name() === 'run')!;
    writeFile(tmpDir, 'workflow.js', 'process.exit(0);');

    await program.parseAsync(['run', '--cwd', tmpDir, path.join(tmpDir, 'workflow.js')], {
      from: 'user',
    });

    expect(runCmd.args).toContain(path.join(tmpDir, 'workflow.js'));
  });

  it('should exit with code 1 for non-existent file', async () => {
    const program = createProgram();
    program.exitOverride();

    const origExitCode = process.exitCode;
    await program.parseAsync(['run', 'missing-file.ts'], { from: 'user' });
    expect(process.exitCode).toBe(1);
    process.exitCode = origExitCode;
  });

  it('should exit with code 1 for unsupported extension', async () => {
    const program = createProgram();
    program.exitOverride();

    writeFile(tmpDir, 'bad.py', 'print("hi")');
    const origExitCode = process.exitCode;
    await program.parseAsync(['run', '--cwd', tmpDir, path.join(tmpDir, 'bad.py')], {
      from: 'user',
    });
    expect(process.exitCode).toBe(1);
    process.exitCode = origExitCode;
  });

  it('should propagate non-zero exit code from workflow', async () => {
    const program = createProgram();
    program.exitOverride();

    writeFile(tmpDir, 'fail.js', 'process.exit(3);');
    const origExitCode = process.exitCode;
    await program.parseAsync(['run', '--cwd', tmpDir, path.join(tmpDir, 'fail.js')], {
      from: 'user',
    });
    expect(process.exitCode).toBe(3);
    process.exitCode = origExitCode;
  });

  it('should parse --timeout option', () => {
    const program = createProgram();
    program.exitOverride();

    const runCmd = program.commands.find((c) => c.name() === 'run')!;
    // Just verify the option is registered
    const timeoutOpt = runCmd.options.find((o) => o.long === '--timeout');
    expect(timeoutOpt).toBeDefined();
  });

  it('should parse --watch option', () => {
    const program = createProgram();
    program.exitOverride();

    const runCmd = program.commands.find((c) => c.name() === 'run')!;
    const watchOpt = runCmd.options.find((o) => o.long === '--watch');
    expect(watchOpt).toBeDefined();
  });
});
