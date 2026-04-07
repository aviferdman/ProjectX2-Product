/**
 * Shared workflow specification for cross-framework comparison benchmarks.
 *
 * Defines the canonical "Research Assistant" workflow that is implemented
 * identically in Crewspace, LangChain.js, and CrewAI. Each framework
 * implementation receives the same inputs and must produce structurally
 * equivalent outputs so measurements are comparable.
 *
 * Workflow:
 *   1. Researcher — searches for information on a topic
 *   2. Analyst   — extracts key insights from the research
 *   3. Writer    — compiles a final report
 *
 * @packageDocumentation
 */

// ---------------------------------------------------------------------------
// Agent specifications
// ---------------------------------------------------------------------------

export interface AgentSpec {
  readonly id: string;
  readonly role: string;
  readonly goal: string;
  readonly backstory: string;
}

export const RESEARCHER_SPEC: AgentSpec = {
  id: 'researcher',
  role: 'Web Research Specialist',
  goal: 'Search the web to find the most relevant and recent information on a given topic',
  backstory:
    'You are an expert researcher with a knack for finding high-quality sources. ' +
    'You use web search tools to discover articles, papers, and reports.',
};

export const ANALYST_SPEC: AgentSpec = {
  id: 'analyst',
  role: 'Content Analyst',
  goal: 'Analyze web content to extract structured insights and key takeaways',
  backstory:
    'You are a skilled data analyst who excels at reading raw web content and ' +
    'distilling it into clear, structured insights.',
};

export const WRITER_SPEC: AgentSpec = {
  id: 'writer',
  role: 'Technical Report Writer',
  goal: 'Write a clear, well-structured report and save it to a file',
  backstory:
    'You are a professional technical writer who transforms research findings ' +
    'into polished reports.',
};

export const ALL_AGENTS: readonly AgentSpec[] = [RESEARCHER_SPEC, ANALYST_SPEC, WRITER_SPEC];

// ---------------------------------------------------------------------------
// Task specifications
// ---------------------------------------------------------------------------

export interface TaskSpec {
  readonly id: string;
  readonly description: string;
  readonly expectedOutput: string;
  readonly agentId: string;
  readonly dependencies: readonly string[];
}

export const SEARCH_TASK: TaskSpec = {
  id: 'search',
  description:
    'Search the web for the top AI trends in 2026. ' +
    'Find at least 5 trends with supporting sources.',
  expectedOutput: 'A list of AI trends with brief descriptions and source URLs',
  agentId: 'researcher',
  dependencies: [],
};

export const ANALYZE_TASK: TaskSpec = {
  id: 'analyze',
  description:
    'Analyze and parse the content from the discovered sources. ' +
    'Extract key findings, trends, and supporting data.',
  expectedOutput: 'Structured analysis with key findings and confidence level',
  agentId: 'analyst',
  dependencies: ['search'],
};

export const REPORT_TASK: TaskSpec = {
  id: 'write-report',
  description:
    'Write a comprehensive report based on the research and analysis. ' +
    'Include an executive summary, key findings, and methodology.',
  expectedOutput: 'A markdown report with executive summary and findings',
  agentId: 'writer',
  dependencies: ['analyze'],
};

export const ALL_TASKS: readonly TaskSpec[] = [SEARCH_TASK, ANALYZE_TASK, REPORT_TASK];

// ---------------------------------------------------------------------------
// Mock LLM responses (deterministic for reproducible benchmarks)
// ---------------------------------------------------------------------------

export const MOCK_RESPONSES: Readonly<Record<string, string>> = {
  search:
    'Based on web search results, the top AI trends for 2026 are:\n' +
    '1. Autonomous AI agents collaborating in multi-agent systems\n' +
    '2. On-device small language models (SLMs) for edge computing\n' +
    '3. Retrieval-augmented generation (RAG) becoming standard practice\n' +
    '4. AI-powered code generation reaching human parity\n' +
    '5. Multimodal AI combining text, image, audio, and video\n' +
    '\nSources: arxiv.org, techcrunch.com, openai.com',
  analyze:
    '## Key Insights\n\n' +
    '**Multi-Agent Systems** — Frameworks like Crewspace enable teams of AI agents ' +
    'to collaborate on complex tasks, each with specialized roles and tools.\n\n' +
    '**Edge AI** — Small language models under 3B parameters now run on smartphones ' +
    'and IoT devices, enabling offline-first AI applications.\n\n' +
    '**RAG Maturity** — Retrieval-augmented generation has moved from research to ' +
    'production, with vector databases becoming standard infrastructure.',
  'write-report':
    '# AI Trends Report — 2026\n\n' +
    '## Executive Summary\n' +
    'This report identifies five transformative AI trends shaping the technology ' +
    'landscape in 2026, based on analysis of recent research and industry sources.\n\n' +
    '## Key Findings\n' +
    '1. Autonomous agents are now deployed in enterprise workflows\n' +
    '2. Multi-agent collaboration yields 40% better results\n' +
    '3. Tool-augmented LLMs show reduced hallucination\n\n' +
    '## Methodology\n' +
    'Web search and source analysis using a multi-agent research crew.',
};

// ---------------------------------------------------------------------------
// Workflow result type (framework-agnostic)
// ---------------------------------------------------------------------------

export interface WorkflowTaskResult {
  readonly taskId: string;
  readonly agentId: string;
  readonly output: string;
  readonly durationMs: number;
}

export interface WorkflowResult {
  readonly framework: string;
  readonly success: boolean;
  readonly totalDurationMs: number;
  readonly taskResults: readonly WorkflowTaskResult[];
}

/**
 * Contract for a comparison workflow runner.
 *
 * Each framework implementation must conform to this interface so
 * benchmarks can invoke them uniformly.
 */
export interface ComparisonWorkflowRunner {
  readonly framework: string;
  run(): Promise<WorkflowResult>;
}
