/**
 * MarketplacePage — styled marketplace browser view.
 * TASK-131: Protected page scaffold.
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  status: 'available' | 'coming-soon' | 'installed';
}

const MOCK_INTEGRATIONS: Integration[] = [
  { id: 'int-1', name: 'OpenAI GPT-4', description: 'Connect GPT-4 and GPT-4o models for advanced reasoning and generation.', category: 'LLM', icon: '🧠', status: 'available' },
  { id: 'int-2', name: 'Anthropic Claude', description: 'Use Claude 3.5 Sonnet for long-context analysis and safe AI outputs.', category: 'LLM', icon: '🤖', status: 'available' },
  { id: 'int-3', name: 'Web Search', description: 'Enable agents to search the web for real-time information.', category: 'Tools', icon: '🔍', status: 'installed' },
  { id: 'int-4', name: 'File System', description: 'Read and write files on your local machine or cloud storage.', category: 'Tools', icon: '📁', status: 'installed' },
  { id: 'int-5', name: 'Slack', description: 'Send workflow results and notifications to Slack channels.', category: 'Communication', icon: '💬', status: 'available' },
  { id: 'int-6', name: 'GitHub', description: 'Create PRs, review code, and manage repos from your workflows.', category: 'DevTools', icon: '🐙', status: 'available' },
  { id: 'int-7', name: 'Notion', description: 'Sync workflow outputs to Notion pages and databases.', category: 'Productivity', icon: '📝', status: 'coming-soon' },
  { id: 'int-8', name: 'Google Sheets', description: 'Read data from and write results to Google Sheets.', category: 'Productivity', icon: '📊', status: 'coming-soon' },
  { id: 'int-9', name: 'Jira', description: 'Create and manage Jira issues from workflow task outputs.', category: 'DevTools', icon: '📌', status: 'coming-soon' },
];

export function MarketplacePage(): React.JSX.Element {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const categories = ['all', ...new Set(MOCK_INTEGRATIONS.map((i) => i.category))];

  const filtered = MOCK_INTEGRATIONS.filter((i) => {
    if (category !== 'all' && i.category !== category) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
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
            <button onClick={() => navigate('/dashboard')} className="text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring">Projects</button>
            <button onClick={() => navigate('/templates')} className="text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring">Templates</button>
            <span className="text-sm text-[var(--cs-text-primary)] font-medium">Marketplace</span>
          </nav>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center text-xs font-bold text-[var(--cs-text-primary)]">
            D
          </div>
        </div>
      </header>

      <main
        data-testid="marketplace-page"
        className="max-w-6xl mx-auto px-6 py-8"
      >
        <div className="animate-fadeInDown mb-8">
          <h1 className="text-2xl font-bold text-[var(--cs-text-primary)]">Marketplace</h1>
          <p className="text-sm text-[var(--cs-text-tertiary)] mt-1">
            Discover integrations, tools, and LLM providers for your workflows.
          </p>
        </div>

        {/* Search & Category Filter */}
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
              placeholder="Search integrations..."
              aria-label="Search integrations"
              className="w-full bg-[var(--cs-surface-card)] border border-[var(--cs-border-default)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--cs-text-primary)] placeholder:text-[var(--cs-text-tertiary)] outline-none focus:border-violet-500/40 focus:shadow-sm focus:shadow-violet-500/10 transition-all"
            />
          </div>
          <div className="flex items-center bg-[var(--cs-surface-card)]/20 rounded-xl p-1 border border-[var(--cs-border-subtle)] overflow-x-auto">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize whitespace-nowrap focus-ring ${
                  category === c ? 'bg-violet-600/20 text-violet-300 shadow-sm' : 'text-[var(--cs-text-tertiary)] hover:text-slate-300'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Integration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
          {filtered.map((integration) => (
            <div
              key={integration.id}
              className="card-hover rounded-xl border border-[var(--cs-border-subtle)] bg-white/[0.02] hover:bg-white/[0.05] hover:border-[var(--cs-border-default)] transition-all p-5 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--cs-surface-card)]/20 border border-[var(--cs-border-default)] flex items-center justify-center text-xl">
                  {integration.icon}
                </div>
                <IntegrationBadge status={integration.status} />
              </div>
              <h3 className="text-sm font-semibold text-[var(--cs-text-primary)] group-hover:text-violet-300 transition-colors mb-1.5">
                {integration.name}
              </h3>
              <p className="text-xs text-[var(--cs-text-tertiary)] mb-3 line-clamp-2">
                {integration.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--cs-text-tertiary)] uppercase tracking-wider font-medium">{integration.category}</span>
                {integration.status === 'available' && (
                  <button className="px-3 py-1 rounded-lg bg-violet-600/20 border border-violet-500/30 text-[10px] font-semibold text-violet-300 hover:bg-violet-600/30 transition-colors focus-ring">
                    Install
                  </button>
                )}
                {integration.status === 'installed' && (
                  <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400">
                    Installed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function IntegrationBadge({ status }: { status: Integration['status'] }): React.JSX.Element {
  const styles: Record<Integration['status'], string> = {
    available: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
    installed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    'coming-soon': 'bg-slate-500/15 text-[var(--cs-text-secondary)] border-slate-500/20',
  };
  const labels: Record<Integration['status'], string> = {
    available: 'available',
    installed: 'installed',
    'coming-soon': 'coming soon',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
