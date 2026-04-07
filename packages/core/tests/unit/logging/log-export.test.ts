/**
 * Tests for the log export module.
 *
 * Covers: FileTransport, StdoutTransport, formatLogEntryAsText,
 * formatLogEntryAsJson, exportLogsToFile, exportLogsToStdout.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  BufferTransport,
  exportLogsToFile,
  exportLogsToStdout,
  FileTransport,
  formatLogEntryAsJson,
  formatLogEntryAsText,
  Logger,
  LogLevel,
  StdoutTransport,
} from '../../../src/logging/index.js';

import type { LogEntry } from '../../../src/logging/index.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const fixedNow = () => '2026-01-01T00:00:00.000Z';

function makeEntry(overrides?: Partial<LogEntry>): LogEntry {
  return {
    level: LogLevel.INFO,
    levelLabel: 'INFO',
    message: 'test message',
    timestamp: '2026-01-01T00:00:00.000Z',
    context: {},
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// formatLogEntryAsText
// ---------------------------------------------------------------------------

describe('formatLogEntryAsText', () => {
  it('formats a basic entry', () => {
    const entry = makeEntry();
    const result = formatLogEntryAsText(entry);

    expect(result).toBe('[2026-01-01T00:00:00.000Z] [INFO] test message');
  });

  it('includes agent/task/crew context', () => {
    const entry = makeEntry({
      context: { agentId: 'a1', taskId: 't1', crewId: 'c1' },
    });
    const result = formatLogEntryAsText(entry);

    expect(result).toContain('[agent:a1]');
    expect(result).toContain('[task:t1]');
    expect(result).toContain('[crew:c1]');
  });

  it('appends error stack when present', () => {
    const err = new Error('boom');
    const entry = makeEntry({ error: err });
    const result = formatLogEntryAsText(entry);

    expect(result).toContain('test message');
    expect(result).toContain(err.stack!);
  });

  it('handles entry without error gracefully', () => {
    const entry = makeEntry();
    const result = formatLogEntryAsText(entry);

    expect(result).not.toContain('undefined');
    expect(result).not.toContain('null');
  });
});

// ---------------------------------------------------------------------------
// formatLogEntryAsJson
// ---------------------------------------------------------------------------

describe('formatLogEntryAsJson', () => {
  it('produces valid JSON', () => {
    const entry = makeEntry();
    const result = formatLogEntryAsJson(entry);
    const parsed = JSON.parse(result);

    expect(parsed.timestamp).toBe('2026-01-01T00:00:00.000Z');
    expect(parsed.level).toBe(LogLevel.INFO);
    expect(parsed.levelLabel).toBe('INFO');
    expect(parsed.message).toBe('test message');
    expect(parsed.context).toEqual({});
  });

  it('includes context fields', () => {
    const entry = makeEntry({
      context: { agentId: 'agent-x', taskId: 'task-y' },
    });
    const parsed = JSON.parse(formatLogEntryAsJson(entry));

    expect(parsed.context.agentId).toBe('agent-x');
    expect(parsed.context.taskId).toBe('task-y');
  });

  it('includes error when present', () => {
    const err = new Error('boom');
    const entry = makeEntry({ error: err });
    const parsed = JSON.parse(formatLogEntryAsJson(entry));

    expect(parsed.error.message).toBe('boom');
    expect(parsed.error.stack).toBeDefined();
  });

  it('omits error key when no error', () => {
    const entry = makeEntry();
    const parsed = JSON.parse(formatLogEntryAsJson(entry));

    expect(parsed.error).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// StdoutTransport
// ---------------------------------------------------------------------------

describe('StdoutTransport', () => {
  it('has name "stdout"', () => {
    const transport = new StdoutTransport();
    expect(transport.name).toBe('stdout');
  });

  it('writes text format to stdout by default', () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const transport = new StdoutTransport();

    transport.write(makeEntry());

    expect(writeSpy).toHaveBeenCalledTimes(1);
    const output = writeSpy.mock.calls[0]![0] as string;
    expect(output).toContain('[INFO]');
    expect(output).toContain('test message');
    expect(output.endsWith('\n')).toBe(true);

    writeSpy.mockRestore();
  });

  it('writes json format when configured', () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const transport = new StdoutTransport({ format: 'json' });

    transport.write(makeEntry());

    expect(writeSpy).toHaveBeenCalledTimes(1);
    const output = writeSpy.mock.calls[0]![0] as string;
    const parsed = JSON.parse(output.trim());
    expect(parsed.message).toBe('test message');

    writeSpy.mockRestore();
  });

  it('works as a Logger transport', () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const logger = new Logger({
      level: LogLevel.DEBUG,
      transports: [new StdoutTransport()],
      now: fixedNow,
    });

    logger.info('hello stdout');

    const calls = writeSpy.mock.calls.map((c) => c[0] as string);
    const matching = calls.filter((c) => c.includes('hello stdout'));
    expect(matching).toHaveLength(1);

    writeSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// FileTransport
// ---------------------------------------------------------------------------

describe('FileTransport', () => {
  it('has name "file"', () => {
    const transport = new FileTransport({
      filePath: '/tmp/test.log',
      _appendFile: vi.fn(),
      _mkdirSync: vi.fn(),
    });
    expect(transport.name).toBe('file');
  });

  it('exposes filePath', () => {
    const transport = new FileTransport({
      filePath: '/tmp/test.log',
      _appendFile: vi.fn(),
      _mkdirSync: vi.fn(),
    });
    expect(transport.filePath).toBe('/tmp/test.log');
  });

  it('writes text format by default', () => {
    const appendFile = vi.fn();
    const transport = new FileTransport({
      filePath: '/tmp/test.log',
      _appendFile: appendFile,
      _mkdirSync: vi.fn(),
    });

    transport.write(makeEntry());

    expect(appendFile).toHaveBeenCalledTimes(1);
    expect(appendFile.mock.calls[0]![0]).toBe('/tmp/test.log');
    const data = appendFile.mock.calls[0]![1] as string;
    expect(data).toContain('[INFO]');
    expect(data).toContain('test message');
    expect(data.endsWith('\n')).toBe(true);
  });

  it('writes json format when configured', () => {
    const appendFile = vi.fn();
    const transport = new FileTransport({
      filePath: '/tmp/test.log',
      format: 'json',
      _appendFile: appendFile,
      _mkdirSync: vi.fn(),
    });

    transport.write(makeEntry());

    const data = appendFile.mock.calls[0]![1] as string;
    const parsed = JSON.parse(data.trim());
    expect(parsed.message).toBe('test message');
  });

  it('creates parent directories on first write', () => {
    const mkdirSync = vi.fn();
    const transport = new FileTransport({
      filePath: '/tmp/logs/test.log',
      _appendFile: vi.fn(),
      _mkdirSync: mkdirSync,
    });

    transport.write(makeEntry());
    transport.write(makeEntry());

    // mkdir called only once (on first write)
    expect(mkdirSync).toHaveBeenCalledTimes(1);
    expect(mkdirSync).toHaveBeenCalledWith(
      expect.any(String),
      { recursive: true },
    );
  });

  it('skips mkdir when disabled', () => {
    const mkdirSync = vi.fn();
    const transport = new FileTransport({
      filePath: '/tmp/test.log',
      mkdir: false,
      _appendFile: vi.fn(),
      _mkdirSync: mkdirSync,
    });

    transport.write(makeEntry());

    expect(mkdirSync).not.toHaveBeenCalled();
  });

  it('works as a Logger transport', () => {
    const appendFile = vi.fn();
    const logger = new Logger({
      level: LogLevel.DEBUG,
      transports: [
        new FileTransport({
          filePath: '/tmp/app.log',
          _appendFile: appendFile,
          _mkdirSync: vi.fn(),
        }),
      ],
      now: fixedNow,
    });

    logger.info('logged to file');
    logger.warn('warning');

    expect(appendFile).toHaveBeenCalledTimes(2);
    expect((appendFile.mock.calls[0]![1] as string)).toContain('logged to file');
    expect((appendFile.mock.calls[1]![1] as string)).toContain('warning');
  });
});

// ---------------------------------------------------------------------------
// exportLogsToFile
// ---------------------------------------------------------------------------

describe('exportLogsToFile', () => {
  it('exports entries as JSON by default', () => {
    const writeFile = vi.fn();
    const entries: LogEntry[] = [
      makeEntry({ message: 'first' }),
      makeEntry({ message: 'second', level: LogLevel.WARN, levelLabel: 'WARN' }),
    ];

    const count = exportLogsToFile(entries, '/tmp/export.json', {
      _writeFile: writeFile,
      _mkdirSync: vi.fn(),
    });

    expect(count).toBe(2);
    expect(writeFile).toHaveBeenCalledTimes(1);

    const data = writeFile.mock.calls[0]![1] as string;
    const lines = data.trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]!).message).toBe('first');
    expect(JSON.parse(lines[1]!).message).toBe('second');
  });

  it('exports entries as text when specified', () => {
    const writeFile = vi.fn();
    const entries = [makeEntry({ message: 'hello text' })];

    exportLogsToFile(entries, '/tmp/export.log', {
      format: 'text',
      _writeFile: writeFile,
      _mkdirSync: vi.fn(),
    });

    const data = writeFile.mock.calls[0]![1] as string;
    expect(data).toContain('[INFO]');
    expect(data).toContain('hello text');
  });

  it('filters by minLevel', () => {
    const writeFile = vi.fn();
    const entries = [
      makeEntry({ message: 'debug', level: LogLevel.DEBUG, levelLabel: 'DEBUG' }),
      makeEntry({ message: 'info', level: LogLevel.INFO, levelLabel: 'INFO' }),
      makeEntry({ message: 'warn', level: LogLevel.WARN, levelLabel: 'WARN' }),
      makeEntry({ message: 'error', level: LogLevel.ERROR, levelLabel: 'ERROR' }),
    ];

    const count = exportLogsToFile(entries, '/tmp/export.json', {
      minLevel: LogLevel.WARN,
      _writeFile: writeFile,
      _mkdirSync: vi.fn(),
    });

    expect(count).toBe(2);
    const data = writeFile.mock.calls[0]![1] as string;
    const lines = data.trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]!).levelLabel).toBe('WARN');
    expect(JSON.parse(lines[1]!).levelLabel).toBe('ERROR');
  });

  it('creates directories by default', () => {
    const mkdirSync = vi.fn();
    exportLogsToFile([makeEntry()], '/tmp/deep/nested/export.json', {
      _writeFile: vi.fn(),
      _mkdirSync: mkdirSync,
    });

    expect(mkdirSync).toHaveBeenCalledTimes(1);
  });

  it('skips mkdir when disabled', () => {
    const mkdirSync = vi.fn();
    exportLogsToFile([makeEntry()], '/tmp/export.json', {
      mkdir: false,
      _writeFile: vi.fn(),
      _mkdirSync: mkdirSync,
    });

    expect(mkdirSync).not.toHaveBeenCalled();
  });

  it('handles empty entries array', () => {
    const writeFile = vi.fn();
    const count = exportLogsToFile([], '/tmp/export.json', {
      _writeFile: writeFile,
      _mkdirSync: vi.fn(),
    });

    expect(count).toBe(0);
    expect(writeFile).toHaveBeenCalledTimes(1);
    expect(writeFile.mock.calls[0]![1]).toBe('');
  });

  it('integrates with BufferTransport', () => {
    const writeFile = vi.fn();
    const buffer = new BufferTransport();
    const logger = new Logger({
      level: LogLevel.DEBUG,
      transports: [buffer],
      now: fixedNow,
    });

    logger.info('entry 1');
    logger.warn('entry 2');
    logger.error('entry 3');

    const count = exportLogsToFile(buffer.entries, '/tmp/export.json', {
      _writeFile: writeFile,
      _mkdirSync: vi.fn(),
    });

    expect(count).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// exportLogsToStdout
// ---------------------------------------------------------------------------

describe('exportLogsToStdout', () => {
  it('exports entries as text by default', () => {
    const written: string[] = [];
    const entries = [
      makeEntry({ message: 'first' }),
      makeEntry({ message: 'second' }),
    ];

    const count = exportLogsToStdout(entries, {
      _write: (data) => written.push(data),
    });

    expect(count).toBe(2);
    expect(written).toHaveLength(2);
    expect(written[0]).toContain('first');
    expect(written[1]).toContain('second');
  });

  it('exports entries as JSON when specified', () => {
    const written: string[] = [];
    const entries = [makeEntry({ message: 'json-msg' })];

    exportLogsToStdout(entries, {
      format: 'json',
      _write: (data) => written.push(data),
    });

    const parsed = JSON.parse(written[0]!.trim());
    expect(parsed.message).toBe('json-msg');
  });

  it('filters by minLevel', () => {
    const written: string[] = [];
    const entries = [
      makeEntry({ message: 'debug', level: LogLevel.DEBUG, levelLabel: 'DEBUG' }),
      makeEntry({ message: 'error', level: LogLevel.ERROR, levelLabel: 'ERROR' }),
    ];

    const count = exportLogsToStdout(entries, {
      minLevel: LogLevel.ERROR,
      _write: (data) => written.push(data),
    });

    expect(count).toBe(1);
    expect(written[0]).toContain('error');
  });

  it('handles empty entries', () => {
    const written: string[] = [];
    const count = exportLogsToStdout([], {
      _write: (data) => written.push(data),
    });

    expect(count).toBe(0);
    expect(written).toHaveLength(0);
  });

  it('integrates with BufferTransport', () => {
    const written: string[] = [];
    const buffer = new BufferTransport();
    const logger = new Logger({
      level: LogLevel.DEBUG,
      transports: [buffer],
      now: fixedNow,
    });

    logger.info('msg 1');
    logger.error('msg 2');

    const count = exportLogsToStdout(buffer.entries, {
      _write: (data) => written.push(data),
    });

    expect(count).toBe(2);
    expect(written[0]).toContain('msg 1');
    expect(written[1]).toContain('msg 2');
  });

  it('each entry ends with newline', () => {
    const written: string[] = [];
    exportLogsToStdout([makeEntry()], {
      _write: (data) => written.push(data),
    });

    expect(written[0]!.endsWith('\n')).toBe(true);
  });
});
