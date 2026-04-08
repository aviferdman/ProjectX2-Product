# Component Spec: Canvas Nodes

> Part of TASK-132 — Visual Canvas UI Design

---

## Overview

Canvas nodes are the primary interactive elements in the workflow editor. Each node represents a Crewspace entity (Agent, Task, Tool, or LLM Provider) and shares a common structural anatomy with type-specific visual differentiation via color and iconography.

---

## Node Anatomy

```
┌──────────────────────────────────────┐
│  Header (40px)                       │
│  ┌──┐                                │
│  │🤖│  Agent Name          ⬤ IDLE   │  ← Icon + Title + Status badge
│  └──┘                                │
├──────────────────────────────────────┤
│  Body (variable height)              │
│                                      │
│  Role: Data Analyst                  │  ← Key config fields (truncated)
│  Goal: Analyze data and…             │
│  Tools: 2 connected                  │
│                                      │
├──────────────────────────────────────┤
│  Handles                             │
│  ○────────────────────────────────○  │  ← Input (left) / Output (right)
└──────────────────────────────────────┘
```

---

## Shared Properties

| Property | Token / Value |
|----------|---------------|
| Width | `220px` default, min `180px`, max `280px` |
| Border radius | `10px` (`--cs-radius-node`) |
| Border width | `1.5px` default, `2px` on hover |
| Background | Type-specific translucent tint over `var(--cs-surface-card)` |
| Shadow | `var(--cs-shadow-node)` |
| Header padding | `10px 12px` |
| Body padding | `8px 12px` |
| Section gap | `6px` |

---

## Node Types

### Agent Node

- **Icon**: User/Bot icon (Lucide `bot`) — 20px, `#a78bfa`
- **Header bg**: `rgba(124,58,237,0.12)`
- **Border**: `#7c3aed` (violet-600)
- **Badge**: "AGENT" pill, violet bg/text
- **Body fields**: Role, Goal, LLM Provider, Tools count
- **Handles**: 0-1 input (from tasks), 1+ output (to tasks)

### Task Node

- **Icon**: Clipboard/checklist icon (Lucide `clipboard-list`) — 20px, `#38bdf8`
- **Header bg**: `rgba(14,165,233,0.12)`
- **Border**: `#0284c7` (sky-600)
- **Badge**: "TASK" pill, sky bg/text
- **Body fields**: Description (truncated), Assigned Agent, Expected Output
- **Handles**: 1+ input (from agents/tasks), 1+ output (to agents/tasks)

### Tool Node

- **Icon**: Wrench icon (Lucide `wrench`) — 20px, `#34d399`
- **Header bg**: `rgba(16,185,129,0.12)`
- **Border**: `#059669` (emerald-600)
- **Badge**: "TOOL" pill, emerald bg/text
- **Body fields**: Tool name, Schema summary, Return type
- **Handles**: 1 input (from agent), no outputs

### LLM Provider Node

- **Icon**: Sparkles icon (Lucide `sparkles`) — 20px, `#fbbf24`
- **Header bg**: `rgba(245,158,11,0.12)`
- **Border**: `#d97706` (amber-600)
- **Badge**: "LLM" pill, amber bg/text
- **Body fields**: Provider, Model ID, Temperature, Max tokens
- **Handles**: 1 input (from agent), no outputs

---

## State Machine

```
                  ┌─────────┐
         ┌───────│  IDLE    │◄──────────┐
         │       └────┬─────┘           │
         │            │ run()           │ complete()
         │            ▼                 │
         │       ┌─────────┐      ┌────┴─────┐
 disable()│      │ RUNNING  │─────►│ SUCCESS  │
         │       └────┬─────┘      └──────────┘
         │            │ error()
         │            ▼
         │       ┌─────────┐
         │       │  ERROR   │
         │       └──────────┘
         ▼
    ┌──────────┐
    │ DISABLED │
    └──────────┘
```

### State visual mapping

| State | Border | Animation | Opacity | Badge |
|-------|--------|-----------|---------|-------|
| **Idle** | Type color, 1.5px | None | 1.0 | "IDLE" — slate |
| **Running** | Type color, 2px | `running-pulse` (emerald glow, 1.5s) | 1.0 | "RUNNING" — emerald, animated |
| **Success** | Emerald flash (600ms) → idle | Brief glow | 1.0 | "DONE" — emerald |
| **Error** | Rose tint | `error-pulse` (rose glow, 1.5s) | 1.0 | "ERROR" — rose |
| **Disabled** | Slate, muted | None | 0.4 | "DISABLED" — slate |

---

## Connection Handles

Handles are the connection ports on nodes.

| Property | Value |
|----------|-------|
| Shape | Circle |
| Size | 10px diameter |
| Position | Left edge (input), Right edge (output), vertically centered |
| Default fill | `#1e293b` |
| Default border | 2px `#64748b` |
| Hover fill | `#7c3aed` |
| Hover border | `#a78bfa` |
| Connected fill | `#8b5cf6` |
| Hit area | 20px invisible area for click targeting |

### Handle placement rules

- Single-handle nodes: centered vertically
- Multi-handle nodes: evenly distributed with 24px minimum gap
- Input handles: left edge
- Output handles: right edge

---

## Interaction States

### Hover

```css
.node:hover {
  border-width: 2px;
  box-shadow: var(--cs-shadow-node-hover);
  cursor: pointer;
  transition: all 100ms ease-out;
}
```

### Selected

```css
.node.selected {
  box-shadow: var(--cs-shadow-node-selected);
  /* 2px violet ring + 25% violet glow */
}
```

### Dragging

- Node lifts (scale 1.02, increased shadow)
- Snap indicators show at 10px grid intersections
- Semi-transparent guide lines to nearest aligned nodes

### Context menu (right-click)

| Item | Shortcut |
|------|----------|
| Edit Properties | Enter |
| Duplicate | Ctrl+D |
| Delete | Delete |
| Disconnect All | — |
| Copy | Ctrl+C |
| Set as Start Node | — |

---

## Responsive behavior

| Breakpoint | Behavior |
|------------|----------|
| Default (zoom 100%) | Full node with all fields visible |
| Zoom < 60% | Collapse body, show header only (icon + title) |
| Zoom < 30% | Show colored rectangle with icon only |
| Zoom > 150% | Show expanded detail (all config fields) |

---

## Accessibility

- Tab order follows left-to-right, top-to-bottom node position
- `role="button"` with `aria-label="[Type]: [Name] — [State]"`
- Focus ring matches selected ring style
- State changes announced via `aria-live="polite"` region
- Keyboard: Enter to edit, Space to select, Arrow keys to move (with Shift for fine control)
