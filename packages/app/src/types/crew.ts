/**
 * Crew types — first-class entity in CrewSpace.
 * A Crew is a reusable team of agents that can power multiple workflows.
 */
import type { AgentNode, TaskNode } from './workflow.js';

/** Summary shown in crew list / cards. */
export interface CrewSummary {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly agentCount: number;
  readonly workflowCount: number;
  readonly lastRunStatus: 'draft' | 'running' | 'completed' | 'failed' | 'idle';
  readonly updatedAt: number;
  readonly createdAt: number;
  readonly color: string;
}

/** Lightweight workflow metadata stored on a crew. */
export interface CrewWorkflow {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly createdAt: number;
}

/** Full crew definition with agents and optional default tasks. */
export interface CrewDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly agents: AgentNode[];
  /** Default tasks that ship with this crew (template). */
  readonly tasks: TaskNode[];
  /** Ordered list of workflow IDs (kept for backward compat). */
  readonly workflowIds: string[];
  /** Rich workflow metadata keyed by workflow ID. */
  readonly workflows: CrewWorkflow[];
  readonly color: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

/** Input for creating a new crew. */
export interface CreateCrewInput {
  readonly name: string;
  readonly description: string;
  readonly agents?: AgentNode[];
  readonly tasks?: TaskNode[];
  readonly workflows?: ReadonlyArray<{ name: string; description: string }>;
  readonly color?: string;
}

/** Input for updating an existing crew. */
export interface UpdateCrewInput {
  readonly name?: string;
  readonly description?: string;
  readonly agents?: AgentNode[];
  readonly tasks?: TaskNode[];
  readonly color?: string;
}
