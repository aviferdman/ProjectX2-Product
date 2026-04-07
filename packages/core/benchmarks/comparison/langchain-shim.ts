/**
 * LangChain.js API shim for comparison benchmarks.
 *
 * Provides lightweight implementations of key LangChain.js abstractions
 * (ChatModel, AgentExecutor, RunnableSequence) that mirror the real API
 * surface and execution overhead without requiring the actual dependency.
 *
 * The shim models LangChain.js v0.3+ patterns:
 * - `BaseChatModel` for LLM interaction
 * - `DynamicStructuredTool` for tool definitions
 * - `AgentExecutor` for tool-augmented agent loops
 * - `RunnableSequence` for chaining executors
 *
 * This enables apples-to-apples performance comparison of framework overhead,
 * isolating orchestration cost from LLM latency (which is mocked identically).
 *
 * @packageDocumentation
 */

// ---------------------------------------------------------------------------
// Message types (mirrors LangChain BaseMessage)
// ---------------------------------------------------------------------------

export interface LCMessage {
  readonly role: 'system' | 'human' | 'ai' | 'tool';
  readonly content: string;
  readonly name?: string;
}

export interface LCTokenUsage {
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
}

export interface LCChatResult {
  readonly content: string;
  readonly tokenUsage: LCTokenUsage;
}

// ---------------------------------------------------------------------------
// BaseChatModel shim
// ---------------------------------------------------------------------------

export type LCModelInvoker = (messages: readonly LCMessage[]) => Promise<LCChatResult>;

export class LCChatModel {
  readonly modelName: string;
  private readonly _invoke: LCModelInvoker;

  constructor(modelName: string, invoke: LCModelInvoker) {
    this.modelName = modelName;
    this._invoke = invoke;
  }

  async invoke(messages: readonly LCMessage[]): Promise<LCChatResult> {
    return this._invoke(messages);
  }
}

// ---------------------------------------------------------------------------
// Tool shim (mirrors DynamicStructuredTool)
// ---------------------------------------------------------------------------

export interface LCToolConfig {
  readonly name: string;
  readonly description: string;
  readonly func: (input: Record<string, unknown>) => Promise<string>;
}

export class LCTool {
  readonly name: string;
  readonly description: string;
  private readonly _func: (input: Record<string, unknown>) => Promise<string>;

  constructor(config: LCToolConfig) {
    this.name = config.name;
    this.description = config.description;
    this._func = config.func;
  }

  async call(input: Record<string, unknown>): Promise<string> {
    return this._func(input);
  }
}

// ---------------------------------------------------------------------------
// AgentExecutor shim
// ---------------------------------------------------------------------------

export interface LCAgentExecutorConfig {
  readonly name: string;
  readonly model: LCChatModel;
  readonly tools: readonly LCTool[];
  readonly systemPrompt: string;
}

export interface LCAgentResult {
  readonly output: string;
  readonly tokenUsage: LCTokenUsage;
}

/**
 * Simplified AgentExecutor that mirrors LangChain's ReAct agent loop.
 *
 * In LangChain.js, the AgentExecutor:
 * 1. Formats the prompt with system instructions + user input
 * 2. Calls the LLM
 * 3. Parses tool calls (skipped here — mock LLM returns final answers directly)
 * 4. Returns the result
 *
 * The overhead here models prompt construction, message formatting,
 * tool list serialization, and output parsing — all present in real LangChain.
 */
export class LCAgentExecutor {
  readonly name: string;
  private readonly _model: LCChatModel;
  private readonly _tools: readonly LCTool[];
  private readonly _systemPrompt: string;

  constructor(config: LCAgentExecutorConfig) {
    this.name = config.name;
    this._model = config.model;
    this._tools = config.tools;
    this._systemPrompt = config.systemPrompt;
  }

  async invoke(input: string, context?: string): Promise<LCAgentResult> {
    // Build message array (mirrors LangChain prompt template formatting)
    const messages: LCMessage[] = [
      { role: 'system', content: this._buildSystemMessage() },
    ];

    if (context) {
      messages.push({ role: 'human', content: `Context from previous steps:\n${context}` });
    }

    messages.push({ role: 'human', content: input });

    const result = await this._model.invoke(messages);
    return { output: result.content, tokenUsage: result.tokenUsage };
  }

  private _buildSystemMessage(): string {
    // LangChain serializes available tools into the system prompt
    const toolDescriptions = this._tools
      .map((t) => `- ${t.name}: ${t.description}`)
      .join('\n');

    return (
      `${this._systemPrompt}\n\n` +
      `You have access to the following tools:\n${toolDescriptions}\n\n` +
      'Use the tools when needed to complete the task.'
    );
  }
}

// ---------------------------------------------------------------------------
// RunnableSequence shim (sequential chain)
// ---------------------------------------------------------------------------

export interface LCRunnableStep {
  readonly name: string;
  readonly executor: LCAgentExecutor;
  readonly input: string;
}

export interface LCSequenceResult {
  readonly outputs: ReadonlyMap<string, LCAgentResult>;
  readonly totalDurationMs: number;
}

/**
 * RunnableSequence models LangChain's LCEL pipe() chaining.
 *
 * Steps execute in order; each step's output is passed as context
 * to the next step, mirroring RunnablePassthrough behavior.
 */
export class LCRunnableSequence {
  private readonly _steps: LCRunnableStep[] = [];

  addStep(step: LCRunnableStep): this {
    this._steps.push(step);
    return this;
  }

  async invoke(): Promise<LCSequenceResult> {
    const start = performance.now();
    const outputs = new Map<string, LCAgentResult>();
    let previousOutput = '';

    for (const step of this._steps) {
      const context = previousOutput || undefined;
      const result = await step.executor.invoke(step.input, context);
      outputs.set(step.name, result);
      previousOutput = result.output;
    }

    return {
      outputs,
      totalDurationMs: performance.now() - start,
    };
  }
}
