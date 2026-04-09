# Responsive Breakpoints Design Specification

**Task:** TASK-169 — Design responsive breakpoints (mobile, tablet, desktop)  
**Status:** Complete  
**Epic:** 22 — Responsive Layouts & Animations  
**Blocks:** TASK-172 (Implement responsive layouts)

---

## 1. Breakpoint System

Crewspace uses a **mobile-first** breakpoint system aligned with Tailwind CSS conventions. All styles start at the smallest size and scale up.

| Token | Width | Name | Target Devices |
|-------|-------|------|----------------|
| `xs` | 375px | Small Phone | iPhone SE, Galaxy S series |
| `sm` | 640px | Large Phone | iPhone Pro Max, Pixel, large Android |
| `md` | 768px | Tablet Portrait | iPad Mini, iPad, Android tablets |
| `lg` | 1024px | Tablet Landscape / Small Laptop | iPad landscape, 13" laptops |
| `xl` | 1280px | Desktop | Standard 15" laptops, external monitors |
| `2xl` | 1536px | Large Desktop | 27"+ monitors, ultrawide |

**Minimum supported width:** 375px (iPhone SE).  
**Design target:** All screens functional at 375px; optimized for 1280px.

---

## 2. Layout Adaptations

### 2.1 Dashboard Layout

```
┌──────────────────────────────────────────────────────┐
│  xs–sm (375–639px): MOBILE                           │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Header (48px) — hamburger ☰ | logo | avatar     │ │
│  ├──────────────────────────────────────────────────┤ │
│  │ Content (full width, 12px padding)               │ │
│  │  • Stats: 2-column grid                          │ │
│  │  • Cards: single column, full width              │ │
│  │  • Search/filters: stacked vertically            │ │
│  └──────────────────────────────────────────────────┘ │
│  (Sidebar: hidden, opens as full-screen overlay)      │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  md (768–1023px): TABLET                             │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Header (56px) — hamburger ☰ | logo | search     │ │
│  ├──────────────────────────────────────────────────┤ │
│  │ Content (full width, 20px padding)               │ │
│  │  • Stats: 4-column grid                          │ │
│  │  • Cards: 2-column grid (16px gap)               │ │
│  │  • Search/filters: single row                    │ │
│  └──────────────────────────────────────────────────┘ │
│  (Sidebar: slide-over overlay, 280px width)           │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  lg (1024–1279px): SMALL DESKTOP                     │
│  ┌────┬─────────────────────────────────────────────┐ │
│  │ 64 │ Header (56px)                               │ │
│  │ px ├─────────────────────────────────────────────┤ │
│  │    │ Content (24px padding)                      │ │
│  │ S  │  • Stats: 4-column grid                     │ │
│  │ I  │  • Cards: 3-column grid (20px gap)          │ │
│  │ D  │                                             │ │
│  │ E  │                                             │ │
│  └────┴─────────────────────────────────────────────┘ │
│  (Sidebar: collapsed/icons-only, 64px)                │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  xl+ (1280px+): DESKTOP                              │
│  ┌─────────┬────────────────────────────────────────┐ │
│  │  240px  │ Header (56px)                          │ │
│  │         ├────────────────────────────────────────┤ │
│  │  S I D  │ Content (max 1280px, centered, 24px p) │ │
│  │  E B A  │  • Stats: 4-column grid                │ │
│  │  R      │  • Cards: 3-column grid (20px gap)     │ │
│  │         │                                        │ │
│  └─────────┴────────────────────────────────────────┘ │
│  (Sidebar: expanded with labels, 240px)               │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  2xl (1536px+): LARGE DESKTOP                        │
│  Same as xl but:                                     │
│  • Content max-width: 1440px                         │
│  • Container padding: 32px                           │
│  • Cards: 4-column grid                              │
└──────────────────────────────────────────────────────┘
```

### 2.2 Canvas Layout

```
┌──────────────────────────────────────────────────────┐
│  xs–sm: MOBILE CANVAS                                │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Compact Header (48px) — ← back | workflow name   │ │
│  ├──────────────────────────────────────────────────┤ │
│  │                                                  │ │
│  │            Canvas (full screen)                   │ │
│  │          Default zoom: 0.6                        │ │
│  │          No minimap                               │ │
│  │                                                  │ │
│  ├──────────────────────────────────────────────────┤ │
│  │ Bottom Toolbar (48px) — zoom | add | undo/redo   │ │
│  └──────────────────────────────────────────────────┘ │
│  (Properties: bottom sheet, slides up to 60vh)        │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  md–lg: TABLET CANVAS                                │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Header (56px) + Top Toolbar (48px)               │ │
│  ├──────────────────────────────────────────────────┤ │
│  │                                                  │ │
│  │           Canvas (with minimap)                   │ │
│  │         Default zoom: 0.8                         │ │
│  │                                                  │ │
│  └──────────────────────────────────────────────────┘ │
│  (Properties: slide-in overlay from right, 320px)     │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  xl+: DESKTOP CANVAS                                 │
│  ┌─────────┬──────────────────────┬────────────────┐ │
│  │  Sidebar │ Toolbar (48px)      │ Properties     │ │
│  │  (icon/  ├─────────────────────┤ Panel          │ │
│  │  expand) │                     │ 320px          │ │
│  │         │  Canvas (minimap)   │                │ │
│  │         │  Zoom: 1.0          │                │ │
│  │         │                     │                │ │
│  └─────────┴─────────────────────┴────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### 2.3 Template Library Layout

| Breakpoint | Grid Columns | Card Width | Sidebar | Modal |
|-----------|-------------|-----------|---------|-------|
| xs–sm | 1 | Full width | Hidden (hamburger) | Full-screen |
| md | 2 | Auto-fill | Slide-over overlay | 640px centered |
| lg | 3 | Auto-fill | Collapsed (64px) | 800px centered |
| xl | 3 | Auto-fill | Expanded (220px) | 900px centered |
| 2xl | 4 | Auto-fill | Expanded (220px) | 900px centered |

---

## 3. Component Adaptations

### 3.1 Sidebar

| Breakpoint | Mode | Width | Behavior |
|-----------|------|-------|----------|
| xs–sm | `hidden` | 0px | Hamburger icon in header opens full-screen overlay nav |
| md | `overlay` | 280px | Hamburger toggles slide-in overlay from left. Backdrop closes it. |
| lg | `collapsible` | 64px (collapsed) | Persistent, icons-only. Hover/click expands to 240px. |
| xl+ | `expanded` | 240px | Persistent, fully expanded with labels. Can be collapsed. |

**Transitions:**
- Overlay slide-in: `250ms cubic-bezier(0.16, 1, 0.3, 1)`
- Overlay slide-out: `200ms ease-out`
- Collapse/expand: `200ms ease-out`

### 3.2 Properties Panel (Canvas)

| Breakpoint | Mode | Behavior |
|-----------|------|----------|
| xs–sm | `bottom-sheet` | Tap node → panel slides up from bottom (max 60vh). Drag handle to resize. Swipe down to dismiss. |
| md–lg | `overlay` | Click node → panel slides in from right (320px). Click outside or close button to dismiss. |
| xl+ | `docked` | Persistent right panel (320px). Toggle visibility. Content area shrinks to accommodate. |

### 3.3 Header

| Breakpoint | Height | Content |
|-----------|--------|---------|
| xs–sm | 48px | ☰ hamburger \| Logo \| User avatar |
| md+ | 56px | ☰ hamburger (md) or sidebar toggle (lg+) \| Logo \| Search bar \| Notifications \| User avatar |

### 3.4 Modals & Dialogs

| Breakpoint | Width | Height | Border Radius | Behavior |
|-----------|-------|--------|---------------|----------|
| xs–sm | 100vw | 100vh | 0px | Full-screen with close button in header |
| md | 640px | max 85vh | 12px | Centered with backdrop |
| lg | 800px | max 85vh | 12px | Centered with backdrop |
| xl+ | 900px | max 85vh | 12px | Centered with backdrop |

### 3.5 Cards (Workflow / Template)

| Breakpoint | Columns | Min Width | Thumbnail Height |
|-----------|---------|-----------|-----------------|
| xs | 1 | Full width | 120px |
| sm | 1 | Full width | 140px |
| md | 2 | 280px | 160px |
| lg–xl | 3 | 280px | 160px |
| 2xl | 4 | 280px | 160px |

**List view:** Always single column, responsive row layout. On mobile (xs–sm), hide less important columns (last edited date, agent count) and show only name + status.

---

## 4. Typography Scaling

| Element | Mobile (xs–sm) | Tablet (md) | Desktop (lg+) |
|---------|---------------|-------------|----------------|
| Page title | 1.25rem (20px) | 1.375rem (22px) | 1.5rem (24px) |
| Section title | 0.875rem (14px) | 1rem (16px) | 1rem (16px) |
| Body text | 0.8125rem (13px) | 0.875rem (14px) | 0.875rem (14px) |
| Card title | 0.8125rem (13px) | 0.875rem (14px) | 0.875rem (14px) |
| Card description | 0.75rem (12px) | 0.75rem (12px) | 0.75rem (12px) |
| Card meta | 0.625rem (10px) | 0.6875rem (11px) | 0.6875rem (11px) |

**Note:** Canvas node typography does NOT scale — nodes are viewport-independent since users zoom the canvas.

---

## 5. Touch Target Guidelines

For all interactive elements on touch devices (xs–md breakpoints):

| Requirement | Minimum | Recommended |
|------------|---------|-------------|
| Touch target size | 44×44px | 48×48px |
| Target spacing | 8px | 8px |
| Button height | 40px | 44px |
| Icon button | 44×44px | 48×48px |

**Canvas-specific:**
- Node handle hit area: 44×44px (visual size stays 10px, but tap target expanded)
- Toolbar buttons: 48×48px on mobile (36px visual + padding)
- Zoom controls: 48×48px each

---

## 6. Container & Spacing

| Breakpoint | Container Max Width | Horizontal Padding | Grid Gap |
|-----------|--------------------|--------------------|----------|
| xs | 100% | 12px | 12px |
| sm | 100% | 16px | 16px |
| md | 100% | 20px | 16px |
| lg | 100% | 24px | 20px |
| xl | 1280px | 24px | 20px |
| 2xl | 1440px | 32px | 20px |

---

## 7. Design Artifacts

| File | Description |
|------|-------------|
| `src/design/tokens/responsive.json` | Design tokens (breakpoints, containers, grids, typography, touch, modals) |
| `src/design/css/responsive-variables.css` | CSS custom properties with media queries |
| `src/design/tailwind/responsive-theme.ts` | Tailwind theme config (screens, spacing, grid, animations) |
| `docs/design/responsive-breakpoints.md` | This specification document |

---

## 8. Implementation Notes for TASK-172

1. **Use Tailwind responsive utilities** — Apply `sm:`, `md:`, `lg:`, `xl:`, `2xl:` prefixes rather than custom media queries where possible.
2. **CSS variables for dynamic layouts** — Import `responsive-variables.css` for sidebar/panel widths that change per breakpoint. Use `var(--cs-sidebar-w)` etc. for grid template calculations.
3. **Test at these exact widths:** 375px, 640px, 768px, 1024px, 1280px, 1536px.
4. **Canvas is special:** Don't make canvas nodes responsive — they live in a zoomable viewport. Only the chrome around the canvas (toolbar, sidebar, properties) adapts.
5. **Bottom sheet for mobile properties:** Use a drag-to-resize gesture with snap points at 30vh, 60vh, and dismiss.
6. **Sidebar collapse animation:** Use `transform: translateX()` for overlay mode, `width` transition for collapse mode (hardware-accelerated).
7. **Card grids:** Use CSS Grid with `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))` for fluid behavior between breakpoints.
