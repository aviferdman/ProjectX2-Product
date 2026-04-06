/**
 * TASK-018: JSDoc coverage validation tests.
 *
 * Ensures every public API surface (exported declarations and public class
 * methods) has a JSDoc comment block.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SRC_DIR = join(__dirname, '..', '..', 'src');

/** Recursively collect all `.ts` source files, skipping barrel `index.ts`. */
function collectSourceFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...collectSourceFiles(full));
    } else if (entry.endsWith('.ts') && entry !== 'index.ts') {
      results.push(full);
    }
  }
  return results;
}

/**
 * Check whether the line at `lineIndex` is preceded (within 10 lines) by
 * a JSDoc closing tag `* /` (without space).
 */
function hasPrecedingJSDoc(lines: string[], lineIndex: number): boolean {
  for (let j = lineIndex - 1; j >= Math.max(lineIndex - 10, 0); j--) {
    const prev = lines[j]!.trim();
    if (prev === '') continue;
    if (prev.endsWith('*/')) return true;
    // Decorators, section separators, and eslint-disable comments can precede methods
    if (prev.startsWith('@') || prev.startsWith('//')) continue;
    return false;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Test: every exported declaration has JSDoc
// ---------------------------------------------------------------------------

describe('TASK-018: JSDoc coverage — exported declarations', () => {
  const files = collectSourceFiles(SRC_DIR);
  // Regex matches: export [abstract] class|function|const|interface|type|enum NAME
  const exportRe = /^export\s+(?:abstract\s+)?(?:class|function|const|interface|type|enum)\s+(\w+)/;

  for (const file of files) {
    const rel = relative(SRC_DIR, file).split(sep).join('/');
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    const missing: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const m = exportRe.exec(lines[i]!.trim());
      if (!m) continue;
      if (!hasPrecedingJSDoc(lines, i)) {
        missing.push(`${m[1]} (line ${String(i + 1)})`);
      }
    }

    if (missing.length > 0) {
      it(`${rel} — all exports should have JSDoc`, () => {
        expect(missing, `Missing JSDoc on: ${missing.join(', ')}`).toHaveLength(0);
      });
    }
  }

  it('should have checked at least 30 source files', () => {
    expect(files.length).toBeGreaterThanOrEqual(30);
  });
});

// ---------------------------------------------------------------------------
// Test: key public class methods have JSDoc
// ---------------------------------------------------------------------------

describe('TASK-018: JSDoc coverage — public class methods', () => {
  /**
   * Map of file (relative to src) → array of method names that must have JSDoc.
   */
  const requiredMethods: Record<string, string[]> = {
    'llm/base-provider.ts': ['generateText', 'generateStream'],
    'llm/stream-response.ts': ['toResponse'],
    'memory/memory-manager.ts': ['on', 'off', 'add', 'get', 'query', 'search', 'delete', 'clear', 'count'],
    'memory/short-term-memory.ts': ['on', 'off', 'add', 'get', 'query', 'search', 'delete', 'clear', 'count'],
    'memory/sqlite-memory.ts': ['on', 'off', 'add', 'get', 'query', 'search', 'delete', 'clear', 'count'],
    'task/parallel-executor.ts': ['on', 'off', 'once'],
    'tool/tool-executor.ts': ['on', 'off', 'execute'],
    'logging/logger.ts': ['write'],
  };

  for (const [relPath, methods] of Object.entries(requiredMethods)) {
    const absPath = join(SRC_DIR, ...relPath.split('/'));
    const content = readFileSync(absPath, 'utf-8');
    const lines = content.split('\n');

    for (const method of methods) {
      it(`${relPath} — ${method}() should have JSDoc`, () => {
        // Find the method declaration line(s) — must be actual method implementations (not interface sigs)
        const methodPattern = new RegExp(
          `^\\s+(?:public\\s+)?(?:async\\s+)?${method}\\s*[<(]`,
        );
        let found = false;
        let anyDocumented = false;

        for (let i = 0; i < lines.length; i++) {
          if (methodPattern.test(lines[i]!)) {
            found = true;
            if (hasPrecedingJSDoc(lines, i)) {
              anyDocumented = true;
            }
          }
        }

        expect(found, `Method ${method}() not found in ${relPath}`).toBe(true);
        expect(anyDocumented, `Method ${method}() is missing JSDoc in ${relPath}`).toBe(true);
      });
    }
  }
});

// ---------------------------------------------------------------------------
// Test: @packageDocumentation tag in module headers
// ---------------------------------------------------------------------------

describe('TASK-018: JSDoc coverage — @packageDocumentation headers', () => {
  const files = collectSourceFiles(SRC_DIR);

  // Only check main module files (direct children of module directories)
  const moduleFiles = files.filter((f) => {
    const rel = relative(SRC_DIR, f).split(sep).join('/');
    const parts = rel.split('/');
    // e.g. "agent/agent.ts", "crew/crew.ts" — depth 2, not a type file
    return parts.length === 2 && !rel.includes('.test.');
  });

  it('should have @packageDocumentation in at least 15 module files', () => {
    let count = 0;
    for (const file of moduleFiles) {
      const content = readFileSync(file, 'utf-8');
      if (content.includes('@packageDocumentation')) count++;
    }
    expect(count).toBeGreaterThanOrEqual(15);
  });
});
