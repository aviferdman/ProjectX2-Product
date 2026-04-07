/**
 * Custom error classes for memory operations.
 *
 * @packageDocumentation
 */

import { CrewspaceError, ErrorCode } from './base.js';

/** Thrown when memory configuration is invalid. */
export class MemoryConfigError extends CrewspaceError {
  public readonly provider: string | undefined;

  constructor(message: string, provider?: string) {
    super(
      provider ? `Memory provider "${provider}": ${message}` : message,
      ErrorCode.MEMORY_CONFIG,
    );
    this.name = 'MemoryConfigError';
    this.provider = provider;
  }

  protected override getDetails(): Record<string, unknown> {
    return { provider: this.provider };
  }
}

/** Thrown when a memory read/write/delete operation fails. */
export class MemoryOperationError extends CrewspaceError {
  public readonly provider: string;
  public readonly operation: string;

  constructor(provider: string, operation: string, message: string, cause?: Error) {
    super(`Memory "${provider}" ${operation} failed: ${message}`, ErrorCode.MEMORY_OPERATION, {
      cause,
    });
    this.name = 'MemoryOperationError';
    this.provider = provider;
    this.operation = operation;
  }

  protected override getDetails(): Record<string, unknown> {
    return { provider: this.provider, operation: this.operation };
  }
}

/** Thrown when a memory query/search is invalid. */
export class MemoryQueryError extends CrewspaceError {
  public readonly provider: string;

  constructor(provider: string, message: string) {
    super(`Memory "${provider}" query error: ${message}`, ErrorCode.MEMORY_QUERY);
    this.name = 'MemoryQueryError';
    this.provider = provider;
  }

  protected override getDetails(): Record<string, unknown> {
    return { provider: this.provider };
  }
}
