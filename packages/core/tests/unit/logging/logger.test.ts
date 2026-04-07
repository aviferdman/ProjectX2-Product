/**
 * Tests for the structured logging module.
 *
 * Covers: Logger, LogLevel, transports, masking, child loggers, factories.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  BufferTransport,
  ConsoleTransport,
  createAgentLogger,
  createCrewLogger,
  createSilentLogger,
  getLogLevelLabel,
  Logger,
  LogLevel,
  maskSensitiveData,
  parseLogLevel,
} from '../../../src/logging/index.js';

import type { LogContext, LogEntry, LogTransport } from '../../../src/logging/index.js';

// ---------------------------------------------------------------------------
// LogLevel
// ---------------------------------------------------------------------------

describe('LogLevel', () => {
  it('has correct numeric ordering', () => {
    expect(LogLevel.DEBUG).toBeLessThan(LogLevel.INFO);
    expect(LogLevel.INFO).toBeLessThan(LogLevel.WARN);
    expect(LogLevel.WARN).toBeLessThan(LogLevel.ERROR);
    expect(LogLevel.ERROR).toBeLessThan(LogLevel.SILENT);
  });

  it('has specific numeric values', () => {
    expect(LogLevel.DEBUG).toBe(0);
    expect(LogLevel.INFO).toBe(1);
    expect(LogLevel.WARN).toBe(2);
    expect(LogLevel.ERROR).toBe(3);
    expect(LogLevel.SILENT).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// parseLogLevel
// ---------------------------------------------------------------------------

describe('parseLogLevel', () => {
  it('parses lowercase level names', () => {
    expect(parseLogLevel('debug')).toBe(LogLevel.DEBUG);
    expect(parseLogLevel('info')).toBe(LogLevel.INFO);
    expect(parseLogLevel('warn')).toBe(LogLevel.WARN);
    expect(parseLogLevel('error')).toBe(LogLevel.ERROR);
    expect(parseLogLevel('silent')).toBe(LogLevel.SILENT);
  });

  it('parses uppercase level names', () => {
    expect(parseLogLevel('DEBUG')).toBe(LogLevel.DEBUG);
    expect(parseLogLevel('INFO')).toBe(LogLevel.INFO);
    expect(parseLogLevel('WARN')).toBe(LogLevel.WARN);
    expect(parseLogLevel('ERROR')).toBe(LogLevel.ERROR);
  });

  it('parses mixed-case level names', () => {
    expect(parseLogLevel('Debug')).toBe(LogLevel.DEBUG);
    expect(parseLogLevel('Info')).toBe(LogLevel.INFO);
  });

  it('returns undefined for unknown level names', () => {
    expect(parseLogLevel('trace')).toBeUndefined();
    expect(parseLogLevel('fatal')).toBeUndefined();
    expect(parseLogLevel('')).toBeUndefined();
    expect(parseLogLevel('unknown')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getLogLevelLabel
// ---------------------------------------------------------------------------

describe('getLogLevelLabel', () => {
  it('returns correct labels for all levels', () => {
    expect(getLogLevelLabel(LogLevel.DEBUG)).toBe('DEBUG');
    expect(getLogLevelLabel(LogLevel.INFO)).toBe('INFO');
    expect(getLogLevelLabel(LogLevel.WARN)).toBe('WARN');
    expect(getLogLevelLabel(LogLevel.ERROR)).toBe('ERROR');
    expect(getLogLevelLabel(LogLevel.SILENT)).toBe('SILENT');
  });

  it('returns UNKNOWN for invalid numeric levels', () => {
    expect(getLogLevelLabel(99 as LogLevel)).toBe('UNKNOWN');
  });
});

// ---------------------------------------------------------------------------
// BufferTransport
// ---------------------------------------------------------------------------

describe('BufferTransport', () => {
  let transport: BufferTransport;

  beforeEach(() => {
    transport = new BufferTransport();
  });

  it('has name "buffer"', () => {
    expect(transport.name).toBe('buffer');
  });

  it('starts empty', () => {
    expect(transport.entries).toHaveLength(0);
    expect(transport.size).toBe(0);
  });

  it('stores written entries', () => {
    const entry: LogEntry = {
      level: LogLevel.INFO,
      levelLabel: 'INFO',
      message: 'test message',
      timestamp: '2026-01-01T00:00:00.000Z',
      context: {},
    };

    transport.write(entry);

    expect(transport.entries).toHaveLength(1);
    expect(transport.entries[0]).toBe(entry);
    expect(transport.size).toBe(1);
  });

  it('stores multiple entries in order', () => {
    const entry1: LogEntry = {
      level: LogLevel.INFO,
      levelLabel: 'INFO',
      message: 'first',
      timestamp: '2026-01-01T00:00:00.000Z',
      context: {},
    };
    const entry2: LogEntry = {
      level: LogLevel.WARN,
      levelLabel: 'WARN',
      message: 'second',
      timestamp: '2026-01-01T00:00:01.000Z',
      context: {},
    };

    transport.write(entry1);
    transport.write(entry2);

    expect(transport.entries).toHaveLength(2);
    expect(transport.entries[0]!.message).toBe('first');
    expect(transport.entries[1]!.message).toBe('second');
  });

  it('clears buffered entries', () => {
    const entry: LogEntry = {
      level: LogLevel.INFO,
      levelLabel: 'INFO',
      message: 'test',
      timestamp: '2026-01-01T00:00:00.000Z',
      context: {},
    };

    transport.write(entry);
    expect(transport.size).toBe(1);

    transport.clear();
    expect(transport.size).toBe(0);
    expect(transport.entries).toHaveLength(0);
  });

  it('entries is a read-only snapshot', () => {
    const entries = transport.entries;
    expect(Array.isArray(entries)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ConsoleTransport
// ---------------------------------------------------------------------------

describe('ConsoleTransport', () => {
  let transport: ConsoleTransport;

  beforeEach(() => {
    transport = new ConsoleTransport();
  });

  it('has name "console"', () => {
    expect(transport.name).toBe('console');
  });

  it('writes INFO to console.log', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

    transport.write({
      level: LogLevel.INFO,
      levelLabel: 'INFO',
      message: 'hello world',
      timestamp: '2026-01-01T00:00:00.000Z',
      context: {},
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]![0]).toContain('[INFO]');
    expect(spy.mock.calls[0]![0]).toContain('hello world');

    spy.mockRestore();
  });

  it('writes DEBUG to console.log', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

    transport.write({
      level: LogLevel.DEBUG,
      levelLabel: 'DEBUG',
      message: 'debug msg',
      timestamp: '2026-01-01T00:00:00.000Z',
      context: {},
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]![0]).toContain('[DEBUG]');

    spy.mockRestore();
  });

  it('writes WARN to console.warn', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    transport.write({
      level: LogLevel.WARN,
      levelLabel: 'WARN',
      message: 'warning',
      timestamp: '2026-01-01T00:00:00.000Z',
      context: {},
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]![0]).toContain('[WARN]');

    spy.mockRestore();
  });

  it('writes ERROR to console.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    transport.write({
      level: LogLevel.ERROR,
      levelLabel: 'ERROR',
      message: 'error msg',
      timestamp: '2026-01-01T00:00:00.000Z',
      context: {},
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]![0]).toContain('[ERROR]');

    spy.mockRestore();
  });

  it('includes agent/task/crew context in output', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

    transport.write({
      level: LogLevel.INFO,
      levelLabel: 'INFO',
      message: 'contextual',
      timestamp: '2026-01-01T00:00:00.000Z',
      context: { agentId: 'a1', taskId: 't1', crewId: 'c1' },
    });

    const output = spy.mock.calls[0]![0] as string;
    expect(output).toContain('[agent:a1]');
    expect(output).toContain('[task:t1]');
    expect(output).toContain('[crew:c1]');

    spy.mockRestore();
  });

  it('prints error stack trace', () => {
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const err = new Error('test error');

    transport.write({
      level: LogLevel.ERROR,
      levelLabel: 'ERROR',
      message: 'oops',
      timestamp: '2026-01-01T00:00:00.000Z',
      context: {},
      error: err,
    });

    // Called twice: once for message, once for stack
    expect(logSpy).toHaveBeenCalledTimes(2);

    logSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// maskSensitiveData
// ---------------------------------------------------------------------------

describe('maskSensitiveData', () => {
  it('masks API key patterns', () => {
    const input = 'Using key sk-abcdefghijklmnopqrstuvwxyz to authenticate';
    const result = maskSensitiveData(input);
    expect(result).not.toContain('sk-abcdefghijklmnopqrstuvwxyz');
    expect(result).toContain('***');
  });

  it('masks Bearer tokens', () => {
    const input = 'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.test';
    const result = maskSensitiveData(input);
    expect(result).not.toContain('eyJhbGciOiJIUzI1NiJ9');
    expect(result).toContain('***');
  });

  it('masks long hex strings', () => {
    const input = 'Secret: abcdef0123456789abcdef0123456789';
    const result = maskSensitiveData(input);
    expect(result).not.toContain('abcdef0123456789abcdef0123456789');
    expect(result).toContain('***');
  });

  it('masks email addresses', () => {
    const input = 'Contact user@example.com for details';
    const result = maskSensitiveData(input);
    expect(result).not.toContain('user@example.com');
    expect(result).toContain('***');
  });

  it('leaves safe text unchanged', () => {
    const input = 'Hello world, this is a normal message';
    expect(maskSensitiveData(input)).toBe(input);
  });

  it('supports custom patterns', () => {
    const input = 'SSN: 123-45-6789';
    const patterns = [/\d{3}-\d{2}-\d{4}/g];
    const result = maskSensitiveData(input, patterns);
    expect(result).toBe('SSN: ***');
  });

  it('handles empty string', () => {
    expect(maskSensitiveData('')).toBe('');
  });

  it('handles multiple sensitive values in one string', () => {
    const input = 'Keys: sk-aaaabbbbccccddddeeeeffffgggg and pk-aaaabbbbccccddddeeeeffffgggg';
    const result = maskSensitiveData(input);
    expect(result).not.toContain('sk-aaaa');
    expect(result).not.toContain('pk-aaaa');
  });
});

// ---------------------------------------------------------------------------
// Logger — construction and defaults
// ---------------------------------------------------------------------------

describe('Logger', () => {
  const fixedNow = () => '2026-01-01T00:00:00.000Z';

  describe('construction', () => {
    it('creates with default config', () => {
      const logger = new Logger({ transports: [], now: fixedNow });
      expect(logger.level).toBe(LogLevel.INFO);
      expect(logger.transports).toHaveLength(0);
      expect(logger.context).toEqual({});
    });

    it('creates with custom level', () => {
      const logger = new Logger({ level: LogLevel.DEBUG, transports: [], now: fixedNow });
      expect(logger.level).toBe(LogLevel.DEBUG);
    });

    it('creates with custom context', () => {
      const ctx: LogContext = { agentId: 'test-agent' };
      const logger = new Logger({ context: ctx, transports: [], now: fixedNow });
      expect(logger.context).toEqual({ agentId: 'test-agent' });
    });

    it('creates with default ConsoleTransport when no transports specified', () => {
      const logger = new Logger();
      expect(logger.transports).toHaveLength(1);
      expect(logger.transports[0]!.name).toBe('console');
    });
  });

  // -----------------------------------------------------------------------
  // Level filtering
  // -----------------------------------------------------------------------

  describe('level filtering', () => {
    it('filters out messages below current level', () => {
      const buf = new BufferTransport();
      const logger = new Logger({
        level: LogLevel.WARN,
        transports: [buf],
        now: fixedNow,
      });

      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');

      expect(buf.size).toBe(2);
      expect(buf.entries[0]!.levelLabel).toBe('WARN');
      expect(buf.entries[1]!.levelLabel).toBe('ERROR');
    });

    it('emits all messages at DEBUG level', () => {
      const buf = new BufferTransport();
      const logger = new Logger({
        level: LogLevel.DEBUG,
        transports: [buf],
        now: fixedNow,
      });

      logger.debug('d');
      logger.info('i');
      logger.warn('w');
      logger.error('e');

      expect(buf.size).toBe(4);
    });

    it('emits nothing at SILENT level', () => {
      const buf = new BufferTransport();
      const logger = new Logger({
        level: LogLevel.SILENT,
        transports: [buf],
        now: fixedNow,
      });

      logger.debug('d');
      logger.info('i');
      logger.warn('w');
      logger.error('e');

      expect(buf.size).toBe(0);
    });

    it('allows changing level at runtime', () => {
      const buf = new BufferTransport();
      const logger = new Logger({
        level: LogLevel.ERROR,
        transports: [buf],
        now: fixedNow,
      });

      logger.info('before');
      expect(buf.size).toBe(0);

      logger.level = LogLevel.INFO;
      logger.info('after');
      expect(buf.size).toBe(1);
    });

    it('isLevelEnabled returns correct values', () => {
      const logger = new Logger({ level: LogLevel.WARN, transports: [], now: fixedNow });

      expect(logger.isLevelEnabled(LogLevel.DEBUG)).toBe(false);
      expect(logger.isLevelEnabled(LogLevel.INFO)).toBe(false);
      expect(logger.isLevelEnabled(LogLevel.WARN)).toBe(true);
      expect(logger.isLevelEnabled(LogLevel.ERROR)).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Log entry structure
  // -----------------------------------------------------------------------

  describe('log entry structure', () => {
    it('produces correct entry fields', () => {
      const buf = new BufferTransport();
      const logger = new Logger({
        level: LogLevel.DEBUG,
        transports: [buf],
        now: fixedNow,
      });

      logger.info('hello');

      const entry = buf.entries[0]!;
      expect(entry.level).toBe(LogLevel.INFO);
      expect(entry.levelLabel).toBe('INFO');
      expect(entry.message).toBe('hello');
      expect(entry.timestamp).toBe('2026-01-01T00:00:00.000Z');
      expect(entry.context).toEqual({});
      expect(entry.error).toBeUndefined();
    });

    it('merges logger context with call context', () => {
      const buf = new BufferTransport();
      const logger = new Logger({
        level: LogLevel.DEBUG,
        transports: [buf],
        context: { agentId: 'agent-1', crewId: 'crew-1' },
        now: fixedNow,
      });

      logger.info('msg', { taskId: 'task-1' });

      const ctx = buf.entries[0]!.context;
      expect(ctx.agentId).toBe('agent-1');
      expect(ctx.crewId).toBe('crew-1');
      expect(ctx.taskId).toBe('task-1');
    });

    it('call context overrides logger context', () => {
      const buf = new BufferTransport();
      const logger = new Logger({
        level: LogLevel.DEBUG,
        transports: [buf],
        context: { agentId: 'default' },
        now: fixedNow,
      });

      logger.info('msg', { agentId: 'override' });

      expect(buf.entries[0]!.context.agentId).toBe('override');
    });

    it('includes error in entry when provided', () => {
      const buf = new BufferTransport();
      const logger = new Logger({
        level: LogLevel.DEBUG,
        transports: [buf],
        now: fixedNow,
      });

      const err = new Error('oops');
      logger.error('failed', {}, err);

      expect(buf.entries[0]!.error).toBe(err);
    });

    it('warn includes error when provided', () => {
      const buf = new BufferTransport();
      const logger = new Logger({
        level: LogLevel.DEBUG,
        transports: [buf],
        now: fixedNow,
      });

      const err = new Error('warning-cause');
      logger.warn('warn msg', {}, err);

      expect(buf.entries[0]!.error).toBe(err);
    });
  });

  // -----------------------------------------------------------------------
  // Transports
  // -----------------------------------------------------------------------

  describe('transport management', () => {
    it('writes to multiple transports', () => {
      const buf1 = new BufferTransport();
      const buf2 = new BufferTransport();
      const logger = new Logger({
        level: LogLevel.DEBUG,
        transports: [buf1, buf2],
        now: fixedNow,
      });

      logger.info('multi');

      expect(buf1.size).toBe(1);
      expect(buf2.size).toBe(1);
    });

    it('adds a transport dynamically', () => {
      const buf = new BufferTransport();
      const logger = new Logger({
        level: LogLevel.DEBUG,
        transports: [],
        now: fixedNow,
      });

      logger.info('before');
      expect(buf.size).toBe(0);

      logger.addTransport(buf);
      logger.info('after');
      expect(buf.size).toBe(1);
    });

    it('removes a transport by name', () => {
      const buf = new BufferTransport();
      const logger = new Logger({
        level: LogLevel.DEBUG,
        transports: [buf],
        now: fixedNow,
      });

      logger.info('before');
      expect(buf.size).toBe(1);

      const removed = logger.removeTransport('buffer');
      expect(removed).toBe(true);

      logger.info('after');
      expect(buf.size).toBe(1); // no new entry
    });

    it('removeTransport returns false for unknown name', () => {
      const logger = new Logger({ transports: [], now: fixedNow });
      expect(logger.removeTransport('nonexistent')).toBe(false);
    });

    it('supports custom transport implementations', () => {
      const entries: LogEntry[] = [];
      const custom: LogTransport = {
        name: 'custom',
        write(entry) {
          entries.push(entry);
        },
      };

      const logger = new Logger({
        level: LogLevel.DEBUG,
        transports: [custom],
        now: fixedNow,
      });

      logger.info('custom transport');
      expect(entries).toHaveLength(1);
      expect(entries[0]!.message).toBe('custom transport');
    });
  });

  // -----------------------------------------------------------------------
  // Sensitive data masking
  // -----------------------------------------------------------------------

  describe('sensitive data masking', () => {
    it('masks messages when enabled', () => {
      const buf = new BufferTransport();
      const logger = new Logger({
        level: LogLevel.DEBUG,
        transports: [buf],
        maskSensitive: true,
        now: fixedNow,
      });

      logger.info('API key: sk-abcdefghijklmnopqrstuvwxyz active');

      expect(buf.entries[0]!.message).not.toContain('sk-abcdefghijklmnopqrstuvwxyz');
      expect(buf.entries[0]!.message).toContain('***');
    });

    it('does not mask when disabled (default)', () => {
      const buf = new BufferTransport();
      const logger = new Logger({
        level: LogLevel.DEBUG,
        transports: [buf],
        now: fixedNow,
      });

      logger.info('API key: sk-abcdefghijklmnopqrstuvwxyz active');

      expect(buf.entries[0]!.message).toContain('sk-abcdefghijklmnopqrstuvwxyz');
    });

    it('supports custom mask patterns', () => {
      const buf = new BufferTransport();
      const logger = new Logger({
        level: LogLevel.DEBUG,
        transports: [buf],
        maskSensitive: true,
        maskPatterns: [/SECRET-\w+/g],
        now: fixedNow,
      });

      logger.info('Value is SECRET-12345');

      expect(buf.entries[0]!.message).not.toContain('SECRET-12345');
      expect(buf.entries[0]!.message).toContain('***');
    });
  });

  // -----------------------------------------------------------------------
  // Child loggers
  // -----------------------------------------------------------------------

  describe('child loggers', () => {
    it('creates a child with additional context', () => {
      const buf = new BufferTransport();
      const parent = new Logger({
        level: LogLevel.DEBUG,
        transports: [buf],
        context: { crewId: 'c1' },
        now: fixedNow,
      });

      const child = parent.child({ agentId: 'a1' });
      child.info('from child');

      expect(buf.entries[0]!.context.crewId).toBe('c1');
      expect(buf.entries[0]!.context.agentId).toBe('a1');
    });

    it('child inherits parent level', () => {
      const buf = new BufferTransport();
      const parent = new Logger({
        level: LogLevel.WARN,
        transports: [buf],
        now: fixedNow,
      });

      const child = parent.child({ agentId: 'a1' });
      child.info('should not appear');
      child.warn('should appear');

      expect(buf.size).toBe(1);
      expect(buf.entries[0]!.levelLabel).toBe('WARN');
    });

    it('child shares transports with parent', () => {
      const buf = new BufferTransport();
      const parent = new Logger({
        level: LogLevel.DEBUG,
        transports: [buf],
        now: fixedNow,
      });

      const child = parent.child({ agentId: 'a1' });

      parent.info('from parent');
      child.info('from child');

      expect(buf.size).toBe(2);
    });

    it('child context overrides parent context', () => {
      const buf = new BufferTransport();
      const parent = new Logger({
        level: LogLevel.DEBUG,
        transports: [buf],
        context: { agentId: 'parent-agent' },
        now: fixedNow,
      });

      const child = parent.child({ agentId: 'child-agent' });
      child.info('msg');

      expect(buf.entries[0]!.context.agentId).toBe('child-agent');
    });

    it('child inherits masking config', () => {
      const buf = new BufferTransport();
      const parent = new Logger({
        level: LogLevel.DEBUG,
        transports: [buf],
        maskSensitive: true,
        now: fixedNow,
      });

      const child = parent.child({ agentId: 'a1' });
      child.info('key sk-abcdefghijklmnopqrstuvwxyz here');

      expect(buf.entries[0]!.message).toContain('***');
    });
  });

  // -----------------------------------------------------------------------
  // log() method
  // -----------------------------------------------------------------------

  describe('log() method', () => {
    it('logs at specified level', () => {
      const buf = new BufferTransport();
      const logger = new Logger({
        level: LogLevel.DEBUG,
        transports: [buf],
        now: fixedNow,
      });

      logger.log(LogLevel.WARN, 'custom level', { taskId: 't1' });

      expect(buf.entries[0]!.level).toBe(LogLevel.WARN);
      expect(buf.entries[0]!.levelLabel).toBe('WARN');
      expect(buf.entries[0]!.context.taskId).toBe('t1');
    });

    it('log() respects level filter', () => {
      const buf = new BufferTransport();
      const logger = new Logger({
        level: LogLevel.ERROR,
        transports: [buf],
        now: fixedNow,
      });

      logger.log(LogLevel.INFO, 'should not appear');
      expect(buf.size).toBe(0);

      logger.log(LogLevel.ERROR, 'should appear');
      expect(buf.size).toBe(1);
    });

    it('log() passes error', () => {
      const buf = new BufferTransport();
      const logger = new Logger({
        level: LogLevel.DEBUG,
        transports: [buf],
        now: fixedNow,
      });

      const err = new Error('test');
      logger.log(LogLevel.ERROR, 'err', {}, err);

      expect(buf.entries[0]!.error).toBe(err);
    });
  });
});

// ---------------------------------------------------------------------------
// Factory functions
// ---------------------------------------------------------------------------

describe('createAgentLogger', () => {
  it('creates a logger with agentId in context', () => {
    const buf = new BufferTransport();
    const logger = createAgentLogger('agent-1', {
      transports: [buf],
      now: () => '2026-01-01T00:00:00.000Z',
    });

    logger.info('agent log');

    expect(buf.entries[0]!.context.agentId).toBe('agent-1');
  });

  it('merges with additional config context', () => {
    const buf = new BufferTransport();
    const logger = createAgentLogger('agent-1', {
      transports: [buf],
      context: { crewId: 'crew-1' },
      now: () => '2026-01-01T00:00:00.000Z',
    });

    logger.info('merged');

    expect(buf.entries[0]!.context.agentId).toBe('agent-1');
    expect(buf.entries[0]!.context.crewId).toBe('crew-1');
  });
});

describe('createCrewLogger', () => {
  it('creates a logger with crewId in context', () => {
    const buf = new BufferTransport();
    const logger = createCrewLogger('crew-1', {
      transports: [buf],
      now: () => '2026-01-01T00:00:00.000Z',
    });

    logger.info('crew log');

    expect(buf.entries[0]!.context.crewId).toBe('crew-1');
  });
});

describe('createSilentLogger', () => {
  it('creates a logger that emits nothing', () => {
    const logger = createSilentLogger();

    expect(logger.level).toBe(LogLevel.SILENT);
    expect(logger.transports).toHaveLength(0);

    // Should not throw
    logger.debug('d');
    logger.info('i');
    logger.warn('w');
    logger.error('e');
  });
});
