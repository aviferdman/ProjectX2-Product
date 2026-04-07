/**
 * Custom Vitest assertion helpers for agent workflow testing.
 *
 * These helpers provide concise, expressive assertions for common patterns
 * in agent and crew test scenarios.
 *
 * @packageDocumentation
 */

import { expect } from 'vitest';

import type { Agent } from '../agent/agent.js';
import type { Crew } from '../crew/crew.js';
import { AgentStatus } from '../types/agent.js';
import { CrewStatus } from '../types/crew.js';
import type { CrewRunResult } from '../types/crew.js';
import type { TaskResult } from '../types/task.js';

// ---------------------------------------------------------------------------
// Agent assertions
// ---------------------------------------------------------------------------

/**
 * Assert that an agent executed successfully and returned a result
 * containing the expected output substring.
 */
export function expectAgentOutput(result: TaskResult, expected: string): void {
  expect(result).toBeDefined();
  expect(result.output).toContain(expected);
  expect(result.agentId).toBeTruthy();
  expect(result.duration).toBeGreaterThanOrEqual(0);
}

/**
 * Assert that an agent is in the given status.
 */
export function expectAgentStatus(agent: Agent, status: AgentStatus): void {
  expect(agent.status).toBe(status);
}

/**
 * Assert that an agent is idle (e.g., after successful execution).
 */
export function expectAgentIdle(agent: Agent): void {
  expectAgentStatus(agent, AgentStatus.IDLE);
}

/**
 * Assert that an agent is in error state.
 */
export function expectAgentError(agent: Agent): void {
  expectAgentStatus(agent, AgentStatus.ERROR);
}

// ---------------------------------------------------------------------------
// Crew assertions
// ---------------------------------------------------------------------------

/**
 * Assert that a crew run completed successfully with results for all expected tasks.
 */
export function expectCrewSuccess(result: CrewRunResult, expectedTaskIds?: readonly string[]): void {
  expect(result.success).toBe(true);
  expect(result.duration).toBeGreaterThanOrEqual(0);
  expect(result.crewId).toBeTruthy();

  if (expectedTaskIds) {
    for (const taskId of expectedTaskIds) {
      expect(result.taskResults.has(taskId)).toBe(true);
    }
    expect(result.taskResults.size).toBe(expectedTaskIds.length);
  }
}

/**
 * Assert that a crew is in the given status.
 */
export function expectCrewStatus(crew: Crew, status: CrewStatus): void {
  expect(crew.status).toBe(status);
}

/**
 * Assert that a specific task in a crew run produced output containing the
 * expected substring.
 */
export function expectTaskOutput(
  result: CrewRunResult,
  taskId: string,
  expectedSubstring: string,
): void {
  const taskResult = result.taskResults.get(taskId);
  expect(taskResult).toBeDefined();
  expect(taskResult!.output).toContain(expectedSubstring);
}

// ---------------------------------------------------------------------------
// Event tracking assertions
// ---------------------------------------------------------------------------

/**
 * Assert that events were emitted in the expected order.
 *
 * @param collected - Array of collected event names (populated by event listeners)
 * @param expected  - Expected event sequence (as a subsequence — order matters, gaps allowed)
 */
export function expectEventOrder(collected: readonly string[], expected: readonly string[]): void {
  let searchFrom = 0;
  for (const event of expected) {
    const idx = collected.indexOf(event, searchFrom);
    expect(idx).toBeGreaterThanOrEqual(
      searchFrom,
      `Expected event "${event}" after index ${String(searchFrom)} in [${collected.join(', ')}]`,
    );
    searchFrom = idx + 1;
  }
}

/**
 * Assert that events contain all expected event names (order-independent).
 */
export function expectEventsContain(
  collected: readonly string[],
  expected: readonly string[],
): void {
  for (const event of expected) {
    expect(collected).toContain(event);
  }
}
