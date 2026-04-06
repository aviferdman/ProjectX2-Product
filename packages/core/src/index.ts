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
  AnthropicProvider,
  BaseLLMProvider,
  buildRetryConfig,
  calculateDelay,
  CircuitBreaker,
  CircuitState,
  createAnthropicProvider,
  createOpenAIProvider,
  createRetryProvider,
  createUsageTrackingProvider,
  DefaultLLMStreamResponse,
  isRetryableError,
  isStreamingProvider,
  LLMMessageSchema,
  LLMMessagesSchema,
  LLMModelInfoSchema,
  LLMProviderConfigSchema,
  LLMProviderRegistry,
  LLMRequestOptionsSchema,
  ModelCatalog,
  OpenAIProvider,
  RetryLLMProvider,
  TokenUsageTracker,
  UsageTrackingProvider,
  validateLLMMessages,
  validateLLMProviderConfig,
  withRetry,
} from './llm/index.js';
export type {
  CircuitBreakerConfig,
  CircuitBreakerSnapshot,
  OnRetryCallback,
  RetryConfig,
  RetryContext,
  RetryLLMProviderOptions,
  RetryStats,
  UsageRecord,
  UsageRecordInput,
  UsageReport,
  UsageSummary,
  UsageTrackingProviderOptions,
  UsageTrackingProviderResult,
} from './llm/index.js';

// Types
export { AgentStatus, CrewStatus, LLMRole, TaskPriority, TaskStatus, ToolCategory, ToolPermission } from './types/index.js';
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
  ToolEventMap,
  ToolParameterSchema,
  ToolPermissionPolicy,
  ToolResult,
} from './types/index.js';

// Tool System
export {
  ALLOW_ALL_POLICY,
  DENY_ALL_POLICY,
  isValidTool,
  PermissionManager,
  ToolConfigSchema,
  ToolExecutor,
  ToolParameterSchemaSchema,
  ToolPermissionPolicySchema,
  ToolRegistry,
  validateToolConfig,
  validateToolPermissionPolicy,
} from './tool/index.js';

// Built-in Tools
export {
  createFileTools,
  createListFilesTool,
  createReadFileTool,
  createWriteFileTool,
  DEFAULT_MAX_ENTRIES,
  HARD_MAX_ENTRIES,
  matchesPattern,
  MAX_READ_SIZE,
  MAX_WRITE_SIZE,
} from './tools/index.js';
export type {
  FileEntry,
  FileTools,
  FileToolsOptions,
  ListFilesInput,
  ListFilesOutput,
  ReadFileInput,
  ReadFileOutput,
  WriteFileInput,
  WriteFileOutput,
} from './tools/index.js';

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
export {
  ToolConfigError,
  ToolExecutionError,
  ToolNotFoundError,
  ToolPermissionError,
  ToolTimeoutError,
} from './errors/index.js';
