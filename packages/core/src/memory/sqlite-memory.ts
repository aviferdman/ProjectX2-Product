/**
 * SQLite-backed long-term memory provider.
 *
 * Persists memory entries to disk using `better-sqlite3`. This provider
 * implements the full {@link MemoryProvider} interface with FTS5 full-text
 * search, retention policies, and event emission.
 *
 * `better-sqlite3` is an optional peer dependency — install it to use this
 * provider:
 *
 * ```bash
 * npm install better-sqlite3
 * ```
 *
 * @packageDocumentation
 */

import { EventEmitter } from 'eventemitter3';

import {
  MemoryConfigError,
  MemoryOperationError,
} from '../errors/memory-errors.js';
import type {
  MemoryConfig,
  MemoryEntry,
  MemoryEventMap,
  MemoryMetadata,
  MemoryProvider,
  MemoryQueryOptions,
  MemoryQueryResult,
  MemoryRetentionPolicy,
} from '../types/memory.js';
import { MemoryNamespace } from '../types/memory.js';

// ---------------------------------------------------------------------------
// Types for better-sqlite3 (avoids hard dependency on @types/better-sqlite3)
// ---------------------------------------------------------------------------

interface SqliteDatabase {
  prepare(sql: string): SqliteStatement;
  exec(sql: string): SqliteDatabase;
  pragma(pragma: string): unknown;
  close(): void;
  transaction<T>(fn: () => T): () => T;
}

interface SqliteStatement {
  run(...params: unknown[]): SqliteRunResult;
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
}

interface SqliteRunResult {
  changes: number;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Configuration specific to the SQLite memory provider. */
export interface SqliteMemoryConfig extends MemoryConfig {
  /** Path to the SQLite database file. Use `:memory:` for an in-memory database. */
  readonly dbPath?: string;
  /** Enable WAL (Write-Ahead Logging) mode for better concurrent read performance. Default: true. */
  readonly walMode?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_MAX_ENTRIES = 10_000;
const DEFAULT_QUERY_LIMIT = 50;
const MAX_QUERY_LIMIT = 500;
const DEFAULT_DB_PATH = ':memory:';

// ---------------------------------------------------------------------------
// Internal row type
// ---------------------------------------------------------------------------

interface MemoryRow {
  id: string;
  content: string;
  role: string;
  namespace: string;
  created_at: string;
  metadata: string | null;
}

// ---------------------------------------------------------------------------
// SqliteMemory
// ---------------------------------------------------------------------------

/**
 * Long-term memory provider backed by SQLite.
 *
 * Uses `better-sqlite3` for synchronous, high-performance SQLite access.
 * Supports FTS5 full-text search for the `search()` method.
 *
 * @example
 * ```typescript
 * import { SqliteMemory } from '@crewspace/core';
 *
 * const memory = new SqliteMemory({
 *   dbPath: './agent-memory.db',
 *   retention: { maxEntries: 5000 },
 * });
 *
 * await memory.add(createMemoryEntry('Hello!', MemoryRole.USER));
 * const results = await memory.search('Hello');
 * ```
 */
export class SqliteMemory implements MemoryProvider {
  public readonly name = 'sqlite';

  private readonly _db: SqliteDatabase;
  private readonly _defaultNamespace: MemoryNamespace;
  private readonly _maxEntries: number;
  private readonly _maxAge: number;
  private readonly _emitter: EventEmitter<MemoryEventMap>;
  private _closed = false;

  constructor(config?: SqliteMemoryConfig) {
    this._emitter = new EventEmitter<MemoryEventMap>();
    this._defaultNamespace = config?.defaultNamespace ?? MemoryNamespace.AGENT;

    const retention = config?.retention;
    if (retention) {
      validateRetentionPolicy(retention);
    }

    this._maxEntries = retention?.maxEntries ?? DEFAULT_MAX_ENTRIES;
    this._maxAge = retention?.maxAge ?? 0;

    const dbPath = config?.dbPath ?? DEFAULT_DB_PATH;
    const walMode = config?.walMode ?? true;

    this._db = openDatabase(dbPath, walMode);
    this._initSchema();
  }

  /** The default namespace for entries. */
  get defaultNamespace(): MemoryNamespace {
    return this._defaultNamespace;
  }

  /** Whether the database connection is closed. */
  get closed(): boolean {
    return this._closed;
  }

  // -----------------------------------------------------------------------
  // Event system
  // -----------------------------------------------------------------------

  /** Subscribe to a memory lifecycle event. */
  on<E extends keyof MemoryEventMap>(event: E, listener: MemoryEventMap[E]): this {
    this._emitter.on(event, listener as (...args: unknown[]) => void);
    return this;
  }

  /** Unsubscribe from a memory lifecycle event. */
  off<E extends keyof MemoryEventMap>(event: E, listener: MemoryEventMap[E]): this {
    this._emitter.off(event, listener as (...args: unknown[]) => void);
    return this;
  }

  // -----------------------------------------------------------------------
  // MemoryProvider implementation
  // -----------------------------------------------------------------------

  /**
   * Add a memory entry to the SQLite database.
   *
   * Applies retention-based eviction (age and count) before inserting.
   * Also indexes the content in the FTS5 table for full-text search.
   *
   * @param entry - The memory entry to store
   * @returns The stored (frozen) entry
   * @throws {MemoryOperationError} If an entry with the same ID already exists
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async add(entry: MemoryEntry): Promise<MemoryEntry> {
    this._ensureOpen();
    validateEntry(entry);

    // Check for duplicate ID
    const existing = this._db
      .prepare('SELECT id FROM memory_entries WHERE id = ?')
      .get(entry.id) as MemoryRow | undefined;

    if (existing) {
      throw new MemoryOperationError(
        this.name,
        'add',
        `Entry with id "${entry.id}" already exists`,
      );
    }

    // Apply age-based eviction before inserting
    if (this._maxAge > 0) {
      this._evictExpired();
    }

    // Apply count-based eviction
    if (this._maxEntries > 0) {
      const currentCount = (
        this._db.prepare('SELECT COUNT(*) as cnt FROM memory_entries').get() as { cnt: number }
      ).cnt;
      if (currentCount >= this._maxEntries) {
        this._evictOldest(currentCount - this._maxEntries + 1);
      }
    }

    const metadataJson = entry.metadata ? JSON.stringify(entry.metadata) : null;

    this._db
      .prepare(
        `INSERT INTO memory_entries (id, content, role, namespace, created_at, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(entry.id, entry.content, entry.role, entry.namespace, entry.createdAt, metadataJson);

    // Insert into FTS index
    this._db
      .prepare('INSERT INTO memory_fts (entry_id, content) VALUES (?, ?)')
      .run(entry.id, entry.content);

    const stored = Object.freeze({ ...entry });
    this._emit('memory:add', stored);
    return stored;
  }

  /**
   * Retrieve a memory entry by its unique ID.
   *
   * @param id - The entry identifier
   * @returns The entry, or `undefined` if not found
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async get(id: string): Promise<MemoryEntry | undefined> {
    this._ensureOpen();
    const row = this._db.prepare('SELECT * FROM memory_entries WHERE id = ?').get(id) as
      | MemoryRow
      | undefined;

    return row ? rowToEntry(row) : undefined;
  }

  /**
   * Query entries with optional filtering, pagination, and sort order.
   *
   * @param options - Query filter options
   * @returns Matching entries and total count
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async query(options?: MemoryQueryOptions): Promise<MemoryQueryResult> {
    this._ensureOpen();
    const limit = Math.min(options?.limit ?? DEFAULT_QUERY_LIMIT, MAX_QUERY_LIMIT);
    const offset = options?.offset ?? 0;
    const sortOrder = options?.sortOrder ?? 'desc';
    const orderDir = sortOrder === 'asc' ? 'ASC' : 'DESC';
    const { sql, params } = buildFilterQuery(options);

    const countResult = this._db
      .prepare(`SELECT COUNT(*) as cnt FROM memory_entries${sql}`)
      .get(...params) as { cnt: number };

    const rows = this._db
      .prepare(`SELECT * FROM memory_entries${sql} ORDER BY created_at ${orderDir} LIMIT ? OFFSET ?`)
      .all(...params, limit, offset) as MemoryRow[];

    return {
      entries: rows.map(rowToEntry),
      total: countResult.cnt,
    };
  }

  /**
   * Search entries by text content using FTS5 full-text search.
   *
   * @param text    - The search query string
   * @param options - Optional query filters
   * @returns Matching entries and total count
   */
  async search(text: string, options?: MemoryQueryOptions): Promise<MemoryQueryResult> {
    this._ensureOpen();
    if (!text || typeof text !== 'string') {
      return { entries: [], total: 0 };
    }

    const limit = Math.min(options?.limit ?? DEFAULT_QUERY_LIMIT, MAX_QUERY_LIMIT);
    const offset = options?.offset ?? 0;
    const sortOrder = options?.sortOrder ?? 'desc';
    const orderDir = sortOrder === 'asc' ? 'ASC' : 'DESC';
    const { sql: filterSql, params: filterParams } = buildFilterQuery(options);

    // Escape FTS special characters and wrap in quotes for phrase matching
    const escapedText = escapeFtsQuery(text);

    // Use FTS5 for full-text search, joined with the main table for filtering
    const ftsJoin = ` INNER JOIN memory_fts ON memory_entries.id = memory_fts.entry_id`;
    const ftsWhere = filterSql
      ? `${filterSql} AND memory_fts.content MATCH ?`
      : ' WHERE memory_fts.content MATCH ?';

    const allParams = [...filterParams, escapedText];

    const countResult = this._db
      .prepare(`SELECT COUNT(*) as cnt FROM memory_entries${ftsJoin}${ftsWhere}`)
      .get(...allParams) as { cnt: number };

    const rows = this._db
      .prepare(
        `SELECT memory_entries.* FROM memory_entries${ftsJoin}${ftsWhere} ORDER BY memory_entries.created_at ${orderDir} LIMIT ? OFFSET ?`,
      )
      .all(...allParams, limit, offset) as MemoryRow[];

    return {
      entries: rows.map(rowToEntry),
      total: countResult.cnt,
    };
  }

  /**
   * Delete a memory entry by ID, removing it from both the main table and the FTS index.
   *
   * @param id - The entry identifier
   * @returns `true` if the entry existed and was removed
   */
  async delete(id: string): Promise<boolean> {
    this._ensureOpen();

    const result = this._db.prepare('DELETE FROM memory_entries WHERE id = ?').run(id);

    if (result.changes > 0) {
      this._db.prepare('DELETE FROM memory_fts WHERE entry_id = ?').run(id);
      this._emit('memory:delete', id);
      return true;
    }
    return false;
  }

  /**
   * Clear entries, optionally filtered by namespace.
   *
   * @param namespace - If provided, only clear entries in this namespace
   * @returns The number of entries removed
   */
  async clear(namespace?: MemoryNamespace): Promise<number> {
    this._ensureOpen();

    let count: number;

    if (namespace === undefined) {
      count = (
        this._db.prepare('SELECT COUNT(*) as cnt FROM memory_entries').get() as { cnt: number }
      ).cnt;
      this._db.exec('DELETE FROM memory_fts');
      this._db.exec('DELETE FROM memory_entries');
    } else {
      // Get IDs for FTS cleanup
      const rows = this._db
        .prepare('SELECT id FROM memory_entries WHERE namespace = ?')
        .all(namespace) as { id: string }[];

      count = rows.length;
      for (const row of rows) {
        this._db.prepare('DELETE FROM memory_fts WHERE entry_id = ?').run(row.id);
      }
      this._db.prepare('DELETE FROM memory_entries WHERE namespace = ?').run(namespace);
    }

    this._emit('memory:clear', namespace, count);
    return count;
  }

  /**
   * Count entries, optionally filtered by namespace.
   *
   * @param namespace - If provided, count only entries in this namespace
   * @returns The entry count
   */
  async count(namespace?: MemoryNamespace): Promise<number> {
    this._ensureOpen();

    if (namespace === undefined) {
      return (
        this._db.prepare('SELECT COUNT(*) as cnt FROM memory_entries').get() as { cnt: number }
      ).cnt;
    }
    return (
      this._db
        .prepare('SELECT COUNT(*) as cnt FROM memory_entries WHERE namespace = ?')
        .get(namespace) as { cnt: number }
    ).cnt;
  }

  /**
   * Close the database connection.
   * After calling this, all operations will throw.
   */
  close(): void {
    if (!this._closed) {
      this._db.close();
      this._closed = true;
    }
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  private _initSchema(): void {
    this._db.exec(`
      CREATE TABLE IF NOT EXISTS memory_entries (
        id TEXT PRIMARY KEY NOT NULL,
        content TEXT NOT NULL,
        role TEXT NOT NULL,
        namespace TEXT NOT NULL,
        created_at TEXT NOT NULL,
        metadata TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_memory_namespace ON memory_entries(namespace);
      CREATE INDEX IF NOT EXISTS idx_memory_created_at ON memory_entries(created_at);
      CREATE INDEX IF NOT EXISTS idx_memory_role ON memory_entries(role);
    `);

    // Create FTS5 virtual table for full-text search
    this._db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(
        entry_id,
        content,
        tokenize='porter unicode61'
      );
    `);
  }

  private _ensureOpen(): void {
    if (this._closed) {
      throw new MemoryOperationError(this.name, 'access', 'Database connection is closed');
    }
  }

  private _evictOldest(count: number): void {
    if (count <= 0) return;

    const rows = this._db
      .prepare(
        'SELECT id, content, role, namespace, created_at, metadata FROM memory_entries ORDER BY created_at ASC LIMIT ?',
      )
      .all(count) as MemoryRow[];

    const evicted: MemoryEntry[] = [];

    const doEvict = this._db.transaction(() => {
      for (const row of rows) {
        this._db.prepare('DELETE FROM memory_fts WHERE entry_id = ?').run(row.id);
        this._db.prepare('DELETE FROM memory_entries WHERE id = ?').run(row.id);
        evicted.push(rowToEntry(row));
      }
    });

    doEvict();

    if (evicted.length > 0) {
      this._emit('memory:evict', evicted);
    }
  }

  private _evictExpired(): void {
    const cutoffMs = Date.now() - this._maxAge;
    const cutoff = new Date(cutoffMs).toISOString();

    const rows = this._db
      .prepare(
        'SELECT id, content, role, namespace, created_at, metadata FROM memory_entries WHERE created_at < ?',
      )
      .all(cutoff) as MemoryRow[];

    if (rows.length === 0) return;

    const evicted: MemoryEntry[] = [];

    const doEvict = this._db.transaction(() => {
      for (const row of rows) {
        this._db.prepare('DELETE FROM memory_fts WHERE entry_id = ?').run(row.id);
        this._db.prepare('DELETE FROM memory_entries WHERE id = ?').run(row.id);
        evicted.push(rowToEntry(row));
      }
    });

    doEvict();

    if (evicted.length > 0) {
      this._emit('memory:evict', evicted);
    }
  }

  private _emit<E extends keyof MemoryEventMap>(
    event: E,
    ...args: Parameters<MemoryEventMap[E]>
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this._emitter.emit as (event: string, ...args: any[]) => boolean)(event, ...args);
  }
}

// ---------------------------------------------------------------------------
// Module-level helpers
// ---------------------------------------------------------------------------

function validateRetentionPolicy(policy: MemoryRetentionPolicy): void {
  if (policy.maxEntries !== undefined) {
    if (!Number.isInteger(policy.maxEntries) || policy.maxEntries < 0) {
      throw new MemoryConfigError('retention.maxEntries must be a non-negative integer');
    }
  }
  if (policy.maxAge !== undefined) {
    if (!Number.isFinite(policy.maxAge) || policy.maxAge < 0) {
      throw new MemoryConfigError('retention.maxAge must be a non-negative number');
    }
  }
}

function validateEntry(entry: MemoryEntry): void {
  if (!entry.id || typeof entry.id !== 'string') {
    throw new MemoryOperationError('sqlite', 'add', 'entry.id must be a non-empty string');
  }
  if (!entry.content || typeof entry.content !== 'string') {
    throw new MemoryOperationError('sqlite', 'add', 'entry.content must be a non-empty string');
  }
  if (!entry.role || typeof entry.role !== 'string') {
    throw new MemoryOperationError('sqlite', 'add', 'entry.role must be a non-empty string');
  }
  if (!entry.namespace || typeof entry.namespace !== 'string') {
    throw new MemoryOperationError('sqlite', 'add', 'entry.namespace must be a non-empty string');
  }
  if (!entry.createdAt || typeof entry.createdAt !== 'string') {
    throw new MemoryOperationError('sqlite', 'add', 'entry.createdAt must be a non-empty string');
  }
}

function rowToEntry(row: MemoryRow): MemoryEntry {
  const entry: MemoryEntry = {
    id: row.id,
    content: row.content,
    role: row.role as MemoryEntry['role'],
    namespace: row.namespace as MemoryEntry['namespace'],
    createdAt: row.created_at,
    ...(row.metadata !== null && { metadata: JSON.parse(row.metadata) as MemoryMetadata }),
  };
  return Object.freeze(entry);
}

function buildFilterQuery(options?: MemoryQueryOptions): { sql: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (options?.namespace) {
    conditions.push('namespace = ?');
    params.push(options.namespace);
  }

  // Role filtering: roles takes precedence over role
  const roles = options?.roles ?? (options?.role ? [options.role] : undefined);
  if (roles && roles.length > 0) {
    const placeholders = roles.map(() => '?').join(', ');
    conditions.push(`role IN (${placeholders})`);
    params.push(...roles);
  }

  if (options?.after) {
    conditions.push('created_at > ?');
    params.push(options.after);
  }

  if (options?.before) {
    conditions.push('created_at < ?');
    params.push(options.before);
  }

  if (options?.metadata) {
    for (const [key, value] of Object.entries(options.metadata)) {
      conditions.push(`json_extract(metadata, ?) = ?`);
      params.push(`$.${key}`, value);
    }
  }

  const sql = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
  return { sql, params };
}

/** Escape special FTS5 query characters for safe matching. */
function escapeFtsQuery(text: string): string {
  // Wrap each word in double quotes to treat as literal tokens
  return text
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map((w) => `"${w.replace(/"/g, '""')}"`)
    .join(' ');
}

function openDatabase(dbPath: string, walMode: boolean): SqliteDatabase {
  try {
    // Dynamic require for better-sqlite3 (optional peer dependency)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require('better-sqlite3') as new (path: string) => SqliteDatabase;
    const db = new Database(dbPath);

    if (walMode && dbPath !== ':memory:') {
      db.pragma('journal_mode = WAL');
    }

    db.pragma('foreign_keys = ON');

    return db;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes('Cannot find module') || message.includes('MODULE_NOT_FOUND')) {
      throw new MemoryConfigError(
        'better-sqlite3 is required for SqliteMemory. Install it with: npm install better-sqlite3',
        'sqlite',
      );
    }

    throw new MemoryConfigError(
      `Failed to open SQLite database at "${dbPath}": ${message}`,
      'sqlite',
    );
  }
}
