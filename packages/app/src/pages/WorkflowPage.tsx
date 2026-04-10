/**
 * WorkflowPage — Main workflow editor view (Lovable-style).
 * Split layout: chat sidebar (left) + workflow visualization (right).
 * Wired to @crewspace/core for real LLM-driven planning and execution.
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { WorkflowChat } from '../components/workflow/WorkflowChat.js';
import { WorkflowPreview } from '../components/workflow/WorkflowPreview.js';
import { WorkflowToolbar } from '../components/workflow/WorkflowToolbar.js';
import type { WorkflowState, ChatMessage } from '../types/workflow.js';
import {
  createProvider,
  getDefaultLLMConfig,
  generateWorkflowPlan,
  chatWithWorkflow,
  executeWorkflow,
} from '../services/orchestration.js';
import type { LLMProvider } from '@crewspace/core/types';
import { LLMSettings } from '../components/workflow/LLMSettings.js';

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
  const [sidebarWidth] = useState(420);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [llmError, setLlmError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Stable LLM provider ref — created once, survives re-renders
  const providerRef = useRef<LLMProvider | null>(null);

  const getProvider = useCallback((): LLMProvider => {
    if (!providerRef.current) {
      const config = getDefaultLLMConfig();
      providerRef.current = createProvider(config);
    }
    return providerRef.current;
  }, []);

  // Helper to push a chat message
  const pushMessage = useCallback((role: 'user' | 'assistant' | 'system', content: string) => {
    const msg: ChatMessage = { id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, role, content, timestamp: Date.now() };
    setChatMessages((prev) => [...prev, msg]);
  }, []);

  // Track whether initial generation has been triggered
  const hasTriggeredGeneration = useRef(false);

  // -----------------------------------------------------------------------
  // 1. Generate workflow from initial prompt via LLM
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!initialPrompt || workflow || hasTriggeredGeneration.current) return undefined;
    hasTriggeredGeneration.current = true;

    pushMessage('system', `Analyzing your request: "${initialPrompt}"`);
    setIsGenerating(true);
    setLlmError(null);

    // NOTE: We intentionally do NOT use a `cancelled` flag here.
    // The `hasTriggeredGeneration` ref already prevents double-execution.
    // A cancellation guard would silently discard results when React Strict Mode
    // unmounts the first render — the ref stays `true` across remounts so the
    // second mount skips the effect, but the first mount's async result would be
    // dropped, leaving the UI stuck on "Thinking..." forever.
    (async () => {
      try {
        const provider = getProvider();
        const generated = await generateWorkflowPlan(initialPrompt, provider);

        setWorkflow(generated);
        setIsGenerating(false);
        pushMessage(
          'assistant',
          `I've assembled a team of **${generated.agents.length} agents** with **${generated.tasks.length} tasks** to execute your initiative.\n\n**Agents:**\n${generated.agents.map((a) => `• **${a.role}** — ${a.goal}`).join('\n')}\n\n**Task pipeline:**\n${generated.tasks.map((t, i) => `${i + 1}. ${t.description}`).join('\n')}\n\nYou can modify agents, reorder tasks, or hit **Run** to execute.`,
        );
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        setIsGenerating(false);
        setLlmError(msg);
        pushMessage('assistant', `Failed to generate workflow: ${msg}\n\nPlease check your API key in Settings (gear icon) and try again.`);
      }
    })();

    return undefined;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // -----------------------------------------------------------------------
  // 2. Chat follow-ups — LLM-driven
  // -----------------------------------------------------------------------
  const handleChatMessage = useCallback(
    async (content: string) => {
      pushMessage('user', content);
      setLlmError(null);

      try {
        const provider = getProvider();
        const { text, updatedWorkflow } = await chatWithWorkflow(content, workflow, provider);

        if (updatedWorkflow) {
          setWorkflow(updatedWorkflow);
        }
        pushMessage('assistant', text);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        setLlmError(msg);
        pushMessage('assistant', `Error: ${msg}`);
      }
    },
    [workflow, getProvider, pushMessage],
  );

  // -----------------------------------------------------------------------
  // 3. Run workflow — real Crew execution
  // -----------------------------------------------------------------------
  const handleRunWorkflow = useCallback(async () => {
    if (!workflow) return;

    setWorkflow((prev) => (prev ? { ...prev, status: 'running' } : null));
    pushMessage('system', 'Starting workflow execution…');
    setLlmError(null);

    try {
      const provider = getProvider();

      await executeWorkflow(workflow, provider, {
        onTaskStart(taskId, agentId) {
          setWorkflow((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              tasks: prev.tasks.map((t) =>
                t.id === taskId ? { ...t, status: 'running' as const } : t,
              ),
              agents: prev.agents.map((a) =>
                a.id === agentId ? { ...a, status: 'working' as const } : a,
              ),
            };
          });
          const agent = workflow.agents.find((a) => a.id === agentId);
          pushMessage('system', `▶ **${agent?.role ?? agentId}** is working on: ${workflow.tasks.find((t) => t.id === taskId)?.description ?? taskId}`);
        },

        onTaskComplete(taskId, result) {
          setWorkflow((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              tasks: prev.tasks.map((t) =>
                t.id === taskId
                  ? { ...t, status: 'completed' as const, output: result.output }
                  : t,
              ),
              agents: prev.agents.map((a) => {
                // Set agent back to idle if none of its remaining tasks are running
                const hasRunningTasks = prev.tasks.some(
                  (t) => t.agentId === a.id && t.id !== taskId && t.status === 'running',
                );
                if (a.id === result.agentId && !hasRunningTasks) {
                  return { ...a, status: 'idle' as const };
                }
                return a;
              }),
            };
          });
        },

        onTaskError(taskId, error) {
          setWorkflow((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              tasks: prev.tasks.map((t) =>
                t.id === taskId ? { ...t, status: 'failed' as const } : t,
              ),
            };
          });
          pushMessage('assistant', `Task **${taskId}** failed: ${error.message}`);
        },

        onCrewComplete(result) {
          setWorkflow((prev) => (prev ? { ...prev, status: 'completed' } : null));
          const outputs = Array.from(result.taskResults.entries())
            .map(([tid, r]) => `**${tid}**: ${r.output.slice(0, 200)}${r.output.length > 200 ? '…' : ''}`)
            .join('\n\n');
          pushMessage(
            'assistant',
            `All ${result.taskResults.size} tasks completed in ${(result.duration / 1000).toFixed(1)}s.\n\n${outputs}`,
          );
        },

        onCrewError(error) {
          setWorkflow((prev) => (prev ? { ...prev, status: 'failed' } : null));
          pushMessage('assistant', `Workflow failed: ${error.message}`);
        },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setLlmError(msg);
      setWorkflow((prev) => (prev ? { ...prev, status: 'failed' } : null));
    }
  }, [workflow, getProvider, pushMessage]);

  return (
    <div className="h-screen flex flex-col bg-[var(--cs-surface-app)] overflow-hidden">
      {/* Top Toolbar */}
      <WorkflowToolbar
        workflow={workflow}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRun={handleRunWorkflow}
        onBack={() => navigate('/')}
        onSettings={() => setShowSettings(true)}
        isGenerating={isGenerating}
      />

      {/* Error Banner */}
      {llmError && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-rose-500/10 border-b border-rose-500/20 animate-fadeInDown">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span className="text-xs text-rose-300 flex-1 truncate">{llmError}</span>
          <button onClick={() => setLlmError(null)} className="text-xs text-rose-400 hover:text-rose-300 transition-colors focus-ring" aria-label="Dismiss error">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Sidebar */}
        {!isSidebarCollapsed && (
          <div
            className="flex-shrink-0 border-r border-[var(--cs-border-subtle)] flex flex-col bg-[var(--cs-surface-panel)] animate-slideInLeft"
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
          className="flex-shrink-0 w-6 flex items-center justify-center bg-[var(--cs-surface-panel)]/50 border-r border-[var(--cs-border-subtle)] hover:bg-violet-500/10 transition-all group focus-ring"
          aria-label={isSidebarCollapsed ? 'Expand chat sidebar' : 'Collapse chat sidebar'}
          title={isSidebarCollapsed ? 'Expand chat' : 'Collapse chat'}
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
            className={`text-[var(--cs-text-tertiary)] group-hover:text-violet-400 transition-all duration-200 ${isSidebarCollapsed ? '' : 'rotate-180'}`}
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

      {/* LLM Settings Modal */}
      <LLMSettings
        open={showSettings}
        onClose={() => setShowSettings(false)}
        onSaved={() => { providerRef.current = null; }}
      />
    </div>
  );
}
