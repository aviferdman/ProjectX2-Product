# Wireframe: Canvas Editor (Workflow Builder)

**Screen:** `/canvas/:workflowId`  
**Purpose:** Visual drag-and-drop environment for building multi-agent AI workflows  
**Task:** TASK-129 — Low-fidelity wireframe  
**References:** TASK-128 (IA), TASK-132 (canvas UI spec), TASK-134 (drag-drop interactions)

---

## 1. Desktop Layout (xl: ≥1280px)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [☰] Crewspace    Dashboard   Canvas   Templates   Marketplace     [🔔] [👤]   │ ← Global nav (48px)
├────────────────────────────────────────────────────────────────────────────────-─┤
│            │                    TOOLBAR (48px)                        │          │
│            │ [+Agent][+Task][+Tool][+LLM] │ [⇦][⇨][🗑] │ [▶ Run] │ [⋮]     │          │
│            ├──────────────────────────────────────────────────────────┤          │
│            │                                                         │          │
│   SIDEBAR  │                                                         │PROPERTIES│
│   (280px)  │                   CANVAS VIEWPORT                       │  PANEL   │
│            │                  (infinite scroll)                      │  (320px) │
│  ┌───────┐ │                                                         │          │
│  │🔍 Srch│ │          ┌──────────┐         ┌──────────┐             │ ┌──────┐ │
│  ├───────┤ │          │  Agent   │────────▶│   Task   │             │ │ Name │ │
│  │AGENTS │ │          │ "Analyst"│         │"Analyze" │             │ ├──────┤ │
│  │ ○ Ana.│ │          └──────────┘         └──────────┘             │ │ Role │ │
│  │ ○ Wri.│ │               │                    │                   │ ├──────┤ │
│  ├───────┤ │               │                    ▼                   │ │Config│ │
│  │ TASKS │ │               │              ┌──────────┐             │ │ LLM: │ │
│  │ ○ Res.│ │               └─────────────▶│   Tool   │             │ │ Temp:│ │
│  │ ○ Wri.│ │                              │ "Search" │             │ │ Tool:│ │
│  ├───────┤ │                              └──────────┘             │ ├──────┤ │
│  │ TOOLS │ │                                                         │ │Connex│ │
│  │ ○ Sear│ │                                                         │ ├──────┤ │
│  │ ○ Calc│ │                                                         │ │Advanc│ │
│  ├───────┤ │                                                         │ └──────┘ │
│  │  LLM  │ │                                                         │          │
│  │ ○ GPT │ │                                               ┌──────┐ │          │
│  │ ○ Clau│ │                                               │Mini- │ │          │
│  └───────┘ │                                               │ map  │ │          │
│            │                                               │200×140│ │          │
│            │                                               └──────┘ │          │
├────────────┴──────────────────────────────────────────────────────────┴──────────┤
│ Status: Saved ✓   │  Zoom: 100%  [−][+]  │  Grid: On  Snap: On              │ ← Status bar (28px)
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Component Zones

| Zone | Width | Height | Position | Notes |
|------|-------|--------|----------|-------|
| Global Nav | 100% | 48px | Top | Persistent across all screens |
| Toolbar | Canvas width | 48px | Below nav, above canvas | Fixed within canvas area |
| Sidebar | 280px | Viewport − nav − status | Left | Collapsible to 48px icon rail |
| Canvas Viewport | Flexible | Viewport − nav − toolbar − status | Center | Infinite pan/zoom area |
| Properties Panel | 320px | Viewport − nav − status | Right | Opens on node selection, closes on Esc/deselect |
| Minimap | 200×140px | Fixed | Bottom-right of canvas (16px margin) | Shows viewport position in workflow |
| Status Bar | 100% | 28px | Bottom | Save status, zoom, grid/snap toggles |

---

## 2. Node Anatomy

```
┌─────────────────────────┐
│ [●] Agent: Analyst      │ ← Header (40px): type icon + colored bar + name
├─────────────────────────┤
│ Role: Data analysis     │ ← Body: summary fields
│ LLM: GPT-4o            │
│ Tools: 2 connected      │
◀────────────────────────▶ ← Handles: input (left ◀), output (right ▶)
└─────────────────────────┘
  220px wide (default)

NODE TYPES (color-coded headers):
  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ ■ AGENT  │  │ ■ TASK   │  │ ■ TOOL   │  │ ■ LLM    │
  │ (violet) │  │  (sky)   │  │(emerald) │  │ (amber)  │
  └──────────┘  └──────────┘  └──────────┘  └──────────┘
```

### Node States

```
  IDLE          HOVER         SELECTED      RUNNING       ERROR
┌────────┐   ┌────────┐   ╔════════╗   ┌┄┄┄┄┄┄┄┄┐   ┌────────┐
│        │   │  ····  │   ║ ●●●●●● ║   ┊ ~~~~~~ ┊   │ !!!! ! │
│  node  │   │  node  │   ║  node  ║   ┊  node  ┊   │  node  │
│        │   │        │   ║        ║   ┊        ┊   │        │
└────────┘   └────────┘   ╚════════╝   └┄┄┄┄┄┄┄┄┘   └────────┘
 default      2px border   violet ring   emerald      rose border
              appears      + shadow       pulse        + icon
```

---

## 3. Edge (Connection) Anatomy

```
  Output handle          Smoothstep curve          Input handle
      ●─────────────────────╮                          ●
                             ╰─────────────────────────
                    ▲
               Arrow (12px)

  EDGE STATES:
  ────────────  Default (2px, slate)
  ═══════════  Hover (3px, lighter)
  ╌╌╌╌▶╌╌╌╌╌  Data flowing (animated dashes, when running)
  ┈┈┈┈┈┈┈┈┈┈  Ghost edge (while dragging new connection)
```

---

## 4. Sidebar Detail

```
┌──────────────────────┐
│ 🔍 Search nodes...   │ ← Search (Cmd+K shortcut)
│                      │    40px height
├──────────────────────┤
│ ▼ AGENTS             │ ← Section header (collapsible)
│   ┌────────────────┐ │
│   │ ◈ Data Analyst │ │ ← Palette item (40px height)
│   ├────────────────┤ │    Drag to canvas
│   │ ◈ Writer       │ │
│   ├────────────────┤ │
│   │ ◈ Researcher   │ │
│   └────────────────┘ │
├──────────────────────┤
│ ▼ TASKS              │
│   ┌────────────────┐ │
│   │ ◇ Research     │ │
│   ├────────────────┤ │
│   │ ◇ Write Report │ │
│   └────────────────┘ │
├──────────────────────┤
│ ▶ TOOLS (collapsed)  │ ← Collapsed section
├──────────────────────┤
│ ▶ LLM PROVIDERS      │
├──────────────────────┤
│ RECENTLY USED         │ ← Quick access
│   ◈ Analyst  ◇ Write │
└──────────────────────┘
```

---

## 5. Properties Panel Detail

```
┌──────────────────────────┐
│ ◈ Agent: Data Analyst [×]│ ← Header with close button
├──────────────────────────┤
│ GENERAL                  │ ← Section
│ ┌──────────────────────┐ │
│ │ Name: [Data Analyst ]│ │ ← Editable field
│ ├──────────────────────┤ │
│ │ Role: [Analyze data ]│ │
│ ├──────────────────────┤ │
│ │ Goal: [Produce insi ]│ │ ← Multiline
│ └──────────────────────┘ │
├──────────────────────────┤
│ CONFIGURATION            │
│ ┌──────────────────────┐ │
│ │ LLM: [GPT-4o      ▾]│ │ ← Dropdown
│ ├──────────────────────┤ │
│ │ Temperature:         │ │
│ │ ◄━━━━━━●━━━━━━━━━━━► │ │ ← Slider (0.0–2.0)
│ │      0.7             │ │
│ ├──────────────────────┤ │
│ │ Tools:               │ │
│ │ [Search ×] [Calc ×]  │ │ ← Chip list
│ │ [+ Add tool]         │ │
│ ├──────────────────────┤ │
│ │ Dependencies:        │ │
│ │ [Research Task    ▾] │ │ ← Multi-select
│ └──────────────────────┘ │
├──────────────────────────┤
│ ▶ CONNECTIONS (read-only)│ ← Collapsed by default
├──────────────────────────┤
│ ▶ ADVANCED               │ ← Retries, timeout, backstory
└──────────────────────────┘
```

---

## 6. Toolbar Detail

```
┌────────────────────────────────────────────────────────────────────────┐
│ [+◈][+◇][+⬡][+◆]  │  [↖][✋][🔍]  │  [⟲][⟳][🗑]  │  [▶ Run] [⋮] │
│  Add nodes           Select/Pan/Zoom  Undo/Redo/Del    Execute  Menu  │
│                                                                        │
│ Button size: 36×36px, 4px gap between buttons                         │
│ Separator: 1px vertical line between groups                           │
│ Menu (⋮): Save, Export (JSON/YAML/TS), Import, Settings, Keyboard ⌨  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Context Menu (Right-Click Canvas)

```
┌────────────────────────┐
│ + Add Agent            │
│ + Add Task             │
│ + Add Tool             │
│ + Add LLM Provider     │
├────────────────────────┤
│ Paste                  │
│ Select All        ⌘A  │
├────────────────────────┤
│ Auto Layout       →   │ ← Submenu: LTR, TTB, Radial
│ Fit View          F   │
│ Toggle Grid       G   │
└────────────────────────┘

(On node right-click)
┌────────────────────────┐
│ Edit Properties        │
│ Duplicate         ⌘D  │
│ Copy              ⌘C  │
├────────────────────────┤
│ Delete            ⌫   │ ← Red text
└────────────────────────┘
```

---

## 8. Tablet Layout (md: 768–1279px)

```
┌─────────────────────────────────────────────────────────────┐
│ [☰] Crewspace                                   [🔔] [👤] │ ← Nav (48px)
├──────┬──────────────────────────────────────────────────────┤
│      │ [+◈][+◇][+⬡][+◆] │ [↖][✋] │ [⟲][⟳] │ [▶ Run]   │ ← Toolbar
│ICON  ├──────────────────────────────────────────────────────┤
│RAIL  │                                                      │
│48px  │                                                      │
│      │              CANVAS VIEWPORT                         │
│ [◈]  │                (full width)                          │
│ [◇]  │                                                      │
│ [⬡]  │         ┌──────────┐       ┌──────────┐            │
│ [◆]  │         │  Agent   │──────▶│   Task   │            │
│      │         └──────────┘       └──────────┘            │
│      │                                                      │
│      │                                                      │
├──────┴──────────────────────────────────────────────────────┤
│ Zoom: 80%  [−][+]                                          │ ← Status (28px)
└─────────────────────────────────────────────────────────────┘

Properties: Slide-over drawer (320px) from right edge
Minimap: Hidden
Sidebar: Collapsed to 48px icon rail; tap icon → popover with category items
```

---

## 9. Mobile Layout (xs: <768px)

```
┌─────────────────────────────┐
│ [☰]  Crewspace     [🔔][👤]│ ← Nav (48px)
├─────────────────────────────┤
│                             │
│                             │
│      CANVAS VIEWPORT        │
│     (full screen, touch)    │
│                             │
│   ┌────────┐  ┌────────┐   │
│   │ Agent  │─▶│  Task  │   │
│   └────────┘  └────────┘   │
│                             │
│                             │
│                             │
├─────────────────────────────┤
│ [+][↖][⟲][⟳][▶]     [⋮] │ ← Bottom toolbar (48px)
└─────────────────────────────┘

Sidebar: Hidden, opens via [☰] hamburger as full-width overlay
Properties: Bottom sheet (drag up to expand, max 60vh)
Minimap: Hidden
Default zoom: 0.6
Canvas: Read-only recommended (editing possible but constrained)
Node drag: Long-press to initiate (avoid scroll conflict)
```

---

## 10. Interaction Zones & Touch Targets

```
CANVAS INTERACTIONS:
┌─────────────────────────────────────────────┐
│                                             │
│    ●──── Handle (10px visual, 44px tap)     │
│    │                                        │
│  ┌─┴────────────┐                           │
│  │              │ ← Node body (click=select)│
│  │              │    44px min height         │
│  └──────────────┘                           │
│         │                                    │
│    ─────┴──── Edge (2px visual, 8px hitbox) │
│                                             │
│  Empty space: pan (drag), context menu      │
│  (right-click), zoom (scroll/pinch)         │
└─────────────────────────────────────────────┘

DRAG-AND-DROP FLOW:
1. Sidebar item → mousedown/touchstart
2. Ghost preview appears (180×48px, dashed border, 0.85 opacity)
3. Drag over canvas → snap indicator appears at 10px grid
4. Drop → node created at grid-snapped position
5. Properties panel opens for new node
```

---

## 11. Keyboard Navigation Map

```
TAB ORDER (desktop):
  Global Nav → Sidebar Search → Sidebar Items → Toolbar → Canvas → Properties Panel

CANVAS SHORTCUTS:
  Space + Drag    Pan canvas
  Ctrl + Scroll   Zoom in/out
  Ctrl + A        Select all nodes
  Ctrl + C/V      Copy/Paste nodes
  Ctrl + Z/Y      Undo/Redo
  Delete/⌫       Delete selected
  F               Fit view
  G               Toggle grid
  Escape          Deselect / Close properties
  Tab             Cycle through nodes (in creation order)
  Enter           Open properties for focused node
  Arrow keys      Nudge selected node (10px increments)

SCREEN READER:
  Canvas announced as "Workflow canvas with N nodes and M connections"
  Each node: "[Type]: [Name], connected to N nodes"
  Toolbar buttons: ARIA labels for all icon-only buttons
```

---

## 12. State Variations

### Empty Canvas
```
┌──────────────────────────────────────┐
│                                      │
│           ┌─────────────┐            │
│           │     🎨      │            │
│           │             │            │
│           │ Start by    │            │
│           │ dragging an │            │
│           │ agent from  │            │
│           │ the sidebar │            │
│           │             │            │
│           │ [+ Add Agent]│            │
│           │ or          │            │
│           │ [Use Template]│           │
│           └─────────────┘            │
│                                      │
└──────────────────────────────────────┘
```

### Running State
```
┌──────────────────────────────────────┐
│ [■ Stop]  Running... 2/5 tasks done  │ ← Toolbar changes
├──────────────────────────────────────┤
│   ┌──────────┐       ┌──────────┐   │
│   │ ✓ Agent  │──────▶│ ~ Task   │   │ ← ✓ = done, ~ = running
│   │ (green)  │       │ (pulse)  │   │     pulse = emerald glow
│   └──────────┘       └──────────┘   │
│        │                   │         │
│        ▼                   ▼         │
│   ┌──────────┐       ┌──────────┐   │
│   │   Tool   │       │ ⏳ Task  │   │ ← ⏳ = pending
│   │ (active) │       │ (dimmed) │   │
│   └──────────┘       └──────────┘   │
├──────────────────────────────────────┤
│ ● Live  │  Elapsed: 12.3s           │ ← Status bar shows timing
└──────────────────────────────────────┘
```

### Error State
```
┌──────────────────────────────────────────────────────┐
│ ⚠ Workflow failed at "Research Task"   [View Logs]   │ ← Error banner (red bg)
├──────────────────────────────────────────────────────┤
│   ┌──────────┐       ┌──────────┐                    │
│   │ ✓ Agent  │──────▶│ ✗ Task   │ ← Red border,     │
│   │          │       │ (error)  │   exclamation icon │
│   └──────────┘       └──────────┘                    │
│                           │                          │
│                    ┌──────────┐                       │
│                    │ ⊘ Tool   │ ← Skipped (dimmed)   │
│                    └──────────┘                       │
└──────────────────────────────────────────────────────┘
```

### Validation Warnings
```
Properties Panel:
┌──────────────────────────┐
│ ⚠ 2 issues               │ ← Warning banner
├──────────────────────────┤
│ Name: [              ]   │ ← Orange border = required
│ ⚠ Name is required       │    field missing
├──────────────────────────┤
│ LLM: [None selected  ▾] │ ← Orange border
│ ⚠ Agent needs an LLM     │
└──────────────────────────┘
```
