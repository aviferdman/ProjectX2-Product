/**
 * Structured logging for the Crewspace framework.
 *
 * Provides a lightweight, zero-dependency logger with:
 * - Log levels (DEBUG, INFO, WARN, ERROR)
 * - Structured log entries with metadata (agent, task, action context)
 * - Pluggable transports (console, buffer, custom)
 * - Sensitive data masking
 * - Child loggers with inherited context
 *
 * @packageDocumentation
 */

// ---------------------------------------------------------------------------
// Log Levels
// ---------------------------------------------------------------------------

/** Numeric log levels — lower is more verbose. */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

/** Map from string name to numeric level. */
const LEVEL_NAMES: Record<string, LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
  silent: LogLevel.SILENT,
};

/** Reverse map from numeric level to string label. */
const LEVEL_LABELS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.SILENT]: 'SILENT',
};

/**
 * Parse a string log level name to its numeric value.
 * Returns undefined if the name is not recognized.
 */
export function parseLogLevel(name: string): LogLevel | undefined {
  return LEVEL_NAMES[name.toLowerCase()];
}

/**
 * Get the string label for a numeric log level.
 */
export function getLogLevelLabel(level: LogLevel): string {
  return LEVEL_LABELS[level] ?? 'UNKNOWN';
}

// ---------------------------------------------------------------------------
// Log Entry
// ---------------------------------------------------------------------------

/** Structured metadata attached to a log entry. */
export interface LogContext {
  /** Agent ID producing this log. */
  readonly agentId?: string;
  /** Task ID being executed. */
  readonly taskId?: string;
  /** Crew ID orchestrating. */
  readonly crewId?: string;
  /** Arbitrary key-value metadata. */
  readonly [key: string]: string | number | boolean | undefined;
}

/** A single structured log entry. */
export interface LogEntry {
  /** Numeric log level. */
  readonly level: LogLevel;
  /** Human-readable level label. */
  readonly levelLabel: string;
  /** Log message. */
  readonly message: string;
  /** ISO-8601 timestamp. */
  readonly timestamp: string;
  /** Structured context metadata. */
  readonly context: Readonly<LogContext>;
  /** Optional error associated with this entry. */
  readonly error?: Error;
}

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

/**
 * A log transport receives structured log entries and writes them
 * to a destination (console, file, buffer, remote service, etc.).
 */
export interface LogTransport {
  /** Human-readable name of this transport. */
  readonly name: string;
  /** Write a log entry. */
  write(entry: LogEntry): void;
}

/**
 * Console transport — writes formatted log entries to stdout/stderr.
 */
export class ConsoleTransport implements LogTransport {
  public readonly name = 'console';

  /** Write a formatted log entry to the console (stderr for errors, stdout otherwise). */
  write(entry: LogEntry): void {
    const parts = [`[${entry.timestamp}]`, `[${entry.levelLabel}]`];

    // Add context fields
    if (entry.context.agentId) parts.push(`[agent:${entry.context.agentId}]`);
    if (entry.context.taskId) parts.push(`[task:${entry.context.taskId}]`);
    if (entry.context.crewId) parts.push(`[crew:${entry.context.crewId}]`);

    parts.push(entry.message);

    const line = parts.join(' ');

    if (entry.level >= LogLevel.ERROR) {
      // eslint-disable-next-line no-console
      console.error(line);
    } else if (entry.level >= LogLevel.WARN) {
      // eslint-disable-next-line no-console
      console.warn(line);
    } else {
      // eslint-disable-next-line no-console
      console.log(line);
    }

    if (entry.error?.stack) {
      // eslint-disable-next-line no-console
      console.error(entry.error.stack);
    }
  }
}

/**
 * Buffer transport — stores log entries in memory for testing/inspection.
 */
export class BufferTransport implements LogTransport {
  public readonly name = 'buffer';
  private readonly _entries: LogEntry[] = [];

  /** Append a log entry to the in-memory buffer. */
  write(entry: LogEntry): void {
    this._entries.push(entry);
  }

  /** Get all buffered entries. */
  get entries(): readonly LogEntry[] {
    return this._entries;
  }

  /** Clear the buffer. */
  clear(): void {
    this._entries.length = 0;
  }

  /** Number of buffered entries. */
  get size(): number {
    return this._entries.length;
  }
}

// ---------------------------------------------------------------------------
// Sensitive data masking
// ---------------------------------------------------------------------------

/** Default patterns that look like sensitive data. */
const DEFAULT_MASK_PATTERNS: RegExp[] = [
  // API keys (sk-..., pk-..., key-...)
  /\b(sk|pk|key)-[A-Za-z0-9]{20,}\b/g,
  // Bearer tokens
  /Bearer\s+[A-Za-z0-9._-]+/gi,
  // Generic long hex/base64 secrets (32+ chars)
  /\b[A-Fa-f0-9]{32,}\b/g,
  // Email addresses
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
];

const MASK_REPLACEMENT = '***';

/**
 * Mask sensitive patterns in a string.
 *
 * @param text     - The input string
 * @param patterns - RegExp patterns to mask (defaults to common secret patterns)
 * @returns The masked string
 */
export function maskSensitiveData(
  text: string,
  patterns: readonly RegExp[] = DEFAULT_MASK_PATTERNS,
): string {
  let result = text;
  for (const pattern of patterns) {
    // Reset lastIndex for global regexps
    const re = new RegExp(pattern.source, pattern.flags);
    result = result.replace(re, MASK_REPLACEMENT);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Logger Configuration
// ---------------------------------------------------------------------------

/** Configuration for creating a {@link Logger}. */
export interface LoggerConfig {
  /** Minimum log level to emit (default: INFO). */
  readonly level?: LogLevel;
  /** Transports to write log entries to (default: ConsoleTransport). */
  readonly transports?: readonly LogTransport[];
  /** Default context applied to all log entries from this logger. */
  readonly context?: LogContext;
  /** Enable sensitive data masking on messages (default: false). */
  readonly maskSensitive?: boolean;
  /** Custom masking patterns (used when maskSensitive is true). */
  readonly maskPatterns?: readonly RegExp[];
  /** Injectable timestamp function (for testing). Defaults to `() => new Date().toISOString()`. */
  readonly now?: () => string;
}

// ---------------------------------------------------------------------------
// Logger
// ---------------------------------------------------------------------------

/**
 * Structured logger for the Crewspace framework.
 *
 * Supports log levels, structured context, pluggable transports,
 * and optional sensitive data masking.
 *
 * @example
 * ```typescript
 * import { Logger, LogLevel } from '@crewspace/core';
 *
 * const logger = new Logger({ level: LogLevel.DEBUG });
 * logger.info('Agent started', { agentId: 'agent-1' });
 * logger.error('Task failed', { taskId: 'task-1' }, new Error('timeout'));
 * ```
 */
export class Logger {
  private _level: LogLevel;
  private readonly _transports: LogTransport[];
  private readonly _context: LogContext;
  private readonly _maskSensitive: boolean;
  private readonly _maskPatterns: readonly RegExp[];
  private readonly _now: () => string;

  constructor(config?: LoggerConfig) {
    this._level = config?.level ?? LogLevel.INFO;
    this._transports = config?.transports ? [...config.transports] : [new ConsoleTransport()];
    this._context = config?.context ?? {};
    this._maskSensitive = config?.maskSensitive ?? false;
    this._maskPatterns = config?.maskPatterns ?? DEFAULT_MASK_PATTERNS;
    this._now = config?.now ?? (() => new Date().toISOString());
  }

  /** Current minimum log level. */
  get level(): LogLevel {
    return this._level;
  }

  /** Update the minimum log level at runtime. */
  set level(level: LogLevel) {
    this._level = level;
  }

  /** Registered transports (read-only snapshot). */
  get transports(): readonly LogTransport[] {
    return [...this._transports];
  }

  /** The logger's default context. */
  get context(): Readonly<LogContext> {
    return this._context;
  }

  /**
   * Add a transport to this logger.
   */
  addTransport(transport: LogTransport): this {
    this._transports.push(transport);
    return this;
  }

  /**
   * Remove a transport by name.
   * @returns true if a transport was removed
   */
  removeTransport(name: string): boolean {
    const idx = this._transports.findIndex((t) => t.name === name);
    if (idx === -1) return false;
    this._transports.splice(idx, 1);
    return true;
  }

  /**
   * Check if a given log level would be emitted.
   */
  isLevelEnabled(level: LogLevel): boolean {
    return level >= this._level;
  }

  /**
   * Create a child logger with additional default context.
   *
   * The child inherits this logger's configuration and transports,
   * with the context merged (child overrides parent on conflict).
   *
   * @param context - Additional context for the child logger
   * @returns A new Logger instance
   */
  child(context: LogContext): Logger {
    return new Logger({
      level: this._level,
      transports: this._transports,
      context: { ...this._context, ...context },
      maskSensitive: this._maskSensitive,
      maskPatterns: this._maskPatterns,
      now: this._now,
    });
  }

  /**
   * Log a DEBUG message.
   */
  debug(message: string, context?: LogContext): void {
    this._log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log an INFO message.
   */
  info(message: string, context?: LogContext): void {
    this._log(LogLevel.INFO, message, context);
  }

  /**
   * Log a WARN message.
   */
  warn(message: string, context?: LogContext, error?: Error): void {
    this._log(LogLevel.WARN, message, context, error);
  }

  /**
   * Log an ERROR message.
   */
  error(message: string, context?: LogContext, error?: Error): void {
    this._log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Log at an arbitrary level.
   */
  log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    this._log(level, message, context, error);
  }

  // -----------------------------------------------------------------------
  // Internal
  // -----------------------------------------------------------------------

  private _log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (level < this._level) return;

    const finalMessage = this._maskSensitive
      ? maskSensitiveData(message, this._maskPatterns)
      : message;

    const entry: LogEntry = {
      level,
      levelLabel: getLogLevelLabel(level),
      message: finalMessage,
      timestamp: this._now(),
      context: { ...this._context, ...context },
      ...(error !== undefined && { error }),
    };

    for (const transport of this._transports) {
      transport.write(entry);
    }
  }
}

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

/**
 * Create a logger preconfigured for a specific agent.
 */
export function createAgentLogger(agentId: string, config?: LoggerConfig): Logger {
  return new Logger({
    ...config,
    context: { ...config?.context, agentId },
  });
}

/**
 * Create a logger preconfigured for a specific crew.
 */
export function createCrewLogger(crewId: string, config?: LoggerConfig): Logger {
  return new Logger({
    ...config,
    context: { ...config?.context, crewId },
  });
}

/**
 * Create a no-op logger that discards all output (level SILENT).
 */
export function createSilentLogger(): Logger {
  return new Logger({ level: LogLevel.SILENT, transports: [] });
}
