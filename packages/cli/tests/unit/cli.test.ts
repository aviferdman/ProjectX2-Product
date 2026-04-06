import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

import { createProgram } from '../../src/program.js';
import { CLI_VERSION } from '../../src/index.js';
import { resolveLogLevel, resolveConfigPath } from '../../src/options.js';

describe('createProgram', () => {
  it('should create a Commander program named "crewspace"', () => {
    const program = createProgram();
    expect(program.name()).toBe('crewspace');
  });

  it('should have the correct version', () => {
    const program = createProgram();
    expect(program.version()).toBe(CLI_VERSION);
  });

  it('should register the init subcommand', () => {
    const program = createProgram();
    const initCmd = program.commands.find((c) => c.name() === 'init');
    expect(initCmd).toBeDefined();
    expect(initCmd!.description()).toBe('Scaffold a new Crewspace project');
  });

  it('should register the run subcommand', () => {
    const program = createProgram();
    const runCmd = program.commands.find((c) => c.name() === 'run');
    expect(runCmd).toBeDefined();
    expect(runCmd!.description()).toBe('Execute a Crewspace workflow file');
  });

  it('should register the validate subcommand', () => {
    const program = createProgram();
    const validateCmd = program.commands.find((c) => c.name() === 'validate');
    expect(validateCmd).toBeDefined();
    expect(validateCmd!.description()).toBe('Validate a Crewspace workflow file');
  });

  it('should have global --config option', () => {
    const program = createProgram();
    const configOpt = program.options.find((o) => o.long === '--config');
    expect(configOpt).toBeDefined();
  });

  it('should have global --verbose option', () => {
    const program = createProgram();
    const verboseOpt = program.options.find((o) => o.long === '--verbose');
    expect(verboseOpt).toBeDefined();
  });

  it('should have global --quiet option', () => {
    const program = createProgram();
    const quietOpt = program.options.find((o) => o.long === '--quiet');
    expect(quietOpt).toBeDefined();
  });

  it('should have global --log-level option', () => {
    const program = createProgram();
    const logLevelOpt = program.options.find((o) => o.long === '--log-level');
    expect(logLevelOpt).toBeDefined();
  });

  it('should have global --cwd option', () => {
    const program = createProgram();
    const cwdOpt = program.options.find((o) => o.long === '--cwd');
    expect(cwdOpt).toBeDefined();
  });
});

describe('argument parsing', () => {
  let program: ReturnType<typeof createProgram>;
  let tmpDir: string;

  beforeEach(() => {
    program = createProgram();
    program.exitOverride();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crewspace-cli-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('should parse --verbose flag', async () => {
    await program.parseAsync(['--verbose', 'init', tmpDir], { from: 'user' });
    expect(program.opts()['verbose']).toBe(true);
  });

  it('should parse --quiet flag', async () => {
    await program.parseAsync(['--quiet', 'init', tmpDir], { from: 'user' });
    expect(program.opts()['quiet']).toBe(true);
  });

  it('should parse --config <path>', async () => {
    await program.parseAsync(['--config', 'my.config.ts', 'init', tmpDir], { from: 'user' });
    expect(program.opts()['config']).toBe('my.config.ts');
  });

  it('should parse --log-level <level>', async () => {
    await program.parseAsync(['--log-level', 'debug', 'init', tmpDir], { from: 'user' });
    expect(program.opts()['logLevel']).toBe('debug');
  });

  it('should parse --cwd <dir>', async () => {
    await program.parseAsync(['--cwd', '/tmp/project', 'init', tmpDir], { from: 'user' });
    expect(program.opts()['cwd']).toBe('/tmp/project');
  });

  it('should throw on unknown options', async () => {
    await expect(
      program.parseAsync(['--does-not-exist'], { from: 'user' }),
    ).rejects.toThrow();
  });

  it('should parse init command with directory argument', async () => {
    const initCmd = program.commands.find((c) => c.name() === 'init')!;
    const dir = path.join(tmpDir, 'my-project');
    await program.parseAsync(['init', dir], { from: 'user' });
    expect(initCmd.args).toContain(dir);
  });

  it('should parse init --template option', async () => {
    const initCmd = program.commands.find((c) => c.name() === 'init')!;
    await program.parseAsync(['init', '--template', 'minimal', tmpDir], { from: 'user' });
    expect(initCmd.opts()['template']).toBe('minimal');
  });

  it('should parse init --force option', async () => {
    const initCmd = program.commands.find((c) => c.name() === 'init')!;
    await program.parseAsync(['init', '--force', tmpDir], { from: 'user' });
    expect(initCmd.opts()['force']).toBe(true);
  });

  it('should parse run command with file argument', async () => {
    const runCmd = program.commands.find((c) => c.name() === 'run')!;
    await program.parseAsync(['run', 'workflow.ts'], { from: 'user' });
    expect(runCmd.args).toContain('workflow.ts');
  });

  it('should parse run --watch option', async () => {
    const runCmd = program.commands.find((c) => c.name() === 'run')!;
    await program.parseAsync(['run', '--watch', 'workflow.ts'], { from: 'user' });
    expect(runCmd.opts()['watch']).toBe(true);
  });

  it('should parse run --timeout option', async () => {
    const runCmd = program.commands.find((c) => c.name() === 'run')!;
    await program.parseAsync(['run', '--timeout', '5000', 'workflow.ts'], { from: 'user' });
    expect(runCmd.opts()['timeout']).toBe('5000');
  });

  it('should parse validate command with file argument', async () => {
    const validateCmd = program.commands.find((c) => c.name() === 'validate')!;
    await program.parseAsync(['validate', 'workflow.ts'], { from: 'user' });
    expect(validateCmd.args).toContain('workflow.ts');
  });

  it('should parse validate --strict option', async () => {
    const validateCmd = program.commands.find((c) => c.name() === 'validate')!;
    await program.parseAsync(['validate', '--strict', 'workflow.ts'], { from: 'user' });
    expect(validateCmd.opts()['strict']).toBe(true);
  });
});

describe('resolveLogLevel', () => {
  it('should return "error" when quiet is true', () => {
    expect(resolveLogLevel({ quiet: true })).toBe('error');
  });

  it('should return "debug" when verbose is true', () => {
    expect(resolveLogLevel({ verbose: true })).toBe('debug');
  });

  it('should prioritize quiet over verbose', () => {
    expect(resolveLogLevel({ quiet: true, verbose: true })).toBe('error');
  });

  it('should return the specified log level', () => {
    expect(resolveLogLevel({ logLevel: 'warn' })).toBe('warn');
  });

  it('should normalize log level to lowercase', () => {
    expect(resolveLogLevel({ logLevel: 'DEBUG' })).toBe('debug');
  });

  it('should trim whitespace from log level', () => {
    expect(resolveLogLevel({ logLevel: '  info  ' })).toBe('info');
  });

  it('should throw on invalid log level', () => {
    expect(() => resolveLogLevel({ logLevel: 'banana' })).toThrow(
      'Invalid log level "banana"',
    );
  });

  it('should default to "info"', () => {
    expect(resolveLogLevel({})).toBe('info');
  });

  it('should accept all valid log levels', () => {
    expect(resolveLogLevel({ logLevel: 'debug' })).toBe('debug');
    expect(resolveLogLevel({ logLevel: 'info' })).toBe('info');
    expect(resolveLogLevel({ logLevel: 'warn' })).toBe('warn');
    expect(resolveLogLevel({ logLevel: 'error' })).toBe('error');
  });
});

describe('resolveConfigPath', () => {
  it('should return the provided config path', () => {
    expect(resolveConfigPath('custom.config.ts', '/home/user/project')).toBe('custom.config.ts');
  });

  it('should fall back to default config in cwd', () => {
    expect(resolveConfigPath(undefined, '/home/user/project')).toBe(
      '/home/user/project/crewspace.config.ts',
    );
  });
});

describe('CLI_VERSION', () => {
  it('should be a valid semver string', () => {
    expect(CLI_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
