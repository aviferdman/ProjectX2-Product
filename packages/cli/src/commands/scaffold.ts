/**
 * Project scaffolding logic — writes template files to disk.
 *
 * This module is intentionally separated from the Commander action so that
 * it can be tested independently without wiring up the CLI parser.
 *
 * @packageDocumentation
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { getTemplate, TEMPLATE_NAMES } from './templates.js';
import type { TemplateName } from './templates.js';

/** Options accepted by {@link scaffoldProject}. */
export interface ScaffoldOptions {
  /** Target directory (absolute or relative to cwd). */
  readonly directory: string;
  /** Template name. Defaults to `'default'`. */
  readonly template: string;
  /** Overwrite existing files when `true`. */
  readonly force: boolean;
}

/** Result returned by {@link scaffoldProject}. */
export interface ScaffoldResult {
  /** Absolute path of the scaffolded project. */
  readonly projectDir: string;
  /** Relative file paths that were written. */
  readonly filesCreated: readonly string[];
  /** Relative file paths that were skipped (already existed, no --force). */
  readonly filesSkipped: readonly string[];
  /** Template name that was used. */
  readonly template: string;
}

/**
 * Scaffolds a new Crewspace project on disk.
 *
 * @throws {Error} If the template name is unknown.
 * @throws {Error} If the target directory is a file (not a directory).
 */
export function scaffoldProject(options: ScaffoldOptions): ScaffoldResult {
  const { directory, template, force } = options;
  const projectDir = path.resolve(directory);
  const projectName = path.basename(projectDir);

  // Validate template name early.
  if (!isValidTemplate(template)) {
    throw new Error(
      `Unknown template "${template}". Available templates: ${TEMPLATE_NAMES.join(', ')}`,
    );
  }

  // Ensure target is not an existing file.
  if (fs.existsSync(projectDir) && !fs.statSync(projectDir).isDirectory()) {
    throw new Error(`"${projectDir}" exists and is not a directory.`);
  }

  const templateFiles = getTemplate(template, projectName);

  const filesCreated: string[] = [];
  const filesSkipped: string[] = [];

  for (const [relativePath, content] of templateFiles) {
    const absolutePath = path.join(projectDir, relativePath);
    const dir = path.dirname(absolutePath);

    // Create parent directories as needed.
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(absolutePath) && !force) {
      filesSkipped.push(relativePath);
      continue;
    }

    fs.writeFileSync(absolutePath, content, 'utf-8');
    filesCreated.push(relativePath);
  }

  return { projectDir, filesCreated, filesSkipped, template };
}

function isValidTemplate(name: string): name is TemplateName {
  return (TEMPLATE_NAMES as readonly string[]).includes(name);
}
