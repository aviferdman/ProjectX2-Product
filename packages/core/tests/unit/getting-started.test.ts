/**
 * Tests for TASK-082: Getting Started Tutorial
 *
 * Validates the getting started tutorial documentation, example code,
 * and that the core 10-line workflow actually works end-to-end.
 */

import { describe, it, expect, vi } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Agent } from '../../src/agent/agent.js';
import { Crew } from '../../src/crew/crew.js';
import { CrewStatus } from '../../src/types/crew.js';
import type { LLMProvider, LLMResponse, LLMMessage } from '../../src/types/index.js';

const currentFilename = fileURLToPath(import.meta.url);
const currentDirname = dirname(currentFilename);
const PROJECT_ROOT = join(currentDirname, '../../../..');
const DOCS_DIR = join(PROJECT_ROOT, 'docs');
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
// Documentation validation
// ---------------------------------------------------------------------------

describe('TASK-082: Getting Started Tutorial — Documentation', () => {
  const tutorialPath = join(DOCS_DIR, 'getting-started.md');
  let content: string;

  it('should exist at docs/getting-started.md', () => {
    expect(existsSync(tutorialPath)).toBe(true);
    content = readFileSync(tutorialPath, 'utf-8');
  });

  it('should have a title', () => {
    expect(content).toContain('# Getting Started');
  });

  it('should mention Crewspace', () => {
    expect(content).toContain('Crewspace');
  });

  describe('Prerequisites section', () => {
    it('should list prerequisites', () => {
      expect(content).toContain('## Prerequisites');
    });

    it('should require Node.js 18+', () => {
      expect(content).toMatch(/Node\.js.*18/);
    });

    it('should require npm', () => {
      expect(content).toContain('npm');
    });
  });

  describe('Installation section', () => {
    it('should have installation section', () => {
      expect(content).toContain('## Installation');
    });

    it('should show npm install command', () => {
      expect(content).toContain('npm install @crewspace/core');
    });
  });

  describe('10-line tutorial section', () => {
    it('should have the 10 lines section', () => {
      expect(content).toMatch(/10 Lines/i);
    });

    it('should show Agent import', () => {
      expect(content).toContain("import { Agent, Crew } from '@crewspace/core'");
    });

    it('should show creating an Agent', () => {
      expect(content).toContain('new Agent');
    });

    it('should show creating a Crew', () => {
      expect(content).toContain('new Crew');
    });

    it('should show crew.run()', () => {
      expect(content).toContain('crew.run()');
    });

    it('should demonstrate task dependencies', () => {
      expect(content).toContain('dependencies');
    });

    it('should show agent roles', () => {
      expect(content).toContain('role:');
      expect(content).toContain('goal:');
    });

    it('should show result handling', () => {
      expect(content).toContain('result.taskResults');
    });
  });

  describe('LLM Provider section', () => {
    it('should cover connecting an LLM provider', () => {
      expect(content).toMatch(/LLM Provider/i);
    });

    it('should show setLLMProvider usage', () => {
      expect(content).toContain('setLLMProvider');
    });

    it('should mention OpenAI', () => {
      expect(content).toContain('OpenAI');
    });

    it('should mention Anthropic', () => {
      expect(content).toContain('Anthropic');
    });

    it('should mention Ollama', () => {
      expect(content).toContain('Ollama');
    });
  });

  describe('Tools section', () => {
    it('should cover adding tools', () => {
      expect(content).toContain('Tools');
    });

    it('should show defineTool usage', () => {
      expect(content).toContain('defineTool');
    });

    it('should show addTool usage', () => {
      expect(content).toContain('addTool');
    });
  });

  describe('Events section', () => {
    it('should cover lifecycle events', () => {
      expect(content).toContain('Lifecycle Events');
    });

    it('should show crew event subscription', () => {
      expect(content).toContain("crew.on('crew:task:start'");
    });
  });

  describe('Next Steps section', () => {
    it('should have next steps', () => {
      expect(content).toContain('## Next Steps');
    });
  });

  describe('Quality checks', () => {
    it('should be at least 2000 characters', () => {
      expect(content.length).toBeGreaterThan(2000);
    });

    it('should not exceed 10000 characters', () => {
      expect(content.length).toBeLessThan(10000);
    });

    it('should have multiple sections (>= 5)', () => {
      const sectionCount = (content.match(/^## /gm) ?? []).length;
      expect(sectionCount).toBeGreaterThanOrEqual(5);
    });

    it('should contain TypeScript code blocks', () => {
      expect(content).toContain('```typescript');
    });

    it('should contain bash code blocks for installation', () => {
      expect(content).toContain('```bash');
    });

    it('should not have broken markdown links', () => {
      const brokenLinkPattern = /\]\(\s*\)/;
      expect(content).not.toMatch(brokenLinkPattern);
    });
  });
});

// ---------------------------------------------------------------------------
// Example file validation
// ---------------------------------------------------------------------------

describe('TASK-082: Getting Started Tutorial — Example File', () => {
  const examplePath = join(EXAMPLES_DIR, 'getting-started.ts');
  let content: string;

  it('should exist at examples/getting-started.ts', () => {
    expect(existsSync(examplePath)).toBe(true);
    content = readFileSync(examplePath, 'utf-8');
  });

  it('should import Agent and Crew from @crewspace/core', () => {
    expect(content).toContain("import { Agent, Crew } from '@crewspace/core'");
  });

  it('should create at least two agents', () => {
    const agentCreations = content.match(/new Agent\(/g) ?? [];
    expect(agentCreations.length).toBeGreaterThanOrEqual(2);
  });

  it('should create a Crew', () => {
    expect(content).toContain('new Crew');
  });

  it('should call crew.run()', () => {
    expect(content).toContain('crew.run()');
  });

  it('should demonstrate task dependencies', () => {
    expect(content).toContain('dependencies');
  });

  it('should include a file header comment', () => {
    expect(content).toMatch(/^\/\*\*/);
  });

  it('should show lifecycle event subscription', () => {
    expect(content).toContain("crew.on('crew:task:");
  });
});

// ---------------------------------------------------------------------------
// Functional validation — the 10-line workflow actually works
// ---------------------------------------------------------------------------

describe('TASK-082: Getting Started Tutorial — Functional Validation', () => {
  it('should run the core 10-line workflow end-to-end', async () => {
    // The actual 10-line pattern from the tutorial
    const researcher = new Agent({
      id: 'researcher',
      role: 'Research Analyst',
      goal: 'Find key insights',
      llmProvider: createMockLLMProvider('Research findings on AI trends'),
    });

    const writer = new Agent({
      id: 'writer',
      role: 'Content Writer',
      goal: 'Write clear summaries',
      llmProvider: createMockLLMProvider('Summary report of findings'),
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

    const result = await crew.run();
    expect(result.success).toBe(true);
    expect(result.taskResults.size).toBe(2);
    expect(result.taskResults.get('research')?.output).toBe('Research findings on AI trends');
    expect(result.taskResults.get('report')?.output).toBe('Summary report of findings');
  });

  it('should execute tasks in dependency order', async () => {
    const executionOrder: string[] = [];

    const researcher = new Agent({
      id: 'researcher',
      role: 'Research Analyst',
      goal: 'Find insights',
      llmProvider: createMockLLMProvider('Research output'),
    });

    const writer = new Agent({
      id: 'writer',
      role: 'Content Writer',
      goal: 'Write summaries',
      llmProvider: createMockLLMProvider('Written report'),
    });

    const crew = new Crew({
      id: 'order-crew',
      agents: [researcher, writer],
      tasks: [
        { id: 'research', description: 'Do research', agentId: 'researcher' },
        {
          id: 'report',
          description: 'Write report',
          agentId: 'writer',
          dependencies: ['research'],
        },
      ],
    });

    crew.on('crew:task:start', (_crewId, taskId) => {
      executionOrder.push(taskId);
    });

    await crew.run();

    expect(executionOrder).toEqual(['research', 'report']);
  });

  it('should pass dependency results as context to downstream tasks', async () => {
    let writerMessages: readonly LLMMessage[] = [];

    const researcherProvider = createMockLLMProvider('AI trends: transformers, agents, RAG');
    const writerProvider: LLMProvider = {
      name: 'writer-provider',
      generateText: vi
        .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
        .mockImplementation(async (messages) => {
          writerMessages = messages;
          return {
            content: 'Final report',
            tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
            finishReason: 'stop',
          };
        }),
    };

    const researcher = new Agent({
      id: 'researcher',
      role: 'Research Analyst',
      goal: 'Find insights',
      llmProvider: researcherProvider,
    });

    const writer = new Agent({
      id: 'writer',
      role: 'Content Writer',
      goal: 'Write summaries',
      llmProvider: writerProvider,
    });

    const crew = new Crew({
      id: 'context-crew',
      agents: [researcher, writer],
      tasks: [
        { id: 'research', description: 'Research AI trends', agentId: 'researcher' },
        {
          id: 'report',
          description: 'Write a report based on research',
          agentId: 'writer',
          dependencies: ['research'],
        },
      ],
    });

    await crew.run();

    // The writer should receive the researcher's output as context
    const userMessage = writerMessages.find((m) => m.role === 'user');
    expect(userMessage?.content).toContain('AI trends: transformers, agents, RAG');
  });

  it('should emit crew lifecycle events', async () => {
    const events: string[] = [];

    const agent = new Agent({
      id: 'agent-1',
      role: 'Worker',
      goal: 'Do work',
      llmProvider: createMockLLMProvider('Done'),
    });

    const crew = new Crew({
      id: 'events-crew',
      agents: [agent],
      tasks: [{ id: 'task-1', description: 'A task', agentId: 'agent-1' }],
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
      'crew:complete',
    ]);
  });

  it('should report crew status transitions', async () => {
    const agent = new Agent({
      id: 'agent-1',
      role: 'Worker',
      goal: 'Do work',
      llmProvider: createMockLLMProvider('Done'),
    });

    const crew = new Crew({
      id: 'status-crew',
      agents: [agent],
      tasks: [{ id: 'task-1', description: 'A task', agentId: 'agent-1' }],
    });

    expect(crew.status).toBe(CrewStatus.IDLE);

    await crew.run();

    expect(crew.status).toBe(CrewStatus.COMPLETED);
  });

  it('should include duration and token usage in results', async () => {
    const agent = new Agent({
      id: 'agent-1',
      role: 'Worker',
      goal: 'Do work',
      llmProvider: createMockLLMProvider('Result'),
    });

    const crew = new Crew({
      id: 'metrics-crew',
      agents: [agent],
      tasks: [{ id: 'task-1', description: 'A task', agentId: 'agent-1' }],
    });

    const result = await crew.run();

    expect(result.duration).toBeGreaterThanOrEqual(0);
    const taskResult = result.taskResults.get('task-1');
    expect(taskResult).toBeDefined();
    expect(taskResult?.duration).toBeGreaterThanOrEqual(0);
    expect(taskResult?.tokenUsage).toEqual({
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30,
    });
  });
});
