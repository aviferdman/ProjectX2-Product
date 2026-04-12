import React, { useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCrewStore } from '../../store/index.js';
import { ROUTES, workflowPath } from '../../router/routes.js';
import type { WorkflowState } from '../../types/workflow.js';
import {
  ALL_HARDCODED_AGENTS,
  BUSINESS_PRODUCT_AGENTS,
  RESEARCH_ANALYSIS_AGENTS,
} from '../../data/hardcoded-agents.js';
import type { HardcodedAgent } from '../../data/hardcoded-agents.js';
import { AgentAvatar } from '../AgentAvatar.js';

type CategoryFilter = 'all' | 'business-product' | 'research-analysis';

const AGENT_COLORS = [
  '#6366f1',
  '#2563eb',
  '#059669',
  '#d97706',
  '#dc2626',
  '#ec4899',
  '#06b6d4',
  '#6366f1',
];

function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  if (weeks > 0) return `${weeks}w ago`;
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

export function CrewDetail(): React.JSX.Element {
  const { crewId } = useParams<{ crewId: string }>();
  const navigate = useNavigate();
  const { getCrewById, updateCrew, deleteCrew, addAgentToCrew, removeAgentFromCrew } =
    useCrewStore();

  const crew = crewId ? getCrewById(crewId) : undefined;

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(crew?.name ?? '');
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState(crew?.description ?? '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const [agentToRemove, setAgentToRemove] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [agentSearch, setAgentSearch] = useState('');

  if (!crew) {
    return (
      <div className="min-h-screen bg-[var(--cs-surface-app)] flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <h2 className="text-lg font-semibold text-[var(--cs-text-primary)] mb-2">
            Crew not found
          </h2>
          <p className="text-sm text-[var(--cs-text-tertiary)] mb-4">
            The crew you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            to={ROUTES.CREWS}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors focus-ring"
          >
            Back to Crews
          </Link>
        </div>
      </div>
    );
  }

  function commitName() {
    if (nameValue.trim() && nameValue !== crew!.name) {
      updateCrew(crew!.id, { name: nameValue.trim() });
    } else {
      setNameValue(crew!.name);
    }
    setEditingName(false);
  }

  function commitDesc() {
    if (descValue !== crew!.description) {
      updateCrew(crew!.id, { description: descValue });
    } else {
      setDescValue(crew!.description);
    }
    setEditingDesc(false);
  }

  function handleDeleteCrew() {
    deleteCrew(crew!.id);
    navigate(ROUTES.CREWS);
  }

  // ── Agent management helpers ─────────────────────
  const existingAgentIds = crew?.agents.map((a) => a.id) ?? [];

  const filteredCatalogAgents = (() => {
    let list: readonly HardcodedAgent[];
    switch (categoryFilter) {
      case 'business-product':
        list = BUSINESS_PRODUCT_AGENTS;
        break;
      case 'research-analysis':
        list = RESEARCH_ANALYSIS_AGENTS;
        break;
      default:
        list = ALL_HARDCODED_AGENTS;
    }
    if (agentSearch.trim()) {
      const q = agentSearch.toLowerCase();
      list = list.filter(
        (a) =>
          a.role.toLowerCase().includes(q) ||
          a.subtitle.toLowerCase().includes(q) ||
          a.goal.toLowerCase().includes(q),
      );
    }
    return list;
  })();

  function handlePickAgent(def: HardcodedAgent) {
    if (!crew) return;
    addAgentToCrew(crew.id, {
      id: def.id,
      role: def.role,
      goal: def.goal,
      backstory: def.backstory,
      tools: [...def.tools],
      color: AGENT_COLORS[crew.agents.length % AGENT_COLORS.length] ?? '#6366f1',
    });
    setShowAgentPicker(false);
    setAgentSearch('');
    setCategoryFilter('all');
  }

  /** Tasks in this crew that reference the given agent. */
  function dependentTasks(agentId: string) {
    return crew?.tasks.filter((t) => t.agentId === agentId) ?? [];
  }

  function confirmRemoveAgent() {
    if (!crew || !agentToRemove) return;
    removeAgentFromCrew(crew.id, agentToRemove);
    setAgentToRemove(null);
  }

  return (
    <div className="min-h-screen bg-[var(--cs-surface-app)] scrollbar-thin">
      {/* ── Sticky Glass Nav ─────────────────────────────────── */}
      <header className="glass sticky top-0 z-50 border-b border-[var(--cs-border-subtle)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 focus-ring rounded-lg">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="text-lg font-semibold text-[var(--cs-text-primary)] tracking-tight">
                <span className="gradient-text">Crew</span>Space
              </span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring"
            >
              Home
            </button>
            <button
              onClick={() => navigate('/crews')}
              className="text-sm text-[var(--cs-text-primary)] font-medium focus-ring"
            >
              My Crews
            </button>
            <button
              onClick={() => navigate('/templates')}
              className="text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring"
            >
              Templates
            </button>
            <button
              onClick={() => navigate('/marketplace')}
              className="text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring"
            >
              Marketplace
            </button>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-lg text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] hover:bg-[var(--cs-surface-card)]/20 transition-colors focus-ring"
              aria-label="Settings"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-500 flex items-center justify-center text-xs font-bold text-[var(--cs-text-primary)]">
              U
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Back link */}
        <Link
          to={ROUTES.CREWS}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--cs-text-tertiary)] hover:text-[var(--cs-text-primary)] transition-colors mb-6"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Crews
        </Link>

        {/* ── Crew Header ──────────────────────────────────── */}
        <div className="mb-10 animate-fadeInDown">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-4 h-4 rounded-full shrink-0"
              style={{ backgroundColor: crew.color }}
            />
            {editingName ? (
              <input
                autoFocus
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitName();
                  if (e.key === 'Escape') {
                    setNameValue(crew.name);
                    setEditingName(false);
                  }
                }}
                className="text-2xl font-bold bg-transparent text-[var(--cs-text-primary)] border-b-2 border-indigo-500 outline-none w-full"
              />
            ) : (
              <h1
                onClick={() => {
                  setNameValue(crew.name);
                  setEditingName(true);
                }}
                className="text-2xl font-bold text-[var(--cs-text-primary)] cursor-text hover:text-indigo-300 transition-colors"
                title="Click to edit"
              >
                {crew.name}
              </h1>
            )}
          </div>

          {editingDesc ? (
            <textarea
              autoFocus
              value={descValue}
              onChange={(e) => setDescValue(e.target.value)}
              onBlur={commitDesc}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setDescValue(crew.description);
                  setEditingDesc(false);
                }
              }}
              rows={2}
              className="w-full text-sm bg-transparent text-[var(--cs-text-secondary)] border-b border-indigo-500/50 outline-none resize-none mt-1"
            />
          ) : (
            <p
              onClick={() => {
                setDescValue(crew.description);
                setEditingDesc(true);
              }}
              className="text-sm text-[var(--cs-text-secondary)] cursor-text hover:text-[var(--cs-text-primary)] transition-colors mt-1"
              title="Click to edit"
            >
              {crew.description || 'Add a description\u2026'}
            </p>
          )}

          <p className="text-xs text-[var(--cs-text-tertiary)] mt-2">
            Created {relativeTime(crew.createdAt)} &middot; Updated {relativeTime(crew.updatedAt)}
          </p>
        </div>

        {/* ── Agents Section ───────────────────────────────── */}
        <section className="mb-10 animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[var(--cs-text-primary)] uppercase tracking-wider">
              Agents{' '}
              <span className="ml-2 text-xs font-normal text-[var(--cs-text-tertiary)]">
                ({crew.agents.length})
              </span>
            </h2>
            <button
              onClick={() => setShowAgentPicker(!showAgentPicker)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors focus-ring"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Agent
            </button>
          </div>

          {/* ── Agent Picker ─────────────────────────────── */}
          {showAgentPicker && (
            <div className="mb-4 bg-[var(--cs-surface-card)] border border-indigo-500/30 rounded-xl p-4 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--cs-text-primary)]">
                  Select Agent
                </h3>
                <button
                  onClick={() => {
                    setShowAgentPicker(false);
                    setAgentSearch('');
                    setCategoryFilter('all');
                  }}
                  className="text-xs text-[var(--cs-text-tertiary)] hover:text-[var(--cs-text-secondary)] transition-colors"
                >
                  Cancel
                </button>
              </div>
              <input
                type="text"
                value={agentSearch}
                onChange={(e) => setAgentSearch(e.target.value)}
                placeholder="Search agents..."
                className="w-full px-3 py-2 text-sm rounded-md bg-[var(--cs-surface-app)] border border-[var(--cs-border-subtle)] text-[var(--cs-text-primary)] placeholder:text-[var(--cs-text-tertiary)] focus-ring transition-colors"
              />
              <div className="flex gap-1.5">
                {(['all', 'business-product', 'research-analysis'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                      categoryFilter === cat
                        ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                        : 'bg-[var(--cs-surface-app)] border-[var(--cs-border-subtle)] text-[var(--cs-text-tertiary)] hover:text-[var(--cs-text-secondary)]'
                    }`}
                  >
                    {cat === 'all'
                      ? 'All'
                      : cat === 'business-product'
                        ? 'Business & Product'
                        : 'Research & Analysis'}
                  </button>
                ))}
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1.5 scrollbar-thin">
                {filteredCatalogAgents.map((def) => {
                  const alreadyAdded = existingAgentIds.includes(def.id);
                  return (
                    <button
                      key={def.id}
                      onClick={() => !alreadyAdded && handlePickAgent(def)}
                      disabled={alreadyAdded}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        alreadyAdded
                          ? 'opacity-40 cursor-not-allowed border-[var(--cs-border-subtle)] bg-[var(--cs-surface-app)]/30'
                          : 'border-[var(--cs-border-subtle)] bg-[var(--cs-surface-app)]/50 hover:bg-white/5 hover:border-indigo-500/30'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <AgentAvatar
                          id={def.id}
                          size={18}
                          className="shrink-0 mt-0.5 text-[var(--cs-text-secondary)]"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[var(--cs-text-primary)]">
                              {def.role}
                            </span>
                            {alreadyAdded && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-[var(--cs-text-tertiary)]">
                                Added
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--cs-text-tertiary)] mt-0.5">
                            {def.subtitle}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {filteredCatalogAgents.length === 0 && (
                  <p className="text-xs text-[var(--cs-text-tertiary)] text-center py-4">
                    No agents match your search.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Remove agent confirmation ────────────────── */}
          {agentToRemove &&
            (() => {
              const deps = dependentTasks(agentToRemove);
              const agentName =
                crew.agents.find((a) => a.id === agentToRemove)?.role ?? 'this agent';
              return (
                <div className="mb-4 bg-[var(--cs-surface-card)] border border-red-500/30 rounded-xl p-4 space-y-3 animate-fadeIn">
                  <p className="text-sm text-[var(--cs-text-primary)]">
                    Remove <strong>{agentName}</strong>?
                  </p>
                  {deps.length > 0 && (
                    <div className="text-xs text-red-400 space-y-1">
                      <p className="font-medium">
                        This agent is assigned to {deps.length} task{deps.length > 1 ? 's' : ''}{' '}
                        that will lose their assignment:
                      </p>
                      <ul className="list-disc list-inside pl-1 text-[var(--cs-text-tertiary)]">
                        {deps.map((t) => (
                          <li key={t.id} className="truncate">
                            {t.description || t.id}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={confirmRemoveAgent}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors focus-ring"
                    >
                      {deps.length > 0 ? 'Remove anyway' : 'Yes, remove'}
                    </button>
                    <button
                      onClick={() => setAgentToRemove(null)}
                      className="px-3 py-1.5 rounded-lg bg-[var(--cs-surface-card)] border border-[var(--cs-border-subtle)] text-[var(--cs-text-secondary)] text-xs font-medium transition-colors hover:text-[var(--cs-text-primary)] focus-ring"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })()}

          {crew.agents.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {crew.agents.map((agent) => (
                <div
                  key={agent.id}
                  className="shrink-0 w-44 bg-[var(--cs-surface-card)] border border-[var(--cs-border-subtle)] rounded-xl p-4 relative group"
                >
                  {/* Remove button */}
                  <button
                    onClick={() => setAgentToRemove(agent.id)}
                    className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[var(--cs-text-tertiary)] hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all focus-ring"
                    aria-label={`Remove ${agent.role}`}
                    title="Remove agent"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white mb-3"
                    style={{ backgroundColor: agent.color }}
                  >
                    <AgentAvatar id={agent.id} size={20} fallback={agent.role} />
                  </div>
                  <p className="text-sm font-medium text-[var(--cs-text-primary)] truncate mb-1">
                    {agent.role}
                  </p>
                  {agent.tools.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {agent.tools.slice(0, 3).map((tool) => (
                        <span
                          key={tool}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-[var(--cs-text-tertiary)] border border-[var(--cs-border-subtle)]"
                        >
                          {tool}
                        </span>
                      ))}
                      {agent.tools.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] text-[var(--cs-text-tertiary)]">
                          +{agent.tools.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--cs-text-tertiary)]">No agents in this crew yet.</p>
          )}
        </section>

        {/* ── Workflows Section ────────────────────────────── */}
        <section className="mb-10 animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[var(--cs-text-primary)] uppercase tracking-wider">
              Workflows{' '}
              <span className="ml-2 text-xs font-normal text-[var(--cs-text-tertiary)]">
                ({(crew.workflows ?? []).length || crew.workflowIds.length})
              </span>
            </h2>
            <button
              onClick={() => navigate('/', { state: { crewId: crew.id } })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors focus-ring"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Workflow
            </button>
          </div>
          {(crew.workflows ?? []).length > 0 ? (
            <div className="space-y-3">
              {(crew.workflows ?? []).map((wf) => (
                <div
                  key={wf.id}
                  className="group bg-[var(--cs-surface-card)] border border-[var(--cs-border-subtle)] rounded-xl px-5 py-4 flex items-center justify-between transition-all hover:border-indigo-500/40 hover:-translate-y-0.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--cs-text-primary)] group-hover:text-indigo-300 transition-colors truncate">
                      {wf.name}
                    </p>
                    {wf.description && (
                      <p className="text-xs text-[var(--cs-text-tertiary)] mt-0.5 truncate">
                        {wf.description}
                      </p>
                    )}
                    <p className="text-[10px] text-[var(--cs-text-tertiary)] mt-1">
                      {crew.tasks.length} task{crew.tasks.length !== 1 ? 's' : ''} ·{' '}
                      {crew.agents.length} agent{crew.agents.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <button
                      onClick={() => {
                        const now = Date.now();
                        const preBuiltWorkflow: WorkflowState = {
                          id: wf.id,
                          name: wf.name,
                          description: wf.description,
                          crewId: crew.id,
                          agents: crew.agents.map((a) => ({ ...a, status: 'idle' as const })),
                          tasks: crew.tasks.map((t) => ({ ...t, status: 'pending' as const })),
                          discussionEdges: [],
                          status: 'draft',
                          createdAt: now,
                          updatedAt: now,
                        };
                        navigate(workflowPath(wf.id), { state: { workflow: preBuiltWorkflow } });
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 text-xs font-medium transition-colors focus-ring"
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
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Clone &amp; Run
                    </button>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-[var(--cs-text-tertiary)] group-hover:text-[var(--cs-text-primary)] transition-colors"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          ) : crew.workflowIds.length > 0 ? (
            <div className="space-y-3">
              {crew.workflowIds.map((wfId) => (
                <button
                  key={wfId}
                  type="button"
                  onClick={() => navigate(workflowPath(wfId))}
                  className="group w-full text-left bg-[var(--cs-surface-card)] border border-[var(--cs-border-subtle)] rounded-xl px-5 py-4 flex items-center justify-between transition-all hover:border-indigo-500/40 hover:-translate-y-0.5 focus-ring"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--cs-text-primary)] group-hover:text-indigo-300 transition-colors">
                      Workflow {wfId.slice(0, 8)}
                    </p>
                    <p className="text-xs text-[var(--cs-text-tertiary)] mt-0.5">
                      {crew.tasks.length} task{crew.tasks.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[var(--cs-text-tertiary)] group-hover:text-[var(--cs-text-primary)] transition-colors"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--cs-text-tertiary)]">
              No workflows yet. Create one to get started.
            </p>
          )}
        </section>

        {/* ── Danger Zone ──────────────────────────────────── */}
        <section className="pt-8 border-t border-[var(--cs-border-subtle)] animate-fadeIn">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-3">
              <p className="text-sm text-red-400">Are you sure? This cannot be undone.</p>
              <button
                onClick={handleDeleteCrew}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors focus-ring"
              >
                Yes, delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-lg bg-[var(--cs-surface-card)] border border-[var(--cs-border-subtle)] text-[var(--cs-text-secondary)] text-xs font-medium transition-colors hover:text-[var(--cs-text-primary)] focus-ring"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors focus-ring"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Delete Crew
            </button>
          )}
        </section>
      </main>
    </div>
  );
}
