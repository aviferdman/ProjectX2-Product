# Crewspace Accessibility Requirements

**Task:** TASK-171 — Define accessibility requirements (keyboard nav, focus states, ARIA)  
**Target:** WCAG 2.1 AA Compliance  
**Scope:** All screens — Dashboard, Canvas Editor, Debug Timeline, Onboarding, Templates, Marketplace  
**Blocks:** TASK-174 (Implement accessibility — keyboard shortcuts, focus management, ARIA)

---

## Table of Contents

1. [Compliance Target & Principles](#1-compliance-target--principles)
2. [Global Keyboard Navigation](#2-global-keyboard-navigation)
3. [Focus Management](#3-focus-management)
4. [ARIA Patterns & Semantic Structure](#4-aria-patterns--semantic-structure)
5. [Screen-Specific Requirements](#5-screen-specific-requirements)
6. [Color & Contrast](#6-color--contrast)
7. [Motion & Animation](#7-motion--animation)
8. [Forms & Error Handling](#8-forms--error-handling)
9. [Screen Reader Announcements](#9-screen-reader-announcements)
10. [Touch & Pointer](#10-touch--pointer)
11. [Testing Checklist](#11-testing-checklist)

---

## 1. Compliance Target & Principles

### Target Standard

- **WCAG 2.1 Level AA** — all success criteria
- **ARIA Authoring Practices Guide (APG)** — for custom widget patterns
- **Section 508** — U.S. federal accessibility (aligned with WCAG 2.1 AA)

### Core Principles (POUR)

| Principle | Requirement |
|-----------|-------------|
| **Perceivable** | All content available to screen readers; sufficient contrast; captions for media; no information conveyed by color alone |
| **Operable** | Full keyboard access to all features; no keyboard traps; sufficient time limits; no seizure-inducing content |
| **Understandable** | Predictable navigation; clear error messages; consistent labeling; reading level appropriate |
| **Robust** | Valid semantic HTML; ARIA used correctly; works across assistive technologies (NVDA, JAWS, VoiceOver, TalkBack) |

### Assistive Technology Support Matrix

| Technology | Platform | Priority |
|------------|----------|----------|
| NVDA | Windows + Chrome/Firefox | P0 |
| JAWS | Windows + Chrome | P1 |
| VoiceOver | macOS + Safari/Chrome | P0 |
| VoiceOver | iOS + Safari | P2 |
| TalkBack | Android + Chrome | P2 |
| Windows Magnifier | Windows | P1 |
| macOS Zoom | macOS | P1 |

---

## 2. Global Keyboard Navigation

### 2.1 Tab Order & Skip Links

- **Skip link** as the first focusable element on every page: "Skip to main content" (visually hidden until focused, then absolutely positioned at top-left with high contrast).
- **Secondary skip links** on complex pages:
  - Canvas: "Skip to toolbar", "Skip to sidebar", "Skip to properties panel"
  - Timeline: "Skip to timeline chart", "Skip to log viewer", "Skip to filters"
  - Dashboard: "Skip to workflow list"
- **Tab order** follows visual reading order (left-to-right, top-to-bottom) within each landmark region.
- **Tab sequence per page:**
  1. Skip links → Top navigation bar → Sidebar (if present) → Main content → Contextual panels

### 2.2 Global Shortcuts

All shortcuts work from any context unless focus is inside a text input.

| Shortcut | Action | Scope |
|----------|--------|-------|
| `Ctrl/Cmd + K` | Open command palette | Global |
| `?` or `Ctrl/Cmd + /` | Open keyboard shortcut reference | Global |
| `Escape` | Close topmost overlay/modal/popover; deselect | Global |
| `Tab` | Move focus forward | Global |
| `Shift + Tab` | Move focus backward | Global |
| `Alt + 1` | Navigate to Dashboard | Global |
| `Alt + 2` | Navigate to Canvas | Global |
| `Alt + 3` | Navigate to Templates | Global |
| `Alt + 4` | Navigate to Marketplace | Global |

### 2.3 Shortcut Discoverability

- **Keyboard shortcut reference panel:** Accessible via `?` key or Help menu → "Keyboard Shortcuts".
- Panel renders as a non-modal dialog (`role="dialog"`) listing all shortcuts organized by screen.
- Shortcuts shown as `<kbd>` elements with proper ARIA labels.
- Tooltip on each toolbar button includes its shortcut: e.g., "Add Node (N)".

### 2.4 Shortcut Conflict Avoidance

- No custom shortcuts may override browser defaults (`Ctrl+L`, `Ctrl+T`, `F5`, etc.).
- No custom shortcuts may override screen reader pass-through keys (`Insert`, `Caps Lock` modifiers).
- When focus is inside a text `<input>`, `<textarea>`, or `contenteditable`, single-key shortcuts (`N`, `G`, `M`, `?`) are suppressed.

---

## 3. Focus Management

### 3.1 Focus Ring Style

All interactive elements must show a visible focus indicator:

```
/* Global focus ring token */
outline: 2px solid var(--cs-color-violet-400);   /* #a78bfa */
outline-offset: 2px;
border-radius: inherit;
```

- **Minimum contrast:** Focus ring must have ≥ 3:1 contrast ratio against adjacent colors (WCAG 2.4.11).
- **No outline removal:** `outline: none` is prohibited unless replaced with an equivalent custom indicator of equal or greater visibility.
- On dark backgrounds (`--cs-bg-primary: #0f172a`), violet focus ring provides ~5.2:1 contrast.
- On light surfaces (modals, dropdowns), use `var(--cs-color-violet-600)` (#7c3aed) for ≥ 3:1.

### 3.2 Focus Trapping (Modal Contexts)

Focus must be trapped inside the following overlays while open:

| Component | Trap Behavior |
|-----------|---------------|
| Modals (delete confirm, export, settings) | Trap focus; `Escape` closes; return focus to trigger element |
| Onboarding wizard | Trap focus within active step; `Escape` opens "Skip" confirmation |
| Command palette (`Ctrl+K`) | Trap focus; `Escape` closes; return focus to previous element |
| Context menus | Trap focus; arrow keys navigate; `Escape` closes; return focus to trigger |
| Dropdown menus | Trap focus; arrow keys navigate; `Escape` closes; return focus to trigger |
| Properties panel (canvas) | No trap — panel is inline; Tab enters/exits naturally |

**Implementation pattern:**
1. On open: store `document.activeElement` as return target.
2. Move focus to first focusable element inside overlay.
3. Intercept `Tab`/`Shift+Tab` to cycle within overlay boundaries.
4. On close: restore focus to stored return target.
5. Prevent background scroll while modal is open (`aria-hidden="true"` on `#app-root`).

### 3.3 Focus Restoration

Focus must be restored to the triggering element when:
- A modal/dialog closes
- A dropdown/popover closes
- A context menu closes
- A panel collapses (sidebar toggle)
- An inline edit completes
- A drag-and-drop operation is cancelled

If the trigger element was removed (e.g., node deleted via context menu), focus moves to the next logical element (adjacent node, parent container, or canvas).

### 3.4 Programmatic Focus Moves

Focus must be programmatically moved (with screen reader announcement) when:

| Event | Focus Target | Announcement |
|-------|-------------|--------------|
| Node added to canvas | The new node | "Agent node [name] added to canvas" |
| Edge connected | The target node | "Connected [source] to [target]" |
| Node deleted | Next node in tab order, or canvas | "[name] deleted" |
| Workflow run started | Status indicator | "Workflow running" |
| Workflow run completed | Status indicator | "Workflow completed: [success/error]" |
| Navigation to new page | `<h1>` of the new page | Page title announced naturally |
| Search results loaded | First result item | "[N] results found" |
| Filter applied | Result list | "Filtered: [N] items" |

---

## 4. ARIA Patterns & Semantic Structure

### 4.1 Landmark Regions

Every page must define these landmarks:

```html
<header role="banner">         <!-- Top navigation bar -->
<nav role="navigation">         <!-- Primary sidebar nav, with aria-label -->
<main role="main">              <!-- Primary content area -->
<aside role="complementary">    <!-- Properties panel, help panel -->
<footer role="contentinfo">     <!-- Footer, if present -->
```

- Multiple `<nav>` elements must have distinct `aria-label` values: "Primary navigation", "Breadcrumb", "Pagination".
- `<main>` must be unique per page.

### 4.2 Heading Hierarchy

Every page must have exactly one `<h1>` reflecting the page title. Heading levels must not skip (no `<h1>` → `<h3>`).

| Page | h1 | h2 examples |
|------|----|-------------|
| Dashboard | "Dashboard" | "Usage Statistics", "Your Workflows" |
| Canvas | "Canvas: [Workflow Name]" | "Toolbar", "Node Library", "Properties" |
| Timeline | "Debug Timeline: [Workflow Name]" | "Timeline Chart", "Log Viewer", "Filters" |
| Templates | "Template Library" | "Categories", "Featured Templates" |
| Settings | "Settings" | "Profile", "API Keys", "Preferences" |

### 4.3 Custom Widget ARIA Patterns

#### Canvas (Graph Editor)

The canvas uses a custom **application** role pattern since it is a non-standard interactive widget:

```html
<div role="application" aria-label="Workflow canvas editor" aria-roledescription="canvas">
  <!-- Nodes are focusable elements within the application -->
  <div role="group" aria-label="Workflow nodes">
    <div role="button" 
         aria-label="Agent node: Data Analyst" 
         aria-roledescription="workflow node"
         aria-describedby="node-status-123"
         tabindex="0"
         aria-grabbed="false"
         data-node-id="123">
      <!-- node content -->
    </div>
  </div>
  
  <!-- Edges described as connections -->
  <div role="list" aria-label="Connections">
    <div role="listitem" 
         aria-label="Connection from Data Analyst to Report Writer"
         tabindex="0">
    </div>
  </div>
</div>
```

**Canvas keyboard navigation:**

| Key | Action |
|-----|--------|
| `Tab` | Cycle through nodes in creation order |
| `Shift + Tab` | Cycle backward |
| `Arrow keys` | Move selected node by 10px (with `Shift`: 1px fine; with `Ctrl`: 50px coarse) |
| `Enter` | Open properties panel for focused node |
| `Delete` / `Backspace` | Delete focused node (with confirmation if connected) |
| `N` | Open "Add Node" popover |
| `C` | Start connection mode from focused node (then `Tab` to target, `Enter` to connect) |
| `Ctrl + A` | Select all nodes |
| `Ctrl + D` | Duplicate selected node(s) |
| `Ctrl + Z` / `Ctrl + Y` | Undo / Redo |
| `Ctrl + C` / `Ctrl + V` | Copy / Paste node(s) |
| `F` | Fit all nodes in viewport |
| `G` | Toggle snap-to-grid |
| `Space + Arrow keys` | Pan canvas |
| `+` / `-` | Zoom in / out |
| `0` | Reset zoom to 100% |

**Keyboard alternative for drag-and-drop:**
- To add a node: Press `N` → search/select node type → `Enter` places at center of viewport or next to last-added node.
- To connect nodes: Focus source node → `C` → `Tab` to target → `Enter` to confirm.
- To reorder/move: Focus node → `Arrow keys` to reposition.

#### Timeline Chart

```html
<div role="application" aria-label="Debug timeline" aria-roledescription="timeline chart">
  <!-- Playhead as slider -->
  <div role="slider" 
       aria-label="Timeline playhead"
       aria-valuemin="0" 
       aria-valuemax="120" 
       aria-valuenow="45"
       aria-valuetext="0 minutes 45 seconds"
       tabindex="0">
  </div>
  
  <!-- Agent swimlanes -->
  <div role="group" aria-label="Agent swimlanes">
    <div role="row" aria-label="Agent: Data Analyst">
      <div role="gridcell" 
           aria-label="LLM call, 00:03 to 00:05, 2 second duration"
           tabindex="0">
      </div>
    </div>
  </div>
</div>
```

**Timeline keyboard navigation:**

| Key | Action |
|-----|--------|
| `Space` | Play / Pause playback |
| `←` / `→` | Step to previous / next event |
| `Shift + ←` / `Shift + →` | Jump 5 events |
| `Home` / `End` | Jump to start / end |
| `+` / `-` | Zoom in / out on time axis |
| `0` | Reset zoom |
| `Up` / `Down` | Move between swimlanes |
| `F` | Focus search input |
| `Escape` | Clear selection / close search |

#### Log Viewer

```html
<div role="grid" aria-label="Execution log" aria-rowcount="1247">
  <div role="rowgroup">
    <div role="row" aria-rowindex="1">
      <div role="columnheader">Timestamp</div>
      <div role="columnheader">Level</div>
      <div role="columnheader">Agent</div>
      <div role="columnheader">Message</div>
    </div>
  </div>
  <div role="rowgroup">
    <div role="row" aria-rowindex="2" tabindex="0" aria-selected="false">
      <div role="gridcell">00:03.245</div>
      <div role="gridcell"><span aria-label="Warning level">WARN</span></div>
      <div role="gridcell">Data Analyst</div>
      <div role="gridcell">Rate limit approaching</div>
    </div>
  </div>
</div>
```

**Log viewer keyboard navigation:**

| Key | Action |
|-----|--------|
| `Up` / `Down` | Move between log rows |
| `Enter` | Expand/collapse log entry detail |
| `Ctrl + Home` / `Ctrl + End` | Jump to first / last log entry |
| `Page Up` / `Page Down` | Scroll by visible page |

#### Dashboard Cards

```html
<!-- Grid/List view -->
<section aria-label="Your Workflows">
  <div role="toolbar" aria-label="Workflow filters">
    <input type="search" aria-label="Search workflows" />
    <div role="group" aria-label="Status filters">
      <button aria-pressed="false">Draft</button>
      <button aria-pressed="true">Active</button>
    </div>
    <div role="radiogroup" aria-label="View mode">
      <button role="radio" aria-checked="true">Grid</button>
      <button role="radio" aria-checked="false">List</button>
    </div>
  </div>
  
  <!-- Grid view -->
  <ul role="list" aria-label="Workflow list">
    <li role="listitem">
      <article aria-label="Workflow: Data Pipeline, Status: Active, Last run: 2 hours ago">
        <!-- card content -->
      </article>
    </li>
  </ul>
</section>
```

#### Onboarding Wizard

```html
<div role="dialog" aria-label="Welcome to Crewspace" aria-modal="true">
  <nav aria-label="Setup progress">
    <ol role="list">
      <li aria-current="step">Welcome</li>
      <li>Connect LLM</li>
      <li>First Workflow</li>
      <li>Complete</li>
    </ol>
  </nav>
  <div role="group" aria-label="Step 1: Welcome">
    <!-- step content -->
  </div>
  <div role="group" aria-label="Navigation">
    <button>Skip Setup</button>
    <button>Next</button>
  </div>
</div>
```

### 4.4 ARIA Live Regions

Dynamic content updates must be announced to screen readers:

| Region | `aria-live` | `aria-atomic` | Content |
|--------|-------------|---------------|---------|
| Workflow run status | `polite` | `true` | "Workflow running…", "Workflow completed successfully", "Workflow failed: [error]" |
| Node operation feedback | `polite` | `true` | "Node added", "Node deleted", "Connection created" |
| Toast notifications | `assertive` | `true` | Error toasts; `polite` for success/info toasts |
| Search result count | `polite` | `true` | "[N] results found" |
| Filter result count | `polite` | `true` | "Showing [N] of [M] workflows" |
| Timeline playback status | `polite` | `true` | "Playing", "Paused at [timestamp]" |
| Form validation errors | `assertive` | `false` | Individual field error messages |
| Progress indicators | `polite` | `true` | "Loading… 45%", "Upload complete" |

**Implementation:**
```html
<!-- Persistent live region (always in DOM, content updated dynamically) -->
<div aria-live="polite" aria-atomic="true" class="sr-only" id="status-announcer">
  <!-- JS updates textContent here -->
</div>
```

---

## 5. Screen-Specific Requirements

### 5.1 Dashboard

| Requirement | Details |
|-------------|---------|
| Card focus | Each workflow card is a single tab stop; `Enter` opens workflow; card has `aria-label` with name + status + last run |
| Stats cards | `role="status"` with `aria-label` including number and label: "Total Workflows: 12" |
| Empty state | Focus moves to primary CTA ("Create Your First Workflow") |
| View toggle | `role="radiogroup"` with `role="radio"` buttons; selected state via `aria-checked` |
| Filter chips | `aria-pressed` toggles; live region announces filtered count |
| Sort | Dropdown with `aria-haspopup="listbox"`; selection announced |
| Pagination | `<nav aria-label="Pagination">` with current page indicated by `aria-current="page"` |

### 5.2 Canvas Editor

| Requirement | Details |
|-------------|---------|
| Canvas role | `role="application"` with `aria-roledescription="canvas"` to signal non-standard keyboard model |
| Node tab order | Nodes focusable via `Tab` in creation order; `aria-roledescription="workflow node"` |
| Node state | `aria-describedby` pointing to status span: "idle", "running", "error" |
| Drag alternative | Full keyboard node placement, connection, and repositioning (see §4.3) |
| Toolbar | `role="toolbar"` with `aria-label="Canvas toolbar"`; items navigable via arrow keys per APG toolbar pattern |
| Sidebar | `role="complementary"` with `aria-label="Node library"`; tree/list of node types with search |
| Properties panel | `role="complementary"` with `aria-label="Node properties"`; form controls labeled; opens on `Enter` from node |
| Minimap | `role="img"` with `aria-label="Canvas minimap showing viewport position"` (decorative for AT users) |
| Context menu | `role="menu"` with `role="menuitem"` children; arrow key navigation; `Escape` to close |
| Zoom level | Announce zoom changes: "Zoom: 75%" via live region |
| Grid toggle | Announce state: "Snap to grid enabled/disabled" via live region |

### 5.3 Debug Timeline

| Requirement | Details |
|-------------|---------|
| Playhead | `role="slider"` with `aria-valuetext` showing human-readable timestamp |
| Swimlanes | Each lane is a `role="row"` with `aria-label="Agent: [name]"` |
| Event blocks | Focusable; `aria-label` includes type, agent, start time, duration |
| Timeline ↔ Log sync | When event selected on timeline, log viewer scrolls and corresponding row gets `aria-selected="true"` |
| Playback controls | `role="toolbar"` with standard media control labels: "Play", "Pause", "Step forward", "Step backward", "Speed: 2x" |
| Speed selector | `role="listbox"` or `role="radiogroup"` with current speed announced |
| Filter dropdowns | Standard combobox/listbox pattern per APG; multi-select uses `aria-selected` on options |
| Search | `role="searchbox"` with `aria-label="Search logs"`; match count announced via live region |

### 5.4 Onboarding

| Requirement | Details |
|-------------|---------|
| Wizard modal | `role="dialog"` with `aria-modal="true"`; focus trapped |
| Step indicator | `aria-current="step"` on active step; completed steps marked with `aria-label="Step 1: Welcome, completed"` |
| Skip option | Always visible and focusable; labeled "Skip setup" |
| Spotlight tour | Highlighted element gets focus; description read via `aria-describedby` pointing to tooltip; `Escape` dismisses |
| Auto-advance prevention | No auto-advancing steps; user must explicitly confirm via button press |
| Contextual tooltips | `role="tooltip"` with `aria-describedby` association; dismiss with `Escape` |

### 5.5 Template Library

| Requirement | Details |
|-------------|---------|
| Category filters | `role="tablist"` / `role="tab"` pattern for category switching |
| Template cards | Same card pattern as dashboard; `aria-label` includes template name, category, agent count |
| Preview modal | `role="dialog"` with focus trap; "Use Template" CTA prominent |
| Search | Same search pattern as dashboard |

### 5.6 Marketplace

| Requirement | Details |
|-------------|---------|
| Integration cards | Focusable; `aria-label` includes name, type, install status |
| Install flow | Status change announced: "Installing…", "Installed successfully" |
| OAuth modal | `role="dialog"` with focus trap; external link opens in new tab with `aria-label` including "(opens in new window)" |

---

## 6. Color & Contrast

### 6.1 Contrast Ratios

| Element | Minimum Ratio | Standard |
|---------|---------------|----------|
| Body text (14px+) | 4.5:1 | WCAG AA |
| Large text (18px+ or 14px bold) | 3:1 | WCAG AA |
| UI components & graphical objects | 3:1 | WCAG 2.1 AA (1.4.11) |
| Focus indicators | 3:1 against adjacent colors | WCAG 2.4.11 |
| Placeholder text | 4.5:1 | WCAG AA |
| Disabled elements | Exempt (but must not convey actionable info) | — |

### 6.2 Color Independence

Information must never be conveyed by color alone:

| Pattern | Current | Accessible Enhancement |
|---------|---------|----------------------|
| Node status (running/error/success) | Color border/glow | Color + icon + text label ("Running ▶", "Error ✕", "Done ✓") |
| Log level badges | Colored badges | Color + text label (DEBUG, INFO, WARN, ERROR) ✅ already present |
| Workflow status | Colored status dot | Color + text label (Draft, Active, Error, Archived) ✅ already present |
| Timeline event types | Color-coded blocks | Color + icon inside block (🤖 LLM, 🔧 Tool, ✅ Task, ⚠ Error) |
| Usage progress bars | Green/yellow/red | Color + percentage text + "Normal"/"Warning"/"Critical" label |
| Connection edges | Color-coded lines | Color + line pattern (solid=data, dashed=control, dotted=conditional) |

### 6.3 Dark Mode Specific

Crewspace uses a dark-first design. Verify:
- Text on dark backgrounds: `--cs-text-primary` (#f8fafc) on `--cs-bg-primary` (#0f172a) = 15.4:1 ✅
- Subtle text: `--cs-text-secondary` (#94a3b8) on dark bg = verify ≥ 4.5:1
- Borders and dividers: Visible but not distracting
- If light mode is added in future, all tokens must be re-verified

---

## 7. Motion & Animation

### 7.1 Reduced Motion

All animations must respect `prefers-reduced-motion: reduce`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Per-component behavior when reduced motion is active:**

| Component | Normal | Reduced Motion |
|-----------|--------|----------------|
| Page transitions | Zoom + fade (200ms) | Instant swap (opacity crossfade 0ms) |
| Card entrance | Staggered spring (50ms/card) | Instant appear |
| Node pulse (running state) | Emerald border pulse | Static emerald border (no animation) |
| Drag ghost | Animated follow | Static position update |
| Timeline playhead | Smooth scrub | Jump between positions |
| Loading spinners | Rotating animation | Static "Loading…" text |
| Tooltip reveal | Fade + slide (150ms) | Instant appear |
| Stat count-up | Number animation (600ms) | Instant final number |
| Success/error flash | Color flash (300ms) | Static color change with icon |

### 7.2 Animation Performance

- Use only `transform` and `opacity` for animations (GPU-composited; no layout thrash).
- No animations exceeding 5 seconds without user control.
- No content that flashes more than 3 times per second (WCAG 2.3.1).

### 7.3 Auto-Playing Content

- Timeline playback never auto-starts; user must press Play.
- No auto-playing videos or audio.
- Auto-rotating carousels (if any) must have pause control.

---

## 8. Forms & Error Handling

### 8.1 Form Labels

Every form control must have an associated label:

```html
<!-- Visible label (preferred) -->
<label for="api-key">API Key</label>
<input id="api-key" type="text" />

<!-- Hidden label (icon-only buttons) -->
<button aria-label="Delete node">
  <svg aria-hidden="true"><!-- trash icon --></svg>
</button>

<!-- Described input -->
<label for="workflow-name">Workflow Name</label>
<input id="workflow-name" aria-describedby="name-hint" />
<span id="name-hint">Letters, numbers, and hyphens only</span>
```

### 8.2 Error States

| Requirement | Implementation |
|-------------|---------------|
| Field-level errors | `aria-invalid="true"` on the input; `aria-describedby` pointing to error message element |
| Error message | Visually adjacent to field; red text + error icon; announced via `aria-live="assertive"` region |
| Form-level summary | On submit failure, focus moves to error summary at top of form listing all errors as links to fields |
| Required fields | `aria-required="true"` on input; visual asterisk with `<span aria-hidden="true">*</span>` + `aria-label` or visible "(required)" text |
| Success feedback | `aria-live="polite"` announces "Settings saved successfully" or equivalent |

### 8.3 Drag-and-Drop Error States

| Scenario | Visual Feedback | Accessible Feedback |
|----------|----------------|---------------------|
| Invalid drop zone | Red overlay + forbidden cursor | `aria-live="assertive"`: "Cannot drop here: invalid target" |
| Connection to incompatible node | Red snap indicator | `aria-live="assertive"`: "Cannot connect: incompatible node types" |
| Drop cancelled (Escape) | Snap-back animation | `aria-live="polite"`: "Drop cancelled, node returned to original position" |
| Successful drop | Green flash + panel opens | `aria-live="polite"`: "Node placed successfully" |

---

## 9. Screen Reader Announcements

### 9.1 Announcement Priority

| Priority | `aria-live` | Use Case |
|----------|-------------|----------|
| Critical | `assertive` | Errors, validation failures, destructive action confirmations |
| Important | `polite` | Status changes, operation results, navigation updates |
| Informational | `polite` (debounced) | Hover previews, filter counts, zoom level changes |

### 9.2 Announcement Debouncing

Rapid-fire updates (e.g., zoom while scrolling, node repositioning with arrow keys) must be debounced:
- **Zoom level:** Announce only after 500ms of no change.
- **Node position:** Announce final position after 300ms of no arrow key press.
- **Search results:** Announce count after 500ms of no typing.
- **Filter changes:** Announce immediately (discrete user action).

### 9.3 Verbose vs. Concise Modes

Provide a user preference toggle (in Settings → Accessibility):
- **Verbose:** Full announcements — "Agent node Data Analyst added to canvas at position 200, 300"
- **Concise (default):** Short announcements — "Node added"

---

## 10. Touch & Pointer

### 10.1 Touch Target Sizes

| Element | Minimum Size | Standard |
|---------|-------------|----------|
| Buttons, links, interactive elements | 44 × 44 CSS pixels | WCAG 2.5.8 (AAA target, recommended) |
| Toolbar icons | 44 × 44px (icon 24px + padding) | — |
| Canvas node handles | 44 × 44px touch area (visual: 10px circle with expanded hit area) | — |
| Timeline event markers | 44 × 44px touch area | — |
| Close/dismiss buttons | 44 × 44px | — |
| Minimum spacing between targets | 8px | Prevents accidental activation |

### 10.2 Pointer Gestures

All multi-point and path-based gestures must have single-pointer alternatives:

| Gesture | Alternative |
|---------|-------------|
| Pinch-to-zoom (canvas/timeline) | `+`/`-` buttons; scroll wheel zoom |
| Two-finger pan (canvas) | Scroll bars; keyboard arrow pan; grab-and-drag with mouse |
| Multi-touch node selection | Shift+click / Ctrl+click for multi-select |

### 10.3 Pointer Cancellation (WCAG 2.5.2)

- Drag operations: `Escape` cancels and reverts.
- Click actions: Activate on `pointerup`, not `pointerdown`, allowing drag-away to cancel.
- Long-press menus: Menu appears on press, action activates on release on menu item.

---

## 11. Testing Checklist

### 11.1 Automated Testing

Run on every PR / CI build:

| Tool | Coverage |
|------|----------|
| axe-core (via @axe-core/react or jest-axe) | DOM-level WCAG violations |
| eslint-plugin-jsx-a11y | JSX accessibility lint rules |
| Lighthouse Accessibility audit | Page-level scoring (target ≥ 90) |
| Pa11y CI | Automated page crawl testing |

### 11.2 Manual Testing Protocol

Perform before each release:

| Test | Method | Pass Criteria |
|------|--------|---------------|
| Keyboard-only navigation | Unplug mouse; navigate all screens | All features accessible; no traps; visible focus at all times |
| Screen reader (NVDA + Chrome) | Navigate all flows | All content announced; dynamic updates heard; ARIA roles correct |
| Screen reader (VoiceOver + Safari) | Navigate all flows | Same as above |
| Zoom 200% | Browser zoom to 200% | No content clipped; no horizontal scroll; layout reflows |
| Zoom 400% | Browser zoom to 400% | Critical content accessible (WCAG 1.4.10) |
| Reduced motion | Enable OS reduced motion preference | No animations; all transitions instant; no information loss |
| High contrast mode | Windows High Contrast / forced-colors | UI remains usable; focus rings visible; borders maintained |
| Color blindness simulation | Use Sim Daltonism or similar | All status/state info conveyed without color reliance |
| Touch-only (tablet) | Use touch device or Chrome DevTools device mode | All touch targets ≥ 44px; all gestures have alternatives |

### 11.3 User Testing

Include participants with disabilities in usability testing (TASK-178):
- Minimum 2 of 5-10 test users should use assistive technology
- Test scenarios: Create workflow, run workflow, debug with timeline, onboarding completion
- Document barriers, workarounds, and fix recommendations

### 11.4 Regression Prevention

- Add accessibility unit tests for every new component (axe-core integration test).
- Add keyboard navigation integration tests for critical flows (Playwright + keyboard-only).
- Include ARIA snapshot tests for complex widgets (canvas, timeline).
- Lighthouse accessibility score must not decrease between releases.

---

## Appendix A: WCAG 2.1 AA Success Criteria Mapping

| Criterion | Description | Primary Implementation |
|-----------|-------------|----------------------|
| 1.1.1 | Non-text Content | `alt` on images; `aria-label` on icon buttons |
| 1.3.1 | Info and Relationships | Semantic HTML; ARIA landmarks; heading hierarchy |
| 1.3.2 | Meaningful Sequence | DOM order matches visual order |
| 1.3.3 | Sensory Characteristics | No "click the red button" instructions |
| 1.3.4 | Orientation | No fixed orientation lock |
| 1.3.5 | Identify Input Purpose | `autocomplete` attributes on form fields |
| 1.4.1 | Use of Color | Color + text/icon for all status indicators |
| 1.4.2 | Audio Control | No auto-playing audio |
| 1.4.3 | Contrast (Minimum) | 4.5:1 text; 3:1 large text |
| 1.4.4 | Resize Text | Reflow at 200% zoom |
| 1.4.5 | Images of Text | No images of text (all text rendered as DOM text) |
| 1.4.10 | Reflow | No horizontal scroll at 320px CSS width |
| 1.4.11 | Non-text Contrast | 3:1 for UI components and graphical objects |
| 1.4.12 | Text Spacing | Content readable with user-overridden spacing |
| 1.4.13 | Content on Hover/Focus | Tooltips dismissible (Esc), hoverable, persistent |
| 2.1.1 | Keyboard | All functionality available via keyboard |
| 2.1.2 | No Keyboard Trap | Escape always available; focus never trapped unexpectedly |
| 2.1.4 | Character Key Shortcuts | Single-key shortcuts suppressible / remappable |
| 2.4.1 | Bypass Blocks | Skip links on every page |
| 2.4.2 | Page Titled | `<title>` reflects current page: "Dashboard — Crewspace" |
| 2.4.3 | Focus Order | Tab order matches visual layout |
| 2.4.4 | Link Purpose | Link text descriptive in context |
| 2.4.5 | Multiple Ways | Nav + search + command palette |
| 2.4.6 | Headings and Labels | All headings/labels descriptive |
| 2.4.7 | Focus Visible | 2px violet outline on all focusable elements |
| 2.5.1 | Pointer Gestures | Single-pointer alternatives for all multi-touch gestures |
| 2.5.2 | Pointer Cancellation | Up-event activation; Escape cancels drag |
| 2.5.3 | Label in Name | Visible label matches accessible name |
| 2.5.4 | Motion Actuation | No motion-only inputs |
| 3.1.1 | Language of Page | `lang="en"` on `<html>` |
| 3.1.2 | Language of Parts | `lang` attribute on content in other languages |
| 3.2.1 | On Focus | No context change on focus alone |
| 3.2.2 | On Input | No unexpected context change on input |
| 3.2.3 | Consistent Navigation | Same nav position/order across pages |
| 3.2.4 | Consistent Identification | Same function = same label across pages |
| 3.3.1 | Error Identification | Errors identified with text, not color alone |
| 3.3.2 | Labels or Instructions | All inputs labeled; help text where needed |
| 3.3.3 | Error Suggestion | Suggest corrections for known input errors |
| 3.3.4 | Error Prevention | Confirm destructive actions (delete workflow/node) |
| 4.1.1 | Parsing | Valid HTML; no duplicate IDs |
| 4.1.2 | Name, Role, Value | All custom widgets have ARIA name + role + state |
| 4.1.3 | Status Messages | Live regions for dynamic status updates |

---

## Appendix B: Accessibility Settings (User Preferences)

Expose these settings under Settings → Accessibility:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Reduced motion | Toggle | Follows OS | Override OS preference for reduced motion |
| Screen reader verbosity | Select | Concise | "Concise" or "Verbose" announcement level |
| Keyboard shortcut display | Toggle | On | Show shortcut hints in tooltips and menus |
| High contrast focus rings | Toggle | Off | Use 3px solid white focus ring instead of violet |
| Auto-expand log entries | Toggle | On | Auto-expand selected log entry in timeline |
| Animation speed | Select | Normal | "Normal", "Slow", "None" |
| Canvas keyboard step size | Number | 10px | Pixels moved per arrow key press |
| Confirmation dialogs | Toggle | On | Show confirmation before destructive actions |

---

*Document version: 1.0 — Created for TASK-171, Epic 22*  
*Blocks: TASK-174 (Implement accessibility)*  
*Target compliance: WCAG 2.1 Level AA*
