/**
 * Tests for TASK-091: Autonomous Task Completion Example
 *
 * Validates the autonomous task completion example file, its structure, custom tools,
 * and that the multi-agent autonomous workflow works end-to-end.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

import { Agent } from '../../src/agent/agent.js';
import { Crew } from '../../src/crew/crew.js';
import { defineTool } from '../../src/tool/define-tool.js';
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

function createRegisterTaskTool() {
  return defineTool({
    name: 'registerTask',
    description: 'Register a sub-task in the task registry with its details and priority',
    schema: z.object({
      taskId: z.string(),
      title: z.string(),
      priority: z.enum(['high', 'medium', 'low']),
      estimatedEffort: z.string(),
    }),
    async execute({ taskId, title, priority, estimatedEffort }) {
      return (
        `Task registered: ${taskId}\n` +
        `  Title: ${title}\n` +
        `  Priority: ${priority}\n` +
        `  Estimated effort: ${estimatedEffort}`
      );
    },
  });
}

function createStoreArtifactTool() {
  return defineTool({
    name: 'storeArtifact',
    description: 'Store a named artifact produced during task execution',
    schema: z.object({
      name: z.string(),
      type: z.enum(['code', 'data', 'config', 'document', 'report']),
      content: z.string(),
    }),
    async execute({ name, type, content }) {
      const sizeKb = Math.ceil(content.length / 1024);
      return `Artifact stored: ${name}\n  Type: ${type}\n  Size: ${String(sizeKb)} KB`;
    },
  });
}

function createQualityCheckTool() {
  return defineTool({
    name: 'qualityCheck',
    description: 'Run a quality check against an artifact',
    schema: z.object({
      artifactName: z.string(),
      criteria: z.array(z.string()),
    }),
    async execute({ artifactName, criteria }) {
      const results = criteria.map((criterion) => `  ✓ ${criterion}: PASS`);
      return `Quality Check: ${artifactName}\n${results.join('\n')}\n  Score: 100%\n  Verdict: APPROVED`;
    },
  });
}

function createUpdateTaskStatusTool() {
  return defineTool({
    name: 'updateTaskStatus',
    description: 'Update the completion status of a registered sub-task',
    schema: z.object({
      taskId: z.string(),
      status: z.enum(['pending', 'in-progress', 'completed', 'failed', 'skipped']),
      notes: z.string().optional(),
    }),
    async execute({ taskId, status, notes }) {
      const noteStr = notes ? `\n  Notes: ${notes}` : '';
      return `Task ${taskId} → ${status}${noteStr}`;
    },
  });
}

// ---------------------------------------------------------------------------
// Example file validation
// ---------------------------------------------------------------------------

describe('TASK-091: Autonomous Task Completion — Example File', () => {
  const examplePath = join(EXAMPLES_DIR, 'autonomous-task-completion.ts');
  let content: string;

  it('should exist at examples/autonomous-task-completion.ts', () => {
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

  it('should import defineTool from @crewspace/core', () => {
    expect(content).toContain('defineTool');
  });

  it('should import zod for tool schemas', () => {
    expect(content).toContain("from 'zod'");
  });

  it('should create at least four agents (planner, executor, validator, reporter)', () => {
    const agentCreations = content.match(/new Agent\(/g) ?? [];
    expect(agentCreations.length).toBeGreaterThanOrEqual(4);
  });

  it('should create a Crew', () => {
    expect(content).toContain('new Crew');
  });

  it('should call crew.run()', () => {
    expect(content).toMatch(/\.run\(\)/);
  });

  it('should demonstrate task dependencies', () => {
    expect(content).toContain('dependencies');
  });

  it('should define custom tools using defineTool', () => {
    const defineToolCalls = content.match(/defineTool\(/g) ?? [];
    expect(defineToolCalls.length).toBeGreaterThanOrEqual(3);
  });

  it('should define a registerTask tool', () => {
    expect(content).toContain('registerTask');
  });

  it('should define a storeArtifact tool', () => {
    expect(content).toContain('storeArtifact');
  });

  it('should define a qualityCheck tool', () => {
    expect(content).toContain('qualityCheck');
  });

  it('should define an updateTaskStatus tool', () => {
    expect(content).toContain('updateTaskStatus');
  });

  it('should show lifecycle event subscription', () => {
    expect(content).toContain(".on('crew:");
  });

  it('should include usage instructions in header', () => {
    expect(content).toContain('npx tsx examples/autonomous-task-completion.ts');
  });

  it('should mention mock provider replacement', () => {
    expect(content).toMatch(/[Rr]eplace.*real provider|[Mm]ock.*provider/);
  });

  it('should define agents with distinct autonomous roles', () => {
    expect(content).toMatch(/role:.*[Pp]lanner/);
    expect(content).toMatch(/role:.*[Ee]xecutor/);
    expect(content).toMatch(/role:.*[Vv]alidator/);
    expect(content).toMatch(/role:.*[Rr]eport/);
  });

  it('should define agents with backstories', () => {
    const backstoryCount = (content.match(/backstory:/g) ?? []).length;
    expect(backstoryCount).toBeGreaterThanOrEqual(4);
  });

  it('should use expectedOutput for tasks', () => {
    const expectedOutputCount = (content.match(/expectedOutput:/g) ?? []).length;
    expect(expectedOutputCount).toBeGreaterThanOrEqual(4);
  });

  it('should include autonomous workflow terminology', () => {
    expect(content).toMatch(/[Aa]utonom/);
    expect(content).toMatch(/[Pp]lan|[Ee]xecut|[Vv]alidat|[Rr]eport/);
  });

  it('should use Zod schemas for tool inputs', () => {
    expect(content).toContain('z.object');
    expect(content).toContain('z.string()');
    expect(content).toContain('z.enum');
  });

  it('should demonstrate the four-phase workflow (plan → execute → validate → report)', () => {
    expect(content).toContain("id: 'plan'");
    expect(content).toContain("id: 'execute'");
    expect(content).toContain("id: 'validate'");
    expect(content).toContain("id: 'report'");
  });
});

// ---------------------------------------------------------------------------
// Custom tool validation
// ---------------------------------------------------------------------------

describe('TASK-091: Autonomous Task Completion — Custom Tools', () => {
  it('should create a valid registerTask tool via defineTool', () => {
    const tool = createRegisterTaskTool();
    expect(tool.name).toBe('registerTask');
    expect(tool.description).toContain('task');
    expect(tool.inputSchema).toBeDefined();
    expect(typeof tool.execute).toBe('function');
  });

  it('registerTask should return formatted registration', async () => {
    const tool = createRegisterTaskTool();
    const result = await tool.execute({
      taskId: 'auth-module',
      title: 'Implement authentication',
      priority: 'high',
      estimatedEffort: '2 hours',
    });
    expect(result).toContain('auth-module');
    expect(result).toContain('Implement authentication');
    expect(result).toContain('high');
    expect(result).toContain('2 hours');
  });

  it('should create a valid storeArtifact tool via defineTool', () => {
    const tool = createStoreArtifactTool();
    expect(tool.name).toBe('storeArtifact');
    expect(tool.description).toContain('artifact');
    expect(tool.inputSchema).toBeDefined();
    expect(typeof tool.execute).toBe('function');
  });

  it('storeArtifact should return stored confirmation', async () => {
    const tool = createStoreArtifactTool();
    const result = await tool.execute({
      name: 'src/auth/jwt.ts',
      type: 'code',
      content: 'export function signToken() { /* ... */ }',
    });
    expect(result).toContain('src/auth/jwt.ts');
    expect(result).toContain('code');
    expect(result).toContain('KB');
  });

  it('should create a valid qualityCheck tool via defineTool', () => {
    const tool = createQualityCheckTool();
    expect(tool.name).toBe('qualityCheck');
    expect(tool.description).toContain('quality');
    expect(tool.inputSchema).toBeDefined();
    expect(typeof tool.execute).toBe('function');
  });

  it('qualityCheck should return check results with score', async () => {
    const tool = createQualityCheckTool();
    const result = await tool.execute({
      artifactName: 'auth-module',
      criteria: ['Secure algorithm', 'Password hashing', 'Token refresh'],
    });
    expect(result).toContain('auth-module');
    expect(result).toContain('PASS');
    expect(result).toContain('Score');
    expect(result).toContain('APPROVED');
  });

  it('should create a valid updateTaskStatus tool via defineTool', () => {
    const tool = createUpdateTaskStatusTool();
    expect(tool.name).toBe('updateTaskStatus');
    expect(tool.description).toContain('status');
    expect(tool.inputSchema).toBeDefined();
    expect(typeof tool.execute).toBe('function');
  });

  it('updateTaskStatus should return status update', async () => {
    const tool = createUpdateTaskStatusTool();
    const result = await tool.execute({
      taskId: 'auth-module',
      status: 'completed',
      notes: 'All tests passing',
    });
    expect(result).toContain('auth-module');
    expect(result).toContain('completed');
    expect(result).toContain('All tests passing');
  });

  it('updateTaskStatus should work without optional notes', async () => {
    const tool = createUpdateTaskStatusTool();
    const result = await tool.execute({
      taskId: 'scaffold',
      status: 'in-progress',
    });
    expect(result).toContain('scaffold');
    expect(result).toContain('in-progress');
    expect(result).not.toContain('Notes');
  });

  it('tools created by defineTool should be frozen', () => {
    const tool = createRegisterTaskTool();
    expect(Object.isFrozen(tool)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Agent + tools registration
// ---------------------------------------------------------------------------

describe('TASK-091: Autonomous Task Completion — Agent Tool Registration', () => {
  it('should register registerTask on planner agent', () => {
    const tool = createRegisterTaskTool();
    const agent = new Agent({
      id: 'planner',
      role: 'Autonomous Task Planner',
      goal: 'Decompose goals into sub-tasks',
      tools: [tool],
      llmProvider: createMockLLMProvider(),
    });

    expect(agent.hasTool('registerTask')).toBe(true);
    expect(agent.tools.size).toBe(1);
  });

  it('should register storeArtifact and updateTaskStatus on executor agent', () => {
    const storeTool = createStoreArtifactTool();
    const statusTool = createUpdateTaskStatusTool();
    const agent = new Agent({
      id: 'executor',
      role: 'Autonomous Task Executor',
      goal: 'Execute sub-tasks and produce artifacts',
      tools: [storeTool, statusTool],
      llmProvider: createMockLLMProvider(),
    });

    expect(agent.hasTool('storeArtifact')).toBe(true);
    expect(agent.hasTool('updateTaskStatus')).toBe(true);
    expect(agent.tools.size).toBe(2);
  });

  it('should register qualityCheck on validator agent', () => {
    const tool = createQualityCheckTool();
    const agent = new Agent({
      id: 'validator',
      role: 'Quality Assurance Validator',
      goal: 'Validate artifacts for quality',
      tools: [tool],
      llmProvider: createMockLLMProvider(),
    });

    expect(agent.hasTool('qualityCheck')).toBe(true);
    expect(agent.tools.size).toBe(1);
  });

  it('should allow reporter agent with no tools', () => {
    const agent = new Agent({
      id: 'reporter',
      role: 'Completion Report Specialist',
      goal: 'Compile final completion reports',
      llmProvider: createMockLLMProvider(),
    });

    expect(agent.tools.size).toBe(0);
  });

  it('should include tool descriptions in agent system prompt', () => {
    const tool = createRegisterTaskTool();
    const agent = new Agent({
      id: 'planner-prompt',
      role: 'Task Planner',
      goal: 'Plan tasks',
      tools: [tool],
      llmProvider: createMockLLMProvider(),
    });

    const systemPrompt = agent.buildSystemPrompt();
    expect(systemPrompt).toContain('Available tools');
    expect(systemPrompt).toContain('registerTask');
  });
});

// ---------------------------------------------------------------------------
// Functional validation — autonomous task completion workflow
// ---------------------------------------------------------------------------

describe('TASK-091: Autonomous Task Completion — Functional Validation', () => {
  let plannerAgent: Agent;
  let executorAgent: Agent;
  let validatorAgent: Agent;
  let reporterAgent: Agent;

  beforeEach(() => {
    plannerAgent = new Agent({
      id: 'planner',
      role: 'Autonomous Task Planner',
      goal: 'Decompose goals into ordered sub-tasks',
      backstory: 'Expert project planner who breaks down complex goals.',
      tools: [createRegisterTaskTool()],
      llmProvider: createMockLLMProvider(
        '## Execution Plan\n\n' +
          '1. project-scaffold [HIGH] — Initialize project\n' +
          '2. auth-module [HIGH] — Implement authentication\n' +
          '3. test-suite [MEDIUM] — Write tests',
      ),
    });

    executorAgent = new Agent({
      id: 'executor',
      role: 'Autonomous Task Executor',
      goal: 'Execute sub-tasks and produce artifacts',
      backstory: 'Skilled engineer who autonomously executes plans.',
      tools: [createStoreArtifactTool(), createUpdateTaskStatusTool()],
      llmProvider: createMockLLMProvider(
        '## Execution Report\n\n' +
          'Step 1: project-scaffold ✓ — Created project structure\n' +
          'Step 2: auth-module ✓ — Implemented JWT auth\n' +
          'Step 3: test-suite ✓ — Wrote 24 tests, 87% coverage\n\n' +
          'All sub-tasks completed successfully.',
      ),
    });

    validatorAgent = new Agent({
      id: 'validator',
      role: 'Quality Assurance Validator',
      goal: 'Validate artifacts for quality and completeness',
      backstory: 'Thorough QA specialist who reviews every artifact.',
      tools: [createQualityCheckTool()],
      llmProvider: createMockLLMProvider(
        '## Validation Report\n\n' +
          'All artifacts passed quality checks.\n' +
          'Overall score: 100% — APPROVED',
      ),
    });

    reporterAgent = new Agent({
      id: 'reporter',
      role: 'Completion Report Specialist',
      goal: 'Compile final completion reports',
      backstory: 'Technical writer producing comprehensive reports.',
      llmProvider: createMockLLMProvider(
        '## Final Report\n\n' +
          'Status: ✅ COMPLETE\n' +
          'All 3 sub-tasks completed and validated.\n' +
          'Quality score: 100%',
      ),
    });
  });

  it('should run the full autonomous workflow end-to-end', async () => {
    const crew = new Crew({
      id: 'autonomous-task-crew',
      name: 'Autonomous Task Completion Crew',
      agents: [plannerAgent, executorAgent, validatorAgent, reporterAgent],
      tasks: [
        {
          id: 'plan',
          description: 'Decompose goal into sub-tasks',
          agentId: 'planner',
        },
        {
          id: 'execute',
          description: 'Execute all sub-tasks',
          agentId: 'executor',
          dependencies: ['plan'],
        },
        {
          id: 'validate',
          description: 'Validate all artifacts',
          agentId: 'validator',
          dependencies: ['execute'],
        },
        {
          id: 'report',
          description: 'Compile completion report',
          agentId: 'reporter',
          dependencies: ['validate'],
        },
      ],
    });

    const result = await crew.run();

    expect(result.success).toBe(true);
    expect(result.taskResults.size).toBe(4);
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('should execute tasks in dependency order: plan → execute → validate → report', async () => {
    const executionOrder: string[] = [];

    const crew = new Crew({
      id: 'order-crew',
      agents: [plannerAgent, executorAgent, validatorAgent, reporterAgent],
      tasks: [
        {
          id: 'plan',
          description: 'Plan',
          agentId: 'planner',
        },
        {
          id: 'execute',
          description: 'Execute',
          agentId: 'executor',
          dependencies: ['plan'],
        },
        {
          id: 'validate',
          description: 'Validate',
          agentId: 'validator',
          dependencies: ['execute'],
        },
        {
          id: 'report',
          description: 'Report',
          agentId: 'reporter',
          dependencies: ['validate'],
        },
      ],
    });

    crew.on('crew:task:start', (_crewId, taskId) => {
      executionOrder.push(taskId);
    });

    await crew.run();

    expect(executionOrder).toEqual(['plan', 'execute', 'validate', 'report']);
  });

  it('should pass plan output as context to executor agent', async () => {
    let executorMessages: readonly LLMMessage[] = [];

    const captureProvider: LLMProvider = {
      name: 'executor-capture',
      generateText: vi
        .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
        .mockImplementation(async (messages) => {
          executorMessages = messages;
          return {
            content: 'Execution complete: all tasks done',
            tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
            finishReason: 'stop',
          };
        }),
    };

    const customExecutor = new Agent({
      id: 'executor',
      role: 'Task Executor',
      goal: 'Execute tasks',
      tools: [createStoreArtifactTool(), createUpdateTaskStatusTool()],
      llmProvider: captureProvider,
    });

    const crew = new Crew({
      id: 'context-crew',
      agents: [plannerAgent, customExecutor, validatorAgent, reporterAgent],
      tasks: [
        {
          id: 'plan',
          description: 'Plan the tasks',
          agentId: 'planner',
        },
        {
          id: 'execute',
          description: 'Execute tasks from plan',
          agentId: 'executor',
          dependencies: ['plan'],
        },
        {
          id: 'validate',
          description: 'Validate',
          agentId: 'validator',
          dependencies: ['execute'],
        },
        {
          id: 'report',
          description: 'Report',
          agentId: 'reporter',
          dependencies: ['validate'],
        },
      ],
    });

    await crew.run();

    // Executor should receive planner output as context
    const userMessage = executorMessages.find((m) => m.role === 'user');
    expect(userMessage?.content).toContain('Execution Plan');
  });

  it('should emit all crew lifecycle events', async () => {
    const events: string[] = [];

    const crew = new Crew({
      id: 'events-crew',
      agents: [plannerAgent, executorAgent, validatorAgent, reporterAgent],
      tasks: [
        {
          id: 'plan',
          description: 'Plan',
          agentId: 'planner',
        },
        {
          id: 'execute',
          description: 'Execute',
          agentId: 'executor',
          dependencies: ['plan'],
        },
        {
          id: 'validate',
          description: 'Validate',
          agentId: 'validator',
          dependencies: ['execute'],
        },
        {
          id: 'report',
          description: 'Report',
          agentId: 'reporter',
          dependencies: ['validate'],
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
      'crew:task:start',
      'crew:task:complete',
      'crew:complete',
    ]);
  });

  it('should include token usage in all task results', async () => {
    const crew = new Crew({
      id: 'token-crew',
      agents: [plannerAgent, executorAgent, validatorAgent, reporterAgent],
      tasks: [
        {
          id: 'plan',
          description: 'Plan',
          agentId: 'planner',
        },
        {
          id: 'execute',
          description: 'Execute',
          agentId: 'executor',
          dependencies: ['plan'],
        },
        {
          id: 'validate',
          description: 'Validate',
          agentId: 'validator',
          dependencies: ['execute'],
        },
        {
          id: 'report',
          description: 'Report',
          agentId: 'reporter',
          dependencies: ['validate'],
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

  it('should produce meaningful output for each phase', async () => {
    const crew = new Crew({
      id: 'output-crew',
      agents: [plannerAgent, executorAgent, validatorAgent, reporterAgent],
      tasks: [
        {
          id: 'plan',
          description: 'Plan',
          agentId: 'planner',
        },
        {
          id: 'execute',
          description: 'Execute',
          agentId: 'executor',
          dependencies: ['plan'],
        },
        {
          id: 'validate',
          description: 'Validate',
          agentId: 'validator',
          dependencies: ['execute'],
        },
        {
          id: 'report',
          description: 'Report',
          agentId: 'reporter',
          dependencies: ['validate'],
        },
      ],
    });

    const result = await crew.run();

    const planResult = result.taskResults.get('plan');
    expect(planResult).toBeDefined();
    expect(planResult!.output).toContain('Plan');

    const executeResult = result.taskResults.get('execute');
    expect(executeResult).toBeDefined();
    expect(executeResult!.output).toContain('Execution');

    const validateResult = result.taskResults.get('validate');
    expect(validateResult).toBeDefined();
    expect(validateResult!.output).toContain('Validation');

    const reportResult = result.taskResults.get('report');
    expect(reportResult).toBeDefined();
    expect(reportResult!.output).toContain('Report');
  });

  it('should work with a minimal two-phase workflow (plan + execute)', async () => {
    const crew = new Crew({
      id: 'minimal-crew',
      agents: [plannerAgent, executorAgent],
      tasks: [
        {
          id: 'plan',
          description: 'Plan the tasks',
          agentId: 'planner',
        },
        {
          id: 'execute',
          description: 'Execute the plan',
          agentId: 'executor',
          dependencies: ['plan'],
        },
      ],
    });

    const result = await crew.run();

    expect(result.success).toBe(true);
    expect(result.taskResults.size).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('TASK-091: Autonomous Task Completion — Edge Cases', () => {
  it('should handle registerTask with different priority levels', async () => {
    const tool = createRegisterTaskTool();

    for (const priority of ['high', 'medium', 'low'] as const) {
      const result = await tool.execute({
        taskId: `task-${priority}`,
        title: `${priority} priority task`,
        priority,
        estimatedEffort: '1 hour',
      });
      expect(result).toContain(priority);
    }
  });

  it('should handle storeArtifact with all artifact types', async () => {
    const tool = createStoreArtifactTool();

    for (const type of ['code', 'data', 'config', 'document', 'report'] as const) {
      const result = await tool.execute({
        name: `test.${type}`,
        type,
        content: `Sample ${type} content`,
      });
      expect(result).toContain(type);
      expect(result).toContain('KB');
    }
  });

  it('should handle updateTaskStatus with all status values', async () => {
    const tool = createUpdateTaskStatusTool();

    for (const status of ['pending', 'in-progress', 'completed', 'failed', 'skipped'] as const) {
      const result = await tool.execute({
        taskId: 'test-task',
        status,
      });
      expect(result).toContain(status);
    }
  });

  it('should handle qualityCheck with empty criteria list', async () => {
    const tool = createQualityCheckTool();
    const result = await tool.execute({
      artifactName: 'empty-check',
      criteria: [],
    });
    expect(result).toContain('empty-check');
  });

  it('should handle qualityCheck with single criterion', async () => {
    const tool = createQualityCheckTool();
    const result = await tool.execute({
      artifactName: 'single-check',
      criteria: ['Basic structure'],
    });
    expect(result).toContain('PASS');
    expect(result).toContain('APPROVED');
  });
});
