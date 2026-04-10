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
}

export interface WorkflowState {
  id: string;
  name: string;
  description: string;
  agents: AgentNode[];
  tasks: TaskNode[];
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
