# Workflow Card & List Views — Component Specification

**Task:** TASK-149  
**Epic:** 19 — Dashboard & Workflow Management UI  
**Priority:** P1  
**Author:** Designer Agent  
**Status:** Complete  
**Depends on:** TASK-148 (Dashboard UI spec — ✅ done)

---

## 1. Overview

Workflow cards (grid view) and workflow rows (list view) are the primary surfaces for browsing, managing, and acting on saved workflows in the dashboard. Both views display the same data with different information density:

- **Grid view** — visual-first with thumbnail previews, ideal for scanning
- **List view** — information-dense table, ideal for sorting and bulk actions

Users toggle between views via the toolbar's view toggle control (defined in the Dashboard UI spec).

### Design Principles

- **Recognizable at a glance** — thumbnail previews let users visually identify workflows
- **Action proximity** — common actions are at most one click away
- **Progressive disclosure** — show key metadata inline; advanced actions in ⋯ menu
- **Consistent token usage** — all values derive from the shared design token system
- **Selection support** — both views support single and multi-select for bulk operations

---

## 2. Workflow Card — Grid View

### 2.1 Card Anatomy

```
┌──────────────────────────────────────┐
│                                      │
│    Miniature Canvas Preview          │
│    (node dots + edge lines)          │
│                                      │
│                  [▶] [📋] [⋯]  ←── Quick Actions (hover only)
├──────────────────────────────────────┤
│  My Workflow Title                   │
│  Short description of what this      │
│  workflow does, truncated at 2...    │
│                                      │
│  ┌──┬──┬──┬────┐                     │
│  │🟣│🔵│🟢│ +2 │  3 agents · 12 runs │
│  └──┴──┴──┴────┘                     │
├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
│  [ACTIVE ●]     Edited 5m ago  [⋯]  │
└──────────────────────────────────────┘
```

### 2.2 Card Dimensions

| Property | Value | Token |
|----------|-------|-------|
| Width | 320px (default) | `--card-w` |
| Min width | 280px | `--card-min-w` |
| Max width | 360px | `--card-max-w` |
| Border radius | 12px | `--card-radius` / `--cs-radius-xl` |
| Grid gap | 16px | `--card-gap` |
| Grid columns | `repeat(auto-fill, minmax(280px, 1fr))` | — |

### 2.3 Thumbnail Area

The thumbnail renders a **miniature canvas preview** — a simplified, non-interactive representation of the workflow's node graph.

| Property | Value | Token |
|----------|-------|-------|
| Height | 160px (standard) / 120px (compact) | `--thumb-h` / `--thumb-h-compact` |
| Background | `rgba(10,14,26,0.8)` | `--thumb-bg` |
| Bottom border | 1px `var(--cs-border-subtle)` | `--thumb-border-bottom` |
| Border radius | 12px 12px 0 0 (top only) | `--thumb-radius-top` |
| Overlay gradient | `linear-gradient(180deg, transparent 60%, rgba(10,14,26,0.6) 100%)` | `--thumb-overlay-gradient` |

#### Miniature Node Rendering

Nodes are rendered as colored **dots** positioned relative to their canvas coordinates, scaled to fit within the thumbnail bounds with 16px padding.

| Node Type | Dot Color | Token |
|-----------|-----------|-------|
| Agent | `#a78bfa` (violet-400) | `--thumb-node-agent` |
| Task | `#38bdf8` (sky-400) | `--thumb-node-task` |
| Tool | `#34d399` (emerald-400) | `--thumb-node-tool` |
| LLM | `#fbbf24` (amber-400) | `--thumb-node-llm` |

- **Dot size:** 8px diameter, filled circle
- **Edge lines:** 1px `rgba(148,163,184,0.25)`, straight lines connecting dot centers
- **Running overlay:** When status is `running`, a pulsing emerald dot (`#34d399`) appears in the top-right corner of the thumbnail

#### Empty Thumbnail

When a workflow has no nodes:
- Display a centered workflow icon (32px, `#475569`)
- Use 60% opacity

#### Quick Action Buttons

Quick action buttons appear on **hover only**, floating over the bottom-right of the thumbnail.

```
           [▶ Run] [📋 Duplicate] [⋯ More]
```

| Property | Value | Token |
|----------|-------|-------|
| Container bg | `rgba(15,23,42,0.8)` | `--qa-bg` |
| Container radius | 8px | `--qa-container-radius` |
| Button size | 28px × 28px | `--qa-btn-size` |
| Icon size | 14px | `--qa-icon-size` |
| Icon color | `var(--cs-text-secondary)` | `--qa-icon-color` |
| Icon hover | `var(--cs-text-primary)` | `--qa-icon-color-hover` |
| Gap | 4px between buttons | `--qa-gap` |

**Animation:** Fade in + slide up (`cs-quick-actions-in`, 150ms ease-out)

### 2.4 Card Body

| Element | Font | Weight | Color | Lines |
|---------|------|--------|-------|-------|
| Title | 14px / 0.875rem | 600 | `--cs-text-primary` | 1 (ellipsis) |
| Description | 12px / 0.75rem | 400 | `--cs-text-secondary` | 2 (ellipsis) |

- **Body padding:** 16px
- **Gap between elements:** 8px

### 2.5 Agent Avatar Stack

A horizontal stack of overlapping circular avatars representing the agents in this workflow.

```
[🟣][🔵][🟢][+2]
```

| Property | Value | Token |
|----------|-------|-------|
| Avatar size | 20px | `--avatar-size` |
| Overlap | -4px margin-left | `--avatar-overlap` |
| Border | 2px ring matching card bg | `--avatar-border` |
| Max visible | 3 | — |
| Overflow pill bg | `var(--cs-surface-elevated)` | `--avatar-overflow-bg` |
| Overflow text | `var(--cs-text-tertiary)`, 9px | `--avatar-overflow-text` |

Each avatar shows:
- A **colored circle** matching the agent's node color (from canvas tokens)
- Optionally, the first letter of the agent name in white (8px font)

### 2.6 Metadata Row

Inline metadata displayed between the avatar stack and the footer:

```
3 agents · 12 runs · 5 nodes
```

| Property | Value | Token |
|----------|-------|-------|
| Color | `var(--cs-text-tertiary)` | `--meta-color` |
| Font | 11px / 0.6875rem, weight 400 | `--meta-font-size` |
| Icon size | 12px | `--meta-icon-size` |
| Separator | `·` in `#475569` | `--meta-separator-color` |
| Gap | 8px between items | `--meta-gap` |

Metadata items can include:
- **Agent count** — `👤 3 agents` (Users icon)
- **Run count** — `▶ 12 runs` (Play icon)
- **Node count** — `◆ 5 nodes` (Diamond icon)

### 2.7 Card Footer

Separated by a subtle border-top, the footer contains status + last edited + action trigger.

```
[ACTIVE ●]     Edited 5m ago  [⋯]
```

| Property | Value | Token |
|----------|-------|-------|
| Padding | 12px 16px | `--footer-padding` |
| Border top | 1px `var(--cs-border-subtle)` | `--footer-border-top` |
| Layout | Flex row, space-between, align-center | — |

### 2.8 Status Badge

Pill-shaped badge with animated status dot.

| Status | Text | Background | Dot | Dot Animation |
|--------|------|------------|-----|---------------|
| DRAFT | `#94a3b8` | `rgba(148,163,184,0.1)` | `#94a3b8` | static |
| ACTIVE | `#10b981` | `rgba(16,185,129,0.1)` | `#10b981` | static |
| RUNNING | `#34d399` | `rgba(52,211,153,0.1)` | `#34d399` | **pulse** (2s) |
| ERROR | `#f43f5e` | `rgba(244,63,94,0.1)` | `#f43f5e` | static |
| PAUSED | `#fbbf24` | `rgba(251,191,36,0.1)` | `#fbbf24` | static |
| ARCHIVED | `#64748b` | `rgba(100,116,139,0.1)` | `#64748b` | static |

- **Height:** 20px
- **Padding:** 2px 8px
- **Radius:** 9999px (pill)
- **Font:** 10px / 600 / 0.05em tracking / uppercase
- **Dot:** 6px circle, 4px gap from text
- **RUNNING dot animation:** `cs-status-dot-pulse` — opacity oscillates 1→0.4→1 over 2s, infinite

### 2.9 Actions Menu (⋯ More)

A dropdown menu triggered by the ⋯ icon button in the card footer.

#### Trigger Button

| Property | Value |
|----------|-------|
| Size | 28px × 28px |
| Icon | `more-horizontal` (Lucide), 16px |
| Color | `var(--cs-text-tertiary)` → hover: `var(--cs-text-primary)` |
| Hover bg | `rgba(148,163,184,0.1)` |
| Radius | 6px |

#### Menu

| Property | Value |
|----------|-------|
| Width | 200px |
| Background | `var(--cs-surface-elevated)` |
| Border | 1px `var(--cs-border-default)` |
| Radius | 8px |
| Shadow | `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(148,163,184,0.1)` |
| Padding | 4px |
| Animation | `cs-action-menu-in` — 120ms spring fade + scale |

#### Menu Items

| Action | Icon | Type |
|--------|------|------|
| Open in Editor | `external-link` | default |
| Run Workflow | `play` | default |
| Duplicate | `copy` | default |
| Rename | `pencil` | default |
| Share | `share-2` | default |
| Export | `download` | default |
| — | — | divider |
| Archive | `archive` | default |
| Delete | `trash-2` | **destructive** |

**Item styles:**
- Height: 32px, padding: 0 12px
- Font: 13px / 400
- Icon: 14px, left-aligned, `var(--cs-text-tertiary)`
- Default text: `var(--cs-text-secondary)` → hover: `var(--cs-text-primary)`
- Hover bg: `rgba(148,163,184,0.08)`
- Destructive text: `#fb7185` → hover: `#fda4af`
- Destructive hover bg: `rgba(244,63,94,0.08)`

### 2.10 Card States & Interactions

| State | Visual Changes | Transition |
|-------|---------------|------------|
| Default | Base shadow, card bg, default border | — |
| Hover | Elevated bg, stronger border, deeper shadow, thumbnail scale(1.02), quick actions visible | 150ms ease-out |
| Selected | Violet border, selected bg, selected shadow | 150ms ease-out |
| Focus (keyboard) | 2px violet focus ring (`--cs-border-focus`) | instant |
| Disabled / Loading | 50% opacity, no pointer events | 200ms ease-out |

### 2.11 Card Enter Animation

| Property | Value |
|----------|-------|
| Name | `cs-card-enter` |
| Duration | 250ms |
| Easing | `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring) |
| From | `opacity: 0; scale(0.92); translateY(8px)` |
| To | `opacity: 1; scale(1); translateY(0)` |
| Stagger | 50ms per card index (max 500ms total) |

---

## 3. Workflow List — Table View

### 3.1 Table Layout

```
┌─────┬─────┬──────────────────────┬──────────┬──────────┬───────────┬───────────┬──────┐
│  ☐  │ 🔮  │ Name                 │ Status   │ Agents   │ Last Run  │ Created   │  ⋯   │
├─────┼─────┼──────────────────────┼──────────┼──────────┼───────────┼───────────┼──────┤
│  ☐  │ 🔮  │ My Workflow          │ [ACTIVE] │ 🟣🔵🟢  │ 5m ago    │ Apr 1     │  ⋯   │
│     │     │ AI research crew     │          │          │           │           │      │
├─────┼─────┼──────────────────────┼──────────┼──────────┼───────────┼───────────┼──────┤
│  ☐  │ 🔮  │ Data Pipeline        │ [DRAFT]  │ 🟣      │ Never     │ Mar 28    │  ⋯   │
│     │     │ Extract and transform│          │          │           │           │      │
└─────┴─────┴──────────────────────┴──────────┴──────────┴───────────┴───────────┴──────┘
```

### 3.2 Column Configuration

| Column | Width | Alignment | Content |
|--------|-------|-----------|---------|
| Checkbox | 40px fixed | center | Selection checkbox |
| Icon | 40px fixed | center | Workflow type icon |
| Name | flex: 1 (min 200px) | left | Title + subtitle |
| Status | 100px fixed | left | Status badge |
| Agents | 120px fixed | left | Avatar stack |
| Last Run | 120px fixed | left | Relative timestamp |
| Created | 120px fixed | left | Date string |
| Actions | 48px fixed | center | ⋯ more button |

### 3.3 Table Header

| Property | Value | Token |
|----------|-------|-------|
| Height | 40px | `--header-h` |
| Background | `var(--cs-surface-card)` | `--header-bg` |
| Bottom border | 1px `var(--cs-border-default)` | `--header-border` |
| Text color | `var(--cs-text-tertiary)` | `--header-text` |
| Font | 11px / 600 / uppercase / 0.05em tracking | — |
| Sticky | `position: sticky; top: 0; z-index: 10` | — |

#### Sort Indicators

Clickable column headers for Name, Status, Last Run, Created:
- Default icon: `chevron-up-down`, 12px, `var(--cs-text-tertiary)`
- Active sort icon: `chevron-up` or `chevron-down`, `#a78bfa` (violet-400)

### 3.4 Table Rows

| State | Background | Border |
|-------|-----------|--------|
| Default | transparent | 1px bottom `var(--cs-border-subtle)` |
| Hover | `rgba(30,41,59,0.5)` | unchanged |
| Selected | `rgba(139,92,246,0.08)` | unchanged |
| Focus | transparent + 2px inset violet ring | — |

- **Row height:** 56px
- **Row padding:** 0 16px
- **Transition:** 150ms ease-out on background

### 3.5 Row Checkbox

| Property | Value |
|----------|-------|
| Size | 16px × 16px |
| Border | 1px `var(--cs-border-default)` |
| Border (checked) | `#8b5cf6` |
| Background (checked) | `#7c3aed` |
| Checkmark | white, 2px stroke |
| Radius | 4px |

### 3.6 Workflow Icon

A small colored icon representing the workflow:

| Property | Value |
|----------|-------|
| Container | 32px × 32px |
| Background | `rgba(139,92,246,0.1)` |
| Radius | 6px |
| Icon | `workflow` (Lucide), 16px, `#a78bfa` |

### 3.7 Name Cell

Two lines: title (bold) + subtitle (muted):

| Line | Font | Color |
|------|------|-------|
| Title | 13px / 500 | `var(--cs-text-primary)` |
| Subtitle | 11px / 400 | `var(--cs-text-tertiary)` |

Gap between lines: 2px.

### 3.8 Row Enter Animation

- **Name:** `cs-row-enter`
- **Duration:** 200ms ease-out
- **From:** `opacity: 0; translateX(-8px)`
- **To:** `opacity: 1; translateX(0)`
- **Stagger:** 30ms per row (max 300ms)

### 3.9 Bulk Actions Bar

When one or more rows are selected, a floating toolbar animates in from the bottom of the list.

```
┌──────────────────────────────────────────────┐
│  3 selected   [▶ Run]  [📋 Duplicate]  [🗑 Delete]  [✕ Clear]  │
└──────────────────────────────────────────────┘
```

| Property | Value | Token |
|----------|-------|-------|
| Height | 44px | `--bulk-h` |
| Background | `var(--cs-surface-elevated)` | `--bulk-bg` |
| Border | 1px `var(--cs-border-default)` | `--bulk-border` |
| Radius | 8px | `--bulk-radius` |
| Shadow | `0 4px 24px rgba(0,0,0,0.5)` | `--bulk-shadow` |
| Position | fixed bottom center, 24px from bottom edge | — |
| Animation | `cs-bulk-bar-in` — 200ms spring slide up | — |

**Bulk action buttons:**
- Height: 28px, padding: 0 12px
- Background: `rgba(148,163,184,0.08)` → hover: `rgba(148,163,184,0.15)`
- Text: `var(--cs-text-secondary)` → hover: `var(--cs-text-primary)`
- Count badge: `var(--cs-text-primary)`, weight 600

---

## 4. Shared Behaviors

### 4.1 View Switching

When toggling between grid and list views:
- **Animation:** Cross-fade, 200ms ease-out (reuse `cs-view-switch` from dashboard)
- **State preservation:** Scroll position resets; selection state is preserved
- **Default view:** Grid (stored in user preference)

### 4.2 Selection Model

| Interaction | Grid View | List View |
|-------------|-----------|-----------|
| Single click | Opens workflow editor | Opens workflow editor |
| Click checkbox (list) | — | Toggles selection |
| Ctrl/Cmd + Click | Toggles selection | Toggles selection |
| Shift + Click | Range select (reading order) | Range select (row order) |
| Ctrl/Cmd + A | Select all visible | Select all visible |
| Escape | Clear selection | Clear selection |

### 4.3 Drag & Drop (future)

Placeholder for future reorder support — cards and rows should accept `draggable` attribute. No visual implementation in this spec.

### 4.4 Loading States

**Skeleton cards** (grid): 3 cards with animated shimmer:
- Thumbnail: solid `rgba(30,41,59,0.5)`, pulsing
- Title line: 60% width, 14px height, rounded
- Description: 2 lines at 80% and 50% width
- Footer: circle + short line

**Skeleton rows** (list): 5 rows with animated shimmer:
- Icon: 32px circle, pulsing
- Name: 40% width line
- Status: 60px pill
- Other cells: short lines

---

## 5. Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Focus visible | 2px violet ring (`--cs-border-focus` / `#8b5cf6`) on all interactive elements |
| Contrast | All text meets 4.5:1 minimum contrast against surfaces |
| Status indicators | Color + text label + dot (never color-alone) |
| Keyboard nav (grid) | Arrow keys to move focus between cards; Enter to open; Space to select |
| Keyboard nav (list) | Arrow Up/Down to move between rows; Enter to open; Space to select |
| Screen reader (grid) | Cards use `role="article"` with `aria-label` including workflow name + status |
| Screen reader (list) | Table uses proper `<th>` + `<td>` structure with `scope="col"` |
| Menu | `role="menu"`, `role="menuitem"`, `aria-expanded` on trigger |
| Reduced motion | Wrap all animations in `@media (prefers-reduced-motion: reduce)` — disable or shorten to 0ms |

---

## 6. Responsive Behavior

| Breakpoint | Grid View | List View |
|-----------|-----------|-----------|
| ≥1280px | 3–4 columns, full card | All columns visible |
| 1024–1279px | 2–3 columns | Hide Created column |
| 768–1023px | 2 columns, compact thumbnail (120px) | Hide Created + Agents columns |
| <768px | 1 column, full width | Hide Created + Agents + Last Run; Name column fills space |

On mobile (<768px), quick action buttons are always visible (no hover on touch devices).

---

## 7. Design Token Files

| File | Purpose |
|------|---------|
| `src/design/tokens/workflow-card-list.json` | Design token definitions (JSON) |
| `src/design/css/workflow-card-list-variables.css` | CSS custom properties |
| `src/design/tailwind/workflow-card-list-theme.ts` | Tailwind theme extensions |

All tokens reference the shared primitive/semantic tokens from `colors.json`, `typography.json`, and `spacing.json`.

---

## 8. Implementation Notes for Frontend

1. **Thumbnail renderer:** Build a lightweight `<WorkflowThumbnail>` component that accepts an array of `{ x, y, type }` node positions and renders colored dots + lines on a `<canvas>` or as SVG. Scale coordinates to fit within thumbnail bounds with 16px padding.

2. **Status dot animation:** Use a CSS `@keyframes` animation rather than JS interval for the running status pulse. Only animate when the `running` status class is applied.

3. **Quick actions:** Use `opacity: 0` + `pointer-events: none` by default; on card hover set `opacity: 1` + `pointer-events: auto`. On touch devices, always show.

4. **Actions menu:** Use a portal/popover for the dropdown menu to avoid overflow clipping from the card container. Position below-right of trigger by default, flip up if near viewport bottom.

5. **Bulk actions bar:** Use `position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%)`. Ensure it has a high z-index above the content but below modals.

6. **Virtual scrolling:** For lists with >100 items, consider virtualizing rows. Cards in grid view should lazy-load thumbnails as they enter the viewport.
