/**
 * Crewspace — Multi-Step Reasoning (Chain-of-Thought) Example
 *
 * This example demonstrates how to build a multi-agent chain-of-thought
 * reasoning pipeline that solves complex problems by decomposing them into
 * explicit, traceable reasoning steps:
 *
 *   1. **Decomposer** — breaks a complex problem into smaller sub-problems
 *   2. **Reasoner** — works through each sub-problem with step-by-step logic
 *   3. **Verifier** — checks the reasoning for logical consistency and errors
 *   4. **Synthesizer** — combines verified reasoning into a final answer
 *
 * Key concepts:
 *   - Chain-of-thought prompting via multi-agent decomposition
 *   - Defining custom tools with `defineTool` and Zod schemas
 *   - Multi-step task dependencies (decompose → reason → verify → synthesize)
 *   - Passing intermediate reasoning between agents via dependency context
 *   - Subscribing to crew lifecycle events for progress tracking
 *   - Tool-augmented reasoning with calculator and fact-lookup tools
 *
 * Prerequisites:
 *   npm install @crewspace/core
 *
 * Usage:
 *   npx tsx examples/multi-step-reasoning.ts
 *
 * Note: This example uses a mock LLM provider for demonstration purposes.
 * Replace it with a real provider (OpenAI, Anthropic, Ollama) for production use.
 */

import { Agent, Crew, defineTool } from '@crewspace/core';
import type { LLMProvider, LLMMessage, LLMResponse } from '@crewspace/core';
import { z } from 'zod';

// -- Custom reasoning tools --------------------------------------------------

// Tool: perform arithmetic calculations to support quantitative reasoning
const calculatorTool = defineTool({
  name: 'calculator',
  description: 'Perform arithmetic calculations (add, subtract, multiply, divide)',
  schema: z.object({
    expression: z.string().describe('A mathematical expression to evaluate, e.g. "42 * 1.08"'),
  }),
  async execute({ expression }) {
    // Safely evaluate simple arithmetic expressions
    const sanitized = expression.replace(/[^0-9+\-*/().% ]/g, '');
    if (sanitized.length === 0) {
      return 'Error: Invalid expression';
    }
    try {
      // eslint-disable-next-line no-eval
      const result = new Function(`return (${sanitized})`)() as number;
      return `${expression} = ${String(result)}`;
    } catch {
      return `Error: Could not evaluate "${expression}"`;
    }
  },
});

// Tool: look up facts and reference data to ground reasoning in evidence
const factLookupTool = defineTool({
  name: 'factLookup',
  description: 'Look up a fact or reference data point to support reasoning',
  schema: z.object({
    query: z.string().describe('The fact or data point to look up'),
    domain: z
      .enum(['science', 'math', 'geography', 'economics', 'general'])
      .optional()
      .describe('Knowledge domain for the lookup'),
  }),
  async execute({ query, domain }) {
    // In production this would query a knowledge base or search API
    const facts: Record<string, string> = {
      'speed of light': '299,792,458 meters per second (approximately 3 × 10⁸ m/s)',
      'earth population': 'Approximately 8.1 billion people as of 2026',
      'compound interest formula': 'A = P(1 + r/n)^(nt) where P=principal, r=rate, n=compounds/year, t=years',
      'pythagorean theorem': 'a² + b² = c² for right triangles',
      'gdp growth': 'Global GDP growth averages approximately 3% per year',
      'distance earth to moon': 'Approximately 384,400 km (238,855 miles)',
      'water boiling point': '100°C (212°F) at standard atmospheric pressure',
    };

    const domainLabel = domain ?? 'general';
    const key = Object.keys(facts).find((k) => query.toLowerCase().includes(k));
    if (key) {
      return `[${domainLabel}] ${key}: ${facts[key]}`;
    }
    return `[${domainLabel}] No exact match found for "${query}". Consider breaking the query into more specific terms.`;
  },
});

// Tool: validate logical consistency of a reasoning chain
const logicCheckerTool = defineTool({
  name: 'logicChecker',
  description: 'Check a reasoning chain for logical fallacies and consistency',
  schema: z.object({
    reasoning: z.string().describe('The reasoning chain to validate'),
  }),
  async execute({ reasoning }) {
    // In production this would use NLP or formal logic analysis
    const steps = reasoning.split(/\n/).filter((line) => line.trim().length > 0);
    const stepCount = steps.length;
    const hasConclusion = /therefore|thus|hence|conclusion|so,/i.test(reasoning);
    const hasEvidence = /because|since|given that|data shows|according to/i.test(reasoning);
    const hasNumbers = /\d+/.test(reasoning);

    return (
      `Logic Check Results:\n` +
      `- Reasoning steps: ${String(stepCount)}\n` +
      `- Has conclusion: ${hasConclusion ? 'Yes' : 'No — consider adding a clear conclusion'}\n` +
      `- Evidence-based: ${hasEvidence ? 'Yes' : 'No — consider citing supporting data'}\n` +
      `- Quantitative: ${hasNumbers ? 'Yes' : 'No — consider adding numbers for precision'}\n` +
      `- Assessment: ${stepCount >= 3 && hasConclusion && hasEvidence ? 'Reasoning chain appears sound' : 'Reasoning may need strengthening'}`
    );
  },
});

// -- Mock LLM provider (replace with createOpenAIProvider() for real use) ----

const mockResponses: Record<string, string> = {
  decompose:
    '## Problem Decomposition\n\n' +
    '**Original Problem:** A company has 500 employees and wants to estimate ' +
    'the total cost of providing each employee with a $2,000 annual training budget, ' +
    'accounting for 8% administrative overhead and a projected 5% workforce growth over 2 years.\n\n' +
    '**Sub-problems identified:**\n\n' +
    '### Step 1: Calculate base training cost\n' +
    'Multiply the number of employees by the per-employee training budget.\n' +
    'Inputs: 500 employees × $2,000/employee\n\n' +
    '### Step 2: Project workforce growth\n' +
    'Apply the 5% growth rate over 2 years to find the expected employee count.\n' +
    'Inputs: 500 × (1.05)² — compound growth\n\n' +
    '### Step 3: Calculate future training cost\n' +
    'Multiply the projected employee count by the per-employee budget.\n' +
    'Inputs: projected employees × $2,000\n\n' +
    '### Step 4: Add administrative overhead\n' +
    'Apply 8% overhead to the training cost for each year.\n' +
    'Inputs: training cost × 1.08\n\n' +
    '### Step 5: Compute total 2-year cost\n' +
    'Sum year 1 and year 2 costs (with overhead) for the final estimate.',

  reason:
    '## Step-by-Step Reasoning\n\n' +
    '**Step 1: Base training cost (Year 1)**\n' +
    'Given: 500 employees, $2,000 per employee\n' +
    'Calculation: 500 × $2,000 = $1,000,000\n' +
    'Result: Year 1 base training cost is $1,000,000\n\n' +
    '**Step 2: Workforce growth projection**\n' +
    'Given: 5% annual growth over 2 years, starting from 500\n' +
    'Year 1: 500 employees (no growth applied to year 1)\n' +
    'Year 2: 500 × 1.05 = 525 employees\n' +
    'Because compound growth applies at the end of each period.\n\n' +
    '**Step 3: Year 2 training cost**\n' +
    'Given: 525 projected employees, $2,000 per employee\n' +
    'Calculation: 525 × $2,000 = $1,050,000\n' +
    'Result: Year 2 base training cost is $1,050,000\n\n' +
    '**Step 4: Administrative overhead**\n' +
    'Given: 8% overhead on training costs\n' +
    'Year 1 with overhead: $1,000,000 × 1.08 = $1,080,000\n' +
    'Year 2 with overhead: $1,050,000 × 1.08 = $1,134,000\n\n' +
    '**Step 5: Total 2-year cost**\n' +
    'Sum: $1,080,000 + $1,134,000 = $2,214,000\n' +
    'Therefore, the total estimated 2-year training investment is $2,214,000.',

  verify:
    '## Verification Report\n\n' +
    '**Checking each reasoning step:**\n\n' +
    '✓ **Step 1** — 500 × $2,000 = $1,000,000. Arithmetic confirmed.\n\n' +
    '✓ **Step 2** — Workforce growth: 500 × 1.05 = 525 for year 2. ' +
    'The assumption that growth applies at the end of year 1 is reasonable ' +
    'according to standard workforce planning methodology.\n\n' +
    '✓ **Step 3** — 525 × $2,000 = $1,050,000. Arithmetic confirmed.\n\n' +
    '✓ **Step 4** — Overhead calculations:\n' +
    '  - $1,000,000 × 1.08 = $1,080,000 ✓\n' +
    '  - $1,050,000 × 1.08 = $1,134,000 ✓\n\n' +
    '✓ **Step 5** — $1,080,000 + $1,134,000 = $2,214,000. Sum confirmed.\n\n' +
    '**Logical consistency:** All steps follow from their premises. ' +
    'Each calculation builds correctly on the previous result.\n\n' +
    '**Assumptions noted:**\n' +
    '- Training budget remains constant ($2,000/employee) across both years\n' +
    '- Growth rate is applied as simple year-over-year (not compounding within year)\n' +
    '- Overhead rate is consistent across both years\n\n' +
    '**Verdict:** Reasoning chain is logically sound and arithmetically correct.',

  synthesize:
    '## Final Answer: Training Budget Estimate\n\n' +
    '### Summary\n' +
    'The total estimated cost of the 2-year training program is **$2,214,000**.\n\n' +
    '### Reasoning Trace\n' +
    'This answer was derived through a 5-step chain-of-thought process:\n\n' +
    '1. **Base cost** — 500 employees × $2,000 = $1,000,000 (Year 1)\n' +
    '2. **Growth projection** — 5% growth yields 525 employees in Year 2\n' +
    '3. **Year 2 cost** — 525 employees × $2,000 = $1,050,000\n' +
    '4. **Overhead** — 8% added: $1,080,000 (Y1) + $1,134,000 (Y2)\n' +
    '5. **Total** — $1,080,000 + $1,134,000 = **$2,214,000**\n\n' +
    '### Confidence\n' +
    'High — all arithmetic verified, assumptions are explicit, and the ' +
    'reasoning chain has been checked for logical consistency.\n\n' +
    '### Key Assumptions\n' +
    '- Per-employee budget stays at $2,000 (no inflation adjustment)\n' +
    '- 5% growth is applied annually, not compounded mid-year\n' +
    '- 8% overhead is a flat rate on direct training costs\n\n' +
    '---\n' +
    'Generated by Crewspace Chain-of-Thought Reasoning Pipeline',
};

function createReasoningMockProvider(): LLMProvider {
  return {
    name: 'reasoning-mock',
    async generateText(messages: readonly LLMMessage[]): Promise<LLMResponse> {
      const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
      const content = lastUserMessage?.content?.toLowerCase() ?? '';

      let response = mockResponses['decompose'];
      if (
        content.includes('step-by-step') ||
        content.includes('reason') ||
        content.includes('calculate') ||
        content.includes('work through')
      ) {
        response = mockResponses['reason'];
      } else if (
        content.includes('verify') ||
        content.includes('check') ||
        content.includes('validate')
      ) {
        response = mockResponses['verify'];
      } else if (
        content.includes('synthesize') ||
        content.includes('combine') ||
        content.includes('final answer') ||
        content.includes('summarize')
      ) {
        response = mockResponses['synthesize'];
      }

      return {
        content: response,
        tokenUsage: {
          promptTokens: messages.length * 55,
          completionTokens: 200,
          totalTokens: messages.length * 55 + 200,
        },
        finishReason: 'stop',
      };
    },
  };
}

// -- Create specialized agents -----------------------------------------------

// 1. Decomposer — breaks complex problems into manageable sub-problems
const decomposer = new Agent({
  id: 'decomposer',
  role: 'Problem Decomposition Specialist',
  goal: 'Break down complex problems into clear, ordered sub-problems that can be solved step by step',
  backstory:
    'You are an expert at analyzing complex, multi-variable problems and decomposing ' +
    'them into a sequence of simpler sub-problems. You identify the key inputs, ' +
    'dependencies between steps, and the logical order of operations. You use ' +
    'fact lookup tools to ground your decomposition in real data.',
  tools: [factLookupTool],
  llmProvider: createReasoningMockProvider(),
});

// 2. Reasoner — works through each sub-problem with explicit logic
const reasoner = new Agent({
  id: 'reasoner',
  role: 'Step-by-Step Reasoning Engine',
  goal: 'Work through each sub-problem methodically, showing all reasoning steps and calculations',
  backstory:
    'You are a meticulous analytical reasoner who solves problems by showing every ' +
    'step of your work. You use the calculator tool for arithmetic and the fact ' +
    'lookup tool to verify data points. You always state your premises, show your ' +
    'work, and label intermediate results clearly.',
  tools: [calculatorTool, factLookupTool],
  llmProvider: createReasoningMockProvider(),
});

// 3. Verifier — checks reasoning for correctness and consistency
const verifier = new Agent({
  id: 'verifier',
  role: 'Reasoning Verification Specialist',
  goal: 'Verify the reasoning chain for logical consistency, arithmetic correctness, and valid assumptions',
  backstory:
    'You are a critical thinking expert who reviews reasoning chains for errors. ' +
    'You re-check calculations using the calculator tool, verify logical flow with ' +
    'the logic checker, and flag any unsupported assumptions or fallacies. You are ' +
    'thorough but fair in your assessment.',
  tools: [calculatorTool, logicCheckerTool],
  llmProvider: createReasoningMockProvider(),
});

// 4. Synthesizer — combines verified reasoning into a final answer
const synthesizer = new Agent({
  id: 'synthesizer',
  role: 'Answer Synthesis Specialist',
  goal: 'Combine verified reasoning steps into a clear, concise final answer with a confidence assessment',
  backstory:
    'You are skilled at distilling multi-step reasoning into clear, actionable answers. ' +
    'You present the final result with a summary of how it was derived, note key ' +
    'assumptions, and provide a confidence level based on the verification results.',
  llmProvider: createReasoningMockProvider(),
});

// -- Build the crew with chain-of-thought task dependencies ------------------

const reasoningCrew = new Crew({
  id: 'chain-of-thought-crew',
  name: 'Chain-of-Thought Reasoning Crew',
  agents: [decomposer, reasoner, verifier, synthesizer],
  tasks: [
    {
      id: 'decompose',
      description:
        'Decompose the following complex problem into clear, ordered sub-problems:\n\n' +
        '"A company has 500 employees and wants to estimate the total cost of providing ' +
        'each employee with a $2,000 annual training budget, accounting for 8% ' +
        'administrative overhead and a projected 5% workforce growth over 2 years."\n\n' +
        'Identify each sub-problem, its inputs, and the logical order of operations. ' +
        'Use the factLookup tool to verify any assumptions about growth formulas.',
      agentId: 'decomposer',
      expectedOutput:
        'An ordered list of sub-problems with inputs, dependencies, and solution approach',
    },
    {
      id: 'reason',
      description:
        'Work through each sub-problem step-by-step, showing all reasoning and calculations. ' +
        'Use the calculator tool for arithmetic. Use the factLookup tool to verify any ' +
        'reference data. Label each step clearly and state the intermediate result ' +
        'before moving to the next step.',
      agentId: 'reasoner',
      dependencies: ['decompose'],
      expectedOutput:
        'A detailed step-by-step reasoning chain with labeled intermediate results',
    },
    {
      id: 'verify',
      description:
        'Verify the reasoning chain for logical consistency and arithmetic correctness. ' +
        'Re-check each calculation using the calculator tool. Use the logicChecker tool ' +
        'to validate the overall reasoning flow. Flag any errors, unsupported assumptions, ' +
        'or logical gaps.',
      agentId: 'verifier',
      dependencies: ['reason'],
      expectedOutput:
        'A verification report confirming or correcting the reasoning chain',
    },
    {
      id: 'synthesize',
      description:
        'Synthesize the verified reasoning into a clear final answer. ' +
        'Summarize the reasoning trace, state the final result, list key assumptions, ' +
        'and provide a confidence assessment based on the verification results.',
      agentId: 'synthesizer',
      dependencies: ['verify'],
      expectedOutput:
        'A concise final answer with reasoning summary, assumptions, and confidence level',
    },
  ],
});

// -- Subscribe to lifecycle events for progress tracking ---------------------

console.log('=== Crewspace Chain-of-Thought Reasoning Pipeline ===\n');

reasoningCrew.on('crew:start', (crewId) => {
  console.log(`🧠 Reasoning crew "${crewId}" started\n`);
});

reasoningCrew.on('crew:task:start', (_crewId, taskId, agentId) => {
  console.log(`▶ Step "${taskId}" → agent "${agentId}"`);
});

reasoningCrew.on('crew:task:complete', (_crewId, taskId, result) => {
  const preview = result.output.split('\n')[0].slice(0, 80);
  console.log(`✓ Step "${taskId}" completed (${String(result.duration)}ms)`);
  console.log(`  Preview: ${preview}...`);
  console.log();
});

reasoningCrew.on('crew:task:error', (_crewId, taskId, error) => {
  console.error(`✗ Step "${taskId}" failed: ${String(error)}`);
});

reasoningCrew.on('crew:complete', (_crewId, runResult) => {
  console.log(`🏁 Reasoning complete in ${String(runResult.duration)}ms`);
});

// -- Run the chain-of-thought reasoning pipeline -----------------------------

const result = await reasoningCrew.run();

// -- Display results ---------------------------------------------------------

console.log('\n=== Chain-of-Thought Results ===\n');
console.log(`Success: ${String(result.success)}`);
console.log(`Total duration: ${String(result.duration)}ms`);
console.log(`Reasoning steps completed: ${String(result.taskResults.size)}`);

for (const [taskId, taskResult] of result.taskResults) {
  console.log(`\n--- ${taskId} (agent: ${String(taskResult.agentId)}) ---`);
  console.log(taskResult.output);
  if (taskResult.tokenUsage) {
    console.log(
      `\n[Tokens: ${String(taskResult.tokenUsage.promptTokens)} prompt + ` +
        `${String(taskResult.tokenUsage.completionTokens)} completion = ` +
        `${String(taskResult.tokenUsage.totalTokens)} total]`,
    );
  }
}

// -- Show agent tool summary -------------------------------------------------

console.log('\n=== Agent Tool Summary ===');
for (const agent of [decomposer, reasoner, verifier, synthesizer]) {
  const toolNames = Array.from(agent.tools.keys()).join(', ');
  console.log(`${agent.id}: [${toolNames}]`);
}
