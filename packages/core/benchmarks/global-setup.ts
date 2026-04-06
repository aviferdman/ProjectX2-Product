/**
 * Global setup for performance benchmarks.
 *
 * Clears the detailed results file before each benchmark run so that
 * the comparison script only sees results from the current run.
 */

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export default function setup(): void {
  const resultsPath = resolve(process.cwd(), 'benchmark-results-detailed.jsonl');
  writeFileSync(resultsPath, '', 'utf-8');
}
