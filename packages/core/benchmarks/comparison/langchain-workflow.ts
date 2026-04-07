/**
 * LangChain.js implementation of the comparison benchmark workflow.
 *
 * Uses the LangChain.js API shim to express the canonical "Research
 * Assistant" workflow in LangChain.js patterns (ChatModel, AgentExecutor,
 * RunnableSequence).
 *
 * @packageDocumentation
 */

import {
  LCAgentExecutor,
  LCChatModel,
  LCRunnableSequence,
  LCTool,
  type LCMessage,
} from './langchain-shim.js';
import {
  ALL_AGENTS,
  ALL_TASKS,
  MOCK_RESPONSES,
  type ComparisonWorkflowRunner,
  type WorkflowResult,
  type WorkflowTaskResult,
} from './workflow-spec.js';

// ---------------------------------------------------------------------------
// Mock chat model
// ---------------------------------------------------------------------------

function createMockChatModel(): LCChatModel {
  return new LCChatModel('gpt-4o-mock', async (messages: readonly LCMessage[]) => {
    const lastHuman = [...messages].reverse().find((m) => m.role === 'human');
    const content = lastHuman?.content?.toLowerCase() ?? '';

    let response = MOCK_RESPONSES['search']!;
    if (content.includes('analy') || content.includes('parse') || content.includes('extract')) {
      response = MOCK_RESPONSES['analyze']!;
    } else if (content.includes('report') || content.includes('write')) {
      response = MOCK_RESPONSES['write-report']!;
    }

    return {
      content: response,
      tokenUsage: { promptTokens: 50, completionTokens: 150, totalTokens: 200 },
    };
  });
}

// ---------------------------------------------------------------------------
// Mock tools (mirrors LangChain DynamicStructuredTool)
// ---------------------------------------------------------------------------

function createSearchTools(): LCTool[] {
  return [
    new LCTool({
      name: 'web_search',
      description: 'Search the web for information on a topic',
      async func(input) {
        return `Search results for: ${String(input['query'] ?? 'AI trends')}`;
      },
    }),
    new LCTool({
      name: 'fetch_url',
      description: 'Fetch content from a URL',
      async func(input) {
        return `Content from: ${String(input['url'] ?? 'https://example.com')}`;
      },
    }),
  ];
}

function createAnalysisTools(): LCTool[] {
  return [
    new LCTool({
      name: 'parse_html',
      description: 'Parse HTML content and extract text',
      async func(input) {
        return `Parsed content from: ${String(input['html'] ?? '<html></html>')}`;
      },
    }),
  ];
}

function createWriterTools(): LCTool[] {
  return [
    new LCTool({
      name: 'write_file',
      description: 'Write content to a file',
      async func(input) {
        return `Wrote to: ${String(input['path'] ?? 'report.md')}`;
      },
    }),
  ];
}

// ---------------------------------------------------------------------------
// LangChain workflow runner
// ---------------------------------------------------------------------------

export class LangChainWorkflowRunner implements ComparisonWorkflowRunner {
  readonly framework = 'langchain';

  async run(): Promise<WorkflowResult> {
    const start = performance.now();
    const model = createMockChatModel();

    // Create agent executors (LangChain pattern: one executor per agent)
    const researcherExec = new LCAgentExecutor({
      name: 'researcher',
      model,
      tools: createSearchTools(),
      systemPrompt: `You are a ${ALL_AGENTS[0]!.role}. ${ALL_AGENTS[0]!.goal}\n\n${ALL_AGENTS[0]!.backstory}`,
    });

    const analystExec = new LCAgentExecutor({
      name: 'analyst',
      model,
      tools: createAnalysisTools(),
      systemPrompt: `You are a ${ALL_AGENTS[1]!.role}. ${ALL_AGENTS[1]!.goal}\n\n${ALL_AGENTS[1]!.backstory}`,
    });

    const writerExec = new LCAgentExecutor({
      name: 'writer',
      model,
      tools: createWriterTools(),
      systemPrompt: `You are a ${ALL_AGENTS[2]!.role}. ${ALL_AGENTS[2]!.goal}\n\n${ALL_AGENTS[2]!.backstory}`,
    });

    // Chain them with RunnableSequence (LCEL pipe pattern)
    const chain = new LCRunnableSequence()
      .addStep({
        name: ALL_TASKS[0]!.id,
        executor: researcherExec,
        input: ALL_TASKS[0]!.description,
      })
      .addStep({
        name: ALL_TASKS[1]!.id,
        executor: analystExec,
        input: ALL_TASKS[1]!.description,
      })
      .addStep({
        name: ALL_TASKS[2]!.id,
        executor: writerExec,
        input: ALL_TASKS[2]!.description,
      });

    // Run the chain
    const chainResult = await chain.invoke();
    const totalDurationMs = performance.now() - start;

    // Convert to common result format
    const taskResults: WorkflowTaskResult[] = [];
    const taskAgentMap: Record<string, string> = {
      [ALL_TASKS[0]!.id]: ALL_AGENTS[0]!.id,
      [ALL_TASKS[1]!.id]: ALL_AGENTS[1]!.id,
      [ALL_TASKS[2]!.id]: ALL_AGENTS[2]!.id,
    };

    for (const [stepName, stepResult] of chainResult.outputs) {
      taskResults.push({
        taskId: stepName,
        agentId: taskAgentMap[stepName] ?? 'unknown',
        output: stepResult.output,
        durationMs: 0, // Individual timing not tracked by sequence shim
      });
    }

    return {
      framework: 'langchain',
      success: true,
      totalDurationMs,
      taskResults,
    };
  }
}
