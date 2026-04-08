# Crewspace Web App — Information Architecture

> **TASK-128** · P0 · UX/UI · Phase 2  
> Defines the overall structure, navigation hierarchy, and content organization for the Crewspace web application.

---

## 1. Product Vision

Crewspace Phase 2 transforms the CLI-first agent orchestration framework into a **visual web application** that lets users build, debug, deploy, and manage multi-agent workflows through an intuitive graphical interface. The IA must support four user archetypes:

| Archetype | Description | Primary flows |
|-----------|-------------|---------------|
| **Explorer** | New user evaluating Crewspace | Onboarding → Templates → First workflow |
| **Builder** | Active developer creating workflows | Canvas → Properties → Run → Debug |
| **Operator** | Managing running workflows at scale | Dashboard → Usage stats → Logs |
| **Extender** | Adding integrations and custom tools | Marketplace → OAuth → Canvas |

---

## 2. Global Navigation Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]  Dashboard  Canvas  Templates  Marketplace   [User ▾]  │
└─────────────────────────────────────────────────────────────────┘
```

### Primary navigation (top bar)

| Item | Route | Description |
|------|-------|-------------|
| **Logo / Home** | `/` | Redirect → `/dashboard` (authenticated) or `/login` (unauthenticated) |
| **Dashboard** | `/dashboard` | Workflow list, usage stats, quick actions |
| **Canvas** | `/canvas/:workflowId` | Visual workflow editor (opens specific workflow) |
| **Templates** | `/templates` | Browse, preview, and instantiate template workflows |
| **Marketplace** | `/marketplace` | Discover and install third-party integrations |
| **User menu** | — | Profile, settings, plan & billing, sign out |

### Secondary navigation (contextual)

Appears within specific sections as tabs or sidebar sub-navigation:

| Context | Secondary items |
|---------|-----------------|
| Dashboard | My Workflows · Recent · Usage |
| Canvas | Sidebar (node library) · Properties panel · Minimap |
| Templates | All · By Category · My Templates |
| Marketplace | All · Installed · Categories |
| Settings | Profile · API Keys · Team · Plan & Billing |

---

## 3. Site Map

```
Root (/)
├── /login
├── /signup
├── /onboarding                      ← First-time user experience
│   ├── /onboarding/welcome
│   ├── /onboarding/connect-llm
│   ├── /onboarding/first-workflow
│   └── /onboarding/complete
│
├── /dashboard                       ← Authenticated home
│   ├── /dashboard/workflows         ← List/grid of user workflows
│   ├── /dashboard/usage             ← Usage statistics & limits
│   └── /dashboard/recent            ← Recently edited workflows
│
├── /canvas/:workflowId              ← Visual workflow editor
│   ├── [Sidebar — node library]
│   ├── [Canvas viewport]
│   ├── [Properties panel]
│   ├── [Toolbar]
│   └── [Minimap]
│
├── /canvas/:workflowId/debug        ← Debugging timeline for a run
│   ├── [Timeline chart]
│   ├── [Log viewer]
│   ├── [Filters]
│   └── [Playback controls]
│
├── /templates                       ← Template library
│   ├── /templates/:templateId       ← Template detail / preview
│   └── /templates/:templateId/use   ← Instantiate into user account
│
├── /marketplace                     ← Integration marketplace
│   ├── /marketplace/:integrationId  ← Integration detail
│   └── /marketplace/:integrationId/connect  ← OAuth flow
│
├── /settings                        ← User settings
│   ├── /settings/profile
│   ├── /settings/api-keys
│   ├── /settings/team
│   └── /settings/billing
│
└── /docs (external link)            ← Documentation site
```

---

## 4. Content Hierarchy per Section

### 4.1 Dashboard

```
Dashboard
├── Header
│   ├── Page title: "My Workflows"
│   ├── Search input (filter workflows)
│   └── Actions: [+ New Workflow] [Import]
├── View toggle: Grid | List
├── Workflow cards/rows
│   ├── Thumbnail (canvas preview)
│   ├── Name
│   ├── Last edited (relative time)
│   ├── Status badge (draft / active / error)
│   ├── Agent count
│   └── Actions: Edit · Duplicate · Delete · Run
├── Usage summary card
│   ├── Runs this month: X / limit
│   ├── Active workflows: Y
│   └── [Upgrade] CTA (if near limit)
└── Empty state
    ├── Illustration
    ├── "Create your first workflow"
    └── [+ New Workflow] [Browse Templates]
```

### 4.2 Canvas (Workflow Editor)

```
Canvas
├── Toolbar (48px top bar)
│   ├── Add nodes: +Agent, +Task, +Tool, +LLM
│   ├── Canvas controls: Select, Hand, Zoom +/-, Fit
│   ├── Actions: Undo, Redo, Delete
│   ├── View toggles: Grid, Minimap, Snap
│   ├── Run: ▶ Run Workflow, ■ Stop
│   └── Menu: Save, Export, Settings
├── Sidebar (280px left — collapsible)
│   ├── Search (Cmd+K)
│   ├── Node categories
│   │   ├── Agents (violet)
│   │   ├── Tasks (sky)
│   │   ├── Tools (emerald)
│   │   └── LLM Providers (amber)
│   ├── Templates section
│   └── Recently used
├── Canvas viewport (center, infinite scroll)
│   ├── Nodes (Agent, Task, Tool, LLM)
│   ├── Edges (connections between nodes)
│   ├── Selection state (highlight, multi-select)
│   └── Minimap (bottom-right, 200×140px)
└── Properties panel (320px right — contextual)
    ├── Node header (type icon, name, close)
    ├── General section (name, role, goal)
    ├── Configuration section (LLM, temperature, tools)
    ├── Connections section (linked nodes)
    ├── Advanced section (retries, timeout)
    └── Empty state (workflow-level props, shortcuts)
```

### 4.3 Debugging Timeline

```
Debug Timeline
├── Header
│   ├── Workflow name + run ID
│   ├── Run status badge (running / success / failed)
│   ├── Duration
│   └── Actions: [Export Logs] [Re-run]
├── Filters bar
│   ├── Agent filter (multi-select dropdown)
│   ├── Event type filter (LLM call, tool use, task start/end, error)
│   ├── Log level filter (debug, info, warn, error)
│   ├── Time range (slider or start/end inputs)
│   └── Search (free text)
├── Timeline chart (horizontal, time axis)
│   ├── Agent lanes (one row per agent)
│   ├── Event markers (colored by type)
│   ├── Duration bars (task execution spans)
│   ├── Error indicators (red markers)
│   └── Zoom controls (scroll, pinch)
├── Log viewer (below or side panel)
│   ├── Structured log entries
│   │   ├── Timestamp
│   │   ├── Agent badge
│   │   ├── Event type icon
│   │   ├── Message (with syntax highlighting for JSON/code)
│   │   └── Expand for details (full LLM prompt/response)
│   └── Virtual scroll (for large log sets)
└── Playback controls (bottom bar)
    ├── ◀◀ Start | ◀ Step back | ▶ Play/Pause | ▶ Step forward | ▶▶ End
    ├── Speed: 1x, 2x, 4x
    └── Current timestamp indicator
```

### 4.4 Template Library

```
Templates
├── Header
│   ├── Page title: "Template Library"
│   ├── Search input
│   └── Category filter chips
├── Template grid
│   ├── Template cards
│   │   ├── Thumbnail (workflow diagram preview)
│   │   ├── Title
│   │   ├── Description (2-line clamp)
│   │   ├── Tags (category, difficulty, agent count)
│   │   ├── Author / official badge
│   │   └── [Use Template] CTA
│   └── Pagination or infinite scroll
├── Template detail modal (on card click)
│   ├── Full workflow diagram (interactive preview)
│   ├── Description (markdown rendered)
│   ├── Agent list with roles
│   ├── Required integrations
│   ├── Estimated run time
│   └── [Use Template] → creates copy in user's account
└── Empty state (no matches)
    └── "No templates match your search"
```

### 4.5 Marketplace

```
Marketplace
├── Header
│   ├── Page title: "Integrations"
│   ├── Search input
│   └── Category filter (Tools, LLM Providers, Data Sources)
├── Section: Installed
│   └── Integration cards (compact, with status indicators)
├── Section: Available
│   ├── Integration cards
│   │   ├── Logo / icon
│   │   ├── Name
│   │   ├── Description
│   │   ├── Category badge
│   │   ├── Status (installed / not installed / requires auth)
│   │   └── [Install] or [Connected ✓]
│   └── Pagination
├── Integration detail page
│   ├── Hero (logo, name, publisher)
│   ├── Description (markdown)
│   ├── Configuration requirements
│   ├── OAuth connect button (if applicable)
│   ├── Supported agent types
│   └── [Install] / [Uninstall]
└── OAuth flow (modal or redirect)
    ├── Consent screen
    ├── Loading / connecting state
    └── Success confirmation
```

---

## 5. Navigation Patterns

### 5.1 Global patterns

| Pattern | Implementation |
|---------|---------------|
| **Primary nav** | Persistent top bar, visible on all authenticated pages |
| **Breadcrumbs** | Used in Settings and Template detail for hierarchy context |
| **Back navigation** | Canvas → Dashboard (explicit "← Back to workflows" link) |
| **Deep linking** | All major views are URL-addressable (`/canvas/:id`, `/templates/:id`) |
| **Command palette** | `Cmd+K` opens global search/action palette (navigate, create, search) |

### 5.2 Canvas-specific navigation

| Pattern | Implementation |
|---------|---------------|
| **Sidebar toggle** | Collapse/expand sidebar (preserves state in localStorage) |
| **Properties panel** | Opens on node selection, closes on Escape or deselect |
| **Context menus** | Right-click on node/edge/canvas for contextual actions |
| **Quick-add** | Double-click canvas opens node search popover |
| **Keyboard shortcuts** | Full keyboard control (see canvas-ui-spec for complete list) |

### 5.3 Modal patterns

| Trigger | Modal type |
|---------|-----------|
| Template preview | Centered overlay (max 80vw × 80vh), click-outside closes |
| Confirm delete | Small dialog, destructive action in red |
| OAuth connect | Centered overlay or redirect flow |
| Export / Import | Side drawer (right, 480px) |
| First-run onboarding | Full-screen step wizard |

---

## 6. Data Relationships

```
User
├── has many → Workflows
│   ├── has many → Nodes (agents, tasks, tools, LLMs)
│   ├── has many → Edges (connections)
│   ├── has many → Runs
│   │   └── has many → Events (logs, LLM calls, tool executions)
│   └── belongs to → Template (optional, if created from template)
├── has many → Installed Integrations
│   └── has → OAuth Credentials
├── has one → Subscription Plan
│   ├── run limit (per month)
│   └── workflow limit
└── has one → Profile
    ├── API keys
    └── Team memberships
```

---

## 7. State Management Considerations

| State | Scope | Persistence |
|-------|-------|-------------|
| Auth token | Global | localStorage + httpOnly cookie |
| Current workflow | Canvas page | URL param + server |
| Canvas viewport (zoom, pan) | Canvas page | localStorage per workflow |
| Sidebar collapse state | Canvas page | localStorage |
| Selected node(s) | Canvas page | React state (ephemeral) |
| Run logs | Debug page | Server (fetched on demand) |
| User preferences (theme, grid) | Global | localStorage + server sync |
| Workflow list (dashboard) | Dashboard page | Server + SWR/React Query cache |

---

## 8. URL Structure & Deep Linking

All application states should be URL-addressable for shareability and browser history:

| URL | State |
|-----|-------|
| `/dashboard` | Workflow list, default view |
| `/dashboard?view=grid` | Grid view toggle |
| `/canvas/wf_abc123` | Open workflow in editor |
| `/canvas/wf_abc123?node=agent_1` | Open workflow with node selected |
| `/canvas/wf_abc123/debug/run_xyz` | Debug timeline for specific run |
| `/templates?category=research` | Filtered template list |
| `/templates/tpl_abc123` | Template preview |
| `/marketplace?category=llm` | Filtered marketplace |
| `/settings/api-keys` | Settings sub-page |

---

## 9. Responsive Strategy

| Breakpoint | Layout adaptations |
|------------|-------------------|
| **≥ 1280px** (Desktop) | Full layout — sidebar expanded, properties panel visible, top nav labels |
| **768–1279px** (Tablet) | Sidebar collapsed to icon rail, properties as slide-over drawer, nav icons + labels |
| **< 768px** (Mobile) | Hamburger nav, sidebar hidden, properties as full-screen sheet, canvas limited (read-mostly) |

**Canvas on mobile:** The canvas is view-only on small screens. Users can browse workflows and view debug timelines but must use desktop for editing. A "Open on desktop" prompt appears when trying to edit on mobile.

---

## 10. Accessibility Considerations

| Requirement | Implementation |
|-------------|---------------|
| **Keyboard navigation** | All interactive elements reachable via Tab, Enter, Escape |
| **Focus management** | Visible focus ring (violet); focus trapped in modals |
| **Screen reader** | ARIA labels on all nodes, edges, toolbar buttons; live regions for status changes |
| **Reduced motion** | `prefers-reduced-motion` disables animations, uses instant state changes |
| **Color contrast** | WCAG AA minimum (4.5:1 for text, 3:1 for large text/UI components) |
| **Skip links** | "Skip to canvas" and "Skip to main content" for keyboard users |

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-04-08 | UX/UI Agent | Initial information architecture document |
