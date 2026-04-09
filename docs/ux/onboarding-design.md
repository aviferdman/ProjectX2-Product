# Onboarding Flow — Interaction Design Specification

> **TASK-150** · P1 · UX/UI · Phase 2 (Epic 19: Dashboard & Workflow Management UI)  
> Complete interaction design for the first-time user experience, including step-by-step wizard, tooltip system, progressive disclosure, contextual hints, animations, accessibility, and error handling.

---

## 1. Design Principles

| Principle | Description |
|-----------|-------------|
| **Time-to-value** | Get users to their first successful workflow run in under 3 minutes |
| **Progressive disclosure** | Reveal complexity incrementally — never overwhelm on first load |
| **Escape hatch** | Every step has a skip or exit option — never trap the user |
| **Contextual, not modal** | Prefer inline hints over blocking dialogs after the initial wizard |
| **One thing at a time** | Each wizard step has exactly one primary action |
| **Celebrate milestones** | Visual rewards for completing setup steps reinforce progress |

---

## 2. Onboarding Architecture

### 2.1 Three-Layer System

The onboarding experience is composed of three complementary layers that activate at different points in the user journey:

```
Layer 1: Onboarding Wizard (first visit only)
    → Full-screen step-by-step setup
    → 4 steps: Welcome → Connect LLM → First Workflow → Complete
    → Goal: Account configuration + first workflow created

Layer 2: Interactive Guided Tour (first canvas visit)
    → Spotlight-based walkthrough of canvas UI
    → 5 steps highlighting sidebar, canvas, toolbar, properties, run
    → Goal: User knows where everything is

Layer 3: Contextual Tooltips (ongoing, first-encounter)
    → Inline hints triggered by first-time actions
    → 8-12 tooltips across the application
    → Goal: Just-in-time learning at moment of need
```

### 2.2 State Machine

```
                         ┌──────────────┐
                         │  NEW_USER    │
                         │  (signup)    │
                         └──────┬───────┘
                                │
                    ┌───────────▼──────────┐
                    │  WIZARD_IN_PROGRESS  │──── skip ────┐
                    │  step: 1|2|3|4       │               │
                    └───────────┬──────────┘               │
                                │ complete                 │
                    ┌───────────▼──────────┐    ┌──────────▼──────────┐
                    │  WIZARD_COMPLETE     │    │  WIZARD_SKIPPED     │
                    └───────────┬──────────┘    └──────────┬──────────┘
                                │                          │
                                └──────────┬───────────────┘
                                           │
                    ┌──────────────────────▼───────────────────────┐
                    │  TOUR_PENDING (first canvas visit)           │
                    │  Show: "Take a tour?" prompt                 │
                    └───────────┬──────────────────┬───────────────┘
                                │ accept           │ dismiss
                    ┌───────────▼──────────┐       │
                    │  TOUR_IN_PROGRESS    │       │
                    │  step: 1|2|3|4|5     │       │
                    └───────────┬──────────┘       │
                                │ complete         │
                                └────────┬─────────┘
                                         │
                    ┌────────────────────▼────────────────────┐
                    │  TOOLTIPS_ACTIVE                        │
                    │  Show contextual hints on first actions │
                    │  Each tooltip shown max once            │
                    └────────────────────┬───────────────────┘
                                         │ all tooltips seen
                    ┌────────────────────▼───────────────────┐
                    │  ONBOARDING_COMPLETE                    │
                    │  Tour available in Help menu for replay │
                    └────────────────────────────────────────┘
```

### 2.3 Persistence

| Data | Storage | Sync |
|------|---------|------|
| Wizard step progress | Server (user record) + localStorage fallback | Server is source of truth |
| Wizard role selection | Server (user.onboarding_role) | Used for template personalization |
| Tour completion | localStorage (`crewspace_tour_complete`) | Per-browser |
| Tooltip seen flags | localStorage (`crewspace_tooltip_{id}`) | Per-browser |
| Skip/dismiss choices | Server (user.onboarding_skipped_at) | Persistent |

---

## 3. Layer 1: Onboarding Wizard — Detailed Design

### 3.1 Wizard Container

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ┌─── Progress indicator ────────────────────────────────────────┐   │
│  │  ●━━━━━━━○───────○───────○                                    │   │
│  │  Welcome  Connect  Build   Done        [Skip onboarding →]    │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─── Step content area ─────────────────────────────────────────┐   │
│  │                                                                │   │
│  │              (step-specific content — see below)               │   │
│  │                                                                │   │
│  │              Max width: 640px, centered                        │   │
│  │              Vertical centering with auto margins              │   │
│  │                                                                │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─── Navigation bar ────────────────────────────────────────────┐   │
│  │  [← Back]                                    [Continue →]     │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Container specifications:**

| Property | Value |
|----------|-------|
| Layout | Full-screen overlay (`position: fixed; inset: 0`) |
| Background | `var(--cs-background)` with 2px grain texture |
| Z-index | `1000` (above all app content) |
| Max content width | `640px` centered |
| Padding | `48px 24px` desktop, `24px 16px` mobile |
| Transition between steps | Slide left/right, 300ms `ease-out` |

**Progress indicator:**

| Property | Value |
|----------|-------|
| Style | Connected dots with labels below |
| Active step | Filled dot (`var(--cs-primary-500)`), bold label |
| Completed step | Filled dot + connecting line (`var(--cs-primary-500)`) |
| Upcoming step | Empty dot (`var(--cs-border)`), muted label |
| Connecting line | 2px, animated fill from left to right on step completion (400ms) |

### 3.2 Step 1: Welcome

**Primary goal:** Capture user archetype for personalization.

```
┌──────────────────────────────────────────────────────────────────┐
│                           🚀                                      │
│                   Welcome to Crewspace!                           │
│                                                                   │
│   "Build multi-agent AI workflows visually.                      │
│    Let's get you set up in 2 minutes."                           │
│                                                                   │
│   What best describes you?                                       │
│                                                                   │
│   ┌─ Role cards (radio group) ─────────────────────────────────┐ │
│   │  ┌──────────────────┐  ┌──────────────────┐               │ │
│   │  │  💻               │  │  📋               │               │ │
│   │  │  Developer        │  │  Product Manager  │               │ │
│   │  │  Building AI apps │  │  Automating tasks │               │ │
│   │  └──────────────────┘  └──────────────────┘               │ │
│   │  ┌──────────────────┐  ┌──────────────────┐               │ │
│   │  │  🔬               │  │  🔍               │               │ │
│   │  │  Researcher       │  │  Just exploring   │               │ │
│   │  │  Analyzing data   │  │  Checking it out  │               │ │
│   │  └──────────────────┘  └──────────────────┘               │ │
│   └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│                                         [Get Started →]          │
└──────────────────────────────────────────────────────────────────┘
```

**Role card interaction spec:**

| State | Visual | Timing |
|-------|--------|--------|
| Default | Border: `1px solid var(--cs-border)`, bg: `var(--cs-surface)`, shadow: `sm` | — |
| Hover | Border: `1px solid var(--cs-primary-300)`, bg: `var(--cs-primary-50)`, shadow: `md`, scale: `1.02` | 150ms `ease-out` |
| Selected | Border: `2px solid var(--cs-primary-500)`, bg: `var(--cs-primary-50)`, shadow: `md`, checkmark icon top-right | 200ms `spring(1, 80, 10)` |
| Focus (keyboard) | Same as hover + focus ring: `0 0 0 3px var(--cs-primary-200)` | Instant |

**Interactions:**

| Action | Behavior |
|--------|----------|
| Click role card | Select role (deselect previous), enable [Get Started] button |
| Tab between cards | Arrow keys navigate within radio group, Space/Enter selects |
| No role selected | [Get Started] disabled with muted styling |
| Role pre-selected | [Get Started] enabled, filled primary style |
| Click [Get Started] | Slide to Step 2 (300ms), save role to server |
| Click [Skip] (progress bar) | Skip confirmation tooltip: "Skip setup? You can complete it later from Settings." → [Skip] / [Continue Setup] |

**Entrance animation:**

| Element | Animation | Delay |
|---------|-----------|-------|
| Emoji (🚀) | Scale `0 → 1` + rotate `-15deg → 0deg` | 0ms |
| Heading | Fade in + slide up 16px | 100ms |
| Subtitle | Fade in + slide up 16px | 200ms |
| Role cards | Staggered fade in + slide up 12px, 75ms per card | 300ms |
| Button | Fade in | 600ms |
| Duration per element | 400ms, `ease-out` | — |

### 3.3 Step 2: Connect LLM

**Primary goal:** Connect at least one LLM provider.

```
┌──────────────────────────────────────────────────────────────────┐
│                  🧠 Connect an LLM                               │
│   "Your agents need a brain. Choose a provider to get started."  │
│                                                                   │
│   ┌─ Provider cards (expandable) ───────────────────────────────┐│
│   │                                                              ││
│   │  ┌────────────────────────────────────────────────────────┐ ││
│   │  │  [OpenAI logo]  OpenAI          Recommended            │ ││
│   │  │  GPT-4o, GPT-3.5 Turbo                                │ ││
│   │  │  ┌──────────────────────────────────────────────────┐  │ ││
│   │  │  │  API Key: [sk-________________________] [👁]     │  │ ││
│   │  │  │  [Test Connection]  →  ✅ Connected!             │  │ ││
│   │  │  └──────────────────────────────────────────────────┘  │ ││
│   │  └────────────────────────────────────────────────────────┘ ││
│   │                                                              ││
│   │  ┌────────────────────────────────────────────────────────┐ ││
│   │  │  [Anthropic logo]  Anthropic               [Connect →] │ ││
│   │  │  Claude 4, Claude 3.5 Sonnet                           │ ││
│   │  └────────────────────────────────────────────────────────┘ ││
│   │                                                              ││
│   │  ┌────────────────────────────────────────────────────────┐ ││
│   │  │  [Ollama logo]  Ollama (Local)  Free       [Connect →] │ ││
│   │  │  Run models locally — no API key needed                │ ││
│   │  └────────────────────────────────────────────────────────┘ ││
│   │                                                              ││
│   └──────────────────────────────────────────────────────────────┘│
│                                                                   │
│   "Don't have an API key? [Get one from OpenAI ↗]"              │
│                                                                   │
│   [← Back]           [Skip — I'll do this later]  [Continue →]   │
└──────────────────────────────────────────────────────────────────┘
```

**Provider card interaction spec:**

| State | Visual |
|-------|--------|
| Collapsed (default) | Provider name, tagline, [Connect →] button |
| Expanded | Shows API key input field, test button, status |
| Connected | Green border, checkmark badge, "Connected ✓" status |
| Error | Red border on input, inline error message |

**Expand/collapse animation:**

| Property | Value |
|----------|-------|
| Trigger | Click card or [Connect →] |
| Animation | Height auto-expand, 250ms `ease-out` |
| Other cards | Collapse simultaneously (if another was open) |
| Focus | Auto-focus the API key input on expand |

**API key input interaction:**

| Action | Behavior |
|--------|----------|
| Paste API key | Auto-detect format, trim whitespace, mask characters (show last 4) |
| Toggle visibility [👁] | Show/hide key plaintext, auto-hide after 5 seconds |
| Click [Test Connection] | Button → spinner (200ms), send validation request |
| Test success | Spinner → checkmark (✅), card border turns green, toast: "Connected to OpenAI!" |
| Test failure | Spinner → error icon (❌), inline: "Invalid API key. Check the key and try again." |
| Test timeout (>10s) | Show: "Taking longer than expected..." then fail: "Connection timed out. Try again." |

**Navigation rules:**

| Condition | [Continue] state |
|-----------|-----------------|
| No provider connected | Enabled but shows warning tooltip: "Your workflows won't run without an LLM" |
| 1+ provider connected | Primary filled style, enabled |
| Click [Skip] | Navigate forward, server stores `llm_setup_skipped: true` |
| Click [← Back] | Slide to Step 1, preserve entered data |

### 3.4 Step 3: Build First Workflow

**Primary goal:** User creates or selects a workflow to start with.

```
┌──────────────────────────────────────────────────────────────────┐
│                 ✨ Build Your First Workflow                      │
│   "Choose a starting point — you can always customize later."    │
│                                                                   │
│   ┌─ Recommended (based on Step 1 role) ────────────────────────┐│
│   │  "Suggested for Developers:"                                 ││
│   │                                                              ││
│   │  ┌─────────────────────┐  ┌─────────────────────┐           ││
│   │  │  ┌───────────────┐  │  │  ┌───────────────┐  │           ││
│   │  │  │  [thumbnail]  │  │  │  │  [thumbnail]  │  │           ││
│   │  │  └───────────────┘  │  │  └───────────────┘  │           ││
│   │  │  Research Crew      │  │  Code Review Crew    │           ││
│   │  │  3 agents · 5 tasks │  │  2 agents · 4 tasks  │           ││
│   │  │  [Use This →]       │  │  [Use This →]        │           ││
│   │  └─────────────────────┘  └─────────────────────┘           ││
│   │                                                              ││
│   │  [Browse all templates →]                                    ││
│   └──────────────────────────────────────────────────────────────┘│
│                                                                   │
│   ── or ──                                                       │
│                                                                   │
│   ┌──────────────────────────────────────────────────────────────┐│
│   │  📄 Start from Scratch                                       ││
│   │  Open a blank canvas and build your own workflow             ││
│   │  [Create Blank Workflow →]                                    ││
│   └──────────────────────────────────────────────────────────────┘│
│                                                                   │
│   [← Back]                                                       │
└──────────────────────────────────────────────────────────────────┘
```

**Template card spec:**

| State | Visual |
|-------|--------|
| Default | Thumbnail + title + metadata, shadow `sm` |
| Hover | Shadow `lg`, scale `1.02`, [Use This →] becomes filled primary |
| Loading (after click) | Skeleton pulse overlay, "Creating your workflow..." text |
| Created | Card flashes green briefly, auto-advance to Step 4 |

**Personalization mapping:**

| Step 1 Role | Suggested Templates |
|-------------|-------------------|
| Developer | Research Crew, Code Review Crew |
| Product Manager | Content Pipeline, Task Automation |
| Researcher | Data Analysis Crew, Literature Review |
| Just exploring | Research Crew (most popular), Blog Writer |

**Interactions:**

| Action | Behavior |
|--------|----------|
| Click [Use This →] | Create workflow from template (POST), show loading state, advance to Step 4 |
| Click [Browse all] | Navigate to `/templates` (exits wizard, wizard state saved for return) |
| Click [Create Blank] | Create empty workflow (POST), advance to Step 4 |
| Click [← Back] | Slide to Step 2, no data lost |

### 3.5 Step 4: Complete

**Primary goal:** Celebrate success, provide orientation, offer next actions.

```
┌──────────────────────────────────────────────────────────────────┐
│                           🎉                                      │
│                    You're all set!                                │
│                                                                   │
│   "Your workflow 'Research Crew' is ready to go."                │
│                                                                   │
│   ┌─ Quick tips card ──────────────────────────────────────────┐ │
│   │  💡 Quick Tips                                              │ │
│   │                                                             │ │
│   │  • Drag nodes from the sidebar to build your workflow       │ │
│   │  • Connect outputs → inputs to define data flow             │ │
│   │  • Click ▶ Run to execute and watch agents work             │ │
│   │  • Use the Debug Timeline to inspect what happened          │ │
│   └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│   ┌─ Keyboard shortcuts card ──────────────────────────────────┐ │
│   │  ⌨️  Keyboard Shortcuts                                     │ │
│   │                                                             │ │
│   │  Ctrl+K     Search / command palette                        │ │
│   │  Space+Drag Pan the canvas                                  │ │
│   │  Ctrl+Z     Undo                                            │ │
│   │  F          Fit all nodes to view                           │ │
│   │  Delete     Remove selected node/edge                       │ │
│   └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│               [ ★  Open My Workflow  → ]                         │
│                                                                   │
│   [Take a guided tour]              [Go to Dashboard]            │
└──────────────────────────────────────────────────────────────────┘
```

**Celebration animation:**

| Element | Animation | Delay |
|---------|-----------|-------|
| Emoji (🎉) | Scale `0 → 1.2 → 1` (bounce) + confetti burst (16 particles) | 0ms |
| Heading | Fade in + slide up 20px | 150ms |
| Workflow name | Typewriter reveal (per character, 30ms each) | 350ms |
| Tips card | Fade in + slide up 16px | 500ms |
| Shortcuts card | Fade in + slide up 16px | 600ms |
| Primary CTA | Scale `0.9 → 1` + glow pulse (2 cycles) | 800ms |
| Secondary CTAs | Fade in | 900ms |
| Confetti | 16 particles, random colors from palette, gravity fall over 2s | 0ms |

**Interactions:**

| Action | Behavior |
|--------|----------|
| Click [Open My Workflow] | Navigate to `/canvas/:workflowId`, trigger tour prompt |
| Click [Take a guided tour] | Navigate to `/canvas/:workflowId`, immediately start tour |
| Click [Go to Dashboard] | Navigate to `/dashboard` |

---

## 4. Layer 2: Interactive Guided Tour — Detailed Design

### 4.1 Tour Trigger

The tour prompt appears when a user first visits the canvas after completing (or skipping) the wizard.

```
┌──────────────────────────────────────────────────────────────────┐
│  ┌── Tour prompt (top-center banner) ─────────────────────────┐  │
│  │  👋 Welcome to the Canvas!                                  │  │
│  │  Take a quick 30-second tour to learn the basics.           │  │
│  │  [Start Tour]  [Maybe Later]                                │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  [rest of canvas UI — slightly dimmed (0.7 opacity)]               │
└──────────────────────────────────────────────────────────────────┘
```

**Prompt specs:**

| Property | Value |
|----------|-------|
| Position | Fixed, top center, 16px from top |
| Width | `max(480px, 50vw)` up to `640px` |
| Background | `var(--cs-surface)` with `var(--cs-shadow-lg)` |
| Border | `1px solid var(--cs-primary-200)` |
| Border-radius | `12px` |
| Entrance | Slide down from -100% + fade in, 300ms `ease-out` |
| Canvas dimming | Overlay `rgba(0,0,0,0.15)` behind prompt, above canvas |
| Auto-dismiss | If user starts interacting with canvas (any click/drag), dismiss after 5s |

### 4.2 Tour Step Component (Spotlight)

Each tour step uses a spotlight overlay that highlights a specific UI region:

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                    │
│  ████████████████████████████████████████████████████████████████  │
│  ██████████████████┌──────────────────┐█████████████████████████  │
│  ██████████████████│                  │█████████████████████████  │
│  ██████████████████│  SPOTLIGHT AREA  │█████████████████████████  │
│  ██████████████████│  (highlighted)   │█████████████████████████  │
│  ██████████████████│                  │█████████████████████████  │
│  ██████████████████└──────────────────┘█████████████████████████  │
│  ██████████████████  ┌──────────────────────────────┐ ██████████  │
│  ██████████████████  │  ● ● ○ ○ ○  Step 1 of 5     │ ██████████  │
│  ██████████████████  │                               │ ██████████  │
│  ██████████████████  │  📌 Node Library              │ ██████████  │
│  ██████████████████  │  Drag agents, tasks, and      │ ██████████  │
│  ██████████████████  │  tools onto the canvas to     │ ██████████  │
│  ██████████████████  │  build your workflow.          │ ██████████  │
│  ██████████████████  │                               │ ██████████  │
│  ██████████████████  │  [← Back]    [Next →]  [Skip] │ ██████████  │
│  ██████████████████  └──────────────────────────────┘ ██████████  │
│  ████████████████████████████████████████████████████████████████  │
└──────────────────────────────────────────────────────────────────┘
```

**Spotlight specs:**

| Property | Value |
|----------|-------|
| Overlay | `rgba(0, 0, 0, 0.6)` with SVG mask cutout around target |
| Cutout | Target element bounding rect + `8px` padding, `8px` border-radius |
| Cutout animation | Morph shape between steps, 400ms `ease-in-out` |
| Tooltip position | Auto-positioned: prefers below-right, flips to avoid viewport edges |
| Tooltip max width | `360px` |
| Tooltip background | `var(--cs-surface)` |
| Tooltip shadow | `var(--cs-shadow-xl)` |
| Tooltip arrow | 8px CSS triangle pointing toward spotlight cutout |
| Step indicator | Filled/empty dots + "Step X of 5" text |

**Tooltip transition between steps:**

| Property | Value |
|----------|-------|
| Exit | Fade out current tooltip (150ms) |
| Cutout morph | Animate cutout to new target rect (400ms, `ease-in-out`) |
| Enter | Fade in new tooltip at new position (200ms, 250ms delay after morph starts) |
| Total step transition | ~450ms perceived |

### 4.3 Tour Steps

| Step | Target Element | Tooltip Title | Tooltip Body | Tooltip Position |
|------|---------------|---------------|--------------|-----------------|
| 1 | Sidebar (`.cs-sidebar`) | 📌 Node Library | "Drag agents, tasks, and tools onto the canvas to build your workflow." | Right of sidebar |
| 2 | Canvas viewport (`.cs-canvas`) | 🎨 Your Workspace | "This is your canvas. Pan with Space+drag, zoom with Ctrl+scroll. Double-click to quick-add nodes." | Center overlay |
| 3 | Toolbar (`.cs-toolbar`) | 🔧 Toolbar | "Add nodes, undo/redo, control the canvas view, and run your workflow from here." | Below toolbar |
| 4 | Properties panel area (`.cs-properties`) | ⚙️ Properties Panel | "Select any node to configure it here — set roles, goals, LLM providers, and tools." | Left of panel |
| 5 | Run button (`.cs-run-button`) | ▶️ Run Workflow | "When you're ready, click Run to execute. Watch your agents collaborate in real-time!" | Below button |

**Tour keyboard support:**

| Key | Action |
|-----|--------|
| → / Enter | Next step |
| ← | Previous step |
| Escape | Skip tour (with confirmation: "End tour? You can restart from the Help menu.") |
| Tab | Focus cycles within tooltip (Back, Next, Skip) |

### 4.4 Tour Completion

```
Final tooltip (after step 5):

┌──────────────────────────────────────┐
│  🎉 You're ready!                     │
│                                       │
│  Try dragging an Agent from the       │
│  sidebar to get started.              │
│                                       │
│  You can replay this tour anytime     │
│  from Help → Take a Tour.            │
│                                       │
│  [Got it!]                            │
└──────────────────────────────────────┘
```

On dismiss:
- Overlay fades out (300ms)
- Canvas returns to full opacity
- `localStorage.crewspace_tour_complete = true`
- If sidebar is collapsed, auto-expand it as a gentle hint

---

## 5. Layer 3: Contextual Tooltip System — Detailed Design

### 5.1 Tooltip Component

```
    ┌──────────────────────────────────────┐
    │  💡 Tip: Connect nodes               │
    │                                       │
    │  Drag from an output handle (right)   │
    │  to an input handle (left) to create  │
    │  a connection between nodes.          │
    │                                       │
    │  [Got it]           [Don't show tips] │
    └──────────────────────────────┬────────┘
                                   │
                                   ▼ (arrow pointing to trigger element)
```

**Tooltip specs:**

| Property | Value |
|----------|-------|
| Max width | `320px` |
| Background | `var(--cs-surface)` |
| Border | `1px solid var(--cs-primary-200)` |
| Border-radius | `8px` |
| Shadow | `var(--cs-shadow-lg)` |
| Padding | `16px` |
| Icon | Emoji or icon matching tip context |
| Title | `font-weight: 600`, `var(--cs-text-primary)` |
| Body | `font-weight: 400`, `var(--cs-text-secondary)`, `font-size: 14px` |
| Arrow | 8px CSS triangle, same background/border, pointing toward trigger |
| Entrance | Fade in + scale `0.95 → 1`, 200ms `ease-out` |
| Exit ([Got it]) | Fade out + scale `1 → 0.95`, 150ms `ease-in` |
| Auto-dismiss | After 15 seconds if not interacted with |

### 5.2 Tooltip Catalog

| ID | Trigger | Title | Body | Position | Priority |
|----|---------|-------|------|----------|----------|
| `tip-first-node-add` | First node dragged onto canvas | Node Added! | "Click the node to configure it in the Properties panel on the right." | Right of node |  High |
| `tip-first-connect` | First time hovering an output handle | Connect Nodes | "Drag from this handle to another node's input to create a data flow connection." | Above handle | High |
| `tip-first-run` | First click on ▶ Run | Running Your Workflow | "Your agents will execute tasks in dependency order. Watch the canvas for real-time status." | Below run button | High |
| `tip-first-debug` | First navigation to debug timeline | Debug Timeline | "Click any event to see details. Use filters to narrow by agent or event type." | Top of timeline | Medium |
| `tip-cmd-palette` | First 60 seconds on canvas (if no Ctrl+K used) | Quick Tip | "Press Ctrl+K to open the command palette — search anything, fast." | Top center | Low |
| `tip-properties-empty` | Click a node for the first time | Configure Your Node | "Set the agent's role, goal, and LLM provider here. Changes auto-save." | Top of properties panel | High |
| `tip-canvas-pan` | First 30 seconds on canvas (if no pan) | Canvas Navigation | "Hold Space and drag to pan. Ctrl+scroll to zoom. Press F to fit all nodes." | Center of canvas | Medium |
| `tip-template-use` | First visit to template library | Templates | "Click any template to preview it, then 'Use Template' to create your own copy." | Top of template grid | Low |
| `tip-dashboard-empty` | Dashboard with 0 workflows | Get Started | "Create your first workflow or browse templates to find inspiration." | Center of empty state | High |
| `tip-usage-near-limit` | Usage reaches 80% | Approaching Limit | "You've used 80% of your monthly runs. Upgrade for unlimited runs." | Near usage bar | Medium |

### 5.3 Tooltip Display Rules

| Rule | Description |
|------|-------------|
| One at a time | Never show more than one contextual tooltip simultaneously |
| Show once | Each tooltip ID shown max once per browser (localStorage flag) |
| Respect tour | Don't show contextual tooltips during guided tour |
| Delay after tour | Wait 10 seconds after tour completion before showing first contextual tip |
| Priority queue | If multiple tooltips would trigger, show highest priority first |
| User opt-out | [Don't show tips] dismisses all future tooltips (`crewspace_tips_disabled`) |
| Re-enable | Settings → Preferences → "Show helpful tips" toggle |

### 5.4 Global Disable Flow

When user clicks [Don't show tips] on any tooltip:

```
┌──────────────────────────────────────┐
│  Disable all tips?                    │
│                                       │
│  You can re-enable them anytime in    │
│  Settings → Preferences.             │
│                                       │
│  [Keep Tips]         [Disable Tips]   │
└──────────────────────────────────────┘
```

---

## 6. Skipped Onboarding — Recovery Paths

Users who skip the wizard need gentle nudges to complete setup:

### 6.1 Dashboard Setup Card

Shown when `onboarding_skipped = true` and setup is incomplete:

```
┌──────────────────────────────────────────────────────────────────┐
│  ┌─ Setup progress card ──────────────────────────────────────┐  │
│  │  Complete your setup                        [✕ Dismiss]     │  │
│  │                                                             │  │
│  │  ████████░░░░░░░░░░░░░░░░  2 of 4 complete                │  │
│  │                                                             │  │
│  │  ✅ Account created                                        │  │
│  │  ✅ Profile set up                                          │  │
│  │  ○  Connect an LLM provider     [Connect →]                │  │
│  │  ○  Create your first workflow   [Create →]                │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  [rest of dashboard below]                                        │
└──────────────────────────────────────────────────────────────────┘
```

**Card specs:**

| Property | Value |
|----------|-------|
| Position | Top of dashboard, above workflow list |
| Background | `var(--cs-primary-50)` with left border `4px solid var(--cs-primary-500)` |
| Dismissible | [✕] hides for 7 days, then re-appears once |
| Permanent dismiss | After appearing twice, [✕] hides permanently |
| Completion | Card auto-hides with celebration animation when all items done |

### 6.2 Empty State CTAs

When dashboard has no workflows:

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                    │
│                        [illustration]                              │
│                                                                    │
│               Create your first workflow                          │
│          Build multi-agent AI workflows visually                  │
│                                                                    │
│       [ + New Workflow ]     [ Browse Templates ]                 │
│                                                                    │
│       "Need help? [Take the guided setup →]"                     │
└──────────────────────────────────────────────────────────────────┘
```

Click [Take the guided setup →] re-enters the wizard at the first incomplete step.

---

## 7. Responsive Behavior

### 7.1 Wizard — Mobile (< 768px)

| Adaptation | Detail |
|------------|--------|
| Layout | Single column, full-width cards |
| Role cards | 1 per row (stacked) instead of 2×2 grid |
| Provider cards | Full-width, accordion style |
| Template cards | Horizontal scroll (carousel) |
| Progress indicator | Dots only (no labels), sticky top |
| Buttons | Full-width, stacked: primary on top, secondary below |
| Padding | `24px 16px` |

### 7.2 Wizard — Tablet (768–1279px)

| Adaptation | Detail |
|------------|--------|
| Layout | Max width `560px` centered |
| Role cards | 2×2 grid (same as desktop) |
| Provider cards | Same as desktop |
| Template cards | 2-column grid |

### 7.3 Tour — Mobile

| Adaptation | Detail |
|------------|--------|
| Spotlight | Full-width overlay, tooltip slides up from bottom (sheet style) |
| Tooltip | Fixed to bottom of viewport, max height 50vh, scrollable |
| Step navigation | Swipe left/right between steps |
| Skip | Swipe down to dismiss |

### 7.4 Contextual Tooltips — Mobile

| Adaptation | Detail |
|------------|--------|
| Position | Always bottom-sheet style (slides up from bottom) |
| Width | `100vw - 32px`, centered |
| Dismiss | Swipe down or tap [Got it] |

---

## 8. Accessibility Requirements

### 8.1 Wizard Accessibility

| Requirement | Implementation |
|-------------|---------------|
| **Focus management** | Auto-focus first interactive element on each step; return focus to trigger on close |
| **Focus trapping** | Tab cycles within wizard overlay (cannot tab to background content) |
| **Role cards** | `role="radiogroup"` with `role="radio"` on each card; `aria-checked` state |
| **Progress indicator** | `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`; step labels via `aria-label` |
| **Step transitions** | `aria-live="polite"` region announces "Step 2 of 4: Connect an LLM" on step change |
| **Skip link** | "Skip to main content" link available (jumps past wizard to app) |
| **Error announcements** | API key validation errors announced via `aria-live="assertive"` |
| **Reduced motion** | `prefers-reduced-motion`: disable all slide/scale/confetti animations, use instant opacity transitions |
| **High contrast** | All text meets WCAG AA (4.5:1); selected card border meets 3:1 against background |
| **Screen reader** | Provider connection status read as: "OpenAI: Connected" or "Anthropic: Not connected" |

### 8.2 Tour Accessibility

| Requirement | Implementation |
|-------------|---------------|
| **Focus management** | Focus moves to tooltip on each step; trapped within tooltip |
| **Keyboard navigation** | Arrow keys and Enter/Escape for step navigation (see §4.3) |
| **Screen reader** | Tooltip content announced via `aria-live="polite"` on step change |
| **Spotlight description** | `aria-describedby` links tooltip to highlighted element |
| **Escape** | Escape closes tour with confirmation dialog |
| **Reduced motion** | Spotlight cutout morphs instantly (no animation); tooltip appears instantly |

### 8.3 Contextual Tooltip Accessibility

| Requirement | Implementation |
|-------------|---------------|
| **Not blocking** | Tooltips don't block interaction — user can click through to underlying UI |
| **Dismissible** | [Got it] button and Escape key both dismiss |
| **Announced** | `role="status"` + `aria-live="polite"` announces tooltip appearance |
| **Focus** | Tooltip does NOT steal focus from current task — it's supplementary |
| **Timeout** | Auto-dismiss after 15s; no timeout if user is interacting with tooltip |
| **Reduced motion** | Instant appear/disappear (no fade/scale animation) |

### 8.4 Color and Contrast

| Element | Foreground | Background | Ratio | WCAG |
|---------|-----------|------------|-------|------|
| Wizard heading | `#0f172a` | `#ffffff` | 15.4:1 | AAA |
| Wizard body text | `#475569` | `#ffffff` | 7.1:1 | AAA |
| Role card border (selected) | `#7c3aed` | `#ffffff` | 4.6:1 | AA |
| Role card focus ring | `#c4b5fd` | `#ffffff` | 3.1:1 | AA (large) |
| Tour overlay | `rgba(0,0,0,0.6)` | — | — | N/A (decorative) |
| Tour tooltip text | `#0f172a` | `#ffffff` | 15.4:1 | AAA |
| Contextual tooltip text | `#0f172a` | `#ffffff` | 15.4:1 | AAA |
| Error text | `#dc2626` | `#ffffff` | 4.5:1 | AA |
| Success text | `#16a34a` | `#ffffff` | 4.5:1 | AA |

---

## 9. Analytics & Success Metrics

### 9.1 Events to Track

| Event | Properties | Purpose |
|-------|-----------|---------|
| `onboarding_started` | `source: signup\|settings\|dashboard` | Measure entry points |
| `onboarding_step_viewed` | `step: 1\|2\|3\|4`, `time_on_previous_step_ms` | Identify drop-off points |
| `onboarding_step_completed` | `step: 1\|2\|3\|4`, `data: { role, provider, template_id }` | Measure completion per step |
| `onboarding_skipped` | `at_step: 1\|2\|3\|4` | Understand skip behavior |
| `onboarding_completed` | `total_time_ms`, `role`, `provider`, `template_used` | Overall conversion |
| `tour_started` | `source: wizard\|help_menu\|banner` | Tour engagement |
| `tour_step_viewed` | `step: 1-5` | Tour completion rate |
| `tour_completed` | `total_time_ms` | Tour success |
| `tour_skipped` | `at_step: 1-5` | Tour drop-off |
| `tooltip_shown` | `tooltip_id`, `trigger` | Tooltip reach |
| `tooltip_dismissed` | `tooltip_id`, `action: got_it\|auto\|disable_all` | Tooltip engagement |
| `first_workflow_created` | `source: onboarding\|dashboard\|template`, `time_since_signup_ms` | Time to value |
| `first_workflow_run` | `time_since_signup_ms`, `from_template: bool` | Ultimate success metric |

### 9.2 Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Wizard completion rate | ≥ 70% of new users complete all 4 steps | `onboarding_completed / onboarding_started` |
| Step 2 → Step 3 conversion | ≥ 80% (LLM connect is critical) | `step_3_viewed / step_2_viewed` |
| Time to first workflow | < 3 minutes from signup | `first_workflow_created.time_since_signup_ms` |
| Tour completion rate | ≥ 50% of users who start the tour | `tour_completed / tour_started` |
| First workflow run within 10 minutes | ≥ 40% of new users | `first_workflow_run` where `time < 600000ms` |
| Tooltip engagement | ≥ 60% click [Got it] (vs auto-dismiss) | `tooltip_dismissed.action = got_it` |

---

## 10. Edge Cases & Error Handling

| Scenario | Behavior |
|----------|----------|
| Browser refresh during wizard | Resume at current step (server-synced progress) |
| Navigate away during wizard | Show confirmation: "Leave setup? You can finish later from Settings." |
| OAuth signup fails | Error screen with [Try Again] and [Use email instead] options |
| API key invalid | Inline error: "This doesn't look like a valid API key. [Get an API key ↗]" with help link |
| API key validation timeout | "Connection timed out. Check your network and try again." + [Retry] |
| All templates fail to load | Fallback: show [Create Blank Workflow] prominently, "Templates unavailable right now" message |
| Workflow creation fails | Error toast: "Could not create workflow. [Retry]". Stay on Step 3 |
| User already has workflows (re-signup) | Detect existing data: "Welcome back! We found 3 existing workflows." Skip Step 3 |
| User on mobile starts wizard | Full responsive wizard (see §7.1). Step 3 notes: "Canvas editing works best on desktop" |
| Multiple tabs open | Wizard state synced via server. If completed in one tab, others auto-advance to completion |
| User with assistive technology | All states, transitions, and errors announced. Focus managed per §8 |
| Network disconnected mid-wizard | Cache inputs locally. Banner: "You're offline. Setup will save when reconnected." |
| Rate limited on API key test | "Too many attempts. Wait 30 seconds and try again." with countdown timer |

---

## 11. Implementation Notes

### 11.1 Component Hierarchy

```
<OnboardingProvider>           ← Context provider for onboarding state
├── <OnboardingWizard>         ← Full-screen wizard (Layer 1)
│   ├── <WizardProgress>       ← Step indicator
│   ├── <WizardStep>           ← Step container with transitions
│   │   ├── <WelcomeStep>      ← Step 1
│   │   ├── <ConnectLLMStep>   ← Step 2
│   │   ├── <FirstWorkflowStep>← Step 3
│   │   └── <CompleteStep>     ← Step 4
│   └── <WizardNav>            ← Back/Continue/Skip buttons
│
├── <GuidedTour>               ← Spotlight tour (Layer 2)
│   ├── <SpotlightOverlay>     ← SVG mask overlay
│   ├── <TourTooltip>          ← Positioned tooltip
│   └── <TourProgress>         ← Step dots
│
├── <TooltipManager>           ← Contextual tooltips (Layer 3)
│   └── <ContextualTooltip>    ← Individual tooltip instances
│
└── <SetupProgressCard>        ← Dashboard recovery card
```

### 11.2 Suggested Dependencies

| Package | Purpose | Notes |
|---------|---------|-------|
| `framer-motion` | Step transitions, confetti, spotlight morph | Already may be in project |
| `react-joyride` or custom | Guided tour spotlight | Consider custom for better control |
| `@floating-ui/react` | Tooltip positioning | Handles edge detection, flipping |

### 11.3 localStorage Keys

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `crewspace_tour_complete` | `boolean` | `false` | Tour has been completed or skipped |
| `crewspace_tips_disabled` | `boolean` | `false` | User opted out of all contextual tips |
| `crewspace_tooltip_{id}` | `boolean` | `false` | Individual tooltip seen flag |
| `crewspace_wizard_step` | `number` | `1` | Fallback wizard progress (server is primary) |
| `crewspace_tour_prompt_dismissed` | `boolean` | `false` | Tour prompt banner dismissed |
| `crewspace_setup_card_dismissals` | `number` | `0` | Times setup card was dismissed |

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-04-09 | UX/UI Agent | Initial onboarding design specification (TASK-150) |
