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
  { id: 'proj-1', name: 'Mobile Game MVP Research', agents: 4, tasks: 5, completedTasks: 5, status: 'completed' as const, updatedAt: '2 hours ago' },
  { id: 'proj-2', name: 'SaaS Launch Campaign', agents: 6, tasks: 8, completedTasks: 3, status: 'running' as const, updatedAt: '1 day ago' },
  { id: 'proj-3', name: 'Competitor Analysis Pipeline', agents: 3, tasks: 4, completedTasks: 0, status: 'draft' as const, updatedAt: '3 days ago' },
];

const HOW_IT_WORKS = [
  {
    num: 1,
    title: 'Start with an idea',
    description: 'Describe your initiative in plain language — no setup, no config, just your vision.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    num: 2,
    title: 'Watch it come to life',
    description: 'CrewSpace assembles specialized AI agents, wires them together, and builds your workflow in seconds.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="10 8 16 12 10 16 10 8" />
      </svg>
    ),
  },
  {
    num: 3,
    title: 'Refine and ship',
    description: 'Iterate on the result, tweak agent roles and hand-offs, then run your workflow at scale.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
];

const STATS = [
  { value: '50+', label: 'Agents Available' },
  { value: '10K+', label: 'Workflows Built' },
  { value: '5M+', label: 'Tasks Completed' },
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
    <div className="min-h-screen bg-[var(--cs-surface-app)] flex flex-col scrollbar-thin">
      {/* ── Sticky Glass Nav ─────────────────────────────────── */}
      <header className="glass sticky top-0 z-50 border-b border-[var(--cs-border-subtle)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center animate-pulseGlow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-[var(--cs-text-primary)] tracking-tight">
              <span className="gradient-text">Crew</span>Space
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => navigate('/dashboard')} className="text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring">Projects</button>
            <button onClick={() => navigate('/templates')} className="text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring">Templates</button>
            <button onClick={() => navigate('/marketplace')} className="text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring">Marketplace</button>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={() => textareaRef.current?.focus()}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all shadow-lg shadow-violet-500/25 focus-ring"
            >
              Get Started
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center text-xs font-bold text-[var(--cs-text-primary)]">
              D
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="hero-glow relative overflow-hidden pt-20 md:pt-32 pb-8">
        <div className="text-center max-w-3xl mx-auto px-6">
          <h1 className="animate-fadeInUp text-4xl md:text-6xl font-extrabold text-[var(--cs-text-primary)] tracking-tight leading-tight mb-6">
            Build something{' '}
            <span className="gradient-text">extraordinary</span>
            <br className="hidden md:block" />
            {' '}with AI agents
          </h1>
          <p className="animate-fadeInUp text-lg md:text-xl text-[var(--cs-text-secondary)] leading-relaxed max-w-xl mx-auto" style={{ animationDelay: '120ms' }}>
            Describe what you need and CrewSpace will assemble the perfect team of AI agents to get it done.
          </p>
        </div>
      </section>

      {/* ── Prompt Input Card ────────────────────────────────── */}
      <section className="max-w-2xl w-full mx-auto px-4 -mt-2 animate-fadeInUp" style={{ animationDelay: '240ms' }}>
        <div className="relative rounded-2xl border border-[var(--cs-border-default)] bg-[var(--cs-surface-panel)] shadow-2xl shadow-violet-500/5 overflow-hidden transition-all duration-300 focus-within:border-violet-500/40 focus-within:shadow-violet-500/10 focus-within:shadow-2xl">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={EXAMPLE_PROMPTS[placeholderIndex]}
            rows={1}
            aria-label="Describe your initiative"
            className="w-full bg-transparent text-[var(--cs-text-primary)] placeholder:text-[var(--cs-text-tertiary)] text-base leading-relaxed px-5 pt-5 pb-14 resize-none outline-none min-h-[56px] max-h-[200px]"
          />
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 glass-subtle border-t border-[var(--cs-border-subtle)]">
            <div className="flex items-center gap-2">
              <button className="p-1.5 rounded-lg text-[var(--cs-text-tertiary)] hover:text-slate-300 hover:bg-[var(--cs-surface-card)]/20 transition-colors focus-ring" title="Attach file" aria-label="Attach file">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                </svg>
              </button>
              <button className="p-1.5 rounded-lg text-[var(--cs-text-tertiary)] hover:text-slate-300 hover:bg-[var(--cs-surface-card)]/20 transition-colors focus-ring" title="Use template" aria-label="Use template">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </button>
              <span className="hidden sm:inline text-[11px] text-[var(--cs-text-tertiary)] ml-1">
                <kbd className="px-1.5 py-0.5 rounded border border-[var(--cs-border-default)] bg-[var(--cs-surface-card)] font-mono text-[10px] text-[var(--cs-text-secondary)]">Enter</kbd> to build
              </span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isGenerating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/40 disabled:cursor-not-allowed text-white text-sm font-medium transition-all duration-200 shadow-lg shadow-violet-500/25 focus-ring"
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
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl mx-auto animate-fadeInUp" style={{ animationDelay: '360ms' }}>
          {EXAMPLE_PROMPTS.slice(0, 4).map((example) => (
            <button
              key={example}
              onClick={() => handleExampleClick(example)}
              className="card-hover px-3.5 py-2 rounded-xl bg-[var(--cs-surface-card)] border border-[var(--cs-border-default)] text-xs text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] hover:border-violet-500/30 transition-all duration-200 text-left leading-relaxed focus-ring"
            >
              {example}
            </button>
          ))}
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 mt-28">
        <h2 className="animate-fadeInUp text-center text-2xl md:text-3xl font-bold text-[var(--cs-text-primary)] tracking-tight mb-14">
          How it works
        </h2>
        <div className="stagger-children grid grid-cols-1 md:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.num} className="flex flex-col items-start text-left rounded-xl border border-[var(--cs-border-subtle)] bg-white/[0.02] p-5 group hover:bg-white/[0.04] hover:border-[var(--cs-border-default)] transition-all">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-semibold text-violet-400">{step.num}.</span>
                <h3 className="text-sm font-semibold text-[var(--cs-text-primary)]">{step.title}</h3>
              </div>
              <p className="text-sm text-[var(--cs-text-secondary)] leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Platform Metrics ─────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 mt-24">
        <div className="flex items-center justify-center gap-8 md:gap-14 py-6 animate-fadeIn">
          {STATS.map((stat, i) => (
            <React.Fragment key={stat.label}>
              {i > 0 && <div className="w-px h-8 bg-[var(--cs-border-subtle)]" />}
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl md:text-3xl font-bold text-[var(--cs-text-primary)] tabular-nums">{stat.value}</span>
                <span className="text-[11px] text-[var(--cs-text-tertiary)] tracking-wide uppercase">{stat.label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ── Recent Projects ──────────────────────────────────── */}
      {RECENT_PROJECTS.length > 0 && (
        <section className="max-w-3xl mx-auto px-6 mt-24 w-full">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-[var(--cs-text-secondary)]">Pick up where you left off</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-xs text-[var(--cs-text-tertiary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring"
            >
              All projects
            </button>
          </div>
          <div className="stagger-children grid grid-cols-1 sm:grid-cols-3 gap-3">
            {RECENT_PROJECTS.map((project) => {
              const initials = project.name.split(' ').map((w) => w[0]).join('').slice(0, 2);
              const bgColor = project.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : project.status === 'running' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-slate-500/10 text-slate-400 border-slate-500/20';
              const progress = project.tasks > 0 ? (project.completedTasks / project.tasks) * 100 : 0;
              return (
                <button
                  key={project.id}
                  onClick={() => navigate(workflowPath(project.id))}
                  className="card-hover text-left rounded-xl bg-white/[0.02] border border-[var(--cs-border-subtle)] hover:bg-white/[0.05] hover:border-[var(--cs-border-default)] transition-all duration-200 p-4 group focus-ring"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs font-bold flex-shrink-0 ${bgColor}`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--cs-text-primary)] group-hover:text-violet-300 transition-colors truncate">
                        {project.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[var(--cs-text-tertiary)]">
                    <span>{project.agents} agents · {project.tasks} tasks</span>
                    <span>{project.updatedAt}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2.5 w-full h-1 rounded-full bg-[var(--cs-surface-card)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        project.status === 'completed' ? 'bg-emerald-500'
                          : project.status === 'running' ? 'bg-amber-400'
                          : 'bg-slate-600'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="mt-32 px-6 py-8 border-t border-[var(--cs-border-subtle)] flex items-center justify-center">
        <p className="text-xs text-[var(--cs-text-tertiary)]">
          © {new Date().getFullYear()} CrewSpace — AI Agent Orchestration Platform
        </p>
      </footer>
    </div>
  );
}
