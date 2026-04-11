import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCrewStore } from '../../store/index.js';
import { ROUTES, workflowPath } from '../../router/routes.js';

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
  const { getCrewById, updateCrew, deleteCrew } = useCrewStore();

  const crew = crewId ? getCrewById(crewId) : undefined;

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(crew?.name ?? '');
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState(crew?.description ?? '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!crew) {
    return (
      <div className="min-h-screen bg-[var(--cs-surface-app)] flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <h2 className="text-lg font-semibold text-[var(--cs-text-primary)] mb-2">Crew not found</h2>
          <p className="text-sm text-[var(--cs-text-tertiary)] mb-4">The crew you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            to={ROUTES.CREWS}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors focus-ring"
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

  return (
    <div className="min-h-screen bg-[var(--cs-surface-app)] scrollbar-thin">
      {/* ── Sticky Glass Nav ─────────────────────────────────── */}
      <header className="glass sticky top-0 z-50 border-b border-[var(--cs-border-subtle)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 focus-ring rounded-lg">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
            <button onClick={() => navigate('/')} className="text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring">Home</button>
            <button onClick={() => navigate('/crews')} className="text-sm text-[var(--cs-text-primary)] font-medium focus-ring">My Crews</button>
            <button onClick={() => navigate('/templates')} className="text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring">Templates</button>
            <button onClick={() => navigate('/marketplace')} className="text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring">Marketplace</button>
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/settings')} className="p-2 rounded-lg text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] hover:bg-[var(--cs-surface-card)]/20 transition-colors focus-ring" aria-label="Settings">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center text-xs font-bold text-[var(--cs-text-primary)]">
              U
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Back link */}
        <Link to={ROUTES.CREWS} className="inline-flex items-center gap-1.5 text-sm text-[var(--cs-text-tertiary)] hover:text-[var(--cs-text-primary)] transition-colors mb-6">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Crews
        </Link>

        {/* ── Crew Header ──────────────────────────────────── */}
        <div className="mb-10 animate-fadeInDown">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: crew.color }} />
            {editingName ? (
              <input
                autoFocus
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitName();
                  if (e.key === 'Escape') { setNameValue(crew.name); setEditingName(false); }
                }}
                className="text-2xl font-bold bg-transparent text-[var(--cs-text-primary)] border-b-2 border-violet-500 outline-none w-full"
              />
            ) : (
              <h1
                onClick={() => { setNameValue(crew.name); setEditingName(true); }}
                className="text-2xl font-bold text-[var(--cs-text-primary)] cursor-text hover:text-violet-300 transition-colors"
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
                if (e.key === 'Escape') { setDescValue(crew.description); setEditingDesc(false); }
              }}
              rows={2}
              className="w-full text-sm bg-transparent text-[var(--cs-text-secondary)] border-b border-violet-500/50 outline-none resize-none mt-1"
            />
          ) : (
            <p
              onClick={() => { setDescValue(crew.description); setEditingDesc(true); }}
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
          <h2 className="text-sm font-semibold text-[var(--cs-text-primary)] uppercase tracking-wider mb-4">
            Agents <span className="ml-2 text-xs font-normal text-[var(--cs-text-tertiary)]">({crew.agents.length})</span>
          </h2>
          {crew.agents.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {crew.agents.map((agent) => (
                <div key={agent.id} className="shrink-0 w-44 bg-[var(--cs-surface-card)] border border-[var(--cs-border-subtle)] rounded-xl p-4">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white mb-3"
                    style={{ backgroundColor: agent.color }}
                  >
                    {agent.role.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm font-medium text-[var(--cs-text-primary)] truncate mb-1">{agent.role}</p>
                  {agent.tools.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {agent.tools.slice(0, 3).map((tool) => (
                        <span key={tool} className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-[var(--cs-text-tertiary)] border border-[var(--cs-border-subtle)]">
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
              Workflows <span className="ml-2 text-xs font-normal text-[var(--cs-text-tertiary)]">({crew.workflowIds.length})</span>
            </h2>
            <button
              onClick={() => navigate('/', { state: { crewId: crew.id } })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors focus-ring"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Workflow
            </button>
          </div>
          {crew.workflowIds.length > 0 ? (
            <div className="space-y-3">
              {crew.workflowIds.map((wfId) => (
                <button
                  key={wfId}
                  type="button"
                  onClick={() => navigate(workflowPath(wfId))}
                  className="group w-full text-left bg-[var(--cs-surface-card)] border border-[var(--cs-border-subtle)] rounded-xl px-5 py-4 flex items-center justify-between transition-all hover:border-violet-500/40 hover:-translate-y-0.5 focus-ring"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--cs-text-primary)] group-hover:text-violet-300 transition-colors">
                      Workflow {wfId.slice(0, 8)}
                    </p>
                    <p className="text-xs text-[var(--cs-text-tertiary)] mt-0.5">{crew.tasks.length} task{crew.tasks.length !== 1 ? 's' : ''}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--cs-text-tertiary)] group-hover:text-[var(--cs-text-primary)] transition-colors">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--cs-text-tertiary)]">No workflows yet. Create one to get started.</p>
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
