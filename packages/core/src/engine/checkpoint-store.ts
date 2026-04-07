/**
 * SQLite-backed checkpoint store for engine execution state.
 *
 * Persists {@link CheckpointData} snapshots to an SQLite database so that
 * interrupted or failed runs can be inspected and resumed.
 *
 * `better-sqlite3` is an optional peer dependency — install it to use this
 * feature:
 *
 * ```bash
 * npm install better-sqlite3
 * ```
 *
 * @packageDocumentation
 */

import type {
  CheckpointData,
  CheckpointStatus,
  CheckpointStoreConfig,
  CheckpointTaskState,
} from './checkpoint-types.js';

// ---------------------------------------------------------------------------
// Minimal SQLite type stubs (avoids hard dependency on @types/better-sqlite3)
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
// Internal row types
// ---------------------------------------------------------------------------

interface CheckpointRow {
  id: string;
  engine_id: string;
  engine_status: string;
  strategy: string;
  task_error_policy: string;
  status: string;
  metadata: string | null;
  created_at: string;
}

interface TaskStateRow {
  checkpoint_id: string;
  task_id: string;
  status: string;
  agent_id: string | null;
  dependencies: string;
  result: string | null;
  error_message: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_DB_PATH = ':memory:';

// ---------------------------------------------------------------------------
// Database loader (lazy require to keep better-sqlite3 optional)
// ---------------------------------------------------------------------------

function openDatabase(dbPath: string, walMode: boolean): SqliteDatabase {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3') as new (path: string) => SqliteDatabase;
  const db = new Database(dbPath);

  if (walMode) {
    db.pragma('journal_mode = WAL');
  }
  db.pragma('foreign_keys = ON');
  return db;
}

// ---------------------------------------------------------------------------
// CheckpointStore
// ---------------------------------------------------------------------------

/**
 * SQLite-backed store for engine checkpoint data.
 *
 * @example
 * ```typescript
 * const store = new CheckpointStore({ dbPath: './checkpoints.db' });
 * store.save(checkpointData);
 * const latest = store.getLatest('my-engine');
 * store.close();
 * ```
 */
export class CheckpointStore {
  private readonly _db: SqliteDatabase;
  private _closed = false;

  constructor(config?: CheckpointStoreConfig) {
    const dbPath = config?.dbPath ?? DEFAULT_DB_PATH;
    const walMode = config?.walMode ?? true;

    this._db = openDatabase(dbPath, walMode);
    this._initSchema();
  }

  /** Whether the database connection has been closed. */
  get closed(): boolean {
    return this._closed;
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Persist a checkpoint snapshot.
   *
   * @param checkpoint - The checkpoint data to save
   * @throws Error if the store is closed or a checkpoint with the same ID exists
   */
  save(checkpoint: CheckpointData): void {
    this._ensureOpen();

    const existing = this._db
      .prepare('SELECT id FROM checkpoints WHERE id = ?')
      .get(checkpoint.id) as CheckpointRow | undefined;

    if (existing) {
      throw new Error(`Checkpoint "${checkpoint.id}" already exists`);
    }

    const insertCheckpoint = (): void => {
      this._db
        .prepare(
          `INSERT INTO checkpoints (id, engine_id, engine_status, strategy, task_error_policy, status, metadata, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          checkpoint.id,
          checkpoint.engineId,
          checkpoint.engineStatus,
          checkpoint.strategy,
          checkpoint.taskErrorPolicy,
          checkpoint.status,
          checkpoint.metadata ? JSON.stringify(checkpoint.metadata) : null,
          checkpoint.createdAt,
        );

      const insertTask = this._db.prepare(
        `INSERT INTO checkpoint_tasks (checkpoint_id, task_id, status, agent_id, dependencies, result, error_message)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      );

      for (const task of checkpoint.tasks) {
        insertTask.run(
          checkpoint.id,
          task.taskId,
          task.status,
          task.agentId ?? null,
          JSON.stringify(task.dependencies),
          task.result ? JSON.stringify(task.result) : null,
          task.errorMessage ?? null,
        );
      }
    };

    this._db.transaction(insertCheckpoint)();
  }

  /**
   * Retrieve a checkpoint by ID.
   *
   * @returns The checkpoint data, or undefined if not found
   */
  get(checkpointId: string): CheckpointData | undefined {
    this._ensureOpen();

    const row = this._db.prepare('SELECT * FROM checkpoints WHERE id = ?').get(checkpointId) as
      | CheckpointRow
      | undefined;

    if (!row) {
      return undefined;
    }

    return this._hydrateCheckpoint(row);
  }

  /**
   * Get the most recent checkpoint for an engine.
   *
   * @param engineId - The engine ID to look up
   * @returns The most recent checkpoint, or undefined if none exist
   */
  getLatest(engineId: string): CheckpointData | undefined {
    this._ensureOpen();

    const row = this._db
      .prepare('SELECT * FROM checkpoints WHERE engine_id = ? ORDER BY created_at DESC LIMIT 1')
      .get(engineId) as CheckpointRow | undefined;

    if (!row) {
      return undefined;
    }

    return this._hydrateCheckpoint(row);
  }

  /**
   * List all checkpoints for a given engine, ordered by creation time descending.
   *
   * @param engineId - The engine ID to filter by
   * @param limit    - Maximum number of checkpoints to return (default: 50)
   */
  list(engineId: string, limit = 50): readonly CheckpointData[] {
    this._ensureOpen();

    const rows = this._db
      .prepare('SELECT * FROM checkpoints WHERE engine_id = ? ORDER BY created_at DESC LIMIT ?')
      .all(engineId, limit) as CheckpointRow[];

    return rows.map((row) => this._hydrateCheckpoint(row));
  }

  /**
   * Update the status of an existing checkpoint.
   *
   * @param checkpointId - Checkpoint to update
   * @param status       - New status
   * @returns true if the checkpoint was found and updated
   */
  updateStatus(checkpointId: string, status: CheckpointStatus): boolean {
    this._ensureOpen();

    const result = this._db
      .prepare('UPDATE checkpoints SET status = ? WHERE id = ?')
      .run(status, checkpointId);

    return result.changes > 0;
  }

  /**
   * Delete a checkpoint and its task states.
   *
   * @returns true if the checkpoint existed and was deleted
   */
  delete(checkpointId: string): boolean {
    this._ensureOpen();

    const doDelete = (): boolean => {
      this._db.prepare('DELETE FROM checkpoint_tasks WHERE checkpoint_id = ?').run(checkpointId);
      const result = this._db.prepare('DELETE FROM checkpoints WHERE id = ?').run(checkpointId);
      return result.changes > 0;
    };

    return this._db.transaction(doDelete)();
  }

  /**
   * Delete all checkpoints for an engine.
   *
   * @returns The number of checkpoints deleted
   */
  deleteAll(engineId: string): number {
    this._ensureOpen();

    const doDeleteAll = (): number => {
      const rows = this._db
        .prepare('SELECT id FROM checkpoints WHERE engine_id = ?')
        .all(engineId) as Array<{ id: string }>;

      for (const row of rows) {
        this._db.prepare('DELETE FROM checkpoint_tasks WHERE checkpoint_id = ?').run(row.id);
      }

      const result = this._db.prepare('DELETE FROM checkpoints WHERE engine_id = ?').run(engineId);
      return result.changes;
    };

    return this._db.transaction(doDeleteAll)();
  }

  /** Close the database connection. */
  close(): void {
    if (!this._closed) {
      this._db.close();
      this._closed = true;
    }
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private _ensureOpen(): void {
    if (this._closed) {
      throw new Error('CheckpointStore is closed');
    }
  }

  private _initSchema(): void {
    this._db.exec(`
      CREATE TABLE IF NOT EXISTS checkpoints (
        id                TEXT PRIMARY KEY,
        engine_id         TEXT NOT NULL,
        engine_status     TEXT NOT NULL,
        strategy          TEXT NOT NULL,
        task_error_policy TEXT NOT NULL,
        status            TEXT NOT NULL DEFAULT 'active',
        metadata          TEXT,
        created_at        TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_checkpoints_engine_id
        ON checkpoints(engine_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS checkpoint_tasks (
        checkpoint_id TEXT NOT NULL,
        task_id       TEXT NOT NULL,
        status        TEXT NOT NULL,
        agent_id      TEXT,
        dependencies  TEXT NOT NULL DEFAULT '[]',
        result        TEXT,
        error_message TEXT,
        PRIMARY KEY (checkpoint_id, task_id),
        FOREIGN KEY (checkpoint_id) REFERENCES checkpoints(id)
      );
    `);
  }

  private _hydrateCheckpoint(row: CheckpointRow): CheckpointData {
    const taskRows = this._db
      .prepare('SELECT * FROM checkpoint_tasks WHERE checkpoint_id = ?')
      .all(row.id) as TaskStateRow[];

    const tasks: CheckpointTaskState[] = taskRows.map((tr) => ({
      taskId: tr.task_id,
      status: tr.status,
      agentId: tr.agent_id ?? undefined,
      dependencies: JSON.parse(tr.dependencies) as string[],
      result: tr.result
        ? (JSON.parse(tr.result) as import('../types/task.js').TaskResult)
        : undefined,
      errorMessage: tr.error_message ?? undefined,
    }));

    return {
      id: row.id,
      engineId: row.engine_id,
      engineStatus: row.engine_status as import('./types.js').EngineStatus,
      strategy: row.strategy as import('./types.js').ExecutionStrategy,
      taskErrorPolicy: row.task_error_policy as import('./types.js').TaskErrorPolicy,
      createdAt: row.created_at,
      status: row.status as CheckpointStatus,
      tasks,
      metadata: row.metadata ? (JSON.parse(row.metadata) as Record<string, unknown>) : undefined,
    };
  }
}
