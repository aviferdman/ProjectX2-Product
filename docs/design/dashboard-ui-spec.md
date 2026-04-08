# Dashboard & Workflow Management UI — Design Specification

**Task:** TASK-148  
**Priority:** P0  
**Epic:** 19 — Dashboard & Workflow Management UI  
**Status:** Complete

---

## 1. Overview

The Dashboard is the primary landing screen after authentication. It provides a central hub for managing workflows, monitoring usage, and creating new AI crew configurations. The design follows the established Crewspace dark-mode-first design language with violet brand accents on slate surfaces.

### Design Principles

- **Dark-mode first** — consistent with the canvas and timeline UIs
- **Information density** — show enough to act without overwhelming
- **Progressive disclosure** — surface key metrics, details on demand
- **Consistent token usage** — all values derive from the shared design token system

---

## 2. Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  Header (56px)                                          │
│  Logo · Navigation · Search · User Menu                 │
├────────┬────────────────────────────────────────────────┤
│        │  Stats Bar (usage stats cards)                 │
│  Side  │────────────────────────────────────────────────│
│  bar   │  Toolbar (search · filters · view toggle ·     │
│ 240px  │           + Create Workflow)                    │
│        │────────────────────────────────────────────────│
│        │  Content Area                                  │
│        │  (Workflow Grid / List)                        │
│        │                                                │
│        │  [Upgrade Prompt if near limit]                │
└────────┴────────────────────────────────────────────────┘
```

### Layout Tokens

| Token | Value | Description |
|-------|-------|-------------|
| `--dashboard-header-h` | `56px` | Header height |
| `--dashboard-sidebar-w` | `240px` | Sidebar width (expanded) |
| `--dashboard-sidebar-collapsed-w` | `64px` | Sidebar width (collapsed) |
| `--dashboard-content-max-w` | `1280px` | Max content width |
| `--dashboard-content-padding` | `24px` | Content area padding |

---

## 3. Header

**Height:** 56px  
**Background:** `var(--cs-surface-panel)` / `#0f172a`  
**Border:** 1px bottom border using `var(--cs-border-subtle)`

### Contents (left → right)

1. **Logo** — Crewspace wordmark, using `--cs-brand-primary` color
2. **Breadcrumb** — "Dashboard" in `--cs-text-secondary`
3. **Global Search** — Expandable search input (right-aligned)
4. **Notifications** — Bell icon with unread badge
5. **User Avatar** — Circular, 32px with dropdown menu

---

## 4. Sidebar Navigation

**Width:** 240px expanded / 64px collapsed  
**Background:** `var(--cs-surface-panel)` / `#0f172a`  
**Border:** 1px right border using `var(--cs-border-subtle)`

### Navigation Items

| Section | Items | Icon |
|---------|-------|------|
| Main | Dashboard (active), Workflows, Templates | LayoutDashboard, Workflow, BookTemplate |
| Build | Canvas Editor, Agent Library | PaintBrush, Bot |
| Monitor | Run History, Logs | Clock, FileText |
| Settings | Integrations, Account, Billing | Plug, User, CreditCard |

### Nav Item States

| State | Background | Text Color | Left Accent |
|-------|-----------|------------|-------------|
| Default | transparent | `--cs-text-secondary` | none |
| Hover | `rgba(30,41,59,0.5)` | `--cs-text-primary` | none |
| Active | `rgba(139,92,246,0.12)` | `#c4b5fd` (violet-300) | 2px `#7c3aed` |

### Typography

- **Section label:** 11px / 600 / 0.05em letter-spacing / uppercase / `--cs-text-tertiary`
- **Nav item:** 13px / 500 / per-state colors above

---

## 5. Usage Statistics Bar

A row of stat cards displayed above the toolbar. Shows key metrics at a glance.

### Stat Cards

Four cards in a responsive flex row with `gap: 16px`.

| Stat | Icon Color | Description |
|------|-----------|-------------|
| Total Workflows | `#a78bfa` (violet-400) | Number of saved workflows |
| Total Runs | `#38bdf8` (sky-400) | Run count this billing period |
| Active Agents | `#34d399` (emerald-400) | Currently deployed agent count |
| Error Rate | `#fb7185` (rose-400) | Error percentage this period |

### Card Anatomy

```
┌──────────────────────────────────┐
│  [Icon]  Stat Label              │
│          ━━━━━━━━━━━             │
│  42      ▲ +12% vs last period   │
└──────────────────────────────────┘
```

- **Background:** `var(--cs-surface-card)` / `#1e293b`
- **Border:** 1px `var(--cs-border-default)` / `#334155`
- **Border radius:** `12px` (`--cs-radius-xl`)
- **Min width:** 200px
- **Height:** 100px
- **Padding:** 16px
- **Shadow:** `0 1px 3px rgba(0,0,0,0.2), 0 0 0 1px rgba(148,163,184,0.06)`

### Stat Typography

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Label | 12px / 0.75rem | 500 | `--cs-text-secondary` |
| Value | 24px / 1.5rem | 700 | `--cs-text-primary` |
| Trend (up) | 11px / 0.6875rem | 500 | `#34d399` |
| Trend (down) | 11px / 0.6875rem | 500 | `#fb7185` |

### Usage Progress Bar

Displayed below the stat cards when usage limits apply (freemium plans).

- **Bar height:** 6px
- **Bar radius:** 9999px (fully rounded)
- **Track:** `var(--cs-surface-elevated)` / `#334155`
- **Fill (normal):** `#8b5cf6` (violet-500) — usage ≤ 80%
- **Fill (warning):** `#f59e0b` (amber-500) — usage 80–95%
- **Fill (critical):** `#f43f5e` (rose-500) — usage > 95%

---

## 6. Toolbar

**Height:** 48px  
**Layout:** Flex row — `[Search] [Filters] [Spacer] [View Toggle] [Create Button]`

### Search Input

- **Height:** 36px
- **Width:** min 200px, max 360px
- **Background:** `var(--cs-surface-elevated)` / `#334155`
- **Border:** 1px `var(--cs-border-default)`, focus: `#8b5cf6`
- **Radius:** `var(--cs-radius-md)` / 6px
- **Icon:** Magnifying glass in `--cs-text-tertiary`
- **Placeholder:** "Search workflows..." in `--cs-text-tertiary`
- **Font:** 13px / 400

### Filter Chips

Horizontally scrolling pill-shaped toggles for filtering workflows by status.

| State | Background | Border | Text |
|-------|-----------|--------|------|
| Inactive | `var(--cs-surface-elevated)` | `var(--cs-border-default)` | `--cs-text-secondary` |
| Active | `rgba(139,92,246,0.2)` | `#8b5cf6` | `#c4b5fd` |

- **Height:** 28px
- **Radius:** 9999px (pill)
- **Font:** 11px / 500

### View Toggle

Segmented control for switching between grid and list views.

- **Background:** `var(--cs-surface-card)` / `#1e293b`
- **Active segment:** `var(--cs-surface-elevated)` / `#334155`
- **Border:** 1px `var(--cs-border-default)` / `#334155`
- **Icons:** Grid (4-square) / List (horizontal lines), 16px
- **Icon color:** inactive `--cs-text-tertiary`, active `--cs-text-primary`

### Create Workflow Button

- **Height:** 40px
- **Background:** `#7c3aed` (violet-600), hover: `#8b5cf6` (violet-500)
- **Text:** "#ffffff" / 14px / 600
- **Icon:** Plus icon, 16px, white
- **Radius:** `var(--cs-radius-lg)` / 8px
- **Shadow:** `0 2px 8px rgba(124,58,237,0.35)`, hover: `0 4px 12px rgba(124,58,237,0.45)`

---

## 7. Workflow Grid View

Responsive CSS Grid layout. Cards auto-fill with min 280px, max 320px columns.

### Grid Configuration

```css
display: grid;
grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
gap: 16px;
```

### Card Anatomy

```
┌──────────────────────────────┐
│                              │
│   Workflow Preview Thumbnail │
│   (miniature canvas view)    │
│                              │
├──────────────────────────────┤
│  Title of Workflow           │
│  Brief description text...   │
│                              │
│  [Draft] · 3 agents · 5m ago │
│                              │
│  [⋯ More Actions]           │
└──────────────────────────────┘
```

### Card Tokens

| Element | Value |
|---------|-------|
| Background | `var(--cs-surface-card)` / `#1e293b` |
| Background (hover) | `var(--cs-surface-elevated)` / `#334155` |
| Border | 1px `var(--cs-border-default)` / `#334155` |
| Border (hover) | 1px `var(--cs-border-strong)` / `#64748b` |
| Border radius | `12px` |
| Shadow | `0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px rgba(148,163,184,0.06)` |
| Shadow (hover) | `0 4px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(148,163,184,0.1)` |
| Thumbnail height | 160px |
| Thumbnail bg | `rgba(10,14,26,0.8)` |
| Body padding | 16px |

### Card Typography

| Element | Font | Weight | Color |
|---------|------|--------|-------|
| Title | 14px / 0.875rem | 600 | `--cs-text-primary` |
| Description | 12px / 0.75rem | 400 | `--cs-text-secondary` |
| Metadata | 11px / 0.6875rem | 400 | `--cs-text-tertiary` |
| Status badge | 10px / 0.625rem | 600 | per-status color |

### Card Hover Behavior

1. Background transitions to `--cs-surface-elevated` (150ms ease-out)
2. Border lightens to `--cs-border-strong`
3. Shadow deepens
4. Thumbnail scales subtly: `transform: scale(1.02)` (200ms ease-out)

### Card Enter Animation

- **Name:** `cs-card-enter`
- **Duration:** 250ms
- **Easing:** `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring)
- **From:** `opacity: 0; scale(0.92); translateY(8px)`
- **To:** `opacity: 1; scale(1); translateY(0)`
- **Stagger:** Each card delays by 50ms × index (max 500ms total)

---

## 8. Workflow List View

A table-style list for information-dense viewing.

### Column Layout

| Column | Width | Content |
|--------|-------|---------|
| Name | flex: 1 | Icon + workflow name |
| Status | 100px | Status badge |
| Agents | 80px | Agent count |
| Last Run | 120px | Relative timestamp |
| Created | 120px | Date string |
| Actions | 48px | ⋯ more button |

### Row Tokens

| State | Background |
|-------|-----------|
| Default | transparent |
| Hover | `rgba(30,41,59,0.5)` |
| Selected | `rgba(139,92,246,0.08)` |

- **Row height:** 56px
- **Row border:** 1px bottom `var(--cs-border-subtle)` / `#1e293b`
- **Header background:** `var(--cs-surface-card)` / `#1e293b`
- **Header text:** `--cs-text-tertiary` / 11px / 600 / uppercase / 0.05em tracking

---

## 9. Workflow Status Badges

Pill-shaped badges indicating workflow state.

| Status | Text Color | Background | Label |
|--------|-----------|------------|-------|
| Draft | `#94a3b8` | `rgba(148,163,184,0.1)` | DRAFT |
| Active | `#10b981` | `rgba(16,185,129,0.1)` | ACTIVE |
| Error | `#f43f5e` | `rgba(244,63,94,0.1)` | ERROR |
| Archived | `#64748b` | `rgba(100,116,139,0.1)` | ARCHIVED |

- **Font:** 10px / 600 / 0.05em letter-spacing / uppercase
- **Padding:** 2px 8px
- **Radius:** 9999px (pill)

---

## 10. Empty State

Displayed when the user has no workflows yet.

```
┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐
╎                                       ╎
╎         [Workflow icon — 64px]        ╎
╎                                       ╎
╎      No workflows yet                 ╎
╎      Create your first AI crew        ╎
╎      workflow to get started.         ╎
╎                                       ╎
╎      [ + Create Workflow ]            ╎
╎                                       ╎
└╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘
```

- **Border:** 2px dashed `var(--cs-border-default)` / `#334155`
- **Border radius:** 12px
- **Icon:** 64px, `#475569`
- **Heading:** 18px / 600 / `--cs-text-primary`
- **Description:** 14px / 400 / `--cs-text-secondary`
- **CTA:** Same as Create Workflow button
- **Animation:** `cs-empty-state-in` — 300ms ease-out fade + slide up

---

## 11. Upgrade Prompt

Banner shown when usage is near or at plan limits.

```
┌────────────────────────────────────────────┐
│  ⚡ You've used 45/50 workflow runs this   │
│     month. Upgrade for unlimited runs.     │
│                            [ Upgrade Now ] │
└────────────────────────────────────────────┘
```

- **Background:** `rgba(124,58,237,0.08)`
- **Border:** 1px `#6d28d9` (violet-700)
- **Border radius:** 12px
- **Text:** `--cs-text-secondary` / 14px / 400
- **CTA button:** `#7c3aed` bg, white text, 8px radius

---

## 12. Interaction & Animation Summary

| Interaction | Animation | Duration | Easing |
|------------|-----------|----------|--------|
| Card enters viewport | Scale + fade in | 250ms | spring `(0.34,1.56,0.64,1)` |
| Card hover | Bg, border, shadow transition | 150ms | ease-out |
| Card thumbnail hover | Subtle scale | 200ms | ease-out |
| Stat number loads | Count-up + fade in | 600ms | `(0.16,1,0.3,1)` |
| Progress bar fills | Width animation | 400ms | ease-out |
| View mode switch | Crossfade | 200ms | ease-out |
| Empty state appears | Fade + slide up | 300ms | ease-out |
| Filter chip toggle | Background + border | 150ms | ease-out |

---

## 13. Responsive Behavior (Preview)

> **Note:** Full responsive breakpoint specs will be covered in TASK-169.

| Breakpoint | Layout Adaptation |
|-----------|-------------------|
| ≥1280px | Full layout — sidebar + 3–4 column grid |
| 1024–1279px | Sidebar collapses to icons, 2–3 column grid |
| 768–1023px | Sidebar hidden (hamburger menu), 2 column grid |
| <768px | Single column, stats stack vertically, list view default |

---

## 14. Accessibility Notes

- All interactive elements have visible focus rings (`--cs-border-focus` / `#8b5cf6`)
- Minimum 4.5:1 contrast ratio for text on surfaces
- Status badges use both color and text labels (not color-alone)
- Keyboard navigation: Tab through cards, Enter to open, Arrow keys in list view
- Screen reader: Cards use `role="article"`, stats use `role="status"`

---

## 15. Design Token Files

| File | Purpose |
|------|---------|
| `src/design/tokens/dashboard.json` | Design token definitions (JSON) |
| `src/design/css/dashboard-variables.css` | CSS custom properties |
| `src/design/tailwind/dashboard-theme.ts` | Tailwind theme extensions |

All tokens reference the shared primitive/semantic tokens from `colors.json`, `typography.json`, and `spacing.json`.
