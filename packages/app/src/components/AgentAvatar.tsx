/**
 * AgentAvatar — Unique geometric SVG icon for each hardcoded agent.
 * Renders at any size via a 24×24 viewBox. Falls back to a bold initial
 * when the agent ID is not in the catalog.
 */
import React from 'react';

interface AgentAvatarProps {
  /** Agent ID from the hardcoded catalog. */
  id: string;
  /** Icon size in pixels (default 20). */
  size?: number;
  /** Additional CSS classes — use text-white, text-indigo-300, etc. to tint. */
  className?: string;
  /** Fallback role name (first letter is shown when ID is not recognized). */
  fallback?: string | undefined;
}

/* ------------------------------------------------------------------ */
/* SVG icon map – each icon lives inside a 24×24 viewBox               */
/* ------------------------------------------------------------------ */

const ICONS: Record<string, React.ReactNode> = {
  /* ── Business & Product ────────────────────────────────────── */

  // Three ascending bars
  'agent-business-analyst': (
    <>
      <rect x="2" y="14" width="5" height="8" rx="1" fill="currentColor" opacity=".4" />
      <rect x="9.5" y="9" width="5" height="13" rx="1" fill="currentColor" opacity=".7" />
      <rect x="17" y="4" width="5" height="18" rx="1" fill="currentColor" />
    </>
  ),

  // Pen nib
  'agent-content-marketer': <path d="M15.5 2.5L21 8 8.5 20.5H3V15L15.5 2.5z" fill="currentColor" />,

  // Heart (connection)
  'agent-customer-success-manager': (
    <path
      d="M12 21c-.5-.4-8-6.3-8-11.7C4 5.9 6 4 8.5 4c1.4 0 2.7.7 3.5 1.7C12.8 4.7 14.1 4 15.5 4 18 4 20 5.9 20 9.3 20 14.7 12.5 20.6 12 21z"
      fill="currentColor"
    />
  ),

  // Shield
  'agent-legal-advisor': (
    <path d="M12 2L4 6v5c0 5.5 3.4 10.7 8 12 4.6-1.3 8-6.5 8-12V6l-8-4z" fill="currentColor" />
  ),

  // Key
  'agent-license-engineer': (
    <>
      <circle cx="8" cy="12" r="5" fill="currentColor" />
      <rect x="12" y="10.5" width="10" height="3" rx="1.5" fill="currentColor" />
      <rect x="18" y="13" width="2" height="3" rx=".5" fill="currentColor" />
    </>
  ),

  // Bullseye target
  'agent-product-manager': (
    <>
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity=".25" />
      <circle cx="12" cy="12" r="6.5" fill="currentColor" opacity=".5" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </>
  ),

  // Clipboard with lines
  'agent-project-manager': (
    <>
      <rect x="4" y="3" width="16" height="19" rx="2" fill="currentColor" opacity=".25" />
      <rect x="7.5" y="8" width="9" height="2" rx="1" fill="currentColor" />
      <rect x="7.5" y="12" width="7" height="2" rx="1" fill="currentColor" opacity=".7" />
      <rect x="7.5" y="16" width="5" height="2" rx="1" fill="currentColor" opacity=".5" />
    </>
  ),

  // Double-triangle arrow
  'agent-sales-engineer': (
    <>
      <path d="M3 20L12 4l9 16H3z" fill="currentColor" opacity=".3" />
      <path d="M7 20L12 10l5 10H7z" fill="currentColor" />
    </>
  ),

  // Hexagon (team sprint)
  'agent-scrum-master': <path d="M12 2l8.66 5v10L12 22l-8.66-5V7L12 2z" fill="currentColor" />,

  // Open book
  'agent-technical-writer': (
    <>
      <path
        d="M2 4h8c1.1 0 2 .9 2 2v14c-1-1-2.5-1.5-4-1.5H2V4z"
        fill="currentColor"
        opacity=".55"
      />
      <path d="M22 4h-8c-1.1 0-2 .9-2 2v14c1-1 2.5-1.5 4-1.5h6V4z" fill="currentColor" />
    </>
  ),

  // Eye
  'agent-ux-researcher': (
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" fill="currentColor" opacity=".35" />
      <circle cx="12" cy="12" r="4" fill="currentColor" />
    </>
  ),

  // Code brackets
  'agent-wordpress-master': (
    <>
      <path
        d="M9 4L3 12l6 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 4l6 8-6 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),

  /* ── Research & Analysis ───────────────────────────────────── */

  // Flask / beaker
  'agent-research-analyst': (
    <path
      d="M9 2h6v7l5 9.5c.6 1.2-.2 2.5-1.7 2.5H5.7c-1.5 0-2.3-1.3-1.7-2.5L9 9V2z"
      fill="currentColor"
    />
  ),

  // Radar rings
  'agent-search-specialist': (
    <>
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      <circle
        cx="12"
        cy="12"
        r="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity=".5"
      />
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity=".25"
      />
    </>
  ),

  // Lightning bolt
  'agent-trend-analyst': <path d="M13 2L4 14h7l-2 8 11-12h-7z" fill="currentColor" />,

  // Flag / banner
  'agent-competitive-analyst': (
    <>
      <rect x="3" y="2" width="2.5" height="20" rx="1" fill="currentColor" opacity=".45" />
      <path d="M5.5 4h13l-3.5 5 3.5 5H5.5V4z" fill="currentColor" />
    </>
  ),

  // Pie chart
  'agent-market-researcher': (
    <>
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity=".3" />
      <path d="M12 2a10 10 0 0110 10H12V2z" fill="currentColor" />
    </>
  ),

  // Diamond / gem
  'agent-project-idea-validator': <path d="M12 2L2 10l10 12 10-12L12 2z" fill="currentColor" />,

  // Stacked discs (database)
  'agent-data-researcher': (
    <>
      <ellipse cx="12" cy="5.5" rx="9" ry="3.5" fill="currentColor" />
      <ellipse cx="12" cy="12" rx="9" ry="3.5" fill="currentColor" opacity=".55" />
      <ellipse cx="12" cy="18.5" rx="9" ry="3.5" fill="currentColor" opacity=".25" />
    </>
  ),

  // Atom / orbitals
  'agent-scientific-literature-researcher': (
    <>
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <ellipse
        cx="12"
        cy="12"
        rx="10"
        ry="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        transform="rotate(60 12 12)"
      />
      <ellipse
        cx="12"
        cy="12"
        rx="10"
        ry="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        transform="rotate(120 12 12)"
      />
    </>
  ),
};

/* ------------------------------------------------------------------ */
/* Keyword → icon ID mapping for fuzzy role matching                    */
/* ------------------------------------------------------------------ */

const ROLE_KEYWORDS: Array<[string[], string]> = [
  // Business & Product
  [['business', 'analyst', 'requirements', 'stakeholder'], 'agent-business-analyst'],
  [
    ['content', 'marketer', 'marketing', 'copywriter', 'copy', 'writer', 'blog', 'editorial'],
    'agent-content-marketer',
  ],
  [['customer', 'success', 'support', 'onboarding', 'retention'], 'agent-customer-success-manager'],
  [['legal', 'lawyer', 'compliance', 'privacy', 'regulation'], 'agent-legal-advisor'],
  [['license', 'licensing', 'oss', 'ip'], 'agent-license-engineer'],
  [['product', 'manager', 'strategy', 'strategist', 'roadmap'], 'agent-product-manager'],
  [['project', 'manager', 'delivery', 'planning', 'coordinator'], 'agent-project-manager'],
  [['sales', 'engineer', 'pre-sales', 'demo'], 'agent-sales-engineer'],
  [['scrum', 'agile', 'sprint', 'kanban'], 'agent-scrum-master'],
  [['technical', 'writer', 'documentation', 'docs', 'editor', 'review'], 'agent-technical-writer'],
  [['ux', 'user', 'research', 'usability', 'persona'], 'agent-ux-researcher'],
  [['wordpress', 'cms', 'theme', 'plugin'], 'agent-wordpress-master'],
  // Research & Analysis
  [['research', 'analyst', 'investigation'], 'agent-research-analyst'],
  [
    ['search', 'specialist', 'retrieval', 'discovery', 'seo', 'keyword', 'optimization'],
    'agent-search-specialist',
  ],
  [['trend', 'forecast', 'signal', 'emerging'], 'agent-trend-analyst'],
  [['competitive', 'competitor', 'benchmark', 'swot'], 'agent-competitive-analyst'],
  [['market', 'researcher', 'consumer', 'segmentation'], 'agent-market-researcher'],
  [['idea', 'validator', 'mvp', 'validate', 'feasibility'], 'agent-project-idea-validator'],
  [['data', 'researcher', 'mining', 'dataset', 'statistical'], 'agent-data-researcher'],
  [
    ['scientific', 'literature', 'paper', 'evidence', 'systematic'],
    'agent-scientific-literature-researcher',
  ],
];

/** Match a role string to the best icon ID by keyword overlap. */
function matchRoleToIcon(role: string): string | null {
  const words = role.toLowerCase().split(/[\s\-_\/]+/);
  let bestId: string | null = null;
  let bestScore = 0;
  for (const [keywords, iconId] of ROLE_KEYWORDS) {
    let score = 0;
    for (const word of words) {
      for (const kw of keywords) {
        if (kw.includes(word) || word.includes(kw)) {
          score += 1;
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestId = iconId;
    }
  }
  return bestScore > 0 ? bestId : null;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function AgentAvatar({
  id,
  size = 20,
  className = '',
  fallback,
}: AgentAvatarProps): React.JSX.Element {
  // 1. Try exact ID match
  let icon = ICONS[id];

  // 2. Try fuzzy role match when exact ID misses
  if (!icon && fallback) {
    const matched = matchRoleToIcon(fallback);
    if (matched) icon = ICONS[matched];
  }

  if (!icon) {
    return (
      <span className={`font-bold leading-none ${className}`} style={{ fontSize: size * 0.55 }}>
        {fallback?.charAt(0).toUpperCase() ?? '?'}
      </span>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      {icon}
    </svg>
  );
}
