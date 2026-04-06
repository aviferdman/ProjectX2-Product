/**
 * @crewspace/core — TypeScript-native agent orchestration framework
 *
 * @packageDocumentation
 */

export const VERSION = '0.1.0';

// Agent
export { Agent } from './agent/index.js';

// Crew
export { Crew } from './crew/index.js';

// Task
export { Task } from './task/index.js';

// Execution Engine
export { ExecutionEngine } from './engine/index.js';
export { EngineStatus, ExecutionStrategy } from './engine/index.js';
export type {
  AfterTaskHook,
  BeforeTaskHook,
  EngineEventMap,
  EngineRunResult,
  ExecutionEngineConfig,
  OnTaskErrorHook,
  TaskErrorPolicy,
} from './engine/index.js';

// LLM Provider
export {
  BaseLLMProvider,
  DefaultLLMStreamResponse,
  isStreamingProvider,
  LLMMessageSchema,
  LLMMessagesSchema,
  LLMModelInfoSchema,
  LLMProviderConfigSchema,
  LLMProviderRegistry,
  LLMRequestOptionsSchema,
  ModelCatalog,
  validateLLMMessages,
  validateLLMProviderConfig,
} from './llm/index.js';

// Types
export { AgentStatus, CrewStatus, LLMRole, TaskPriority, TaskStatus } from './types/index.js';
export type {
  AgentConfig,
  AgentEventMap,
  CrewConfig,
  CrewEventMap,
  CrewRunResult,
  CrewTask,
  LLMMessage,
  LLMModelInfo,
  LLMProvider,
  LLMProviderConfig,
  LLMProviderFactory,
  LLMRequestOptions,
  LLMResponse,
  LLMStreamChunk,
  LLMStreamResponse,
  StreamingLLMProvider,
  TaskConfig,
  TaskEventMap,
  TaskInput,
  TaskResult,
  TokenUsage,
  Tool,
} from './types/index.js';

// Errors
export { AgentConfigError, AgentExecutionError } from './errors/index.js';
export { CrewConfigError, CrewExecutionError } from './errors/index.js';
export { EngineConfigError, EngineExecutionError } from './errors/index.js';
export {
  LLMAuthenticationError,
  LLMContextLengthError,
  LLMProviderError,
  LLMRateLimitError,
  LLMStreamError,
} from './errors/index.js';
export { TaskConfigError, TaskExecutionError, TaskTimeoutError } from './errors/index.js';
