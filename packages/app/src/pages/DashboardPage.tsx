/**
 * DashboardPage — Projects list view showing all workflows.
 * Lovable-style: clean dark grid with search and filters.
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
  { id: 'proj-5', name: 'AI Trends Summary', description: 'Board presentation on AI trends', agents: 2, tasks: 3, status: 'draft', updatedAt: '2 weeks ago' },
];

export function DashboardPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'draft' | 'running' | 'completed'>('all');

  const filtered = MOCK_PROJECTS.filter((p) => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Top Nav */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-white tracking-tight">CrewSpace</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <span className="text-sm text-white font-medium">Projects</span>
          <button onClick={() => navigate('/templates')} className="text-sm text-slate-400 hover:text-white transition-colors">Templates</button>
          <button onClick={() => navigate('/marketplace')} className="text-sm text-slate-400 hover:text-white transition-colors">Marketplace</button>
        </nav>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center text-xs font-bold text-white">
          D
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all shadow-lg shadow-violet-500/20"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Project
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 relative">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-violet-500/40 transition-colors"
            />
          </div>
          <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/5">
            {(['all', 'draft', 'running', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
                  filter === f ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((project) => (
            <button
              key={project.id}
              onClick={() => navigate(workflowPath(project.id))}
              className="text-left rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all p-4 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(167 139 250)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <ProjectStatusBadge status={project.status} />
              </div>
              <h3 className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors mb-1 truncate">
                {project.name}
              </h3>
              <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                {project.description}
              </p>
              <div className="flex items-center gap-3 text-[10px] text-slate-600">
                <span>{project.agents} agents</span>
                <span>·</span>
                <span>{project.tasks} tasks</span>
                <span className="flex-1" />
                <span>{project.updatedAt}</span>
              </div>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-slate-500">No projects found</p>
          </div>
        )}
      </main>
    </div>
  );
}

function ProjectStatusBadge({ status }: { status: Project['status'] }): React.JSX.Element {
  const styles: Record<Project['status'], string> = {
    draft: 'bg-slate-500/20 text-slate-400',
    running: 'bg-amber-500/20 text-amber-400 animate-pulse',
    completed: 'bg-emerald-500/20 text-emerald-400',
    failed: 'bg-rose-500/20 text-rose-400',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}
