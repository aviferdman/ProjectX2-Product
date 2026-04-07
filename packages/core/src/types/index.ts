/**
 * Core type definitions for the Crewspace framework.
 *
 * @packageDocumentation
 */

export { AgentStatus } from './agent.js';
export type { AgentConfig, AgentEventMap } from './agent.js';

export { CrewStatus } from './crew.js';
export type { CrewConfig, CrewEventMap, CrewRunResult, CrewTask } from './crew.js';

export { LLMRole } from './llm.js';
export type {
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
  TokenUsage,
} from './llm.js';

export { TaskPriority, TaskStatus } from './task.js';
export type { RetryPolicy, TaskConfig, TaskEventMap, TaskInput, TaskResult } from './task.js';

export { ToolCategory, ToolPermission } from './tool.js';
export type {
  Tool,
  ToolEventMap,
  ToolParameterSchema,
  ToolPermissionPolicy,
  ToolResult,
} from './tool.js';

export { MemoryNamespace, MemoryRole } from './memory.js';
export type {
  MemoryConfig,
  MemoryEntry,
  MemoryEventMap,
  MemoryMetadata,
  MemoryProvider,
  MemoryQueryOptions,
  MemoryQueryResult,
  MemoryRetentionPolicy,
  MemorySortOrder,
} from './memory.js';
