/**
 * Workflow file validation logic — static analysis of Crewspace workflow files.
 *
 * Performs structural checks on workflow files without executing them:
 * - File existence and supported extension
 * - Non-empty content
 * - Crewspace import detection
 * - Agent / Crew instantiation patterns
 * - Required property checks (id, role, goal, etc.)
 * - Reference integrity (agentId → agent, dependencies → task)
 * - Duplicate ID detection
 *
 * This module is intentionally separated from the Commander action so that
 * it can be tested independently without wiring up the CLI parser.
 *
 * @packageDocumentation
 */

import * as fs from 'node:fs';

import { resolveWorkflowFile } from './runner.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Severity level for a validation diagnostic. */
export type DiagnosticLevel = 'error' | 'warning' | 'info';

/** A single diagnostic message produced during validation. */
export interface ValidationDiagnostic {
  readonly level: DiagnosticLevel;
  readonly message: string;
  /** 1-based line number, if applicable. */
  readonly line?: number;
}

/** Result of validating a workflow file. */
export interface ValidationResult {
  /** Whether the file passed validation (no errors — warnings are allowed). */
  readonly valid: boolean;
  /** Absolute path of the validated file. */
  readonly file: string;
  /** Ordered list of diagnostics. */
  readonly diagnostics: readonly ValidationDiagnostic[];
  /** Number of errors. */
  readonly errorCount: number;
  /** Number of warnings. */
  readonly warningCount: number;
}

/** Options accepted by {@link validateWorkflowFile}. */
export interface ValidatorOptions {
  /** Path to the workflow file (absolute or relative to cwd). */
  readonly file: string;
  /** Working directory for resolution. */
  readonly cwd: string;
  /** Enable strict validation with additional warnings. */
  readonly strict?: boolean;
}

// ---------------------------------------------------------------------------
// Regex patterns for static analysis
// ---------------------------------------------------------------------------

const CREWSPACE_IMPORT_RE =
  /(?:import\s+.*from\s+['"]@crewspace\/core['"]|require\s*\(\s*['"]@crewspace\/core['"]\s*\))/;

const AGENT_INSTANTIATION_RE = /new\s+Agent\s*\(/g;
const CREW_INSTANTIATION_RE = /new\s+Crew\s*\(/g;

/** Matches `id: 'value'` or `id: "value"` inside an object literal. */
const ID_PROPERTY_RE = /\bid\s*:\s*['"]([^'"]+)['"]/g;

/** Matches `agentId: 'value'` inside a task definition. */
const AGENT_ID_REF_RE = /\bagentId\s*:\s*['"]([^'"]+)['"]/g;

/** Matches `dependencies: ['a', 'b']` inside a task definition. */
const DEPENDENCIES_RE = /\bdependencies\s*:\s*\[([^\]]*)\]/g;

/** Matches string literals inside a dependencies array. */
const STRING_LITERAL_RE = /['"]([^'"]+)['"]/g;

/** Matches `role: '...'` property. */
const ROLE_PROPERTY_RE = /\brole\s*:\s*['"]/;

/** Matches `goal: '...'` property. */
const GOAL_PROPERTY_RE = /\bgoal\s*:\s*['"]/;

/** Matches `description: '...'` property. */
const DESCRIPTION_PROPERTY_RE = /\bdescription\s*:\s*['"]/;

/** Matches `agents: [...]` property. */
const AGENTS_ARRAY_RE = /\bagents\s*:\s*\[/;

/** Matches `tasks: [...]` property. */
const TASKS_ARRAY_RE = /\btasks\s*:\s*\[/;

/** Matches `backstory: '...'` property. */
const BACKSTORY_PROPERTY_RE = /\bbackstory\s*:\s*['"]/;

/** Matches `llmProvider:` property. */
const LLM_PROVIDER_RE = /\bllmProvider\s*:/;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Collects all matches for a global regex and resets it before use. */
function collectMatches(re: RegExp, content: string): RegExpExecArray[] {
  re.lastIndex = 0;
  const matches: RegExpExecArray[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    matches.push(m);
  }
  return matches;
}

/** Returns the 1-based line number for a character offset. */
function lineOf(content: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset && i < content.length; i++) {
    if (content[i] === '\n') line++;
  }
  return line;
}

/**
 * Extracts all string-literal IDs referenced in an `id:` pattern
 * within a given region of the source content.
 */
function extractIds(content: string, re: RegExp): string[] {
  const matches = collectMatches(re, content);
  return matches.map((m) => m[1]);
}

// ---------------------------------------------------------------------------
// Core validation
// ---------------------------------------------------------------------------

/**
 * Validates a Crewspace workflow file using static analysis.
 *
 * @throws {Error} Only for unrecoverable I/O errors.
 */
export function validateWorkflowFile(options: ValidatorOptions): ValidationResult {
  const diagnostics: ValidationDiagnostic[] = [];

  // 1. Resolve & check file existence / extension
  let resolvedFile: string;
  try {
    resolvedFile = resolveWorkflowFile(options.file, options.cwd);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      valid: false,
      file: options.file,
      diagnostics: [{ level: 'error', message }],
      errorCount: 1,
      warningCount: 0,
    };
  }

  // 2. Read file content
  let content: string;
  try {
    content = fs.readFileSync(resolvedFile, 'utf-8');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      valid: false,
      file: resolvedFile,
      diagnostics: [{ level: 'error', message: `Failed to read file: ${message}` }],
      errorCount: 1,
      warningCount: 0,
    };
  }

  // 3. Empty file check
  if (content.trim().length === 0) {
    return {
      valid: false,
      file: resolvedFile,
      diagnostics: [{ level: 'error', message: 'File is empty' }],
      errorCount: 1,
      warningCount: 0,
    };
  }

  // 4. Crewspace import check
  if (!CREWSPACE_IMPORT_RE.test(content)) {
    diagnostics.push({
      level: 'warning',
      message:
        'No @crewspace/core import detected. ' +
        'Workflow files typically import from @crewspace/core.',
    });
  }

  // 5. Agent / Crew instantiation checks
  const agentMatches = collectMatches(AGENT_INSTANTIATION_RE, content);
  const crewMatches = collectMatches(CREW_INSTANTIATION_RE, content);

  if (agentMatches.length === 0 && crewMatches.length === 0) {
    diagnostics.push({
      level: 'warning',
      message: 'No Agent or Crew instantiation found. Expected at least one new Agent() or new Crew().',
    });
  }

  // 6. Agent required fields check
  for (const match of agentMatches) {
    const lineNum = lineOf(content, match.index);
    // Look at a reasonable region after the match to check for required properties
    const region = content.slice(match.index, match.index + 500);

    if (!ID_PROPERTY_RE.test(region)) {
      diagnostics.push({ level: 'error', message: 'Agent is missing required "id" property', line: lineNum });
    }
    // Reset lastIndex for stateless use
    ID_PROPERTY_RE.lastIndex = 0;

    if (!ROLE_PROPERTY_RE.test(region)) {
      diagnostics.push({ level: 'error', message: 'Agent is missing required "role" property', line: lineNum });
    }

    if (!GOAL_PROPERTY_RE.test(region)) {
      diagnostics.push({ level: 'error', message: 'Agent is missing required "goal" property', line: lineNum });
    }

    if (options.strict) {
      if (!BACKSTORY_PROPERTY_RE.test(region)) {
        diagnostics.push({
          level: 'warning',
          message: 'Agent does not have a "backstory" property (recommended in strict mode)',
          line: lineNum,
        });
      }
      if (!LLM_PROVIDER_RE.test(region)) {
        diagnostics.push({
          level: 'warning',
          message: 'Agent does not have an "llmProvider" set (recommended in strict mode)',
          line: lineNum,
        });
      }
    }
  }

  // 7. Crew required fields check
  for (const match of crewMatches) {
    const lineNum = lineOf(content, match.index);
    const region = content.slice(match.index, match.index + 2000);

    if (!ID_PROPERTY_RE.test(region)) {
      diagnostics.push({ level: 'error', message: 'Crew is missing required "id" property', line: lineNum });
    }
    ID_PROPERTY_RE.lastIndex = 0;

    if (!AGENTS_ARRAY_RE.test(region)) {
      diagnostics.push({ level: 'error', message: 'Crew is missing required "agents" array', line: lineNum });
    }

    if (!TASKS_ARRAY_RE.test(region)) {
      diagnostics.push({ level: 'error', message: 'Crew is missing required "tasks" array', line: lineNum });
    }
  }

  // 8. Duplicate ID detection
  const allIds = extractIds(content, new RegExp(ID_PROPERTY_RE.source, 'g'));
  const seenIds = new Set<string>();
  for (const id of allIds) {
    if (seenIds.has(id)) {
      diagnostics.push({
        level: 'error',
        message: `Duplicate id "${id}" detected. All agent and task ids must be unique.`,
      });
    }
    seenIds.add(id);
  }

  // 9. Reference integrity — agentId must reference a known agent id
  const agentIdRefs = extractIds(content, new RegExp(AGENT_ID_REF_RE.source, 'g'));
  // Build a set of ids that look like agent ids (from new Agent({id: ...}))
  const agentIds = new Set<string>();
  for (const match of agentMatches) {
    const region = content.slice(match.index, match.index + 500);
    const idMatch = new RegExp(ID_PROPERTY_RE.source).exec(region);
    if (idMatch) {
      agentIds.add(idMatch[1]);
    }
  }

  // Only check references if we found agent definitions
  if (agentIds.size > 0) {
    for (const ref of agentIdRefs) {
      if (!agentIds.has(ref)) {
        diagnostics.push({
          level: 'error',
          message: `Task references agentId "${ref}" which does not match any defined agent.`,
        });
      }
    }
  }

  // 10. Reference integrity — dependencies must reference known task ids
  const taskIds = new Set<string>();
  // Extract task IDs from tasks arrays
  const tasksArrayMatches = collectMatches(new RegExp(TASKS_ARRAY_RE.source, 'g'), content);
  if (tasksArrayMatches.length > 0) {
    // Collect task-level IDs
    for (const tasksMatch of tasksArrayMatches) {
      const tasksRegion = content.slice(tasksMatch.index, tasksMatch.index + 5000);
      const taskIdMatches = collectMatches(new RegExp(ID_PROPERTY_RE.source, 'g'), tasksRegion);
      for (const m of taskIdMatches) {
        taskIds.add(m[1]);
      }
    }
  }

  if (taskIds.size > 0) {
    const depMatches = collectMatches(new RegExp(DEPENDENCIES_RE.source, 'g'), content);
    for (const depMatch of depMatches) {
      const depList = depMatch[1];
      const strMatches = collectMatches(new RegExp(STRING_LITERAL_RE.source, 'g'), depList);
      for (const strMatch of strMatches) {
        if (!taskIds.has(strMatch[1])) {
          diagnostics.push({
            level: 'error',
            message: `Task dependency "${strMatch[1]}" does not match any defined task id.`,
          });
        }
      }
    }
  }

  // 11. Task required fields (check description and agentId presence in tasks regions)
  if (tasksArrayMatches.length > 0 && options.strict) {
    for (const tasksMatch of tasksArrayMatches) {
      const tasksRegion = content.slice(tasksMatch.index, tasksMatch.index + 5000);
      // Check individual task objects have description and agentId
      // We look for objects that have `id:` but not `description:` or `agentId:`
      const idMatches = collectMatches(new RegExp(ID_PROPERTY_RE.source, 'g'), tasksRegion);
      for (const idMatch of idMatches) {
        // Look at the region around this id match (±200 chars)
        const start = Math.max(0, idMatch.index - 50);
        const end = Math.min(tasksRegion.length, idMatch.index + 300);
        const taskRegion = tasksRegion.slice(start, end);

        if (!DESCRIPTION_PROPERTY_RE.test(taskRegion)) {
          diagnostics.push({
            level: 'warning',
            message: `Task "${idMatch[1]}" may be missing a "description" property`,
          });
        }
        if (!AGENT_ID_REF_RE.test(taskRegion)) {
          AGENT_ID_REF_RE.lastIndex = 0;
          diagnostics.push({
            level: 'warning',
            message: `Task "${idMatch[1]}" may be missing an "agentId" property`,
          });
        }
        AGENT_ID_REF_RE.lastIndex = 0;
      }
    }
  }

  // Build result
  const errorCount = diagnostics.filter((d) => d.level === 'error').length;
  const warningCount = diagnostics.filter((d) => d.level === 'warning').length;

  return {
    valid: errorCount === 0,
    file: resolvedFile,
    diagnostics,
    errorCount,
    warningCount,
  };
}

/**
 * Formats a validation result into human-readable output.
 */
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];

  if (result.diagnostics.length === 0) {
    lines.push(`✓ ${result.file}`);
    lines.push('  No issues found.');
    return lines.join('\n') + '\n';
  }

  lines.push(`${result.valid ? '✓' : '✗'} ${result.file}`);
  lines.push('');

  for (const diag of result.diagnostics) {
    const prefix =
      diag.level === 'error'
        ? '  ✗ error'
        : diag.level === 'warning'
          ? '  ⚠ warning'
          : '  ℹ info';
    const location = diag.line !== undefined ? ` (line ${String(diag.line)})` : '';
    lines.push(`${prefix}${location}: ${diag.message}`);
  }

  lines.push('');

  const parts: string[] = [];
  if (result.errorCount > 0) {
    parts.push(`${String(result.errorCount)} error${result.errorCount === 1 ? '' : 's'}`);
  }
  if (result.warningCount > 0) {
    parts.push(`${String(result.warningCount)} warning${result.warningCount === 1 ? '' : 's'}`);
  }
  lines.push(`  ${parts.join(', ')}`);

  return lines.join('\n') + '\n';
}
