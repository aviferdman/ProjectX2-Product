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
} from './task-scheduler.js';
export type { TopologicalSortResult } from './task-scheduler.js';
export { TaskContextManager } from './task-context-manager.js';
export type {
  ContextMergeStrategy,
  ContextTransformer,
  TaskContextManagerConfig,
} from './task-context-manager.js';
