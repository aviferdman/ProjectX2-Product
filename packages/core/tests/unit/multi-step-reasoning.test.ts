/**
 * Tests for TASK-090: Multi-Step Reasoning (Chain-of-Thought) Example
 *
 * Validates the chain-of-thought example file and that the multi-agent
 * reasoning pipeline works end-to-end: decompose → reason → verify → synthesize.
 */

import { describe, it, expect, vi } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Agent } from '../../src/agent/agent.js';
import { Crew } from '../../src/crew/crew.js';
import { defineTool } from '../../src/tool/index.js';
import type { LLMProvider, LLMResponse, LLMMessage } from '../../src/types/index.js';
import { z } from 'zod';

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

describe('TASK-090: Multi-Step Reasoning — Example File', () => {
  const examplePath = join(EXAMPLES_DIR, 'multi-step-reasoning.ts');
  let content: string;

  it('should exist at examples/multi-step-reasoning.ts', () => {
    expect(existsSync(examplePath)).toBe(true);
    content = readFileSync(examplePath, 'utf-8');
  });

  it('should import Agent and Crew from @crewspace/core', () => {
    expect(content).toContain("import { Agent, Crew, defineTool } from '@crewspace/core'");
  });

  it('should import LLM types from @crewspace/core', () => {
    expect(content).toContain("from '@crewspace/core'");
    expect(content).toContain('LLMProvider');
    expect(content).toContain('LLMMessage');
    expect(content).toContain('LLMResponse');
  });

  it('should create at least four agents', () => {
    const agentCreations = content.match(/new Agent\(/g) ?? [];
    expect(agentCreations.length).toBeGreaterThanOrEqual(4);
  });

  it('should create a Crew', () => {
    expect(content).toContain('new Crew');
  });

  it('should call run() on the crew', () => {
    expect(content).toContain('reasoningCrew.run()');
  });

  it('should demonstrate task dependencies forming a chain', () => {
    expect(content).toContain("dependencies: ['decompose']");
    expect(content).toContain("dependencies: ['reason']");
    expect(content).toContain("dependencies: ['verify']");
  });

  it('should include a file header comment', () => {
    expect(content).toMatch(/^\/\*\*/);
  });

  it('should mention chain-of-thought in the header', () => {
    expect(content).toMatch(/chain-of-thought/i);
  });

  it('should show lifecycle event subscription', () => {
    expect(content).toContain("reasoningCrew.on('crew:task:");
  });

  it('should define custom tools using defineTool', () => {
    expect(content).toContain('defineTool(');
  });

  it('should include a calculator tool for arithmetic reasoning', () => {
    expect(content).toContain("name: 'calculator'");
  });

  it('should include a fact lookup tool for evidence-based reasoning', () => {
    expect(content).toContain("name: 'factLookup'");
  });

  it('should include a logic checker tool for verification', () => {
    expect(content).toContain("name: 'logicChecker'");
  });

  it('should use zod schemas for tool inputs', () => {
    expect(content).toContain("import { z } from 'zod'");
    expect(content).toContain('z.object');
  });

  it('should define four reasoning phases: decompose, reason, verify, synthesize', () => {
    expect(content).toContain("id: 'decompose'");
    expect(content).toContain("id: 'reason'");
    expect(content).toContain("id: 'verify'");
    expect(content).toContain("id: 'synthesize'");
  });

  it('should assign tools to appropriate agents', () => {
    // Reasoner should have calculator and factLookup
    expect(content).toContain('tools: [calculatorTool, factLookupTool]');
    // Verifier should have calculator and logicChecker
    expect(content).toContain('tools: [calculatorTool, logicCheckerTool]');
  });

  it('should show usage instructions in the header', () => {
    expect(content).toContain('npx tsx examples/multi-step-reasoning.ts');
  });
});

// ---------------------------------------------------------------------------
// Functional validation — chain-of-thought pipeline works
// ---------------------------------------------------------------------------

describe('TASK-090: Multi-Step Reasoning — Functional Validation', () => {
  it('should run the 4-step chain-of-thought pipeline end-to-end', async () => {
    const decomposer = new Agent({
      id: 'decomposer',
      role: 'Problem Decomposition Specialist',
      goal: 'Break down complex problems into sub-problems',
      llmProvider: createMockLLMProvider(
        'Sub-problem 1: calculate base cost\nSub-problem 2: add overhead',
      ),
    });

    const reasoner = new Agent({
      id: 'reasoner',
      role: 'Step-by-Step Reasoning Engine',
      goal: 'Work through each sub-problem with explicit logic',
      llmProvider: createMockLLMProvider(
        'Step 1: 500 × $2,000 = $1,000,000\nStep 2: $1,000,000 × 1.08 = $1,080,000',
      ),
    });

    const verifier = new Agent({
      id: 'verifier',
      role: 'Reasoning Verification Specialist',
      goal: 'Verify the reasoning chain for correctness',
      llmProvider: createMockLLMProvider('All calculations verified. Reasoning chain is sound.'),
    });

    const synthesizer = new Agent({
      id: 'synthesizer',
      role: 'Answer Synthesis Specialist',
      goal: 'Combine reasoning into a final answer',
      llmProvider: createMockLLMProvider('Final answer: $2,214,000. Confidence: High.'),
    });

    const crew = new Crew({
      id: 'cot-crew',
      agents: [decomposer, reasoner, verifier, synthesizer],
      tasks: [
        { id: 'decompose', description: 'Break down the problem', agentId: 'decomposer' },
        {
          id: 'reason',
          description: 'Work through each step',
          agentId: 'reasoner',
          dependencies: ['decompose'],
        },
        {
          id: 'verify',
          description: 'Verify the reasoning',
          agentId: 'verifier',
          dependencies: ['reason'],
        },
        {
          id: 'synthesize',
          description: 'Produce the final answer',
          agentId: 'synthesizer',
          dependencies: ['verify'],
        },
      ],
    });

    const result = await crew.run();

    expect(result.success).toBe(true);
    expect(result.taskResults.size).toBe(4);
    expect(result.taskResults.get('decompose')?.output).toContain('Sub-problem');
    expect(result.taskResults.get('reason')?.output).toContain('Step 1');
    expect(result.taskResults.get('verify')?.output).toContain('verified');
    expect(result.taskResults.get('synthesize')?.output).toContain('Final answer');
  });

  it('should execute tasks in strict dependency order', async () => {
    const executionOrder: string[] = [];

    const decomposer = new Agent({
      id: 'decomposer',
      role: 'Decomposer',
      goal: 'Decompose',
      llmProvider: createMockLLMProvider('Decomposed'),
    });

    const reasoner = new Agent({
      id: 'reasoner',
      role: 'Reasoner',
      goal: 'Reason',
      llmProvider: createMockLLMProvider('Reasoned'),
    });

    const verifier = new Agent({
      id: 'verifier',
      role: 'Verifier',
      goal: 'Verify',
      llmProvider: createMockLLMProvider('Verified'),
    });

    const synthesizer = new Agent({
      id: 'synthesizer',
      role: 'Synthesizer',
      goal: 'Synthesize',
      llmProvider: createMockLLMProvider('Synthesized'),
    });

    const crew = new Crew({
      id: 'order-crew',
      agents: [decomposer, reasoner, verifier, synthesizer],
      tasks: [
        { id: 'decompose', description: 'Decompose', agentId: 'decomposer' },
        { id: 'reason', description: 'Reason', agentId: 'reasoner', dependencies: ['decompose'] },
        { id: 'verify', description: 'Verify', agentId: 'verifier', dependencies: ['reason'] },
        {
          id: 'synthesize',
          description: 'Synthesize',
          agentId: 'synthesizer',
          dependencies: ['verify'],
        },
      ],
    });

    crew.on('crew:task:start', (_crewId, taskId) => {
      executionOrder.push(taskId);
    });

    await crew.run();

    expect(executionOrder).toEqual(['decompose', 'reason', 'verify', 'synthesize']);
  });

  it('should pass decomposition results as context to reasoner', async () => {
    let reasonerMessages: readonly LLMMessage[] = [];

    const decomposerProvider = createMockLLMProvider(
      'Sub-problems: 1) Base cost 2) Growth 3) Overhead',
    );
    const reasonerProvider: LLMProvider = {
      name: 'reasoner-provider',
      generateText: vi
        .fn<(messages: readonly LLMMessage[]) => Promise<LLMResponse>>()
        .mockImplementation(async (messages) => {
          reasonerMessages = messages;
          return {
            content: 'Step-by-step solution',
            tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
            finishReason: 'stop',
          };
        }),
    };

    const decomposer = new Agent({
      id: 'decomposer',
      role: 'Decomposer',
      goal: 'Decompose',
      llmProvider: decomposerProvider,
    });

    const reasoner = new Agent({
      id: 'reasoner',
      role: 'Reasoner',
      goal: 'Reason',
      llmProvider: reasonerProvider,
    });

    const crew = new Crew({
      id: 'context-crew',
      agents: [decomposer, reasoner],
      tasks: [
        { id: 'decompose', description: 'Break it down', agentId: 'decomposer' },
        {
          id: 'reason',
          description: 'Work through each step',
          agentId: 'reasoner',
          dependencies: ['decompose'],
        },
      ],
    });

    await crew.run();

    // The reasoner should receive the decomposer's output as context
    const userMessage = reasonerMessages.find((m) => m.role === 'user');
    expect(userMessage?.content).toContain('Sub-problems: 1) Base cost 2) Growth 3) Overhead');
  });

  it('should emit all lifecycle events for the reasoning pipeline', async () => {
    const events: string[] = [];

    const agents = ['decomposer', 'reasoner', 'verifier', 'synthesizer'].map(
      (id) =>
        new Agent({
          id,
          role: id,
          goal: `Do ${id} work`,
          llmProvider: createMockLLMProvider(`${id} output`),
        }),
    );

    const crew = new Crew({
      id: 'events-crew',
      agents,
      tasks: [
        { id: 'decompose', description: 'Decompose', agentId: 'decomposer' },
        { id: 'reason', description: 'Reason', agentId: 'reasoner', dependencies: ['decompose'] },
        { id: 'verify', description: 'Verify', agentId: 'verifier', dependencies: ['reason'] },
        {
          id: 'synthesize',
          description: 'Synthesize',
          agentId: 'synthesizer',
          dependencies: ['verify'],
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

  it('should include duration and token usage in all task results', async () => {
    const agents = ['decomposer', 'reasoner', 'verifier', 'synthesizer'].map(
      (id) =>
        new Agent({
          id,
          role: id,
          goal: `Do ${id}`,
          llmProvider: createMockLLMProvider(`${id} result`),
        }),
    );

    const crew = new Crew({
      id: 'metrics-crew',
      agents,
      tasks: [
        { id: 'decompose', description: 'Decompose', agentId: 'decomposer' },
        { id: 'reason', description: 'Reason', agentId: 'reasoner', dependencies: ['decompose'] },
        { id: 'verify', description: 'Verify', agentId: 'verifier', dependencies: ['reason'] },
        {
          id: 'synthesize',
          description: 'Synthesize',
          agentId: 'synthesizer',
          dependencies: ['verify'],
        },
      ],
    });

    const result = await crew.run();

    for (const [, taskResult] of result.taskResults) {
      expect(taskResult.duration).toBeGreaterThanOrEqual(0);
      expect(taskResult.tokenUsage).toBeDefined();
      expect(taskResult.tokenUsage?.promptTokens).toBe(10);
      expect(taskResult.tokenUsage?.completionTokens).toBe(20);
      expect(taskResult.tokenUsage?.totalTokens).toBe(30);
    }
  });
});

// ---------------------------------------------------------------------------
// Custom tool validation — reasoning tools work correctly
// ---------------------------------------------------------------------------

describe('TASK-090: Multi-Step Reasoning — Tool Validation', () => {
  it('should define a calculator tool that evaluates expressions', async () => {
    const calcTool = defineTool({
      name: 'calculator',
      description: 'Perform arithmetic calculations',
      schema: z.object({
        expression: z.string(),
      }),
      async execute({ expression }) {
        const sanitized = expression.replace(/[^0-9+\-*/().% ]/g, '');
        if (sanitized.length === 0) return 'Error: Invalid expression';
        try {
          const result = new Function(`return (${sanitized})`)() as number;
          return `${expression} = ${String(result)}`;
        } catch {
          return `Error: Could not evaluate "${expression}"`;
        }
      },
    });

    expect(calcTool.name).toBe('calculator');
    const result = await calcTool.execute({ expression: '500 * 2000' });
    expect(result).toBe('500 * 2000 = 1000000');
  });

  it('should define a fact lookup tool that retrieves known facts', async () => {
    const facts: Record<string, string> = {
      'compound interest formula': 'A = P(1 + r/n)^(nt)',
    };

    const lookupTool = defineTool({
      name: 'factLookup',
      description: 'Look up a fact',
      schema: z.object({
        query: z.string(),
        domain: z.enum(['science', 'math', 'general']).optional(),
      }),
      async execute({ query, domain }) {
        const domainLabel = domain ?? 'general';
        const key = Object.keys(facts).find((k) => query.toLowerCase().includes(k));
        return key
          ? `[${domainLabel}] ${key}: ${facts[key]}`
          : `[${domainLabel}] No match for "${query}"`;
      },
    });

    expect(lookupTool.name).toBe('factLookup');
    const result = await lookupTool.execute({
      query: 'What is the compound interest formula?',
      domain: 'math',
    });
    expect(result).toContain('compound interest formula');
    expect(result).toContain('[math]');
  });

  it('should define a logic checker tool that validates reasoning chains', async () => {
    const checkerTool = defineTool({
      name: 'logicChecker',
      description: 'Check reasoning for logical consistency',
      schema: z.object({
        reasoning: z.string(),
      }),
      async execute({ reasoning }) {
        const steps = reasoning.split(/\n/).filter((line) => line.trim().length > 0);
        const hasConclusion = /therefore|thus|hence/i.test(reasoning);
        const hasEvidence = /because|since|given that/i.test(reasoning);

        return (
          `Logic Check:\n` +
          `- Steps: ${String(steps.length)}\n` +
          `- Has conclusion: ${hasConclusion ? 'Yes' : 'No'}\n` +
          `- Evidence-based: ${hasEvidence ? 'Yes' : 'No'}`
        );
      },
    });

    expect(checkerTool.name).toBe('logicChecker');
    const result = await checkerTool.execute({
      reasoning:
        'Given that 500 × 2000 = 1,000,000\n' +
        'Because overhead is 8%, we multiply by 1.08\n' +
        'Therefore the total is $1,080,000',
    });
    expect(result).toContain('Has conclusion: Yes');
    expect(result).toContain('Evidence-based: Yes');
  });

  it('should register tools on agents correctly', () => {
    const calcTool = defineTool({
      name: 'calculator',
      description: 'Calculate',
      schema: z.object({ expression: z.string() }),
      async execute({ expression }) {
        return expression;
      },
    });

    const lookupTool = defineTool({
      name: 'factLookup',
      description: 'Lookup',
      schema: z.object({ query: z.string() }),
      async execute({ query }) {
        return query;
      },
    });

    const agent = new Agent({
      id: 'test-reasoner',
      role: 'Reasoner',
      goal: 'Reason with tools',
      tools: [calcTool, lookupTool],
      llmProvider: createMockLLMProvider(),
    });

    expect(agent.tools.size).toBe(2);
    expect(agent.tools.has('calculator')).toBe(true);
    expect(agent.tools.has('factLookup')).toBe(true);
  });
});
