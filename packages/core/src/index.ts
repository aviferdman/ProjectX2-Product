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
export { getExecutionLevels, ParallelExecutor, topologicalSort } from './task/index.js';
export type {
  ExecutionLevel,
  ParallelErrorPolicy,
  ParallelExecutionResult,
  ParallelExecutorConfig,
  ParallelExecutorEventMap,
  TaskRunner,
} from './task/index.js';
export {
  getSchedulerExecutionLevels,
  resolveTaskDependencies,
  schedulerTopologicalSort,
} from './task/index.js';
export type { TopologicalSortResult } from './task/index.js';
export { TaskContextManager } from './task/index.js';
export type {
  ContextMergeStrategy,
  ContextTransformer,
  TaskContextManagerConfig,
} from './task/index.js';
export {
  calculateTaskRetryDelay,
  executeWithRetry,
  executeWithTimeout,
  TaskExecutionWrapper,
} from './task/index.js';
export type { TaskExecutionWrapperConfig, TaskRetryStats } from './task/index.js';
export { formatTaskDependencyTree, formatTaskList, formatTaskPlanTree } from './task/index.js';
export type { FormatTaskPlanOptions } from './task/index.js';

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
  createFallbackProvider,
  createOllamaProvider,
  createOpenAIProvider,
  createRetryProvider,
  createUsageTrackingProvider,
  DefaultLLMStreamResponse,
  FallbackLLMProvider,
  isRetryableError,
  isStreamingProvider,
  LLMMessageSchema,
  LLMMessagesSchema,
  LLMModelInfoSchema,
  LLMProviderConfigSchema,
  LLMProviderRegistry,
  LLMRequestOptionsSchema,
  ModelCatalog,
  OllamaProvider,
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
  FallbackContext,
  FallbackLLMProviderOptions,
  FallbackStats,
  OnFallbackCallback,
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
export {
  AgentStatus,
  CrewStatus,
  LLMRole,
  TaskPriority,
  TaskStatus,
  ToolCategory,
  ToolPermission,
} from './types/index.js';
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
  collectTools,
  createTool,
  defineTool,
  DENY_ALL_POLICY,
  hasTools,
  isValidTool,
  parseToolInput,
  PermissionManager,
  tool,
  ToolConfigSchema,
  ToolExecutor,
  ToolParameterSchemaSchema,
  ToolPermissionPolicySchema,
  ToolRegistry,
  validateToolConfig,
  validateToolPermissionPolicy,
  zodToToolSchema,
} from './tool/index.js';
export type { CreateToolOptions, DefineToolOptions, ToolDecoratorOptions } from './tool/index.js';

// Built-in Tools — File
export {
  createFileTools,
  createListFilesTool,
  createReadFileTool,
  createWriteFileTool,
  DEFAULT_MAX_ENTRIES,
  HARD_MAX_ENTRIES,
  ListFilesInputSchema,
  matchesPattern,
  MAX_READ_SIZE,
  MAX_WRITE_SIZE,
  ReadFileInputSchema,
  WriteFileInputSchema,
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

// Built-in Tools — Web
export {
  createFetchUrlTool,
  createParseHtmlTool,
  createWebSearchTool,
  createWebTools,
  decodeHtmlEntities,
  DEFAULT_MAX_RESULTS,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_USER_AGENT,
  extractLinks,
  extractMetadata,
  extractTitle,
  FetchUrlInputSchema,
  HARD_MAX_RESULTS,
  MAX_RESPONSE_SIZE,
  ParseHtmlInputSchema,
  stripTags,
  WebSearchInputSchema,
} from './tools/index.js';
export type {
  ExtractedLink,
  FetchUrlInput,
  FetchUrlOutput,
  FetchUrlToolOptions,
  HtmlMetadata,
  ParseHtmlInput,
  ParseHtmlOutput,
  SearchResult,
  WebSearchInput,
  WebSearchOutput,
  WebSearchToolOptions,
  WebTools,
  WebToolsOptions,
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
  ToolInputValidationError,
  ToolNotFoundError,
  ToolPermissionError,
  ToolTimeoutError,
} from './errors/index.js';
export type { ToolValidationIssue } from './errors/index.js';
