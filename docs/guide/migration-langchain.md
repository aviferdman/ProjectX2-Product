# Migrating from LangChain

This guide helps you migrate your LangChain TypeScript/JavaScript applications to Crewspace. It maps LangChain concepts to their Crewspace equivalents, provides side-by-side code examples, and covers common migration patterns.

::: tip Why migrate?
Crewspace is purpose-built for multi-agent orchestration with full TypeScript type safety, a simpler mental model, built-in resilience, and a lightweight runtime. If your LangChain app primarily uses agents and tools, Crewspace offers a more focused, type-safe alternative. See the [Framework Comparison](/guide/comparison) for a detailed analysis.
:::

## Concept Mapping

| LangChain Concept | Crewspace Equivalent | Notes |
|-------------------|---------------------|-------|
| `ChatOpenAI` / `ChatAnthropic` | `createOpenAIProvider()` / `createAnthropicProvider()` | Crewspace uses factory functions returning a unified `LLMProvider` interface |
| `AgentExecutor` | `Agent` + `Crew` | Crewspace agents are first-class objects with roles, goals, and lifecycle events |
| `Tool` / `StructuredTool` | `defineTool()` / `createTool()` | Zod-validated input schemas with permission support |
| `ChatPromptTemplate` | Agent `role` + `goal` + `backstory` | Crewspace uses declarative agent personas instead of prompt templates |
| Chain / LCEL | `Crew` task pipeline | Task dependencies replace chain composition |
| `RunnableSequence` | `ExecutionEngine` (sequential) | DAG-based execution with topological sort |
| `RunnableParallel` | `ExecutionEngine` (parallel) | Configurable concurrency with dependency-aware scheduling |
| Callbacks / Tracers | Typed EventEmitter events | Strongly-typed lifecycle events for every component |
| Retry (manual) | `createRetryProvider()` | Built-in retry with exponential backoff |
| Fallback (manual) | `createFallbackProvider()` | Built-in fallback chains |

## Installation

Remove LangChain dependencies and install Crewspace:

```bash
# Remove LangChain packages
npm uninstall langchain @langchain/openai @langchain/anthropic @langchain/core @langchain/community

# Install Crewspace
npm install @crewspace/core
```

## Migrating LLM Providers

### Before (LangChain)

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';

const openai = new ChatOpenAI({
  modelName: 'gpt-4o',
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new ChatAnthropic({
  modelName: 'claude-sonnet-4-20250514',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
});
```

### After (Crewspace)

```typescript
import { createOpenAIProvider, createAnthropicProvider } from '@crewspace/core';

const openai = createOpenAIProvider({
  modelId: 'gpt-4o',
  apiKey: process.env.OPENAI_API_KEY!,
});

const anthropic = createAnthropicProvider({
  modelId: 'claude-sonnet-4-20250514',
  apiKey: process.env.ANTHROPIC_API_KEY!,
});
```

**Key differences:**
- Crewspace uses `modelId` instead of `modelName`
- Factory functions return a unified `LLMProvider` interface
- Provider-specific options like `temperature` are passed in the request, not at construction time

### Adding Resilience

LangChain requires manual retry/fallback logic. Crewspace provides built-in decorators:

```typescript
import {
  createRetryProvider,
  createFallbackProvider,
  createUsageTrackingProvider,
  createOllamaProvider,
} from '@crewspace/core';

// Retry with exponential backoff
const resilient = createRetryProvider(openai, {
  maxRetries: 3,
  baseDelay: 1000,
  backoffMultiplier: 2,
});

// Fallback chain: try OpenAI → Anthropic → local Ollama
const local = createOllamaProvider({ modelId: 'llama3' });
const withFallback = createFallbackProvider(openai, [anthropic, local]);

// Usage tracking
const tracked = createUsageTrackingProvider(openai);
```

## Migrating Tools

### Before (LangChain)

```typescript
import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

class CalculatorTool extends StructuredTool {
  name = 'calculator';
  description = 'Perform arithmetic';
  schema = z.object({
    a: z.number(),
    b: z.number(),
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
  });

  async _call({ a, b, operation }: z.infer<typeof this.schema>) {
    const ops = { add: a + b, subtract: a - b, multiply: a * b, divide: a / b };
    return String(ops[operation]);
  }
}

const calculator = new CalculatorTool();
```

### After (Crewspace)

```typescript
import { defineTool } from '@crewspace/core';
import { z } from 'zod';

const calculator = defineTool({
  name: 'calculator',
  description: 'Perform arithmetic',
  schema: z.object({
    a: z.number(),
    b: z.number(),
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
  }),
  async execute({ a, b, operation }) {
    const ops = { add: a + b, subtract: a - b, multiply: a * b, divide: a / b };
    return ops[operation];
  },
});
```

**Key differences:**
- No class inheritance — `defineTool()` is a simple function call
- `execute` instead of `_call` — clearer naming, full type inference from the Zod schema
- Return values are not required to be strings

### Tool Registry

LangChain passes tools as arrays. Crewspace provides a `ToolRegistry` for organized management:

```typescript
import { ToolRegistry, ToolExecutor, PermissionManager } from '@crewspace/core';

const registry = new ToolRegistry();
registry.register(calculator);

// Optional: permission-controlled execution
const permissions = new PermissionManager();
permissions.grant('calculator', 'agent:researcher');

const executor = new ToolExecutor(registry, permissions);
```

### Built-in Tools

Replace LangChain community tools with Crewspace built-ins:

| LangChain | Crewspace |
|-----------|-----------|
| `WebBrowser` / `RequestsGetTool` | `createWebTools()` → `httpGet`, `httpPost` |
| `ReadFileTool` / `WriteFileTool` | `createFileTools()` → `readFile`, `writeFile`, `listFiles` |
| `ShellTool` | Built-in shell tools via `@crewspace/core` |

```typescript
import { createFileTools, createWebTools } from '@crewspace/core';

const { readFile, writeFile, listFiles } = createFileTools();
const { httpGet, httpPost } = createWebTools();
```

## Migrating Agents

### Before (LangChain)

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';

const llm = new ChatOpenAI({ modelName: 'gpt-4o' });

const prompt = ChatPromptTemplate.fromMessages([
  ['system', 'You are a research analyst. Find key insights about {topic}.'],
  ['human', '{input}'],
  new MessagesPlaceholder('agent_scratchpad'),
]);

const tools = [new CalculatorTool()];
const agent = await createOpenAIFunctionsAgent({ llm, tools, prompt });
const executor = new AgentExecutor({ agent, tools });

const result = await executor.invoke({
  input: 'What are the latest AI trends?',
  topic: 'artificial intelligence',
});
```

### After (Crewspace)

```typescript
import { Agent, createOpenAIProvider, defineTool } from '@crewspace/core';

const researcher = new Agent({
  id: 'researcher',
  role: 'Research Analyst',
  goal: 'Find key insights about artificial intelligence',
  backstory: 'You are an experienced research analyst specializing in technology trends.',
});

researcher.setLLMProvider(createOpenAIProvider({
  modelId: 'gpt-4o',
  apiKey: process.env.OPENAI_API_KEY!,
}));

researcher.addTool(calculator);
```

**Key differences:**
- Agent identity is declarative (`role`, `goal`, `backstory`) rather than prompt-template-based
- LLM provider is set on the agent, not passed to a factory function
- Tools are added directly to agents with `addTool()`
- No `AgentExecutor` wrapper needed — agents execute tasks directly within a Crew

## Migrating Chains to Crews

### Before (LangChain) — Sequential Chain

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';

const llm = new ChatOpenAI({ modelName: 'gpt-4o' });

const researchPrompt = ChatPromptTemplate.fromTemplate(
  'Research this topic: {topic}'
);
const writePrompt = ChatPromptTemplate.fromTemplate(
  'Write a report based on this research: {research}'
);

const chain = RunnableSequence.from([
  researchPrompt,
  llm,
  new StringOutputParser(),
  (research) => ({ research }),
  writePrompt,
  llm,
  new StringOutputParser(),
]);

const result = await chain.invoke({ topic: 'AI trends' });
```

### After (Crewspace) — Crew with Task Dependencies

```typescript
import { Agent, Crew, createOpenAIProvider } from '@crewspace/core';

const llm = createOpenAIProvider({
  modelId: 'gpt-4o',
  apiKey: process.env.OPENAI_API_KEY!,
});

const researcher = new Agent({
  id: 'researcher',
  role: 'Research Analyst',
  goal: 'Research topics thoroughly',
});
researcher.setLLMProvider(llm);

const writer = new Agent({
  id: 'writer',
  role: 'Report Writer',
  goal: 'Write clear, well-structured reports',
});
writer.setLLMProvider(llm);

const crew = new Crew({
  id: 'research-pipeline',
  agents: [researcher, writer],
  tasks: [
    {
      id: 'research',
      description: 'Research the latest AI trends',
      expectedOutput: 'Key findings and data points',
      agentId: 'researcher',
    },
    {
      id: 'write-report',
      description: 'Write a report based on the research findings',
      expectedOutput: 'A polished report with insights',
      agentId: 'writer',
      dependencies: ['research'],
    },
  ],
});

const result = await crew.run();
```

**Key differences:**
- Tasks are explicit units of work with `description`, `expectedOutput`, and `dependencies`
- Dependency resolution is automatic via topological sort
- Results from completed tasks are forwarded as context to dependent tasks
- Each task is assigned to a specialized agent by `agentId`

## Migrating Parallel Execution

### Before (LangChain) — RunnableParallel

```typescript
import { RunnableParallel } from '@langchain/core/runnables';

const parallel = RunnableParallel.from({
  research: researchChain,
  analysis: analysisChain,
});
const results = await parallel.invoke({ topic: 'AI trends' });
```

### After (Crewspace) — ExecutionEngine

```typescript
import { ExecutionEngine, Task, ExecutionStrategy } from '@crewspace/core';

const engine = new ExecutionEngine({
  id: 'parallel-pipeline',
  strategy: ExecutionStrategy.PARALLEL,
  maxConcurrency: 3,
  taskErrorPolicy: 'continue',
});

engine.addAgent(researcher);
engine.addAgent(analyst);

const researchTask = new Task({ id: 'research', description: 'Research AI trends' });
const analysisTask = new Task({ id: 'analysis', description: 'Analyze market data' });
researchTask.assignAgent('researcher');
analysisTask.assignAgent('analyst');

engine.addTask(researchTask);
engine.addTask(analysisTask);

const result = await engine.run();
```

## Migrating Callbacks to Events

### Before (LangChain)

```typescript
import { BaseCallbackHandler } from '@langchain/core/callbacks/base';

class MyHandler extends BaseCallbackHandler {
  name = 'my_handler';

  handleLLMStart(llm: any, prompts: string[]) {
    console.log('LLM started');
  }

  handleLLMEnd(output: any) {
    console.log('LLM finished');
  }

  handleLLMError(err: Error) {
    console.error('LLM error', err);
  }
}

const result = await executor.invoke(
  { input: 'Hello' },
  { callbacks: [new MyHandler()] },
);
```

### After (Crewspace)

```typescript
// Agent-level events
researcher.on('agent:start', (agentId) => {
  console.log(`Agent ${agentId} started`);
});

researcher.on('agent:complete', (agentId, result) => {
  console.log(`Agent ${agentId} finished`);
});

researcher.on('agent:error', (agentId, error) => {
  console.error(`Agent ${agentId} error`, error);
});

// Crew-level events
crew.on('crew:task:start', (crewId, taskId, agentId) => {
  console.log(`Task ${taskId} started on ${agentId}`);
});

crew.on('crew:task:complete', (crewId, taskId, result) => {
  console.log(`Task ${taskId} completed`);
});

crew.on('crew:complete', (crewId, result) => {
  console.log(`Crew finished in ${result.duration}ms`);
});
```

**Key differences:**
- No callback handler classes — use `.on()` with typed event names
- Events are strongly-typed via TypeScript, providing IDE autocompletion
- Events are scoped to components (agent, crew, engine) for better separation

## Migrating Streaming

### Before (LangChain)

```typescript
import { ChatOpenAI } from '@langchain/openai';

const llm = new ChatOpenAI({ modelName: 'gpt-4o', streaming: true });

const stream = await llm.stream('Tell me about AI');
for await (const chunk of stream) {
  process.stdout.write(chunk.content as string);
}
```

### After (Crewspace)

```typescript
import { createOpenAIProvider } from '@crewspace/core';

const provider = createOpenAIProvider({
  modelId: 'gpt-4o',
  apiKey: process.env.OPENAI_API_KEY!,
});

const stream = await provider.generateStream({
  messages: [{ role: 'user', content: 'Tell me about AI' }],
});

for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}
```

## Migration Checklist

Use this checklist to track your migration progress:

- [ ] **Dependencies** — Replace `langchain` / `@langchain/*` packages with `@crewspace/core`
- [ ] **LLM Providers** — Replace `ChatOpenAI` / `ChatAnthropic` with `createOpenAIProvider()` / `createAnthropicProvider()`
- [ ] **Tools** — Convert `StructuredTool` classes to `defineTool()` calls
- [ ] **Agents** — Replace `AgentExecutor` + prompt templates with `Agent` declarations
- [ ] **Chains** — Replace `RunnableSequence` / LCEL with `Crew` task pipelines
- [ ] **Parallel execution** — Replace `RunnableParallel` with `ExecutionEngine` (parallel strategy)
- [ ] **Callbacks** — Replace `BaseCallbackHandler` with typed `.on()` event listeners
- [ ] **Streaming** — Replace `.stream()` with `provider.generateStream()`
- [ ] **Error handling** — Replace generic try/catch with Crewspace typed error classes
- [ ] **Resilience** — Replace manual retry logic with `createRetryProvider()` / `createFallbackProvider()`
- [ ] **Tests** — Update tests to use Crewspace mock-friendly interfaces

## What Crewspace Does Not Replace

LangChain covers a broader scope than Crewspace. The following LangChain features do **not** have direct Crewspace equivalents:

| LangChain Feature | Alternative |
|-------------------|-------------|
| **Document loaders** | Use dedicated libraries like `pdf-parse`, `cheerio`, or `csv-parse` |
| **Vector stores** | Use `pgvector`, `pinecone`, `chromadb`, or `qdrant` client libraries directly |
| **Retrievers / RAG** | Implement retrieval as a custom Crewspace tool using your vector store client |
| **Output parsers** | Use Zod schemas for validation; parse LLM output in tool `execute` functions |
| **LCEL** | Use Crew task dependencies for orchestration; use standard TypeScript for data transformations |
| **LangSmith** | Use Crewspace's EventEmitter events to build custom tracing, or integrate with OpenTelemetry |
| **Memory** | Manage conversation history externally and pass it via task context |

::: tip Need RAG?
If your application heavily relies on RAG (retrieval-augmented generation), you can implement retrieval as a Crewspace tool. Create a custom tool that queries your vector store and returns relevant documents — the agent will use it like any other tool.

```typescript
const retrievalTool = defineTool({
  name: 'search_docs',
  description: 'Search the knowledge base for relevant documents',
  schema: z.object({ query: z.string() }),
  async execute({ query }) {
    const results = await vectorStore.similaritySearch(query, 5);
    return results.map((r) => r.pageContent).join('\n\n');
  },
});

researcher.addTool(retrievalTool);
```
:::

## Getting Help

- **[Getting Started Guide](/getting-started)** — Set up your first Crewspace project
- **[Core Concepts](/guide/core-concepts)** — Understand Agents, Tasks, Crews, and Engines
- **[Tool System](/guide/tools)** — Learn about defining and managing tools
- **[LLM Providers](/guide/llm-providers)** — Configure and swap LLM providers
- **[Framework Comparison](/guide/comparison)** — Detailed comparison with LangChain and others
- **[GitHub Discussions](https://github.com/aviferdman/ProjectX2-Product/discussions)** — Ask questions and get help from the community
