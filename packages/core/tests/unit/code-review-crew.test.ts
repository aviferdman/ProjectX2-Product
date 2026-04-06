/**
 * Tests for TASK-086: Code Review Crew Example
 *
 * Validates the code review crew example file, its structure, and that the
 * multi-agent code review workflow with file tools works end-to-end.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Agent } from '../../src/agent/agent.js';
import { Crew } from '../../src/crew/crew.js';
import { createFileTools } from '../../src/tools/file/index.js';
import { ToolCategory, ToolPermission } from '../../src/types/tool.js';
import type { LLMProvider, LLMResponse, LLMMessage } from '../../src/types/index.js';

const currentFilename = fileURLToPath(import.meta.url);
const currentDirname = dirname(currentFilename);
const PROJECT_ROOT = join(currentDirname, '../../../..');
const EXAMPLES_DIR = join(PROJECT_ROOT, 'examples');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockLLMProvider(content?: string): LLMProvider {
  return {
    name: 'mock-provider',
    generateText: vi
      .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
      .mockResolvedValue({
        content: content ?? 'Mock response',
        tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        finishReason: 'stop',
      }),
  };
}

// ---------------------------------------------------------------------------
// Example file validation
// ---------------------------------------------------------------------------

describe('TASK-086: Code Review Crew — Example File', () => {
  const examplePath = join(EXAMPLES_DIR, 'code-review-crew.ts');
  let content: string;

  it('should exist at examples/code-review-crew.ts', () => {
    expect(existsSync(examplePath)).toBe(true);
    content = readFileSync(examplePath, 'utf-8');
  });

  it('should include a file header comment', () => {
    expect(content).toMatch(/^\/\*\*/);
  });

  it('should import Agent and Crew from @crewspace/core', () => {
    expect(content).toContain('Agent');
    expect(content).toContain('Crew');
    expect(content).toContain("from '@crewspace/core'");
  });

  it('should import createFileTools from @crewspace/core', () => {
    expect(content).toContain('createFileTools');
  });

  it('should create at least three agents', () => {
    const agentCreations = content.match(/new Agent\(/g) ?? [];
    expect(agentCreations.length).toBeGreaterThanOrEqual(3);
  });

  it('should create a Crew', () => {
    expect(content).toContain('new Crew');
  });

  it('should call crew.run() or reviewCrew.run()', () => {
    expect(content).toMatch(/\.run\(\)/);
  });

  it('should demonstrate task dependencies', () => {
    expect(content).toContain('dependencies');
  });

  it('should assign file tools to agents', () => {
    expect(content).toContain('fileTools.readFile');
    expect(content).toContain('fileTools.writeFile');
    expect(content).toContain('fileTools.listFiles');
  });

  it('should show lifecycle event subscription', () => {
    expect(content).toContain(".on('crew:");
  });

  it('should include usage instructions in header', () => {
    expect(content).toContain('npx tsx examples/code-review-crew.ts');
  });

  it('should mention mock provider replacement', () => {
    expect(content).toMatch(/[Rr]eplace.*real provider|[Mm]ock.*provider/);
  });

  it('should define agents with distinct roles', () => {
    expect(content).toMatch(/role:.*[Ss]canner/);
    expect(content).toMatch(/role:.*[Rr]eviewer/);
    expect(content).toMatch(/role:.*[Rr]eport/);
  });

  it('should define agents with backstories', () => {
    const backstoryCount = (content.match(/backstory:/g) ?? []).length;
    expect(backstoryCount).toBeGreaterThanOrEqual(3);
  });

  it('should use expectedOutput for tasks', () => {
    const expectedOutputCount = (content.match(/expectedOutput:/g) ?? []).length;
    expect(expectedOutputCount).toBeGreaterThanOrEqual(1);
  });

  it('should include code review terminology', () => {
    expect(content).toMatch(/[Bb]ug|[Ss]ecurity|[Ss]tyle|[Pp]erformance/);
    expect(content).toMatch(/[Ss]everity|[Ff]inding|[Rr]eview/);
  });
});

// ---------------------------------------------------------------------------
// File tools for code review
// ---------------------------------------------------------------------------

describe('TASK-086: Code Review Crew — File Tools', () => {
  it('should create file tools bundle with all three tools', () => {
    const tools = createFileTools({ basePath: '.' });
    expect(tools.readFile).toBeDefined();
    expect(tools.writeFile).toBeDefined();
    expect(tools.listFiles).toBeDefined();
  });

  it('file tools should have correct names', () => {
    const tools = createFileTools({ basePath: '.' });
    expect(tools.readFile.name).toBe('readFile');
    expect(tools.writeFile.name).toBe('writeFile');
    expect(tools.listFiles.name).toBe('listFiles');
  });

  it('file tools should have FILE category', () => {
    const tools = createFileTools({ basePath: '.' });
    expect(tools.readFile.category).toBe(ToolCategory.FILE);
    expect(tools.writeFile.category).toBe(ToolCategory.FILE);
    expect(tools.listFiles.category).toBe(ToolCategory.FILE);
  });

  it('readFile and listFiles should have FILE_READ permission', () => {
    const tools = createFileTools({ basePath: '.' });
    expect(tools.readFile.permissions).toContain(ToolPermission.FILE_READ);
    expect(tools.listFiles.permissions).toContain(ToolPermission.FILE_READ);
  });

  it('writeFile should have FILE_WRITE permission', () => {
    const tools = createFileTools({ basePath: '.' });
    expect(tools.writeFile.permissions).toContain(ToolPermission.FILE_WRITE);
  });
});

// ---------------------------------------------------------------------------
// Agent + tools registration for code review
// ---------------------------------------------------------------------------

describe('TASK-086: Code Review Crew — Agent Tool Registration', () => {
  it('should register readFile and listFiles on scanner agent', () => {
    const tools = createFileTools({ basePath: '.' });
    const agent = new Agent({
      id: 'scanner',
      role: 'Code Scanner',
      goal: 'Scan project files',
      tools: [tools.listFiles, tools.readFile],
      llmProvider: createMockLLMProvider(),
    });

    expect(agent.hasTool('listFiles')).toBe(true);
    expect(agent.hasTool('readFile')).toBe(true);
    expect(agent.tools.size).toBe(2);
  });

  it('should register readFile and listFiles on reviewer agent', () => {
    const tools = createFileTools({ basePath: '.' });
    const agent = new Agent({
      id: 'reviewer',
      role: 'Senior Code Reviewer',
      goal: 'Review source code',
      tools: [tools.readFile, tools.listFiles],
      llmProvider: createMockLLMProvider(),
    });

    expect(agent.hasTool('readFile')).toBe(true);
    expect(agent.hasTool('listFiles')).toBe(true);
    expect(agent.tools.size).toBe(2);
  });

  it('should register writeFile and listFiles on reporter agent', () => {
    const tools = createFileTools({ basePath: '.' });
    const agent = new Agent({
      id: 'reporter',
      role: 'Review Report Writer',
      goal: 'Write review reports',
      tools: [tools.writeFile, tools.listFiles],
      llmProvider: createMockLLMProvider(),
    });

    expect(agent.hasTool('writeFile')).toBe(true);
    expect(agent.hasTool('listFiles')).toBe(true);
    expect(agent.tools.size).toBe(2);
  });

  it('should include tool descriptions in agent system prompt', () => {
    const tools = createFileTools({ basePath: '.' });
    const agent = new Agent({
      id: 'review-agent',
      role: 'Code Reviewer',
      goal: 'Review code',
      tools: [tools.readFile, tools.listFiles],
      llmProvider: createMockLLMProvider(),
    });

    const systemPrompt = agent.buildSystemPrompt();
    expect(systemPrompt).toContain('Available tools');
    expect(systemPrompt).toContain('readFile');
    expect(systemPrompt).toContain('listFiles');
  });
});

// ---------------------------------------------------------------------------
// Functional validation — code review crew workflow
// ---------------------------------------------------------------------------

describe('TASK-086: Code Review Crew — Functional Validation', () => {
  let scannerAgent: Agent;
  let reviewerAgent: Agent;
  let reporterAgent: Agent;

  beforeEach(() => {
    const fileToolBundle = createFileTools({ basePath: '.' });

    scannerAgent = new Agent({
      id: 'scanner',
      role: 'Code Scanner',
      goal: 'Scan project files and identify which ones to review',
      backstory: 'Expert at identifying high-risk source files.',
      tools: [fileToolBundle.listFiles, fileToolBundle.readFile],
      llmProvider: createMockLLMProvider(
        'Files to review:\n1. src/utils.ts (high priority)\n2. src/api.ts (high priority)\n3. src/config.ts (medium priority)',
      ),
    });

    reviewerAgent = new Agent({
      id: 'reviewer',
      role: 'Senior Code Reviewer',
      goal: 'Review source code for bugs, security issues, and style problems',
      backstory: 'Senior engineer with 15 years of code review experience.',
      tools: [fileToolBundle.readFile, fileToolBundle.listFiles],
      llmProvider: createMockLLMProvider(
        '## Findings\n- Bug: Division by zero in utils.ts:42\n- Security: SQL injection in api.ts:23\n- Style: Magic number in utils.ts:15',
      ),
    });

    reporterAgent = new Agent({
      id: 'reporter',
      role: 'Review Report Writer',
      goal: 'Compile findings into a structured review report',
      backstory: 'Technical writer specializing in code review reports.',
      tools: [fileToolBundle.writeFile, fileToolBundle.listFiles],
      llmProvider: createMockLLMProvider(
        '# Code Review Report\n\n## Summary\n1 critical, 1 high, 1 low severity issues found.\n\n## Action Items\n1. Fix SQL injection\n2. Add zero-division guard\n3. Replace magic numbers',
      ),
    });
  });

  it('should run the full code review crew workflow end-to-end', async () => {
    const crew = new Crew({
      id: 'code-review-crew',
      name: 'Code Review Crew',
      agents: [scannerAgent, reviewerAgent, reporterAgent],
      tasks: [
        {
          id: 'scan',
          description: 'Scan project files for review',
          agentId: 'scanner',
        },
        {
          id: 'review',
          description: 'Review the identified source files',
          agentId: 'reviewer',
          dependencies: ['scan'],
        },
        {
          id: 'write-report',
          description: 'Compile review findings into a report',
          agentId: 'reporter',
          dependencies: ['review'],
        },
      ],
    });

    const result = await crew.run();

    expect(result.success).toBe(true);
    expect(result.taskResults.size).toBe(3);
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('should execute tasks in dependency order: scan → review → report', async () => {
    const executionOrder: string[] = [];

    const crew = new Crew({
      id: 'order-crew',
      agents: [scannerAgent, reviewerAgent, reporterAgent],
      tasks: [
        {
          id: 'scan',
          description: 'Scan files',
          agentId: 'scanner',
        },
        {
          id: 'review',
          description: 'Review code',
          agentId: 'reviewer',
          dependencies: ['scan'],
        },
        {
          id: 'write-report',
          description: 'Write report',
          agentId: 'reporter',
          dependencies: ['review'],
        },
      ],
    });

    crew.on('crew:task:start', (_crewId, taskId) => {
      executionOrder.push(taskId);
    });

    await crew.run();

    expect(executionOrder).toEqual(['scan', 'review', 'write-report']);
  });

  it('should pass scanner output as context to reviewer', async () => {
    let reviewerMessages: readonly LLMMessage[] = [];

    const reviewerProvider: LLMProvider = {
      name: 'reviewer-capture',
      generateText: vi
        .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
        .mockImplementation(async (messages) => {
          reviewerMessages = messages;
          return {
            content: 'Review complete: no critical issues',
            tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
            finishReason: 'stop',
          };
        }),
    };

    const fileToolBundle = createFileTools({ basePath: '.' });
    const customReviewer = new Agent({
      id: 'reviewer',
      role: 'Reviewer',
      goal: 'Review code',
      tools: [fileToolBundle.readFile],
      llmProvider: reviewerProvider,
    });

    const crew = new Crew({
      id: 'context-crew',
      agents: [scannerAgent, customReviewer, reporterAgent],
      tasks: [
        {
          id: 'scan',
          description: 'Scan project files',
          agentId: 'scanner',
        },
        {
          id: 'review',
          description: 'Review the scanned files',
          agentId: 'reviewer',
          dependencies: ['scan'],
        },
        {
          id: 'write-report',
          description: 'Write the report',
          agentId: 'reporter',
          dependencies: ['review'],
        },
      ],
    });

    await crew.run();

    // The reviewer should receive the scanner's output as context
    const userMessage = reviewerMessages.find((m) => m.role === 'user');
    expect(userMessage?.content).toContain('utils.ts');
  });

  it('should emit all crew lifecycle events', async () => {
    const events: string[] = [];

    const crew = new Crew({
      id: 'events-crew',
      agents: [scannerAgent, reviewerAgent, reporterAgent],
      tasks: [
        {
          id: 'scan',
          description: 'Scan',
          agentId: 'scanner',
        },
        {
          id: 'review',
          description: 'Review',
          agentId: 'reviewer',
          dependencies: ['scan'],
        },
        {
          id: 'write-report',
          description: 'Report',
          agentId: 'reporter',
          dependencies: ['review'],
        },
      ],
    });

    crew.on('crew:start', () => events.push('crew:start'));
    crew.on('crew:task:start', () => events.push('crew:task:start'));
    crew.on('crew:task:complete', () => events.push('crew:task:complete'));
    crew.on('crew:complete', () => events.push('crew:complete'));

    await crew.run();

    expect(events).toEqual([
      'crew:start',
      'crew:task:start',
      'crew:task:complete',
      'crew:task:start',
      'crew:task:complete',
      'crew:task:start',
      'crew:task:complete',
      'crew:complete',
    ]);
  });

  it('should include token usage in all task results', async () => {
    const crew = new Crew({
      id: 'token-crew',
      agents: [scannerAgent, reviewerAgent, reporterAgent],
      tasks: [
        {
          id: 'scan',
          description: 'Scan',
          agentId: 'scanner',
        },
        {
          id: 'review',
          description: 'Review',
          agentId: 'reviewer',
          dependencies: ['scan'],
        },
        {
          id: 'write-report',
          description: 'Report',
          agentId: 'reporter',
          dependencies: ['review'],
        },
      ],
    });

    const result = await crew.run();

    for (const [, taskResult] of result.taskResults) {
      expect(taskResult.tokenUsage).toBeDefined();
      expect(taskResult.tokenUsage!.promptTokens).toBeGreaterThan(0);
      expect(taskResult.tokenUsage!.completionTokens).toBeGreaterThan(0);
      expect(taskResult.tokenUsage!.totalTokens).toBeGreaterThan(0);
    }
  });

  it('should produce meaningful output for each task', async () => {
    const crew = new Crew({
      id: 'output-crew',
      agents: [scannerAgent, reviewerAgent, reporterAgent],
      tasks: [
        {
          id: 'scan',
          description: 'Scan',
          agentId: 'scanner',
        },
        {
          id: 'review',
          description: 'Review',
          agentId: 'reviewer',
          dependencies: ['scan'],
        },
        {
          id: 'write-report',
          description: 'Report',
          agentId: 'reporter',
          dependencies: ['review'],
        },
      ],
    });

    const result = await crew.run();

    const scanResult = result.taskResults.get('scan');
    expect(scanResult).toBeDefined();
    expect(scanResult!.output.length).toBeGreaterThan(0);

    const reviewResult = result.taskResults.get('review');
    expect(reviewResult).toBeDefined();
    expect(reviewResult!.output.length).toBeGreaterThan(0);

    const reportResult = result.taskResults.get('write-report');
    expect(reportResult).toBeDefined();
    expect(reportResult!.output.length).toBeGreaterThan(0);
  });

  it('should handle a crew with only two review tasks (scan + review, no report)', async () => {
    const crew = new Crew({
      id: 'minimal-review-crew',
      agents: [scannerAgent, reviewerAgent],
      tasks: [
        {
          id: 'scan',
          description: 'Scan files',
          agentId: 'scanner',
        },
        {
          id: 'review',
          description: 'Review scanned files',
          agentId: 'reviewer',
          dependencies: ['scan'],
        },
      ],
    });

    const result = await crew.run();

    expect(result.success).toBe(true);
    expect(result.taskResults.size).toBe(2);
  });
});
