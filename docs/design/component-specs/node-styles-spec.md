# Agent & Task Node Styles — Design Specification

> **TASK-133** · P1 · Designer · Crewspace Phase 2  
> Defines detailed icon mappings, extended color palettes, state visual treatments, badge specifications, and animation behaviors for all canvas node types. Builds upon TASK-132 canvas foundations.

---

## 1. Overview

This spec extends the base node anatomy (TASK-132) with **implementation-ready** visual specifications for every node type, subtype, state, and interaction. It delivers:

- **Subtype icon mapping** — 27 Lucide icons across Agent, Task, Tool, and LLM categories
- **Extended color palettes** — hover, active, muted, gradient, and accent variants per type
- **7 execution states** — Idle, Running, Success, Error, Disabled, Queued + interaction states (Hover, Selected, Dragging)
- **Status badge system** — Animated pills with dot indicators, icons, and color-coded labels
- **Zoom-adaptive rendering** — 4 detail levels based on canvas zoom
- **Accessibility** — Reduced motion support, WCAG AA contrast, ARIA patterns

### Artifact Files

| File | Purpose |
|------|---------|
| `src/design/tokens/node-styles.json` | Design tokens (JSON, DTCG format) |
| `src/design/css/node-styles-variables.css` | CSS custom properties + keyframe animations |
| `src/design/tailwind/node-styles-theme.ts` | Tailwind `theme.extend` + icon map + badge config |
| `docs/design/component-specs/node-styles-spec.md` | This specification |

---

## 2. Icon System

All icons use [Lucide React](https://lucide.dev/) with consistent sizing and stroke properties.

### Icon Sizing

| Context | Size | Token |
|---------|------|-------|
| Default (zoom 60–150%) | 20px | `--cs-node-icon-size` |
| Compact (zoom 30–60%) | 16px | `--cs-node-icon-size-compact` |
| Expanded (zoom >150%) | 24px | `--cs-node-icon-size-expanded` |
| Minimal (zoom <30%) | 28px | Centered in rectangle |

**Stroke width:** 1.75 (slightly heavier than Lucide default for dark-bg legibility)

### Agent Icons

| Subtype | Lucide Icon | Description |
|---------|-------------|-------------|
| Default | `bot` | Generic AI agent |
| Researcher | `search` | Web/data research agent |
| Writer | `pen-line` | Content generation agent |
| Analyst | `bar-chart-3` | Data analysis agent |
| Coordinator | `network` | Multi-agent manager / orchestrator |
| Coder | `code-2` | Code generation agent |
| Reviewer | `shield-check` | QA / validation agent |
| Custom | `user-circle` | User-defined fallback |

**Icon color:** `#a78bfa` (violet-400) — `var(--cs-node-agent-icon)`

### Task Icons

| Subtype | Lucide Icon | Description |
|---------|-------------|-------------|
| Default | `clipboard-list` | Standard task |
| Sequential | `list-ordered` | Ordered step in a sequence |
| Parallel | `git-branch` | Fan-out / concurrent execution |
| Conditional | `git-fork` | If/else branching logic |
| Loop | `repeat` | Iterative / retry task |
| Human Input | `hand` | Human-in-the-loop checkpoint |
| Output | `file-output` | Final deliverable task |
| Custom | `square-check` | User-defined fallback |

**Icon color:** `#38bdf8` (sky-400) — `var(--cs-node-task-icon)`

### Tool Icons

| Subtype | Lucide Icon | Description |
|---------|-------------|-------------|
| Default | `wrench` | Generic tool |
| API | `globe` | HTTP / REST call |
| Database | `database` | DB query tool |
| File | `file-text` | File I/O |
| Search | `search` | Search / retrieval |
| Calculator | `calculator` | Computation |
| Custom | `puzzle` | User-defined fallback |

**Icon color:** `#34d399` (emerald-400) — `var(--cs-node-tool-icon)`

### LLM Provider Icons

| Subtype | Lucide Icon | Description |
|---------|-------------|-------------|
| Default | `sparkles` | Generic LLM |
| OpenAI | `sparkles` | GPT models |
| Anthropic | `brain` | Claude models |
| Local | `hard-drive` | Self-hosted / Ollama |
| Custom | `cpu` | User-defined fallback |

**Icon color:** `#fbbf24` (amber-400) — `var(--cs-node-llm-icon)`

---

## 3. Extended Color Palettes

Each node type has a 14-token color palette covering all interaction and structural needs.

### Color Token Structure (per type)

| Token Suffix | Purpose | Example (Agent) |
|--------------|---------|-----------------|
| `bg` | Default body background | `rgba(124,58,237,0.12)` |
| `bg-hover` | Hover background | `rgba(124,58,237,0.18)` |
| `bg-active` | Active/pressed background | `rgba(124,58,237,0.24)` |
| `bg-muted` | Sidebar palette item background | `rgba(124,58,237,0.06)` |
| `border` | Default border | `#7c3aed` |
| `border-hover` | Hover border (brighter) | `#8b5cf6` |
| `border-focus` | Focus ring border | `#a78bfa` |
| `icon` | Primary icon color | `#a78bfa` |
| `icon-muted` | Disabled/dimmed icon | `rgba(167,139,250,0.6)` |
| `badge-bg` | Type badge background | `rgba(124,58,237,0.2)` |
| `badge-text` | Type badge label color | `#c4b5fd` |
| `header-gradient-start` | Header gradient top | `rgba(124,58,237,0.16)` |
| `header-gradient-end` | Header gradient bottom | `rgba(124,58,237,0.04)` |
| `accent-line` | Left accent stripe | `#7c3aed` |

### Header Gradient

Each node header uses a subtle vertical gradient for visual depth:

```css
.node-header {
  background: linear-gradient(
    to bottom,
    var(--cs-node-{type}-header-start),
    var(--cs-node-{type}-header-end)
  );
}
```

### Left Accent Stripe

A 3px vertical stripe on the left edge of the header provides instant type recognition:

```
┌───┬───────────────────────────────┐
│ ▌ │ ● Icon   Title         Badge  │  ← 3px accent stripe
│ ▌ ├───────────────────────────────┤
│   │ Body content                  │
│   │                               │
└───┴───────────────────────────────┘
```

The accent uses `border-left` with the node type's `accent-line` color and `border-radius: 10px 0 0 0` on the top-left corner to match the node's border radius.

---

## 4. Node Body Fields

### Agent Node Body

```
Role: Data Analyst          ← label: slate-500, value: slate-200
Goal: Analyze trends and…   ← truncated at 3 lines
LLM:  GPT-4o               ← linked provider reference
Tools: 3 connected          ← count with emerald dot
```

### Task Node Body

```
Description: Research the…  ← truncated at 3 lines
Agent: Analyst              ← linked agent reference with violet dot
Output: JSON report         ← expected output format
```

### Tool Node Body

```
Tool: web_search            ← tool identifier (mono font)
Schema: { query: string }   ← truncated schema summary
Returns: string             ← return type
```

### LLM Node Body

```
Provider: OpenAI            ← provider name
Model: gpt-4o              ← model ID (mono font)
Temp: 0.7                  ← temperature value
Max tokens: 4096           ← token limit
```

### Body Styling

| Property | Value | Token |
|----------|-------|-------|
| Label font | Inter 12px/1.5 medium (500), slate-500 | `--cs-node-body-label-color` |
| Value font | Inter 12px/1.5 regular (400), slate-200 | `--cs-node-body-value-color` |
| Label width | 64px fixed | `--cs-node-body-label-width` |
| Field gap | 4px | `--cs-node-body-field-gap` |
| Max visible lines | 3 (then `text-overflow: ellipsis`) | — |
| Separator | 1px `rgba(148,163,184,0.1)` between header and body | `--cs-node-body-separator` |

---

## 5. Status Badge System

Status badges are small pills displayed in the node header, right-aligned.

### Badge Anatomy

```
┌─────────────────┐
│  ● RUNNING      │   ← dot (optional, animated) + label
└─────────────────┘
```

### Badge Dimensions

| Property | Value |
|----------|-------|
| Height | 18px |
| Padding | 0 6px |
| Border radius | 9px (pill shape) |
| Font | 10px / 18px, weight 600, `letter-spacing: 0.05em`, uppercase |
| Activity dot | 6px circle, 4px gap from label |

### Badge States

| State | Label | Background | Text Color | Dot | Icon |
|-------|-------|------------|------------|-----|------|
| Idle | IDLE | `rgba(100,116,139,0.2)` | `#94a3b8` | — | — |
| Running | RUNNING | `rgba(16,185,129,0.25)` | `#34d399` | ● blinking emerald | — |
| Done | DONE | `rgba(16,185,129,0.2)` | `#10b981` | — | `check` |
| Error | ERROR | `rgba(244,63,94,0.2)` | `#fb7185` | — | `alert-circle` |
| Disabled | DISABLED | `rgba(71,85,105,0.2)` | `#64748b` | — | — |
| Queued | QUEUED | `rgba(148,163,184,0.15)` | `#94a3b8` | — | `clock` |

### Badge Animation

- **Enter:** Pop-in scale from 0.7 → 1.0 (150ms, spring easing)
- **Running dot:** Opacity blink 1.0 → 0.3 → 1.0 (1s, infinite)
- **State change:** Cross-fade with 150ms overlap

---

## 6. State Visual Treatments

### State Machine (Extended)

```
                    ┌──────────┐
           ┌───────│   IDLE   │◄─────────────┐
           │       └────┬─────┘              │
           │            │ enqueue()          │ complete()
           │            ▼                    │
           │       ┌──────────┐        ┌────┴─────┐
  disable()│       │  QUEUED  │───────►│ SUCCESS  │
           │       └────┬─────┘ run()  └──────────┘
           │            │                    ▲
           │            ▼                    │
           │       ┌──────────┐              │
           │       │ RUNNING  │──────────────┘
           │       └────┬─────┘
           │            │ error()
           │            ▼
           │       ┌──────────┐
           │       │  ERROR   │
           │       └──────────┘
           ▼
      ┌──────────┐
      │ DISABLED │
      └──────────┘
```

### Idle

- Border: type color, 1.5px solid
- Shadow: `var(--cs-shadow-node)` — base elevation
- Opacity: 1.0
- Badge: "IDLE" — slate

### Hover (interaction state, overlays execution state)

```css
.cs-node:hover {
  border-width: var(--cs-node-hover-border-width);          /* 2px */
  background-color: var(--cs-node-{type}-bg-hover);         /* +6% opacity */
  box-shadow: var(--cs-node-hover-shadow);                  /* elevated */
  cursor: pointer;
  transition: var(--cs-node-hover-transition);              /* 100ms ease-out */
}
```

### Selected (interaction state)

```css
.cs-node.selected {
  box-shadow: var(--cs-node-selected-glow);
  /* 2px violet ring + 25% violet outer glow */
  transition: var(--cs-node-selected-transition);           /* 150ms ease-out */
}
```

### Dragging (interaction state)

```css
.cs-node.dragging {
  transform: scale(var(--cs-node-dragging-scale));          /* 1.02 */
  box-shadow: var(--cs-node-dragging-shadow);               /* deep shadow */
  opacity: var(--cs-node-dragging-opacity);                 /* 0.95 */
  cursor: grabbing;
  transition: var(--cs-node-dragging-transition);
}
```

### Running

- Border: type color, 2px solid
- Animation: `cs-node-running-pulse` — emerald glow cycles 0 → 8px spread → 0 (1.5s infinite)
- Badge: "RUNNING" with blinking emerald dot
- Z-index: elevated above idle nodes

### Success

- Animation: `cs-node-success-flash` — emerald burst + scale 1.03 peak (600ms)
- Border briefly flashes `#10b981`
- Badge: "DONE" with check icon (fades in via `cs-badge-enter`)
- Then transitions back to Idle state

### Error

- Border: `#f43f5e` (rose-500) overrides type color
- Animation: `cs-node-error-pulse` — rose glow cycles (1.5s infinite)
- Background: subtle diagonal stripe pattern overlay at 6% opacity
- Badge: "ERROR" with `alert-circle` icon
- Persists until manually dismissed or retried

### Disabled

- Opacity: 0.4
- Border: `#475569` (slate-600) — desaturated
- No hover/click interactions (`pointer-events: none`)
- Badge: "DISABLED" — slate
- Icon uses muted variant (60% opacity)

### Queued

- Opacity: 0.7
- Border: type color, dashed style
- Badge: "QUEUED" with `clock` icon
- Subtle pending feel — ready but not yet executing

---

## 7. Type-Aware Connection Handles

When handles are connected, they adopt the color of the connected node type:

| Connection Target | Handle Fill Color |
|-------------------|-------------------|
| → Agent | `#8b5cf6` (violet-500) |
| → Task | `#0ea5e9` (sky-500) |
| → Tool | `#10b981` (emerald-500) |
| → LLM | `#f59e0b` (amber-500) |

### Drag Feedback

During edge creation (dragging from a handle):

- **Compatible handles** pulse with violet glow (`cs-handle-pulse`, 800ms)
- **Incompatible handles** show red tint (`rgba(244,63,94,0.3)`) with no pulse
- **Handle labels** appear on hover: 10px text, slate-400, 6px offset from circle

### Validation Rules

| Source → Target | Valid? |
|-----------------|--------|
| Agent → Task | ✅ |
| Agent → Tool | ✅ |
| Agent → LLM | ✅ |
| Task → Task | ✅ |
| Task → Agent | ✅ |
| Tool → * | ❌ (tools are leaf nodes) |
| LLM → * | ❌ (LLMs are leaf nodes) |

---

## 8. Zoom-Adaptive Rendering

Node detail scales with canvas zoom level:

### Level 1: Full Detail (zoom ≥ 60%)

```
┌──────────────────────────────────────┐
│  ▌ 🤖  Agent Name          ● IDLE   │
├──────────────────────────────────────┤
│  Role: Data Analyst                  │
│  Goal: Analyze data and…             │
│  Tools: 2 connected                  │
├──────────────────────────────────────┤
│  ○─────────────────────────────────○ │
└──────────────────────────────────────┘
```

All elements: accent stripe, icon, title, badge, body fields, handles.

### Level 2: Compact (zoom 30–60%)

```
┌──────────────────────────┐
│  🤖  Agent Name   ● IDLE │
│  ○───────────────────○   │
└──────────────────────────┘
```

Header + handles only. Body collapsed. Icon shrinks to 16px. Badge remains.

### Level 3: Minimal (zoom < 30%)

```
┌────────┐
│   🤖   │
└────────┘
```

Colored rectangle matching type border color at 12% opacity. Centered 28px icon. No text, no handles, no badge. Type identifiable by color alone.

### Level 4: Expanded (zoom ≥ 150%)

```
┌──────────────────────────────────────────────┐
│  ▌ 🤖  Agent Name                   ● IDLE  │
├──────────────────────────────────────────────┤
│  Role:       Data Analyst                    │
│  Goal:       Analyze data and produce…       │
│  Backstory:  Experienced data analyst…       │
│  LLM:        GPT-4o (OpenAI)                │
│  Tools:      web_search, calculator          │
│  Max Retries: 3                              │
│  Timeout:    30s                             │
├──────────────────────────────────────────────┤
│  Connections:                                │
│  ○ input ← Task: Research          (sky)     │
│  output → Tool: web_search ○     (emerald)   │
│  output → Tool: calculator ○     (emerald)   │
├──────────────────────────────────────────────┤
│  ○───────────────────────────────────────○   │
└──────────────────────────────────────────────┘
```

All configuration fields visible. Connection list with type-colored dots. Full descriptions without truncation.

---

## 9. Accessibility

### Color Contrast

All text-on-background combinations meet WCAG AA (4.5:1 ratio minimum):

| Element | Foreground | Background | Ratio |
|---------|-----------|------------|-------|
| Node title (agent) | `#f8fafc` | `rgba(124,58,237,0.12)` on `#1e293b` | 12.8:1 ✅ |
| Badge text (idle) | `#94a3b8` | `rgba(100,116,139,0.2)` on `#1e293b` | 5.2:1 ✅ |
| Badge text (error) | `#fb7185` | `rgba(244,63,94,0.2)` on `#1e293b` | 5.8:1 ✅ |
| Body label | `#64748b` | `#1e293b` | 4.6:1 ✅ |
| Body value | `#e2e8f0` | `#1e293b` | 10.3:1 ✅ |

### Reduced Motion

When `prefers-reduced-motion: reduce`:
- All pulse animations → static glow (no oscillation)
- Node enter/exit → instant opacity change, no scale
- Badge dot → static (always visible)
- Success flash → instant color change

See `@media (prefers-reduced-motion: reduce)` block in `node-styles-variables.css`.

### ARIA Patterns

```html
<div
  role="button"
  aria-label="Agent: Data Analyst — Running"
  aria-describedby="node-123-details"
  tabindex="0"
>
  <!-- Node content -->
  <div id="node-123-details" class="sr-only">
    Agent node. Role: Data Analyst. Goal: Analyze data.
    Connected to 2 tools. Currently running.
  </div>
</div>
```

- State changes announced via `aria-live="polite"` region
- Focus ring matches selected ring style (`--cs-node-selected-glow`)
- Keyboard: `Enter` to edit, `Space` to select, arrow keys to move

---

## 10. Implementation Guide

### React Flow Custom Node

```tsx
// Pseudocode — structure for React Flow custom node
import { nodeIconMap, nodeStateBadges } from '@/design/tailwind/node-styles-theme';
import * as LucideIcons from 'lucide-react';

function CrewspaceNode({ data, selected }) {
  const { type, subtype, state, name, fields } = data;
  const iconName = nodeIconMap[type][subtype] ?? nodeIconMap[type].default;
  const Icon = LucideIcons[iconName];
  const badge = nodeStateBadges[state];

  return (
    <div className={cn(
      'cs-node',
      `cs-node--${type}`,
      `cs-node--${state}`,
      selected && 'cs-node--selected',
    )}>
      {/* Header */}
      <div className="cs-node__header">
        <div className="cs-node__accent" />
        <Icon size={20} strokeWidth={1.75} />
        <span className="cs-node__title">{name}</span>
        <NodeBadge {...badge} state={state} type={type} />
      </div>

      {/* Body */}
      <div className="cs-node__body">
        {fields.map(f => (
          <div key={f.key} className="cs-node__field">
            <span className="cs-node__label">{f.key}:</span>
            <span className="cs-node__value">{f.value}</span>
          </div>
        ))}
      </div>

      {/* Handles */}
      <Handle type="target" position="left" />
      <Handle type="source" position="right" />
    </div>
  );
}
```

### CSS Class Structure

```css
.cs-node                      /* Base node container */
.cs-node--agent               /* Agent type modifier */
.cs-node--task                /* Task type modifier */
.cs-node--tool                /* Tool type modifier */
.cs-node--llm                 /* LLM type modifier */
.cs-node--idle                /* State: idle */
.cs-node--running             /* State: running (applies pulse) */
.cs-node--success             /* State: success (applies flash) */
.cs-node--error               /* State: error (applies pulse) */
.cs-node--disabled            /* State: disabled (reduces opacity) */
.cs-node--queued              /* State: queued (dashed border) */
.cs-node--selected            /* Interaction: selected */
.cs-node--dragging            /* Interaction: being dragged */
.cs-node__header              /* Header region */
.cs-node__accent              /* Left accent stripe */
.cs-node__title               /* Title text */
.cs-node__body                /* Body region */
.cs-node__field               /* Body field row */
.cs-node__label               /* Field label */
.cs-node__value               /* Field value */
.cs-node__badge               /* Status badge pill */
.cs-node__badge-dot           /* Animated activity dot */
```

### Token Import Order

```css
/* In your main stylesheet */
@import './canvas-variables.css';        /* Base canvas tokens (TASK-132) */
@import './node-styles-variables.css';   /* Extended node tokens (TASK-133) */
```

```typescript
// In tailwind.config.ts
import { crewspaceTheme } from './canvas-theme';       // TASK-132
import { nodeStylesTheme } from './node-styles-theme';  // TASK-133

export default {
  theme: {
    extend: {
      ...crewspaceTheme,
      ...nodeStylesTheme,
    },
  },
};
```

---

## 11. Design Decision Log

| Decision | Rationale |
|----------|-----------|
| 14 color tokens per type | Covers all states (idle/hover/active/muted/focus) without runtime computation |
| Subtype icons via Lucide | Consistent stroke weight, MIT license, tree-shakeable, 27 icons keep bundle small |
| 3px left accent stripe | Instant type recognition even at compact zoom — works alongside border color |
| Queued state added | Original spec (TASK-132) had 5 states; real workflows need a "waiting" state before running |
| Header gradient | Subtle depth cue that separates header from body without hard dividers |
| Type-aware handle colors | Visual data-flow tracing: users can follow connection types by color |
| 4 zoom levels | Balances information density with performance at extreme zoom levels |
| Badge dot animation | Running state needs continuous "alive" feedback; dot blink is minimal CPU |
| Error diagonal stripe | Differentiates error from running at a glance, especially for color-blind users |

---

## Appendix: Token File Reference

| File | Tokens | Purpose |
|------|--------|---------|
| `src/design/tokens/node-styles.json` | 120+ | Full DTCG-format token set |
| `src/design/css/node-styles-variables.css` | 90+ vars, 8 keyframes | CSS custom properties, ready to import |
| `src/design/tailwind/node-styles-theme.ts` | Theme object + icon map + badge config | Tailwind integration + TS types |
