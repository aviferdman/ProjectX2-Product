/**
 * Task module — public exports.
 *
 * @packageDocumentation
 */
export { Task } from './task.js';
export { getExecutionLevels, ParallelExecutor, topologicalSort } from './parallel-executor.js';
export type {
  ExecutionLevel,
  ParallelErrorPolicy,
  ParallelExecutionResult,
  ParallelExecutorConfig,
  ParallelExecutorEventMap,
  TaskRunner,
} from './parallel-executor.js';
export {
  getExecutionLevels as getSchedulerExecutionLevels,
  resolveTaskDependencies,
  topologicalSort as schedulerTopologicalSort,
  detectCircularDependencies,
  assertNoCycles,
} from './task-scheduler.js';
export type { TopologicalSortResult, CircularDependencyCheckResult } from './task-scheduler.js';
export { TaskContextManager } from './task-context-manager.js';
export type {
  ContextMergeStrategy,
  ContextTransformer,
  TaskContextManagerConfig,
} from './task-context-manager.js';
export {
  calculateTaskRetryDelay,
  executeWithRetry,
  executeWithTimeout,
  TaskExecutionWrapper,
} from './task-execution-wrapper.js';
export type { TaskExecutionWrapperConfig, TaskRetryStats } from './task-execution-wrapper.js';
export {
  formatTaskDependencyTree,
  formatTaskList,
  formatTaskPlanTree,
} from './task-plan-formatter.js';
export type { FormatTaskPlanOptions } from './task-plan-formatter.js';
export { TaskTimeoutGuard, withTimeoutGuard } from './task-timeout-guard.js';
export type {
  ActiveGuardInfo,
  TaskTimeoutGuardConfig,
  TaskTimeoutGuardEventMap,
} from './task-timeout-guard.js';
export { DeadLetterQueue, DEFAULT_DLQ_MAX_SIZE } from './dead-letter-queue.js';
export type {
  DeadLetterEntry,
  DeadLetterEnqueueOptions,
  DeadLetterQueueConfig,
  DeadLetterQueueEventMap,
  DLQOverflowPolicy,
} from './dead-letter-queue.js';
