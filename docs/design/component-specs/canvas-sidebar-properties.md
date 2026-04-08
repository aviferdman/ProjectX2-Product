# Component Spec: Sidebar & Properties Panel

> Part of TASK-132 — Visual Canvas UI Design

---

## Part A: Sidebar (Node Library)

### Overview

The sidebar is a collapsible panel on the left edge of the canvas. It serves as the node library — users browse, search, and drag nodes onto the canvas.

### Layout

```
┌────────────────────────────┐
│  🔍 Search nodes...       │  ← Search input (Cmd+K)
├────────────────────────────┤
│  ▼ AGENTS                  │  ← Collapsible section
│  ┌────────────────────────┐│
│  │ ● Analyst              ││  ← Draggable node item
│  │   Data analysis agent  ││
│  └────────────────────────┘│
│  ┌────────────────────────┐│
│  │ ● Researcher           ││
│  │   Research agent       ││
│  └────────────────────────┘│
├────────────────────────────┤
│  ▼ TASKS                   │
│  ┌────────────────────────┐│
│  │ ● Analyze Data         ││
│  │   Process and analyze  ││
│  └────────────────────────┘│
├────────────────────────────┤
│  ▼ TOOLS                   │
│  ...                       │
├────────────────────────────┤
│  ▼ LLM PROVIDERS           │
│  ...                       │
├────────────────────────────┤
│  ▸ TEMPLATES                │  ← Collapsed by default
│  ▸ RECENT                   │
└────────────────────────────┘
```

### Dimensions

| Property | Value |
|----------|-------|
| Width (expanded) | 280px |
| Width (collapsed) | 48px (icon rail) |
| Background | `var(--cs-surface-panel)` |
| Border right | 1px `var(--cs-border-subtle)` |
| Shadow | none (border sufficient) |
| Padding | 12px |

### Search input

| Property | Value |
|----------|-------|
| Height | 36px |
| Background | `var(--cs-surface-card)` |
| Border | 1px `var(--cs-border-default)` |
| Focus border | `var(--cs-border-focus)` (violet) |
| Placeholder | "Search nodes..." `var(--cs-text-tertiary)` |
| Icon | Magnifying glass, 16px, left inset |
| Shortcut hint | "⌘K" pill, right inset |
| Font | 13px regular |
| Border radius | 6px |

### Section headers

| Property | Value |
|----------|-------|
| Font | 11px semibold, uppercase |
| Color | `var(--cs-text-tertiary)` |
| Letter spacing | `0.05em` |
| Padding | `16px 0 8px 0` |
| Chevron | 12px, rotates 90° on expand/collapse |
| Accent bar | 2px left border in section color (violet/sky/emerald/amber) |

### Node palette items

| Property | Value |
|----------|-------|
| Height | 48px (2-line) or 36px (1-line) |
| Background | transparent |
| Hover background | `var(--cs-surface-card)` |
| Border radius | 8px |
| Padding | `8px 10px` |
| Icon | 18px, type-specific color |
| Title | 13px semibold, `var(--cs-text-primary)` |
| Description | 12px regular, `var(--cs-text-secondary)`, single line truncated |
| Cursor | `grab` (while dragging: `grabbing`) |

### Drag behavior

1. Mouse down on palette item → 150ms hold threshold
2. Ghost node appears under cursor (60% opacity, matches node design)
3. Canvas shows drop zone indicator (subtle full-area highlight)
4. Release on canvas → node created at drop position with `node-enter` animation
5. Release outside canvas → cancel, ghost fades away

### Collapsed state (icon rail)

- 48px wide, shows only section icons vertically
- Hover on icon → tooltip with section name
- Click icon → expand sidebar to that section
- Expand/collapse toggle button at bottom of rail

---

## Part B: Properties Panel

### Overview

The properties panel is a contextual inspector on the right edge. It shows and edits properties of the currently selected node or edge. When nothing is selected, it shows workflow-level info.

### Layout — Node selected

```
┌────────────────────────────────┐
│  ● Agent: Analyst        [×]  │  ← Type badge + name + close
├────────────────────────────────┤
│  ▼ General                     │
│  Name    [Analyst         ]    │
│  Role    [Data Analyst    ]    │
│  Goal    [Analyze data and│    │
│          produce insights ]    │
├────────────────────────────────┤
│  ▼ LLM Configuration           │
│  Provider [OpenAI        ▾]    │
│  Model    [gpt-4o        ▾]    │
│  Temp     [0.7 ──────●── ]    │
│  Max Tok  [4096          ]     │
├────────────────────────────────┤
│  ▼ Tools (2)                    │
│  ┌─────────────────────┐       │
│  │ 🔧 search          ×│       │
│  │ 🔧 calculator      ×│       │
│  └─────────────────────┘       │
│  [+ Add Tool]                  │
├────────────────────────────────┤
│  ▼ Connections                  │
│  In:  ← Research Task (sky)    │
│  Out: → Report Task (sky)      │
├────────────────────────────────┤
│  ▸ Advanced                     │
│    Max retries, timeout, etc.  │
└────────────────────────────────┘
```

### Layout — Edge selected

```
┌────────────────────────────────┐
│  ─── Edge Connection     [×]  │
├────────────────────────────────┤
│  Source  [Analyst (Agent)]     │
│  Target  [Research (Task)]     │
│  Label   [________________]    │
│  Style   [Smoothstep    ▾]    │
│  Animated [toggle ●─────]     │
├────────────────────────────────┤
│  [🗑 Delete Connection]       │
└────────────────────────────────┘
```

### Layout — Nothing selected

```
┌────────────────────────────────┐
│  📋 Workflow Properties        │
├────────────────────────────────┤
│  Name    [My Workflow    ]     │
│  Desc    [________________]    │
├────────────────────────────────┤
│  Stats                         │
│  Agents: 3  Tasks: 5           │
│  Tools: 4   Edges: 8           │
├────────────────────────────────┤
│  ⌨ Keyboard Shortcuts          │
│  Space+Drag    Pan             │
│  Ctrl+Scroll   Zoom            │
│  Delete        Remove          │
│  Ctrl+Z        Undo            │
│  ...                           │
└────────────────────────────────┘
```

### Dimensions

| Property | Value |
|----------|-------|
| Width | 320px |
| Background | `var(--cs-surface-panel)` |
| Border left | 1px `var(--cs-border-subtle)` |
| Padding | 16px |
| Scroll | Vertical overflow, thin custom scrollbar |

### Header

| Property | Value |
|----------|-------|
| Height | 48px |
| Title | 14px semibold, `var(--cs-text-primary)` |
| Type badge | Colored pill matching node type |
| Close button | 24×24px, `×` icon, hover: `var(--cs-surface-elevated)` |
| Border bottom | 1px `var(--cs-border-subtle)` |

### Section headers

| Property | Value |
|----------|-------|
| Font | 12px semibold, `var(--cs-text-secondary)` |
| Padding | `12px 0 8px 0` |
| Chevron | Collapse/expand toggle |
| Divider | 1px `var(--cs-border-subtle)` above |

### Form controls

| Control | Specs |
|---------|-------|
| **Text input** | 32px height, `var(--cs-surface-card)` bg, 1px `var(--cs-border-default)`, 6px radius |
| **Textarea** | Same as input, min-height 64px, resize vertical |
| **Dropdown** | Same as input + chevron icon, opens `var(--cs-shadow-dropdown)` menu |
| **Slider** | 4px track (`var(--cs-surface-elevated)`), 14px thumb (violet), filled portion in violet |
| **Toggle** | 32×18px, off: `var(--cs-surface-elevated)`, on: `var(--cs-brand-primary)`, 2px ring |
| **Tag/chip** | 24px height, `var(--cs-surface-card)`, 12px text, × button on hover, 4px radius |

Label: 12px medium, `var(--cs-text-secondary)`, 100px width (left-aligned).  
Value: 13px regular, `var(--cs-text-primary)`.

### Animation

- Panel slides in from right (200ms ease-out) when node selected
- Content cross-fades when switching between nodes (150ms)
- Sections collapse/expand with height animation (200ms)

---

## Accessibility

### Sidebar

- `role="complementary"` with `aria-label="Node library"`
- Palette items: `role="option"` within `role="listbox"`, announce type and name
- Drag-and-drop: provide keyboard alternative (select item, press Enter, arrow keys to position, Enter to place)
- Collapse state announced via `aria-expanded`

### Properties Panel

- `role="complementary"` with `aria-label="Properties inspector"`
- Form fields properly labeled with `<label>` and `for` attribute
- Sections: `role="region"` with `aria-label`
- Close button: `aria-label="Close properties panel"`
- Tab order: header → sections top-to-bottom → inputs within sections
