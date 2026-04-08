# Visual Canvas UI — Design Specification

> **TASK-132** · P0 · Designer · Crewspace Phase 2  
> Defines the visual design of the workflow canvas: layout, nodes, edges, toolbar, sidebar, and properties panel.

---

## 1. Design Principles

| Principle | Description |
|-----------|-------------|
| **Dark-first** | Developer tooling convention. Deep slate/blue-black backgrounds with high-contrast elements. |
| **Spatial hierarchy** | Nodes are the hero. Background is calm; panels recede. Color is used sparingly and semantically. |
| **Glanceable state** | A user should read the workflow status (idle, running, error) in < 1 second via color and animation cues. |
| **Precision feel** | Snap-to-grid, consistent spacing, pixel-perfect alignment. Conveys trust. |
| **Lovable UX** | Micro-animations (spring easing), subtle glow effects, smooth transitions. Competing with v0/Bolt quality bar. |

---

## 2. Layout Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Toolbar (48px, top, full-width)                                │
├────────┬──────────────────────────────────────┬─────────────────┤
│        │                                      │                 │
│  Side  │        Canvas Viewport               │  Properties     │
│  bar   │        (infinite pan/zoom)           │  Panel          │
│  280px │                                      │  320px          │
│        │                                      │                 │
│        │                       ┌──────────┐   │                 │
│        │                       │ Minimap  │   │                 │
│        │                       │ 200×140  │   │                 │
│        │                       └──────────┘   │                 │
├────────┴──────────────────────────────────────┴─────────────────┤
│  Status bar (optional, 28px)                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Responsive rules

| Breakpoint | Sidebar | Properties | Minimap |
|------------|---------|------------|---------|
| ≥ 1280px (desktop) | Expanded (280px) | Expanded (320px) | Visible |
| 768–1279px (tablet) | Collapsed icon rail (48px) | Slide-over drawer | Hidden |
| < 768px (mobile) | Hidden, hamburger toggle | Full-screen sheet | Hidden |

---

## 3. Canvas Viewport

| Property | Value |
|----------|-------|
| Background | `#0a0e1a` (deep blue-black) |
| Grid pattern | Dot grid, 20px spacing, `rgba(148,163,184,0.12)` |
| Major grid | Every 5th line, `rgba(148,163,184,0.06)` |
| Zoom range | 10%–200% (default 100%) |
| Snap-to-grid | 10px increments (toggleable) |
| Pan | Mouse drag on empty space, middle-click, or Space+drag |
| Zoom | Ctrl+scroll, pinch, or toolbar buttons |

### Selection

- **Click** a node → single select
- **Ctrl+Click** → add/remove from selection
- **Marquee drag** on empty space → box select (dashed violet border, 8% violet fill)
- **Ctrl+A** → select all

### Minimap

- Position: bottom-right, 16px margin
- Size: 200×140px
- Semi-transparent dark background with viewport indicator (violet rectangle)
- Click to jump, drag viewport rectangle to pan

---

## 4. Node Design

All nodes share a common anatomy:

```
┌──────────────────────────────┐
│ ● Icon   Title         Badge │  ← Header (40px, tinted bg)
├──────────────────────────────┤
│ Subtitle / description       │  ← Body (variable height)
│ Key config summary           │
├──────────────────────────────┤
│ ○ input    output ○          │  ← Handles (connection ports)
└──────────────────────────────┘
```

### Shared node properties

| Property | Value |
|----------|-------|
| Default width | 220px |
| Min / Max width | 180px / 280px |
| Corner radius | 10px |
| Border | 1.5px solid (type-specific color) |
| Shadow | `0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(148,163,184,0.1)` |
| Font — title | Inter 13px/1.25, semibold (600) |
| Font — body | Inter 12px/1.5, regular (400) |

### Node types & color mapping

| Type | Background | Border | Icon Color | Badge Color |
|------|-----------|--------|------------|-------------|
| **Agent** | `rgba(124,58,237,0.12)` | `#7c3aed` (violet-600) | `#a78bfa` (violet-400) | violet |
| **Task** | `rgba(14,165,233,0.12)` | `#0284c7` (sky-600) | `#38bdf8` (sky-400) | sky |
| **Tool** | `rgba(16,185,129,0.12)` | `#059669` (emerald-600) | `#34d399` (emerald-400) | emerald |
| **LLM** | `rgba(245,158,11,0.12)` | `#d97706` (amber-600) | `#fbbf24` (amber-400) | amber |

### Node states

| State | Visual Treatment |
|-------|-----------------|
| **Idle** | Default appearance, full opacity |
| **Hover** | Border → 2px, shadow → `node-hover`, cursor: pointer |
| **Selected** | 2px violet ring, violet outer glow (25% opacity) |
| **Running** | Emerald pulse animation (1.5s ease-in-out infinite) |
| **Success** | Brief emerald flash (600ms), then return to idle |
| **Error** | Rose pulse animation, rose border tint |
| **Disabled** | 40% opacity, no interactions |

### Connection handles

- Circles, 10px diameter, positioned at left (input) and right (output) edges
- Default: dark slate fill (`#1e293b`), slate border (`#64748b`)
- Hover: violet fill (`#7c3aed`), lighter violet border (`#a78bfa`)
- Connected: solid violet fill (`#8b5cf6`)
- Hit area: 20px (invisible expanded area for easier targeting)

---

## 5. Edge Design

| Property | Value |
|----------|-------|
| Type | Smoothstep (React Flow) — rounded right-angle paths |
| Stroke width | 2px default, 3px on hover |
| Default color | `#64748b` (slate-500) |
| Active/selected | `#a78bfa` (violet-400) |
| Data flow | `#38bdf8` (sky-400) with animated dash (`5 5` pattern, 1s loop) |
| Error | `#fb7185` (rose-400) |
| Arrow | 12px arrowhead at target handle |
| Label | Optional — dark pill background, 12px mono text |

### Edge interactions

- **Hover**: stroke → 3px, color brightens slightly, cursor changes to pointer
- **Click**: selects the edge, shows delete affordance (×) at midpoint
- **Drag from handle**: shows ghost edge following cursor with snap-to-nearest-handle
- **Delete**: Backspace/Delete key when selected, or click midpoint ×

---

## 6. Toolbar

Position: top of canvas, full-width, 48px height.

```
┌─────────────────────────────────────────────────────────────────┐
│ [+Agent][+Task][+Tool] │ [Select][Hand][Zoom+][Zoom-][Fit] │ ⋮ │
│  ← Add nodes            ← Canvas controls                  Menu│
└─────────────────────────────────────────────────────────────────┘
```

### Toolbar groups

| Group | Items | Description |
|-------|-------|-------------|
| **Add nodes** | +Agent, +Task, +Tool, +LLM | Drop-down or drag-to-canvas. Icons match node type colors. |
| **Canvas controls** | Select (cursor), Hand (pan), Zoom In, Zoom Out, Fit View | Toggle between select/pan modes. Zoom buttons. |
| **Actions** | Undo, Redo, Delete | Standard edit operations |
| **View** | Toggle grid, Toggle minimap, Toggle snap | Canvas display settings |
| **Run** | ▶ Run Workflow, ■ Stop | Primary CTA — filled violet button |
| **Menu** | Save, Export, Settings | Overflow / kebab menu |

### Toolbar styling

| Property | Value |
|----------|-------|
| Background | `var(--cs-surface-panel)` with subtle bottom border |
| Button size | 36×36px icon button |
| Icon size | 18px |
| Gap between buttons | 4px |
| Divider | 1px vertical line, `var(--cs-border-subtle)`, 8px margin |
| Active tool | Violet background tint, violet icon |
| Hover | Elevated surface color |
| Tooltip | Below button, 200ms delay, dark pill |

---

## 7. Sidebar (Node Library)

Position: left edge, 280px wide (collapsible to 48px icon rail).

### Sections

1. **Search** — Filter input at top (Cmd+K shortcut)
2. **Node categories** — Collapsible groups:
   - Agents (violet accent)
   - Tasks (sky accent)
   - Tools (emerald accent)
   - LLM Providers (amber accent)
3. **Templates** — Pre-built workflow patterns
4. **Recent** — Recently used nodes

### Node palette items

```
┌──────────────────────────┐
│ ● Agent Name             │  40px height, rounded-lg
│   Brief description      │  Drag handle on left edge
└──────────────────────────┘
```

- Drag-and-drop from sidebar onto canvas
- Ghost preview follows cursor during drag
- Drop zone highlights when hovering over valid canvas area

### Sidebar styling

| Property | Value |
|----------|-------|
| Background | `var(--cs-surface-panel)` |
| Border | Right: 1px `var(--cs-border-subtle)` |
| Section heading | 13px semibold, uppercase, `var(--cs-text-tertiary)`, wider letter-spacing |
| Collapse | Animated slide (300ms ease-out), icon-only rail mode |

---

## 8. Properties Panel

Position: right edge, 320px wide. Shown when a node or edge is selected.

### Panel structure

```
┌─────────────────────────────┐
│ ● Node Type    Title    [×] │  ← Header with close
├─────────────────────────────┤
│ General                     │
│   Name: [___________]       │
│   Role: [___________]       │
│   Goal: [____________...]   │
├─────────────────────────────┤
│ Configuration               │
│   LLM:  [dropdown     ▾]   │
│   Temp: [0.7    ──●──── ]  │
│   Tools: [+Add tool]       │
├─────────────────────────────┤
│ Connections                 │
│   → Task: Research  (sky)   │
│   → Tool: Search    (green) │
├─────────────────────────────┤
│ Advanced                    │
│   Max retries: [3]          │
│   Timeout: [30s]            │
└─────────────────────────────┘
```

### Properties panel styling

| Property | Value |
|----------|-------|
| Background | `var(--cs-surface-panel)` |
| Border | Left: 1px `var(--cs-border-subtle)` |
| Label | 12px medium, `var(--cs-text-secondary)`, 100px width |
| Value / Input | 13px regular, `var(--cs-text-primary)` |
| Input height | 32px |
| Section divider | 1px `var(--cs-border-subtle)`, 16px vertical margin |
| Scroll | Vertical overflow with subtle scrollbar |

### Empty state

When nothing is selected, show:
- Workflow-level properties (name, description)
- Quick stats (node count, edge count)
- Keyboard shortcuts reference

---

## 9. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Space + Drag` | Pan canvas |
| `Ctrl + Scroll` | Zoom |
| `Ctrl + A` | Select all |
| `Ctrl + Z` | Undo |
| `Ctrl + Shift + Z` | Redo |
| `Delete / Backspace` | Delete selected |
| `Ctrl + D` | Duplicate selected |
| `Ctrl + C / V` | Copy / Paste nodes |
| `Ctrl + S` | Save workflow |
| `Ctrl + K` | Focus sidebar search |
| `Escape` | Deselect all / close panel |
| `F` | Fit view (zoom to fit all nodes) |
| `G` | Toggle grid |
| `M` | Toggle minimap |

---

## 10. Interaction Patterns

### Adding a node

1. **Toolbar**: Click "+Agent" → node appears at center of viewport
2. **Sidebar drag**: Drag node type from sidebar → ghost follows cursor → drop on canvas
3. **Context menu**: Right-click canvas → "Add Node" submenu
4. **Quick add**: Double-click canvas → search popover (like VS Code command palette)

### Connecting nodes

1. Hover over output handle → handle highlights violet
2. Click and drag → ghost edge follows cursor
3. Hover over valid input handle → handle pulses, snap indicator
4. Release → edge created with smooth animation (300ms)
5. Invalid target → edge snaps back (spring animation)

### Moving nodes

- Click and drag node → smooth follow with snap-to-grid (10px)
- Multi-select → drag group maintains relative positions
- Collision avoidance: optional auto-layout suggestion

### Deleting

- Select + Delete key
- Right-click → "Delete" in context menu
- Edge: click midpoint × button

---

## 11. Design Tokens Reference

All design tokens are defined in:

| File | Purpose |
|------|---------|
| `src/design/tokens/colors.json` | Full color palette (primitive + semantic + canvas + node) |
| `src/design/tokens/typography.json` | Font families, sizes, weights, presets |
| `src/design/tokens/spacing.json` | Spacing scale, component sizing, radius, shadows, transitions |
| `src/design/tokens/canvas.json` | Canvas-specific tokens (viewport, node, edge, handle, animation) |
| `src/design/css/canvas-variables.css` | CSS custom properties (ready to import) |
| `src/design/tailwind/canvas-theme.ts` | Tailwind `theme.extend` object |

---

## 12. Implementation Notes

### Recommended libraries

| Library | Purpose |
|---------|---------|
| **React Flow** (v12+) | Canvas engine — nodes, edges, pan, zoom, minimap |
| **Tailwind CSS** (v4+) | Utility styling with custom theme |
| **Framer Motion** | Micro-animations (node enter, pulse states) |
| **Lucide React** | Icon set (consistent 18px stroke icons) |
| **cmdk** | Command palette for quick-add |

### React Flow customization points

- Custom node components for Agent, Task, Tool, LLM types
- Custom edge component with animated dash and midpoint controls
- Custom minimap with themed colors
- Custom connection line with snap feedback

### Accessibility

- All interactive elements keyboard-navigable
- ARIA labels on nodes, edges, toolbar buttons
- Focus visible ring (violet, matches selection style)
- Reduced motion: disable pulse/flow animations, use instant state changes
- Screen reader: announce node additions, connections, deletions
- Color contrast: all text meets WCAG AA on dark backgrounds

---

## Appendix: Visual Reference

### Color palette summary

```
Brand:    ■ #7c3aed (violet)    — Primary accent
Agent:    ■ #7c3aed (violet)    — Agent nodes
Task:     ■ #0284c7 (sky)       — Task nodes
Tool:     ■ #059669 (emerald)   — Tool nodes
LLM:      ■ #d97706 (amber)     — LLM provider nodes
Success:  ■ #10b981 (emerald)   — Running/success states
Error:    ■ #f43f5e (rose)      — Error states
Surface:  ■ #0a0e1a (canvas bg) — Deep blue-black
Panel:    ■ #0f172a (sidebar)   — Slightly lighter
Card:     ■ #1e293b (node bg)   — Node surface
```
