/**
 * Memory export/import utilities for debugging.
 *
 * Provides functions to serialize memory contents to a portable JSON
 * format and load them back into any {@link MemoryProvider}.
 *
 * @packageDocumentation
 */

import { MemoryOperationError } from '../errors/memory-errors.js';
import type {
  MemoryEntry,
  MemoryProvider,
  MemoryQueryOptions,
  MemoryQueryResult,
} from '../types/memory.js';
import { MemoryNamespace, MemoryRole } from '../types/memory.js';

// ---------------------------------------------------------------------------
// Export format types
// ---------------------------------------------------------------------------

/** Version of the export format (for forward-compatibility). */
export const MEMORY_EXPORT_VERSION = 1;

/** Maximum number of entries to export in a single call. */
export const MAX_EXPORT_ENTRIES = 100_000;

/**
 * Portable JSON-serializable snapshot of a memory provider's contents.
 */
export interface MemoryExportData {
  /** Format version (currently 1). */
  readonly version: number;
  /** ISO-8601 timestamp of when this export was created. */
  readonly exportedAt: string;
  /** Name of the provider that produced this export. */
  readonly providerName: string;
  /** The exported entries. */
  readonly entries: readonly MemoryEntry[];
  /** Total number of entries in the provider at export time. */
  readonly totalEntries: number;
}

/** Result of an import operation. */
export interface MemoryImportResult {
  /** Number of entries successfully imported. */
  readonly imported: number;
  /** Number of entries that were skipped (e.g. duplicate id). */
  readonly skipped: number;
  /** Errors encountered during import (one per failed entry). */
  readonly errors: readonly MemoryImportError[];
}

/** A single import error (non-fatal). */
export interface MemoryImportError {
  /** The entry id that failed (if available). */
  readonly entryId: string;
  /** Human-readable error message. */
  readonly message: string;
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const VALID_ROLES = new Set<string>(Object.values(MemoryRole));
const VALID_NAMESPACES = new Set<string>(Object.values(MemoryNamespace));

function isValidMemoryEntry(entry: unknown): entry is MemoryEntry {
  if (entry === null || typeof entry !== 'object') return false;
  const e = entry as Record<string, unknown>;
  return (
    typeof e['id'] === 'string' &&
    (e['id'] as string).length > 0 &&
    typeof e['content'] === 'string' &&
    (e['content'] as string).length > 0 &&
    typeof e['role'] === 'string' &&
    VALID_ROLES.has(e['role'] as string) &&
    typeof e['namespace'] === 'string' &&
    VALID_NAMESPACES.has(e['namespace'] as string) &&
    typeof e['createdAt'] === 'string' &&
    (e['createdAt'] as string).length > 0
  );
}

function isValidExportData(data: unknown): data is MemoryExportData {
  if (data === null || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d['version'] === 'number' &&
    d['version'] >= 1 &&
    typeof d['exportedAt'] === 'string' &&
    typeof d['providerName'] === 'string' &&
    Array.isArray(d['entries']) &&
    typeof d['totalEntries'] === 'number'
  );
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/** Options for {@link exportMemory}. */
export interface ExportMemoryOptions {
  /** Only export entries in this namespace. */
  readonly namespace?: MemoryNamespace;
  /** Maximum entries to export (defaults to {@link MAX_EXPORT_ENTRIES}). */
  readonly limit?: number;
}

/**
 * Export all (or filtered) entries from a memory provider.
 *
 * The returned {@link MemoryExportData} is plain JSON-serializable and
 * can be written to a file for later inspection or re-import.
 *
 * @param provider - The memory provider to export from
 * @param options  - Optional filters
 * @returns A snapshot of the provider's contents
 *
 * @example
 * ```typescript
 * const data = await exportMemory(myMemory);
 * fs.writeFileSync('memory-dump.json', JSON.stringify(data, null, 2));
 * ```
 */
export async function exportMemory(
  provider: MemoryProvider,
  options?: ExportMemoryOptions,
): Promise<MemoryExportData> {
  const limit = Math.min(options?.limit ?? MAX_EXPORT_ENTRIES, MAX_EXPORT_ENTRIES);

  let result: MemoryQueryResult;
  try {
    const queryOptions: MemoryQueryOptions = {
      ...(options?.namespace !== undefined && { namespace: options.namespace }),
      limit,
    };
    result = await provider.query(queryOptions);
  } catch (err) {
    throw new MemoryOperationError(
      provider.name,
      'export',
      `Failed to query entries: ${err instanceof Error ? err.message : String(err)}`,
      err instanceof Error ? err : undefined,
    );
  }

  const totalEntries = await provider.count(options?.namespace);

  return {
    version: MEMORY_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    providerName: provider.name,
    entries: result.entries,
    totalEntries,
  };
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

/** Options for {@link importMemory}. */
export interface ImportMemoryOptions {
  /** If true, skip entries whose id already exists instead of failing. Default: true. */
  readonly skipDuplicates?: boolean;
  /** If true, clear the provider before importing. Default: false. */
  readonly clearFirst?: boolean;
}

/**
 * Import entries from a previously exported {@link MemoryExportData} snapshot.
 *
 * By default, entries with duplicate ids are skipped (not overwritten).
 *
 * @param provider - The memory provider to import into
 * @param data     - The export data to load
 * @param options  - Import behaviour options
 * @returns Summary of the import operation
 *
 * @example
 * ```typescript
 * const raw = JSON.parse(fs.readFileSync('memory-dump.json', 'utf-8'));
 * const result = await importMemory(myMemory, raw);
 * console.log(`Imported ${result.imported}, skipped ${result.skipped}`);
 * ```
 */
export async function importMemory(
  provider: MemoryProvider,
  data: unknown,
  options?: ImportMemoryOptions,
): Promise<MemoryImportResult> {
  // Validate top-level structure
  if (!isValidExportData(data)) {
    throw new MemoryOperationError(
      provider.name,
      'import',
      'Invalid export data: missing or malformed required fields (version, exportedAt, providerName, entries, totalEntries)',
    );
  }

  if (data.version > MEMORY_EXPORT_VERSION) {
    throw new MemoryOperationError(
      provider.name,
      'import',
      `Unsupported export version ${data.version} (max supported: ${MEMORY_EXPORT_VERSION})`,
    );
  }

  const skipDuplicates = options?.skipDuplicates ?? true;

  if (options?.clearFirst) {
    await provider.clear();
  }

  let imported = 0;
  let skipped = 0;
  const errors: MemoryImportError[] = [];

  for (const entry of data.entries) {
    // Validate each entry
    if (!isValidMemoryEntry(entry)) {
      const entryId = (entry as Record<string, unknown>)?.['id'];
      errors.push({
        entryId: typeof entryId === 'string' ? entryId : '<unknown>',
        message: 'Invalid entry: missing or malformed required fields',
      });
      continue;
    }

    try {
      await provider.add(entry);
      imported++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isDuplicate = message.includes('already exists');

      if (isDuplicate && skipDuplicates) {
        skipped++;
      } else {
        errors.push({
          entryId: entry.id,
          message,
        });
      }
    }
  }

  return { imported, skipped, errors };
}

// ---------------------------------------------------------------------------
// JSON serialization helpers
// ---------------------------------------------------------------------------

/**
 * Serialize export data to a formatted JSON string.
 *
 * @param data - The export data to serialize
 * @returns Pretty-printed JSON string
 */
export function exportToJson(data: MemoryExportData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Parse a JSON string into validated {@link MemoryExportData}.
 *
 * @param json - The JSON string to parse
 * @returns Parsed and validated export data
 * @throws MemoryOperationError if the JSON is invalid or malformed
 */
export function parseExportJson(json: string): MemoryExportData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new MemoryOperationError('unknown', 'import', 'Failed to parse JSON: invalid syntax');
  }

  if (!isValidExportData(parsed)) {
    throw new MemoryOperationError(
      'unknown',
      'import',
      'Invalid export data: missing or malformed required fields',
    );
  }

  return parsed as MemoryExportData;
}
