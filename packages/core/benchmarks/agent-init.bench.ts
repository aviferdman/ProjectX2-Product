/**
 * Agent initialization benchmarks.
 *
 * Measures the time to construct Agent instances with varying configurations.
 * Budget: <100ms per agent creation.
 */

import { describe, it, expect } from 'vitest';

import { Agent } from '../src/agent/agent.js';
import type { Tool } from '../src/types/index.js';
import {
  PERFORMANCE_BUDGETS,
  createMockLLMProvider,
  createMockTool,
  measurePerformance,
  formatResult,
} from './helpers.js';

describe('Agent Initialization Benchmarks', () => {
  it('should create a minimal agent within budget', async () => {
    const result = await measurePerformance(
      'Agent init (minimal config)',
      () => {
        new Agent({
          id: 'bench-agent',
          role: 'Benchmark Agent',
          goal: 'Run performance tests',
        });
      },
      { iterations: 5000, budget: PERFORMANCE_BUDGETS.agentInit },
    );

    console.log(formatResult(result));
    expect(result.withinBudget).toBe(true);
  });

  it('should create an agent with backstory within budget', async () => {
    const result = await measurePerformance(
      'Agent init (with backstory)',
      () => {
        new Agent({
          id: 'bench-agent-bs',
          role: 'Senior Research Analyst',
          goal: 'Find the latest AI breakthroughs',
          backstory:
            'You are a seasoned AI researcher with 10+ years of experience in multi-agent systems, NLP, and reinforcement learning.',
        });
      },
      { iterations: 5000, budget: PERFORMANCE_BUDGETS.agentInit },
    );

    console.log(formatResult(result));
    expect(result.withinBudget).toBe(true);
  });

  it('should create an agent with tools within budget', async () => {
    const tools: Tool[] = Array.from({ length: 5 }, (_, i) =>
      createMockTool(`tool-${String(i)}`),
    );

    const result = await measurePerformance(
      'Agent init (5 tools)',
      () => {
        new Agent({
          id: 'bench-agent-tools',
          role: 'Tool-heavy Agent',
          goal: 'Use many tools efficiently',
          tools,
        });
      },
      { iterations: 5000, budget: PERFORMANCE_BUDGETS.agentInit },
    );

    console.log(formatResult(result));
    expect(result.withinBudget).toBe(true);
  });

  it('should create an agent with LLM provider within budget', async () => {
    const provider = createMockLLMProvider();

    const result = await measurePerformance(
      'Agent init (with LLM provider)',
      () => {
        new Agent({
          id: 'bench-agent-llm',
          role: 'LLM Agent',
          goal: 'Generate text efficiently',
          llmProvider: provider,
        });
      },
      { iterations: 5000, budget: PERFORMANCE_BUDGETS.agentInit },
    );

    console.log(formatResult(result));
    expect(result.withinBudget).toBe(true);
  });

  it('should create a fully-configured agent within budget', async () => {
    const tools: Tool[] = Array.from({ length: 10 }, (_, i) =>
      createMockTool(`tool-${String(i)}`),
    );
    const provider = createMockLLMProvider();

    const result = await measurePerformance(
      'Agent init (full config, 10 tools)',
      () => {
        new Agent({
          id: 'bench-agent-full',
          role: 'Senior Research Analyst',
          goal: 'Find the latest AI breakthroughs',
          backstory:
            'You are a seasoned AI researcher with deep expertise in multi-agent orchestration frameworks.',
          tools,
          llmProvider: provider,
          maxIterations: 25,
          verbose: false,
        });
      },
      { iterations: 5000, budget: PERFORMANCE_BUDGETS.agentInit },
    );

    console.log(formatResult(result));
    expect(result.withinBudget).toBe(true);
  });

  it('should build system prompt within budget', async () => {
    const tools: Tool[] = Array.from({ length: 10 }, (_, i) =>
      createMockTool(`tool-${String(i)}`),
    );
    const agent = new Agent({
      id: 'bench-prompt',
      role: 'Senior Research Analyst',
      goal: 'Find AI breakthroughs',
      backstory: 'Experienced researcher',
      tools,
    });

    const result = await measurePerformance(
      'Agent.buildSystemPrompt (10 tools)',
      () => {
        agent.buildSystemPrompt();
      },
      { iterations: 10000, budget: PERFORMANCE_BUDGETS.agentInit },
    );

    console.log(formatResult(result));
    expect(result.withinBudget).toBe(true);
  });
});
