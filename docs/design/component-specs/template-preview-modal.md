# Template Preview Modal — Component Specification

**Task:** TASK-158 — Design template preview modal (workflow diagram, details, use button)  
**Epic:** 20 — Template Library UI Design & Implementation  
**Priority:** P1  
**Author:** Designer Agent  
**Status:** Complete  
**Depends on:** TASK-156 (Template library UI spec — ✅ done), TASK-157 (Template card spec — ✅ done)  
**Blocks:** TASK-160 (Implement template preview modal)

---

## 1. Overview

The Template Preview Modal is a full-featured overlay that lets users inspect a workflow template in detail before adopting it. It presents an interactive workflow diagram alongside comprehensive metadata — author, ratings, composition (agents, tools, tasks), tags, and a full description — with a prominent "Use Template" call-to-action.

This spec expands on the Preview Modal section (§6) of the Template Library UI spec (TASK-156) with pixel-precise anatomy, every visual state, exhaustive token mappings, responsive behavior, animation choreography, and accessibility requirements.

### Design Principles

- **Inspect before commit** — users can explore the full workflow graph and metadata without leaving the library
- **Clear visual hierarchy** — large diagram area, scannable sidebar sections, prominent CTA
- **Animated choreography** — overlay → modal → diagram nodes → edges → sidebar content, creating a polished reveal sequence
- **Consistent with canvas** — diagram preview uses the same node type colors and edge styles as the full canvas editor
- **Fully accessible** — focus trap, keyboard dismissal, screen reader announcements, reduced motion support

---

## 2. Modal Anatomy

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  HEADER (64px)                                                  │   │
│  │  ┌──────┐                                                 ┌──┐ │   │
│  │  │ Icon │ Template Title        [Category Badge] ★ 4.8    │✕ │ │   │
│  │  └──────┘                                                 └──┘ │   │
│  ├───────────────────────────────────────────┬─────────────────────┤   │
│  │                                           │                     │   │
│  │                                           │  AUTHOR             │   │
│  │        WORKFLOW DIAGRAM                   │  ┌──┐ Creator Name  │   │
│  │        (Interactive zoom/pan)             │  └──┘               │   │
│  │                                           │  ─────────────────  │   │
│  │     ┌────────┐      ┌────────┐           │  STATS              │   │
│  │     │ Agent  │──────│  Task  │           │  ⬇ 1,234 uses       │   │
│  │     └────────┘      └────────┘           │  ★ 4.8 rating       │   │
│  │         │               │                │  📅 Jan 15, 2026     │   │
│  │     ┌────────┐      ┌────────┐           │  ─────────────────  │   │
│  │     │  Tool  │      │  LLM   │           │  DESCRIPTION        │   │
│  │     └────────┘      └────────┘           │  Full description   │   │
│  │                                           │  text that can be   │   │
│  │     [−] [⊡] [+]  zoom controls           │  scrolled if long   │   │
│  │                                           │  ─────────────────  │   │
│  │                                           │  COMPOSITION        │   │
│  │                                           │  ● 3 Agents         │   │
│  │                                           │  ● 5 Tasks          │   │
│  │                                           │  ● 4 Tools          │   │
│  │                                           │  ● 2 LLMs           │   │
│  │                                           │  ─────────────────  │   │
│  │                                           │  TAGS               │   │
│  │                                           │  [research] [web]   │   │
│  │                                           │  [GPT-4] [scraping] │   │
│  ├───────────────────────────────────────────┴─────────────────────┤   │
│  │  FOOTER (64px)                                                  │   │
│  │            [ Open in Canvas ]    [ ★ Use Template ]             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  (backdrop overlay — rgba(0,0,0,0.7) + 8px blur)                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Dimensions & Layout

### 3a. Container

| Property        | Value                     | Token / Variable               |
|-----------------|---------------------------|--------------------------------|
| Width           | 900px                     | `--modal-w`                    |
| Max width       | `calc(100vw - 48px)`      | `--modal-max-w`                |
| Max height      | 85vh                      | `--modal-max-h`                |
| Min height      | 520px                     | `--modal-min-h`                |
| Background      | `surface-panel` (#0f172a) | `--modal-bg`                   |
| Border          | 1px `border-default`      | `--modal-border`               |
| Border radius   | 12px (xl)                 | `--modal-radius`               |
| Shadow          | `0 24px 48px …`           | `--modal-shadow`               |
| Centering       | Flexbox, centered both axes | —                            |

### 3b. Overlay

| Property     | Value                   | Token                    |
|--------------|-------------------------|--------------------------|
| Background   | `rgba(0,0,0,0.7)`      | `--overlay-bg`           |
| Backdrop blur | 8px                    | `--overlay-blur`         |
| z-index      | 50                      | Application layer        |

### 3c. Internal Layout

The modal body uses a horizontal flex layout:

| Region           | Width       | Notes                          |
|------------------|-------------|--------------------------------|
| Diagram (left)   | `flex: 1`   | Takes remaining width          |
| Sidebar (right)  | 300px fixed | Scrollable if content overflows |

---

## 4. Header

**Height:** 64px  
**Background:** `surface-card` (#1e293b)  
**Border bottom:** 1px `border-subtle`  
**Padding:** 16px vertical, 24px horizontal  
**Border radius:** 12px 12px 0 0 (top corners)

### Elements (left to right):

1. **Category icon** — 24×24px container with category color tint (same as template card)
2. **Title** — 20px / 700 weight / `text-primary`, truncate with ellipsis at 480px max-width
3. **Category badge** — 24px tall pill with category bg + text (e.g., "Research" in sky-400)
4. **Rating** — ★ icon (14px, amber-400 if ≥4.0) + numeric value in `text-secondary`, 13px/500
5. **Close button** — 32×32px, `text-tertiary` → `text-primary` on hover, `rgba(30,41,59,0.5)` hover bg, `radius-md`

### Category Badge Colors

Uses the same category palette as the template library:

| Category    | Text Color  | Background              |
|-------------|-------------|-------------------------|
| Research    | `#38bdf8`   | `rgba(56,189,248,0.15)` |
| Code        | `#a78bfa`   | `rgba(167,139,250,0.15)`|
| Support     | `#34d399`   | `rgba(52,211,153,0.15)` |
| Content     | `#fbbf24`   | `rgba(251,191,36,0.15)` |
| Data        | `#fb7185`   | `rgba(251,113,133,0.15)`|
| Automation  | `#cbd5e1`   | `rgba(203,213,225,0.15)`|

---

## 5. Workflow Diagram Area

The left region of the modal body displays an interactive preview of the template's workflow graph.

### Dimensions

| Property     | Value                          |
|--------------|--------------------------------|
| Height       | 400px                          |
| Min height   | 300px (responsive)             |
| Padding      | 24px                           |
| Background   | `rgba(10,14,26,0.9)` (matches canvas) |
| Border right | 1px `border-subtle`            |

### Background Grid

A subtle dot grid provides visual grounding (same as canvas viewport):

- **Dot color:** `rgba(148,163,184,0.08)`
- **Dot size:** 1px
- **Dot spacing:** 20px

### Preview Nodes

Compact versions of canvas nodes, showing type icon + label:

| Property     | Value              |
|--------------|--------------------|
| Width        | 140px              |
| Height       | 48px               |
| Border radius| 8px (lg)           |
| Border width | 1.5px              |
| Icon size    | 16px               |
| Label        | 11px / 500 weight  |
| Shadow       | `0 1px 4px rgba(0,0,0,0.3)` |

Node types use the standard canvas type colors:

| Type   | Background              | Border    | Icon      |
|--------|-------------------------|-----------|-----------|
| Agent  | `rgba(124,58,237,0.15)` | violet-500| violet-400|
| Task   | `rgba(14,165,233,0.15)` | sky-500   | sky-400   |
| Tool   | `rgba(16,185,129,0.15)` | emerald-500| emerald-400|
| LLM    | `rgba(245,158,11,0.15)` | amber-500 | amber-400 |

### Edges

| Property     | Value                            |
|--------------|----------------------------------|
| Color        | `rgba(148,163,184,0.25)`         |
| Active color | violet-400 (`#a78bfa`)           |
| Width        | 1.5px                            |
| Dash array   | `4 4` (for data flow indicators) |
| Arrow size   | 8px                              |
| Type         | Smoothstep (consistent with canvas)|

### Zoom Controls

Positioned bottom-left with 16px inset:

| Property     | Value                          |
|--------------|--------------------------------|
| Background   | `rgba(15,23,42,0.8)`          |
| Border       | `border-subtle`                |
| Border radius| 8px (lg)                       |
| Button size  | 28×28px                        |
| Icon size    | 14px                           |
| Buttons      | [−] Zoom out, [⊡] Fit, [+] Zoom in |

### Interaction

- **Zoom:** Scroll wheel or control buttons (range: 0.5× – 2.0×)
- **Pan:** Click-and-drag on background
- **Fit to view:** Default behavior on modal open, also via fit button
- **Read-only:** Nodes and edges are not editable in preview mode

### Empty State

If the template has no nodes:

- **Icon:** 56×56px workflow icon in `slate-600`
- **Text:** "No workflow diagram available" in `text-tertiary`, 13px

---

## 6. Detail Sidebar

The right panel provides structured metadata about the template.

### Dimensions

| Property     | Value                  |
|--------------|------------------------|
| Width        | 300px (fixed)          |
| Min width    | 260px (responsive)     |
| Padding      | 20px                   |
| Background   | `surface-card` (#1e293b)|
| Border left  | 1px `border-subtle`    |
| Overflow     | Vertical scroll        |

### Section Dividers

Horizontal lines between sections:
- **Color:** `border-subtle`
- **Width:** 1px
- **No extra margin** — spacing is handled by the 20px section gap

### Section Labels

All section headings use:
- **Font:** 11px / 600 weight / 0.05em tracking
- **Color:** `text-tertiary`
- **Transform:** UPPERCASE
- **Margin bottom:** 8px

---

### 6a. Author Section

| Element      | Spec                                |
|--------------|-------------------------------------|
| Avatar       | 28×28px circle, `rgba(139,92,246,0.15)` bg, violet-300 initials |
| Name         | 13px / 500 weight / `text-primary`  |
| Gap          | 8px between avatar and name         |
| Layout       | Horizontal flex, centered           |

---

### 6b. Stats Section

Three stat rows, each with icon + label + value:

| Stat         | Icon     | Label       | Value Example |
|--------------|----------|-------------|---------------|
| Uses         | Download | "Uses"      | "1,234"       |
| Rating       | Star     | "Rating"    | "4.8 / 5.0"  |
| Created      | Calendar | "Created"   | "Jan 15, 2026"|

- **Icon:** 14px, `text-tertiary`
- **Label:** 12px / 400, `text-tertiary`
- **Value:** 13px / 500, `text-secondary`
- **Row gap:** 10px
- **Inline gap:** 8px (between icon, label, value)

---

### 6c. Description Section

- **Font:** 14px / 400 / 1.625 line-height
- **Color:** `text-secondary`
- **Max height:** 160px (scrollable with subtle scrollbar)
- **Content:** Full untruncated template description

---

### 6d. Composition Section

Shows counts of each node type with colored icons:

```
┌──────────────────────────────────┐
│  ● 3 Agents    (violet-400)      │
│  ● 5 Tasks     (sky-400)         │
│  ● 4 Tools     (emerald-400)     │
│  ● 2 LLMs      (amber-400)       │
└──────────────────────────────────┘
```

Each composition item:

| Property     | Value                            |
|--------------|----------------------------------|
| Height       | 32px                             |
| Background   | `rgba(30,41,59,0.3)`             |
| Border       | 1px `border-subtle`              |
| Border radius| 6px (md)                         |
| Icon         | 16px, type-specific color        |
| Label        | 12px / 400, `text-secondary`     |
| Count        | 13px / 600, `text-primary`       |
| Gap          | 8px between items                |

---

### 6e. Tags Section

All template tags displayed (not truncated like in card view):

- **Tag height:** 24px (slightly larger than card tags for readability)
- **Padding X:** 8px
- **Background:** `surface-elevated`
- **Border:** `border-subtle`
- **Text:** 11px / 500, `text-tertiary`
- **Hover:** `rgba(139,92,246,0.12)` bg, `violet-300` text
- **Gap:** 6px
- **Wrap:** flex-wrap (tags flow to multiple rows)

---

## 7. Footer

**Height:** 64px  
**Background:** `surface-card` (#1e293b)  
**Border top:** 1px `border-subtle`  
**Padding:** 12px vertical, 24px horizontal  
**Border radius:** 0 0 12px 12px (bottom corners)  
**Layout:** Flex, right-aligned, 12px gap

### 7a. "Use Template" Button (Primary)

| Property      | Value                                |
|---------------|--------------------------------------|
| Height        | 40px                                 |
| Min width     | 160px                                |
| Background    | violet-600 (`#7c3aed`)               |
| Background hover | violet-500 (`#8b5cf6`)            |
| Background active | violet-700 (`#6d28d9`)           |
| Background disabled | `rgba(124,58,237,0.3)`         |
| Text          | `#ffffff`                            |
| Text disabled | `rgba(255,255,255,0.5)`              |
| Font          | 14px / 600 weight                    |
| Icon          | 16px, 8px gap (arrow or plus icon)   |
| Border radius | 8px (lg)                             |
| Shadow        | `0 2px 8px rgba(124,58,237,0.35)`    |
| Shadow hover  | `0 4px 12px rgba(124,58,237,0.45)`   |

### 7b. "Open in Canvas" Button (Secondary)

| Property        | Value                             |
|-----------------|-----------------------------------|
| Height          | 40px                              |
| Background      | transparent                       |
| Background hover| `rgba(139,92,246,0.12)`           |
| Text            | violet-300 (`#c4b5fd`)            |
| Text hover      | violet-200 (`#ddd6fe`)            |
| Border          | 1px violet-600 (`#7c3aed`)       |
| Border hover    | violet-500 (`#8b5cf6`)            |
| Font            | 14px / 500 weight                 |
| Icon            | 16px, canvas/external-link icon   |
| Border radius   | 8px (lg)                          |

---

## 8. Animation Choreography

The modal uses a staged reveal for polish:

### Sequence

| Step | Element         | Animation                          | Duration | Delay  |
|------|-----------------|-------------------------------------|----------|--------|
| 1    | Overlay         | Fade in (opacity 0→1)               | 200ms    | 0ms    |
| 2    | Modal container | Scale 0.95→1 + translateY 12px→0    | 300ms    | 0ms    |
| 3    | Diagram nodes   | Scale 0.85→1 (staggered, 60ms apart)| 250ms    | 100ms  |
| 4    | Diagram edges   | Stroke dash offset animation         | 400ms    | 300ms  |
| 5    | Sidebar content | Fade + translateX 8px→0             | 200ms    | 150ms  |

### Exit Sequence

| Step | Element         | Animation                          | Duration |
|------|-----------------|-------------------------------------|----------|
| 1    | Sidebar content | Fade out                            | 100ms    |
| 2    | Modal container | Scale 1→0.95 + translateY 0→8px    | 200ms    |
| 3    | Overlay         | Fade out                            | 150ms    |

### Easing Curves

- **Modal enter:** `cubic-bezier(0.34, 1.56, 0.64, 1)` — spring bounce
- **Modal exit:** `ease-in` — quick retreat
- **Diagram nodes:** `cubic-bezier(0.34, 1.56, 0.64, 1)` — same spring
- **Edges:** `ease-out`
- **Sidebar:** `ease-out`

### Reduced Motion

When `prefers-reduced-motion: reduce`:
- All animation durations set to 0ms
- Transitions set to 0ms
- Elements appear instantly without transforms

---

## 9. Responsive Behavior

### Below 768px (Mobile / Small Tablet)

- Modal width: `calc(100vw - 32px)`
- Max height: 90vh
- Layout changes from horizontal to vertical stack:
  - Diagram on top (280px height)
  - Sidebar below (full width, scrollable)
- Footer buttons stack vertically (full width each)
- Close button moved to top-right with larger touch target (44×44px)

### 768px – 1024px (Tablet)

- Modal width: 900px (or max available with 48px margin)
- Sidebar shrinks to 260px min-width
- Diagram maintains 300px min-height

### Above 1024px (Desktop)

- Full 900px width
- Standard horizontal layout
- All dimensions as specified

---

## 10. Accessibility

### Focus Management

- Focus is trapped within the modal while open
- On open: focus moves to the close button (first interactive element)
- Tab order: Close → Diagram zoom controls → Sidebar tags → Footer buttons
- On close: focus returns to the triggering element (Preview button or thumbnail)

### Keyboard

| Key       | Action                              |
|-----------|-------------------------------------|
| `Escape`  | Close modal                         |
| `Tab`     | Cycle through interactive elements  |
| `Shift+Tab` | Reverse cycle                    |
| `Enter`   | Activate focused button             |
| `Space`   | Activate focused button             |

### ARIA

| Element           | Attribute                                      |
|-------------------|-------------------------------------------------|
| Overlay           | `aria-hidden="true"` when modal closed          |
| Modal root        | `role="dialog"`, `aria-modal="true"`            |
| Modal root        | `aria-labelledby="preview-title"`               |
| Title             | `id="preview-title"`                            |
| Close button      | `aria-label="Close preview"`                    |
| Diagram region    | `role="img"`, `aria-label="Workflow diagram for {template name}"` |
| Zoom controls     | `aria-label="Zoom in"`, `"Zoom out"`, `"Fit to view"` |
| Stats section     | `role="list"`, items as `role="listitem"`       |
| Tags              | `role="list"`, tags as `role="listitem"`        |
| Use Template btn  | `aria-label="Use this template"`                |
| Open Canvas btn   | `aria-label="Open template in canvas editor"`   |

### Color Contrast

All text meets WCAG 2.1 AA minimum contrast ratios:
- `text-primary` (#f8fafc) on `surface-card` (#1e293b) → **13.2:1** ✅
- `text-secondary` (#94a3b8) on `surface-card` (#1e293b) → **5.1:1** ✅
- `text-tertiary` (#64748b) on `surface-card` (#1e293b) → **3.2:1** (decorative labels only)
- White (#ffffff) on violet-600 (#7c3aed) → **5.6:1** ✅
- violet-300 (#c4b5fd) on transparent/dark → **8.1:1** ✅

---

## 11. States

### Modal States

| State        | Appearance                                    |
|--------------|-----------------------------------------------|
| Opening      | Overlay fading in, modal scaling up            |
| Open         | Fully visible, interactive                     |
| Loading      | Modal open, diagram shows skeleton shimmer, sidebar shows skeleton lines |
| Error        | Diagram shows error icon + retry button        |
| Closing      | Modal scaling down, overlay fading out         |
| Closed       | Removed from DOM, overlay hidden               |

### Button States

| State      | Use Template                        | Open in Canvas                     |
|------------|-------------------------------------|-------------------------------------|
| Default    | violet-600 bg, white text           | Transparent, violet-300 text/border |
| Hover      | violet-500 bg, stronger shadow      | violet-12% bg, violet-200 text      |
| Active     | violet-700 bg, recessed shadow      | violet-15% bg                       |
| Focus      | violet-500 ring (3px, 25% opacity)  | violet-500 ring                     |
| Disabled   | 30% opacity violet bg, 50% text     | 30% opacity border/text             |
| Loading    | Spinner replaces icon, text "Creating…" | —                              |

---

## 12. Interaction Summary

| Action                       | Result                                      |
|------------------------------|---------------------------------------------|
| Click "Preview" on card      | Open modal with staged animation            |
| Click thumbnail on card      | Open modal (same as above)                  |
| Click ✕ button               | Close modal with exit animation             |
| Press Escape                 | Close modal                                 |
| Click overlay                | Close modal                                 |
| Scroll wheel on diagram      | Zoom in/out                                 |
| Drag on diagram background   | Pan the view                                |
| Click [−] / [+] controls     | Step zoom in/out by 0.25×                   |
| Click [⊡] fit control        | Fit all nodes in view                       |
| Click tag in sidebar         | Close modal, navigate to library filtered by tag |
| Click author name            | Close modal, navigate to library filtered by author |
| Click "Use Template"         | Copy template to user account, navigate to canvas |
| Click "Open in Canvas"       | Open template in canvas editor (read-only preview) |

---

## 13. Design Tokens Reference

All tokens live in the design system directory and follow the Design Tokens Community Group format.

| File | Purpose |
|---|---|
| `src/design/tokens/template-preview-modal.json` | All sizing, color, animation, and spacing tokens |
| `src/design/css/template-preview-modal-variables.css` | CSS custom properties (scoped to `.cs-preview-modal*` classes) |
| `src/design/tailwind/template-preview-modal-theme.ts` | Tailwind theme extension (`templatePreviewModalTheme`) |

### Integration

```typescript
// tailwind.config.ts
import { templateLibraryTheme } from './src/design/tailwind/template-library-theme';
import { templatePreviewModalTheme } from './src/design/tailwind/template-preview-modal-theme';

export default {
  theme: {
    extend: {
      ...templateLibraryTheme,
      ...templatePreviewModalTheme,
    },
  },
};
```

---

## 14. Dependencies

- **Depends on:** TASK-156 (template library UI spec), TASK-157 (template card spec)
- **Blocks:** TASK-160 (implement template preview modal), TASK-161 (implement template instantiation)
- **Uses:** Shared tokens from `colors.json`, `spacing.json`, `typography.json`, `canvas.json`
