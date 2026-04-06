/**
 * Crewspace — Content Generation Workflow Example
 *
 * This example demonstrates how to build a multi-agent content generation
 * pipeline that researches a topic, creates an outline, writes a full article,
 * and edits it for quality:
 *
 *   1. **Researcher** — gathers background information on the topic
 *   2. **Outliner** — creates a structured outline from the research
 *   3. **Writer** — produces a full article based on the outline
 *   4. **Editor** — polishes the article for clarity, tone, and accuracy
 *
 * Key concepts:
 *   - Defining custom tools with `defineTool` and Zod schemas
 *   - Using built-in file tools (writeFile, readFile, listFiles)
 *   - Multi-step task dependencies (research → outline → write → edit)
 *   - Passing results between agents via dependency context
 *   - Subscribing to crew lifecycle events for progress tracking
 *   - Four-agent pipeline for production-quality content
 *
 * Prerequisites:
 *   npm install @crewspace/core
 *
 * Usage:
 *   npx tsx examples/content-generation-workflow.ts
 *
 * Note: This example uses a mock LLM provider for demonstration purposes.
 * Replace it with a real provider (OpenAI, Anthropic, Ollama) for production use.
 */

import { Agent, Crew, defineTool, createFileTools } from '@crewspace/core';
import type { LLMProvider, LLMMessage, LLMResponse } from '@crewspace/core';
import { z } from 'zod';

// -- Custom content tools ----------------------------------------------------

// Tool: search for reference material on a topic
const topicResearchTool = defineTool({
  name: 'topicResearch',
  description: 'Search for reference material and sources on a given topic',
  schema: z.object({
    topic: z.string().describe('The topic to research'),
    depth: z.enum(['brief', 'detailed']).optional().describe('Research depth level'),
  }),
  async execute({ topic, depth }) {
    // In production this would query search APIs, databases, or knowledge bases
    const depthLevel = depth ?? 'brief';
    const sources: Record<string, string[]> = {
      'AI agents': [
        'Multi-agent systems are transforming enterprise automation (MIT Tech Review)',
        'LLM-powered agents can now use tools and collaborate (arXiv:2024.12345)',
        'Agent frameworks see 300% adoption growth in 2025 (Gartner)',
      ],
      default: [
        `Overview article on ${topic} (Wikipedia)`,
        `Recent developments in ${topic} (TechCrunch)`,
        `Academic survey of ${topic} (arXiv)`,
      ],
    };
    const results = sources[topic] ?? sources['default'];
    return `[${depthLevel}] Research on "${topic}":\n${results.map((r, i) => `${String(i + 1)}. ${r}`).join('\n')}`;
  },
});

// Tool: analyze writing tone and suggest improvements
const toneAnalyzerTool = defineTool({
  name: 'toneAnalyzer',
  description: 'Analyze the tone and readability of a text passage',
  schema: z.object({
    text: z.string().describe('The text to analyze'),
    targetTone: z
      .enum(['professional', 'casual', 'academic', 'conversational'])
      .optional()
      .describe('Desired target tone'),
  }),
  async execute({ text, targetTone }) {
    // In production this would use NLP analysis
    const wordCount = text.split(/\s+/).length;
    const sentenceCount = text.split(/[.!?]+/).filter(Boolean).length;
    const avgWordsPerSentence = sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;
    const tone = targetTone ?? 'professional';

    return (
      `Tone Analysis:\n` +
      `- Word count: ${String(wordCount)}\n` +
      `- Sentences: ${String(sentenceCount)}\n` +
      `- Avg words/sentence: ${String(avgWordsPerSentence)}\n` +
      `- Target tone: ${tone}\n` +
      `- Readability: ${avgWordsPerSentence <= 20 ? 'Good' : 'Consider shorter sentences'}`
    );
  },
});

// Tool: check content for factual consistency
const factCheckTool = defineTool({
  name: 'factCheck',
  description: 'Check content claims against known sources for factual consistency',
  schema: z.object({
    content: z.string().describe('The content to fact-check'),
  }),
  async execute({ content }) {
    // In production this would query fact-checking APIs
    const claimCount = (content.match(/\d+%|\d+ percent/gi) ?? []).length;
    const hasStatistics = claimCount > 0;
    return (
      `Fact Check Results:\n` +
      `- Claims with statistics: ${String(claimCount)}\n` +
      `- Statistics present: ${hasStatistics ? 'Yes — verify sources' : 'No numeric claims detected'}\n` +
      `- Recommendation: ${hasStatistics ? 'Cross-reference cited percentages with original sources' : 'Content appears assertion-based; consider adding data points'}`
    );
  },
});

// -- Mock LLM provider (replace with createOpenAIProvider() for real use) ----

const mockResponses: Record<string, string> = {
  research:
    '## Research Findings: AI Agents in 2026\n\n' +
    '**Key Topics Identified:**\n' +
    '1. Multi-agent collaboration frameworks are becoming the standard for complex workflows\n' +
    '2. Tool-augmented LLMs reduce hallucination rates by 45%\n' +
    '3. Enterprise adoption of AI agents grew 300% in 2025\n' +
    '4. Autonomous agents now handle end-to-end business processes\n' +
    '5. Safety and alignment remain top priorities in agent design\n\n' +
    '**Sources:** MIT Tech Review, arXiv, Gartner 2026 Report\n\n' +
    '**Recommended angle:** Focus on practical enterprise applications and ' +
    'how multi-agent systems deliver measurable business value.',
  outline:
    '# Article Outline: The Rise of AI Agents in Enterprise\n\n' +
    '## 1. Introduction\n' +
    '- Hook: Enterprise AI is evolving from chatbots to autonomous agents\n' +
    '- Thesis: Multi-agent systems are the next frontier of business automation\n\n' +
    '## 2. What Are AI Agents?\n' +
    '- Definition and key characteristics\n' +
    '- Difference from traditional chatbots and RPA\n' +
    '- The role of tools and memory in modern agents\n\n' +
    '## 3. Multi-Agent Collaboration\n' +
    '- How agents with specialized roles outperform single agents\n' +
    '- Real-world example: content generation pipeline\n' +
    '- Framework comparison (Crewspace, AutoGen, CrewAI)\n\n' +
    '## 4. Enterprise Use Cases\n' +
    '- Customer support automation\n' +
    '- Code review and quality assurance\n' +
    '- Research and report generation\n' +
    '- Data analysis pipelines\n\n' +
    '## 5. Challenges and Considerations\n' +
    '- Reliability and error handling\n' +
    '- Cost management for LLM tokens\n' +
    '- Safety, alignment, and human oversight\n\n' +
    '## 6. Conclusion\n' +
    '- Summary of key points\n' +
    '- Future outlook for 2027 and beyond',
  write:
    '# The Rise of AI Agents in Enterprise\n\n' +
    'Enterprise AI is no longer limited to simple chatbots and rule-based automation. ' +
    'In 2026, a new paradigm has emerged: autonomous AI agents that can reason, use tools, ' +
    'and collaborate with each other to accomplish complex business tasks.\n\n' +
    '## What Are AI Agents?\n\n' +
    'An AI agent is a software entity powered by a large language model (LLM) that can ' +
    'perceive its environment, make decisions, and take actions to achieve a goal. Unlike ' +
    'traditional chatbots that simply respond to prompts, agents can:\n\n' +
    '- **Use tools** — search the web, read files, call APIs, and interact with databases\n' +
    '- **Maintain memory** — remember context from previous interactions\n' +
    '- **Plan and reason** — break complex tasks into steps and execute them autonomously\n\n' +
    '## Multi-Agent Collaboration\n\n' +
    'The real power emerges when multiple specialized agents work together. A multi-agent ' +
    'system assigns distinct roles — researcher, analyst, writer — and orchestrates their ' +
    'collaboration through task dependencies. Studies show that multi-agent setups produce ' +
    '40% better results than single-agent approaches on complex tasks.\n\n' +
    '## Enterprise Use Cases\n\n' +
    'Organizations are deploying agent crews for customer support automation, automated code ' +
    'review, research report generation, and data analysis pipelines. Enterprise adoption of ' +
    'AI agents grew 300% in 2025, and the trend shows no signs of slowing.\n\n' +
    '## Challenges Ahead\n\n' +
    'Despite rapid progress, challenges remain: ensuring reliability through proper error ' +
    'handling, managing LLM token costs at scale, and maintaining human oversight for safety. ' +
    'Frameworks like Crewspace address these with built-in retry logic, token tracking, and ' +
    'lifecycle events.\n\n' +
    '## Looking Forward\n\n' +
    'As agent frameworks mature and LLMs become more capable, we can expect AI agents to ' +
    'handle increasingly complex workflows — from end-to-end software development to ' +
    'autonomous business operations.\n\n' +
    '---\n' +
    'Generated by Crewspace Content Generation Workflow',
  edit:
    '# The Rise of AI Agents in Enterprise\n\n' +
    '*A comprehensive look at how multi-agent AI systems are transforming business operations in 2026.*\n\n' +
    'Enterprise AI is no longer limited to simple chatbots and rule-based automation. ' +
    'In 2026, a powerful new paradigm has emerged: autonomous AI agents that reason, use tools, ' +
    'and collaborate to accomplish complex business tasks.\n\n' +
    '## What Are AI Agents?\n\n' +
    'An AI agent is a software entity powered by a large language model (LLM) that perceives ' +
    'its environment, makes decisions, and takes actions to achieve specific goals. Unlike ' +
    'traditional chatbots, agents can:\n\n' +
    '- **Use tools** — search the web, read files, call APIs, and query databases\n' +
    '- **Maintain memory** — retain context from previous interactions for continuity\n' +
    '- **Plan and reason** — decompose complex tasks into steps and execute them autonomously\n\n' +
    '## The Power of Multi-Agent Collaboration\n\n' +
    'The true potential emerges when specialized agents collaborate. A multi-agent system ' +
    'assigns distinct roles — researcher, analyst, writer, editor — and orchestrates their ' +
    'work through task dependencies. Research indicates that multi-agent setups produce ' +
    '40% better results than single-agent approaches on complex tasks.\n\n' +
    '## Enterprise Use Cases\n\n' +
    'Organizations are deploying agent crews across diverse functions:\n\n' +
    '- **Customer support** — triage, knowledge lookup, and resolution drafting\n' +
    '- **Code review** — automated scanning, analysis, and report generation\n' +
    '- **Research** — web search, source analysis, and report compilation\n' +
    '- **Data analysis** — pipeline orchestration and insight extraction\n\n' +
    'Enterprise adoption of AI agents grew 300% in 2025, with the trend accelerating.\n\n' +
    '## Navigating the Challenges\n\n' +
    'Despite rapid progress, teams must address reliability (proper error handling and retries), ' +
    'cost management (token usage tracking), and safety (human oversight and alignment). ' +
    'Modern frameworks like Crewspace provide built-in solutions for these concerns.\n\n' +
    '## Looking Forward\n\n' +
    'As agent frameworks mature and LLMs grow more capable, AI agents will handle increasingly ' +
    'complex workflows — from end-to-end software development to autonomous business operations.\n\n' +
    '---\n' +
    '*Edited for clarity, tone, and factual accuracy.*\n' +
    'Generated by Crewspace Content Generation Workflow',
};

function createContentMockProvider(): LLMProvider {
  return {
    name: 'content-mock',
    async generateText(messages: readonly LLMMessage[]): Promise<LLMResponse> {
      const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
      const content = lastUserMessage?.content?.toLowerCase() ?? '';

      let response = mockResponses['research'];
      if (content.includes('outline') || content.includes('structure') || content.includes('plan')) {
        response = mockResponses['outline'];
      } else if (content.includes('write') || content.includes('draft') || content.includes('article')) {
        response = mockResponses['write'];
      } else if (content.includes('edit') || content.includes('polish') || content.includes('review') || content.includes('refine')) {
        response = mockResponses['edit'];
      }

      return {
        content: response,
        tokenUsage: {
          promptTokens: messages.length * 60,
          completionTokens: 250,
          totalTokens: messages.length * 60 + 250,
        },
        finishReason: 'stop',
      };
    },
  };
}

// -- Create file tools (for saving the final article) ------------------------

const fileTools = createFileTools({ basePath: './output' });

// -- Create specialized agents -----------------------------------------------

// 1. Researcher — gathers background information on the topic
const researcher = new Agent({
  id: 'researcher',
  role: 'Content Researcher',
  goal: 'Research a topic thoroughly and gather facts, sources, and key talking points',
  backstory:
    'You are an expert content researcher who excels at finding authoritative sources ' +
    'and distilling complex topics into clear research briefs. You use the topicResearch ' +
    'tool to find relevant material and summarize key findings.',
  tools: [topicResearchTool],
  llmProvider: createContentMockProvider(),
});

// 2. Outliner — creates a structured outline from the research
const outliner = new Agent({
  id: 'outliner',
  role: 'Content Strategist & Outliner',
  goal: 'Create a well-structured article outline that organizes research into a compelling narrative',
  backstory:
    'You are a seasoned content strategist who transforms raw research into clear, ' +
    'logical outlines. You determine the best structure, section order, and key points ' +
    'to cover in each section for maximum reader engagement.',
  llmProvider: createContentMockProvider(),
});

// 3. Writer — produces the full article from the outline
const writer = new Agent({
  id: 'writer',
  role: 'Content Writer',
  goal: 'Write a polished, engaging article that follows the outline and incorporates research findings',
  backstory:
    'You are a skilled content writer who transforms outlines into compelling articles. ' +
    'You write in a clear, professional tone and ensure each section flows naturally ' +
    'into the next. You save your output using file tools.',
  tools: [fileTools.writeFile],
  llmProvider: createContentMockProvider(),
});

// 4. Editor — polishes the article for quality
const editor = new Agent({
  id: 'editor',
  role: 'Senior Content Editor',
  goal: 'Edit and polish the article for clarity, tone, accuracy, and readability',
  backstory:
    'You are a meticulous editor with an eye for detail. You analyze tone and readability, ' +
    'fact-check claims, improve sentence structure, and ensure the article meets publication ' +
    'standards. You save the final edited version to a file.',
  tools: [toneAnalyzerTool, factCheckTool, fileTools.writeFile, fileTools.readFile],
  llmProvider: createContentMockProvider(),
});

// -- Build the crew with task dependencies -----------------------------------

const contentCrew = new Crew({
  id: 'content-generation-crew',
  name: 'Content Generation Crew',
  agents: [researcher, outliner, writer, editor],
  tasks: [
    {
      id: 'research',
      description:
        'Research the topic "AI Agents in Enterprise" thoroughly. ' +
        'Find key facts, statistics, expert opinions, and relevant sources. ' +
        'Use the topicResearch tool to gather material. ' +
        'Provide a research brief with recommended angle and key talking points.',
      agentId: 'researcher',
      expectedOutput: 'A research brief with key findings, sources, and recommended article angle',
    },
    {
      id: 'outline',
      description:
        'Create a detailed article outline based on the research findings. ' +
        'Organize the content into logical sections with an introduction, ' +
        'main body sections, and a conclusion. Include key points for each section.',
      agentId: 'outliner',
      dependencies: ['research'],
      expectedOutput: 'A structured article outline with sections, subsections, and key points',
    },
    {
      id: 'write',
      description:
        'Write the full article following the outline structure. ' +
        'Incorporate the research findings naturally into the narrative. ' +
        'Write in a professional but accessible tone. ' +
        'Save the draft article to draft-article.md using the writeFile tool.',
      agentId: 'writer',
      dependencies: ['outline'],
      expectedOutput: 'A complete draft article saved to the output directory',
    },
    {
      id: 'edit',
      description:
        'Edit and polish the draft article for publication quality. ' +
        'Use the toneAnalyzer tool to check readability and tone consistency. ' +
        'Use the factCheck tool to verify any statistical claims. ' +
        'Improve clarity, fix awkward phrasing, and ensure smooth transitions. ' +
        'Save the final edited article to final-article.md using the writeFile tool.',
      agentId: 'editor',
      dependencies: ['write'],
      expectedOutput: 'A polished, publication-ready article saved to the output directory',
    },
  ],
});

// -- Subscribe to lifecycle events for progress tracking ---------------------

console.log('=== Crewspace Content Generation Workflow ===\n');

contentCrew.on('crew:start', (crewId) => {
  console.log(`🚀 Content crew "${crewId}" started\n`);
});

contentCrew.on('crew:task:start', (_crewId, taskId, agentId) => {
  console.log(`▶ Task "${taskId}" → agent "${agentId}"`);
});

contentCrew.on('crew:task:complete', (_crewId, taskId, result) => {
  const preview = result.output.split('\n')[0].slice(0, 80);
  console.log(`✓ Task "${taskId}" completed (${String(result.duration)}ms)`);
  console.log(`  Preview: ${preview}...`);
  console.log();
});

contentCrew.on('crew:task:error', (_crewId, taskId, error) => {
  console.error(`✗ Task "${taskId}" failed: ${String(error)}`);
});

contentCrew.on('crew:complete', (_crewId, runResult) => {
  console.log(`🏁 Content generation finished in ${String(runResult.duration)}ms`);
});

// -- Run the content generation workflow -------------------------------------

const result = await contentCrew.run();

// -- Display results ---------------------------------------------------------

console.log('\n=== Content Generation Results ===\n');
console.log(`Success: ${String(result.success)}`);
console.log(`Total duration: ${String(result.duration)}ms`);
console.log(`Tasks completed: ${String(result.taskResults.size)}`);

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
for (const agent of [researcher, outliner, writer, editor]) {
  const toolNames = Array.from(agent.tools.keys()).join(', ');
  console.log(`${agent.id}: [${toolNames}]`);
}
