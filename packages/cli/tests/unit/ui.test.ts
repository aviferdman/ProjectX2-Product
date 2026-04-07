import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PassThrough } from 'node:stream';

import { createColorTheme, colors } from '../../src/ui/colors.js';
import { createSpinner, createNoopSpinner } from '../../src/ui/spinner.js';
import { createLogger } from '../../src/ui/logger.js';
import type { ColorTheme, Spinner, Logger } from '../../src/ui/index.js';

// ---------------------------------------------------------------------------
// Tests — createColorTheme
// ---------------------------------------------------------------------------

describe('createColorTheme', () => {
  it('should return a ColorTheme object with all required functions', () => {
    const theme = createColorTheme();
    expect(typeof theme.success).toBe('function');
    expect(typeof theme.error).toBe('function');
    expect(typeof theme.warning).toBe('function');
    expect(typeof theme.info).toBe('function');
    expect(typeof theme.dim).toBe('function');
    expect(typeof theme.bold).toBe('function');
    expect(typeof theme.highlight).toBe('function');
    expect(typeof theme.label).toBe('function');
    expect(typeof theme.enabled).toBe('boolean');
  });

  it('should return strings from all color functions', () => {
    const theme = createColorTheme();
    expect(typeof theme.success('test')).toBe('string');
    expect(typeof theme.error('test')).toBe('string');
    expect(typeof theme.warning('test')).toBe('string');
    expect(typeof theme.info('test')).toBe('string');
    expect(typeof theme.dim('test')).toBe('string');
    expect(typeof theme.bold('test')).toBe('string');
    expect(typeof theme.highlight('test')).toBe('string');
    expect(typeof theme.label('test')).toBe('string');
  });

  it('should contain the original text in output', () => {
    const theme = createColorTheme();
    expect(theme.success('hello')).toContain('hello');
    expect(theme.error('world')).toContain('world');
    expect(theme.warning('warn-text')).toContain('warn-text');
    expect(theme.info('info-text')).toContain('info-text');
  });

  it('should return plain text when forceDisable is true', () => {
    const theme = createColorTheme({ forceDisable: true });
    expect(theme.success('test')).toBe('test');
    expect(theme.error('test')).toBe('test');
    expect(theme.warning('test')).toBe('test');
    expect(theme.info('test')).toBe('test');
    expect(theme.dim('test')).toBe('test');
    expect(theme.bold('test')).toBe('test');
    expect(theme.highlight('test')).toBe('test');
    expect(theme.label('test')).toBe('test');
  });

  it('should report enabled=false when forceDisable is true', () => {
    const theme = createColorTheme({ forceDisable: true });
    expect(theme.enabled).toBe(false);
  });

  it('should work without options', () => {
    const theme = createColorTheme();
    expect(theme).toBeDefined();
  });
});

describe('colors (default instance)', () => {
  it('should be a valid ColorTheme', () => {
    expect(typeof colors.success).toBe('function');
    expect(typeof colors.error).toBe('function');
    expect(typeof colors.enabled).toBe('boolean');
  });
});

// ---------------------------------------------------------------------------
// Tests — createSpinner
// ---------------------------------------------------------------------------

describe('createSpinner', () => {
  it('should create a spinner with the Spinner interface', () => {
    const spinner = createSpinner({ disabled: true });
    expect(typeof spinner.start).toBe('function');
    expect(typeof spinner.succeed).toBe('function');
    expect(typeof spinner.fail).toBe('function');
    expect(typeof spinner.warn).toBe('function');
    expect(typeof spinner.info).toBe('function');
    expect(typeof spinner.setText).toBe('function');
    expect(typeof spinner.stop).toBe('function');
    expect(typeof spinner.isSpinning).toBe('boolean');
  });

  it('should create a functional spinner when not disabled', () => {
    // Use a PassThrough stream to avoid terminal output.
    // Note: ora may not report isSpinning=true on non-TTY streams,
    // so we just verify it doesn't throw and the interface works.
    const stream = new PassThrough();
    const spinner = createSpinner({ text: 'Loading…', stream });
    expect(spinner).toBeDefined();
    spinner.start();
    spinner.setText('Updated…');
    spinner.stop();
    expect(spinner.isSpinning).toBe(false);
    stream.destroy();
  });

  it('should support method chaining', () => {
    const stream = new PassThrough();
    const spinner = createSpinner({ stream });
    const result = spinner.start('test').setText('updated').stop();
    expect(result).toBe(spinner);
    stream.destroy();
  });

  it('should support succeed/fail/warn/info stop methods', () => {
    const stream = new PassThrough();
    const spinner = createSpinner({ stream });

    spinner.start('testing');
    spinner.succeed('done');
    expect(spinner.isSpinning).toBe(false);

    spinner.start('testing');
    spinner.fail('failed');
    expect(spinner.isSpinning).toBe(false);

    spinner.start('testing');
    spinner.warn('warned');
    expect(spinner.isSpinning).toBe(false);

    spinner.start('testing');
    spinner.info('info');
    expect(spinner.isSpinning).toBe(false);

    stream.destroy();
  });

  it('should default to process.stderr as stream', () => {
    // We can't easily verify the stream but ensure it doesn't throw
    const spinner = createSpinner({ disabled: true });
    expect(spinner).toBeDefined();
  });
});

describe('createNoopSpinner', () => {
  it('should always report isSpinning as false', () => {
    const spinner = createNoopSpinner();
    expect(spinner.isSpinning).toBe(false);
    spinner.start('hello');
    expect(spinner.isSpinning).toBe(false);
  });

  it('should support method chaining', () => {
    const spinner = createNoopSpinner();
    const result = spinner.start().succeed().fail().warn().info().setText('x').stop();
    expect(result).toBe(spinner);
  });

  it('should not throw on any method call', () => {
    const spinner = createNoopSpinner();
    expect(() => spinner.start('text')).not.toThrow();
    expect(() => spinner.succeed('text')).not.toThrow();
    expect(() => spinner.fail('text')).not.toThrow();
    expect(() => spinner.warn('text')).not.toThrow();
    expect(() => spinner.info('text')).not.toThrow();
    expect(() => spinner.setText('text')).not.toThrow();
    expect(() => spinner.stop()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Tests — createLogger
// ---------------------------------------------------------------------------

describe('createLogger', () => {
  let stdoutData: string;
  let stderrData: string;
  let mockStdout: PassThrough;
  let mockStderr: PassThrough;

  beforeEach(() => {
    stdoutData = '';
    stderrData = '';
    mockStdout = new PassThrough();
    mockStderr = new PassThrough();
    mockStdout.on('data', (chunk: Buffer) => {
      stdoutData += chunk.toString();
    });
    mockStderr.on('data', (chunk: Buffer) => {
      stderrData += chunk.toString();
    });
  });

  afterEach(() => {
    mockStdout.destroy();
    mockStderr.destroy();
  });

  function makeLogger(verbosity: 'quiet' | 'normal' | 'verbose' = 'normal'): Logger {
    return createLogger({
      verbosity,
      noColor: true,
      stdout: mockStdout,
      stderr: mockStderr,
    });
  }

  // -- Logger creation --------------------------------------------------------

  it('should create a logger with all expected methods', () => {
    const logger = makeLogger();
    expect(typeof logger.success).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.log).toBe('function');
    expect(typeof logger.spinner).toBe('function');
    expect(logger.colors).toBeDefined();
    expect(typeof logger.verbosity).toBe('string');
  });

  it('should default to normal verbosity', () => {
    const logger = createLogger({ noColor: true, stdout: mockStdout, stderr: mockStderr });
    expect(logger.verbosity).toBe('normal');
  });

  // -- Normal verbosity -------------------------------------------------------

  it('should output success messages in normal mode', () => {
    const logger = makeLogger('normal');
    logger.success('All tests passed');
    expect(stdoutData).toContain('All tests passed');
    expect(stdoutData).toContain('✔');
  });

  it('should output error messages to stderr in normal mode', () => {
    const logger = makeLogger('normal');
    logger.error('Something broke');
    expect(stderrData).toContain('Something broke');
    expect(stderrData).toContain('✖');
  });

  it('should output warning messages to stderr in normal mode', () => {
    const logger = makeLogger('normal');
    logger.warn('Watch out');
    expect(stderrData).toContain('Watch out');
    expect(stderrData).toContain('⚠');
  });

  it('should output info messages in normal mode', () => {
    const logger = makeLogger('normal');
    logger.info('Processing…');
    expect(stdoutData).toContain('Processing…');
    expect(stdoutData).toContain('ℹ');
  });

  it('should NOT output debug messages in normal mode', () => {
    const logger = makeLogger('normal');
    logger.debug('Internal detail');
    expect(stdoutData).toBe('');
  });

  it('should output log messages in normal mode', () => {
    const logger = makeLogger('normal');
    logger.log('raw output');
    expect(stdoutData).toContain('raw output');
  });

  // -- Quiet mode -------------------------------------------------------------

  it('should suppress success messages in quiet mode', () => {
    const logger = makeLogger('quiet');
    logger.success('hidden');
    expect(stdoutData).toBe('');
  });

  it('should still output error messages in quiet mode', () => {
    const logger = makeLogger('quiet');
    logger.error('visible error');
    expect(stderrData).toContain('visible error');
  });

  it('should suppress warning messages in quiet mode', () => {
    const logger = makeLogger('quiet');
    logger.warn('hidden warning');
    expect(stderrData).toBe('');
  });

  it('should suppress info messages in quiet mode', () => {
    const logger = makeLogger('quiet');
    logger.info('hidden info');
    expect(stdoutData).toBe('');
  });

  it('should suppress debug messages in quiet mode', () => {
    const logger = makeLogger('quiet');
    logger.debug('hidden debug');
    expect(stdoutData).toBe('');
  });

  it('should suppress log messages in quiet mode', () => {
    const logger = makeLogger('quiet');
    logger.log('hidden log');
    expect(stdoutData).toBe('');
  });

  // -- Verbose mode -----------------------------------------------------------

  it('should output debug messages in verbose mode', () => {
    const logger = makeLogger('verbose');
    logger.debug('Debug detail');
    expect(stdoutData).toContain('Debug detail');
    expect(stdoutData).toContain('[debug]');
  });

  it('should output all other message types in verbose mode', () => {
    const logger = makeLogger('verbose');
    logger.success('OK');
    logger.error('ERR');
    logger.warn('WARN');
    logger.info('INFO');
    logger.log('LOG');
    expect(stdoutData).toContain('OK');
    expect(stderrData).toContain('ERR');
    expect(stderrData).toContain('WARN');
    expect(stdoutData).toContain('INFO');
    expect(stdoutData).toContain('LOG');
  });

  // -- Spinner ----------------------------------------------------------------

  it('should create a spinner in normal mode', () => {
    const logger = makeLogger('normal');
    const spinner = logger.spinner('Loading');
    expect(spinner).toBeDefined();
    expect(typeof spinner.start).toBe('function');
  });

  it('should create a disabled (noop) spinner in quiet mode', () => {
    const logger = makeLogger('quiet');
    const spinner = logger.spinner('Loading');
    expect(spinner).toBeDefined();
    spinner.start();
    expect(spinner.isSpinning).toBe(false);
  });

  // -- Colors -----------------------------------------------------------------

  it('should expose a color theme', () => {
    const logger = makeLogger();
    expect(typeof logger.colors.success).toBe('function');
    expect(typeof logger.colors.error).toBe('function');
  });

  it('should have disabled colors when noColor is true', () => {
    const logger = makeLogger();
    expect(logger.colors.enabled).toBe(false);
    expect(logger.colors.success('test')).toBe('test');
  });

  // -- Verbosity property -----------------------------------------------------

  it('should report correct verbosity', () => {
    expect(makeLogger('quiet').verbosity).toBe('quiet');
    expect(makeLogger('normal').verbosity).toBe('normal');
    expect(makeLogger('verbose').verbosity).toBe('verbose');
  });
});

// ---------------------------------------------------------------------------
// Tests — Integration with formatScaffoldResult
// ---------------------------------------------------------------------------

describe('formatScaffoldResult with ColorTheme', () => {
  it('should accept a disabled color theme', async () => {
    const { formatScaffoldResult } = await import('../../src/commands/init.js');
    const theme = createColorTheme({ forceDisable: true });
    const output = formatScaffoldResult(
      {
        projectDir: '/tmp/test',
        filesCreated: ['package.json'],
        filesSkipped: [],
        template: 'default',
      },
      theme,
    );
    expect(output).toContain('✓');
    expect(output).toContain('/tmp/test');
    expect(output).toContain('+ package.json');
  });

  it('should still work without a color theme (backward compatible)', async () => {
    const { formatScaffoldResult } = await import('../../src/commands/init.js');
    const output = formatScaffoldResult({
      projectDir: '/tmp/test',
      filesCreated: ['package.json'],
      filesSkipped: [],
      template: 'default',
    });
    expect(output).toContain('✓');
    expect(output).toContain('/tmp/test');
  });
});

// ---------------------------------------------------------------------------
// Tests — Integration with formatValidationResult
// ---------------------------------------------------------------------------

describe('formatValidationResult with ColorTheme', () => {
  it('should accept a disabled color theme', async () => {
    const { formatValidationResult } = await import('../../src/commands/validator.js');
    const theme = createColorTheme({ forceDisable: true });
    const output = formatValidationResult(
      {
        valid: true,
        file: '/path/to/workflow.ts',
        diagnostics: [],
        errorCount: 0,
        warningCount: 0,
      },
      theme,
    );
    expect(output).toContain('✓');
    expect(output).toContain('No issues found');
  });

  it('should colorize error diagnostics', async () => {
    const { formatValidationResult } = await import('../../src/commands/validator.js');
    const theme = createColorTheme({ forceDisable: true });
    const output = formatValidationResult(
      {
        valid: false,
        file: '/path/to/workflow.ts',
        diagnostics: [{ level: 'error', message: 'File is empty' }],
        errorCount: 1,
        warningCount: 0,
      },
      theme,
    );
    expect(output).toContain('✗');
    expect(output).toContain('1 error');
  });

  it('should still work without a color theme (backward compatible)', async () => {
    const { formatValidationResult } = await import('../../src/commands/validator.js');
    const output = formatValidationResult({
      valid: true,
      file: '/path/to/workflow.ts',
      diagnostics: [],
      errorCount: 0,
      warningCount: 0,
    });
    expect(output).toContain('✓');
    expect(output).toContain('No issues found');
  });
});
