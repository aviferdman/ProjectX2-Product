/**
 * Custom error classes for memory operations.
 *
 * @packageDocumentation
 */

/** Thrown when memory configuration is invalid. */
export class MemoryConfigError extends Error {
  public readonly provider: string | undefined;

  constructor(message: string, provider?: string) {
    super(provider ? `Memory provider "${provider}": ${message}` : message);
    this.name = 'MemoryConfigError';
    this.provider = provider;
  }
}

/** Thrown when a memory read/write/delete operation fails. */
export class MemoryOperationError extends Error {
  public readonly provider: string;
  public readonly operation: string;
  public override readonly cause: Error | undefined;

  constructor(provider: string, operation: string, message: string, cause?: Error) {
    super(`Memory "${provider}" ${operation} failed: ${message}`);
    this.name = 'MemoryOperationError';
    this.provider = provider;
    this.operation = operation;
    this.cause = cause;
  }
}

/** Thrown when a memory query/search is invalid. */
export class MemoryQueryError extends Error {
  public readonly provider: string;

  constructor(provider: string, message: string) {
    super(`Memory "${provider}" query error: ${message}`);
    this.name = 'MemoryQueryError';
    this.provider = provider;
  }
}
