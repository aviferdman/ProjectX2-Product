/**
 * Tool interface for agent capabilities.
 *
 * Tools extend an agent's abilities beyond LLM text generation — file I/O,
 * web requests, shell execution, or any custom operation.
 *
 * @packageDocumentation
 */

/**
 * A tool that an agent can invoke during task execution.
 *
 * @example
 * ```typescript
 * const readFile: Tool = {
 *   name: 'readFile',
 *   description: 'Read the contents of a file from disk',
 *   async execute(input) {
 *     const { path } = input as { path: string };
 *     return fs.promises.readFile(path, 'utf-8');
 *   },
 * };
 * ```
 */
export interface Tool {
  /** Unique tool name used for identification and LLM function calling. */
  readonly name: string;

  /** Human-readable description of what the tool does. */
  readonly description: string;

  /**
   * Execute the tool with the given input.
   *
   * @param input - Tool-specific input (validated by the caller)
   * @returns The tool's output
   * @throws If the tool execution fails
   */
  execute(input: unknown): Promise<unknown>;
}
