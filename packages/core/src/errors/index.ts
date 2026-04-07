/**
 * Error classes for the Crewspace framework.
 *
 * @packageDocumentation
 */

// Base & codes
export { CrewspaceError, ErrorCode } from './base.js';
export type { SerializedError } from './base.js';

// Utilities
export {
  AggregateCrewspaceError,
  formatErrorForLog,
  getErrorChain,
  hasErrorCode,
  isCrewspaceError,
  normalizeError,
} from './utils.js';
export type { FormattedError } from './utils.js';

// Domain errors
export { AgentConfigError, AgentExecutionError } from './agent-errors.js';
export { CrewConfigError, CrewExecutionError } from './crew-errors.js';
export { EngineConfigError, EngineExecutionError } from './engine-errors.js';
export {
  LLMAuthenticationError,
  LLMContextLengthError,
  LLMProviderError,
  LLMRateLimitError,
  LLMStreamError,
} from './llm-errors.js';
export {
  CircularDependencyError,
  TaskConfigError,
  TaskExecutionError,
  TaskTimeoutError,
} from './task-errors.js';
export type { DependencyCycle } from './task-errors.js';
export {
  ToolCompositionError,
  ToolConfigError,
  ToolExecutionError,
  ToolInputValidationError,
  ToolNotFoundError,
  ToolPermissionError,
  ToolTimeoutError,
} from './tool-errors.js';
export type { ToolValidationIssue } from './tool-errors.js';
export { MemoryConfigError, MemoryOperationError, MemoryQueryError } from './memory-errors.js';
