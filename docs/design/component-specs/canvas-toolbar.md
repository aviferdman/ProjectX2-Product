# Component Spec: Canvas Toolbar

> Part of TASK-132 — Visual Canvas UI Design

---

## Overview

The toolbar is a horizontal control bar pinned to the top of the canvas viewport. It provides quick access to node creation, canvas navigation, workflow actions, and display settings.

---

## Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Logo] │ +Agent +Task +Tool +LLM │ │ ◇Select ✋Pan 🔍+ 🔍- ⊡Fit │ │ ↩ ↪ 🗑 │ │ ⚙ ≡ │ │ ▶ Run │
└─────────────────────────────────────────────────────────────────────────────────┘
  Brand    Add Nodes (group 1)   │  Navigation (group 2)   │ Edit (g3) │ View (g4) │  Run (g5)
```

### Group structure

| Group | Position | Items |
|-------|----------|-------|
| **Brand** | Left | Crewspace logo / workflow name (editable) |
| **Add Nodes** | Left | +Agent, +Task, +Tool, +LLM (icon + label) |
| **Navigation** | Center-left | Select tool, Hand tool, Zoom In, Zoom Out, Fit View |
| **Edit** | Center | Undo, Redo, Delete |
| **View** | Center-right | Toggle Grid, Toggle Snap, Toggle Minimap |
| **Run** | Right | Run Workflow (primary CTA), Stop |

Groups are separated by 1px vertical dividers with 8px horizontal margin.

---

## Dimensions

| Property | Value |
|----------|-------|
| Height | 48px |
| Background | `var(--cs-surface-panel)` (`#0f172a`) |
| Border bottom | 1px `var(--cs-border-subtle)` |
| Shadow | `var(--cs-shadow-toolbar)` |
| Padding | `0 12px` |
| Button size | 36×36px |
| Icon size | 18px |
| Button gap | 4px |
| Divider gap | 8px on each side |

---

## Button States

### Icon button (default)

| State | Background | Icon color | Border |
|-------|-----------|------------|--------|
| Default | transparent | `var(--cs-text-secondary)` | none |
| Hover | `var(--cs-surface-elevated)` | `var(--cs-text-primary)` | none |
| Active (pressed) | `rgba(139,92,246,0.15)` | `var(--cs-brand-primary)` | none |
| Active tool (toggled) | `rgba(139,92,246,0.12)` | `var(--cs-brand-primary)` | none |
| Disabled | transparent | `var(--cs-text-tertiary)` | none, opacity 0.5 |

### Run button (primary CTA)

| State | Background | Text | Icon |
|-------|-----------|------|------|
| Default | `var(--cs-brand-primary)` | white | ▶ Play |
| Hover | `#6d28d9` (violet-700) | white | ▶ Play |
| Running | `var(--cs-status-error)` | white | ■ Stop |
| Disabled | `var(--cs-text-tertiary)` | muted | ▶ Play |

Run button: `border-radius: 6px`, `padding: 6px 16px`, font: 13px semibold.

---

## Add Node Buttons

Each node-add button shows the node type icon in its accent color:

| Button | Icon | Color | Dropdown |
|--------|------|-------|----------|
| +Agent | `bot` | violet-400 | Optional: list of defined agents |
| +Task | `clipboard-list` | sky-400 | Optional: list of defined tasks |
| +Tool | `wrench` | emerald-400 | Shows available tools |
| +LLM | `sparkles` | amber-400 | Shows configured providers |

Behavior:
- **Click**: Add default node at viewport center
- **Click+Hold (200ms)**: Show dropdown with options
- **Drag from button**: Ghost node follows cursor, drop on canvas

---

## Tooltips

- Appear 200ms after hover, below the button
- Style: dark pill (`var(--cs-surface-elevated)`), 12px text, 4px 8px padding, `border-radius: 4px`
- Include keyboard shortcut: e.g., "Undo (Ctrl+Z)"
- Disappear immediately on mouse leave

---

## Responsive behavior

| Breakpoint | Adaptation |
|------------|------------|
| ≥ 1280px | Full toolbar: icons + labels for Add group, all groups visible |
| 768–1279px | Icons only (no labels), View group collapses into overflow menu |
| < 768px | Two-row toolbar or bottom toolbar. Add nodes → FAB (floating action button) |

---

## Overflow menu (⋮)

For items that don't fit or are less frequent:

| Item | Shortcut |
|------|----------|
| Save Workflow | Ctrl+S |
| Export as JSON | — |
| Import Workflow | — |
| Keyboard Shortcuts | ? |
| Canvas Settings | — |

Style: dropdown menu, `var(--cs-shadow-dropdown)`, 200px min-width, 8px border-radius.

---

## Accessibility

- `role="toolbar"` with `aria-label="Canvas toolbar"`
- Arrow keys navigate between buttons within the toolbar
- Active tool announced via `aria-pressed="true"`
- All buttons have `aria-label` with descriptive text
- Focus visible: 2px violet ring
