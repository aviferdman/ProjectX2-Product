# Template Card — Component Specification

**Task:** TASK-157 — Design template cards (thumbnail, title, description, tags)  
**Epic:** 20 — Template Library UI Design & Implementation  
**Priority:** P1  
**Author:** Designer Agent  
**Status:** Complete  
**Depends on:** TASK-156 (Template library UI spec — ✅ done)  
**Blocks:** TASK-159 (Implement template browser), TASK-160 (Implement template preview)

---

## 1. Overview

The Template Card is the primary content unit within the Template Library grid. Each card represents a single pre-built workflow template and surfaces key information — a visual thumbnail, title, description, category, tags, popularity metrics, and quick actions — to help users evaluate and adopt templates quickly.

This spec refines the card section of the Template Library UI spec (TASK-156) with full implementation detail: pixel-precise anatomy, every visual state, exhaustive token mappings, skeleton/loading states, and accessibility requirements.

### Design Principles

- **Scan-first** — large thumbnail + clear typographic hierarchy enables rapid scanning across 8–20 cards
- **Category identity** — color-coded category icons provide instant visual grouping
- **Progressive disclosure** — essential info inline; full details via preview modal
- **One-click adoption** — "Use Template" is always visible; no extra navigation required
- **Token-driven** — every value maps to a shared design token for theming consistency

---

## 2. Card Anatomy

```
┌────────────────────────────────────────┐
│                                        │
│  [★ Featured]                          │  ← Badge (top-left, 8px inset)
│                                        │
│        Workflow Diagram Thumbnail       │  ← 180px tall, dark bg
│            (mini node preview)         │
│                                        │
│  Hover: gradient overlay               │
│         + centered [👁 Preview] btn     │
│                                        │
├────────────────────────────────────────┤
│  ┌────┐                               │
│  │ 🔍 │  Template Title                │  ← Category icon + 14px/600
│  └────┘  Two-line description that     │  ← 12px/400, clamp 2 lines
│          explains what this templ…     │
│                                        │
│  [research] [web-scraping] [GPT-4]     │  ← Tag pills, max 3 + overflow
│                                        │
│  ⬇ 1.2k uses · ★ 4.8 · @creator      │  ← Meta row, 11px
│                                        │
│  [ 👁 Preview ]   [ ▶ Use Template ]   │  ← Action buttons row
└────────────────────────────────────────┘
```

### Structural Zones

| Zone | Height | Purpose |
|------|--------|---------|
| Thumbnail | 180px fixed | Visual preview of template workflow |
| Body | auto (min ~148px) | Title, description, tags, meta, actions |

---

## 3. Card Dimensions & Layout

| Property | Value | Token |
|----------|-------|-------|
| Base width | 300px | `--tpl-card-w` |
| Min width | 260px | `--tpl-card-min-w` |
| Max width | 360px | `--tpl-card-max-w` |
| Border radius | 12px (`xl`) | `--tpl-card-radius` |
| Grid gap | 20px | `--tpl-card-gap` |
| Grid rule | `repeat(auto-fill, minmax(260px, 1fr))` | — |

### Internal Layout (Flexbox, column)

```
[Thumbnail]      → fixed height 180px, overflow hidden
[Body]           → flex: 1, padding 16px, gap 10px between sections
  ├─ [Header]    → icon + title + description
  ├─ [Tags]      → horizontal wrap, 6px gap
  ├─ [Meta]      → single row, 8px gap items
  └─ [Actions]   → flex row, gap 8px, margin-top auto (pushes to bottom)
```

---

## 4. Thumbnail Zone

The thumbnail displays a miniature, non-interactive preview of the template's workflow graph — colored dots for nodes connected by faint edge lines, rendered on a near-black background.

### 4.1 Container

| Property | Value | Token |
|----------|-------|-------|
| Height | 180px | `--tpl-thumb-h` |
| Background | `rgba(10,14,26,0.8)` | `--tpl-thumb-bg` |
| Border bottom | 1px `var(--cs-border-subtle)` | `--tpl-thumb-border` |
| Border radius | 12px 12px 0 0 (top corners only) | `--tpl-thumb-radius` |
| Overflow | hidden | — |
| Position | relative (for badge + overlay positioning) | — |

### 4.2 Mini Node Graph

Nodes are rendered as colored **dots** positioned proportionally to their canvas coordinates, scaled to fit within the thumbnail with 16px padding on all sides.

| Node Type | Dot Color | Size | Token |
|-----------|-----------|------|-------|
| Agent | `#a78bfa` (violet-400) | 8px | `--tpl-thumb-node-agent` |
| Task | `#38bdf8` (sky-400) | 8px | `--tpl-thumb-node-task` |
| Tool | `#34d399` (emerald-400) | 6px | `--tpl-thumb-node-tool` |
| LLM | `#fbbf24` (amber-400) | 7px | `--tpl-thumb-node-llm` |

- **Agent/Task dots:** 8px — primary workflow actors, most prominent
- **Tool dots:** 6px — supporting elements, slightly smaller
- **LLM dots:** 7px — intermediate size
- **Edge lines:** 1px stroke, `rgba(148,163,184,0.2)`, straight lines connecting node centers
- **Dot style:** Filled circles with 1px `rgba(255,255,255,0.1)` ring for depth

#### Empty Thumbnail

When a template has no workflow nodes (edge case):
- Centered template icon: 40px, `#475569` (slate-600), 50% opacity
- Subtle label: "No preview available" — 11px, `#475569`

### 4.3 Featured / Popular Badge

An overlay badge positioned in the top-left corner of the thumbnail.

| Variant | Background | Text | Border | Icon |
|---------|-----------|------|--------|------|
| Featured | `rgba(251,191,36,0.15)` | `#fcd34d` | `rgba(251,191,36,0.3)` | ★ star |
| Popular | `rgba(52,211,153,0.15)` | `#6ee7b7` | `rgba(52,211,153,0.3)` | 🔥 flame |
| New | `rgba(56,189,248,0.15)` | `#7dd3fc` | `rgba(56,189,248,0.3)` | ✨ sparkle |

| Property | Value | Token |
|----------|-------|-------|
| Position | absolute, top 8px, left 8px | — |
| Height | 20px | `--tpl-badge-h` |
| Padding | 0 8px | — |
| Radius | 4px (`sm`) | `--tpl-badge-radius` |
| Font | 9px / 600 / uppercase / 0.05em tracking | — |
| Border | 1px solid (variant color at 0.3 opacity) | — |
| Backdrop filter | `blur(8px)` | — |
| Max badges | 1 per card (priority: Featured > Popular > New) | — |

### 4.4 Hover Overlay

On card hover, a gradient overlay fades in over the thumbnail with a centered ghost "Preview" button.

| Property | Value | Token |
|----------|-------|-------|
| Gradient | `linear-gradient(180deg, transparent 30%, rgba(10,14,26,0.7) 100%)` | `--tpl-thumb-overlay-gradient` |
| Transition | 200ms ease-out | — |

**Preview ghost button (centered in overlay):**

| Property | Value |
|----------|-------|
| Size | 40px × 40px |
| Background | `rgba(255,255,255,0.1)` |
| Border | 1px `rgba(255,255,255,0.2)` |
| Radius | 50% (circle) |
| Icon | Eye (👁), 18px, `#ffffff` at 90% opacity |
| Hover | `rgba(255,255,255,0.2)` bg, icon 100% opacity |
| Transition | 150ms ease-out |

---

## 5. Card Body

### 5.1 Header Section (Icon + Title + Description)

#### Category Icon

| Property | Value | Token |
|----------|-------|-------|
| Container | 36px × 36px | `--tpl-cat-icon-container` |
| Background | Category `icon-bg` tint | `--tpl-cat-icon-bg-*` |
| Radius | 8px (`lg`) | — |
| Icon size | 18px | `--tpl-cat-icon-size` |
| Icon color | Category primary color | `--tpl-cat-color-*` |
| Float | Left (text wraps around) | — |
| Margin right | 12px | — |

Category-specific colors:

| Category | Icon Color | Icon BG |
|----------|-----------|---------|
| Research | `#38bdf8` | `rgba(56,189,248,0.15)` |
| Code | `#a78bfa` | `rgba(167,139,250,0.15)` |
| Support | `#34d399` | `rgba(52,211,153,0.15)` |
| Content | `#fbbf24` | `rgba(251,191,36,0.15)` |
| Data | `#fb7185` | `rgba(251,113,133,0.15)` |
| Automation | `#cbd5e1` | `rgba(203,213,225,0.15)` |

#### Title

| Property | Value | Token |
|----------|-------|-------|
| Font size | 14px (0.875rem) | `--tpl-card-title-size` |
| Font weight | 600 (semibold) | — |
| Line height | 1.25 | — |
| Color | `var(--cs-text-primary)` | `--tpl-card-title-color` |
| Max lines | 1 | — |
| Overflow | Ellipsis (`text-overflow: ellipsis; white-space: nowrap`) | — |
| Margin bottom | 4px | — |

#### Description

| Property | Value | Token |
|----------|-------|-------|
| Font size | 12px (0.75rem) | `--tpl-card-desc-size` |
| Font weight | 400 (regular) | — |
| Line height | 1.5 | — |
| Color | `var(--cs-text-secondary)` | `--tpl-card-desc-color` |
| Max lines | 2 | — |
| Overflow | `-webkit-line-clamp: 2; display: -webkit-box; -webkit-box-orient: vertical` | — |
| Min height | 36px (reserves 2-line space to prevent layout shifts) | — |

### 5.2 Tags Section

Horizontally wrapping row of tag pills representing template capabilities, tools, or model requirements.

#### Tag Pill

| Property | Value | Token |
|----------|-------|-------|
| Height | 22px | `--tpl-tag-h` |
| Padding | 0 8px | — |
| Background | `var(--cs-surface-elevated)` | `--tpl-tag-bg` |
| Border | 1px `var(--cs-border-subtle)` | `--tpl-tag-border` |
| Radius | 4px (`sm`) | `--tpl-tag-radius` |
| Font | 10px / 500 / 0.02em tracking | — |
| Text color | `var(--cs-text-tertiary)` | `--tpl-tag-text` |
| Gap | 6px between tags | `--tpl-tag-gap` |
| Max visible | 3 tags | — |

#### Tag Hover State

| Property | Value | Token |
|----------|-------|-------|
| Background | `rgba(139,92,246,0.12)` | `--tpl-tag-bg-hover` |
| Text color | `#c4b5fd` (violet-300) | `--tpl-tag-text-hover` |
| Border | 1px `rgba(139,92,246,0.25)` | — |
| Cursor | pointer | — |
| Transition | 100ms ease-out | — |

#### Overflow Indicator

When a template has more than 3 tags:

| Property | Value |
|----------|-------|
| Text | `+N` (e.g., "+2") |
| Style | Same dimensions as tag pill |
| Background | `rgba(148,163,184,0.08)` |
| Text color | `var(--cs-text-tertiary)` |
| Tooltip | Full tag list on hover |

### 5.3 Meta Row

Single-line metadata showing popularity and authorship.

```
⬇ 1.2k uses · ★ 4.8 · @creator_name
```

| Property | Value | Token |
|----------|-------|-------|
| Font | 11px (0.6875rem) / 400 | `--tpl-meta-font-size` |
| Color | `var(--cs-text-tertiary)` | `--tpl-meta-color` |
| Icon size | 12px | `--tpl-meta-icon-size` |
| Icon color | `var(--cs-text-tertiary)` | — |
| Separator | ` · ` (middle dot) in `#475569` | — |
| Item gap | 8px | `--tpl-meta-gap` |
| Margin top | 4px | — |

**Meta items (in order):**

| Item | Icon | Format | Example |
|------|------|--------|---------|
| Usage count | `download` (Lucide) | Abbreviated number | "1.2k uses" |
| Rating | `star` (Lucide, filled) | X.X format | "4.8" |
| Author | `@` prefix or avatar | Username | "@alexsmith" |

**Number abbreviation rules:**
- < 1,000 → show exact ("847 uses")
- 1,000–999,999 → "X.Xk" ("1.2k uses")
- ≥ 1,000,000 → "X.Xm" ("2.1m uses")

**Rating display:**
- Star icon filled in `#fbbf24` (amber-400) when rating ≥ 4.0
- Star icon outline in `var(--cs-text-tertiary)` when rating < 4.0
- No rating displayed if template has < 5 ratings

### 5.4 Action Buttons Row

Two buttons at the bottom of the card body, pushed down via `margin-top: auto` on the container.

```
[ 👁 Preview ]   [ ▶ Use Template ]
```

#### Layout

| Property | Value |
|----------|-------|
| Display | flex row |
| Gap | 8px |
| Alignment | stretch (buttons fill width equally) |
| Margin top | auto (pushes to card bottom) |
| Padding top | 12px |

#### "Preview" Button (Secondary)

| Property | Value | Token |
|----------|-------|-------|
| Height | 36px | `--tpl-preview-btn-h` |
| Background | transparent | `--tpl-preview-btn-bg` |
| Border | 1px `#7c3aed` (violet-600) | `--tpl-preview-btn-border` |
| Radius | 8px (`lg`) | — |
| Text | `#c4b5fd` (violet-300), 13px/500 | `--tpl-preview-btn-text` |
| Icon | Eye, 14px, left of text | — |
| Flex | 0.4 (narrower) | — |

**Hover:**

| Property | Value |
|----------|-------|
| Background | `rgba(139,92,246,0.12)` |
| Border | 1px `#8b5cf6` (violet-500) |
| Text | `#ddd6fe` (violet-200) |

#### "Use Template" Button (Primary)

| Property | Value | Token |
|----------|-------|-------|
| Height | 36px | `--tpl-use-btn-h` |
| Background | `#7c3aed` (violet-600) | `--tpl-use-btn-bg` |
| Border | none | — |
| Radius | 8px (`lg`) | — |
| Text | `#ffffff`, 13px/600 | `--tpl-use-btn-text` |
| Icon | Play (▶), 14px, left of text | — |
| Shadow | `0 2px 8px rgba(124,58,237,0.35)` | `--tpl-use-btn-shadow` |
| Flex | 0.6 (wider) | — |

**Hover:**

| Property | Value |
|----------|-------|
| Background | `#8b5cf6` (violet-500) |
| Shadow | `0 4px 12px rgba(124,58,237,0.45)` |
| Transform | `translateY(-1px)` |

**Active (pressed):**

| Property | Value |
|----------|-------|
| Background | `#6d28d9` (violet-700) |
| Shadow | `0 1px 4px rgba(124,58,237,0.25)` |
| Transform | `translateY(0)` |

---

## 6. Card Visual States

### 6.1 State Matrix

| State | Background | Border | Shadow | Other |
|-------|-----------|--------|--------|-------|
| Default | `var(--cs-surface-card)` | 1px `var(--cs-border-default)` | `0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px rgba(148,163,184,0.06)` | — |
| Hover | `var(--cs-surface-elevated)` | 1px `var(--cs-border-strong)` | `0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(148,163,184,0.1)` | Thumbnail overlay visible, `translateY(-2px)` |
| Focus (keyboard) | `var(--cs-surface-card)` | 2px `#8b5cf6` (violet-500) | Default shadow + `0 0 0 3px rgba(139,92,246,0.25)` | Focus ring visible |
| Active (pressed) | `var(--cs-surface-card)` | 1px `var(--cs-border-strong)` | `0 1px 3px rgba(0,0,0,0.3)` | `scale(0.99)` |
| Loading | — | — | — | Skeleton placeholder (see §7) |
| Disabled | 50% opacity | — | — | `pointer-events: none` |

### 6.2 Transitions

| Property | Duration | Easing |
|----------|----------|--------|
| Background, border, shadow | 150ms | ease-out |
| Transform (hover lift) | 150ms | ease-out |
| Thumbnail overlay opacity | 200ms | ease-out |
| Button states | 100ms | ease-out |

---

## 7. Loading / Skeleton State

When card data is loading, display an animated skeleton placeholder matching card dimensions.

```
┌────────────────────────────────────────┐
│                                        │
│    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │  ← Shimmer bg (180px)
│    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│                                        │
├────────────────────────────────────────┤
│  ┌────┐ ░░░░░░░░░░░░░ (60%)           │  ← Icon placeholder + title
│  └────┘ ░░░░░░░░░░░░░░░░░ (80%)       │  ← Description line 1
│         ░░░░░░░░░░░ (50%)              │  ← Description line 2
│                                        │
│  ░░░░ ░░░░░ ░░░░ (tags)               │
│  ░░░░░░░░░░░░ (meta)                  │
│  ░░░░░░░░░ ░░░░░░░░░░░ (buttons)      │
└────────────────────────────────────────┘
```

| Element | Size | Radius |
|---------|------|--------|
| Thumbnail area | 100% × 180px | 12px 12px 0 0 |
| Icon placeholder | 36px × 36px | 8px |
| Title line | 60% × 14px | 4px |
| Description lines | 80% × 12px, 50% × 12px | 4px |
| Tag placeholders | 48px × 22px (×3) | 4px |
| Meta placeholder | 100% × 11px | 4px |
| Button placeholders | 48% × 36px (×2) | 8px |

**Shimmer animation:**
- Background: `linear-gradient(90deg, rgba(30,41,59,0.3) 25%, rgba(30,41,59,0.5) 50%, rgba(30,41,59,0.3) 75%)`
- Animation: `cs-shimmer` — background-position slides from -200% to 200%, 1.5s infinite ease-in-out
- Reduced motion: disable shimmer, use static `rgba(30,41,59,0.4)` background

---

## 8. Card Enter Animation

| Property | Value |
|----------|-------|
| Name | `cs-tpl-card-enter` |
| Duration | 250ms |
| Easing | `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring) |
| From | `opacity: 0; transform: scale(0.92) translateY(8px)` |
| To | `opacity: 1; transform: scale(1) translateY(0)` |
| Stagger | 40ms delay per card index (`animation-delay: calc(var(--card-index) * 40ms)`) |
| Max stagger | Cap at 500ms total (12 cards) to avoid long waits |

**Grid reflow animation** (when filters/sort change):
- Existing cards: `cs-tpl-grid-reflow` — 200ms ease-out opacity 0.6→1
- New cards entering: full `cs-tpl-card-enter` with stagger
- Removed cards: fade out 150ms ease-in, then collapse grid gap

---

## 9. Responsive Behavior

| Breakpoint | Card Width | Columns | Thumbnail | Tags | Actions |
|-----------|-----------|---------|-----------|------|---------|
| `xl` (≥1440px) | 300px target | 4 | 180px | 3 max | Side-by-side |
| `lg` (1024–1439px) | 300px target | 3 | 180px | 3 max | Side-by-side |
| `md` (640–1023px) | flex fill | 2 | 160px | 2 max | Stacked (full width) |
| `sm` (<640px) | 100% - 48px | 1 | 140px | 3 max | Stacked (full width) |

### Mobile Adaptations (< 640px)

- Thumbnail height reduces to 140px
- Action buttons stack vertically (full width each)
- Quick action hover behaviors → always visible
- Tags row allows horizontal scroll if needed
- Category icon reduces to 28px container

---

## 10. Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Semantic element | `<article>` with `role="article"` |
| Accessible name | `aria-label="{title} — {category} template. {usageCount} uses, rated {rating}"` |
| Keyboard focus | `tabindex="0"`, visible 2px violet focus ring |
| Enter key | Opens preview modal (same as clicking thumbnail) |
| Space key | Triggers "Use Template" action |
| Focus order | Card → Preview button → Use Template button (left-to-right, top-to-bottom) |
| Tag interaction | Tags are `<button>` elements with `aria-label="Filter by tag: {tagName}"` |
| Badge alt text | `aria-label="Featured template"` or `"Popular template"` |
| Thumbnail alt | `alt="Workflow preview: {title} — {nodeCount} nodes"` |
| Color contrast | All text ≥ 4.5:1 against `surface-card` background |
| Reduced motion | `@media (prefers-reduced-motion: reduce)`: disable card-enter, hover lift, shimmer. Use opacity transitions only. |
| Screen reader | Badge, tags, and meta row are described via `aria-label`; decorative icons use `aria-hidden="true"` |

---

## 11. Design Token Files

| File | Purpose |
|------|---------|
| `src/design/tokens/template-card.json` | Dedicated template card design tokens |
| `src/design/css/template-card-variables.css` | CSS custom properties (`.cs-tpl-card-*` scope) |
| `src/design/tailwind/template-card-theme.ts` | Tailwind theme extension (`templateCardTheme`) |

All tokens reference shared primitives from `colors.json`, `typography.json`, and `spacing.json`.

---

## 12. Implementation Notes for Frontend

1. **Card container:** Use CSS Grid for the card grid (`repeat(auto-fill, minmax(260px, 1fr))`). Each card is a `<article>` with `display: flex; flex-direction: column`.

2. **Thumbnail renderer:** Reuse `<WorkflowThumbnail>` from workflow card list (TASK-149). Scale node positions to fit 180px height with 16px padding. Render on `<canvas>` or inline SVG.

3. **Title & description clamping:** Use `-webkit-line-clamp` for description (2 lines). Reserve min-height for description area to prevent layout shifts when some cards have shorter text.

4. **Tag overflow:** Render max 3 tags; if `tags.length > 3`, show a `+N` pill. On hover, show a tooltip with the full list.

5. **Action buttons:** Use `margin-top: auto` on the action row container to push buttons to the bottom of the card regardless of content height. This ensures consistent button alignment across cards of varying content length.

6. **Hover overlay:** Use `::after` pseudo-element on the thumbnail container for the gradient overlay. Transition `opacity` rather than `display` for smooth animation.

7. **Badge backdrop filter:** Use `backdrop-filter: blur(8px)` for frosted glass effect. Provide fallback opaque background for browsers without support.

8. **Stagger animation:** Set `--card-index` CSS custom property via inline style or `style.setProperty()` during render. Cap at index 12 to prevent excessive delays.

9. **Loading states:** Render skeleton cards during data fetch. Match the exact card dimensions to prevent layout shift when real data arrives. Use `aria-busy="true"` and `aria-label="Loading template"`.

10. **Virtual rendering:** For large template libraries (100+ templates), implement intersection-observer-based lazy loading for thumbnails and consider virtual scrolling for the grid.
