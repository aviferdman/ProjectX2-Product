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

// Types
export { AgentStatus, CrewStatus, LLMRole } from './types/index.js';
export type {
  AgentConfig,
  AgentEventMap,
  CrewConfig,
  CrewEventMap,
  CrewRunResult,
  CrewTask,
  LLMMessage,
  LLMProvider,
  LLMRequestOptions,
  LLMResponse,
  TaskInput,
  TaskResult,
  TokenUsage,
  Tool,
} from './types/index.js';

// Errors
export { AgentConfigError, AgentExecutionError } from './errors/index.js';
export { CrewConfigError, CrewExecutionError } from './errors/index.js';
