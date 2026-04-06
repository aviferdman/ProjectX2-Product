/**
 * Validation module — Zod schemas and standalone validation functions.
 *
 * @packageDocumentation
 */

// Schemas
export {
  AgentConfigSchema,
  CrewConfigSchema,
  CrewTaskSchema,
  ExecutionEngineConfigSchema,
  LLMRequestOptionsSchema,
  TaskConfigSchema,
} from './schemas.js';

export type {
  ValidatedAgentConfig,
  ValidatedCrewConfig,
  ValidatedCrewTask,
  ValidatedExecutionEngineConfig,
  ValidatedLLMRequestOptions,
  ValidatedTaskConfig,
} from './schemas.js';

// Validators
export {
  safeValidateAgentConfig,
  safeValidateCrewConfig,
  safeValidateCrewTask,
  safeValidateEngineConfig,
  safeValidateLLMRequestOptions,
  safeValidateTaskConfig,
  validateAgentConfig,
  validateCrewConfig,
  validateCrewTask,
  validateEngineConfig,
  validateLLMRequestOptions,
  validateTaskConfig,
  ValidationError,
} from './validators.js';

export type {
  ValidationFailure,
  ValidationIssue,
  ValidationResult,
  ValidationSuccess,
} from './validators.js';
