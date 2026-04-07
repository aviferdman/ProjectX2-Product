/**
 * Crewspace implementation of the comparison benchmark workflow.
 *
 * Uses the actual @crewspace/core Agent, Crew, and Task APIs to run
 * the canonical "Research Assistant" workflow. This is the reference
 * implementation — other frameworks are compared against it.
 *
 * @packageDocumentation
 */

import { Agent } from '../../src/agent/agent.js';
import { Crew } from '../../src/crew/crew.js';
import type { LLMProvider, LLMMessage, LLMResponse } from '../../src/types/index.js';
import {
  ALL_AGENTS,
  ALL_TASKS,
  MOCK_RESPONSES,
  type ComparisonWorkflowRunner,
  type WorkflowResult,
  type WorkflowTaskResult,
} from './workflow-spec.js';

// ---------------------------------------------------------------------------
// Mock LLM provider (deterministic, zero-latency)
// ---------------------------------------------------------------------------

function createMockProvider(): LLMProvider {
  return {
    name: 'comparison-mock',
    async generateText(messages: readonly LLMMessage[]): Promise<LLMResponse> {
      const lastUser = [...messages].reverse().find((m) => m.role === 'user');
      const content = lastUser?.content?.toLowerCase() ?? '';

      let response = MOCK_RESPONSES['search']!;
      if (content.includes('analy') || content.includes('parse') || content.includes('extract')) {
        response = MOCK_RESPONSES['analyze']!;
      } else if (content.includes('report') || content.includes('write')) {
        response = MOCK_RESPONSES['write-report']!;
      }

      return {
        content: response,
        tokenUsage: { promptTokens: 50, completionTokens: 150, totalTokens: 200 },
        finishReason: 'stop',
      };
    },
  };
}

// ---------------------------------------------------------------------------
// Crewspace workflow runner
// ---------------------------------------------------------------------------

export class CrewspaceWorkflowRunner implements ComparisonWorkflowRunner {
  readonly framework = 'crewspace';

  async run(): Promise<WorkflowResult> {
    const start = performance.now();
    const taskTimings: WorkflowTaskResult[] = [];

    // Create agents with mock LLM
    const agents = ALL_AGENTS.map(
      (spec) =>
        new Agent({
          id: spec.id,
          role: spec.role,
          goal: spec.goal,
          backstory: spec.backstory,
          llmProvider: createMockProvider(),
        }),
    );

    // Build crew
    const crew = new Crew({
      id: 'comparison-crew',
      name: 'Research Assistant Benchmark',
      agents,
      tasks: ALL_TASKS.map((spec) => ({
        id: spec.id,
        description: spec.description,
        expectedOutput: spec.expectedOutput,
        agentId: spec.agentId,
        dependencies: spec.dependencies.length > 0 ? [...spec.dependencies] : undefined,
      })),
    });

    // Capture per-task timing
    crew.on('crew:task:start', (_crewId, taskId, agentId) => {
      taskTimings.push({
        taskId,
        agentId,
        output: '',
        durationMs: performance.now(),
      });
    });

    crew.on('crew:task:complete', (_crewId, taskId, result) => {
      const entry = taskTimings.find((t) => t.taskId === taskId);
      if (entry) {
        const idx = taskTimings.indexOf(entry);
        taskTimings[idx] = {
          taskId,
          agentId: entry.agentId,
          output: result.output,
          durationMs: performance.now() - entry.durationMs,
        };
      }
    });

    // Run
    const crewResult = await crew.run();
    const totalDurationMs = performance.now() - start;

    return {
      framework: 'crewspace',
      success: crewResult.success,
      totalDurationMs,
      taskResults: taskTimings,
    };
  }
}
