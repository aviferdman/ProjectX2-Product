/**
 * Global setup for performance benchmarks.
 *
 * Clears the detailed results file before each benchmark run so that
 * the comparison script only sees results from the current run.
 */

import { writeFileSync } from 'node:fs';
<<<<<<< HEAD
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export default function setup(): void {
  const dir = dirname(fileURLToPath(import.meta.url));
  const resultsPath = resolve(dir, '..', 'benchmark-results-detailed.jsonl');
=======
import { resolve } from 'node:path';

export default function setup(): void {
  const resultsPath = resolve(process.cwd(), 'benchmark-results-detailed.jsonl');
>>>>>>> agent/developer/development-developer-c71
  writeFileSync(resultsPath, '', 'utf-8');
}
