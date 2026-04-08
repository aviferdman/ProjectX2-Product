# Debugging Timeline UI — Component Specification

**Task:** TASK-140  
**Epic:** 18 — Debugging Timeline UI Design & Implementation  
**Priority:** P0  
**Author:** Designer Agent  
**Status:** Complete

---

## 1. Overview

The Debugging Timeline is a split-panel view that lets users inspect the execution history of a multi-agent workflow run. It provides three integrated subsystems:

| Component | Purpose |
|-----------|---------|
| **Timeline Chart** | Horizontal swimlane chart showing agent activity across time |
| **Log Viewer** | Scrollable table of detailed log entries with syntax highlighting |
| **Filter Bar** | Controls for narrowing visible events by agent, type, level, and text |

The panel sits below the canvas viewport (or in a dedicated route) and can be resized vertically via a drag handle.

---

## 2. Layout

```
┌──────────────────────────────────────────────────────────┐
│  Filter Bar  [Agent ▾] [Type ▾] [Level ▾] [🔍 Search…]  │
├─────────┬────────────────────────────────────────────────┤
│         │  Time Axis  │ 00:00   00:05   00:10   00:15   │
│ Agent 1 │  ██ LLM ██  ▪ tool    ██ LLM ██               │
│ Agent 2 │        ▪ task-start   ██ tool █   ✕ error      │
│ Agent 3 │                ██ message ██   ██ LLM ██       │
│         │                  ▲ playhead                     │
├─────────┴────────────────────────────────────────────────┤
│  ⬌  Resize handle                                        │
├──────────────────────────────────────────────────────────┤
│  Log Viewer                                              │
│  TIME       LEVEL  AGENT     MESSAGE                     │
│  00:03.120  INFO   Agent 1   Starting LLM call to gpt-4o │
│  00:03.450  DEBUG  Agent 1   Prompt: "Analyze the data…" │
│  00:05.780  WARN   Agent 2   Tool timeout after 2s       │
│  00:06.100  ERROR  Agent 2   Connection refused: API…    │
└──────────────────────────────────────────────────────────┘
```

### 2.1 Panel Sizing

| Property | Value | Notes |
|----------|-------|-------|
| Min height | 200px | Collapsed state |
| Default height | 320px | Initial on open |
| Max height | 600px | Upper limit before scroll |
| Resize handle | 6px grab area | Cursor: `ns-resize` |

### 2.2 Split Ratio

The timeline chart and log viewer share vertical space. Default split is **60% chart / 40% log**, adjustable by dragging the internal resize handle.

---

## 3. Timeline Chart

### 3.1 Time Axis

- **Position:** Top of chart area, sticky on vertical scroll
- **Height:** 32px
- **Background:** `--timeline-header-bg` (slate-900)
- **Labels:** Relative timestamps (e.g., `00:05`, `01:30`) or absolute if run spans >1 hour
- **Tick marks:** Major ticks every 5s/30s/5min (auto-scaled to zoom level), minor ticks subdivided
- **Grid lines:** Vertical dashed lines at major ticks, color `rgba(148,163,184,0.06)`
- **Font:** `0.6875rem / 400` (11px Inter), color `--cs-text-tertiary`

### 3.2 Agent Lanes (Swimlanes)

| Property | Value |
|----------|-------|
| Height | 48px per lane |
| Background | Alternating `rgba(15,23,42,0.6)` / `rgba(15,23,42,0.8)` |
| Divider | 1px `--cs-border-subtle` between lanes |
| Label width | 160px, sticky on horizontal scroll |
| Label bg | `--cs-surface-panel` with right border |
| Label font | `0.75rem / 600` (12px semibold Inter) |
| Agent color dot | 8px circle matching the agent's node color from canvas |

Lanes auto-expand when an agent has overlapping events (sub-rows within a lane).

### 3.3 Event Blocks

Events are rendered as colored rounded rectangles within their agent's lane. Width represents duration; point events (e.g., task-start) render as circular markers.

#### Event Types & Colors

| Type | Background | Border | Icon | Description |
|------|-----------|--------|------|-------------|
| LLM Call | `rgba(245,158,11,0.2)` | amber-500 | ⚡ amber-400 | LLM inference request |
| Tool Use | `rgba(16,185,129,0.2)` | emerald-500 | 🔧 emerald-400 | Tool execution |
| Task Start | `rgba(14,165,233,0.2)` | sky-500 | ▶ sky-400 | Task begins (point marker) |
| Task Complete | `rgba(16,185,129,0.15)` | emerald-500 | ✓ emerald-400 | Task finishes (point marker) |
| Error | `rgba(244,63,94,0.2)` | rose-500 | ✕ rose-400 | Error occurred |
| Message | `rgba(139,92,246,0.15)` | violet-500 | 💬 violet-400 | Agent-to-agent message |

#### Event Block Sizing

| Property | Value |
|----------|-------|
| Min width | 8px (for very short events) |
| Height | 28px |
| Border radius | 4px |
| Border width | 1.5px |
| Marker size | 12px (point events) |
| Internal padding | 4px 6px |
| Label | Event name, truncated with ellipsis |
| Label font | `0.6875rem / 500` (11px medium) |

#### Event States

| State | Visual Treatment |
|-------|-----------------|
| Default | Type-specific bg + border |
| Hover | Opacity 0.85, tooltip appears with event details |
| Selected | 2px violet-500 ring + `rgba(139,92,246,0.25)` glow, log viewer scrolls to entry |
| Running (live) | Pulsing right edge (event width grows in real-time) |
| Filtered out | `display: none` (removed from layout) |

### 3.4 Playhead

- **Line:** 2px wide, color `#8b5cf6` (violet-500)
- **Handle:** 12px inverted triangle at the top of the axis
- **Glow:** `rgba(139,92,246,0.3)` when actively playing
- **Animation:** Gentle pulse (`cs-playhead-pulse`, 2s ease-in-out infinite)
- **Interaction:** Drag to scrub, click axis to jump, keyboard ← → to step

### 3.5 Zoom & Pan

| Gesture | Action |
|---------|--------|
| Scroll wheel | Zoom in/out on time axis |
| Shift + scroll | Horizontal pan |
| Click + drag on axis | Select time range |
| Pinch (trackpad) | Zoom |
| Double-click axis | Reset to fit all events |

Zoom levels adapt tick density automatically (sub-second → seconds → minutes → hours).

---

## 4. Log Viewer

### 4.1 Structure

A virtualized table (only visible rows rendered) showing detailed log entries.

#### Columns

| Column | Width | Content |
|--------|-------|---------|
| Timestamp | 100px | Relative time, monospace, `#64748b` |
| Level | 56px | Badge: DEBUG / INFO / WARN / ERROR |
| Agent | 120px | Agent name with color dot |
| Message | Flex (remaining) | Log text, supports syntax highlighting for JSON/code |

### 4.2 Row Styling

| Property | Value |
|----------|-------|
| Height | 32px |
| Background | Alternating transparent / `rgba(30,41,59,0.3)` |
| Hover bg | `rgba(30,41,59,0.6)` |
| Selected bg | `rgba(139,92,246,0.1)` |
| Border | 1px bottom `rgba(51,65,85,0.3)` |
| Font | `0.75rem / 400` (12px Inter), monospace for timestamps |

### 4.3 Level Badges

Each log level renders as a small pill badge:

| Level | Text Color | Background | Example |
|-------|-----------|------------|---------|
| DEBUG | slate-400 `#94a3b8` | `rgba(148,163,184,0.1)` | `DEBUG` |
| INFO | sky-400 `#38bdf8` | `rgba(14,165,233,0.1)` | `INFO` |
| WARN | amber-400 `#fbbf24` | `rgba(245,158,11,0.1)` | `WARN` |
| ERROR | rose-400 `#fb7185` | `rgba(244,63,94,0.1)` | `ERROR` |

Badge: `0.625rem / 600` (10px semibold), `letter-spacing: 0.05em`, uppercase, border-radius full, padding `2px 6px`.

### 4.4 Log Interactions

| Feature | Behavior |
|---------|----------|
| Click row | Select row, highlight corresponding event in timeline |
| Click event in timeline | Log viewer scrolls to matching log entry |
| Auto-scroll | When live, new logs appear at bottom; user scroll up pauses auto-scroll |
| Expand row | Click to expand multi-line message (JSON payloads, stack traces) |
| Copy | Right-click → copy log line / entire visible logs |
| Search highlight | Matching text shown with `rgba(251,191,36,0.3)` background |

### 4.5 Syntax Highlighting

Log messages containing JSON, code snippets, or stack traces use the monospace font (`JetBrains Mono`) and syntax coloring:

| Token | Color |
|-------|-------|
| String | emerald-400 `#34d399` |
| Number | amber-400 `#fbbf24` |
| Boolean/null | violet-400 `#a78bfa` |
| Key | sky-400 `#38bdf8` |
| Error text | rose-400 `#fb7185` |

---

## 5. Filter Bar

### 5.1 Layout

Horizontal bar above the timeline chart:

```
[Agent ▾] [Event Type ▾] [Log Level ▾]  ──  🔍 Search logs...  ──  [⏸ Pause] [↻ Reset]
```

| Property | Value |
|----------|-------|
| Height | 40px |
| Background | `--cs-surface-card` (slate-800) |
| Padding | 0 12px |
| Gap between chips | 8px |
| Border bottom | 1px `--cs-border-subtle` |

### 5.2 Filter Chips

Rounded pill buttons that toggle filter dropdowns:

| State | Background | Border | Text |
|-------|-----------|--------|------|
| Default | `--cs-surface-elevated` (slate-700) | `--cs-border-default` | `--cs-text-secondary` (slate-400) |
| Active (has filter) | `rgba(139,92,246,0.2)` | violet-500 | violet-300 `#c4b5fd` |
| Hover | Lighten 5% | — | — |

**Chip sizing:** Height 28px, padding `0 12px`, border-radius full (pill), font `0.6875rem / 500`.

### 5.3 Filter Dropdowns

| Property | Value |
|----------|-------|
| Background | `--cs-surface-card` |
| Border | 1px `--cs-border-default` |
| Shadow | `--cs-shadow-dropdown` |
| Border radius | 8px |
| Max height | 240px (scrollable) |
| Item height | 32px |
| Item hover | `--cs-surface-elevated` |
| Checkboxes | Violet-500 checked, slate-700 unchecked |

#### Agent Filter

Multi-select list of agents in the workflow. Each item shows the agent's color dot + name.

#### Event Type Filter

Checkboxes for: LLM Call, Tool Use, Task Start, Task Complete, Error, Message.

#### Log Level Filter

Checkboxes for: DEBUG, INFO, WARN, ERROR. Each with its level-colored dot.

### 5.4 Search

| Property | Value |
|----------|-------|
| Width | 240px (expandable to 360px on focus) |
| Background | `--cs-surface-elevated` |
| Border | 1px `--cs-border-default`, focus: violet-500 |
| Placeholder | "Search logs…" in `--cs-text-tertiary` |
| Icon | 🔍 left-aligned, 16px |
| Clear button | ✕ right-aligned when has value |
| Debounce | 200ms |
| Matches | Highlighted in log viewer + count badge on search input |

### 5.5 Playback Controls

| Control | Icon | Behavior |
|---------|------|----------|
| Pause/Play | ⏸ / ▶ | Toggle live auto-scrolling |
| Reset | ↻ | Clear all filters, reset zoom |
| Speed | 1× / 2× / 4× | Playback speed when replaying |

---

## 6. Cross-Component Interactions

### 6.1 Timeline ↔ Log Viewer Sync

- **Click event block** → Log viewer scrolls to the first log entry for that event; row highlighted
- **Click log row** → Timeline scrolls horizontally to show the event; event highlighted with selection ring
- **Playhead movement** → Log viewer auto-scrolls to entries at playhead time (when auto-scroll enabled)
- **Time range selection** → Both chart and log viewer filter to selected range

### 6.2 Timeline ↔ Canvas Sync (future)

- Selecting an agent lane highlights the corresponding node on the canvas
- Event details panel can link back to the node properties

### 6.3 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Toggle playback pause/play |
| `←` / `→` | Step to previous/next event |
| `Shift + ←` / `→` | Jump 5 events |
| `Home` / `End` | Jump to start/end of timeline |
| `+` / `-` | Zoom in/out |
| `0` | Reset zoom to fit all |
| `F` | Focus search input |
| `Esc` | Clear selection, close dropdown |

---

## 7. Responsive Behavior

| Breakpoint | Adaptation |
|-----------|------------|
| Desktop (≥1280px) | Full layout as described |
| Tablet (768–1279px) | Lane labels collapse to icons only (48px), filter chips become icon-only |
| Mobile (<768px) | Timeline and log viewer stack vertically, filters move to a drawer |

---

## 8. Accessibility

| Feature | Implementation |
|---------|---------------|
| Focus management | All interactive elements keyboard-reachable via Tab |
| ARIA roles | `role="grid"` on log viewer, `role="slider"` on playhead, `role="toolbar"` on filter bar |
| Screen readers | Event blocks have `aria-label` (e.g., "LLM call, Agent 1, 00:03 to 00:05, 2s duration") |
| Color contrast | All text meets WCAG 2.1 AA (4.5:1 minimum). Level badges use bg tinting, not color alone |
| Reduced motion | Respect `prefers-reduced-motion`: disable pulse animations, use instant transitions |
| Focus visible | Violet-500 ring on all focusable elements |

---

## 9. Design Token Files

| File | Purpose |
|------|---------|
| `src/design/tokens/timeline.json` | All timeline design tokens (colors, sizing, animations) |
| `src/design/css/timeline-variables.css` | CSS custom properties for timeline components |
| `src/design/tailwind/timeline-theme.ts` | Tailwind theme extensions |

---

## 10. Dependencies

This design spec is a prerequisite for:

- **TASK-143:** Implement timeline chart (D3.js or Recharts, time axis, agent lanes)
- **TASK-144:** Implement log viewer (display, format, syntax highlighting)
- **TASK-145:** Implement filters and search
- **TASK-146:** Implement timeline playback and step-through
