/**
 * Project template definitions for `crewspace init`.
 *
 * Each template is a record of relative file paths to file content strings.
 * Template functions accept a project name so generated files can reference it.
 *
 * @packageDocumentation
 */

/** A template is a map of relative file paths to their content. */
export type ProjectTemplate = ReadonlyMap<string, string>;

/** Available template names. */
export type TemplateName = 'default' | 'minimal';

/** All known template names. */
export const TEMPLATE_NAMES: readonly TemplateName[] = ['default', 'minimal'];

/**
 * Returns the file map for a given template.
 *
 * @throws {Error} If `name` is not a known template.
 */
export function getTemplate(name: string, projectName: string): ProjectTemplate {
  switch (name) {
    case 'default':
      return buildDefaultTemplate(projectName);
    case 'minimal':
      return buildMinimalTemplate(projectName);
    default:
      throw new Error(
        `Unknown template "${name}". Available templates: ${TEMPLATE_NAMES.join(', ')}`,
      );
  }
}

// ---------------------------------------------------------------------------
// Template builders
// ---------------------------------------------------------------------------

function buildDefaultTemplate(projectName: string): ProjectTemplate {
  const files = new Map<string, string>();

  files.set(
    'package.json',
    JSON.stringify(
      {
        name: projectName,
        version: '0.1.0',
        private: true,
        type: 'module',
        scripts: {
          build: 'tsc',
          start: 'tsx src/index.ts',
          dev: 'tsx watch src/index.ts',
        },
        dependencies: {
          '@crewspace/core': '^0.1.0',
        },
        devDependencies: {
          typescript: '^5.4.0',
          tsx: '^4.19.0',
        },
      },
      null,
      2,
    ) + '\n',
  );

  files.set(
    'tsconfig.json',
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'Node16',
          moduleResolution: 'Node16',
          lib: ['ES2022'],
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          outDir: './dist',
          rootDir: './src',
          declaration: true,
          sourceMap: true,
        },
        include: ['src/**/*.ts'],
        exclude: ['node_modules', 'dist'],
      },
      null,
      2,
    ) + '\n',
  );

  files.set(
    'crewspace.config.ts',
    `import type { AgentConfig } from '@crewspace/core';

/**
 * Crewspace project configuration.
 *
 * Edit this file to define agents, tasks, and workflow settings.
 */
export default {
  agents: [
    {
      id: 'researcher',
      role: 'Research Analyst',
      goal: 'Find key insights on a given topic',
    },
    {
      id: 'writer',
      role: 'Content Writer',
      goal: 'Write clear and concise summaries based on research',
    },
  ] satisfies AgentConfig[],

  tasks: [
    {
      id: 'research',
      description: 'Research the given topic and extract key findings',
      agentId: 'researcher',
    },
    {
      id: 'report',
      description: 'Write a summary report based on the research',
      agentId: 'writer',
      dependencies: ['research'],
    },
  ],
};
`,
  );

  files.set(
    'src/index.ts',
    `/**
 * ${projectName} — powered by Crewspace
 *
 * Run with: npx tsx src/index.ts
 */

import { Agent, Crew } from '@crewspace/core';
import type { LLMProvider, LLMMessage, LLMResponse } from '@crewspace/core';

// Replace this mock with a real provider (e.g. createOpenAIProvider)
function createMockProvider(name: string): LLMProvider {
  return {
    name,
    async generateText(_messages: readonly LLMMessage[]): Promise<LLMResponse> {
      return {
        content: \`[\${name}] Generated response based on the prompt.\`,
        tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        finishReason: 'stop',
      };
    },
  };
}

// 1. Create agents
const researcher = new Agent({
  id: 'researcher',
  role: 'Research Analyst',
  goal: 'Find key insights on a given topic',
  llmProvider: createMockProvider('researcher-llm'),
});

const writer = new Agent({
  id: 'writer',
  role: 'Content Writer',
  goal: 'Write clear and concise summaries',
  llmProvider: createMockProvider('writer-llm'),
});

// 2. Build a crew
const crew = new Crew({
  id: 'my-crew',
  agents: [researcher, writer],
  tasks: [
    { id: 'research', description: 'Research AI trends for 2026', agentId: 'researcher' },
    {
      id: 'report',
      description: 'Write a summary report of the research findings',
      agentId: 'writer',
      dependencies: ['research'],
    },
  ],
});

// 3. Run the workflow
const result = await crew.run();

console.log(\`Success: \${String(result.success)}\`);
console.log(\`Duration: \${String(result.duration)}ms\`);
console.log(\`Tasks completed: \${String(result.taskResults.size)}\`);
`,
  );

  files.set(
    '.gitignore',
    `node_modules/
dist/
*.tsbuildinfo
.env
.env.*
`,
  );

  return files;
}

function buildMinimalTemplate(projectName: string): ProjectTemplate {
  const files = new Map<string, string>();

  files.set(
    'package.json',
    JSON.stringify(
      {
        name: projectName,
        version: '0.1.0',
        private: true,
        type: 'module',
        scripts: {
          start: 'tsx src/index.ts',
        },
        dependencies: {
          '@crewspace/core': '^0.1.0',
        },
        devDependencies: {
          tsx: '^4.19.0',
        },
      },
      null,
      2,
    ) + '\n',
  );

  files.set(
    'tsconfig.json',
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'Node16',
          moduleResolution: 'Node16',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          outDir: './dist',
          rootDir: './src',
        },
        include: ['src/**/*.ts'],
        exclude: ['node_modules', 'dist'],
      },
      null,
      2,
    ) + '\n',
  );

  files.set(
    'src/index.ts',
    `/**
 * ${projectName} — powered by Crewspace
 *
 * Run with: npx tsx src/index.ts
 */

import { Agent } from '@crewspace/core';

const agent = new Agent({
  id: 'assistant',
  role: 'Assistant',
  goal: 'Help the user',
});

console.log(\`Agent "\${agent.id}" created with role "\${agent.role}".\`);
`,
  );

  return files;
}
