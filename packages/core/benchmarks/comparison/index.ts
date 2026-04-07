/**
 * Barrel export for comparison benchmark modules.
 *
 * @packageDocumentation
 */

export { CrewspaceWorkflowRunner } from './crewspace-workflow.js';
export { LangChainWorkflowRunner } from './langchain-workflow.js';
export { CrewAIWorkflowRunner } from './crewai-workflow.js';
export type {
  AgentSpec,
  ComparisonWorkflowRunner,
  TaskSpec,
  WorkflowResult,
  WorkflowTaskResult,
} from './workflow-spec.js';
export {
  ALL_AGENTS,
  ALL_TASKS,
  ANALYST_SPEC,
  MOCK_RESPONSES,
  REPORT_TASK,
  RESEARCHER_SPEC,
  SEARCH_TASK,
  ANALYZE_TASK,
  WRITER_SPEC,
} from './workflow-spec.js';
