/**
 * Vitest helpers for testing Crewspace agent workflows.
 *
 * This module provides reusable mock factories, assertion helpers, and event
 * collectors that eliminate boilerplate in agent/crew test suites.
 *
 * @example
 * ```typescript
 * import {
 *   createMockLLMProvider,
 *   createMockTool,
 *   createTestAgent,
 *   createTestCrew,
 *   AgentEventCollector,
 *   expectCrewSuccess,
 * } from '@crewspace/core/testing';
 * ```
 *
 * @packageDocumentation
 */

// Mock LLM providers
export {
  createCapturingMockLLMProvider,
  createMockLLMProvider,
  createMockStreamingProvider,
  createSequenceMockLLMProvider,
  createTrackingMockLLMProvider,
  DEFAULT_MOCK_TOKEN_USAGE,
} from './mock-llm-provider.js';
export type {
  MockLLMProviderOptions,
  MockStreamingProviderOptions,
} from './mock-llm-provider.js';

// Mock LLM response system
export { MockLLMResponseSystem } from './mock-response-system.js';
export type {
  MockLLMCall,
  MockLLMResponseSystemConfig,
  MockResponseMatcher,
  MockResponseRule,
} from './mock-response-system.js';

// Mock tools
export {
  createMockTool,
  createTrackingMockTool,
} from './mock-tool.js';
export type { MockToolOptions } from './mock-tool.js';

// Agent, Task, Crew factories
export {
  createTestAgent,
  createTestCrew,
  createTestTask,
} from './agent-helpers.js';
export type {
  TestAgentOptions,
  TestCrewOptions,
  TestTaskOptions,
} from './agent-helpers.js';

// Event collectors
export {
  AgentEventCollector,
  CrewEventCollector,
} from './event-collector.js';
export type { CollectedEvent } from './event-collector.js';

// Workflow assertions
export {
  expectAgentError,
  expectAgentIdle,
  expectAgentOutput,
  expectAgentStatus,
  expectCrewStatus,
  expectCrewSuccess,
  expectEventOrder,
  expectEventsContain,
  expectTaskOutput,
} from './workflow-assertions.js';
