/**
 * CrewAI API shim for comparison benchmarks.
 *
 * Provides lightweight TypeScript implementations of CrewAI's core
 * abstractions (Agent, Task, Crew, Process) that mirror the real
 * Python API surface and execution patterns.
 *
 * CrewAI (Python) patterns modeled:
 * - `Agent(role, goal, backstory, tools, llm)` class
 * - `Task(description, expected_output, agent)` class
 * - `Crew(agents, tasks, process)` orchestrator
 * - `Process.sequential` execution mode
 *
 * The shim replicates CrewAI's task execution loop: for each task,
 * build a prompt from the agent config + task description + prior
 * context, invoke the LLM, then store the result.
 *
 * @packageDocumentation
 */

// ---------------------------------------------------------------------------
// LLM abstraction (mirrors CrewAI's LLM wrapper)
// ---------------------------------------------------------------------------

export interface CALLMResponse {
  readonly content: string;
  readonly tokenUsage: {
    readonly promptTokens: number;
    readonly completionTokens: number;
    readonly totalTokens: number;
  };
}

export type CALLMInvoker = (prompt: string) => Promise<CALLMResponse>;

export class CALLM {
  readonly modelName: string;
  private readonly _invoke: CALLMInvoker;

  constructor(modelName: string, invoke: CALLMInvoker) {
    this.modelName = modelName;
    this._invoke = invoke;
  }

  async call(prompt: string): Promise<CALLMResponse> {
    return this._invoke(prompt);
  }
}

// ---------------------------------------------------------------------------
// Tool shim
// ---------------------------------------------------------------------------

export interface CAToolConfig {
  readonly name: string;
  readonly description: string;
  readonly func: (input: string) => Promise<string>;
}

export class CATool {
  readonly name: string;
  readonly description: string;
  private readonly _func: (input: string) => Promise<string>;

  constructor(config: CAToolConfig) {
    this.name = config.name;
    this.description = config.description;
    this._func = config.func;
  }

  async run(input: string): Promise<string> {
    return this._func(input);
  }
}

// ---------------------------------------------------------------------------
// Agent shim
// ---------------------------------------------------------------------------

export interface CAAgentConfig {
  readonly role: string;
  readonly goal: string;
  readonly backstory: string;
  readonly tools?: readonly CATool[];
  readonly llm: CALLM;
  readonly verbose?: boolean;
}

export class CAAgent {
  readonly role: string;
  readonly goal: string;
  readonly backstory: string;
  readonly tools: readonly CATool[];
  readonly llm: CALLM;

  constructor(config: CAAgentConfig) {
    this.role = config.role;
    this.goal = config.goal;
    this.backstory = config.backstory;
    this.tools = config.tools ?? [];
    this.llm = config.llm;
  }

  async execute(taskDescription: string, context?: string): Promise<CALLMResponse> {
    // CrewAI builds a role-play prompt from agent config + task + context
    const prompt = this._buildPrompt(taskDescription, context);
    return this.llm.call(prompt);
  }

  private _buildPrompt(taskDescription: string, context?: string): string {
    const toolList = this.tools.map((t) => `- ${t.name}: ${t.description}`).join('\n');

    let prompt =
      `You are a ${this.role}.\n` +
      `Your goal: ${this.goal}\n` +
      `Backstory: ${this.backstory}\n\n`;

    if (toolList) {
      prompt += `Available tools:\n${toolList}\n\n`;
    }

    if (context) {
      prompt += `Context from previous tasks:\n${context}\n\n`;
    }

    prompt += `Current task: ${taskDescription}`;
    return prompt;
  }
}

// ---------------------------------------------------------------------------
// Task shim
// ---------------------------------------------------------------------------

export interface CATaskConfig {
  readonly description: string;
  readonly expectedOutput: string;
  readonly agent: CAAgent;
  readonly context?: readonly CATask[];
}

export interface CATaskResult {
  readonly output: string;
  readonly agent: CAAgent;
  readonly durationMs: number;
}

export class CATask {
  readonly description: string;
  readonly expectedOutput: string;
  readonly agent: CAAgent;
  readonly contextTasks: readonly CATask[];
  result?: CATaskResult;

  constructor(config: CATaskConfig) {
    this.description = config.description;
    this.expectedOutput = config.expectedOutput;
    this.agent = config.agent;
    this.contextTasks = config.context ?? [];
  }
}

// ---------------------------------------------------------------------------
// Crew shim with Process enum
// ---------------------------------------------------------------------------

export enum CAProcess {
  SEQUENTIAL = 'sequential',
  HIERARCHICAL = 'hierarchical',
}

export interface CACrewConfig {
  readonly agents: readonly CAAgent[];
  readonly tasks: readonly CATask[];
  readonly process?: CAProcess;
  readonly verbose?: boolean;
}

export interface CACrewResult {
  readonly taskResults: readonly CATaskResult[];
  readonly totalDurationMs: number;
}

/**
 * CrewAI Crew shim — orchestrates sequential or hierarchical task execution.
 *
 * In sequential mode (default), tasks run in order. Each task receives
 * the concatenated outputs of its context tasks (if specified) or the
 * immediately preceding task's output.
 */
export class CACrew {
  readonly agents: readonly CAAgent[];
  readonly tasks: readonly CATask[];
  readonly process: CAProcess;

  constructor(config: CACrewConfig) {
    this.agents = config.agents;
    this.tasks = config.tasks;
    this.process = config.process ?? CAProcess.SEQUENTIAL;
  }

  async kickoff(): Promise<CACrewResult> {
    const start = performance.now();
    const taskResults: CATaskResult[] = [];

    if (this.process === CAProcess.SEQUENTIAL) {
      let previousOutput = '';

      for (const task of this.tasks) {
        const taskStart = performance.now();

        // Gather context from specified context tasks or previous output
        let context: string | undefined;
        if (task.contextTasks.length > 0) {
          context = task.contextTasks
            .filter((ct) => ct.result !== undefined)
            .map((ct) => ct.result!.output)
            .join('\n\n');
        } else if (previousOutput) {
          context = previousOutput;
        }

        const llmResult = await task.agent.execute(task.description, context);
        const durationMs = performance.now() - taskStart;

        const result: CATaskResult = {
          output: llmResult.content,
          agent: task.agent,
          durationMs,
        };

        task.result = result;
        taskResults.push(result);
        previousOutput = llmResult.content;
      }
    }

    return {
      taskResults,
      totalDurationMs: performance.now() - start,
    };
  }
}
