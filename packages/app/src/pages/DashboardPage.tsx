/**
 * DashboardPage — Projects list view showing all workflows.
 * Lovable-style: clean dark grid with search, filters, and stats.
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { workflowPath } from '../router/routes.js';

interface Project {
  id: string;
  name: string;
  description: string;
  agents: number;
  tasks: number;
  status: 'draft' | 'running' | 'completed' | 'failed';
  updatedAt: string;
}

const MOCK_PROJECTS: Project[] = [
  { id: 'proj-1', name: 'Mobile Game MVP Research', description: 'Market research in the mobile gaming industry', agents: 4, tasks: 5, status: 'completed', updatedAt: '2 hours ago' },
  { id: 'proj-2', name: 'SaaS Launch Campaign', description: 'Content marketing campaign for a SaaS product', agents: 6, tasks: 8, status: 'running', updatedAt: '1 day ago' },
  { id: 'proj-3', name: 'Competitor Analysis', description: 'Pricing strategy analysis in e-commerce', agents: 3, tasks: 4, status: 'draft', updatedAt: '3 days ago' },
  { id: 'proj-4', name: 'Customer Onboarding Flow', description: 'Automated onboarding workflow with follow-ups', agents: 5, tasks: 7, status: 'completed', updatedAt: '1 week ago' },
  { id: 'proj-5', name: 'AI Trends Summary', description: 'Board presentation on AI trends', agents: 2, tasks: 3, status: 'failed', updatedAt: '2 weeks ago' },
  { id: 'proj-6', name: 'QA Pipeline', description: 'Automated quality assurance for dev team', agents: 4, tasks: 6, status: 'draft', updatedAt: '2 weeks ago' },
];

const QUICK_STATS = [
  { label: 'Total Projects', value: '6', icon: '📁' },
  { label: 'Running', value: '1', icon: '🔄' },
  { label: 'Completed', value: '2', icon: '✅' },
  { label: 'Total Agents', value: '24', icon: '🤖' },
];

export function DashboardPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'draft' | 'running' | 'completed' | 'failed'>('all');

  const filtered = MOCK_PROJECTS.filter((p) => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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
            <span className="text-sm text-[var(--cs-text-primary)] font-medium">Projects</span>
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
              D
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* ── Header ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8 animate-fadeInDown">
          <div>
            <h1 className="text-2xl font-bold text-[var(--cs-text-primary)]">Projects</h1>
            <p className="text-sm text-[var(--cs-text-tertiary)] mt-1">Manage and monitor your AI agent workflows</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all shadow-lg shadow-violet-500/20 focus-ring"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Project
          </button>
        </div>

        {/* ── Quick Stats ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 stagger-children">
          {QUICK_STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-[var(--cs-border-subtle)] bg-white/[0.02] px-4 py-4 hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{stat.icon}</span>
                <span className="text-[11px] text-[var(--cs-text-tertiary)] uppercase tracking-wider font-medium">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-[var(--cs-text-primary)]">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* ── Search & Filter ──────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6 animate-fadeIn">
          <div className="flex-1 relative">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cs-text-tertiary)]">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              aria-label="Search projects"
              className="w-full bg-[var(--cs-surface-card)] border border-[var(--cs-border-default)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--cs-text-primary)] placeholder:text-[var(--cs-text-tertiary)] outline-none focus:border-violet-500/40 focus:shadow-sm focus:shadow-violet-500/10 transition-all"
            />
          </div>
          <div className="flex items-center bg-[var(--cs-surface-card)]/20 rounded-xl p-1 border border-[var(--cs-border-subtle)]">
            {(['all', 'draft', 'running', 'completed', 'failed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize focus-ring ${
                  filter === f ? 'bg-violet-600/20 text-violet-300 shadow-sm' : 'text-[var(--cs-text-tertiary)] hover:text-slate-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* ── Project Grid ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
          {filtered.map((project) => {
            const borderColor =
              project.status === 'completed' ? 'border-l-emerald-400' :
              project.status === 'running' ? 'border-l-amber-400' :
              project.status === 'failed' ? 'border-l-rose-400' :
              'border-l-slate-600';
            return (
              <button
                key={project.id}
                onClick={() => navigate(workflowPath(project.id))}
                className={`card-hover text-left rounded-xl border border-[var(--cs-border-subtle)] border-l-[3px] ${borderColor} bg-white/[0.02] hover:bg-white/[0.05] hover:border-[var(--cs-border-default)] transition-all p-5 group focus-ring`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 flex items-center justify-center group-hover:from-violet-500/30 group-hover:to-purple-500/30 transition-all">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(167 139 250)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <ProjectStatusBadge status={project.status} />
                </div>
                <h3 className="text-sm font-semibold text-[var(--cs-text-primary)] group-hover:text-violet-300 transition-colors mb-1.5 truncate">
                  {project.name}
                </h3>
                <p className="text-xs text-[var(--cs-text-tertiary)] mb-4 line-clamp-2">
                  {project.description}
                </p>
                <div className="flex items-center justify-between text-[11px] text-[var(--cs-text-tertiary)]">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="4" /><path d="M5 21v-2a7 7 0 0114 0v2" /></svg>
                      {project.agents} agents
                    </span>
                    <span className="flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                      {project.tasks} tasks
                    </span>
                  </div>
                  <span>{project.updatedAt}</span>
                </div>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 animate-fadeIn">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[var(--cs-surface-card)]/20 border border-[var(--cs-border-default)] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--cs-text-tertiary)]">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <p className="text-sm text-[var(--cs-text-secondary)] mb-1">No projects found</p>
            <p className="text-xs text-[var(--cs-text-tertiary)]">Try adjusting your search or filter</p>
          </div>
        )}
      </main>
    </div>
  );
}

function ProjectStatusBadge({ status }: { status: Project['status'] }): React.JSX.Element {
  const styles: Record<Project['status'], string> = {
    draft: 'bg-slate-500/15 text-[var(--cs-text-secondary)] border-slate-500/20',
    running: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    failed: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${styles[status]}`}>
      {status === 'running' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse mr-1.5 align-middle" />}
      {status}
    </span>
  );
}
