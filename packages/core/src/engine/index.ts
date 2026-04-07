/**
 * Execution engine exports.
 *
 * @packageDocumentation
 */

export { ExecutionEngine } from './execution-engine.js';
export { EngineStatus, ExecutionStrategy } from './types.js';
export type {
  AfterTaskHook,
  BeforeTaskHook,
  EngineEventMap,
  EngineRunResult,
  ExecutionEngineConfig,
  OnTaskErrorHook,
  TaskErrorPolicy,
} from './types.js';

// Checkpoint / Resume
export { CheckpointStore } from './checkpoint-store.js';
export { CheckpointManager } from './checkpoint-manager.js';
export type {
  CheckpointData,
  CheckpointStatus,
  CheckpointStoreConfig,
  CheckpointTaskState,
  ResumePlan,
} from './checkpoint-types.js';
