/**
 * Custom error classes for agent operations.
 *
 * @packageDocumentation
 */

/** Thrown when agent configuration is invalid. */
export class AgentConfigError extends Error {
  public readonly agentId: string | undefined;

  constructor(message: string, agentId?: string) {
    super(agentId ? `Agent "${agentId}": ${message}` : message);
    this.name = 'AgentConfigError';
    this.agentId = agentId;
  }
}

/** Thrown when agent task execution fails. */
export class AgentExecutionError extends Error {
  public readonly agentId: string;
  public override readonly cause: Error | undefined;

  constructor(agentId: string, message: string, cause?: Error) {
    super(`Agent "${agentId}" execution failed: ${message}`);
    this.name = 'AgentExecutionError';
    this.agentId = agentId;
    this.cause = cause;
  }
}
