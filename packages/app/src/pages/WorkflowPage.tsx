/**
 * WorkflowPage — Main workflow editor view (Lovable-style).
 * Split layout: chat sidebar (left) + workflow visualization (right).
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { WorkflowChat } from '../components/workflow/WorkflowChat.js';
import { WorkflowPreview } from '../components/workflow/WorkflowPreview.js';
import { WorkflowToolbar } from '../components/workflow/WorkflowToolbar.js';
import type { WorkflowState, AgentNode, TaskNode, ChatMessage } from '../types/workflow.js';

/** Generate a realistic workflow from a prompt (mock — in production calls core engine). */
function generateMockWorkflow(prompt: string): WorkflowState {
  const id = `wf-${Date.now()}`;
  const agents: AgentNode[] = [
    {
      id: 'agent-researcher',
      role: 'Research Analyst',
      goal: 'Gather comprehensive market data and trends',
      backstory: 'Senior research analyst with 10+ years of experience in market intelligence.',
      tools: ['web-search', 'web-scraper', 'document-reader'],
      status: 'idle',
      color: '#8b5cf6',
      position: { x: 100, y: 100 },
    },
    {
      id: 'agent-analyst',
      role: 'Data Analyst',
      goal: 'Analyze collected data and extract actionable insights',
      backstory: 'Expert data analyst specializing in statistical analysis and pattern recognition.',
      tools: ['data-processor', 'chart-generator'],
      status: 'idle',
      color: '#06b6d4',
      position: { x: 400, y: 100 },
    },
    {
      id: 'agent-strategist',
      role: 'Strategy Consultant',
      goal: 'Develop strategic recommendations based on analysis',
      backstory: 'Management consultant with expertise in go-to-market strategies and product development.',
      tools: ['document-writer', 'presentation-builder'],
      status: 'idle',
      color: '#f59e0b',
      position: { x: 250, y: 300 },
    },
    {
      id: 'agent-writer',
      role: 'Report Writer',
      goal: 'Compile findings into a comprehensive, professional report',
      backstory: 'Technical writer specializing in business reports and executive summaries.',
      tools: ['document-writer', 'formatter'],
      status: 'idle',
      color: '#10b981',
      position: { x: 550, y: 300 },
    },
  ];

  const tasks: TaskNode[] = [
    {
      id: 'task-1',
      description: 'Research market landscape, key players, and trends',
      agentId: 'agent-researcher',
      dependencies: [],
      expectedOutput: 'Comprehensive market data report with sources',
      status: 'pending',
    },
    {
      id: 'task-2',
      description: 'Analyze user demographics, needs, and pain points',
      agentId: 'agent-researcher',
      dependencies: [],
      expectedOutput: 'User needs analysis document',
      status: 'pending',
    },
    {
      id: 'task-3',
      description: 'Process and analyze collected data for patterns and insights',
      agentId: 'agent-analyst',
      dependencies: ['task-1', 'task-2'],
      expectedOutput: 'Data analysis with key findings and visualizations',
      status: 'pending',
    },
    {
      id: 'task-4',
      description: 'Develop MVP strategy and go-to-market recommendations',
      agentId: 'agent-strategist',
      dependencies: ['task-3'],
      expectedOutput: 'Strategic recommendation document with MVP roadmap',
      status: 'pending',
    },
    {
      id: 'task-5',
      description: 'Compile all findings into a final executive report',
      agentId: 'agent-writer',
      dependencies: ['task-3', 'task-4'],
      expectedOutput: 'Final comprehensive report with executive summary',
      status: 'pending',
    },
  ];

  return {
    id,
    name: 'Generated Workflow',
    description: prompt,
    agents,
    tasks,
    status: 'draft',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function WorkflowPage(): React.JSX.Element {
  const { workflowId } = useParams<{ workflowId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const initialPrompt = (location.state as { prompt?: string } | null)?.prompt ?? '';

  const [workflow, setWorkflow] = useState<WorkflowState | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'graph' | 'list' | 'timeline'>('graph');
  const [sidebarWidth, setSidebarWidth] = useState(420);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Generate workflow on mount if we have a prompt
  useEffect(() => {
    if (initialPrompt && !workflow) {
      const systemMsg: ChatMessage = {
        id: 'msg-system-1',
        role: 'system',
        content: `Analyzing your request: "${initialPrompt}"`,
        timestamp: Date.now(),
      };
      setChatMessages([systemMsg]);

      setIsGenerating(true);
      const timer = setTimeout(() => {
        const generated = generateMockWorkflow(initialPrompt);
        setWorkflow(generated);
        setIsGenerating(false);
        const assistantMsg: ChatMessage = {
          id: 'msg-assistant-1',
          role: 'assistant',
          content: `I've assembled a team of ${generated.agents.length} specialized agents with ${generated.tasks.length} tasks to execute your initiative.\n\n**Agents:**\n${generated.agents.map((a) => `• **${a.role}** — ${a.goal}`).join('\n')}\n\n**Workflow:**\n${generated.tasks.map((t, i) => `${i + 1}. ${t.description}`).join('\n')}\n\nYou can modify the agents, reorder tasks, or run the workflow. What would you like to adjust?`,
          timestamp: Date.now() + 1,
        };
        setChatMessages((prev) => [...prev, assistantMsg]);
      }, 2000);
      return () => { clearTimeout(timer); };
    }
    return undefined;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChatMessage = useCallback(
    (content: string) => {
      const userMsg: ChatMessage = {
        id: `msg-user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, userMsg]);

      // Simulate AI response
      setTimeout(() => {
        const assistantMsg: ChatMessage = {
          id: `msg-assistant-${Date.now()}`,
          role: 'assistant',
          content: getAssistantResponse(content, workflow),
          timestamp: Date.now(),
        };
        setChatMessages((prev) => [...prev, assistantMsg]);
      }, 1000);
    },
    [workflow],
  );

  const handleRunWorkflow = useCallback(() => {
    if (!workflow) return;
    setWorkflow((prev) => (prev ? { ...prev, status: 'running' } : null));
    // Simulate agent execution
    let taskIndex = 0;
    const tasks = workflow.tasks;
    const runNext = () => {
      if (taskIndex >= tasks.length) {
        setWorkflow((prev) => (prev ? { ...prev, status: 'completed' } : null));
        const doneMsg: ChatMessage = {
          id: `msg-done-${Date.now()}`,
          role: 'assistant',
          content: 'All tasks completed successfully! You can view the results in each task output.',
          timestamp: Date.now(),
        };
        setChatMessages((prev) => [...prev, doneMsg]);
        return;
      }
      const currentTask = tasks[taskIndex];
      if (!currentTask) return;
      setWorkflow((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === currentTask.id ? { ...t, status: 'running' as const } : t,
          ),
          agents: prev.agents.map((a) =>
            a.id === currentTask.agentId ? { ...a, status: 'working' as const } : a,
          ),
        };
      });
      setTimeout(() => {
        setWorkflow((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            tasks: prev.tasks.map((t) =>
              t.id === currentTask.id ? { ...t, status: 'completed' as const } : t,
            ),
            agents: prev.agents.map((a) =>
              a.id === currentTask.agentId ? { ...a, status: 'idle' as const } : a,
            ),
          };
        });
        taskIndex++;
        runNext();
      }, 2000);
    };
    runNext();
  }, [workflow]);

  return (
    <div className="h-screen flex flex-col bg-[#020617] overflow-hidden">
      {/* Top Toolbar */}
      <WorkflowToolbar
        workflow={workflow}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRun={handleRunWorkflow}
        onBack={() => navigate('/')}
        isGenerating={isGenerating}
      />

      {/* Main Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Sidebar */}
        {!isSidebarCollapsed && (
          <div
            className="flex-shrink-0 border-r border-white/5 flex flex-col bg-[#0b1120]"
            style={{ width: sidebarWidth }}
          >
            <WorkflowChat
              messages={chatMessages}
              onSendMessage={handleChatMessage}
              isGenerating={isGenerating}
              workflow={workflow}
            />
          </div>
        )}

        {/* Sidebar Toggle */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="flex-shrink-0 w-5 flex items-center justify-center bg-[#0b1120] border-r border-white/5 hover:bg-white/5 transition-colors group"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-slate-600 group-hover:text-slate-400 transition-all ${isSidebarCollapsed ? '' : 'rotate-180'}`}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Workflow Preview / Editor */}
        <div className="flex-1 min-w-0">
          <WorkflowPreview
            workflow={workflow}
            viewMode={viewMode}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            isGenerating={isGenerating}
          />
        </div>
      </div>
    </div>
  );
}

/** Simple mock response generator. */
function getAssistantResponse(input: string, workflow: WorkflowState | null): string {
  const lower = input.toLowerCase();
  if (lower.includes('add') && lower.includes('agent')) {
    return 'I can add a new agent to the workflow. What role should this agent have? For example: "Add a QA Reviewer agent that validates all outputs before the final report."';
  }
  if (lower.includes('remove') || lower.includes('delete')) {
    return "I can remove an agent or task. Which one would you like to remove? Click on it in the workflow view, or tell me its name.";
  }
  if (lower.includes('run') || lower.includes('start') || lower.includes('execute')) {
    return workflow?.status === 'running'
      ? 'The workflow is already running. You can monitor progress in the visualization panel.'
      : 'Ready to run! Click the **Run Workflow** button in the toolbar, or I can start it for you.';
  }
  if (lower.includes('change') || lower.includes('modify') || lower.includes('edit')) {
    return "Sure! Tell me what you'd like to change. You can modify agent roles, task descriptions, dependencies, or the overall workflow structure.";
  }
  return `I understand. ${workflow ? `The current workflow has ${workflow.agents.length} agents and ${workflow.tasks.length} tasks.` : 'No workflow generated yet.'} How would you like to proceed? You can:\n\n• **Add/remove agents** to change the team composition\n• **Edit tasks** to adjust the work breakdown\n• **Run the workflow** to execute all tasks\n• **Ask questions** about the strategy`;
}
