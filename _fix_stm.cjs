const fs = require('fs');
let stm = fs.readFileSync('packages/core/src/memory/short-term-memory.ts', 'utf-8');

const oldText = '  // -----------------------------------------------------------------------\n  // Event system';
const newText = '  /** The default namespace for entries that don\'t specify one. */\n  get defaultNamespace(): MemoryNamespace {\n    return this._defaultNamespace;\n  }\n\n  // -----------------------------------------------------------------------\n  // Event system';

stm = stm.replace(
  '  // -----------------------------------------------------------------------\r\n  // Event system',
  '  /** The default namespace for entries. */\n  get defaultNamespace(): MemoryNamespace {\n    return this._defaultNamespace;\n  }\n\n  // -----------------------------------------------------------------------\n  // Event system'
);

// Also try unix line endings
stm = stm.replace(
  '  // -----------------------------------------------------------------------\n  // Event system',
  '  /** The default namespace for entries. */\n  get defaultNamespace(): MemoryNamespace {\n    return this._defaultNamespace;\n  }\n\n  // -----------------------------------------------------------------------\n  // Event system'
);

fs.writeFileSync('packages/core/src/memory/short-term-memory.ts', stm);
console.log('done');