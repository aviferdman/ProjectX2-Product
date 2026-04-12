/**
 * SettingsPage — styled settings view with consistent Lovable-style branding.
 * TASK-131: Protected page scaffold.
 */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '@crewspace/ui';

const SETTINGS_SECTIONS = [
  {
    title: 'Profile',
    description: 'Manage your account preferences, display name, and avatar.',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    title: 'API Keys',
    description: 'Configure your LLM provider API keys for OpenAI, Anthropic, and others.',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
      </svg>
    ),
  },
  {
    title: 'Appearance',
    description: 'Customize the theme, colors, and layout of your workspace.',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
  },
  {
    title: 'Notifications',
    description: 'Control when and how you receive workflow status updates.',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
];

export function SettingsPage(): React.JSX.Element {
  const navigate = useNavigate();

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
              onClick={() => navigate('/dashboard')}
              className="text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring"
            >
              Projects
            </button>
            <button
              onClick={() => navigate('/templates')}
              className="text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring"
            >
              Templates
            </button>
            <span className="text-sm text-[var(--cs-text-primary)] font-medium">Settings</span>
          </nav>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-500 flex items-center justify-center text-xs font-bold text-[var(--cs-text-primary)]">
            D
          </div>
        </div>
      </header>

      <main data-testid="settings-page" className="max-w-4xl mx-auto px-6 py-8">
        <div className="animate-fadeInDown mb-8">
          <h1 className="text-2xl font-bold text-[var(--cs-text-primary)]">Settings</h1>
          <p className="text-sm text-[var(--cs-text-tertiary)] mt-1">
            Manage your account and workspace preferences
          </p>
        </div>
        <div className="flex flex-col gap-4 stagger-children">
          {SETTINGS_SECTIONS.map((section) => (
            <button
              key={section.title}
              className="w-full text-left card-hover rounded-xl border border-[var(--cs-border-subtle)] bg-white/[0.02] hover:bg-white/[0.05] hover:border-[var(--cs-border-default)] transition-all p-5 group focus-ring"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0 group-hover:bg-indigo-500/20 transition-colors">
                  {section.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold text-[var(--cs-text-primary)] group-hover:text-indigo-300 transition-colors">
                    {section.title}
                  </h2>
                  <p className="text-xs text-[var(--cs-text-tertiary)] mt-0.5">
                    {section.description}
                  </p>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-[var(--cs-text-tertiary)] group-hover:text-[var(--cs-text-secondary)] transition-colors flex-shrink-0 mt-1"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
