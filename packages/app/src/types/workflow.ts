/**
 * Workflow types for the agent orchestration UI.
 */

export interface AgentNode {
  id: string;
  role: string;
  goal: string;
  backstory: string;
  tools: string[];
  status: 'idle' | 'working' | 'error' | 'completed';
  color: string;
  position: { x: number; y: number };
}

export interface TaskNode {
  id: string;
  description: string;
  agentId: string;
  dependencies: string[];
  expectedOutput: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
  /** Optional discussion configuration for collaborative tasks. */
  discussion?: {
    participantIds: string[];
    maxRounds: number;
    convergenceStrategy: 'unanimous' | 'majority' | 'llm-judge' | 'stable-output';
    topic?: string | undefined;
  };
}

/** A directed edge between two agents representing a discussion channel. */
export interface DiscussionEdge {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  /** The task this discussion is associated with. */
  taskId: string;
  status: 'idle' | 'active' | 'converged' | 'max-rounds';
  /** Live messages flowing over this edge. */
  messages: DiscussionMessageUI[];
}

/** A discussion message to display in the UI. */
export interface DiscussionMessageUI {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  content: string;
  round: number;
  type: 'proposal' | 'feedback' | 'revision' | 'agreement' | 'disagreement' | 'question' | 'answer';
  timestamp: number;
}

export interface WorkflowState {
  id: string;
  name: string;
  description: string;
  agents: AgentNode[];
  tasks: TaskNode[];
  /** Discussion edges between agents (generated from task discussion configs). */
  discussionEdges: DiscussionEdge[];
  status: 'draft' | 'running' | 'completed' | 'failed';
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}
