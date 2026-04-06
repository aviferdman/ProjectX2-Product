/**
 * Memory module — barrel export.
 *
 * @packageDocumentation
 */

export { ShortTermMemory } from './short-term-memory.js';
export { SqliteMemory } from './sqlite-memory.js';
export type { SqliteMemoryConfig } from './sqlite-memory.js';
export {
  createMemoryEntry,
  generateMemoryId,
  MemoryManager,
} from './memory-manager.js';
export type { MemoryManagerConfig } from './memory-manager.js';

export { MemorySearchBuilder } from './memory-search-builder.js';

export { DEFAULT_READABLE_NAMESPACES, ScopedMemory } from './scoped-memory.js';
export type { ScopedMemoryConfig } from './scoped-memory.js';

export {
  exportMemory,
  exportToJson,
  importMemory,
  MAX_EXPORT_ENTRIES,
  MEMORY_EXPORT_VERSION,
  parseExportJson,
} from './memory-export.js';
export type {
  ExportMemoryOptions,
  ImportMemoryOptions,
  MemoryExportData,
  MemoryImportError,
  MemoryImportResult,
} from './memory-export.js';
