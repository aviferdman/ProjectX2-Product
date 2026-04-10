/**
 * HomePage — Lovable-style prompt-first landing page.
 * Users describe their initiative and CrewSpace generates an agent workflow.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workflowPath } from '../router/routes.js';

const EXAMPLE_PROMPTS = [
  'Conduct market research in the mobile gaming industry — identify user needs and MVP strategy',
  'Create a content marketing campaign for a SaaS product launch',
  'Analyze competitor pricing strategies in the e-commerce space',
  'Build a customer onboarding workflow with automated follow-ups',
  'Research and summarize the latest AI trends for a board presentation',
  'Design a quality assurance pipeline for a software development team',
];

const RECENT_PROJECTS = [
  { id: 'proj-1', name: 'Mobile Game MVP Research', agents: 4, status: 'completed' as const, updatedAt: '2 hours ago' },
  { id: 'proj-2', name: 'SaaS Launch Campaign', agents: 6, status: 'running' as const, updatedAt: '1 day ago' },
  { id: 'proj-3', name: 'Competitor Analysis Pipeline', agents: 3, status: 'draft' as const, updatedAt: '3 days ago' },
];

export function HomePage(): React.JSX.Element {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Rotate placeholder text
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % EXAMPLE_PROMPTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }
  }, [prompt]);

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    // Simulate workflow generation — in production this calls the orchestration engine
    await new Promise((r) => setTimeout(r, 1500));
    const workflowId = `wf-${Date.now()}`;
    setIsGenerating(false);
    navigate(workflowPath(workflowId), { state: { prompt: prompt.trim() } });
  }, [prompt, isGenerating, navigate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleExampleClick = useCallback((example: string) => {
    setPrompt(example);
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col">
      {/* Top Nav */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-white tracking-tight">CrewSpace</span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Projects
          </button>
          <button
            onClick={() => navigate('/templates')}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Templates
          </button>
          <button
            onClick={() => navigate('/marketplace')}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Marketplace
          </button>
        </nav>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center text-xs font-bold text-white">
            D
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-24">
        {/* Hero */}
        <div className="text-center mb-10 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Orchestrate your{' '}
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              AI agents
            </span>
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            Describe what you need and CrewSpace will assemble the perfect team of AI agents to get it done.
          </p>
        </div>

        {/* Prompt Input Card */}
        <div className="w-full max-w-2xl">
          <div className="relative rounded-2xl border border-white/10 bg-[#0f172a] shadow-2xl shadow-violet-500/5 overflow-hidden transition-all duration-300 focus-within:border-violet-500/40 focus-within:shadow-violet-500/10">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={EXAMPLE_PROMPTS[placeholderIndex]}
              rows={1}
              className="w-full bg-transparent text-white placeholder:text-slate-500 text-base leading-relaxed px-5 pt-5 pb-14 resize-none outline-none min-h-[56px] max-h-[200px]"
            />
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-[#0f172a]/80 backdrop-blur-sm border-t border-white/5">
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors" title="Attach file">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>
                <button className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors" title="Use template">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                </button>
              </div>
              <button
                onClick={handleSubmit}
                disabled={!prompt.trim() || isGenerating}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/40 disabled:cursor-not-allowed text-white text-sm font-medium transition-all duration-200 shadow-lg shadow-violet-500/25"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    Build
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Example prompts */}
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {EXAMPLE_PROMPTS.slice(0, 3).map((example) => (
              <button
                key={example}
                onClick={() => handleExampleClick(example)}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 max-w-[250px] truncate"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Projects */}
        {RECENT_PROJECTS.length > 0 && (
          <div className="w-full max-w-2xl mt-16">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-slate-400">Recent projects</h2>
              <button
                onClick={() => navigate('/dashboard')}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                View all
              </button>
            </div>
            <div className="space-y-2">
              {RECENT_PROJECTS.map((project) => (
                <button
                  key={project.id}
                  onClick={() => navigate(workflowPath(project.id))}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-200 group"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(167 139 250)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors truncate">
                      {project.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {project.agents} agents · {project.updatedAt}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusDot status={project.status} />
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-600 group-hover:text-slate-400 transition-colors">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-white/5 flex items-center justify-center">
        <p className="text-xs text-slate-600">
          CrewSpace — AI Agent Orchestration Platform
        </p>
      </footer>
    </div>
  );
}

function StatusDot({ status }: { status: 'completed' | 'running' | 'draft' }): React.JSX.Element {
  const colors = {
    completed: 'bg-emerald-400',
    running: 'bg-amber-400 animate-pulse',
    draft: 'bg-slate-500',
  };
  return <span className={`w-2 h-2 rounded-full ${colors[status]}`} />;
}
