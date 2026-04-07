/**
 * CrewAI implementation of the comparison benchmark workflow.
 *
 * Uses the CrewAI API shim to express the canonical "Research Assistant"
 * workflow in CrewAI patterns (Agent, Task, Crew, Process.sequential).
 *
 * @packageDocumentation
 */

import {
  CAAgent,
  CACrew,
  CALLM,
  CAProcess,
  CATask,
  CATool,
  type CALLMResponse,
} from './crewai-shim.js';
import {
  ALL_AGENTS,
  ALL_TASKS,
  MOCK_RESPONSES,
  type ComparisonWorkflowRunner,
  type WorkflowResult,
  type WorkflowTaskResult,
} from './workflow-spec.js';

// ---------------------------------------------------------------------------
// Mock LLM
// ---------------------------------------------------------------------------

function createMockLLM(): CALLM {
  return new CALLM('gpt-4o-mock', async (prompt: string): Promise<CALLMResponse> => {
    const lower = prompt.toLowerCase();

    let response = MOCK_RESPONSES['search']!;
    if (lower.includes('analy') || lower.includes('parse') || lower.includes('extract')) {
      response = MOCK_RESPONSES['analyze']!;
    } else if (lower.includes('report') || lower.includes('write a comprehensive')) {
      response = MOCK_RESPONSES['write-report']!;
    }

    return {
      content: response,
      tokenUsage: { promptTokens: 50, completionTokens: 150, totalTokens: 200 },
    };
  });
}

// ---------------------------------------------------------------------------
// Mock tools (CrewAI @tool decorator style)
// ---------------------------------------------------------------------------

function createSearchTools(): CATool[] {
  return [
    new CATool({
      name: 'web_search',
      description: 'Search the web for information',
      async func(input) {
        return `Search results for: ${input}`;
      },
    }),
    new CATool({
      name: 'fetch_url',
      description: 'Fetch content from a URL',
      async func(input) {
        return `Content from: ${input}`;
      },
    }),
  ];
}

function createAnalysisTools(): CATool[] {
  return [
    new CATool({
      name: 'parse_html',
      description: 'Parse HTML and extract text',
      async func(input) {
        return `Parsed: ${input}`;
      },
    }),
  ];
}

function createWriterTools(): CATool[] {
  return [
    new CATool({
      name: 'write_file',
      description: 'Write content to a file',
      async func(input) {
        return `Wrote: ${input}`;
      },
    }),
  ];
}

// ---------------------------------------------------------------------------
// CrewAI workflow runner
// ---------------------------------------------------------------------------

export class CrewAIWorkflowRunner implements ComparisonWorkflowRunner {
  readonly framework = 'crewai';

  async run(): Promise<WorkflowResult> {
    const start = performance.now();
    const llm = createMockLLM();

    // Create agents (CrewAI pattern)
    const researcher = new CAAgent({
      role: ALL_AGENTS[0]!.role,
      goal: ALL_AGENTS[0]!.goal,
      backstory: ALL_AGENTS[0]!.backstory,
      tools: createSearchTools(),
      llm,
      verbose: false,
    });

    const analyst = new CAAgent({
      role: ALL_AGENTS[1]!.role,
      goal: ALL_AGENTS[1]!.goal,
      backstory: ALL_AGENTS[1]!.backstory,
      tools: createAnalysisTools(),
      llm,
      verbose: false,
    });

    const writer = new CAAgent({
      role: ALL_AGENTS[2]!.role,
      goal: ALL_AGENTS[2]!.goal,
      backstory: ALL_AGENTS[2]!.backstory,
      tools: createWriterTools(),
      llm,
      verbose: false,
    });

    // Create tasks with dependencies via context
    const searchTask = new CATask({
      description: ALL_TASKS[0]!.description,
      expectedOutput: ALL_TASKS[0]!.expectedOutput,
      agent: researcher,
    });

    const analyzeTask = new CATask({
      description: ALL_TASKS[1]!.description,
      expectedOutput: ALL_TASKS[1]!.expectedOutput,
      agent: analyst,
      context: [searchTask],
    });

    const reportTask = new CATask({
      description: ALL_TASKS[2]!.description,
      expectedOutput: ALL_TASKS[2]!.expectedOutput,
      agent: writer,
      context: [analyzeTask],
    });

    // Create and run crew
    const crew = new CACrew({
      agents: [researcher, analyst, writer],
      tasks: [searchTask, analyzeTask, reportTask],
      process: CAProcess.SEQUENTIAL,
      verbose: false,
    });

    const crewResult = await crew.kickoff();
    const totalDurationMs = performance.now() - start;

    // Map to common result format
    const taskSpecs = ALL_TASKS;
    const taskResults: WorkflowTaskResult[] = crewResult.taskResults.map((tr, i) => ({
      taskId: taskSpecs[i]!.id,
      agentId: taskSpecs[i]!.agentId,
      output: tr.output,
      durationMs: tr.durationMs,
    }));

    return {
      framework: 'crewai',
      success: true,
      totalDurationMs,
      taskResults,
    };
  }
}
