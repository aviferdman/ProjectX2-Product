import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

import {
  validateWorkflowFile,
  formatValidationResult,
} from '../../src/commands/validator.js';
import { createProgram } from '../../src/program.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'crewspace-validate-test-'));
}

function cleanDir(dir: string): void {
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // On Windows, killed processes may still lock files briefly — ignore cleanup errors
    }
  }
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_WORKFLOW = `
import { Agent, Crew } from '@crewspace/core';
import type { LLMProvider, LLMMessage, LLMResponse } from '@crewspace/core';

function createMockProvider(name: string): LLMProvider {
  return {
    name,
    async generateText(_messages: readonly LLMMessage[]): Promise<LLMResponse> {
      return {
        content: 'mock',
        tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        finishReason: 'stop',
      };
    },
  };
}

const researcher = new Agent({
  id: 'researcher',
  role: 'Research Analyst',
  goal: 'Find key insights on a given topic',
  backstory: 'You are an expert researcher.',
  llmProvider: createMockProvider('researcher-llm'),
});

const writer = new Agent({
  id: 'writer',
  role: 'Content Writer',
  goal: 'Write clear summaries',
  backstory: 'You are a technical writer.',
  llmProvider: createMockProvider('writer-llm'),
});

const crew = new Crew({
  id: 'my-crew',
  agents: [researcher, writer],
  tasks: [
    { id: 'research', description: 'Research AI trends', agentId: 'researcher' },
    {
      id: 'report',
      description: 'Write a summary report',
      agentId: 'writer',
      dependencies: ['research'],
    },
  ],
});

await crew.run();
`;

const MINIMAL_VALID_WORKFLOW = `
import { Agent } from '@crewspace/core';

const agent = new Agent({
  id: 'assistant',
  role: 'Assistant',
  goal: 'Help the user',
});

console.log(agent.id);
`;

const NO_IMPORTS_WORKFLOW = `
const x = 1;
console.log(x);
`;

const EMPTY_FILE = '';

const MISSING_AGENT_ID = `
import { Agent } from '@crewspace/core';

const agent = new Agent({
  role: 'Assistant',
  goal: 'Help the user',
});
`;

const MISSING_AGENT_ROLE = `
import { Agent } from '@crewspace/core';

const agent = new Agent({
  id: 'assistant',
  goal: 'Help the user',
});
`;

const MISSING_AGENT_GOAL = `
import { Agent } from '@crewspace/core';

const agent = new Agent({
  id: 'assistant',
  role: 'Assistant',
});
`;

const DUPLICATE_IDS = `
import { Agent, Crew } from '@crewspace/core';

const a1 = new Agent({
  id: 'agent-a',
  role: 'Role A',
  goal: 'Goal A',
});

const a2 = new Agent({
  id: 'agent-a',
  role: 'Role B',
  goal: 'Goal B',
});
`;

const MISSING_CREW_AGENTS = `
import { Crew } from '@crewspace/core';

const crew = new Crew({
  id: 'my-crew',
  tasks: [
    { id: 'task-1', description: 'Do something', agentId: 'agent-a' },
  ],
});
`;

const MISSING_CREW_TASKS = `
import { Agent, Crew } from '@crewspace/core';

const agent = new Agent({
  id: 'agent-a',
  role: 'Role A',
  goal: 'Goal A',
});

const crew = new Crew({
  id: 'my-crew',
  agents: [agent],
});
`;

const BAD_AGENT_REF = `
import { Agent, Crew } from '@crewspace/core';

const agent = new Agent({
  id: 'agent-a',
  role: 'Role A',
  goal: 'Goal A',
});

const crew = new Crew({
  id: 'my-crew',
  agents: [agent],
  tasks: [
    { id: 'task-1', description: 'Do something', agentId: 'nonexistent-agent' },
  ],
});
`;

const BAD_DEPENDENCY_REF = `
import { Agent, Crew } from '@crewspace/core';

const agent = new Agent({
  id: 'agent-a',
  role: 'Role A',
  goal: 'Goal A',
});

const crew = new Crew({
  id: 'my-crew',
  agents: [agent],
  tasks: [
    { id: 'task-1', description: 'First task', agentId: 'agent-a' },
    { id: 'task-2', description: 'Second task', agentId: 'agent-a', dependencies: ['nonexistent-task'] },
  ],
});
`;

const STRICT_MISSING_BACKSTORY = `
import { Agent } from '@crewspace/core';

const agent = new Agent({
  id: 'assistant',
  role: 'Assistant',
  goal: 'Help the user',
});
`;

// ---------------------------------------------------------------------------
// Tests — validateWorkflowFile
// ---------------------------------------------------------------------------

describe('validateWorkflowFile', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    cleanDir(tmpDir);
  });

  // -- File resolution --------------------------------------------------------

  it('should fail for non-existent file', () => {
    const result = validateWorkflowFile({ file: 'nonexistent.ts', cwd: tmpDir });
    expect(result.valid).toBe(false);
    expect(result.errorCount).toBe(1);
    expect(result.diagnostics[0].message).toContain('Workflow file not found');
  });

  it('should fail for unsupported extension', () => {
    writeFile(tmpDir, 'workflow.py', 'print("hi")');
    const result = validateWorkflowFile({ file: 'workflow.py', cwd: tmpDir });
    expect(result.valid).toBe(false);
    expect(result.errorCount).toBe(1);
    expect(result.diagnostics[0].message).toContain('Unsupported file extension');
  });

  it('should fail for a directory', () => {
    const subDir = path.join(tmpDir, 'subdir');
    fs.mkdirSync(subDir);
    const result = validateWorkflowFile({ file: 'subdir', cwd: tmpDir });
    expect(result.valid).toBe(false);
    expect(result.errorCount).toBe(1);
    expect(result.diagnostics[0].message).toContain('Not a file');
  });

  // -- Empty file -------------------------------------------------------------

  it('should fail for an empty file', () => {
    writeFile(tmpDir, 'empty.ts', EMPTY_FILE);
    const result = validateWorkflowFile({ file: 'empty.ts', cwd: tmpDir });
    expect(result.valid).toBe(false);
    expect(result.errorCount).toBe(1);
    expect(result.diagnostics[0].message).toBe('File is empty');
  });

  it('should fail for a whitespace-only file', () => {
    writeFile(tmpDir, 'whitespace.ts', '   \n  \n  ');
    const result = validateWorkflowFile({ file: 'whitespace.ts', cwd: tmpDir });
    expect(result.valid).toBe(false);
    expect(result.errorCount).toBe(1);
    expect(result.diagnostics[0].message).toBe('File is empty');
  });

  // -- Import checks ----------------------------------------------------------

  it('should warn when no @crewspace/core import is found', () => {
    writeFile(tmpDir, 'no-imports.ts', NO_IMPORTS_WORKFLOW);
    const result = validateWorkflowFile({ file: 'no-imports.ts', cwd: tmpDir });
    expect(result.valid).toBe(true);
    expect(result.warningCount).toBeGreaterThanOrEqual(1);
    expect(result.diagnostics.some((d) => d.message.includes('@crewspace/core import'))).toBe(
      true,
    );
  });

  it('should not warn for import from @crewspace/core', () => {
    writeFile(tmpDir, 'valid.ts', MINIMAL_VALID_WORKFLOW);
    const result = validateWorkflowFile({ file: 'valid.ts', cwd: tmpDir });
    expect(result.diagnostics.some((d) => d.message.includes('@crewspace/core import'))).toBe(
      false,
    );
  });

  // -- Agent / Crew detection -------------------------------------------------

  it('should warn when no Agent or Crew instantiation is found', () => {
    writeFile(tmpDir, 'no-agents.ts', NO_IMPORTS_WORKFLOW);
    const result = validateWorkflowFile({ file: 'no-agents.ts', cwd: tmpDir });
    expect(
      result.diagnostics.some((d) => d.message.includes('No Agent or Crew instantiation')),
    ).toBe(true);
  });

  it('should pass for a valid workflow with agents and crews', () => {
    writeFile(tmpDir, 'valid.ts', VALID_WORKFLOW);
    const result = validateWorkflowFile({ file: 'valid.ts', cwd: tmpDir });
    expect(result.valid).toBe(true);
    expect(result.errorCount).toBe(0);
  });

  it('should pass for a minimal valid workflow', () => {
    writeFile(tmpDir, 'minimal.ts', MINIMAL_VALID_WORKFLOW);
    const result = validateWorkflowFile({ file: 'minimal.ts', cwd: tmpDir });
    expect(result.valid).toBe(true);
    expect(result.errorCount).toBe(0);
  });

  // -- Required fields --------------------------------------------------------

  it('should error when Agent is missing id', () => {
    writeFile(tmpDir, 'bad.ts', MISSING_AGENT_ID);
    const result = validateWorkflowFile({ file: 'bad.ts', cwd: tmpDir });
    expect(result.valid).toBe(false);
    expect(result.diagnostics.some((d) => d.message.includes('missing required "id"'))).toBe(
      true,
    );
  });

  it('should error when Agent is missing role', () => {
    writeFile(tmpDir, 'bad.ts', MISSING_AGENT_ROLE);
    const result = validateWorkflowFile({ file: 'bad.ts', cwd: tmpDir });
    expect(result.valid).toBe(false);
    expect(result.diagnostics.some((d) => d.message.includes('missing required "role"'))).toBe(
      true,
    );
  });

  it('should error when Agent is missing goal', () => {
    writeFile(tmpDir, 'bad.ts', MISSING_AGENT_GOAL);
    const result = validateWorkflowFile({ file: 'bad.ts', cwd: tmpDir });
    expect(result.valid).toBe(false);
    expect(result.diagnostics.some((d) => d.message.includes('missing required "goal"'))).toBe(
      true,
    );
  });

  // -- Duplicate IDs ----------------------------------------------------------

  it('should error on duplicate agent ids', () => {
    writeFile(tmpDir, 'dup.ts', DUPLICATE_IDS);
    const result = validateWorkflowFile({ file: 'dup.ts', cwd: tmpDir });
    expect(result.valid).toBe(false);
    expect(result.diagnostics.some((d) => d.message.includes('Duplicate id "agent-a"'))).toBe(
      true,
    );
  });

  // -- Crew required fields ---------------------------------------------------

  it('should error when Crew is missing agents array', () => {
    writeFile(tmpDir, 'bad-crew.ts', MISSING_CREW_AGENTS);
    const result = validateWorkflowFile({ file: 'bad-crew.ts', cwd: tmpDir });
    expect(result.valid).toBe(false);
    expect(
      result.diagnostics.some((d) => d.message.includes('missing required "agents" array')),
    ).toBe(true);
  });

  it('should error when Crew is missing tasks array', () => {
    writeFile(tmpDir, 'bad-crew.ts', MISSING_CREW_TASKS);
    const result = validateWorkflowFile({ file: 'bad-crew.ts', cwd: tmpDir });
    expect(result.valid).toBe(false);
    expect(
      result.diagnostics.some((d) => d.message.includes('missing required "tasks" array')),
    ).toBe(true);
  });

  // -- Reference integrity ----------------------------------------------------

  it('should error when task references nonexistent agentId', () => {
    writeFile(tmpDir, 'bad-ref.ts', BAD_AGENT_REF);
    const result = validateWorkflowFile({ file: 'bad-ref.ts', cwd: tmpDir });
    expect(result.valid).toBe(false);
    expect(
      result.diagnostics.some((d) => d.message.includes('agentId "nonexistent-agent"')),
    ).toBe(true);
  });

  it('should error when task dependency references nonexistent task', () => {
    writeFile(tmpDir, 'bad-dep.ts', BAD_DEPENDENCY_REF);
    const result = validateWorkflowFile({ file: 'bad-dep.ts', cwd: tmpDir });
    expect(result.valid).toBe(false);
    expect(
      result.diagnostics.some((d) => d.message.includes('dependency "nonexistent-task"')),
    ).toBe(true);
  });

  // -- Strict mode ------------------------------------------------------------

  it('should warn about missing backstory in strict mode', () => {
    writeFile(tmpDir, 'strict.ts', STRICT_MISSING_BACKSTORY);
    const result = validateWorkflowFile({ file: 'strict.ts', cwd: tmpDir, strict: true });
    expect(
      result.diagnostics.some((d) => d.message.includes('backstory')),
    ).toBe(true);
  });

  it('should warn about missing llmProvider in strict mode', () => {
    writeFile(tmpDir, 'strict.ts', STRICT_MISSING_BACKSTORY);
    const result = validateWorkflowFile({ file: 'strict.ts', cwd: tmpDir, strict: true });
    expect(
      result.diagnostics.some((d) => d.message.includes('llmProvider')),
    ).toBe(true);
  });

  it('should not warn about backstory/llmProvider without strict mode', () => {
    writeFile(tmpDir, 'normal.ts', STRICT_MISSING_BACKSTORY);
    const result = validateWorkflowFile({ file: 'normal.ts', cwd: tmpDir, strict: false });
    expect(
      result.diagnostics.some((d) => d.message.includes('backstory')),
    ).toBe(false);
    expect(
      result.diagnostics.some((d) => d.message.includes('llmProvider')),
    ).toBe(false);
  });

  // -- Line numbers -----------------------------------------------------------

  it('should include line numbers for agent errors', () => {
    writeFile(tmpDir, 'lineno.ts', MISSING_AGENT_ROLE);
    const result = validateWorkflowFile({ file: 'lineno.ts', cwd: tmpDir });
    const errorDiag = result.diagnostics.find((d) => d.level === 'error');
    expect(errorDiag).toBeDefined();
    expect(errorDiag!.line).toBeGreaterThan(0);
  });

  // -- Resolved file path -----------------------------------------------------

  it('should return the resolved absolute file path', () => {
    writeFile(tmpDir, 'workflow.ts', VALID_WORKFLOW);
    const result = validateWorkflowFile({ file: 'workflow.ts', cwd: tmpDir });
    expect(path.isAbsolute(result.file)).toBe(true);
    expect(result.file).toBe(path.join(tmpDir, 'workflow.ts'));
  });

  // -- .js files --------------------------------------------------------------

  it('should validate .js files', () => {
    const jsWorkflow = `
const { Agent } = require('@crewspace/core');

const agent = new Agent({
  id: 'assistant',
  role: 'Assistant',
  goal: 'Help the user',
});
`;
    writeFile(tmpDir, 'workflow.js', jsWorkflow);
    const result = validateWorkflowFile({ file: 'workflow.js', cwd: tmpDir });
    expect(result.valid).toBe(true);
    expect(result.errorCount).toBe(0);
  });

  it('should detect require() style imports', () => {
    const jsWorkflow = `
const { Agent } = require('@crewspace/core');

const agent = new Agent({
  id: 'assistant',
  role: 'Assistant',
  goal: 'Help the user',
});
`;
    writeFile(tmpDir, 'workflow.js', jsWorkflow);
    const result = validateWorkflowFile({ file: 'workflow.js', cwd: tmpDir });
    expect(
      result.diagnostics.some((d) => d.message.includes('@crewspace/core import')),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tests — formatValidationResult
// ---------------------------------------------------------------------------

describe('formatValidationResult', () => {
  it('should show success checkmark for valid files', () => {
    const output = formatValidationResult({
      valid: true,
      file: '/path/to/workflow.ts',
      diagnostics: [],
      errorCount: 0,
      warningCount: 0,
    });
    expect(output).toContain('✓');
    expect(output).toContain('No issues found');
  });

  it('should show failure mark for invalid files', () => {
    const output = formatValidationResult({
      valid: false,
      file: '/path/to/workflow.ts',
      diagnostics: [{ level: 'error', message: 'File is empty' }],
      errorCount: 1,
      warningCount: 0,
    });
    expect(output).toContain('✗');
    expect(output).toContain('1 error');
  });

  it('should include line numbers when present', () => {
    const output = formatValidationResult({
      valid: false,
      file: '/path/to/workflow.ts',
      diagnostics: [
        { level: 'error', message: 'Agent is missing required "id" property', line: 5 },
      ],
      errorCount: 1,
      warningCount: 0,
    });
    expect(output).toContain('(line 5)');
  });

  it('should show both error and warning counts', () => {
    const output = formatValidationResult({
      valid: false,
      file: '/path/to/workflow.ts',
      diagnostics: [
        { level: 'error', message: 'Error 1' },
        { level: 'warning', message: 'Warning 1' },
        { level: 'warning', message: 'Warning 2' },
      ],
      errorCount: 1,
      warningCount: 2,
    });
    expect(output).toContain('1 error');
    expect(output).toContain('2 warnings');
  });

  it('should show checkmark with warnings for valid but warned files', () => {
    const output = formatValidationResult({
      valid: true,
      file: '/path/to/workflow.ts',
      diagnostics: [{ level: 'warning', message: 'Missing import' }],
      errorCount: 0,
      warningCount: 1,
    });
    expect(output).toContain('✓');
    expect(output).toContain('1 warning');
  });
});

// ---------------------------------------------------------------------------
// Tests — CLI integration (Commander parsing for `validate`)
// ---------------------------------------------------------------------------

describe('validate command integration', () => {
  let tmpDir: string;
  let origExitCode: number | undefined;

  beforeEach(() => {
    tmpDir = makeTempDir();
    origExitCode = process.exitCode;
  });

  afterEach(() => {
    process.exitCode = origExitCode;
    cleanDir(tmpDir);
  });

  it('should exit with code 0 for a valid workflow', async () => {
    writeFile(tmpDir, 'valid.ts', VALID_WORKFLOW);
    const program = createProgram();
    program.exitOverride();

    await program.parseAsync(
      ['validate', '--cwd', tmpDir, path.join(tmpDir, 'valid.ts')],
      { from: 'user' },
    );
    expect(process.exitCode).not.toBe(1);
  });

  it('should exit with code 1 for a non-existent file', async () => {
    const program = createProgram();
    program.exitOverride();

    await program.parseAsync(['validate', 'nonexistent.ts'], { from: 'user' });
    expect(process.exitCode).toBe(1);
  });

  it('should exit with code 1 for an empty file', async () => {
    writeFile(tmpDir, 'empty.ts', '');
    const program = createProgram();
    program.exitOverride();

    await program.parseAsync(
      ['validate', '--cwd', tmpDir, path.join(tmpDir, 'empty.ts')],
      { from: 'user' },
    );
    expect(process.exitCode).toBe(1);
  });

  it('should exit with code 1 for a file with validation errors', async () => {
    writeFile(tmpDir, 'bad.ts', MISSING_AGENT_ID);
    const program = createProgram();
    program.exitOverride();

    await program.parseAsync(
      ['validate', '--cwd', tmpDir, path.join(tmpDir, 'bad.ts')],
      { from: 'user' },
    );
    expect(process.exitCode).toBe(1);
  });

  it('should accept --strict flag', async () => {
    writeFile(tmpDir, 'strict.ts', STRICT_MISSING_BACKSTORY);
    const program = createProgram();
    program.exitOverride();

    const validateCmd = program.commands.find((c) => c.name() === 'validate')!;
    await program.parseAsync(
      ['validate', '--strict', path.join(tmpDir, 'strict.ts')],
      { from: 'user' },
    );
    expect(validateCmd.opts()['strict']).toBe(true);
  });

  it('should not set exit code 1 for warnings only', async () => {
    writeFile(tmpDir, 'warn.ts', NO_IMPORTS_WORKFLOW);
    const program = createProgram();
    program.exitOverride();

    process.exitCode = 0;
    await program.parseAsync(
      ['validate', '--cwd', tmpDir, path.join(tmpDir, 'warn.ts')],
      { from: 'user' },
    );
    expect(process.exitCode).not.toBe(1);
  });
});
