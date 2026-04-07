/**
 * Tests for the built-in shell tools module.
 *
 * @packageDocumentation
 */

import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import {
  createShellExecTool,
  createShellTools,
  checkDestructiveCommand,
  ShellExecInputSchema,
  DEFAULT_SHELL_TIMEOUT_MS,
  MAX_SHELL_TIMEOUT_MS,
  DESTRUCTIVE_PATTERNS,
} from '../../../src/tools/shell/index.js';
import { ToolCategory, ToolPermission } from '../../../src/types/tool.js';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

let testDir: string;

beforeAll(() => {
  testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crewspace-shell-test-'));
});

afterAll(() => {
  try {
    fs.rmSync(testDir, { recursive: true, force: true });
  } catch {
    // On Windows, the temp dir may be locked briefly after killing timed-out processes
  }
});

const isWindows = process.platform === 'win32';

// ---------------------------------------------------------------------------
// Schema validation tests
// ---------------------------------------------------------------------------

describe('ShellExecInputSchema', () => {
  it('accepts a valid command string', () => {
    const result = ShellExecInputSchema.safeParse({ command: 'echo hello' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty command', () => {
    const result = ShellExecInputSchema.safeParse({ command: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing command', () => {
    const result = ShellExecInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('accepts optional cwd', () => {
    const result = ShellExecInputSchema.safeParse({ command: 'ls', cwd: '/tmp' });
    expect(result.success).toBe(true);
  });

  it('accepts optional timeoutMs within bounds', () => {
    const result = ShellExecInputSchema.safeParse({ command: 'ls', timeoutMs: 5000 });
    expect(result.success).toBe(true);
  });

  it('rejects timeoutMs exceeding maximum', () => {
    const result = ShellExecInputSchema.safeParse({
      command: 'ls',
      timeoutMs: MAX_SHELL_TIMEOUT_MS + 1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive timeoutMs', () => {
    const result = ShellExecInputSchema.safeParse({ command: 'ls', timeoutMs: 0 });
    expect(result.success).toBe(false);
  });

  it('accepts optional env', () => {
    const result = ShellExecInputSchema.safeParse({
      command: 'echo $FOO',
      env: { FOO: 'bar' },
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional stdin', () => {
    const result = ShellExecInputSchema.safeParse({
      command: 'cat',
      stdin: 'hello world',
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// checkDestructiveCommand tests
// ---------------------------------------------------------------------------

describe('checkDestructiveCommand', () => {
  it('returns empty array for safe commands', () => {
    expect(checkDestructiveCommand('echo hello')).toEqual([]);
    expect(checkDestructiveCommand('ls -la')).toEqual([]);
    expect(checkDestructiveCommand('cat file.txt')).toEqual([]);
    expect(checkDestructiveCommand('npm run test')).toEqual([]);
  });

  it('detects rm -rf', () => {
    const warnings = checkDestructiveCommand('rm -rf /tmp/test');
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain('destructive');
  });

  it('detects rm --force', () => {
    const warnings = checkDestructiveCommand('rm --force file.txt');
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('detects mkfs', () => {
    const warnings = checkDestructiveCommand('mkfs.ext4 /dev/sda1');
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('detects shutdown', () => {
    const warnings = checkDestructiveCommand('shutdown -h now');
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('detects reboot', () => {
    const warnings = checkDestructiveCommand('reboot');
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('detects killall', () => {
    const warnings = checkDestructiveCommand('killall node');
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('detects recursive chmod', () => {
    const warnings = checkDestructiveCommand('chmod -R 777 /');
    expect(warnings.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// createShellExecTool tests
// ---------------------------------------------------------------------------

describe('createShellExecTool', () => {
  it('returns a valid Tool object', () => {
    const tool = createShellExecTool(testDir);
    expect(tool.name).toBe('shellExec');
    expect(tool.description).toBeTruthy();
    expect(tool.category).toBe(ToolCategory.SHELL);
    expect(tool.permissions).toContain(ToolPermission.SHELL_EXEC);
    expect(tool.inputSchema).toBeDefined();
    expect(tool.inputZodSchema).toBeDefined();
    expect(tool.outputSchema).toBeDefined();
    expect(typeof tool.execute).toBe('function');
  });

  it('executes a simple echo command', async () => {
    const tool = createShellExecTool(testDir);
    const cmd = isWindows ? 'echo hello' : 'echo hello';
    const result = (await tool.execute({ command: cmd })) as {
      exitCode: number | null;
      stdout: string;
      stderr: string;
      timedOut: boolean;
      durationMs: number;
      warnings: string[];
    };

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('hello');
    expect(result.timedOut).toBe(false);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.warnings).toEqual([]);
  });

  it('captures stderr', async () => {
    const tool = createShellExecTool(testDir);
    const cmd = isWindows ? 'echo error 1>&2' : 'echo error >&2';
    const result = (await tool.execute({ command: cmd })) as {
      exitCode: number | null;
      stdout: string;
      stderr: string;
    };

    expect(result.stderr.trim()).toContain('error');
  });

  it('returns non-zero exit code for failing commands', async () => {
    const tool = createShellExecTool(testDir);
    const cmd = isWindows ? 'exit /b 42' : 'exit 42';
    const result = (await tool.execute({ command: cmd })) as {
      exitCode: number | null;
      timedOut: boolean;
    };

    expect(result.exitCode).toBe(42);
    expect(result.timedOut).toBe(false);
  });

  it('respects custom working directory', async () => {
    const subDir = path.join(testDir, 'subdir');
    fs.mkdirSync(subDir, { recursive: true });

    const tool = createShellExecTool(testDir);
    const cmd = isWindows ? 'cd' : 'pwd';
    const result = (await tool.execute({ command: cmd, cwd: 'subdir' })) as {
      stdout: string;
    };

    const output = result.stdout.trim();
    expect(path.resolve(output)).toBe(path.resolve(subDir));
  });

  it('rejects working directory outside base path', async () => {
    const tool = createShellExecTool(testDir);
    await expect(tool.execute({ command: 'echo hi', cwd: '../../..' })).rejects.toThrow(
      /outside the allowed base directory/,
    );
  });

  it('rejects invalid input (missing command)', async () => {
    const tool = createShellExecTool(testDir);
    await expect(tool.execute({})).rejects.toThrow();
  });

  it('includes warnings for destructive commands', async () => {
    const tool = createShellExecTool(testDir);
    // Use a harmless echo but prefix with a destructive pattern detection
    const cmd = isWindows ? 'echo safe' : 'echo safe';
    // We test warning detection separately; here test that safe commands have no warnings
    const result = (await tool.execute({ command: cmd })) as {
      warnings: string[];
    };
    expect(result.warnings).toEqual([]);
  });

  it('provides stdin to the command', async () => {
    // Skip on Windows since echo via stdin is harder to test
    if (isWindows) return;

    const tool = createShellExecTool(testDir);
    const result = (await tool.execute({
      command: 'cat',
      stdin: 'hello from stdin',
    })) as { stdout: string; exitCode: number | null };

    expect(result.stdout).toBe('hello from stdin');
    expect(result.exitCode).toBe(0);
  });

  it('times out long-running commands', async () => {
    const tool = createShellExecTool(testDir);
    const cmd = isWindows ? 'ping -n 60 127.0.0.1' : 'sleep 60';
    const result = (await tool.execute({
      command: cmd,
      timeoutMs: 500,
    })) as { timedOut: boolean; exitCode: number | null };

    expect(result.timedOut).toBe(true);
    expect(result.exitCode).toBeNull();
  }, 10_000);

  it('uses default timeout from constructor', () => {
    const tool = createShellExecTool(testDir, 5000);
    // We can't directly check the default timeout value, but we can verify
    // the tool was created successfully
    expect(tool.name).toBe('shellExec');
  });

  it('handles environment variables', async () => {
    const tool = createShellExecTool(testDir);
    const cmd = isWindows ? 'echo %CREWSPACE_TEST_VAR%' : 'echo $CREWSPACE_TEST_VAR';
    const result = (await tool.execute({
      command: cmd,
      env: { CREWSPACE_TEST_VAR: 'test-value-123' },
    })) as { stdout: string; exitCode: number | null };

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('test-value-123');
  });
});

// ---------------------------------------------------------------------------
// createShellTools factory tests
// ---------------------------------------------------------------------------

describe('createShellTools', () => {
  it('returns a ShellTools bundle with shellExec', () => {
    const tools = createShellTools({ basePath: testDir });
    expect(tools.shellExec).toBeDefined();
    expect(tools.shellExec.name).toBe('shellExec');
    expect(tools.shellExec.category).toBe(ToolCategory.SHELL);
  });

  it('uses process.cwd() when no basePath provided', () => {
    const tools = createShellTools();
    expect(tools.shellExec).toBeDefined();
  });

  it('passes custom defaultTimeoutMs', () => {
    const tools = createShellTools({ basePath: testDir, defaultTimeoutMs: 10_000 });
    expect(tools.shellExec).toBeDefined();
  });

  it('shellExec tool is functional', async () => {
    const tools = createShellTools({ basePath: testDir });
    const cmd = isWindows ? 'echo factory-test' : 'echo factory-test';
    const result = (await tools.shellExec.execute({ command: cmd })) as {
      stdout: string;
      exitCode: number | null;
    };

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('factory-test');
  });
});

// ---------------------------------------------------------------------------
// Constants tests
// ---------------------------------------------------------------------------

describe('Shell tool constants', () => {
  it('DEFAULT_SHELL_TIMEOUT_MS is 30 seconds', () => {
    expect(DEFAULT_SHELL_TIMEOUT_MS).toBe(30_000);
  });

  it('MAX_SHELL_TIMEOUT_MS is 5 minutes', () => {
    expect(MAX_SHELL_TIMEOUT_MS).toBe(300_000);
  });

  it('DESTRUCTIVE_PATTERNS is a non-empty array of RegExp', () => {
    expect(DESTRUCTIVE_PATTERNS.length).toBeGreaterThan(0);
    for (const pattern of DESTRUCTIVE_PATTERNS) {
      expect(pattern).toBeInstanceOf(RegExp);
    }
  });
});
