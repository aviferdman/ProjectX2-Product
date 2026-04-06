/**
 * Task module — public exports.
 *
 * @packageDocumentation
 */

export { Task } from './task.js';
export {
  getExecutionLevels,
  resolveTaskDependencies,
  topologicalSort,
} from './task-scheduler.js';
export type { TopologicalSortResult } from './task-scheduler.js';
