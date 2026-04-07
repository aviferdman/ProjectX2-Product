/**
 * Crewspace — Customer Support Bot Example
 *
 * This example demonstrates how to build a multi-agent customer support bot
 * that triages incoming requests, looks up customer and knowledge-base data,
 * and drafts a resolution response:
 *
 *   1. **Triage Agent** — classifies the support request by category and urgency
 *   2. **Knowledge Agent** — searches the knowledge base for relevant articles
 *   3. **Resolution Agent** — drafts a helpful reply using triage + KB context
 *
 * Key concepts:
 *   - Defining custom tools with `defineTool` and Zod schemas
 *   - Assigning domain-specific tools to specialized agents
 *   - Multi-step task dependencies (triage → search → resolve)
 *   - Passing results between agents via dependency context
 *   - Subscribing to crew lifecycle events for progress tracking
 *
 * Prerequisites:
 *   npm install @crewspace/core
 *
 * Usage:
 *   npx tsx examples/customer-support-bot.ts
 *
 * Note: This example uses a mock LLM provider for demonstration purposes.
 * Replace it with a real provider (OpenAI, Anthropic, Ollama) for production use.
 */

import { Agent, Crew, defineTool } from '@crewspace/core';
import type { LLMProvider, LLMMessage, LLMResponse } from '@crewspace/core';
import { z } from 'zod';

// -- Custom support tools ----------------------------------------------------

// Tool: look up a customer by email or ID
const lookupCustomerTool = defineTool({
  name: 'lookupCustomer',
  description: 'Look up a customer record by email or customer ID',
  schema: z.object({
    query: z.string().describe('Customer email address or ID'),
  }),
  async execute({ query }) {
    // In production this would hit a CRM / database
    const customers: Record<string, { name: string; plan: string; since: string }> = {
      'alice@example.com': { name: 'Alice Johnson', plan: 'Pro', since: '2024-01-15' },
      'bob@example.com': { name: 'Bob Smith', plan: 'Free', since: '2025-06-01' },
      'CUS-1001': { name: 'Alice Johnson', plan: 'Pro', since: '2024-01-15' },
    };
    const customer = customers[query];
    return customer
      ? `Customer: ${customer.name} | Plan: ${customer.plan} | Member since: ${customer.since}`
      : `No customer found for "${query}"`;
  },
});

// Tool: search the knowledge base for relevant help articles
const searchKnowledgeBaseTool = defineTool({
  name: 'searchKnowledgeBase',
  description: 'Search the support knowledge base for articles matching a query',
  schema: z.object({
    query: z.string().describe('Search keywords or phrase'),
    maxResults: z.number().optional().describe('Maximum number of results to return'),
  }),
  async execute({ query, maxResults }) {
    // In production this would query a vector DB / search index
    const articles = [
      { id: 'KB-101', title: 'How to reset your password', tags: ['password', 'login', 'account'] },
      {
        id: 'KB-102',
        title: 'Understanding your billing cycle',
        tags: ['billing', 'payment', 'invoice'],
      },
      { id: 'KB-103', title: 'Upgrading your plan', tags: ['plan', 'upgrade', 'pricing'] },
      {
        id: 'KB-104',
        title: 'API rate limits explained',
        tags: ['api', 'rate limit', 'technical'],
      },
      {
        id: 'KB-105',
        title: 'Troubleshooting integration errors',
        tags: ['integration', 'error', 'technical'],
      },
    ];
    const q = query.toLowerCase();
    const matches = articles.filter(
      (a) => a.title.toLowerCase().includes(q) || a.tags.some((t) => q.includes(t)),
    );
    const limit = maxResults ?? 3;
    return (
      matches
        .slice(0, limit)
        .map((a) => `[${a.id}] ${a.title}`)
        .join('\n') || 'No matching articles found'
    );
  },
});

// Tool: create a support ticket
const createTicketTool = defineTool({
  name: 'createTicket',
  description: 'Create a support ticket in the ticketing system',
  schema: z.object({
    subject: z.string().describe('Short summary of the issue'),
    category: z.string().describe('Issue category (billing, technical, account, general)'),
    priority: z.string().describe('Priority level (low, medium, high, urgent)'),
    description: z.string().describe('Detailed description of the issue'),
  }),
  async execute({ subject, category, priority }) {
    // In production this would create a ticket in Jira / Zendesk / etc.
    const ticketId = `TKT-${String(Math.floor(1000 + Math.random() * 9000))}`;
    return `Ticket created: ${ticketId} | Category: ${category} | Priority: ${priority} | Subject: ${subject}`;
  },
});

// -- Mock LLM provider (replace with createOpenAIProvider() for real use) ----

const mockResponses: Record<string, string> = {
  triage:
    '## Triage Summary\n\n' +
    '**Category:** Billing\n' +
    '**Priority:** Medium\n' +
    '**Customer:** alice@example.com (CUS-1001)\n\n' +
    'The customer is asking about an unexpected charge on their latest invoice. ' +
    'They are a Pro plan member since January 2024 and have been a loyal customer. ' +
    'This is a billing inquiry that should be handled promptly to maintain satisfaction.\n\n' +
    '**Recommended action:** Search knowledge base for billing articles and draft a ' +
    'clear explanation of charges with a link to the billing FAQ.',
  knowledge:
    '## Knowledge Base Results\n\n' +
    'Found the following relevant articles:\n\n' +
    '1. **[KB-102] Understanding your billing cycle**\n' +
    '   Explains how charges are calculated, proration for upgrades, and invoice dates.\n\n' +
    '2. **[KB-103] Upgrading your plan**\n' +
    '   Covers how mid-cycle upgrades are prorated and reflected on the next invoice.\n\n' +
    '**Summary:** The unexpected charge is likely due to a mid-cycle plan change or ' +
    'an add-on activation. KB-102 contains the detailed billing FAQ.',
  resolution:
    '## Support Response Draft\n\n' +
    'Hi Alice,\n\n' +
    'Thank you for reaching out about the charge on your latest invoice. ' +
    "I've looked into your account and here's what I found:\n\n" +
    'The charge appears to be related to a mid-cycle proration adjustment. ' +
    'When plan features are updated during a billing cycle, the difference is ' +
    'prorated and applied to your next invoice.\n\n' +
    'For a detailed breakdown of how billing works, please see our guide: ' +
    '[Understanding your billing cycle (KB-102)]\n\n' +
    'If you believe this charge is incorrect or have additional questions, ' +
    "please don't hesitate to reply to this message. I'm happy to help!\n\n" +
    'Best regards,\n' +
    'Support Team\n\n' +
    '---\n' +
    'Ticket: TKT-4217 | Priority: Medium | Category: Billing',
};

function createSupportMockProvider(): LLMProvider {
  return {
    name: 'support-mock',
    async generateText(messages: readonly LLMMessage[]): Promise<LLMResponse> {
      const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
      const content = lastUserMessage?.content?.toLowerCase() ?? '';

      let response = mockResponses['triage'];
      if (
        content.includes('knowledge') ||
        content.includes('search') ||
        content.includes('article')
      ) {
        response = mockResponses['knowledge'];
      } else if (
        content.includes('resolution') ||
        content.includes('draft') ||
        content.includes('reply') ||
        content.includes('respond')
      ) {
        response = mockResponses['resolution'];
      }

      return {
        content: response,
        tokenUsage: {
          promptTokens: messages.length * 45,
          completionTokens: 180,
          totalTokens: messages.length * 45 + 180,
        },
        finishReason: 'stop',
      };
    },
  };
}

// -- Create specialized agents -----------------------------------------------

// 1. Triage Agent — classifies the support request
const triageAgent = new Agent({
  id: 'triage',
  role: 'Support Triage Specialist',
  goal: 'Classify incoming support requests by category, priority, and customer context',
  backstory:
    'You are an experienced support triage specialist who quickly identifies the ' +
    'nature and urgency of customer issues. You look up customer information to ' +
    'provide context and determine the best routing for each request.',
  tools: [lookupCustomerTool],
  llmProvider: createSupportMockProvider(),
});

// 2. Knowledge Agent — searches the KB for relevant articles
const knowledgeAgent = new Agent({
  id: 'knowledge',
  role: 'Knowledge Base Specialist',
  goal: 'Search the knowledge base to find relevant articles and solutions for the customer issue',
  backstory:
    'You are a support knowledge expert with deep familiarity with the help center. ' +
    'You find the most relevant articles, extract key information, and summarize how ' +
    "each article addresses the customer's specific issue.",
  tools: [searchKnowledgeBaseTool],
  llmProvider: createSupportMockProvider(),
});

// 3. Resolution Agent — drafts the support response
const resolutionAgent = new Agent({
  id: 'resolution',
  role: 'Support Resolution Specialist',
  goal: 'Draft a helpful, empathetic support response that resolves the customer issue',
  backstory:
    'You are a senior support agent who writes clear, friendly, and thorough ' +
    'responses. You combine triage context and knowledge base articles to craft ' +
    'a personalized reply. You also create a support ticket for tracking.',
  tools: [createTicketTool],
  llmProvider: createSupportMockProvider(),
});

// -- Build the crew with task dependencies -----------------------------------

const supportCrew = new Crew({
  id: 'customer-support-crew',
  name: 'Customer Support Crew',
  agents: [triageAgent, knowledgeAgent, resolutionAgent],
  tasks: [
    {
      id: 'triage',
      description:
        'Triage the following customer support request:\n\n' +
        '"Hi, I noticed an unexpected charge of $29.99 on my latest invoice. ' +
        'My account email is alice@example.com. Can you help me understand ' +
        'what this charge is for?"\n\n' +
        'Look up the customer, classify the issue category and priority, ' +
        'and summarize the situation for the next agent.',
      agentId: 'triage',
      expectedOutput:
        'Triage summary with category, priority, customer context, and recommended action',
    },
    {
      id: 'knowledge-search',
      description:
        'Search the knowledge base for articles relevant to the triaged issue. ' +
        "Find help articles that address the customer's concern and summarize " +
        'the key information from each matching article.',
      agentId: 'knowledge',
      dependencies: ['triage'],
      expectedOutput: 'List of relevant KB articles with summaries and applicability assessment',
    },
    {
      id: 'draft-response',
      description:
        'Draft a customer support response that resolves the issue. ' +
        'Use the triage context and knowledge base results to write a ' +
        'personalized, empathetic reply. Create a support ticket for tracking.',
      agentId: 'resolution',
      dependencies: ['triage', 'knowledge-search'],
      expectedOutput:
        'A polished support response ready to send to the customer, plus a ticket reference',
    },
  ],
});

// -- Subscribe to lifecycle events for progress tracking ---------------------

console.log('=== Crewspace Customer Support Bot ===\n');

supportCrew.on('crew:start', (crewId) => {
  console.log(`🚀 Support crew "${crewId}" started\n`);
});

supportCrew.on('crew:task:start', (_crewId, taskId, agentId) => {
  console.log(`▶ Task "${taskId}" → agent "${agentId}"`);
});

supportCrew.on('crew:task:complete', (_crewId, taskId, result) => {
  const preview = result.output.split('\n')[0].slice(0, 80);
  console.log(`✓ Task "${taskId}" completed (${String(result.duration)}ms)`);
  console.log(`  Preview: ${preview}...`);
  console.log();
});

supportCrew.on('crew:task:error', (_crewId, taskId, error) => {
  console.error(`✗ Task "${taskId}" failed: ${String(error)}`);
});

supportCrew.on('crew:complete', (_crewId, runResult) => {
  console.log(`🏁 Support workflow finished in ${String(runResult.duration)}ms`);
});

// -- Run the support workflow ------------------------------------------------

const result = await supportCrew.run();

// -- Display results ---------------------------------------------------------

console.log('\n=== Support Results ===\n');
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
for (const agent of [triageAgent, knowledgeAgent, resolutionAgent]) {
  const toolNames = Array.from(agent.tools.keys()).join(', ');
  console.log(`${agent.id}: [${toolNames}]`);
}
