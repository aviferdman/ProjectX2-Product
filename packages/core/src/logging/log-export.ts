/**
 * Log export utilities for the Crewspace framework.
 *
 * Provides transports and helper functions for exporting log entries
 * to files and stdout in both human-readable and JSON formats.
 *
 * @packageDocumentation
 */

import { writeFileSync, appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import type { LogEntry, LogTransport } from './logger.js';
import { LogLevel } from './logger.js';

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

/** Output format for log export. */
export type LogExportFormat = 'text' | 'json';

/**
 * Format a single log entry as a human-readable text line.
 *
 * Output format: `[timestamp] [LEVEL] [context...] message`
 */
export function formatLogEntryAsText(entry: LogEntry): string {
  const parts = [`[${entry.timestamp}]`, `[${entry.levelLabel}]`];

  if (entry.context.agentId) parts.push(`[agent:${entry.context.agentId}]`);
  if (entry.context.taskId) parts.push(`[task:${entry.context.taskId}]`);
  if (entry.context.crewId) parts.push(`[crew:${entry.context.crewId}]`);

  parts.push(entry.message);

  let line = parts.join(' ');

  if (entry.error?.stack) {
    line += '\n' + entry.error.stack;
  }

  return line;
}

/**
 * Format a single log entry as a JSON string (one line per entry).
 *
 * Error objects are serialized as `{ message, stack }`.
 */
export function formatLogEntryAsJson(entry: LogEntry): string {
  const obj: Record<string, unknown> = {
    timestamp: entry.timestamp,
    level: entry.level,
    levelLabel: entry.levelLabel,
    message: entry.message,
    context: entry.context,
  };

  if (entry.error) {
    obj.error = {
      message: entry.error.message,
      stack: entry.error.stack,
    };
  }

  return JSON.stringify(obj);
}

// ---------------------------------------------------------------------------
// StdoutTransport
// ---------------------------------------------------------------------------

/** Configuration for the {@link StdoutTransport}. */
export interface StdoutTransportConfig {
  /** Output format (default: 'text'). */
  readonly format?: LogExportFormat;
}

/**
 * Stdout transport — writes log entries directly to `process.stdout`.
 *
 * Unlike {@link import('./logger.js').ConsoleTransport | ConsoleTransport}
 * which uses `console.log/warn/error` (and routes errors to stderr),
 * this transport writes **all** entries to stdout, making it suitable
 * for piping and redirection.
 *
 * @example
 * ```typescript
 * import { Logger, LogLevel, StdoutTransport } from '@crewspace/core';
 *
 * const logger = new Logger({
 *   level: LogLevel.DEBUG,
 *   transports: [new StdoutTransport()],
 * });
 *
 * logger.info('All output goes to stdout');
 * ```
 */
export class StdoutTransport implements LogTransport {
  public readonly name = 'stdout';
  private readonly _format: LogExportFormat;

  constructor(config?: StdoutTransportConfig) {
    this._format = config?.format ?? 'text';
  }

  /** Write a log entry to process.stdout. */
  write(entry: LogEntry): void {
    const line =
      this._format === 'json'
        ? formatLogEntryAsJson(entry)
        : formatLogEntryAsText(entry);

    process.stdout.write(line + '\n');
  }
}

// ---------------------------------------------------------------------------
// FileTransport
// ---------------------------------------------------------------------------

/** Configuration for the {@link FileTransport}. */
export interface FileTransportConfig {
  /** Absolute or relative file path to write to. */
  readonly filePath: string;
  /** Output format (default: 'text'). */
  readonly format?: LogExportFormat;
  /** Create parent directories if they don't exist (default: true). */
  readonly mkdir?: boolean;
  /**
   * Injectable write function (for testing). Defaults to `fs.appendFileSync`.
   * Signature: `(path: string, data: string) => void`
   */
  readonly _appendFile?: (path: string, data: string) => void;
  /**
   * Injectable mkdir function (for testing). Defaults to `fs.mkdirSync`.
   */
  readonly _mkdirSync?: (path: string, options: { recursive: boolean }) => void;
}

/**
 * File transport — appends log entries to a file on disk.
 *
 * Entries are appended one per line, in either human-readable text
 * or newline-delimited JSON (NDJSON) format.
 *
 * @example
 * ```typescript
 * import { Logger, LogLevel, FileTransport } from '@crewspace/core';
 *
 * const logger = new Logger({
 *   level: LogLevel.DEBUG,
 *   transports: [new FileTransport({ filePath: './app.log' })],
 * });
 *
 * logger.info('This is written to app.log');
 * ```
 */
export class FileTransport implements LogTransport {
  public readonly name = 'file';
  private readonly _filePath: string;
  private readonly _format: LogExportFormat;
  private readonly _appendFile: (path: string, data: string) => void;
  private _initialized = false;
  private readonly _mkdir: boolean;
  private readonly _mkdirSync: (path: string, options: { recursive: boolean }) => void;

  constructor(config: FileTransportConfig) {
    this._filePath = config.filePath;
    this._format = config.format ?? 'text';
    this._mkdir = config.mkdir ?? true;
    this._appendFile = config._appendFile ?? ((p, d) => appendFileSync(p, d, 'utf-8'));
    this._mkdirSync = config._mkdirSync ?? mkdirSync;
  }

  /** The file path this transport writes to. */
  get filePath(): string {
    return this._filePath;
  }

  /** Append a formatted log entry to the file. */
  write(entry: LogEntry): void {
    if (!this._initialized && this._mkdir) {
      this._mkdirSync(dirname(this._filePath), { recursive: true });
      this._initialized = true;
    }

    const line =
      this._format === 'json'
        ? formatLogEntryAsJson(entry)
        : formatLogEntryAsText(entry);

    this._appendFile(this._filePath, line + '\n');
  }
}

// ---------------------------------------------------------------------------
// Export functions
// ---------------------------------------------------------------------------

/** Options for {@link exportLogsToFile}. */
export interface ExportLogsToFileOptions {
  /** Output format (default: 'json'). */
  readonly format?: LogExportFormat;
  /** Minimum log level to include (default: include all). */
  readonly minLevel?: LogLevel;
  /** Create parent directories if they don't exist (default: true). */
  readonly mkdir?: boolean;
  /**
   * Injectable write function (for testing). Defaults to `fs.writeFileSync`.
   */
  readonly _writeFile?: (path: string, data: string) => void;
  /**
   * Injectable mkdir function (for testing). Defaults to `fs.mkdirSync`.
   */
  readonly _mkdirSync?: (path: string, options: { recursive: boolean }) => void;
}

/**
 * Export an array of log entries to a file.
 *
 * By default writes newline-delimited JSON (one JSON object per line).
 * Use `format: 'text'` for human-readable output.
 *
 * @param entries  - The log entries to export
 * @param filePath - Destination file path
 * @param options  - Export options
 * @returns The number of entries written
 *
 * @example
 * ```typescript
 * import { BufferTransport, Logger, exportLogsToFile } from '@crewspace/core';
 *
 * const buffer = new BufferTransport();
 * const logger = new Logger({ transports: [buffer] });
 *
 * logger.info('Hello');
 * logger.warn('Watch out');
 *
 * exportLogsToFile(buffer.entries, './logs/output.log');
 * ```
 */
export function exportLogsToFile(
  entries: readonly LogEntry[],
  filePath: string,
  options?: ExportLogsToFileOptions,
): number {
  const format = options?.format ?? 'json';
  const minLevel = options?.minLevel;
  const shouldMkdir = options?.mkdir ?? true;
  const writeFn = options?._writeFile ?? ((p: string, d: string) => writeFileSync(p, d, 'utf-8'));
  const mkdirFn = options?._mkdirSync ?? mkdirSync;

  if (shouldMkdir) {
    mkdirFn(dirname(filePath), { recursive: true });
  }

  const filtered =
    minLevel !== undefined
      ? entries.filter((e) => e.level >= minLevel)
      : entries;

  const formatter =
    format === 'json' ? formatLogEntryAsJson : formatLogEntryAsText;

  const content = filtered.map((e) => formatter(e)).join('\n') + (filtered.length > 0 ? '\n' : '');

  writeFn(filePath, content);

  return filtered.length;
}

/** Options for {@link exportLogsToStdout}. */
export interface ExportLogsToStdoutOptions {
  /** Output format (default: 'text'). */
  readonly format?: LogExportFormat;
  /** Minimum log level to include (default: include all). */
  readonly minLevel?: LogLevel;
  /**
   * Injectable write function (for testing). Defaults to `process.stdout.write`.
   */
  readonly _write?: (data: string) => void;
}

/**
 * Export an array of log entries to stdout.
 *
 * @param entries - The log entries to export
 * @param options - Export options
 * @returns The number of entries written
 *
 * @example
 * ```typescript
 * import { BufferTransport, Logger, exportLogsToStdout } from '@crewspace/core';
 *
 * const buffer = new BufferTransport();
 * const logger = new Logger({ transports: [buffer] });
 *
 * logger.info('Hello');
 *
 * // Dump all buffered logs to stdout
 * exportLogsToStdout(buffer.entries);
 * ```
 */
export function exportLogsToStdout(
  entries: readonly LogEntry[],
  options?: ExportLogsToStdoutOptions,
): number {
  const format = options?.format ?? 'text';
  const minLevel = options?.minLevel;
  const writeFn = options?._write ?? ((data: string) => process.stdout.write(data));

  const filtered =
    minLevel !== undefined
      ? entries.filter((e) => e.level >= minLevel)
      : entries;

  const formatter =
    format === 'json' ? formatLogEntryAsJson : formatLogEntryAsText;

  for (const entry of filtered) {
    writeFn(formatter(entry) + '\n');
  }

  return filtered.length;
}
