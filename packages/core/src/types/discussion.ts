/**
 * Discussion types for agent-to-agent collaborative communication.
 *
 * Enables multi-round back-and-forth discussions between agents
 * with convergence detection and structured message types.
 *
 * @packageDocumentation
 */

/** Classification of a discussion message's intent. */
export enum DiscussionMessageType {
  PROPOSAL = 'proposal',
  FEEDBACK = 'feedback',
  REVISION = 'revision',
  AGREEMENT = 'agreement',
  DISAGREEMENT = 'disagreement',
  QUESTION = 'question',
  ANSWER = 'answer',
}

/** Lifecycle status of a discussion. */
export enum DiscussionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  CONVERGED = 'converged',
  DIVERGED = 'diverged',
  MAX_ROUNDS_REACHED = 'max-rounds-reached',
  ERROR = 'error',
}

/** Strategy for determining when agents have reached agreement. */
export enum ConvergenceStrategy {
  /** All participants must explicitly agree. */
  UNANIMOUS = 'unanimous',
  /** Majority of participants agree. */
  MAJORITY = 'majority',
  /** An external LLM judges whether the output is satisfactory. */
  LLM_JUDGE = 'llm-judge',
  /** Convergence when no substantive changes for N consecutive rounds. */
  STABLE_OUTPUT = 'stable-output',
}

/** A single message in an agent-to-agent discussion. */
export interface DiscussionMessage {
  readonly id: string;
  readonly fromAgentId: string;
  readonly toAgentId: string;
  readonly content: string;
  readonly round: number;
  readonly timestamp: number;
  readonly type: DiscussionMessageType;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/** A complete round of discussion where all participants respond. */
export interface DiscussionRound {
  readonly roundNumber: number;
  readonly messages: readonly DiscussionMessage[];
  readonly timestamp: number;
}

/** Configuration for a discussion between agents. */
export interface DiscussionConfig {
  readonly id: string;
  /** Agent IDs participating in this discussion. */
  readonly participantIds: readonly string[];
  /** The topic or goal of the discussion. */
  readonly topic: string;
  /** Initial context to seed the discussion (e.g. prior task output). */
  readonly initialContext?: string;
  /** Maximum rounds before force-stopping (default: 5). */
  readonly maxRounds: number;
  /** How to determine convergence. */
  readonly convergenceStrategy: ConvergenceStrategy;
  /** For STABLE_OUTPUT: how many rounds of unchanged output means converged (default: 2). */
  readonly stabilityThreshold?: number;
  /** Which agent opens the discussion (defaults to first participant). */
  readonly initiatorId?: string;
}

/** The full result of a completed discussion. */
export interface DiscussionResult {
  readonly discussionId: string;
  readonly status: DiscussionStatus;
  readonly rounds: readonly DiscussionRound[];
  readonly finalOutput: string;
  readonly totalMessages: number;
  readonly participantIds: readonly string[];
  readonly duration: number;
  /** Round number at which convergence was reached, if any. */
  readonly convergenceRound?: number;
}

/** Map of discussion event names to their listener signatures. */
export interface DiscussionEventMap {
  'discussion:start': (discussionId: string, participantIds: readonly string[]) => void;
  'discussion:round:start': (discussionId: string, roundNumber: number) => void;
  'discussion:message': (discussionId: string, message: DiscussionMessage) => void;
  'discussion:round:complete': (discussionId: string, round: DiscussionRound) => void;
  'discussion:converged': (discussionId: string, round: number, output: string) => void;
  'discussion:max-rounds': (discussionId: string, maxRounds: number) => void;
  'discussion:complete': (discussionId: string, result: DiscussionResult) => void;
  'discussion:error': (discussionId: string, error: Error) => void;
}

/** Discussion configuration attached to a crew task. */
export interface TaskDiscussionConfig {
  /** Agent IDs that should discuss collaboratively for this task. */
  readonly participantIds: readonly string[];
  /** Maximum discussion rounds (default: 5). */
  readonly maxRounds: number;
  /** How to determine convergence. */
  readonly convergenceStrategy: ConvergenceStrategy;
  /** Override discussion topic (defaults to task description). */
  readonly topic?: string;
  /** For STABLE_OUTPUT strategy: rounds of unchanged output to trigger convergence. */
  readonly stabilityThreshold?: number;
}
