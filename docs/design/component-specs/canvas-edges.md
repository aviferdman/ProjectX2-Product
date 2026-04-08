# Component Spec: Canvas Edges

> Part of TASK-132 — Visual Canvas UI Design

---

## Overview

Edges represent connections between nodes on the canvas. They visualize data flow, task assignment, and tool/LLM bindings in the workflow graph.

---

## Edge Types

| Type | Use Case | Style |
|------|----------|-------|
| **Default** | Agent → Task assignment | Solid line, slate-500 |
| **Data Flow** | Active data transfer | Animated dashed line, sky-400 |
| **Error** | Failed connection | Solid line, rose-400 |

---

## Visual Properties

| Property | Value |
|----------|-------|
| Path type | Smoothstep (rounded right-angle routing via React Flow) |
| Stroke width | 2px default |
| Stroke width (hover) | 3px |
| Default color | `#64748b` (slate-500) |
| Selected color | `#a78bfa` (violet-400) |
| Data-flow color | `#38bdf8` (sky-400) |
| Error color | `#fb7185` (rose-400) |
| Arrow | 12px arrowhead at target end |
| Dash pattern (animated) | `5 5`, animation: `edge-flow 1s linear infinite` |

---

## Edge Labels

Optional text labels displayed at the edge midpoint.

| Property | Value |
|----------|-------|
| Background | `rgba(15,23,42,0.9)` (dark pill) |
| Padding | `2px 6px` |
| Border radius | 4px |
| Font | 12px monospace, `var(--cs-text-secondary)` |
| Max width | 120px (truncated with ellipsis) |

---

## Interaction States

### Default
- Solid 2px stroke, slate-500
- Arrowhead at target

### Hover
- Stroke widens to 3px
- Color brightens slightly
- Cursor: pointer
- Delete button (×) appears at midpoint

### Selected
- Color: violet-400
- Stroke: 3px
- Midpoint controls visible (delete ×, optional label edit)
- Properties panel shows edge details

### Active data flow
- Sky-400 color
- Animated dashes moving from source → target
- Indicates runtime execution

### Error
- Rose-400 color
- Static (no animation)
- Error icon at midpoint

---

## Connection Creation Flow

1. **Hover** output handle → handle highlights (violet fill)
2. **Mouse down + drag** → ghost edge appears from handle
3. **Ghost edge** follows cursor with smoothstep path
4. **Near valid input handle** → target handle pulses, snap indicator
5. **Release on valid target** → edge created, `edge-draw` animation (300ms ease-out)
6. **Release on invalid/empty** → ghost edge snaps back with spring animation, dissolves

### Validation rules
- Cannot connect a node to itself
- Cannot create duplicate edges (same source → same target)
- Handle type compatibility (output → input only)
- Visual feedback: invalid targets dim slightly during drag

---

## Midpoint Controls

When an edge is selected or hovered, a control appears at the path midpoint:

```
        ┌───┐
───────│ × │───────
        └───┘
```

| Control | Size | Action |
|---------|------|--------|
| Delete (×) | 20×20px | Removes the edge |

Style: `var(--cs-surface-elevated)` bg, `var(--cs-text-secondary)` icon, 4px radius. Hover: rose background, white icon.

---

## Accessibility

- Edges are focusable via Tab (after all nodes in tab order)
- `role="link"` with `aria-label="Connection from [Source] to [Target]"`
- Focus visible: edge color changes to violet, 3px stroke
- Delete: press Delete/Backspace when focused
- Screen reader announces: "Connected [Source name] output to [Target name] input"
