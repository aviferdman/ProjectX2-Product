/**
 * Error classes for the Crewspace framework.
 *
 * @packageDocumentation
 */

export { AgentConfigError, AgentExecutionError } from "./agent-errors.js";
export { CrewConfigError, CrewExecutionError } from "./crew-errors.js";
export { EngineConfigError, EngineExecutionError } from "./engine-errors.js";
export {
  LLMAuthenticationError,
  LLMContextLengthError,
  LLMProviderError,
  LLMRateLimitError,
  LLMStreamError,
} from "./llm-errors.js";
export {
  TaskConfigError,
  TaskExecutionError,
  TaskTimeoutError,
} from "./task-errors.js";
export {
  ToolConfigError,
  ToolExecutionError,
  ToolNotFoundError,
  ToolPermissionError,
  ToolTimeoutError,
} from "./tool-errors.js";
