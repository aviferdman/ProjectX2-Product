/**
 * Unit tests for cross-framework comparison workflow implementations.
 *
 * Tests validate that all three framework implementations (Crewspace,
 * LangChain.js shim, CrewAI shim) produce correct and structurally
 * equivalent results for the canonical "Research Assistant" workflow.
 *
 * @packageDocumentation
 */

import { describe, it, expect } from 'vitest';

import { CrewspaceWorkflowRunner } from '../../benchmarks/comparison/crewspace-workflow.js';
import { LangChainWorkflowRunner } from '../../benchmarks/comparison/langchain-workflow.js';
import { CrewAIWorkflowRunner } from '../../benchmarks/comparison/crewai-workflow.js';
import {
  ALL_AGENTS,
  ALL_TASKS,
  MOCK_RESPONSES,
  RESEARCHER_SPEC,
  ANALYST_SPEC,
  WRITER_SPEC,
  SEARCH_TASK,
  ANALYZE_TASK,
  REPORT_TASK,
} from '../../benchmarks/comparison/workflow-spec.js';
import type {
  ComparisonWorkflowRunner,
  WorkflowResult,
} from '../../benchmarks/comparison/workflow-spec.js';

// LangChain shim
import {
  LCChatModel,
  LCTool,
  LCAgentExecutor,
  LCRunnableSequence,
} from '../../benchmarks/comparison/langchain-shim.js';

// CrewAI shim
import {
  CAAgent,
  CACrew,
  CALLM,
  CAProcess,
  CATask,
  CATool,
} from '../../benchmarks/comparison/crewai-shim.js';

// ---------------------------------------------------------------------------
// Workflow spec tests
// ---------------------------------------------------------------------------

describe('Workflow Specification', () => {
  it('should define three agent specs', () => {
    expect(ALL_AGENTS).toHaveLength(3);
    expect(ALL_AGENTS[0]).toBe(RESEARCHER_SPEC);
    expect(ALL_AGENTS[1]).toBe(ANALYST_SPEC);
    expect(ALL_AGENTS[2]).toBe(WRITER_SPEC);
  });

  it('should define three task specs with correct dependencies', () => {
    expect(ALL_TASKS).toHaveLength(3);
    expect(ALL_TASKS[0]).toBe(SEARCH_TASK);
    expect(ALL_TASKS[1]).toBe(ANALYZE_TASK);
    expect(ALL_TASKS[2]).toBe(REPORT_TASK);

    expect(SEARCH_TASK.dependencies).toEqual([]);
    expect(ANALYZE_TASK.dependencies).toEqual(['search']);
    expect(REPORT_TASK.dependencies).toEqual(['analyze']);
  });

  it('should have mock responses for all tasks', () => {
    expect(MOCK_RESPONSES['search']).toBeDefined();
    expect(MOCK_RESPONSES['analyze']).toBeDefined();
    expect(MOCK_RESPONSES['write-report']).toBeDefined();
  });

  it('should have consistent agent-task mapping', () => {
    expect(SEARCH_TASK.agentId).toBe(RESEARCHER_SPEC.id);
    expect(ANALYZE_TASK.agentId).toBe(ANALYST_SPEC.id);
    expect(REPORT_TASK.agentId).toBe(WRITER_SPEC.id);
  });
});

// ---------------------------------------------------------------------------
// LangChain shim unit tests
// ---------------------------------------------------------------------------

describe('LangChain.js Shim', () => {
  describe('LCChatModel', () => {
    it('should invoke the model and return a result', async () => {
      const model = new LCChatModel('test-model', async (messages) => ({
        content: `Response to ${String(messages.length)} messages`,
        tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      }));

      const result = await model.invoke([{ role: 'human', content: 'Hello' }]);
      expect(result.content).toBe('Response to 1 messages');
      expect(result.tokenUsage.totalTokens).toBe(30);
    });
  });

  describe('LCTool', () => {
    it('should execute and return a string result', async () => {
      const tool = new LCTool({
        name: 'test-tool',
        description: 'A test tool',
        async func(input) {
          return `Result: ${String(input['query'])}`;
        },
      });

      expect(tool.name).toBe('test-tool');
      const result = await tool.call({ query: 'hello' });
      expect(result).toBe('Result: hello');
    });
  });

  describe('LCAgentExecutor', () => {
    it('should format system prompt with tools and invoke model', async () => {
      let capturedMessages: readonly import('../../benchmarks/comparison/langchain-shim.js').LCMessage[] = [];
      const model = new LCChatModel('test', async (messages) => {
        capturedMessages = messages;
        return {
          content: 'Agent response',
          tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        };
      });

      const tool = new LCTool({
        name: 'search',
        description: 'Search tool',
        async func() { return 'result'; },
      });

      const executor = new LCAgentExecutor({
        name: 'test-agent',
        model,
        tools: [tool],
        systemPrompt: 'You are a test agent.',
      });

      const result = await executor.invoke('Do something');
      expect(result.output).toBe('Agent response');
      expect(capturedMessages.length).toBe(2); // system + human
      expect(capturedMessages[0]!.role).toBe('system');
      expect(capturedMessages[0]!.content).toContain('search: Search tool');
      expect(capturedMessages[1]!.role).toBe('human');
    });

    it('should include context as a prior message when provided', async () => {
      let messageCount = 0;
      const model = new LCChatModel('test', async (messages) => {
        messageCount = messages.length;
        return {
          content: 'response',
          tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        };
      });

      const executor = new LCAgentExecutor({
        name: 'test',
        model,
        tools: [],
        systemPrompt: 'Agent',
      });

      await executor.invoke('task', 'prior context');
      expect(messageCount).toBe(3); // system + context + human
    });
  });

  describe('LCRunnableSequence', () => {
    it('should run steps in sequence and pass output as context', async () => {
      const invokedOrder: string[] = [];
      const contextReceived: (string | undefined)[] = [];

      function makeModel(name: string): LCChatModel {
        return new LCChatModel(name, async (messages) => {
          invokedOrder.push(name);
          const contextMsg = messages.find((m) => m.content.includes('Context from previous'));
          contextReceived.push(contextMsg?.content);
          return {
            content: `Output from ${name}`,
            tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
          };
        });
      }

      const sequence = new LCRunnableSequence()
        .addStep({
          name: 'step1',
          executor: new LCAgentExecutor({
            name: 'exec1',
            model: makeModel('model1'),
            tools: [],
            systemPrompt: 'Agent 1',
          }),
          input: 'First task',
        })
        .addStep({
          name: 'step2',
          executor: new LCAgentExecutor({
            name: 'exec2',
            model: makeModel('model2'),
            tools: [],
            systemPrompt: 'Agent 2',
          }),
          input: 'Second task',
        });

      const result = await sequence.invoke();
      expect(invokedOrder).toEqual(['model1', 'model2']);
      expect(result.outputs.size).toBe(2);
      expect(result.outputs.get('step1')!.output).toBe('Output from model1');
      expect(result.outputs.get('step2')!.output).toBe('Output from model2');
      expect(result.totalDurationMs).toBeGreaterThan(0);
      // Step 2 should have received context from step 1
      expect(contextReceived[1]).toContain('Output from model1');
    });
  });
});

// ---------------------------------------------------------------------------
// CrewAI shim unit tests
// ---------------------------------------------------------------------------

describe('CrewAI Shim', () => {
  describe('CALLM', () => {
    it('should call the invoker and return a response', async () => {
      const llm = new CALLM('test-model', async (prompt) => ({
        content: `Response to: ${prompt.slice(0, 20)}`,
        tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      }));

      const result = await llm.call('Hello world');
      expect(result.content).toBe('Response to: Hello world');
    });
  });

  describe('CATool', () => {
    it('should run and return output', async () => {
      const tool = new CATool({
        name: 'test',
        description: 'Test tool',
        async func(input) { return `Result: ${input}`; },
      });

      expect(tool.name).toBe('test');
      const result = await tool.run('hello');
      expect(result).toBe('Result: hello');
    });
  });

  describe('CAAgent', () => {
    it('should execute with a built prompt including role and tools', async () => {
      let capturedPrompt = '';
      const llm = new CALLM('test', async (prompt) => {
        capturedPrompt = prompt;
        return {
          content: 'Agent output',
          tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        };
      });

      const tool = new CATool({
        name: 'search',
        description: 'Search tool',
        async func() { return 'found'; },
      });

      const agent = new CAAgent({
        role: 'Researcher',
        goal: 'Find information',
        backstory: 'Expert researcher',
        tools: [tool],
        llm,
      });

      const result = await agent.execute('Find AI trends');
      expect(result.content).toBe('Agent output');
      expect(capturedPrompt).toContain('Researcher');
      expect(capturedPrompt).toContain('Find information');
      expect(capturedPrompt).toContain('search: Search tool');
      expect(capturedPrompt).toContain('Find AI trends');
    });

    it('should include context when provided', async () => {
      let capturedPrompt = '';
      const llm = new CALLM('test', async (prompt) => {
        capturedPrompt = prompt;
        return {
          content: 'output',
          tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        };
      });

      const agent = new CAAgent({
        role: 'Writer',
        goal: 'Write reports',
        backstory: 'Expert writer',
        llm,
      });

      await agent.execute('Write report', 'Previous analysis results');
      expect(capturedPrompt).toContain('Previous analysis results');
    });
  });

  describe('CATask', () => {
    it('should store configuration and allow result assignment', () => {
      const llm = new CALLM('test', async () => ({
        content: '',
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      }));

      const agent = new CAAgent({ role: 'Test', goal: 'Test', backstory: '', llm });
      const task = new CATask({
        description: 'Test task',
        expectedOutput: 'Test output',
        agent,
      });

      expect(task.description).toBe('Test task');
      expect(task.expectedOutput).toBe('Test output');
      expect(task.agent).toBe(agent);
      expect(task.contextTasks).toEqual([]);
      expect(task.result).toBeUndefined();
    });
  });

  describe('CACrew', () => {
    it('should kickoff sequential tasks and pass context', async () => {
      const outputs: string[] = [];
      const llm = new CALLM('test', async (prompt) => {
        const output = prompt.includes('Context from previous')
          ? `Analysis of: ${prompt.slice(prompt.indexOf('Context from previous'))}`
          : 'Initial research results';
        outputs.push(output);
        return {
          content: output,
          tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        };
      });

      const agent1 = new CAAgent({ role: 'Researcher', goal: 'Research', backstory: '', llm });
      const agent2 = new CAAgent({ role: 'Analyst', goal: 'Analyze', backstory: '', llm });

      const task1 = new CATask({
        description: 'Research topic',
        expectedOutput: 'Research',
        agent: agent1,
      });
      const task2 = new CATask({
        description: 'Analyze findings',
        expectedOutput: 'Analysis',
        agent: agent2,
        context: [task1],
      });

      const crew = new CACrew({
        agents: [agent1, agent2],
        tasks: [task1, task2],
        process: CAProcess.SEQUENTIAL,
      });

      const result = await crew.kickoff();
      expect(result.taskResults).toHaveLength(2);
      expect(result.totalDurationMs).toBeGreaterThan(0);
      // Task 2 should have received context from task 1
      expect(task1.result).toBeDefined();
      expect(task2.result).toBeDefined();
    });

    it('should default to sequential process', () => {
      const llm = new CALLM('test', async () => ({
        content: '',
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      }));
      const agent = new CAAgent({ role: 'Test', goal: '', backstory: '', llm });
      const task = new CATask({ description: '', expectedOutput: '', agent });

      const crew = new CACrew({ agents: [agent], tasks: [task] });
      expect(crew.process).toBe(CAProcess.SEQUENTIAL);
    });
  });
});

// ---------------------------------------------------------------------------
// Cross-framework workflow runner tests
// ---------------------------------------------------------------------------

describe('Comparison Workflow Runners', () => {
  const runners: [string, ComparisonWorkflowRunner][] = [
    ['Crewspace', new CrewspaceWorkflowRunner()],
    ['LangChain.js', new LangChainWorkflowRunner()],
    ['CrewAI', new CrewAIWorkflowRunner()],
  ];

  for (const [name, runner] of runners) {
    describe(name, () => {
      it('should report the correct framework name', () => {
        expect(runner.framework).toBeTruthy();
      });

      it('should complete the workflow successfully', async () => {
        const result = await runner.run();
        expect(result.success).toBe(true);
      });

      it('should produce results for all three tasks', async () => {
        const result = await runner.run();
        expect(result.taskResults).toHaveLength(3);
      });

      it('should have positive total duration', async () => {
        const result = await runner.run();
        expect(result.totalDurationMs).toBeGreaterThan(0);
      });

      it('should produce non-empty output for each task', async () => {
        const result = await runner.run();
        for (const tr of result.taskResults) {
          expect(tr.output.length).toBeGreaterThan(0);
        }
      });

      it('should produce results with correct task IDs', async () => {
        const result = await runner.run();
        const taskIds = result.taskResults.map((tr) => tr.taskId);
        expect(taskIds).toEqual(['search', 'analyze', 'write-report']);
      });

      it('should produce results with correct agent IDs', async () => {
        const result = await runner.run();
        const agentIds = result.taskResults.map((tr) => tr.agentId);
        expect(agentIds).toEqual(['researcher', 'analyst', 'writer']);
      });
    });
  }

  describe('Output Equivalence', () => {
    it('should produce structurally equivalent results across all frameworks', async () => {
      const results: WorkflowResult[] = [];
      for (const [, runner] of runners) {
        results.push(await runner.run());
      }

      // All should succeed with 3 tasks
      for (const r of results) {
        expect(r.success).toBe(true);
        expect(r.taskResults).toHaveLength(3);
      }

      // Task IDs should be identical across frameworks
      const baseTaskIds = results[0]!.taskResults.map((tr) => tr.taskId);
      for (const r of results.slice(1)) {
        expect(r.taskResults.map((tr) => tr.taskId)).toEqual(baseTaskIds);
      }

      // Agent IDs should be identical across frameworks
      const baseAgentIds = results[0]!.taskResults.map((tr) => tr.agentId);
      for (const r of results.slice(1)) {
        expect(r.taskResults.map((tr) => tr.agentId)).toEqual(baseAgentIds);
      }
    });
  });
});
