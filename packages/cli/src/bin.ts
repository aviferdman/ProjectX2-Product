#!/usr/bin/env node

/**
 * CLI entry point.
 *
 * This file is the `bin` target for the `crewspace` command.
 */

import { createProgram } from './program.js';

const program = createProgram();
program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
