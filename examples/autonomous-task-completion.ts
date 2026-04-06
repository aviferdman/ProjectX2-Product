/**
 * Crewspace — Autonomous Task Completion Example
 *
 * This example demonstrates how to build a multi-agent crew that autonomously
 * plans, executes, validates, and reports on a complex task without human
 * intervention. The crew manages its own workflow from start to finish:
 *
 *   1. **Planner** — decomposes a high-level goal into an ordered execution plan
 *   2. **Executor** — carries out each step using tools, producing artifacts
 *   3. **Validator** — inspects the artifacts for quality and completeness
 *   4. **Reporter** — compiles a final summary with status and deliverables
 *
 * Key concepts:
 *   - Fully autonomous multi-agent task completion (plan → execute → validate → report)
 *   - Defining custom tools with `defineTool` and Zod schemas
 *   - Multi-step task dependencies driving autonomous workflow progression
 *   - Tool-augmented execution: task registry, artifact store, and quality checker
 *   - Passing intermediate results between agents via dependency context
 *   - Subscribing to crew lifecycle events for observability
 *   - Self-contained workflow that runs without human-in-the-loop
 *
 * Prerequisites:
 *   npm install @crewspace/core
 *
 * Usage:
 *   npx tsx examples/autonomous-task-completion.ts
 *
 * Note: This example uses a mock LLM provider for demonstration purposes.
 * Replace it with a real provider (OpenAI, Anthropic, Ollama) for production use.
 */

import { Agent, Crew, defineTool } from '@crewspace/core';
import type { LLMProvider, LLMMessage, LLMResponse } from '@crewspace/core';
import { z } from 'zod';

// -- Custom tools for autonomous task management ------------------------------

// Tool: register a sub-task in the task registry
const registerTaskTool = defineTool({
  name: 'registerTask',
  description: 'Register a sub-task in the task registry with its details and priority',
  schema: z.object({
    taskId: z.string().describe('Unique identifier for the sub-task'),
    title: z.string().describe('Short title describing the sub-task'),
    priority: z.enum(['high', 'medium', 'low']).describe('Priority level'),
    estimatedEffort: z.string().describe('Estimated effort (e.g., "30 minutes", "2 hours")'),
  }),
  async execute({ taskId, title, priority, estimatedEffort }) {
    return (
      `Task registered: ${taskId}\n` +
      `  Title: ${title}\n` +
      `  Priority: ${priority}\n` +
      `  Estimated effort: ${estimatedEffort}`
    );
  },
});

// Tool: store an artifact produced during execution
const storeArtifactTool = defineTool({
  name: 'storeArtifact',
  description: 'Store a named artifact (file, data, result) produced during task execution',
  schema: z.object({
    name: z.string().describe('Artifact name or filename'),
    type: z
      .enum(['code', 'data', 'config', 'document', 'report'])
      .describe('Type of artifact'),
    content: z.string().describe('The artifact content or a summary of it'),
  }),
  async execute({ name, type, content }) {
    const sizeKb = Math.ceil(content.length / 1024);
    return (
      `Artifact stored: ${name}\n` +
      `  Type: ${type}\n` +
      `  Size: ${String(sizeKb)} KB\n` +
      `  Status: saved`
    );
  },
});

// Tool: run a quality check on produced artifacts
const qualityCheckTool = defineTool({
  name: 'qualityCheck',
  description: 'Run a quality check against an artifact to verify correctness and completeness',
  schema: z.object({
    artifactName: z.string().describe('Name of the artifact to check'),
    criteria: z
      .array(z.string())
      .describe('List of quality criteria to evaluate'),
  }),
  async execute({ artifactName, criteria }) {
    const results = criteria.map((criterion, i) => {
      const passed = i < criteria.length - 1 || criteria.length <= 3;
      return `  ${passed ? '✓' : '⚠'} ${criterion}: ${passed ? 'PASS' : 'NEEDS REVIEW'}`;
    });
    const passCount = results.filter((r) => r.includes('PASS')).length;
    const score = Math.round((passCount / criteria.length) * 100);
    return (
      `Quality Check: ${artifactName}\n` +
      results.join('\n') +
      `\n  Score: ${String(score)}%\n` +
      `  Verdict: ${score >= 80 ? 'APPROVED' : 'NEEDS REVISION'}`
    );
  },
});

// Tool: update the status of a registered task
const updateTaskStatusTool = defineTool({
  name: 'updateTaskStatus',
  description: 'Update the completion status of a registered sub-task',
  schema: z.object({
    taskId: z.string().describe('The sub-task identifier'),
    status: z
      .enum(['pending', 'in-progress', 'completed', 'failed', 'skipped'])
      .describe('New status'),
    notes: z.string().optional().describe('Optional notes about the status change'),
  }),
  async execute({ taskId, status, notes }) {
    const noteStr = notes ? `\n  Notes: ${notes}` : '';
    return `Task ${taskId} → ${status}${noteStr}`;
  },
});

// -- Mock LLM provider (replace with createOpenAIProvider() for real use) -----

const mockResponses: Record<string, string> = {
  plan:
    '## Autonomous Execution Plan\n\n' +
    '**Goal:** Set up a production-ready REST API project with authentication,\n' +
    'database integration, testing, and deployment configuration.\n\n' +
    '### Sub-tasks identified:\n\n' +
    '**1. project-scaffold** [HIGH]\n' +
    'Initialize the project structure with package.json, TypeScript config,\n' +
    'and directory layout (src/, tests/, config/).\n' +
    'Estimated effort: 30 minutes\n\n' +
    '**2. auth-module** [HIGH]\n' +
    'Implement JWT-based authentication with login, logout, and token refresh.\n' +
    'Includes password hashing with bcrypt and middleware for route protection.\n' +
    'Estimated effort: 2 hours\n\n' +
    '**3. database-setup** [HIGH]\n' +
    'Configure database connection with an ORM, define models (User, Session),\n' +
    'and set up migrations.\n' +
    'Estimated effort: 1 hour\n\n' +
    '**4. api-routes** [MEDIUM]\n' +
    'Define CRUD endpoints for the core resource, applying auth middleware.\n' +
    'Estimated effort: 1.5 hours\n\n' +
    '**5. test-suite** [MEDIUM]\n' +
    'Write unit and integration tests covering auth, database, and API routes.\n' +
    'Target: 80% code coverage.\n' +
    'Estimated effort: 2 hours\n\n' +
    '**6. deploy-config** [LOW]\n' +
    'Create Dockerfile, docker-compose.yml, and CI/CD pipeline configuration.\n' +
    'Estimated effort: 1 hour\n\n' +
    '### Execution order:\n' +
    'project-scaffold → database-setup → auth-module → api-routes → test-suite → deploy-config\n\n' +
    '### Total estimated effort: ~8 hours',

  execute:
    '## Execution Report\n\n' +
    '### Step 1: project-scaffold ✓\n' +
    'Created project structure with TypeScript configuration.\n' +
    'Artifacts: package.json, tsconfig.json, src/index.ts, src/app.ts\n\n' +
    '### Step 2: database-setup ✓\n' +
    'Configured PostgreSQL connection with Prisma ORM.\n' +
    'Defined User and Session models with migrations.\n' +
    'Artifacts: prisma/schema.prisma, src/db/client.ts, src/db/migrations/\n\n' +
    '### Step 3: auth-module ✓\n' +
    'Implemented JWT authentication with bcrypt password hashing.\n' +
    'Created login, logout, and token refresh endpoints.\n' +
    'Artifacts: src/auth/jwt.ts, src/auth/middleware.ts, src/auth/routes.ts\n\n' +
    '### Step 4: api-routes ✓\n' +
    'Defined CRUD routes for resources with auth middleware applied.\n' +
    'Artifacts: src/routes/resources.ts, src/middleware/validate.ts\n\n' +
    '### Step 5: test-suite ✓\n' +
    'Wrote 24 unit tests and 8 integration tests.\n' +
    'Coverage: 87% statements, 82% branches.\n' +
    'Artifacts: tests/auth.test.ts, tests/routes.test.ts, tests/db.test.ts\n\n' +
    '### Step 6: deploy-config ✓\n' +
    'Created Dockerfile with multi-stage build and docker-compose for local dev.\n' +
    'Added GitHub Actions CI pipeline.\n' +
    'Artifacts: Dockerfile, docker-compose.yml, .github/workflows/ci.yml\n\n' +
    '**All 6 sub-tasks completed successfully.**',

  validate:
    '## Validation Report\n\n' +
    '### Artifact Quality Checks\n\n' +
    '**project-scaffold**\n' +
    '  ✓ TypeScript configuration valid\n' +
    '  ✓ Directory structure follows conventions\n' +
    '  ✓ Dependencies properly declared\n' +
    '  Score: 100%  — APPROVED\n\n' +
    '**auth-module**\n' +
    '  ✓ JWT signing uses secure algorithm (RS256)\n' +
    '  ✓ Passwords hashed with bcrypt (12 rounds)\n' +
    '  ✓ Token refresh prevents replay attacks\n' +
    '  ✓ Middleware validates token on protected routes\n' +
    '  Score: 100% — APPROVED\n\n' +
    '**database-setup**\n' +
    '  ✓ Schema matches data model requirements\n' +
    '  ✓ Migrations are reversible\n' +
    '  ✓ Connection pooling configured\n' +
    '  Score: 100% — APPROVED\n\n' +
    '**api-routes**\n' +
    '  ✓ All CRUD operations implemented\n' +
    '  ✓ Input validation on all endpoints\n' +
    '  ✓ Auth middleware applied to protected routes\n' +
    '  Score: 100% — APPROVED\n\n' +
    '**test-suite**\n' +
    '  ✓ Coverage exceeds 80% threshold (87%)\n' +
    '  ✓ Both unit and integration tests present\n' +
    '  ✓ Auth edge cases covered\n' +
    '  Score: 100% — APPROVED\n\n' +
    '**deploy-config**\n' +
    '  ✓ Dockerfile uses multi-stage build\n' +
    '  ✓ No secrets in configuration files\n' +
    '  ✓ CI pipeline runs tests before deploy\n' +
    '  Score: 100% — APPROVED\n\n' +
    '### Overall Assessment\n' +
    'All 6 artifacts passed quality checks. The project meets production-readiness ' +
    'criteria. No revisions required.',

  report:
    '## Final Completion Report\n\n' +
    '### Goal\n' +
    'Set up a production-ready REST API project with authentication, database ' +
    'integration, testing, and deployment configuration.\n\n' +
    '### Status: ✅ COMPLETE\n\n' +
    '### Summary\n' +
    'All 6 sub-tasks were autonomously planned, executed, validated, and completed ' +
    'without human intervention. The project is production-ready.\n\n' +
    '### Deliverables\n' +
    '| Sub-task | Status | Quality |\n' +
    '|----------|--------|---------|\n' +
    '| project-scaffold | ✅ Complete | 100% |\n' +
    '| auth-module | ✅ Complete | 100% |\n' +
    '| database-setup | ✅ Complete | 100% |\n' +
    '| api-routes | ✅ Complete | 100% |\n' +
    '| test-suite | ✅ Complete | 100% |\n' +
    '| deploy-config | ✅ Complete | 100% |\n\n' +
    '### Metrics\n' +
    '- **Sub-tasks completed:** 6/6\n' +
    '- **Test coverage:** 87%\n' +
    '- **Quality score:** 100% (all artifacts approved)\n' +
    '- **Files produced:** 15\n\n' +
    '### Key Decisions Made Autonomously\n' +
    '1. Selected RS256 for JWT signing (more secure than HS256 for production)\n' +
    '2. Used Prisma ORM for type-safe database access\n' +
    '3. Applied multi-stage Docker build to minimize image size\n' +
    '4. Chose 80% coverage threshold as minimum quality gate\n\n' +
    '---\n' +
    'Autonomously completed by Crewspace Task Completion Crew',
};

function createTaskCompletionMockProvider(): LLMProvider {
  return {
    name: 'task-completion-mock',
    async generateText(messages: readonly LLMMessage[]): Promise<LLMResponse> {
      const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
      const content = lastUserMessage?.content?.toLowerCase() ?? '';

      let response = mockResponses['plan'];
      if (
        content.includes('execute') ||
        content.includes('carry out') ||
        content.includes('implement') ||
        content.includes('build')
      ) {
        response = mockResponses['execute'];
      } else if (
        content.includes('validate') ||
        content.includes('check') ||
        content.includes('quality') ||
        content.includes('verify')
      ) {
        response = mockResponses['validate'];
      } else if (
        content.includes('report') ||
        content.includes('summarize') ||
        content.includes('final') ||
        content.includes('compile')
      ) {
        response = mockResponses['report'];
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

// -- Create specialized agents -----------------------------------------------

// 1. Planner — decomposes goals into ordered sub-tasks
const planner = new Agent({
  id: 'planner',
  role: 'Autonomous Task Planner',
  goal: 'Decompose a high-level goal into an ordered set of sub-tasks with priorities and effort estimates',
  backstory:
    'You are an expert project planner who breaks down complex goals into ' +
    'actionable sub-tasks. You identify dependencies between tasks, assign ' +
    'priorities, and estimate effort. You register each sub-task using the ' +
    'registerTask tool to create a structured execution plan.',
  tools: [registerTaskTool],
  llmProvider: createTaskCompletionMockProvider(),
});

// 2. Executor — carries out each sub-task and produces artifacts
const executor = new Agent({
  id: 'executor',
  role: 'Autonomous Task Executor',
  goal: 'Execute each sub-task from the plan, producing artifacts and updating task status',
  backstory:
    'You are a skilled engineer who autonomously executes tasks from a plan. ' +
    'For each sub-task, you produce the required artifacts (code, config, data) ' +
    'and store them using the storeArtifact tool. You update task status as you ' +
    'progress through the plan using the updateTaskStatus tool.',
  tools: [storeArtifactTool, updateTaskStatusTool],
  llmProvider: createTaskCompletionMockProvider(),
});

// 3. Validator — checks all artifacts for quality and completeness
const validator = new Agent({
  id: 'validator',
  role: 'Quality Assurance Validator',
  goal: 'Validate all produced artifacts against quality criteria and flag any issues',
  backstory:
    'You are a thorough QA specialist who reviews every artifact for correctness, ' +
    'completeness, and adherence to best practices. You use the qualityCheck tool ' +
    'to run structured checks and provide a clear pass/fail verdict for each artifact.',
  tools: [qualityCheckTool],
  llmProvider: createTaskCompletionMockProvider(),
});

// 4. Reporter — compiles the final completion summary
const reporter = new Agent({
  id: 'reporter',
  role: 'Completion Report Specialist',
  goal: 'Compile a final report summarizing all completed tasks, deliverables, and quality metrics',
  backstory:
    'You are a technical writer who produces clear, comprehensive completion ' +
    'reports. You summarize what was accomplished, list all deliverables, include ' +
    'quality metrics, and document any decisions made autonomously during execution.',
  llmProvider: createTaskCompletionMockProvider(),
});

// -- Build the crew with autonomous workflow dependencies --------------------

const taskCompletionCrew = new Crew({
  id: 'autonomous-task-crew',
  name: 'Autonomous Task Completion Crew',
  agents: [planner, executor, validator, reporter],
  tasks: [
    {
      id: 'plan',
      description:
        'Decompose the following goal into an ordered execution plan:\n\n' +
        '"Set up a production-ready REST API project with authentication, ' +
        'database integration, testing, and deployment configuration."\n\n' +
        'For each sub-task, use the registerTask tool to register it with ' +
        'an id, title, priority, and effort estimate. Define the execution ' +
        'order based on dependencies between sub-tasks.',
      agentId: 'planner',
      expectedOutput:
        'An ordered execution plan with registered sub-tasks, priorities, and effort estimates',
    },
    {
      id: 'execute',
      description:
        'Execute each sub-task from the plan in order. For each sub-task:\n' +
        '1. Use updateTaskStatus to mark it as in-progress\n' +
        '2. Produce the required artifacts (code, config, documentation)\n' +
        '3. Use storeArtifact to save each artifact\n' +
        '4. Use updateTaskStatus to mark it as completed\n\n' +
        'Work through the entire plan autonomously without stopping.',
      agentId: 'executor',
      dependencies: ['plan'],
      expectedOutput:
        'An execution report listing all completed sub-tasks and produced artifacts',
    },
    {
      id: 'validate',
      description:
        'Validate all artifacts produced during execution. For each artifact:\n' +
        '1. Define quality criteria relevant to the artifact type\n' +
        '2. Use the qualityCheck tool to run a structured evaluation\n' +
        '3. Report pass/fail for each criterion\n\n' +
        'Flag any artifacts that need revision. Provide an overall quality assessment.',
      agentId: 'validator',
      dependencies: ['execute'],
      expectedOutput:
        'A validation report with quality scores for each artifact and an overall verdict',
    },
    {
      id: 'report',
      description:
        'Compile a final completion report that includes:\n' +
        '1. The original goal and approach taken\n' +
        '2. A summary of all sub-tasks and their completion status\n' +
        '3. Quality metrics from the validation phase\n' +
        '4. A list of all deliverables produced\n' +
        '5. Any autonomous decisions made during execution\n\n' +
        'The report should clearly indicate whether the goal was fully achieved.',
      agentId: 'reporter',
      dependencies: ['validate'],
      expectedOutput:
        'A comprehensive completion report with status, deliverables, and quality metrics',
    },
  ],
});

// -- Subscribe to lifecycle events for observability -------------------------

console.log('=== Crewspace Autonomous Task Completion ===\n');

taskCompletionCrew.on('crew:start', (crewId) => {
  console.log(`🤖 Autonomous crew "${crewId}" started\n`);
});

taskCompletionCrew.on('crew:task:start', (_crewId, taskId, agentId) => {
  console.log(`▶ Phase "${taskId}" → agent "${agentId}"`);
});

taskCompletionCrew.on('crew:task:complete', (_crewId, taskId, result) => {
  const preview = result.output.split('\n')[0].slice(0, 80);
  console.log(`✓ Phase "${taskId}" completed (${String(result.duration)}ms)`);
  console.log(`  Preview: ${preview}...`);
  console.log();
});

taskCompletionCrew.on('crew:task:error', (_crewId, taskId, error) => {
  console.error(`✗ Phase "${taskId}" failed: ${String(error)}`);
});

taskCompletionCrew.on('crew:complete', (_crewId, runResult) => {
  console.log(`🏁 Autonomous task completion finished in ${String(runResult.duration)}ms`);
});

// -- Run the autonomous task completion workflow -----------------------------

const result = await taskCompletionCrew.run();

// -- Display results ---------------------------------------------------------

console.log('\n=== Autonomous Task Completion Results ===\n');
console.log(`Success: ${String(result.success)}`);
console.log(`Total duration: ${String(result.duration)}ms`);
console.log(`Phases completed: ${String(result.taskResults.size)}`);

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
for (const agent of [planner, executor, validator, reporter]) {
  const toolNames = Array.from(agent.tools.keys()).join(', ') || '(none)';
  console.log(`${agent.id}: [${toolNames}]`);
}
