# Debugging Timeline — Interaction Specification

> **TASK-142** · P1 · UX/UI · Phase 2 (Epic 18: Debugging Timeline UI)  
> Complete interaction specification for click, zoom, filter, and search interactions on the Crewspace debugging timeline, including visual feedback, timing, keyboard support, and accessibility.

---

## 1. Overview

The debugging timeline is a horizontal, lane-based visualization of a workflow run. Users interact with it to understand agent execution, pinpoint errors, and replay events. This document specifies every interaction in detail across five areas:

| # | Interaction Area | Primary Actions |
|---|-----------------|-----------------|
| 1 | **Click & Select** | Click events, expand details, set cursor, multi-select |
| 2 | **Zoom** | Scroll zoom, pinch, toolbar buttons, presets, keyboard |
| 3 | **Pan & Scroll** | Click-drag pan, shift-scroll, scrollbar, touch gestures |
| 4 | **Filter** | Agent filter, event type chips, log level, time range |
| 5 | **Search** | Free text search, match navigation, highlight, clear |

All interactions follow a **consistent feedback model**: hover preview → action → visual confirmation → state update.

---

## 2. Timeline Layout Reference

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Back to Canvas  │  Workflow Name  │  Run #42  │ [Export] [Re-run] │
├─────────────────────┬────────────────────────────────────────────────┤
│  FILTERS BAR        │                                                │
│  [Agent ▾] [● LLM ● Tool ● Task ● Error] [Level ▾] [🔍 Search...] │
├─────────────────────┴────────────────────────────────────────────────┤
│  AGENT LABELS  │              TIMELINE CHART VIEWPORT                │
│  ┌───────────┐ │  ╔═══════════════════════════════════════════════╗  │
│  │ researcher│ │  ║  ●──────●    ●───●         ●                 ║  │
│  │ writer    │ │  ║       ●──────────●                            ║  │
│  │ reviewer  │ │  ║                        ●───────●    ●        ║  │
│  └───────────┘ │  ╚═══════════════════════════════════════════════╝  │
│                │  0s        5s       10s       15s       20s         │
│  ZOOM CONTROLS │  [Fit All] [Fit Selection] [1:1] [+] [−]          │
├──────────────────────────────────────────────────────────────────────┤
│  LOG VIEWER (resizable split)                                        │
│  10:23:01.234  ● [researcher]  ▶ Task started                       │
│  10:23:01.500  ● [researcher]  🤖 LLM Call → gpt-4o                 │
│  10:23:03.120  ● [researcher]  🔧 Tool: search("AI trends...")      │
│  10:23:04.890  ● [researcher]  ✓ Task completed                     │
├──────────────────────────────────────────────────────────────────────┤
│  ◀◀  ◀  ▶  ▶  ▶▶    Speed: [1x ▾]    12.3s / 20.0s               │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Click & Select Interactions

### 3.1 Event Marker — Hover

| Step | Trigger | Visual Feedback | Timing |
|------|---------|----------------|--------|
| Mouse enters marker | `pointerenter` on marker (hit area ≥ 24×24px) | Marker scales `1.0 → 1.3`, gains outer glow in event-type color at 40% opacity. Cursor → `pointer` | 100ms ease-out |
| Tooltip appears | 200ms after hover begins | Floating tooltip (max 280px) positioned above marker. Contains: timestamp, event type, message preview (100 chars), "Click for details" | 200ms fade-in |
| Mouse exits marker | `pointerleave` | Marker returns to `1.0` scale, glow fades, tooltip dismissed | 100ms ease-out, tooltip 100ms fade-out |

**Tooltip specification:**

| Property | Value |
|----------|-------|
| Background | `var(--cs-surface-elevated)` — `#1e293b` (dark) / `#ffffff` (light) |
| Border | 1px solid `var(--cs-border-subtle)` |
| Border radius | 8px |
| Shadow | `0 4px 16px rgba(0,0,0,0.3)` |
| Padding | 8px 12px |
| Font | 13px / 1.4 `var(--cs-font-mono)` for timestamp, `var(--cs-font-sans)` for message |
| Arrow | 6px CSS triangle pointing down toward marker |
| Z-index | `var(--cs-z-tooltip)` — 1000 |
| Positioning | Above marker, centered horizontally; flip below if near top edge |

### 3.2 Event Marker — Click

| Step | Trigger | Visual Feedback | Timing |
|------|---------|----------------|--------|
| Click event marker | `pointerup` on marker | Marker gains solid selection ring (2px, event-type color). Previously selected marker loses ring. | Instant |
| Timeline cursor jumps | Playback cursor line moves to marker's timestamp | Cursor line animates to new position with spring easing | 200ms spring(1, 100, 12) |
| Log viewer scrolls | Log viewer scrolls to corresponding entry | Smooth scroll to entry, entry flashes highlight background (`var(--cs-highlight)` at 20% → 0%) | Scroll: 300ms, flash: 600ms |
| Log entry auto-expands | The corresponding log entry expands to show full details | Expand animation (height auto, 250ms ease-out). Other expanded entries collapse if single-expand mode is on | 250ms |
| Agent lane highlight | The lane containing the clicked marker briefly brightens | Lane background pulses from 0% → 8% → 0% of agent lane color | 400ms |

**Selection state persistence:**
- Selected marker maintains its ring until another marker is clicked or selection is cleared
- Selected marker ID stored in URL query param: `?event=evt_abc123`
- `Escape` clears current selection (marker ring removed, log entry collapsed)

### 3.3 Duration Bar — Hover & Click

Duration bars represent task execution spans (start → end).

| Interaction | Visual Feedback | Timing |
|-------------|----------------|--------|
| Hover duration bar | Bar brightens (opacity `0.6 → 0.9`), duration label appears centered above bar: "3.2s" | 100ms ease-out, label 150ms fade-in |
| Click duration bar | Bar gains selection outline (2px solid, agent color). Log viewer filters to events within bar's time range. Playback cursor jumps to bar start | 200ms |
| Double-click duration bar | Zoom-to-fit the bar's time range with 10% padding on each side | 400ms ease-in-out |

### 3.4 Empty Timeline Area — Click

| Interaction | Visual Feedback | Timing |
|-------------|----------------|--------|
| Click empty area | Playback cursor line moves to clicked timestamp. Any selected marker is deselected | 150ms ease-out |
| Click + vertical position | No lane selection — cursor only moves horizontally (time axis) | — |

### 3.5 Agent Lane Label — Click

| Interaction | Visual Feedback | Timing |
|-------------|----------------|--------|
| Hover lane label | Label text brightens, background → `var(--cs-surface-hover)` | 100ms |
| Click lane label | **Solo mode**: Only this agent's lane is visible; all others collapse. Badge shows "Solo: [agent name]" in filters bar. Click again or press `Escape` to un-solo | Lane collapse: 250ms ease-in-out, other lanes slide up |
| Double-click lane label | Zoom to fit this agent's lane content (all events visible horizontally) | 400ms ease-in-out |

### 3.6 Multi-Select Events

| Interaction | Trigger | Behavior |
|-------------|---------|----------|
| Ctrl/Cmd + Click marker | Modifier key held during click | Add marker to selection (multiple rings visible simultaneously). Log viewer highlights all selected entries |
| Shift + Click marker | Shift held during click | Range select: select all events between last-selected and shift-clicked event (by timestamp). Log viewer highlights the range |
| Click + Drag on timeline | `pointerdown` on empty area + drag ≥ 4px | Time range selection brush: semi-transparent rectangle (violet, 15% opacity) appears. On release, all events within the brushed time range are selected |
| Range selection indicator | — | Brushed area persists as highlighted overlay; active filters show "Time: 3.2s – 7.8s ×" pill. `Escape` clears |

---

## 4. Zoom Interactions

### 4.1 Scroll Wheel Zoom

| Step | Trigger | Visual Feedback | Timing |
|------|---------|----------------|--------|
| Scroll up (zoom in) | `wheel` event, `deltaY < 0`, cursor over timeline | Timeline expands around cursor position (focal zoom). Time axis labels update. Events spread apart | Per frame (60fps), debounced at 16ms |
| Scroll down (zoom out) | `wheel` event, `deltaY > 0` | Timeline contracts around cursor position. Events compact | Same |
| Zoom limits reached | Zoom hits min (entire run visible) or max (100ms per 100px) | Subtle rubber-band effect: timeline bounces 2px past limit and springs back. Zoom indicator flashes at limit value | Bounce: 150ms spring |

**Zoom configuration:**

| Property | Value |
|----------|-------|
| Zoom factor per scroll tick | `1.15×` (zoom in) / `0.87×` (zoom out) |
| Minimum zoom | Entire run duration fits within viewport width (auto-calculated) |
| Maximum zoom | 100ms per 100px viewport width (individual event granularity) |
| Focal point | Cursor X position on timeline (zoom anchored to time under cursor) |
| Animation | None — zoom is applied directly per frame for responsive feel |
| Scroll debounce | 16ms (aligned to requestAnimationFrame) |

### 4.2 Pinch-to-Zoom (Trackpad / Touch)

| Step | Trigger | Visual Feedback | Timing |
|------|---------|----------------|--------|
| Pinch out (zoom in) | `wheel` event with `ctrlKey: true` (trackpad) or `touchmove` with 2 fingers spreading | Same as scroll zoom, focal point at midpoint between fingers | Per frame |
| Pinch in (zoom out) | Opposite gesture | Same as scroll zoom out | Per frame |
| Touch: two-finger pan | Two fingers moving in same direction | Horizontal pan (no zoom) | Per frame |

### 4.3 Toolbar Zoom Buttons

Zoom control bar positioned below the timeline chart.

| Button | Icon | Action | Keyboard Shortcut |
|--------|------|--------|-------------------|
| **Zoom In** | `+` (plus) | Zoom in by `1.5×` centered on viewport midpoint | `Ctrl/Cmd + =` |
| **Zoom Out** | `−` (minus) | Zoom out by `0.67×` centered on viewport midpoint | `Ctrl/Cmd + -` |
| **Fit All** | ↔ (expand) | Zoom to show entire run with 5% padding | `Ctrl/Cmd + 0` |
| **Fit Selection** | ⊡ (frame) | Zoom to show selected time range or selected events with 10% padding. Disabled if no selection | `Ctrl/Cmd + Shift + 0` |
| **1:1** | 1:1 text | Reset to default zoom (1s per 100px) | `Ctrl/Cmd + 1` |

**Button states:**

| State | Visual |
|-------|--------|
| Idle | Icon in `var(--cs-text-secondary)`, transparent background |
| Hover | Background → `var(--cs-surface-hover)`, tooltip with label + shortcut (200ms delay) |
| Active / Pressed | Background → `var(--cs-violet-500)` at 20%, icon brightens |
| Disabled | Icon at 30% opacity, cursor → `default`, no hover effect |
| At zoom limit | Respective button (+ or −) enters disabled state |

**Zoom transition (toolbar buttons):**

| Property | Value |
|----------|-------|
| Duration | 300ms |
| Easing | `ease-in-out` (CSS) / `cubicBezier(0.4, 0, 0.2, 1)` |
| Focal point | Viewport horizontal center |
| Time axis labels | Crossfade between old and new labels (150ms) |

### 4.4 Zoom Level Indicator

A non-interactive indicator showing the current zoom level, displayed in the bottom-right of the timeline chart area.

| Property | Value |
|----------|-------|
| Format | "2.0×" or "100ms/px" depending on user preference |
| Font | 11px `var(--cs-font-mono)`, `var(--cs-text-tertiary)` |
| Background | `var(--cs-surface)` at 80% opacity with backdrop blur |
| Visibility | Appears during zoom changes, fades after 1.5s of inactivity |
| Fade timing | 200ms fade-in on zoom, 300ms fade-out after idle |

---

## 5. Pan & Scroll Interactions

### 5.1 Click-and-Drag Pan

| Step | Trigger | Visual Feedback | Timing |
|------|---------|----------------|--------|
| Hover empty timeline area | Mouse over non-interactive timeline area | Cursor → `grab` | Instant |
| Press + drag | `pointerdown` + move ≥ 4px on empty area | Cursor → `grabbing`. Timeline viewport translates with pointer movement (1:1 mapping). Time axis labels and agent lane labels scroll with viewport | Per frame (60fps) |
| Release | `pointerup` | Cursor → `grab`. Momentum: viewport continues scrolling in drag direction with deceleration (friction `0.95` per frame, stops when velocity < 0.5px/frame) | Momentum: variable, 200–800ms |
| Edge indicator | Pan reaches start or end of run | Overscroll glow: subtle gradient fade (`var(--cs-violet-500)` at 10%) appears at the edge. Viewport bounces 8px past edge and springs back | Bounce: 200ms spring |

### 5.2 Shift + Scroll (Horizontal Pan)

| Trigger | Behavior |
|---------|----------|
| `Shift` + scroll wheel | Horizontal pan. `deltaY` mapped to horizontal movement (1:1 pixel ratio) |
| Horizontal scroll (mouse) | `deltaX` on mice with horizontal scroll directly pans |

### 5.3 Scrollbar

A thin horizontal scrollbar appears below the time axis:

| Property | Value |
|----------|-------|
| Height | 6px (idle), 10px (hover/active) |
| Track | `var(--cs-surface-muted)` at 30% opacity |
| Thumb | `var(--cs-text-tertiary)` at 50% opacity (idle), 80% (hover), 100% (active) |
| Border radius | 3px (idle), 5px (expanded) |
| Show/hide | Visible on hover over timeline or during active scroll. Fades after 1.5s of inactivity |
| Interaction | Click-and-drag thumb to pan. Click track to jump to position (300ms ease-out) |

### 5.4 Minimap Navigation

If the timeline has a minimap (top-right corner, 180×60px):

| Interaction | Behavior |
|-------------|----------|
| Viewport indicator | Semi-transparent rectangle on minimap shows current viewport bounds |
| Click minimap | Viewport jumps to center on clicked position (300ms ease-out) |
| Drag minimap viewport | Pan the main timeline viewport in real time |
| Hover minimap | Minimap expands slightly (scale `1.0 → 1.05`, 150ms). Viewport indicator border brightens |

---

## 6. Filter Interactions

### 6.1 Agent Filter (Multi-Select Dropdown)

**Trigger:** Click the "Agent ▾" dropdown button in the filters bar.

| Step | Visual Feedback | Timing |
|------|----------------|--------|
| Click button | Dropdown menu opens below button. Button enters active state (violet border, violet caret) | 150ms slide-down + fade-in |
| Dropdown content | List of all agents in the run, each with: colored dot (agent lane color), agent name, event count badge. "Select All" / "Deselect All" at top | — |
| Hover menu item | Item background → `var(--cs-surface-hover)` | Instant |
| Click item checkbox | Checkbox toggles. Corresponding agent lane immediately shows/hides on timeline with animation | Lane collapse/expand: 250ms ease-in-out |
| Multiple selections | Each toggle applies independently. Active count shown on button: "Agent (2/5)" | — |
| Click outside dropdown | Dropdown closes | 100ms fade-out |
| "Select All" | All checkboxes checked, all lanes visible | Batch: 250ms |
| "Deselect All" | All checkboxes unchecked, timeline shows empty state: "No agents selected" message | Batch: 250ms |

**Hidden lane behavior:**

- Hidden lanes collapse vertically — remaining lanes move up to fill space (250ms ease-in-out)
- Log viewer filters to only show events from visible agents
- Timeline maintains horizontal zoom/position during filter changes
- Active agent filter shown as removable pill in filters bar: "Agent: researcher ×"

### 6.2 Event Type Filter (Chips / Toggle Buttons)

Displayed as a row of color-coded chip buttons in the filters bar.

| Chip | Color | Icon | Default |
|------|-------|------|---------|
| LLM Calls | Amber (`#f59e0b`) | 🤖 | Active |
| Tool Use | Emerald (`#10b981`) | 🔧 | Active |
| Task Start/End | Sky (`#0ea5e9`) | ▶ | Active |
| Errors | Rose (`#f43f5e`) | ❌ | Active |
| Custom Events | Slate (`#64748b`) | ◆ | Active |

| Interaction | Visual Feedback | Timing |
|-------------|----------------|--------|
| Hover chip (active) | Background brightens 10% | Instant |
| Click chip (deactivate) | Chip dims: background → transparent, text + icon at 40% opacity, strikethrough line on label. Events of that type on timeline fade to 15% opacity | Chip: instant. Timeline events: 200ms opacity transition |
| Click chip (reactivate) | Chip restores full color. Events of that type return to full opacity | Same |
| Hover chip (inactive) | Background brightens slightly (10% of chip color) | Instant |
| Active filter indicator | Deactivated chips are visually distinct; no separate pill needed (the chip itself shows state) | — |

**Filter cascading:** Event type filter and agent filter combine with AND logic. If agent "researcher" is visible and "LLM Calls" is deactivated, researcher's LLM call markers fade but tool use and task markers remain.

### 6.3 Log Level Filter (Dropdown)

**Trigger:** Click "Level ▾" dropdown.

| Option | Includes | Icon |
|--------|----------|------|
| All Levels (default) | debug + info + warn + error | — |
| Debug | debug + info + warn + error | 🔍 |
| Info | info + warn + error | ℹ️ |
| Warning | warn + error | ⚠️ |
| Error only | error | ❌ |

| Interaction | Visual Feedback | Timing |
|-------------|----------------|--------|
| Click option | Radio selection (one at a time). Dropdown closes. Timeline and log viewer filter to matching levels. Events below threshold fade to 10% opacity on timeline; hidden in log viewer | Dropdown close: 100ms. Filter: 200ms |
| Active level indicator | Dropdown button label updates to show selected level: "Level: Warning ▾" | Instant |
| Filter pill | "Level: Warning ×" pill appears in active filters area | Instant |

### 6.4 Time Range Filter

Two mechanisms for filtering by time range:

#### 6.4a Brush Selection on Timeline

| Step | Trigger | Visual Feedback | Timing |
|------|---------|----------------|--------|
| Click + drag on timeline | `pointerdown` on empty area + horizontal drag ≥ 8px | Semi-transparent overlay (violet, 12% opacity) with solid edges (1px violet) appears over selected range. Start/end time labels shown at overlay edges | Per frame |
| Release | `pointerup` | Overlay persists. Events outside range fade to 15% opacity on timeline. Log viewer filters to events within range. Filter pill: "Time: 3.2s – 7.8s ×" | 200ms transition |
| Drag overlay edges | Hover overlay left/right edge → cursor `col-resize`. Drag to adjust range | Per frame, snaps to nearest event if within 8px |
| Double-click overlay | Removes time range filter, restores all events | 200ms |

#### 6.4b Start/End Time Inputs

Expandable input fields in the filters bar (hidden by default, toggle via "Time ▾" button).

| Step | Behavior |
|------|----------|
| Click "Time ▾" | Two input fields appear: "From: [0.0s]" and "To: [20.0s]" with current run range as placeholder |
| Type value | Input validates as number (decimal seconds). Red border if invalid (non-numeric, out of range) |
| Press Enter or blur | Filter applies. Timeline and log viewer update. Overlay appears on timeline at the specified range |
| Clear inputs | Removes time range filter |

### 6.5 Active Filters Bar

A secondary row below the main filters bar showing all active (non-default) filters as removable pills.

```
Active: [Agent: researcher ×] [Level: Warning ×] [Time: 3.2s – 7.8s ×]  [Clear All Filters]
```

| Interaction | Behavior | Timing |
|-------------|----------|--------|
| Click × on pill | Remove that filter, restore default for that dimension | 200ms |
| Click "Clear All Filters" | Remove all active filters, restore defaults | 250ms |
| No active filters | Active filters bar is hidden (0 height, no space taken) | 150ms collapse |

**URL state:** All active filters are encoded in URL query params for shareability:
```
/canvas/wf_abc/debug/run_xyz?agents=researcher,writer&types=llm,error&level=warn&from=3.2&to=7.8&q=timeout
```

---

## 7. Search Interactions

### 7.1 Search Input

Located in the filters bar as a text input with a search icon.

| Step | Trigger | Visual Feedback | Timing |
|------|---------|----------------|--------|
| Focus search input | Click input or press `Ctrl/Cmd + F` | Input border → violet. Placeholder text: "Search events, agents, messages..." | Instant |
| Type query | `input` event, debounced | Search executes after 300ms of no typing. Searches: event messages, agent names, tool names, log content (case-insensitive) | 300ms debounce |
| Results found | Match count > 0 | Result count badge: "12 matches". Matching events on timeline gain highlight ring (yellow/gold, 3px, pulsing once). Log viewer filters to matching entries. Non-matching events dim to 20% opacity on timeline | Badge: instant. Timeline highlights: 200ms. Pulse: 400ms |
| No results | Match count = 0 | "No matches" text in muted color. Input border → amber (warning, not error). Timeline unchanged (no dimming) | Instant |
| Clear search | Click × button in input, or press `Escape` while input focused | All highlights and dimming removed. Input clears. Full timeline and log viewer restored | 200ms |

### 7.2 Match Navigation

When search has results, navigation controls appear to the right of the input.

```
[🔍 Search: "timeout"  ×]  [3 / 12]  [↑] [↓]
```

| Control | Action | Keyboard Shortcut |
|---------|--------|-------------------|
| ↑ (Previous match) | Navigate to previous matching event. Timeline scrolls/pans to show it. Log viewer scrolls to it. Current match highlighted with brighter ring | `Shift + Enter` or `F3 + Shift` |
| ↓ (Next match) | Navigate to next matching event | `Enter` or `F3` |
| Match counter | Shows "N / M" (current match index / total matches). Updates as user navigates | — |

**Current match highlight (differentiated from other matches):**

| Property | Regular Match | Current (Active) Match |
|----------|--------------|----------------------|
| Ring color | `var(--cs-amber-400)` at 50% | `var(--cs-amber-400)` at 100% |
| Ring width | 2px | 3px |
| Glow | None | `0 0 8px var(--cs-amber-400)` at 50% |
| Log entry | Row background: `var(--cs-amber-50)` at 10% | Row background: `var(--cs-amber-50)` at 25%, left border: 3px solid `var(--cs-amber-400)` |

### 7.3 Search Scope

| Searchable Field | Examples |
|-----------------|----------|
| Event message text | "Task completed", "search results" |
| Agent name | "researcher", "writer" |
| Tool name | "search", "file_read" |
| LLM model name | "gpt-4o", "claude-3" |
| Error messages | "timeout", "rate limit" |
| Log content (expanded) | Full prompt/response text, tool input/output |

Search does **not** match: timestamps (use time range filter), event type names (use type filter chips), log levels (use level filter).

---

## 8. Playback Interaction Details

### 8.1 Playback Controls Bar

Positioned at the bottom of the debug timeline page.

| Control | Icon/Label | Click Behavior | Keyboard |
|---------|-----------|---------------|----------|
| Jump to Start | `◀◀` | Cursor → 0s, log viewer scrolls to top | `Home` |
| Step Back | `◀` | Cursor → previous event timestamp. That event is selected and expanded in log viewer | `←` (left arrow) |
| Play / Pause | `▶` / `⏸` | Toggle playback. During play, cursor advances through timeline at selected speed | `Space` |
| Step Forward | `▶` | Cursor → next event timestamp | `→` (right arrow) |
| Jump to End | `▶▶` | Cursor → last event timestamp | `End` |
| Speed | `[1x ▾]` | Dropdown: 0.5×, 1×, 2×, 4×, 8× | `[` decrease, `]` increase |

**Button states:**

| State | Visual |
|-------|--------|
| Idle | Icon in `var(--cs-text-secondary)`, transparent background, 36×36px hit area |
| Hover | Background → `var(--cs-surface-hover)`, tooltip with label + shortcut |
| Active (playing) | Play button → pause icon, violet background at 15%. Active pulsing dot indicator |
| Disabled | At start: step-back and jump-start disabled (30% opacity). At end: step-forward and jump-end disabled |
| Pressed | Scale `0.95` for 100ms, then release |

### 8.2 Playback Cursor

The playback cursor is a vertical line that spans the full height of the timeline chart.

| Property | Value |
|----------|-------|
| Width | 2px |
| Color | `var(--cs-violet-500)` |
| Head | Small triangle (8px wide) at top, filled `var(--cs-violet-500)` |
| Glow | During playback: `0 0 6px var(--cs-violet-400)` at 40% |
| Time label | Floating label at top of cursor: "12.3s" in `var(--cs-font-mono)` 11px |
| Draggable | User can click and drag the cursor head to scrub through timeline |
| Snap | During step-through, snaps to event timestamps. During scrub, free-form positioning |

### 8.3 Cursor Scrub (Timeline Scrubbing)

| Step | Trigger | Behavior | Timing |
|------|---------|----------|--------|
| Hover cursor head | Mouse over triangle head | Cursor head grows slightly (scale 1.2). Cursor → `col-resize` | 100ms |
| Drag cursor | `pointerdown` on cursor head + drag | Cursor follows pointer horizontally. Time label updates in real time. Log viewer scrolls to nearest event. Playback pauses if active | Per frame |
| Release | `pointerup` | Cursor stays at dropped position. If nearest event < 20px away, snap to it | 100ms snap |

### 8.4 Progress Bar

Below the playback controls, a thin progress bar shows overall position.

| Property | Value |
|----------|-------|
| Height | 4px |
| Track | `var(--cs-surface-muted)` |
| Fill | `var(--cs-violet-500)` — fills from left proportional to cursor position / run duration |
| Clickable | Yes — click to jump cursor to that proportional position |
| Time display | "12.3s / 20.0s" text to the right of progress bar |

---

## 9. Log Viewer — Timeline Synchronization

The log viewer and timeline chart are deeply linked. Interactions in one area are reflected in the other.

### 9.1 Timeline → Log Viewer

| Timeline Action | Log Viewer Reaction |
|----------------|-------------------|
| Click event marker | Scroll to event entry, expand it, highlight briefly (flash) |
| Brush time range | Filter entries to those within range |
| Playback cursor moves | Auto-scroll to nearest event (can be toggled off with "Lock scroll" button) |
| Zoom/pan | No direct effect (log viewer shows all events in current filter set) |
| Filter change | Log entries filter to match timeline visibility |

### 9.2 Log Viewer → Timeline

| Log Viewer Action | Timeline Reaction |
|------------------|------------------|
| Click log entry | Corresponding timeline marker gains selection ring. Timeline pans to show marker if it's off-screen | 
| Hover log entry | Corresponding timeline marker gains hover glow (subtle, 30% opacity ring) |
| Expand log entry | No timeline effect (detail view is log-viewer-only) |
| Scroll log viewer | If "Follow cursor" is enabled, playback cursor tracks the currently visible top entry |

### 9.3 Split Resize

The divider between timeline chart and log viewer is draggable.

| Interaction | Behavior | Timing |
|-------------|----------|--------|
| Hover divider | Divider line highlights (1px → 3px, violet). Cursor → `row-resize` | 100ms |
| Drag divider | Timeline and log viewer resize proportionally. Minimum heights enforced (120px each) | Per frame |
| Double-click divider | Reset to 50/50 split | 300ms ease-out |
| Collapse log viewer | Drag divider to bottom: log viewer collapses to 32px header with "Show Log Viewer" button | 250ms |
| Collapse timeline | Drag divider to top: timeline collapses to 32px header with "Show Timeline" button | 250ms |

---

## 10. Keyboard Shortcuts Summary

| Category | Shortcut | Action |
|----------|----------|--------|
| **Zoom** | `Ctrl/Cmd + =` | Zoom in |
| | `Ctrl/Cmd + -` | Zoom out |
| | `Ctrl/Cmd + 0` | Fit all (zoom to show entire run) |
| | `Ctrl/Cmd + 1` | Reset zoom (1:1) |
| | `Ctrl/Cmd + Shift + 0` | Fit selection |
| **Playback** | `Space` | Play / Pause |
| | `←` | Step back to previous event |
| | `→` | Step forward to next event |
| | `Home` | Jump to start |
| | `End` | Jump to end |
| | `[` | Decrease playback speed |
| | `]` | Increase playback speed |
| **Search** | `Ctrl/Cmd + F` | Focus search input |
| | `Enter` / `F3` | Next match |
| | `Shift + Enter` / `Shift + F3` | Previous match |
| | `Escape` | Clear search (if search focused) or clear selection (if not) |
| **Selection** | `Escape` | Clear selection / Close expanded entry |
| | `Ctrl/Cmd + A` | Select all visible events |
| **Navigation** | `Ctrl/Cmd + Shift + D` | Toggle debug timeline (from canvas) |
| | `Ctrl/Cmd + L` | Focus log viewer |
| | `Ctrl/Cmd + T` | Focus timeline chart |

---

## 11. Touch & Mobile Interactions

### 11.1 Touch Gestures (Tablet)

| Gesture | Action |
|---------|--------|
| Tap event marker | Same as click — select, scroll log viewer |
| Long-press event marker (300ms) | Show tooltip (no hover on touch). Tooltip dismisses on tap elsewhere |
| Single-finger drag on timeline | Pan (horizontal scroll) |
| Two-finger pinch | Zoom in/out (focal point at pinch center) |
| Two-finger drag | Pan (same as single-finger) |
| Swipe up/down on log viewer | Scroll log entries |

### 11.2 Mobile (< 768px)

On mobile screens, the debug timeline adapts to a simplified layout:

| Adaptation | Description |
|------------|-------------|
| Timeline hidden by default | Only log viewer is shown. "Show Timeline" expandable section at top |
| Simplified timeline | When expanded, agent lanes are stacked vertically (one at a time). Horizontal swipe to change agent |
| Playback controls | Simplified to: `◀ ▶/⏸ ▶` only. Speed fixed at 1× |
| Filters | Collapsed into a single "Filters" button that opens a bottom sheet |
| Search | Full-width search bar, replaces header on focus |

---

## 12. Accessibility Requirements

### 12.1 Keyboard Navigation

| Element | Keyboard Behavior |
|---------|------------------|
| Timeline chart | `Tab` focuses the timeline as a single composite widget. Arrow keys navigate between events (left/right for time, up/down for lanes) |
| Event markers | Focused marker: visible focus ring (2px violet, offset 2px). `Enter` to select. `Space` to toggle expand in log viewer |
| Filter dropdowns | Standard dropdown keyboard: `Enter/Space` to open, `↑/↓` to navigate, `Enter` to select, `Escape` to close |
| Event type chips | `Tab` moves between chips. `Enter/Space` toggles chip active state |
| Playback controls | `Tab` moves between buttons. `Enter/Space` activates. Buttons announce their label and state |
| Log entries | `Tab` into log viewer, `↑/↓` to navigate entries, `Enter/Space` to expand/collapse |
| Search input | `Tab` to focus. Standard text input behavior. `Enter` for next match |

### 12.2 ARIA Attributes

| Element | ARIA Implementation |
|---------|-------------------|
| Timeline chart container | `role="application"`, `aria-label="Debugging timeline chart for run #42"`, `aria-roledescription="timeline"` |
| Agent lane | `role="row"`, `aria-label="Agent: researcher — 12 events"` |
| Event marker | `role="button"`, `aria-label="LLM call to gpt-4o at 1.5 seconds, click for details"`, `aria-pressed="true/false"` for selected state |
| Duration bar | `role="meter"`, `aria-label="Task execution: researcher from 0s to 4.8s (4.8 second duration)"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow` |
| Filter dropdown | `role="listbox"`, `aria-multiselectable="true"`, items `role="option"` with `aria-selected` |
| Event type chip | `role="checkbox"`, `aria-checked="true/false"`, `aria-label="Filter: LLM Calls (active)"` |
| Log entry | `role="row"` in `role="table"`, expandable entries: `aria-expanded="true/false"` |
| Playback controls | `role="toolbar"`, `aria-label="Playback controls"`, each button with `aria-label` including state |
| Search input | `role="searchbox"`, `aria-label="Search events"`, associated `role="status"` for match count |
| Progress bar | `role="progressbar"`, `aria-valuenow="12.3"`, `aria-valuemax="20.0"`, `aria-label="Playback position"` |

### 12.3 Live Regions

| Event | ARIA Live Announcement |
|-------|----------------------|
| Search results count change | `aria-live="polite"`: "12 matches found" or "No matches" |
| Filter applied | `aria-live="polite"`: "Filtered to 2 of 5 agents" |
| Playback state change | `aria-live="polite"`: "Playing at 2x speed" / "Paused at 12.3 seconds" |
| Event selected | `aria-live="polite"`: "Selected: LLM call at 1.5 seconds" |
| Error encountered | `aria-live="assertive"`: "Error event: timeout at 15.2 seconds" |

### 12.4 Focus Management

| Scenario | Focus Behavior |
|----------|---------------|
| Open filter dropdown | Focus moves to first item in dropdown |
| Close filter dropdown | Focus returns to dropdown trigger button |
| Search match navigation | Focus remains in search input; screen reader announces current match via live region |
| Expand log entry | Focus moves to expanded content area |
| Collapse log entry | Focus returns to log entry row |
| Modal/overlay (export dialog) | Focus trapped within modal. `Escape` closes, returns focus to trigger |

### 12.5 Reduced Motion

When `prefers-reduced-motion: reduce` is detected:

| Normal Behavior | Reduced Motion Alternative |
|----------------|---------------------------|
| Lane collapse/expand animation (250ms) | Instant show/hide (0ms) |
| Marker hover scale (100ms) | No scale change, outline only |
| Playback cursor spring animation | Instant position jump |
| Tooltip fade-in (200ms) | Instant appear/disappear |
| Log entry expand animation (250ms) | Instant height change |
| Search match pulse animation | Static highlight ring (no pulse) |
| Pan momentum/deceleration | Instant stop on pointer release |
| Zoom transitions (300ms) | Instant zoom level change |

### 12.6 Color & Contrast

| Element | Foreground | Background | Ratio | WCAG Level |
|---------|-----------|------------|-------|------------|
| Event marker (on timeline bg) | Event-type color | `var(--cs-surface)` | ≥ 3:1 | AA (UI component) |
| Selected marker ring | `var(--cs-violet-500)` | Timeline bg | ≥ 3:1 | AA |
| Search match ring | `var(--cs-amber-400)` | Timeline bg | ≥ 3:1 | AA |
| Filter chip text | Chip color / White | Chip background | ≥ 4.5:1 | AA |
| Log entry text | `var(--cs-text-primary)` | `var(--cs-surface)` | ≥ 4.5:1 | AA |
| Disabled button text | `var(--cs-text-tertiary)` | Button bg | ≥ 3:1 | AA (disabled exception) |
| Time axis labels | `var(--cs-text-secondary)` | Timeline bg | ≥ 4.5:1 | AA |

**Note:** Event markers encode information in both color AND shape — they are not color-dependent. Each event type has a unique icon/shape: circle (LLM), diamond (tool), square (task), triangle (error).

---

## 13. Performance Considerations for Interactions

| Scenario | Approach |
|----------|----------|
| 1000+ events on timeline | Canvas-based rendering (HTML5 Canvas or WebGL) for markers. Only interactive hit areas are DOM elements. Quadtree spatial indexing for hit-testing |
| Zoom/pan at 60fps | All zoom/pan transforms use CSS `transform` (GPU-accelerated) or Canvas redraw. No layout thrashing |
| Large log viewer | Virtual scroll (only render visible entries ± 5 buffer). Intersection Observer for expand-on-visible |
| Search across 10k+ events | Web Worker for search computation. UI remains responsive during search. Results streamed incrementally |
| Filter transitions | CSS transitions on opacity/transform. No reflow-triggering property changes during animation |
| Real-time updates (live run) | Batch incoming events every 100ms. Append-only rendering. Timeline auto-extends rightward |

---

## 14. Edge Cases & Error Handling

| Edge Case | Behavior |
|-----------|----------|
| Click event during loading | Show loading spinner overlay on timeline. Clicks queue and replay once data loads |
| Zoom to extreme level | Rubber-band at limits. Min zoom = entire run; max zoom = 100ms/100px |
| Filter produces zero events | Timeline shows: "No events match your filters" centered message. Log viewer shows same. "Clear All Filters" CTA prominent |
| Search with special chars | Regex special characters escaped automatically. Option for "Use regex" toggle (advanced) |
| Very short run (< 1s) | Timeline auto-zooms to millisecond granularity. Time axis shows ms labels |
| Very long run (> 1hr) | Timeline starts at "Fit All" zoom. Time axis shows mm:ss or hh:mm:ss format. Summary markers group dense event clusters |
| Run still in progress | Timeline extends right in real-time. Auto-scroll follows new events (toggleable). New events enter with fade-in animation |
| Network error loading events | Retry banner: "Failed to load events. [Retry]". Cached events remain visible |
| Empty lanes after filter | Collapsed with "0 events" label. Option to auto-hide empty lanes (toggle in preferences) |

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-04-08 | UX/UI Agent | Initial timeline interaction specification (TASK-142) |
