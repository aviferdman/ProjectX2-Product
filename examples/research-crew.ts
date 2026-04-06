/**
<<<<<<< HEAD
 * Crewspace — Research Crew Example
 *
 * This example demonstrates how to build a multi-agent research crew that uses
 * built-in web and file tools. Three agents collaborate in a pipeline:
 *
 *   1. **Researcher** — searches the web for information on a topic
 *   2. **Analyst** — fetches and parses web pages to extract key insights
 *   3. **Writer** — compiles findings into a written report saved to disk
 *
 * Key concepts:
 *   - Using built-in web tools (webSearch, fetchUrl, parseHtml)
 *   - Using built-in file tools (writeFile, readFile, listFiles)
 *   - Multi-agent crew with task dependencies
 *   - Passing results between agents via dependency context
 *   - Subscribing to crew lifecycle events for progress tracking
=======
 * Crewspace — Research Crew Example (Web + File Tools)
 *
 * This example demonstrates how to build a multi-agent research crew that
 * combines web tools (search, fetch, parse) and file tools (read, write, list)
 * to perform an end-to-end research workflow:
 *
 *   1. A Web Researcher searches the web for a topic
 *   2. A Content Analyst fetches and parses top sources
 *   3. A Report Writer saves the final report to disk
 *
 * Key concepts:
 *   - Equipping agents with built-in web and file tools
 *   - Multi-step task dependencies (search → analyze → write)
 *   - Combining tool results across agent boundaries
 *   - Lifecycle events for observability
>>>>>>> agent/developer/development-developer-c71
 *
 * Prerequisites:
 *   npm install @crewspace/core
 *
 * Usage:
 *   npx tsx examples/research-crew.ts
 *
 * Note: This example uses a mock LLM provider for demonstration purposes.
 * Replace it with a real provider (OpenAI, Anthropic, Ollama) for production use.
 */

import { Agent, Crew, createWebTools, createFileTools } from '@crewspace/core';
<<<<<<< HEAD
import type { LLMProvider, LLMMessage, LLMResponse } from '@crewspace/core';
=======
import type { LLMProvider, LLMMessage, LLMResponse, Tool } from '@crewspace/core';
>>>>>>> agent/developer/development-developer-c71

// -- Mock LLM provider (replace with createOpenAIProvider() for real use) ----

const mockResponses: Record<string, string> = {
<<<<<<< HEAD
  research:
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
    'production, with vector databases becoming standard infrastructure.\n\n' +
    '**Code Generation** — AI coding assistants now handle full-stack development, ' +
    'reducing boilerplate by 60-80%.\n\n' +
    '**Multimodal AI** — Models that process text, images, and audio simultaneously ' +
    'are unlocking new creative and analytical workflows.',
  report:
    '# AI Trends Report — 2026\n\n' +
    '## Executive Summary\n' +
    'This report identifies five transformative AI trends shaping the technology ' +
    'landscape in 2026, based on analysis of recent research and industry sources.\n\n' +
    '## Findings\n\n' +
    '### 1. Multi-Agent AI Systems\n' +
    'Autonomous agents working in coordinated crews are replacing monolithic AI systems.\n\n' +
    '### 2. On-Device Small Language Models\n' +
    'Sub-3B parameter models enable AI on edge devices without cloud dependency.\n\n' +
    '### 3. RAG as Standard Practice\n' +
    'Retrieval-augmented generation is now the default for knowledge-intensive tasks.\n\n' +
    '### 4. Human-Parity Code Generation\n' +
    'AI coding tools handle complete development workflows autonomously.\n\n' +
    '### 5. Multimodal AI Integration\n' +
    'Cross-modal models combine text, image, audio for richer applications.\n\n' +
    '## Conclusion\n' +
    'Organizations should invest in multi-agent frameworks and edge AI capabilities ' +
    'to stay competitive in the rapidly evolving AI landscape.\n',
=======
  search:
    'I searched for "AI agents 2026" and found 3 key sources:\n' +
    '1. "The Rise of Autonomous Agents" — arxiv.org/papers/agents-2026\n' +
    '2. "Multi-Agent Systems in Production" — blog.example.com/multi-agent\n' +
    '3. "Tool-Using LLMs" — research.example.com/tool-llms',
  analyze:
    '## Analysis of AI Agent Trends 2026\n\n' +
    '**Key Finding 1:** Autonomous agents are moving from research to production.\n' +
    '**Key Finding 2:** Multi-agent collaboration outperforms single-agent setups by 40%.\n' +
    '**Key Finding 3:** Tool-using LLMs reduce hallucination rates significantly.\n\n' +
    'Sources reviewed: 3 | Confidence: High',
  report:
    '# AI Agents Research Report — 2026\n\n' +
    '## Executive Summary\n' +
    'AI agents are transitioning from experimental to production-ready systems.\n\n' +
    '## Key Findings\n' +
    '1. Autonomous agents are now deployed in enterprise workflows\n' +
    '2. Multi-agent collaboration yields 40% better results\n' +
    '3. Tool-augmented LLMs show reduced hallucination\n\n' +
    '## Methodology\n' +
    'Web search and source analysis using Crewspace research crew.\n\n' +
    '---\n' +
    'Generated by Crewspace Research Crew',
>>>>>>> agent/developer/development-developer-c71
};

function createResearchMockProvider(): LLMProvider {
  return {
    name: 'research-mock',
    async generateText(messages: readonly LLMMessage[]): Promise<LLMResponse> {
<<<<<<< HEAD
      const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
      const content = lastUserMessage?.content ?? '';

      let response: string;
      if (content.toLowerCase().includes('search') || content.toLowerCase().includes('research')) {
        response = mockResponses['research'];
      } else if (content.toLowerCase().includes('analy') || content.toLowerCase().includes('fetch')) {
        response = mockResponses['analyze'];
      } else {
=======
      const userMsg = [...messages].reverse().find((m) => m.role === 'user');
      const content = userMsg?.content?.toLowerCase() ?? '';

      let response = mockResponses['search'];
      if (content.includes('analyze') || content.includes('parse')) {
        response = mockResponses['analyze'];
      } else if (content.includes('report') || content.includes('write')) {
>>>>>>> agent/developer/development-developer-c71
        response = mockResponses['report'];
      }

      return {
        content: response,
<<<<<<< HEAD
        tokenUsage: { promptTokens: messages.length * 50, completionTokens: 150, totalTokens: messages.length * 50 + 150 },
=======
        tokenUsage: {
          promptTokens: messages.length * 50,
          completionTokens: 120,
          totalTokens: messages.length * 50 + 120,
        },
>>>>>>> agent/developer/development-developer-c71
        finishReason: 'stop',
      };
    },
  };
}

<<<<<<< HEAD
// -- Create tools ------------------------------------------------------------

// Web tools: search the web, fetch URLs, and parse HTML
const webTools = createWebTools({ timeoutMs: 5000 });

// File tools: read, write, and list files (sandboxed to ./output)
const fileTools = createFileTools({ basePath: './output' });

// -- Create specialized agents -----------------------------------------------

// 1. Researcher — uses web search to find relevant sources
const researcher = new Agent({
  id: 'researcher',
  role: 'Web Research Specialist',
  goal: 'Search the web to find the most relevant and recent information on a given topic',
  backstory:
    'You are an expert researcher with a knack for finding high-quality sources. ' +
    'You use web search tools to discover articles, papers, and reports, then ' +
    'compile a list of key findings with source URLs.',
  tools: [webTools.webSearch],
  llmProvider: createResearchMockProvider(),
});

// 2. Analyst — fetches web pages and extracts key insights
const analyst = new Agent({
  id: 'analyst',
  role: 'Data Analyst',
  goal: 'Analyze web content to extract structured insights and key takeaways',
  backstory:
    'You are a skilled data analyst who excels at reading raw web content and ' +
    'distilling it into clear, structured insights. You use fetchUrl and parseHtml ' +
    'tools to access and process web pages.',
  tools: [webTools.fetchUrl, webTools.parseHtml],
  llmProvider: createResearchMockProvider(),
});

// 3. Writer — compiles findings into a report and saves it
const writer = new Agent({
  id: 'writer',
  role: 'Technical Report Writer',
  goal: 'Write a clear, well-structured report and save it to a file',
  backstory:
    'You are a professional technical writer who transforms research findings ' +
    'into polished reports. You save your output using file tools so the report ' +
    'can be shared and archived.',
  tools: [fileTools.writeFile, fileTools.readFile],
  llmProvider: createResearchMockProvider(),
});

// -- Build the crew with task dependencies -----------------------------------
=======
// -- Set up built-in tools ---------------------------------------------------

// Web tools: webSearch, fetchUrl, parseHtml
const webTools = createWebTools({ timeoutMs: 10_000 });

// File tools: readFile, writeFile, listFiles (scoped to ./output)
const fileTools = createFileTools({ basePath: './output' });

// Helper to collect tools into an array
function toolsArray(...tools: Tool[]): Tool[] {
  return tools;
}

// -- Create specialized agents -----------------------------------------------

// 1. Web Researcher — searches and fetches sources from the web
const webResearcher = new Agent({
  id: 'web-researcher',
  role: 'Web Research Specialist',
  goal: 'Search the web and gather relevant sources on a given topic',
  backstory:
    'An expert at finding authoritative sources using web search and URL fetching. ' +
    'Always retrieves primary sources rather than relying on summaries.',
  tools: toolsArray(webTools.webSearch, webTools.fetchUrl),
  llmProvider: createResearchMockProvider(),
});

// 2. Content Analyst — parses and analyzes the gathered content
const contentAnalyst = new Agent({
  id: 'content-analyst',
  role: 'Content Analyst',
  goal: 'Analyze web content and extract key insights',
  backstory:
    'A meticulous analyst who reads source material carefully, extracts structured ' +
    'insights, and identifies patterns across multiple documents.',
  tools: toolsArray(webTools.parseHtml, fileTools.readFile, fileTools.listFiles),
  llmProvider: createResearchMockProvider(),
});

// 3. Report Writer — writes the final report to a file
const reportWriter = new Agent({
  id: 'report-writer',
  role: 'Technical Report Writer',
  goal: 'Compile research findings into a well-structured report and save to disk',
  backstory:
    'A skilled technical writer who produces clear, well-organized reports ' +
    'with executive summaries, key findings, and methodology sections.',
  tools: toolsArray(fileTools.writeFile, fileTools.listFiles),
  llmProvider: createResearchMockProvider(),
});

// -- Build the research crew -------------------------------------------------
>>>>>>> agent/developer/development-developer-c71

const researchCrew = new Crew({
  id: 'research-crew',
  name: 'AI Research Crew',
<<<<<<< HEAD
  agents: [researcher, analyst, writer],
  tasks: [
    {
      id: 'search',
      description:
        'Search the web for the top AI trends in 2026. ' +
        'Find at least 5 trends with supporting sources.',
      agentId: 'researcher',
      expectedOutput: 'A list of AI trends with brief descriptions and source URLs',
    },
    {
      id: 'analyze',
      description:
        'Analyze and fetch the sources found by the researcher. ' +
        'Extract key insights and organize them by theme.',
      agentId: 'analyst',
      dependencies: ['search'],
      expectedOutput: 'Structured analysis with key insights per trend',
=======
  agents: [webResearcher, contentAnalyst, reportWriter],
  tasks: [
    {
      id: 'search-sources',
      description: 'Search the web for "AI agents 2026" and identify the top 3 sources',
      expectedOutput: 'A list of source titles, URLs, and brief descriptions',
      agentId: 'web-researcher',
    },
    {
      id: 'analyze-content',
      description:
        'Analyze and parse the content from the discovered sources. ' +
        'Extract key findings, trends, and supporting data.',
      expectedOutput: 'Structured analysis with key findings and confidence level',
      agentId: 'content-analyst',
      dependencies: ['search-sources'],
>>>>>>> agent/developer/development-developer-c71
    },
    {
      id: 'write-report',
      description:
<<<<<<< HEAD
        'Write a comprehensive report based on the research and analysis. ' +
        'Include an executive summary, detailed findings, and conclusion. ' +
        'Save the report to report.md using the writeFile tool.',
      agentId: 'writer',
      dependencies: ['analyze'],
      expectedOutput: 'A markdown report saved to report.md',
    },
  ],
  verbose: true,
});

// -- Subscribe to lifecycle events for progress tracking ---------------------

console.log('=== Crewspace Research Crew ===\n');
console.log('Topic: Top AI Trends for 2026\n');

researchCrew.on('crew:start', () => {
  console.log('🚀 Research crew started\n');
});

researchCrew.on('crew:task:start', (_crewId, taskId, agentId) => {
  console.log(`▶ Task "${taskId}" assigned to agent "${agentId}"`);
});

researchCrew.on('crew:task:complete', (_crewId, taskId, result) => {
  const preview = result.output.split('\n')[0].slice(0, 80);
  console.log(`✓ Task "${taskId}" completed (${String(result.duration)}ms)`);
  console.log(`  Preview: ${preview}...`);
  console.log();
});

researchCrew.on('crew:task:error', (_crewId, taskId, error) => {
  console.error(`✗ Task "${taskId}" failed: ${String(error)}`);
});

researchCrew.on('crew:complete', (_crewId, runResult) => {
  console.log(`🏁 Crew completed in ${String(runResult.duration)}ms`);
=======
        'Write a comprehensive research report based on the analysis. ' +
        'Include an executive summary, key findings, and methodology. ' +
        'Save the report to disk.',
      expectedOutput: 'A markdown report file saved to the output directory',
      agentId: 'report-writer',
      dependencies: ['analyze-content'],
    },
  ],
});

// -- Subscribe to lifecycle events (for observability) -----------------------

researchCrew.on('crew:start', (crewId) => {
  console.log(`\n🚀 Research crew "${crewId}" started\n`);
});

researchCrew.on('crew:task:start', (_crewId, taskId, agentId) => {
  console.log(`▶ Task "${taskId}" → agent "${agentId}"`);
});

researchCrew.on('crew:task:complete', (_crewId, taskId, result) => {
  console.log(`✓ Task "${taskId}" completed (${String(result.duration)}ms)`);
  console.log(`  Output preview: ${result.output.slice(0, 80)}...`);
});

researchCrew.on('crew:complete', (_crewId, result) => {
  console.log(`\n🏁 Crew finished in ${String(result.duration)}ms`);
>>>>>>> agent/developer/development-developer-c71
});

// -- Run the research workflow -----------------------------------------------

<<<<<<< HEAD
=======
console.log('=== Crewspace Research Crew (Web + File Tools) ===');

>>>>>>> agent/developer/development-developer-c71
const result = await researchCrew.run();

// -- Display results ---------------------------------------------------------

<<<<<<< HEAD
console.log('\n=== Research Results ===\n');
=======
console.log('\n=== Research Results ===');
>>>>>>> agent/developer/development-developer-c71
console.log(`Success: ${String(result.success)}`);
console.log(`Total duration: ${String(result.duration)}ms`);
console.log(`Tasks completed: ${String(result.taskResults.size)}`);

for (const [taskId, taskResult] of result.taskResults) {
<<<<<<< HEAD
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
=======
  console.log(`\n--- ${taskId} (agent: ${taskResult.agentId}) ---`);
  console.log(taskResult.output);
  if (taskResult.tokenUsage) {
    console.log(`Tokens: ${String(taskResult.tokenUsage.totalTokens)}`);
  }
}

// -- Show agent tool registrations -------------------------------------------

console.log('\n=== Agent Tool Summary ===');
for (const agent of [webResearcher, contentAnalyst, reportWriter]) {
  const toolNames = Array.from(agent.tools.keys()).join(', ');
  console.log(`${agent.id}: [${toolNames}]`);
}
>>>>>>> agent/developer/development-developer-c71
