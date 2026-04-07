/**
 * Tests for TASK-088: Customer Support Bot Example
 *
 * Validates the customer support bot example file, its structure, custom tools,
 * and that the multi-agent support workflow works end-to-end.
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

function createLookupCustomerTool() {
  return defineTool({
    name: 'lookupCustomer',
    description: 'Look up a customer record by email or customer ID',
    schema: z.object({
      query: z.string(),
    }),
    async execute({ query }) {
      const customers: Record<string, { name: string; plan: string }> = {
        'alice@example.com': { name: 'Alice Johnson', plan: 'Pro' },
        'bob@example.com': { name: 'Bob Smith', plan: 'Free' },
      };
      const customer = customers[query];
      return customer
        ? `Customer: ${customer.name} | Plan: ${customer.plan}`
        : `No customer found for "${query}"`;
    },
  });
}

function createSearchKBTool() {
  return defineTool({
    name: 'searchKnowledgeBase',
    description: 'Search the support knowledge base for articles',
    schema: z.object({
      query: z.string(),
      maxResults: z.number().optional(),
    }),
    async execute({ query }) {
      return `Results for "${query}": [KB-102] Understanding your billing cycle`;
    },
  });
}

function createTicketTool() {
  return defineTool({
    name: 'createTicket',
    description: 'Create a support ticket',
    schema: z.object({
      subject: z.string(),
      category: z.string(),
      priority: z.string(),
      description: z.string(),
    }),
    async execute({ subject, category, priority }) {
      return `Ticket created: TKT-1234 | Category: ${category} | Priority: ${priority} | Subject: ${subject}`;
    },
  });
}

// ---------------------------------------------------------------------------
// Example file validation
// ---------------------------------------------------------------------------

describe('TASK-088: Customer Support Bot — Example File', () => {
  const examplePath = join(EXAMPLES_DIR, 'customer-support-bot.ts');
  let content: string;

  it('should exist at examples/customer-support-bot.ts', () => {
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

  it('should create at least three agents', () => {
    const agentCreations = content.match(/new Agent\(/g) ?? [];
    expect(agentCreations.length).toBeGreaterThanOrEqual(3);
  });

  it('should create a Crew', () => {
    expect(content).toContain('new Crew');
  });

  it('should call crew.run() or supportCrew.run()', () => {
    expect(content).toMatch(/\.run\(\)/);
  });

  it('should demonstrate task dependencies', () => {
    expect(content).toContain('dependencies');
  });

  it('should define custom tools using defineTool', () => {
    const defineToolCalls = content.match(/defineTool\(/g) ?? [];
    expect(defineToolCalls.length).toBeGreaterThanOrEqual(2);
  });

  it('should define a lookupCustomer tool', () => {
    expect(content).toContain('lookupCustomer');
  });

  it('should define a searchKnowledgeBase tool', () => {
    expect(content).toContain('searchKnowledgeBase');
  });

  it('should define a createTicket tool', () => {
    expect(content).toContain('createTicket');
  });

  it('should show lifecycle event subscription', () => {
    expect(content).toContain(".on('crew:");
  });

  it('should include usage instructions in header', () => {
    expect(content).toContain('npx tsx examples/customer-support-bot.ts');
  });

  it('should mention mock provider replacement', () => {
    expect(content).toMatch(/[Rr]eplace.*real provider|[Mm]ock.*provider/);
  });

  it('should define agents with distinct support roles', () => {
    expect(content).toMatch(/role:.*[Tt]riage/);
    expect(content).toMatch(/role:.*[Kk]nowledge/);
    expect(content).toMatch(/role:.*[Rr]esolution/);
  });

  it('should define agents with backstories', () => {
    const backstoryCount = (content.match(/backstory:/g) ?? []).length;
    expect(backstoryCount).toBeGreaterThanOrEqual(3);
  });

  it('should use expectedOutput for tasks', () => {
    const expectedOutputCount = (content.match(/expectedOutput:/g) ?? []).length;
    expect(expectedOutputCount).toBeGreaterThanOrEqual(1);
  });

  it('should include customer support terminology', () => {
    expect(content).toMatch(/[Tt]riage|[Pp]riority|[Tt]icket/);
    expect(content).toMatch(/[Kk]nowledge.*[Bb]ase|[Cc]ustomer/);
  });

  it('should use Zod schemas for tool inputs', () => {
    expect(content).toContain('z.object');
    expect(content).toContain('z.string()');
  });
});

// ---------------------------------------------------------------------------
// Custom tool validation
// ---------------------------------------------------------------------------

describe('TASK-088: Customer Support Bot — Custom Tools', () => {
  it('should create a valid lookupCustomer tool via defineTool', () => {
    const tool = createLookupCustomerTool();
    expect(tool.name).toBe('lookupCustomer');
    expect(tool.description).toContain('customer');
    expect(tool.inputSchema).toBeDefined();
    expect(typeof tool.execute).toBe('function');
  });

  it('lookupCustomer should return data for known customer', async () => {
    const tool = createLookupCustomerTool();
    const result = await tool.execute({ query: 'alice@example.com' });
    expect(result).toContain('Alice Johnson');
    expect(result).toContain('Pro');
  });

  it('lookupCustomer should return not-found for unknown customer', async () => {
    const tool = createLookupCustomerTool();
    const result = await tool.execute({ query: 'unknown@example.com' });
    expect(result).toContain('No customer found');
  });

  it('should create a valid searchKnowledgeBase tool via defineTool', () => {
    const tool = createSearchKBTool();
    expect(tool.name).toBe('searchKnowledgeBase');
    expect(tool.description).toContain('knowledge base');
    expect(tool.inputSchema).toBeDefined();
    expect(typeof tool.execute).toBe('function');
  });

  it('searchKnowledgeBase should return results', async () => {
    const tool = createSearchKBTool();
    const result = await tool.execute({ query: 'billing' });
    expect(result).toContain('KB-102');
  });

  it('should create a valid createTicket tool via defineTool', () => {
    const tool = createTicketTool();
    expect(tool.name).toBe('createTicket');
    expect(tool.description).toContain('ticket');
    expect(tool.inputSchema).toBeDefined();
    expect(typeof tool.execute).toBe('function');
  });

  it('createTicket should return ticket reference', async () => {
    const tool = createTicketTool();
    const result = await tool.execute({
      subject: 'Billing inquiry',
      category: 'billing',
      priority: 'medium',
      description: 'Unexpected charge on invoice',
    });
    expect(result).toContain('TKT-');
    expect(result).toContain('billing');
    expect(result).toContain('medium');
  });

  it('tools created by defineTool should be frozen', () => {
    const tool = createLookupCustomerTool();
    expect(Object.isFrozen(tool)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Agent + tools registration
// ---------------------------------------------------------------------------

describe('TASK-088: Customer Support Bot — Agent Tool Registration', () => {
  it('should register lookupCustomer on triage agent', () => {
    const tool = createLookupCustomerTool();
    const agent = new Agent({
      id: 'triage',
      role: 'Support Triage Specialist',
      goal: 'Classify support requests',
      tools: [tool],
      llmProvider: createMockLLMProvider(),
    });

    expect(agent.hasTool('lookupCustomer')).toBe(true);
    expect(agent.tools.size).toBe(1);
  });

  it('should register searchKnowledgeBase on knowledge agent', () => {
    const tool = createSearchKBTool();
    const agent = new Agent({
      id: 'knowledge',
      role: 'Knowledge Base Specialist',
      goal: 'Find relevant KB articles',
      tools: [tool],
      llmProvider: createMockLLMProvider(),
    });

    expect(agent.hasTool('searchKnowledgeBase')).toBe(true);
    expect(agent.tools.size).toBe(1);
  });

  it('should register createTicket on resolution agent', () => {
    const tool = createTicketTool();
    const agent = new Agent({
      id: 'resolution',
      role: 'Support Resolution Specialist',
      goal: 'Draft customer support responses',
      tools: [tool],
      llmProvider: createMockLLMProvider(),
    });

    expect(agent.hasTool('createTicket')).toBe(true);
    expect(agent.tools.size).toBe(1);
  });

  it('should include tool descriptions in agent system prompt', () => {
    const tool = createLookupCustomerTool();
    const agent = new Agent({
      id: 'triage-prompt',
      role: 'Triage Agent',
      goal: 'Classify support requests',
      tools: [tool],
      llmProvider: createMockLLMProvider(),
    });

    const systemPrompt = agent.buildSystemPrompt();
    expect(systemPrompt).toContain('Available tools');
    expect(systemPrompt).toContain('lookupCustomer');
  });
});

// ---------------------------------------------------------------------------
// Functional validation — support crew workflow
// ---------------------------------------------------------------------------

describe('TASK-088: Customer Support Bot — Functional Validation', () => {
  let triageAgent: Agent;
  let knowledgeAgent: Agent;
  let resolutionAgent: Agent;

  beforeEach(() => {
    triageAgent = new Agent({
      id: 'triage',
      role: 'Support Triage Specialist',
      goal: 'Classify incoming support requests by category and priority',
      backstory: 'Experienced triage specialist who identifies issue urgency.',
      tools: [createLookupCustomerTool()],
      llmProvider: createMockLLMProvider(
        '## Triage Summary\nCategory: Billing\nPriority: Medium\nCustomer: Alice Johnson (Pro plan)',
      ),
    });

    knowledgeAgent = new Agent({
      id: 'knowledge',
      role: 'Knowledge Base Specialist',
      goal: 'Find relevant KB articles for the issue',
      backstory: 'Deep knowledge of the help center content.',
      tools: [createSearchKBTool()],
      llmProvider: createMockLLMProvider(
        '## KB Results\n[KB-102] Understanding your billing cycle\n[KB-103] Upgrading your plan',
      ),
    });

    resolutionAgent = new Agent({
      id: 'resolution',
      role: 'Support Resolution Specialist',
      goal: 'Draft a helpful support response',
      backstory: 'Senior support agent who writes clear, empathetic replies.',
      tools: [createTicketTool()],
      llmProvider: createMockLLMProvider(
        'Hi Alice,\n\nThank you for reaching out. The charge is a proration adjustment.\nTicket: TKT-4217\n\nBest regards,\nSupport Team',
      ),
    });
  });

  it('should run the full support crew workflow end-to-end', async () => {
    const crew = new Crew({
      id: 'customer-support-crew',
      name: 'Customer Support Crew',
      agents: [triageAgent, knowledgeAgent, resolutionAgent],
      tasks: [
        {
          id: 'triage',
          description: 'Triage the incoming support request about billing',
          agentId: 'triage',
        },
        {
          id: 'knowledge-search',
          description: 'Search KB for relevant articles',
          agentId: 'knowledge',
          dependencies: ['triage'],
        },
        {
          id: 'draft-response',
          description: 'Draft a support response',
          agentId: 'resolution',
          dependencies: ['triage', 'knowledge-search'],
        },
      ],
    });

    const result = await crew.run();

    expect(result.success).toBe(true);
    expect(result.taskResults.size).toBe(3);
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('should execute tasks in dependency order: triage → knowledge → resolution', async () => {
    const executionOrder: string[] = [];

    const crew = new Crew({
      id: 'order-crew',
      agents: [triageAgent, knowledgeAgent, resolutionAgent],
      tasks: [
        {
          id: 'triage',
          description: 'Triage',
          agentId: 'triage',
        },
        {
          id: 'knowledge-search',
          description: 'Search KB',
          agentId: 'knowledge',
          dependencies: ['triage'],
        },
        {
          id: 'draft-response',
          description: 'Draft response',
          agentId: 'resolution',
          dependencies: ['triage', 'knowledge-search'],
        },
      ],
    });

    crew.on('crew:task:start', (_crewId, taskId) => {
      executionOrder.push(taskId);
    });

    await crew.run();

    expect(executionOrder).toEqual(['triage', 'knowledge-search', 'draft-response']);
  });

  it('should pass triage output as context to knowledge agent', async () => {
    let knowledgeMessages: readonly LLMMessage[] = [];

    const captureProvider: LLMProvider = {
      name: 'knowledge-capture',
      generateText: vi
        .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
        .mockImplementation(async (messages) => {
          knowledgeMessages = messages;
          return {
            content: 'KB results: [KB-102] Billing FAQ',
            tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
            finishReason: 'stop',
          };
        }),
    };

    const customKnowledge = new Agent({
      id: 'knowledge',
      role: 'KB Specialist',
      goal: 'Find KB articles',
      tools: [createSearchKBTool()],
      llmProvider: captureProvider,
    });

    const crew = new Crew({
      id: 'context-crew',
      agents: [triageAgent, customKnowledge, resolutionAgent],
      tasks: [
        {
          id: 'triage',
          description: 'Triage the request',
          agentId: 'triage',
        },
        {
          id: 'knowledge-search',
          description: 'Search KB based on triage',
          agentId: 'knowledge',
          dependencies: ['triage'],
        },
        {
          id: 'draft-response',
          description: 'Draft response',
          agentId: 'resolution',
          dependencies: ['knowledge-search'],
        },
      ],
    });

    await crew.run();

    // Knowledge agent should receive triage output as context
    const userMessage = knowledgeMessages.find((m) => m.role === 'user');
    expect(userMessage?.content).toContain('Billing');
  });

  it('should emit all crew lifecycle events', async () => {
    const events: string[] = [];

    const crew = new Crew({
      id: 'events-crew',
      agents: [triageAgent, knowledgeAgent, resolutionAgent],
      tasks: [
        {
          id: 'triage',
          description: 'Triage',
          agentId: 'triage',
        },
        {
          id: 'knowledge-search',
          description: 'Search',
          agentId: 'knowledge',
          dependencies: ['triage'],
        },
        {
          id: 'draft-response',
          description: 'Respond',
          agentId: 'resolution',
          dependencies: ['knowledge-search'],
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
      agents: [triageAgent, knowledgeAgent, resolutionAgent],
      tasks: [
        {
          id: 'triage',
          description: 'Triage',
          agentId: 'triage',
        },
        {
          id: 'knowledge-search',
          description: 'Search',
          agentId: 'knowledge',
          dependencies: ['triage'],
        },
        {
          id: 'draft-response',
          description: 'Respond',
          agentId: 'resolution',
          dependencies: ['knowledge-search'],
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
      agents: [triageAgent, knowledgeAgent, resolutionAgent],
      tasks: [
        {
          id: 'triage',
          description: 'Triage',
          agentId: 'triage',
        },
        {
          id: 'knowledge-search',
          description: 'Search',
          agentId: 'knowledge',
          dependencies: ['triage'],
        },
        {
          id: 'draft-response',
          description: 'Respond',
          agentId: 'resolution',
          dependencies: ['knowledge-search'],
        },
      ],
    });

    const result = await crew.run();

    const triageResult = result.taskResults.get('triage');
    expect(triageResult).toBeDefined();
    expect(triageResult!.output).toContain('Triage');

    const kbResult = result.taskResults.get('knowledge-search');
    expect(kbResult).toBeDefined();
    expect(kbResult!.output).toContain('KB');

    const responseResult = result.taskResults.get('draft-response');
    expect(responseResult).toBeDefined();
    expect(responseResult!.output.length).toBeGreaterThan(0);
  });

  it('should work with only triage + resolution (no KB search)', async () => {
    const crew = new Crew({
      id: 'minimal-support-crew',
      agents: [triageAgent, resolutionAgent],
      tasks: [
        {
          id: 'triage',
          description: 'Triage the request',
          agentId: 'triage',
        },
        {
          id: 'draft-response',
          description: 'Draft a response based on triage',
          agentId: 'resolution',
          dependencies: ['triage'],
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

describe('TASK-088: Customer Support Bot — Edge Cases', () => {
  it('should handle unknown customer gracefully in tool', async () => {
    const tool = createLookupCustomerTool();
    const result = await tool.execute({ query: 'nobody@example.com' });
    expect(result).toContain('No customer found');
  });

  it('should handle empty search query in KB tool', async () => {
    const tool = createSearchKBTool();
    const result = await tool.execute({ query: '' });
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });

  it('should handle ticket creation with minimal fields', async () => {
    const tool = createTicketTool();
    const result = await tool.execute({
      subject: 'Test',
      category: 'general',
      priority: 'low',
      description: 'Test ticket',
    });
    expect(result).toContain('TKT-');
  });

  it('should reject invalid tool input (missing required fields)', async () => {
    const tool = createLookupCustomerTool();
    await expect(tool.execute({})).rejects.toThrow();
  });

  it('should fail gracefully when agent has no LLM provider', async () => {
    const agent = new Agent({
      id: 'no-llm',
      role: 'Triage',
      goal: 'Classify issues',
      tools: [createLookupCustomerTool()],
    });

    await expect(agent.execute({ description: 'Help me', context: {} })).rejects.toThrow(
      'No LLM provider configured',
    );
  });
});
