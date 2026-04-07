/**
 * Custom error classes for agent operations.
 *
 * @packageDocumentation
 */

import { CrewspaceError, ErrorCode } from './base.js';

/** Thrown when agent configuration is invalid. */
export class AgentConfigError extends CrewspaceError {
  public readonly agentId: string | undefined;

  constructor(message: string, agentId?: string) {
    super(
      agentId ? `Agent "${agentId}": ${message}` : message,
      ErrorCode.AGENT_CONFIG,
    );
    this.name = 'AgentConfigError';
    this.agentId = agentId;
  }

  protected override getDetails(): Record<string, unknown> {
    return { agentId: this.agentId };
  }
}

/** Thrown when agent task execution fails. */
export class AgentExecutionError extends CrewspaceError {
  public readonly agentId: string;

  constructor(agentId: string, message: string, cause?: Error) {
    super(
      `Agent "${agentId}" execution failed: ${message}`,
      ErrorCode.AGENT_EXECUTION,
      { cause },
    );
    this.name = 'AgentExecutionError';
    this.agentId = agentId;
  }

  protected override getDetails(): Record<string, unknown> {
    return { agentId: this.agentId };
  }
}
