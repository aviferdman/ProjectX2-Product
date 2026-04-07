/**
 * Workflow complexity analysis for the Crewspace framework.
 *
 * Analyzes the structural complexity of agent workflows, including
 * dependency depth, parallelism width, tool diversity, and overall
 * orchestration complexity. These metrics help developers understand
 * how intricate their multi-agent setups are and where bottlenecks
 * might arise.
 *
 * @packageDocumentation
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Description of an agent in the workflow. */
export interface AgentDescriptor {
  readonly id: string;
  /** Number of tools assigned to the agent. */
  readonly toolCount: number;
  /** Whether the agent has an LLM provider configured. */
  readonly hasLLMProvider: boolean;
  /** Whether the agent has a backstory. */
  readonly hasBackstory: boolean;
}

/** Description of a task in the workflow. */
export interface TaskDescriptor {
  readonly id: string;
  /** ID of the agent assigned to this task. */
  readonly agentId: string;
  /** IDs of tasks this task depends on. */
  readonly dependencies: readonly string[];
  /** Whether a timeout is configured. */
  readonly hasTimeout: boolean;
  /** Whether retry is configured. */
  readonly hasRetry: boolean;
}

/** Description of the overall workflow to analyze. */
export interface WorkflowDescriptor {
  /** Unique identifier. */
  readonly id: string;
  /** Agents in the workflow. */
  readonly agents: readonly AgentDescriptor[];
  /** Tasks in the workflow. */
  readonly tasks: readonly TaskDescriptor[];
  /** Execution strategy: sequential or parallel. */
  readonly strategy: 'sequential' | 'parallel';
  /** Whether the engine uses hooks. */
  readonly hasHooks: boolean;
}

/** Complexity analysis result. */
export interface ComplexityReport {
  /** Total number of agents. */
  readonly agentCount: number;
  /** Total number of tasks. */
  readonly taskCount: number;
  /** Total number of dependencies across all tasks. */
  readonly dependencyCount: number;
  /** Maximum dependency chain depth (critical path length). */
  readonly maxDependencyDepth: number;
  /** Maximum number of tasks that can run in parallel (width). */
  readonly maxParallelWidth: number;
  /** Number of distinct tools across all agents. */
  readonly totalToolCount: number;
  /** Average tools per agent. */
  readonly avgToolsPerAgent: number;
  /** Number of agents with LLM providers. */
  readonly agentsWithLLM: number;
  /** Number of tasks with timeouts. */
  readonly tasksWithTimeout: number;
  /** Number of tasks with retry logic. */
  readonly tasksWithRetry: number;
  /** Whether the workflow has circular dependencies (invalid). */
  readonly hasCircularDeps: boolean;
  /** Execution strategy. */
  readonly strategy: 'sequential' | 'parallel';
  /** Whether hooks are used. */
  readonly hasHooks: boolean;
  /** Composite complexity score (0–100). */
  readonly complexityScore: number;
  /** Human-readable complexity grade. */
  readonly complexityGrade: ComplexityGrade;
}

/** Complexity grade labels. */
export type ComplexityGrade = 'trivial' | 'simple' | 'moderate' | 'complex' | 'highly-complex';

// ---------------------------------------------------------------------------
// Analyzer
// ---------------------------------------------------------------------------

/**
 * Analyze the complexity of a workflow descriptor.
 *
 * The composite score is computed from weighted factors:
 * - Task count (weight 0.20)
 * - Agent count (weight 0.10)
 * - Dependency depth (weight 0.25)
 * - Parallel width (weight 0.15)
 * - Tool diversity (weight 0.15)
 * - Feature flags (weight 0.15)
 */
export function analyzeComplexity(workflow: WorkflowDescriptor): ComplexityReport {
  const agentCount = workflow.agents.length;
  const taskCount = workflow.tasks.length;

  // Dependencies
  let dependencyCount = 0;
  for (const t of workflow.tasks) {
    dependencyCount += t.dependencies.length;
  }

  // Build adjacency for depth/width calculation
  const taskMap = new Map<string, TaskDescriptor>();
  for (const t of workflow.tasks) {
    taskMap.set(t.id, t);
  }

  const { maxDepth, hasCircular } = computeDependencyDepth(workflow.tasks, taskMap);
  const maxParallelWidth = computeMaxParallelWidth(workflow.tasks, taskMap);

  // Tool counts
  let totalToolCount = 0;
  let agentsWithLLM = 0;
  for (const a of workflow.agents) {
    totalToolCount += a.toolCount;
    if (a.hasLLMProvider) agentsWithLLM++;
  }
  const avgToolsPerAgent = agentCount > 0 ? totalToolCount / agentCount : 0;

  // Task feature flags
  let tasksWithTimeout = 0;
  let tasksWithRetry = 0;
  for (const t of workflow.tasks) {
    if (t.hasTimeout) tasksWithTimeout++;
    if (t.hasRetry) tasksWithRetry++;
  }

  // Complexity score
  const complexityScore = computeComplexityScore({
    taskCount,
    agentCount,
    maxDepth,
    maxParallelWidth,
    totalToolCount,
    tasksWithTimeout,
    tasksWithRetry,
    hasHooks: workflow.hasHooks,
    strategy: workflow.strategy,
  });

  const complexityGrade = gradeComplexity(complexityScore);

  return {
    agentCount,
    taskCount,
    dependencyCount,
    maxDependencyDepth: maxDepth,
    maxParallelWidth,
    totalToolCount,
    avgToolsPerAgent,
    agentsWithLLM,
    tasksWithTimeout,
    tasksWithRetry,
    hasCircularDeps: hasCircular,
    strategy: workflow.strategy,
    hasHooks: workflow.hasHooks,
    complexityScore,
    complexityGrade,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function computeDependencyDepth(
  tasks: readonly TaskDescriptor[],
  taskMap: Map<string, TaskDescriptor>,
): { maxDepth: number; hasCircular: boolean } {
  const depths = new Map<string, number>();
  const visiting = new Set<string>();
  let hasCircular = false;

  function dfs(taskId: string): number {
    if (depths.has(taskId)) return depths.get(taskId)!;
    if (visiting.has(taskId)) {
      hasCircular = true;
      return 0;
    }

    visiting.add(taskId);

    const task = taskMap.get(taskId);
    if (!task || task.dependencies.length === 0) {
      visiting.delete(taskId);
      depths.set(taskId, 0);
      return 0;
    }

    let maxChildDepth = 0;
    for (const depId of task.dependencies) {
      const childDepth = dfs(depId);
      if (childDepth + 1 > maxChildDepth) {
        maxChildDepth = childDepth + 1;
      }
    }

    visiting.delete(taskId);
    depths.set(taskId, maxChildDepth);
    return maxChildDepth;
  }

  for (const t of tasks) {
    dfs(t.id);
  }

  let maxDepth = 0;
  for (const d of depths.values()) {
    if (d > maxDepth) maxDepth = d;
  }

  return { maxDepth, hasCircular };
}

function computeMaxParallelWidth(
  tasks: readonly TaskDescriptor[],
  taskMap: Map<string, TaskDescriptor>,
): number {
  if (tasks.length === 0) return 0;

  // Group tasks into execution levels (tasks with no unresolved deps form level 0)
  const completed = new Set<string>();
  const remaining = new Set(tasks.map((t) => t.id));
  let maxWidth = 0;

  while (remaining.size > 0) {
    const level: string[] = [];
    for (const taskId of remaining) {
      const task = taskMap.get(taskId);
      if (!task) continue;
      const allDepsResolved = task.dependencies.every((d) => completed.has(d));
      if (allDepsResolved) {
        level.push(taskId);
      }
    }

    if (level.length === 0) break; // circular or missing deps

    if (level.length > maxWidth) maxWidth = level.length;

    for (const id of level) {
      completed.add(id);
      remaining.delete(id);
    }
  }

  return maxWidth;
}

interface ScoreInput {
  taskCount: number;
  agentCount: number;
  maxDepth: number;
  maxParallelWidth: number;
  totalToolCount: number;
  tasksWithTimeout: number;
  tasksWithRetry: number;
  hasHooks: boolean;
  strategy: 'sequential' | 'parallel';
}

function computeComplexityScore(input: ScoreInput): number {
  // Normalize each factor to 0–100 range, then weight

  // Task count: 1 task = 0, 20+ tasks = 100
  const taskScore = Math.min(100, ((input.taskCount - 1) / 19) * 100);

  // Agent count: 1 agent = 0, 10+ agents = 100
  const agentScore = Math.min(100, ((input.agentCount - 1) / 9) * 100);

  // Dependency depth: 0 = 0, 10+ = 100
  const depthScore = Math.min(100, (input.maxDepth / 10) * 100);

  // Parallel width: 1 = 0, 10+ = 100
  const widthScore = Math.min(100, ((input.maxParallelWidth - 1) / 9) * 100);

  // Tool diversity: 0 = 0, 30+ = 100
  const toolScore = Math.min(100, (input.totalToolCount / 30) * 100);

  // Feature complexity: binary flags
  let featureScore = 0;
  if (input.strategy === 'parallel') featureScore += 20;
  if (input.hasHooks) featureScore += 20;
  if (input.tasksWithTimeout > 0) featureScore += 20;
  if (input.tasksWithRetry > 0) featureScore += 20;
  if (input.agentCount > 1 && input.taskCount > input.agentCount) featureScore += 20;

  // Weighted composite
  const score =
    taskScore * 0.20 +
    agentScore * 0.10 +
    depthScore * 0.25 +
    widthScore * 0.15 +
    toolScore * 0.15 +
    featureScore * 0.15;

  return Math.round(Math.min(100, Math.max(0, score)));
}

/** Map a numeric complexity score to a human-readable grade. */
export function gradeComplexity(score: number): ComplexityGrade {
  if (score <= 10) return 'trivial';
  if (score <= 30) return 'simple';
  if (score <= 55) return 'moderate';
  if (score <= 80) return 'complex';
  return 'highly-complex';
}
