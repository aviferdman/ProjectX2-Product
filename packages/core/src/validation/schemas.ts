/**
 * Zod validation schemas for all Crewspace configuration objects.
 *
 * These schemas are the source of truth for runtime validation.
 * They are used internally by class constructors and exported
 * publicly so consumers can validate configs independently.
 *
 * @packageDocumentation
 */

import { z } from 'zod';

import type { LLMProvider } from '../types/llm.js';
import { TaskPriority } from '../types/task.js';
import type { Tool } from '../types/tool.js';
import { ExecutionStrategy } from '../engine/types.js';

// ---------------------------------------------------------------------------
// Shared patterns
// ---------------------------------------------------------------------------

/** Pattern for identifiers: alphanumeric, dashes, and underscores. */
const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

// ---------------------------------------------------------------------------
// Agent schemas
// ---------------------------------------------------------------------------

const MAX_ITERATIONS_UPPER_BOUND = 100;

/**
 * Zod schema for {@link AgentConfig}.
 *
 * Validates agent configuration at runtime. Exported so consumers
 * can validate configs before constructing an Agent.
 */
export const AgentConfigSchema = z.object({
  id: z
    .string()
    .min(1, 'Agent id must not be empty')
    .regex(ID_PATTERN, 'Agent id must be alphanumeric (dashes and underscores allowed)'),
  role: z.string().min(1, 'Agent role must not be empty'),
  goal: z.string().min(1, 'Agent goal must not be empty'),
  backstory: z.string().optional(),
  tools: z
    .array(
      z.custom<Tool>(
        (val) => typeof val === 'object' && val !== null && 'name' in val && 'execute' in val,
        { message: 'Each tool must have a "name" and "execute" property' },
      ),
    )
    .optional(),
  llmProvider: z.custom<LLMProvider>().optional(),
  maxIterations: z
    .number()
    .int()
    .positive()
    .max(
      MAX_ITERATIONS_UPPER_BOUND,
      `maxIterations must be ≤ ${String(MAX_ITERATIONS_UPPER_BOUND)}`,
    )
    .optional(),
  verbose: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Task schemas
// ---------------------------------------------------------------------------

const MAX_RETRIES_UPPER_BOUND = 10;
const MAX_TIMEOUT_MS = 600_000; // 10 minutes

/**
 * Zod schema for {@link TaskConfig}.
 */
export const TaskConfigSchema = z.object({
  id: z
    .string()
    .min(1, 'Task id must not be empty')
    .regex(ID_PATTERN, 'Task id must be alphanumeric (dashes and underscores allowed)'),
  description: z.string().min(1, 'Task description must not be empty'),
  expectedOutput: z.string().optional(),
  agentId: z
    .string()
    .min(1, 'Task agentId must not be empty')
    .regex(ID_PATTERN, 'Task agentId must be alphanumeric (dashes and underscores allowed)')
    .optional(),
  context: z.record(z.unknown()).optional(),
  dependencies: z.array(z.string().min(1)).optional(),
  timeout: z
    .number()
    .int()
    .positive('Task timeout must be positive')
    .max(MAX_TIMEOUT_MS, `Task timeout must be ≤ ${String(MAX_TIMEOUT_MS)}ms`)
    .optional(),
  retries: z
    .number()
    .int()
    .min(0, 'Task retries must be non-negative')
    .max(MAX_RETRIES_UPPER_BOUND, `Task retries must be ≤ ${String(MAX_RETRIES_UPPER_BOUND)}`)
    .optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ---------------------------------------------------------------------------
// Crew schemas
// ---------------------------------------------------------------------------

/**
 * Zod schema for {@link CrewTask}.
 */
export const CrewTaskSchema = z.object({
  id: z
    .string()
    .min(1, 'Task id must not be empty')
    .regex(ID_PATTERN, 'Task id must be alphanumeric (dashes and underscores allowed)'),
  description: z.string().min(1, 'Task description must not be empty'),
  expectedOutput: z.string().optional(),
  agentId: z.string().min(1, 'Task agentId must not be empty'),
  context: z.record(z.unknown()).optional(),
  dependencies: z.array(z.string()).optional(),
});

/**
 * Zod schema for {@link CrewConfig}.
 *
 * Note: The `agents` field uses a loose check (object with `id` and `execute`)
 * because full Agent validation happens via {@link AgentConfigSchema} at
 * Agent construction time.
 */
export const CrewConfigSchema = z.object({
  id: z
    .string()
    .min(1, 'Crew id must not be empty')
    .regex(ID_PATTERN, 'Crew id must be alphanumeric (dashes and underscores allowed)'),
  name: z.string().optional(),
  agents: z
    .array(
      z.custom<{ id: string; execute: (...args: unknown[]) => unknown }>(
        (val) => typeof val === 'object' && val !== null && 'id' in val && 'execute' in val,
        { message: 'Each agent must have an "id" and "execute" method' },
      ),
    )
    .min(1, 'Crew must have at least one agent'),
  tasks: z.array(CrewTaskSchema).min(1, 'Crew must have at least one task'),
  verbose: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// ExecutionEngine schemas
// ---------------------------------------------------------------------------

const MAX_CONCURRENCY_UPPER_BOUND = 100;
const MAX_GLOBAL_TIMEOUT_MS = 3_600_000; // 1 hour

/**
 * Zod schema for {@link ExecutionEngineConfig}.
 */
export const ExecutionEngineConfigSchema = z.object({
  id: z
    .string()
    .min(1, 'Engine id must not be empty')
    .regex(ID_PATTERN, 'Engine id must be alphanumeric (dashes and underscores allowed)'),
  strategy: z.nativeEnum(ExecutionStrategy).optional(),
  maxConcurrency: z
    .number()
    .int()
    .positive('maxConcurrency must be positive')
    .max(
      MAX_CONCURRENCY_UPPER_BOUND,
      `maxConcurrency must be ≤ ${String(MAX_CONCURRENCY_UPPER_BOUND)}`,
    )
    .optional(),
  globalTimeout: z
    .number()
    .int()
    .positive('globalTimeout must be positive')
    .max(MAX_GLOBAL_TIMEOUT_MS, `globalTimeout must be ≤ ${String(MAX_GLOBAL_TIMEOUT_MS)}ms`)
    .optional(),
  taskErrorPolicy: z.enum(['fail-fast', 'continue']).optional(),
  verbose: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// LLM schemas
// ---------------------------------------------------------------------------

/**
 * Zod schema for {@link LLMRequestOptions}.
 */
export const LLMRequestOptionsSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  stopSequences: z.array(z.string()).optional(),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

/** Validated AgentConfig derived from the Zod schema. */
export type ValidatedAgentConfig = z.infer<typeof AgentConfigSchema>;

/** Validated TaskConfig derived from the Zod schema. */
export type ValidatedTaskConfig = z.infer<typeof TaskConfigSchema>;

/** Validated CrewTask derived from the Zod schema. */
export type ValidatedCrewTask = z.infer<typeof CrewTaskSchema>;

/** Validated CrewConfig derived from the Zod schema. */
export type ValidatedCrewConfig = z.infer<typeof CrewConfigSchema>;

/** Validated ExecutionEngineConfig derived from the Zod schema. */
export type ValidatedExecutionEngineConfig = z.infer<typeof ExecutionEngineConfigSchema>;

/** Validated LLMRequestOptions derived from the Zod schema. */
export type ValidatedLLMRequestOptions = z.infer<typeof LLMRequestOptionsSchema>;
