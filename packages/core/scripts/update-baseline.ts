/**
 * Update the performance baseline from current benchmark results.
 *
 * Reads benchmark-results-detailed.jsonl and writes a new baseline.json.
 *
 * Usage:
 *   npx tsx scripts/update-baseline.ts [--results path] [--output path]
 *
 * @packageDocumentation
 */

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Baseline, BaselineEntry } from './compare-benchmarks.js';
import { loadCurrentResults } from './compare-benchmarks.js';

// ---------------------------------------------------------------------------
// Baseline generation
// ---------------------------------------------------------------------------

export function buildBaseline(
  results: readonly { name: string; p95Ms: number; avgMs: number; budget: number }[],
): Baseline {
  const entries: Record<string, BaselineEntry> = {};

  for (const result of results) {
    entries[result.name] = {
      p95Ms: result.p95Ms,
      avgMs: result.avgMs,
      budget: result.budget,
    };
  }

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    entries,
  };
}

// ---------------------------------------------------------------------------
// CLI argument parser
// ---------------------------------------------------------------------------

function parseArgs(argv: readonly string[]): { results: string; output: string } {
  let results = resolve('benchmark-results-detailed.jsonl');
  let output = resolve('benchmarks', 'baseline.json');

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next: string | undefined = argv[i + 1];
    if (arg === '--results' && next !== undefined) {
      results = resolve(next);
      i++;
    } else if (arg === '--output' && next !== undefined) {
      output = resolve(next);
      i++;
    }
  }

  return { results, output };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function main(argv: readonly string[] = process.argv.slice(2)): number {
  const { results: resultsPath, output: outputPath } = parseArgs(argv);

  console.log('Updating performance baseline...');
  console.log(`  Results: ${resultsPath}`);
  console.log(`  Output:  ${outputPath}`);
  console.log('');

  const results = loadCurrentResults(resultsPath);
  if (results.length === 0) {
    console.log('No benchmark results found. Cannot update baseline.');
    return 1;
  }

  const baseline = buildBaseline(results);
  writeFileSync(outputPath, JSON.stringify(baseline, null, 2) + '\n', 'utf-8');

  console.log(`Baseline updated with ${String(results.length)} benchmark entries.`);
  return 0;
}

// Run if executed directly
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename || process.argv[1]?.endsWith('update-baseline.ts')) {
  process.exit(main());
}