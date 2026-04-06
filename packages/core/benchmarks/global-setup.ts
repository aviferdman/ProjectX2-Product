/**
 * Global setup for performance benchmarks.
 *
 * Clears the detailed results file before each benchmark run so that
 * the comparison script only sees results from the current run.
 */

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export default function setup(): void {
  const dir = dirname(fileURLToPath(import.meta.url));
  const resultsPath = resolve(dir, '..', 'benchmark-results-detailed.jsonl');
  writeFileSync(resultsPath, '', 'utf-8');
}
