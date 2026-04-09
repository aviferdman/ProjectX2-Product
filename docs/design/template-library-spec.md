# Template Library UI — Component Specification

**Task:** TASK-156 — Design template library UI (grid, cards, preview, filters)  
**Epic:** 20 — Template Library UI Design & Implementation  
**Story:** STORY-022 — Workflow Templates Library  
**Status:** Complete

---

## 1. Overview

The Template Library is a browsable gallery of pre-built workflow templates that lets users start from proven agent configurations rather than building from scratch. It features a responsive grid of template cards, category-based navigation, search/filter controls, and a preview modal for inspecting template details before use.

### Design Principles

- **Dark-mode-first** — consistent with the Crewspace design system (Slate grays, Violet accents)
- **Scan-friendly** — large thumbnails, clear hierarchy, visible category colors
- **Low friction** — "Use Template" is one click; preview is optional depth
- **Token-based** — all values reference shared design tokens for theme consistency

---

## 2. Page Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Header (56px)  — Logo • "Templates" breadcrumb • User menu             │
├────────────┬─────────────────────────────────────────────────────────────┤
│  Category  │  Toolbar (52px)  — Search bar • Filter chips • Sort        │
│  Sidebar   ├─────────────────────────────────────────────────────────────┤
│  (220px)   │                                                             │
│            │   ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐          │
│  All       │   │  Card  │  │  Card  │  │  Card  │  │  Card  │          │
│  Research  │   │ 300px  │  │ 300px  │  │ 300px  │  │ 300px  │          │
│  Code      │   └────────┘  └────────┘  └────────┘  └────────┘          │
│  Support   │                                                             │
│  Content   │   ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐          │
│  Data      │   │  Card  │  │  Card  │  │  Card  │  │  Card  │          │
│  Auto.     │   └────────┘  └────────┘  └────────┘  └────────┘          │
│            │                                                             │
│            │  Pagination  ‹ 1 2 3 … ›                                   │
└────────────┴─────────────────────────────────────────────────────────────┘
```

### Responsive Grid Columns

| Breakpoint | Screen Width | Columns | Sidebar    |
|------------|-------------|---------|------------|
| `sm`       | < 640px     | 1       | Hidden     |
| `md`       | 640–1023px  | 2       | Hidden     |
| `lg`       | 1024–1439px | 3       | Visible    |
| `xl`       | ≥ 1440px    | 4       | Visible    |

- **Max content width:** 1440px (wider than dashboard's 1280px to accommodate gallery)
- **Card gap:** 20px
- **Content padding:** 24px

---

## 3. Category Sidebar

The left sidebar provides category navigation with colored icons.

### Categories

| Category    | Color   | Hex       | Icon Suggestion   |
|-------------|---------|-----------|-------------------|
| All         | Violet  | `#a78bfa` | Grid / Gallery     |
| Research    | Sky     | `#38bdf8` | Magnifying glass   |
| Code        | Violet  | `#a78bfa` | Code brackets      |
| Support     | Emerald | `#34d399` | Headset / Chat     |
| Content     | Amber   | `#fbbf24` | Pencil / Document  |
| Data        | Rose    | `#fb7185` | Chart / Database   |
| Automation  | Slate   | `#cbd5e1` | Cog / Bolt         |

### Sidebar Item States

- **Default:** `text-secondary`, transparent background
- **Hover:** `text-primary`, `rgba(30,41,59,0.5)` background
- **Active:** Category color text, `category-bg` tinted background, 2px left accent border in category color
- **Icon container:** 32×32px rounded with `icon-bg` tint

### Behavior

- At `sm`/`md` breakpoints: sidebar collapses; categories become horizontal scrollable chips above the grid
- Each category shows a count badge (e.g., "Research (12)")

---

## 4. Search & Filter Toolbar

A horizontal toolbar above the grid with three sections:

### 4a. Search Bar (left)

- **Height:** 40px
- **Width:** 320px (flexible, max ~400px)
- **Background:** `surface-elevated`
- **Border:** `border-default`, focus → `violet-500` with subtle glow
- **Radius:** `radius-lg` (8px)
- **Icon:** Search (magnifying glass) in `text-tertiary`, left-aligned
- **Placeholder:** "Search templates…"
- **Behavior:** Debounced (300ms), filters cards in real-time, highlights matching text

### 4b. Filter Chips (center)

Horizontal row of toggleable filter chips:

- **Chips:** "Featured" • "Popular" • "New" • "Community"
- **Height:** 30px
- **Radius:** 9999px (pill)
- **Default:** `surface-elevated` bg, `border-default`, `text-secondary`
- **Active:** `rgba(139,92,246,0.2)` bg, `violet-500` border, `violet-300` text
- **Behavior:** Toggle on/off. Multiple chips can be active simultaneously. 150ms ease-out transition.

### 4c. Sort Dropdown (right)

- **Options:** "Most Popular" • "Recently Added" • "A–Z" • "Most Used"
- **Default selection:** "Most Popular"
- **Trigger:** Button with label + chevron icon
- **Menu:** `surface-overlay` bg with `border-default`, `radius-md`, dropdown shadow
- **Item hover:** `rgba(30,41,59,0.5)` bg

---

## 5. Template Card

The primary content unit in the grid.

```
┌────────────────────────────────┐
│                                │
│   Thumbnail (180px)            │  ← Workflow diagram preview
│   [Featured ★] badge           │  ← Top-left corner overlay
│                                │
│   Hover: overlay + Preview btn │
├────────────────────────────────┤
│  ┌──────┐  Title               │  ← 14px semibold
│  │ Icon │  Description (2 line │  ← 12px regular, clamp 2 lines
│  └──────┘  max, then ellipsis) │
│                                │
│  [research] [web] [GPT-4]     │  ← Tags row
│                                │
│  ⬇ 1.2k uses · ★ 4.8          │  ← Meta row
│                                │
│  [ Preview ]  [ Use Template ] │  ← Action buttons
└────────────────────────────────┘
```

### Card Dimensions

| Property       | Value  |
|----------------|--------|
| Base width     | 300px  |
| Min width      | 260px  |
| Max width      | 360px  |
| Thumbnail      | 180px tall |
| Body padding   | 16px   |
| Border radius  | xl (12px) |

### Card States

| State    | Background       | Border         | Shadow                        |
|----------|------------------|----------------|-------------------------------|
| Default  | `surface-card`   | `border-default` | `0 1px 3px rgba(0,0,0,0.3)`  |
| Hover    | `surface-elevated` | `border-strong`  | `0 8px 24px rgba(0,0,0,0.4)` |
| Focus    | `surface-elevated` | `violet-500`     | `0 8px 24px …` + violet ring |

### Thumbnail

- **Background:** `rgba(10,14,26,0.8)` — dark surface showing a mini workflow diagram
- **Border bottom:** `border-subtle` separator
- **Hover overlay:** Gradient from bottom `rgba(10,14,26,0.6)` with centered "Preview" ghost button
- **Badge (optional):** "Featured ★" or "Popular 🔥" badge in top-left corner with 8px inset

### Tags

- **Height:** 22px
- **Font:** 10px / 500 weight / 0.02em tracking
- **Style:** `surface-elevated` bg, `border-subtle` border, `text-tertiary` text
- **Hover:** `rgba(139,92,246,0.12)` bg, `violet-300` text
- **Gap:** 6px between tags
- **Max visible:** 3 tags, then "+N more" overflow indicator

### Meta Row

- **Font:** 11px / 400 weight, `text-tertiary` color
- **Content:** Download/usage count • Star rating • Author name
- **Separator:** Middle dot (·)

### Action Buttons

- **"Use Template" (primary):** Violet-600 bg, white text, 36px tall, `radius-lg`, hover glow
- **"Preview" (secondary):** Transparent bg, violet-300 text, violet-600 border, 36px tall

### Card Animation

- **Enter:** `scale(0.92) translateY(8px)` → `scale(1) translateY(0)`, 250ms spring curve
- **Stagger:** 40ms delay between each card in the grid
- **Hover:** 150ms ease-out for shadow and border transitions

---

## 6. Preview Modal

Opened when clicking "Preview" on a card or clicking the thumbnail overlay.

```
┌─────────────────────────────────────────────────────────────────┐
│  Modal Header (64px)                                     [✕]   │
│  Template Title · Category Badge · ★ Rating                     │
├─────────────────────────────────────────────────┬───────────────┤
│                                                 │  Details      │
│                                                 │               │
│   Workflow Diagram Preview                      │  Author       │
│   (Interactive zoom/pan)                        │  Created      │
│   400px tall                                    │  Uses: 1.2k   │
│                                                 │  Rating: 4.8  │
│                                                 │               │
│                                                 │  Description  │
│                                                 │  (full text)  │
│                                                 │               │
│                                                 │  Agents (3)   │
│                                                 │  Tools (5)    │
│                                                 │               │
│                                                 │  Tags         │
│                                                 │  [research]   │
│                                                 │  [web] [GPT4] │
│                                                 │               │
│                                                 │ [Use Template]│
├─────────────────────────────────────────────────┴───────────────┤
│  Footer: "Use Template" (full width) · "Open in Canvas"         │
└─────────────────────────────────────────────────────────────────┘
```

### Modal Dimensions

| Property       | Value       |
|----------------|-------------|
| Width          | 900px       |
| Max height     | 85vh        |
| Border radius  | xl (12px)   |
| Diagram height | 400px       |
| Sidebar width  | 300px       |

### Modal States & Animations

- **Overlay:** `rgba(0,0,0,0.7)`, 200ms ease-out fade
- **Modal enter:** `scale(0.95) translateY(12px)` → identity, 300ms spring
- **Close:** Reverse of enter (200ms ease-in)
- **Close trigger:** ✕ button, Escape key, or clicking overlay

### Detail Sidebar

- **Background:** `surface-card`
- **Border left:** `border-subtle`
- **Sections** separated by subtle dividers:
  1. **Meta** — Author avatar + name, date created, usage count, rating
  2. **Description** — Full template description (scrollable if long)
  3. **Composition** — Agent count, tool count, node count with small icons
  4. **Tags** — All tags (not truncated like in card view)
  5. **Action** — "Use Template" button (full-width, primary style)

---

## 7. Empty State

Shown when search/filter produces no results.

- **Icon:** 72×72px template/grid icon in `slate-600`
- **Heading:** "No templates found" — 18px semibold
- **Description:** "Try adjusting your search or filters" — 14px regular, `text-secondary`
- **Border:** Dashed `border-default` outline
- **Animation:** Fade + slide up, 300ms ease-out
- **Optional CTA:** "Clear filters" link button in `violet-300`

---

## 8. Pagination

Below the grid when results exceed one page.

- **Button size:** 32×32px
- **Style:** Ghost buttons, `text-secondary`, `border-default`
- **Active page:** `rgba(139,92,246,0.2)` bg, `violet-300` text
- **Hover:** `rgba(30,41,59,0.5)` bg
- **Layout:** ‹ Prev | 1 2 3 … 12 | Next ›
- **Items per page:** 12 (3×4), 16 (4×4), or 20 — adapts to grid columns

---

## 9. Design Tokens Reference

All tokens live in `src/design/tokens/template-library.json` and follow the Design Tokens Community Group format.

| Token File | Purpose |
|---|---|
| `src/design/tokens/template-library.json` | All sizing, color, and animation tokens |
| `src/design/css/template-library-variables.css` | CSS custom properties (scoped to `.cs-template-*` classes) |
| `src/design/tailwind/template-library-theme.ts` | Tailwind theme extension (`templateLibraryTheme`) |

### Integration

```typescript
// tailwind.config.ts
import { crewspaceTheme } from './src/design/tailwind/canvas-theme';
import { dashboardTheme } from './src/design/tailwind/dashboard-theme';
import { timelineTheme } from './src/design/tailwind/timeline-theme';
import { templateLibraryTheme } from './src/design/tailwind/template-library-theme';

export default {
  theme: {
    extend: {
      ...crewspaceTheme,
      ...dashboardTheme,
      ...timelineTheme,
      ...templateLibraryTheme,
    },
  },
};
```

---

## 10. Accessibility

- All interactive elements are keyboard-navigable (Tab, Enter, Escape)
- Cards are focusable with visible `:focus-visible` ring (`violet-500` outline)
- Modal traps focus and restores it on close
- Category sidebar items have `aria-current="page"` for active state
- Filter chips use `aria-pressed` for toggle state
- Search input has `aria-label="Search templates"`
- Card thumbnails have `alt` text describing the workflow
- Color contrast meets WCAG 2.1 AA (all text on dark surfaces ≥ 4.5:1)

---

## 11. Interaction Summary

| Action | Result |
|---|---|
| Click category | Filter grid to that category, update URL param |
| Type in search | Debounced filter (300ms), grid reflow animation |
| Toggle filter chip | Add/remove filter, grid reflow |
| Change sort | Re-sort grid, grid reflow animation |
| Click card thumbnail | Open preview modal |
| Click "Preview" button | Open preview modal |
| Click "Use Template" | Copy template to user's account, navigate to canvas |
| Press Escape in modal | Close modal with exit animation |
| Click pagination | Load page, scroll to top, card stagger animation |

---

## 12. Dependencies

- **Blocks:** TASK-159 (Implement template browser) depends on this spec
- **Relates to:** TASK-157 (template card details), TASK-158 (preview modal details)
- **Uses:** Shared tokens from `colors.json`, `spacing.json`, `typography.json`
