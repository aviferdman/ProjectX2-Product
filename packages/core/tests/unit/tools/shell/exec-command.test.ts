import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as childProcess from 'node:child_process';
import * as path from 'node:path';
import * as os from 'node:os';
import * as fs from 'node:fs';

import { createExecCommandTool } from '../../../../src/tools/shell/exec-command.js';
import { createShellTools } from '../../../../src/tools/shell/index.js';
import {
  DEFAULT_TIMEOUT_MS,
  DENIED_COMMANDS,
  MAX_OUTPUT_SIZE,
  MAX_TIMEOUT_MS,
} from '../../../../src/tools/shell/types.js';
import { ToolCategory, ToolPermission } from '../../../../src/types/tool.js';
import { ToolExecutionError } from '../../../../src/errors/tool-errors.js';

describe('ExecCommandTool', () => {
  let tmpDir: string;
  let tool: ReturnType<typeof createExecCommandTool>;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crewspace-shell-test-'));
    tool = createExecCommandTool(tmpDir);
  });

  afterEach(async () => {
    // On Windows, killed child processes may hold directory locks briefly
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        return;
      } catch {
        await new Promise((r) => setTimeout(r, 200));
      }
    }
  });

  // -----------------------------------------------------------------------
  // Tool metadata
  // -----------------------------------------------------------------------

  describe('tool metadata', () => {
    it('should have correct name', () => {
      expect(tool.name).toBe('execCommand');
    });

    it('should have a description', () => {
      expect(tool.description).toBeTruthy();
      expect(typeof tool.description).toBe('string');
    });

    it('should be in SHELL category', () => {
      expect(tool.category).toBe(ToolCategory.SHELL);
    });

    it('should require SHELL_EXEC permission', () => {
      expect(tool.permissions).toEqual([ToolPermission.SHELL_EXEC]);
    });

    it('should have input schema with required command field', () => {
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema!.type).toBe('object');
      expect(tool.inputSchema!.required).toContain('command');
    });

    it('should have output schema', () => {
      expect(tool.outputSchema).toBeDefined();
      expect(tool.outputSchema!.type).toBe('object');
    });
  });

  // -----------------------------------------------------------------------
  // Input validation
  // -----------------------------------------------------------------------

  describe('input validation', () => {
    it('should reject empty command', async () => {
      await expect(tool.execute({ command: '' })).rejects.toThrow(ToolExecutionError);
    });

    it('should reject non-string command', async () => {
      await expect(tool.execute({ command: 123 })).rejects.toThrow(ToolExecutionError);
    });

    it('should reject null command', async () => {
      await expect(tool.execute({ command: null })).rejects.toThrow(ToolExecutionError);
    });

    it('should reject undefined command', async () => {
      await expect(tool.execute({})).rejects.toThrow(ToolExecutionError);
    });
  });

  // -----------------------------------------------------------------------
  // Basic execution
  // -----------------------------------------------------------------------

  describe('basic execution', () => {
    it('should execute a simple echo command', async () => {
      const result = await tool.execute({ command: 'echo hello' }) as import('../../../../src/tools/shell/types.js').ExecCommandOutput;

      expect(result.stdout.trim()).toBe('hello');
      expect(result.stderr).toBe('');
      expect(result.exitCode).toBe(0);
      expect(result.timedOut).toBe(false);
      expect(result.command).toBe('echo hello');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should capture stderr', async () => {
      const cmd = process.platform === 'win32'
        ? 'echo error 1>&2'
        : 'echo error >&2';
      const result = await tool.execute({ command: cmd }) as import('../../../../src/tools/shell/types.js').ExecCommandOutput;

      expect(result.stderr.trim()).toBe('error');
    });

    it('should return non-zero exit code for failing commands', async () => {
      const cmd = process.platform === 'win32'
        ? 'cmd /c exit 42'
        : 'exit 42';
      const result = await tool.execute({ command: cmd }) as import('../../../../src/tools/shell/types.js').ExecCommandOutput;

      expect(result.exitCode).toBe(42);
      expect(result.timedOut).toBe(false);
    });

    it('should handle command with args', async () => {
      const result = await tool.execute({
        command: 'echo',
        args: ['hello', 'world'],
      }) as import('../../../../src/tools/shell/types.js').ExecCommandOutput;

      expect(result.stdout.trim()).toBe('hello world');
      expect(result.exitCode).toBe(0);
    });

    it('should include full command in output', async () => {
      const result = await tool.execute({
        command: 'echo',
        args: ['foo', 'bar'],
      }) as import('../../../../src/tools/shell/types.js').ExecCommandOutput;

      expect(result.command).toBe('echo foo bar');
    });
  });

  // -----------------------------------------------------------------------
  // Working directory
  // -----------------------------------------------------------------------

  describe('working directory', () => {
    it('should execute in basePath by default', async () => {
      const cmd = process.platform === 'win32' ? 'cd' : 'pwd';
      const result = await tool.execute({ command: cmd }) as import('../../../../src/tools/shell/types.js').ExecCommandOutput;

      const normalized = path.resolve(result.stdout.trim());
      expect(normalized).toBe(path.resolve(tmpDir));
    });

    it('should execute in specified subdirectory', async () => {
      const subDir = path.join(tmpDir, 'sub');
      fs.mkdirSync(subDir);

      const cmd = process.platform === 'win32' ? 'cd' : 'pwd';
      const result = await tool.execute({
        command: cmd,
        cwd: 'sub',
      }) as import('../../../../src/tools/shell/types.js').ExecCommandOutput;

      const normalized = path.resolve(result.stdout.trim());
      expect(normalized).toBe(path.resolve(subDir));
    });

    it('should reject cwd outside basePath', async () => {
      await expect(
        tool.execute({ command: 'echo test', cwd: '../../..' }),
      ).rejects.toThrow(ToolExecutionError);
    });

    it('should reject absolute cwd outside basePath', async () => {
      const outsidePath = process.platform === 'win32' ? 'C:\\Windows' : '/tmp';
      await expect(
        tool.execute({ command: 'echo test', cwd: outsidePath }),
      ).rejects.toThrow(ToolExecutionError);
    });
  });

  // -----------------------------------------------------------------------
  // Timeout
  // -----------------------------------------------------------------------

  describe('timeout', () => {
    it('should kill command that exceeds timeout', async () => {
      const cmd = process.platform === 'win32'
        ? 'ping -n 30 127.0.0.1'
        : 'sleep 30';

      const result = await tool.execute({
        command: cmd,
        timeoutMs: 500,
      }) as import('../../../../src/tools/shell/types.js').ExecCommandOutput;

      expect(result.timedOut).toBe(true);
      expect(result.exitCode).toBeNull();
    }, 10_000);

    it('should not time out for fast commands', async () => {
      const result = await tool.execute({
        command: 'echo fast',
        timeoutMs: 5000,
      }) as import('../../../../src/tools/shell/types.js').ExecCommandOutput;

      expect(result.timedOut).toBe(false);
      expect(result.exitCode).toBe(0);
    });

    it('should cap timeout at MAX_TIMEOUT_MS', async () => {
      // We can't easily test this without running a long command,
      // but we can verify the tool doesn't throw for a large timeout
      const result = await tool.execute({
        command: 'echo hello',
        timeoutMs: MAX_TIMEOUT_MS + 100_000,
      }) as import('../../../../src/tools/shell/types.js').ExecCommandOutput;

      expect(result.exitCode).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // Environment variables
  // -----------------------------------------------------------------------

  describe('environment variables', () => {
    it('should pass additional environment variables', async () => {
      const cmd = process.platform === 'win32'
        ? 'echo %MY_VAR%'
        : 'echo $MY_VAR';

      const result = await tool.execute({
        command: cmd,
        env: { MY_VAR: 'test_value' },
      }) as import('../../../../src/tools/shell/types.js').ExecCommandOutput;

      expect(result.stdout.trim()).toBe('test_value');
    });
  });

  // -----------------------------------------------------------------------
  // Security — denied commands
  // -----------------------------------------------------------------------

  describe('security — denied commands', () => {
    it('should reject hard-denied commands', async () => {
      for (const cmd of DENIED_COMMANDS) {
        await expect(
          tool.execute({ command: cmd }),
        ).rejects.toThrow(ToolExecutionError);
      }
    });

    it('should reject denied commands case-insensitively', async () => {
      await expect(
        tool.execute({ command: 'SHUTDOWN' }),
      ).rejects.toThrow(ToolExecutionError);
    });
  });

  // -----------------------------------------------------------------------
  // Security — allow/deny lists
  // -----------------------------------------------------------------------

  describe('security — allowlist', () => {
    it('should allow commands matching the allowlist', async () => {
      const restricted = createExecCommandTool(tmpDir, {
        allowedCommands: ['echo', 'cat'],
      });

      const result = await restricted.execute({
        command: 'echo allowed',
      }) as import('../../../../src/tools/shell/types.js').ExecCommandOutput;

      expect(result.stdout.trim()).toBe('allowed');
    });

    it('should reject commands not in the allowlist', async () => {
      const restricted = createExecCommandTool(tmpDir, {
        allowedCommands: ['echo'],
      });

      await expect(
        restricted.execute({ command: 'ls' }),
      ).rejects.toThrow(ToolExecutionError);
    });
  });

  describe('security — denylist', () => {
    it('should reject commands matching the denylist', async () => {
      const restricted = createExecCommandTool(tmpDir, {
        deniedCommands: ['rm'],
      });

      await expect(
        restricted.execute({ command: 'rm test.txt' }),
      ).rejects.toThrow(ToolExecutionError);
    });

    it('should allow commands not in the denylist', async () => {
      const restricted = createExecCommandTool(tmpDir, {
        deniedCommands: ['rm'],
      });

      const result = await restricted.execute({
        command: 'echo safe',
      }) as import('../../../../src/tools/shell/types.js').ExecCommandOutput;

      expect(result.stdout.trim()).toBe('safe');
    });
  });

  // -----------------------------------------------------------------------
  // Args escaping
  // -----------------------------------------------------------------------

  describe('argument handling', () => {
    it('should escape arguments with spaces', async () => {
      const result = await tool.execute({
        command: 'echo',
        args: ['hello world'],
      }) as import('../../../../src/tools/shell/types.js').ExecCommandOutput;

      expect(result.command).toBe('echo "hello world"');
    });

    it('should escape arguments with double quotes', async () => {
      const result = await tool.execute({
        command: 'echo',
        args: ['say "hi"'],
      }) as import('../../../../src/tools/shell/types.js').ExecCommandOutput;

      expect(result.command).toContain('say');
    });

    it('should handle empty args array', async () => {
      const result = await tool.execute({
        command: 'echo hello',
        args: [],
      }) as import('../../../../src/tools/shell/types.js').ExecCommandOutput;

      expect(result.command).toBe('echo hello');
    });
  });
});

// ---------------------------------------------------------------------------
// createShellTools factory
// ---------------------------------------------------------------------------

describe('createShellTools', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crewspace-shell-factory-'));
  });

  afterEach(async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        return;
      } catch {
        await new Promise((r) => setTimeout(r, 200));
      }
    }
  });

  it('should return a ShellTools bundle with execCommand tool', () => {
    const tools = createShellTools({ basePath: tmpDir });

    expect(tools.execCommand).toBeDefined();
    expect(tools.execCommand.name).toBe('execCommand');
  });

  it('should default to process.cwd when no basePath provided', () => {
    const tools = createShellTools();

    expect(tools.execCommand).toBeDefined();
    expect(tools.execCommand.name).toBe('execCommand');
  });

  it('should pass through options', async () => {
    const tools = createShellTools({
      basePath: tmpDir,
      allowedCommands: ['echo'],
    });

    const result = await tools.execCommand.execute({
      command: 'echo ok',
    }) as import('../../../../src/tools/shell/types.js').ExecCommandOutput;

    expect(result.stdout.trim()).toBe('ok');

    await expect(
      tools.execCommand.execute({ command: 'ls' }),
    ).rejects.toThrow(ToolExecutionError);
  });
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('shell tool constants', () => {
  it('DEFAULT_TIMEOUT_MS should be 30 seconds', () => {
    expect(DEFAULT_TIMEOUT_MS).toBe(30_000);
  });

  it('MAX_TIMEOUT_MS should be 5 minutes', () => {
    expect(MAX_TIMEOUT_MS).toBe(300_000);
  });

  it('MAX_OUTPUT_SIZE should be 1 MB', () => {
    expect(MAX_OUTPUT_SIZE).toBe(1_048_576);
  });

  it('DENIED_COMMANDS should be a non-empty array', () => {
    expect(Array.isArray(DENIED_COMMANDS)).toBe(true);
    expect(DENIED_COMMANDS.length).toBeGreaterThan(0);
  });

  it('DENIED_COMMANDS should include dangerous commands', () => {
    const deniedSet = new Set(DENIED_COMMANDS);
    expect(deniedSet.has('shutdown')).toBe(true);
    expect(deniedSet.has('reboot')).toBe(true);
    expect(deniedSet.has('mkfs')).toBe(true);
  });
});
