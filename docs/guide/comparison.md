# Framework Comparison

How does Crewspace compare to other popular agent orchestration frameworks? This guide provides a detailed, honest comparison between **Crewspace**, **CrewAI**, **LangChain**, and **AutoGen** to help you choose the right tool for your project.

## At a Glance

| Feature | Crewspace | CrewAI | LangChain | AutoGen |
|---------|-----------|--------|-----------|---------|
| **Language** | TypeScript | Python | Python / JS | Python |
| **Type safety** | Full (strict TS + Zod) | Runtime only | Runtime only | Runtime only |
| **Multi-agent orchestration** | ✅ Crew + Engine | ✅ Crew | ⚠️ Via AgentExecutor chains | ✅ GroupChat |
| **LLM provider abstraction** | ✅ OpenAI, Anthropic, Ollama | ✅ Via LiteLLM | ✅ Broad ecosystem | ✅ OpenAI-centric |
| **Tool system** | ✅ Zod-validated, permissions | ✅ Decorator-based | ✅ Broad tool ecosystem | ✅ Function calling |
| **Execution strategies** | Sequential + Parallel | Sequential + Hierarchical | Chain-based | Conversation-based |
| **Streaming support** | ✅ AsyncIterable | ✅ Callbacks | ✅ Callbacks + LCEL | ⚠️ Limited |
| **Resilience (retry/fallback)** | ✅ Built-in decorators | ⚠️ Manual | ⚠️ Manual | ⚠️ Manual |
| **Event system** | ✅ Typed EventEmitter | ⚠️ Callbacks | ✅ Callbacks + tracers | ⚠️ Hooks |
| **Test friendliness** | ✅ DI + mock interfaces | ⚠️ Moderate | ⚠️ Moderate | ⚠️ Moderate |
| **Package size** | Minimal | Moderate | Large | Moderate |
| **License** | MIT | MIT | MIT | MIT |

## Crewspace vs CrewAI

[CrewAI](https://github.com/joaomdmoura/crewAI) is a Python framework for orchestrating role-playing AI agents. Crewspace shares the concept of agents with roles, goals, and backstories organized into crews — but takes a different approach to implementation.

### Where Crewspace excels

- **TypeScript-native** — Full type inference, compile-time checks, and IDE autocompletion. CrewAI requires Python, which means no compile-time type safety.
- **Zod-validated configurations** — Agent, task, and tool configs are validated at construction time with descriptive error messages. CrewAI uses Pydantic but with less granular validation.
- **Parallel execution engine** — Crewspace's `ExecutionEngine` supports configurable concurrency with dependency-aware scheduling. CrewAI supports sequential and hierarchical processes.
- **Resilient LLM layer** — Built-in retry with exponential backoff, fallback provider chains, and circuit breakers. CrewAI relies on LiteLLM's retry mechanisms.
- **Event-driven architecture** — Typed lifecycle events (`agent:start`, `crew:complete`, etc.) for observability. CrewAI uses callback functions.

### Where CrewAI excels

- **Mature Python ecosystem** — Larger community, more integrations with Python-native data science and ML tools.
- **Hierarchical process** — CrewAI supports a manager agent that delegates tasks to other agents, which Crewspace does not yet implement.
- **Built-in memory** — CrewAI includes short-term, long-term, and entity memory out of the box.
- **Pre-built tool integrations** — CrewAI offers a larger catalog of ready-to-use tools via `crewai-tools`.

### Code comparison

**CrewAI (Python):**

```python
from crewai import Agent, Task, Crew

researcher = Agent(
    role="Research Analyst",
    goal="Find key insights",
    backstory="Expert researcher.",
    llm="gpt-4o",
)

task = Task(
    description="Research AI trends",
    expected_output="Summary report",
    agent=researcher,
)

crew = Crew(agents=[researcher], tasks=[task])
result = crew.kickoff()
```

**Crewspace (TypeScript):**

```typescript
import { Agent, Crew, createOpenAIProvider } from '@crewspace/core';

const researcher = new Agent({
  id: 'researcher',
  role: 'Research Analyst',
  goal: 'Find key insights',
  backstory: 'Expert researcher.',
});
researcher.setLLMProvider(createOpenAIProvider({ modelId: 'gpt-4o', apiKey: process.env.OPENAI_API_KEY! }));

const crew = new Crew({
  id: 'research-team',
  agents: [researcher],
  tasks: [{ id: 'research', description: 'Research AI trends', expectedOutput: 'Summary report', agentId: 'researcher' }],
});
const result = await crew.run();
```

### When to choose

- **Choose Crewspace** if you're building in a TypeScript/Node.js stack, want type safety, or need fine-grained execution control with parallel task scheduling.
- **Choose CrewAI** if you're in a Python ecosystem, need hierarchical delegation, or want access to CrewAI's pre-built tool catalog.

---

## Crewspace vs LangChain

[LangChain](https://github.com/langchain-ai/langchain) is a comprehensive framework for building LLM-powered applications. It covers a much broader scope than Crewspace — including document loaders, vector stores, retrieval chains, and more — but its multi-agent capabilities are more recent additions.

### Where Crewspace excels

- **Purpose-built for multi-agent workflows** — Crewspace is designed from the ground up for agent orchestration. LangChain's agent support is layered on top of a chain-based architecture.
- **Simpler mental model** — Agent → Task → Crew → Engine. LangChain requires understanding chains, runnables, LCEL, and AgentExecutor, which increases the learning curve.
- **Typed events and lifecycle hooks** — Every component emits strongly-typed events. LangChain's callback system is flexible but loosely typed.
- **Built-in resilience** — Retry, fallback, and circuit breaker decorators ship with `@crewspace/core`. LangChain requires manual implementation or third-party middleware.
- **Lightweight** — Crewspace has minimal dependencies and fast startup. LangChain's extensive dependency tree can lead to larger bundles and slower cold starts.

### Where LangChain excels

- **Breadth of integrations** — Document loaders, vector stores, retrievers, output parsers, and hundreds of tool integrations. LangChain is an ecosystem, not just a framework.
- **LCEL (LangChain Expression Language)** — A powerful composition language for building complex chains declaratively.
- **LangSmith observability** — First-party tracing, evaluation, and monitoring platform.
- **Community size** — Massive community with extensive tutorials, courses, and third-party resources.
- **RAG support** — First-class retrieval-augmented generation with built-in vector store integrations.

### Code comparison

**LangChain (TypeScript/JS):**

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';
import { ChatPromptTemplate } from '@langchain/core/prompts';

const llm = new ChatOpenAI({ modelName: 'gpt-4o' });
const prompt = ChatPromptTemplate.fromMessages([
  ['system', 'You are a research analyst.'],
  ['human', '{input}'],
]);
const agent = createOpenAIFunctionsAgent({ llm, tools: [], prompt });
const executor = new AgentExecutor({ agent, tools: [] });
const result = await executor.invoke({ input: 'Research AI trends' });
```

**Crewspace (TypeScript):**

```typescript
import { Agent, Crew, createOpenAIProvider } from '@crewspace/core';

const researcher = new Agent({
  id: 'researcher',
  role: 'Research Analyst',
  goal: 'Find key insights',
});
researcher.setLLMProvider(createOpenAIProvider({ modelId: 'gpt-4o', apiKey: process.env.OPENAI_API_KEY! }));

const crew = new Crew({
  id: 'research-team',
  agents: [researcher],
  tasks: [{ id: 'research', description: 'Research AI trends', agentId: 'researcher' }],
});
const result = await crew.run();
```

### When to choose

- **Choose Crewspace** if you're building multi-agent workflows and want a focused, type-safe, lightweight framework with a simple API.
- **Choose LangChain** if you need RAG, document processing, vector stores, or extensive third-party integrations beyond agent orchestration.

---

## Crewspace vs AutoGen

[AutoGen](https://github.com/microsoft/autogen) is Microsoft's framework for building multi-agent conversational AI systems. It focuses on agents that communicate via messages in a group chat pattern.

### Where Crewspace excels

- **TypeScript-native** — First-class TypeScript support with full type safety. AutoGen is Python-only.
- **Task-oriented architecture** — Crewspace uses explicit tasks with dependencies, priorities, and expected outputs. AutoGen uses conversation-based coordination which can be harder to control deterministically.
- **Deterministic execution** — Task dependency graphs with topological sorting ensure predictable execution order. AutoGen's conversation flow depends on agent responses.
- **Provider flexibility** — Easy provider swapping with `setLLMProvider()`. AutoGen is primarily designed around OpenAI's API.
- **Lightweight runtime** — Event-driven with minimal overhead. AutoGen's conversation management adds more runtime complexity.

### Where AutoGen excels

- **Conversational multi-agent patterns** — AutoGen's GroupChat and agent-to-agent messaging model excels at collaborative problem-solving where agents need to discuss, debate, and refine solutions.
- **Human-in-the-loop** — First-class support for `UserProxyAgent` that allows human intervention at any point in the conversation.
- **Code execution** — Built-in sandboxed code execution environment for agents that write and run code.
- **Research backing** — Developed by Microsoft Research with academic papers validating the approach.
- **AutoGen Studio** — Visual interface for building and testing multi-agent workflows.

### Code comparison

**AutoGen (Python):**

```python
from autogen import AssistantAgent, UserProxyAgent

assistant = AssistantAgent(
    name="researcher",
    system_message="You are a research analyst. Find key insights about AI trends.",
    llm_config={"model": "gpt-4o"},
)

user_proxy = UserProxyAgent(
    name="user",
    human_input_mode="NEVER",
    code_execution_config={"work_dir": "output"},
)

user_proxy.initiate_chat(assistant, message="Research the latest AI trends")
```

**Crewspace (TypeScript):**

```typescript
import { Agent, Crew, createOpenAIProvider } from '@crewspace/core';

const researcher = new Agent({
  id: 'researcher',
  role: 'Research Analyst',
  goal: 'Find key insights about AI trends',
});
researcher.setLLMProvider(createOpenAIProvider({ modelId: 'gpt-4o', apiKey: process.env.OPENAI_API_KEY! }));

const crew = new Crew({
  id: 'research-team',
  agents: [researcher],
  tasks: [{ id: 'research', description: 'Research the latest AI trends', agentId: 'researcher' }],
});
const result = await crew.run();
```

### When to choose

- **Choose Crewspace** if you want task-oriented orchestration with deterministic execution, TypeScript type safety, and a lightweight runtime.
- **Choose AutoGen** if you need conversational multi-agent patterns, human-in-the-loop workflows, or built-in code execution capabilities.

---

## Architecture Comparison

### Execution model

| Framework | Model | Description |
|-----------|-------|-------------|
| **Crewspace** | Task graph | DAG-based task scheduling with topological sort. Supports sequential and parallel strategies with configurable concurrency. |
| **CrewAI** | Process-based | Sequential (tasks run in order) or hierarchical (manager delegates). |
| **LangChain** | Chain/Runnable | Composable chain of operations. Agents use a ReAct loop within an AgentExecutor. |
| **AutoGen** | Conversation | Agents communicate via messages. GroupChat manages turn-taking and termination. |

### Error handling

| Framework | Approach |
|-----------|----------|
| **Crewspace** | Typed error hierarchy (`AgentConfigError`, `TaskTimeoutError`, etc.), `fail-fast` or `continue` policies at the engine level, per-task retry with backoff. |
| **CrewAI** | Try/catch with generic exceptions. Some retry support via LiteLLM. |
| **LangChain** | Callback-based error handling. Retry via custom middleware. |
| **AutoGen** | Conversation-level error handling. Agents can self-correct through dialogue. |

### Observability

| Framework | Approach |
|-----------|----------|
| **Crewspace** | Typed EventEmitter events for every lifecycle stage. Usage tracking decorator for LLM costs. |
| **CrewAI** | Callback functions. Optional integration with third-party observability tools. |
| **LangChain** | LangSmith tracing platform. Extensive callback system with `CallbackHandler` interface. |
| **AutoGen** | Logging-based. AutoGen Studio provides a visual trace view. |

---

## Decision Matrix

Use this matrix to quickly identify the best framework for your use case:

| Use Case | Recommended | Why |
|----------|-------------|-----|
| TypeScript/Node.js backend | **Crewspace** | Native TypeScript with full type safety |
| Python data science pipeline | **CrewAI** or **LangChain** | Python ecosystem, data tool integrations |
| RAG application | **LangChain** | Best-in-class retrieval and document processing |
| Conversational AI agents | **AutoGen** | Purpose-built for multi-turn agent dialogue |
| Deterministic task workflows | **Crewspace** | DAG-based execution with dependency resolution |
| Rapid prototyping (Python) | **CrewAI** | Minimal boilerplate, quick setup |
| Enterprise observability | **LangChain** | LangSmith platform for monitoring and evaluation |
| Human-in-the-loop workflows | **AutoGen** | First-class UserProxyAgent support |
| Microservice architecture | **Crewspace** | Lightweight, minimal dependencies, fast startup |
| Complex chain composition | **LangChain** | LCEL provides powerful declarative composition |

---

## Summary

Every framework has its strengths. Crewspace is purpose-built for **TypeScript teams** who want **type-safe, lightweight, and deterministic** multi-agent orchestration. If your stack is TypeScript/Node.js and you value compile-time safety, explicit task dependencies, and a minimal runtime, Crewspace is designed for you.

If you need Python ecosystem integrations, RAG, conversational agent patterns, or a broader set of pre-built tools, CrewAI, LangChain, or AutoGen may be a better fit.

::: tip Trying Crewspace?
Get started in under 5 minutes with our [Getting Started guide](/getting-started). Crewspace is free, open-source, and MIT-licensed.
:::
