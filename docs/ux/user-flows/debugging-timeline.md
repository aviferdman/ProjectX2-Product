# User Flow: Debugging Timeline

> **TASK-128** · P0 · UX/UI · Phase 2 (Epic 18)  
> User flows for viewing, navigating, and analyzing workflow execution timelines.

---

## 1. Access Debug Timeline

```
[Canvas — after running a workflow]
    │
    ├─── Path A: From run completion toast
    │       ├── Toast: "Workflow completed in Xs"
    │       ├── Click [View Debug Timeline]
    │       └── Navigate to /canvas/:workflowId/debug/:runId
    │
    ├─── Path B: From toolbar
    │       ├── Toolbar → "Runs" dropdown
    │       ├── List of recent runs (timestamp, status, duration)
    │       ├── Click a run → Navigate to debug timeline
    │       └── Most recent run is pre-selected
    │
    ├─── Path C: From dashboard
    │       ├── Workflow card → "Last run" link
    │       └── Navigate to debug timeline for that run
    │
    └─── RESULT: Debug timeline page loaded with full execution data

    PAGE LAYOUT:
    ┌─────────────────────────────────────────────────────┐
    │  ← Back to Canvas  │  Workflow Name  │  Run #42     │
    ├─────────────────────────────────────────────────────┤
    │  [Agent ▾] [Event ▾] [Level ▾] [Time ▾] [🔍 Search]│
    ├─────────────────────────────────────────────────────┤
    │                                                     │
    │  ╔══ Agent 1 ═══╤═══════════╤══════════╗            │
    │  ║  ●──────●    │  ●───●    │   ●      ║            │
    │  ╠══ Agent 2 ═══╪═══════════╪══════════╣            │
    │  ║      ●───────┤─────●     │          ║            │
    │  ╚══════════════╧═══════════╧══════════╝            │
    │  0s        5s        10s       15s      20s         │
    │                                                     │
    ├─────────────────────────────────────────────────────┤
    │  LOG VIEWER                                         │
    │  10:23:01.234  [researcher]  Task started            │
    │  10:23:01.500  [researcher]  LLM call → gpt-4o      │
    │  10:23:03.120  [researcher]  Tool: search("AI...")   │
    │  10:23:04.890  [researcher]  Task completed ✓        │
    ├─────────────────────────────────────────────────────┤
    │  ◀◀  ◀  ▶  ▶  ▶▶    Speed: [1x ▾]    12.3s / 20s  │
    └─────────────────────────────────────────────────────┘
```

---

## 2. Navigate the Timeline Chart

### 2a. Browse Timeline

```
[Debug timeline loaded]
    │
    ├─── Visual structure
    │       ├── Horizontal time axis (0s → total duration)
    │       ├── One lane per agent (labeled on left)
    │       ├── Event markers on each lane (colored dots/bars)
    │       │   ├── Task start/end: Horizontal bar spanning duration
    │       │   ├── LLM call: Amber dot (click to see prompt/response)
    │       │   ├── Tool use: Emerald dot (click to see input/output)
    │       │   └── Error: Rose dot with pulse (click for error details)
    │       └── Connecting lines between related events across agents
    │
    ├─── Hover behavior
    │       ├── Hover over event marker → Tooltip with summary
    │       │   ├── Timestamp
    │       │   ├── Event type
    │       │   ├── Brief message (first 100 chars)
    │       │   └── "Click for details"
    │       └── Hover over duration bar → Highlight bar, show duration label
    │
    ├─── Click behavior
    │       ├── Click event marker → Log viewer scrolls to that event
    │       ├── Click event marker → Event details expand in log viewer
    │       └── Click empty timeline area → Set playback cursor position
    │
    └─── RESULT: User can visually scan the entire run at a glance
```

### 2b. Zoom and Pan Timeline

```
[Timeline chart]
    │
    ├─── Zoom
    │       ├── Scroll wheel: Zoom in/out centered on cursor
    │       ├── Pinch gesture: Zoom on trackpad/touch
    │       ├── Toolbar +/- buttons: Zoom in fixed steps
    │       └── Double-click: Zoom to fit clicked agent's lane
    │
    ├─── Pan
    │       ├── Click and drag on timeline background
    │       ├── Shift+scroll: Horizontal pan
    │       └── Scrollbar at bottom for direct position control
    │
    ├─── Zoom presets
    │       ├── [Fit All]: Zoom to show entire run
    │       ├── [Fit Selection]: Zoom to selected time range
    │       └── [1:1]: Reset to default zoom
    │
    └─── RESULT: User can zoom into specific time periods of interest
```

---

## 3. Filter Events

```
[Debug timeline — filters bar]
    │
    ├─── Agent filter (multi-select dropdown)
    │       ├── List all agents in the run
    │       ├── Check/uncheck to show/hide agent lanes
    │       ├── "Select All" / "Deselect All" options
    │       └── Visual: Hidden lanes collapse with smooth animation
    │
    ├─── Event type filter (multi-select chips)
    │       ├── LLM Calls (amber chip)
    │       ├── Tool Use (emerald chip)
    │       ├── Task Start/End (sky chip)
    │       ├── Errors (rose chip)
    │       └── Custom Events (slate chip)
    │       Clicking a chip toggles it; dimmed events fade to 20% opacity
    │
    ├─── Log level filter (dropdown)
    │       ├── All Levels (default)
    │       ├── Error only
    │       ├── Warning + Error
    │       ├── Info + Warning + Error
    │       └── Debug (everything)
    │
    ├─── Time range filter
    │       ├── Click and drag on timeline to select range
    │       ├── OR: Start/end time inputs in filters bar
    │       └── Selection highlighted with semi-transparent overlay
    │
    ├─── Search (free text)
    │       ├── Text input with search icon
    │       ├── Searches: event messages, agent names, tool names, log content
    │       ├── Matching events highlighted on timeline (yellow ring)
    │       ├── Log viewer filters to matching entries
    │       ├── Result count shown: "12 matches"
    │       ├── Up/Down arrows to navigate between matches
    │       └── Clear search: × button or Escape
    │
    └─── Active filters indicator
         ├── Pill badges showing active filters: "Agent: researcher × | Type: Errors × "
         ├── [Clear All Filters] button when any filters active
         └── URL updates with filter state (shareable)
```

---

## 4. Inspect Log Entries

```
[Log viewer — list of structured entries]
    │
    ├─── Log entry structure (collapsed)
    │       ┌──────────────────────────────────────────────────┐
    │       │ 10:23:01.500  ● [researcher]  🤖 LLM Call → gpt-4o │
    │       └──────────────────────────────────────────────────┘
    │       ├── Timestamp (monospace, left-aligned)
    │       ├── Agent badge (colored pill matching agent lane color)
    │       ├── Event type icon (🤖 LLM, 🔧 Tool, ▶ Task, ❌ Error)
    │       └── Message summary (single line, truncated)
    │
    ├─── Click to expand entry
    │       ┌──────────────────────────────────────────────────┐
    │       │ 10:23:01.500  ● [researcher]  🤖 LLM Call → gpt-4o │
    │       ├──────────────────────────────────────────────────┤
    │       │ Duration: 1,620ms                                │
    │       │ Tokens: 1,234 input · 567 output                 │
    │       │ Cost: $0.0023                                    │
    │       │                                                  │
    │       │ Prompt:                                           │
    │       │ ┌──────────────────────────────────────────────┐ │
    │       │ │ You are a research analyst...                 │ │
    │       │ │ Find information about AI trends in 2026.    │ │
    │       │ └──────────────────────────────────────────────┘ │
    │       │                                                  │
    │       │ Response:                                         │
    │       │ ┌──────────────────────────────────────────────┐ │
    │       │ │ Based on my analysis, the key trends are:    │ │
    │       │ │ 1. Multi-agent systems...                    │ │
    │       │ └──────────────────────────────────────────────┘ │
    │       │                                                  │
    │       │ [Copy Prompt] [Copy Response] [Copy Full Entry]  │
    │       └──────────────────────────────────────────────────┘
    │
    ├─── Tool use entry (expanded)
    │       ├── Tool name, input parameters (syntax-highlighted JSON)
    │       ├── Output (syntax-highlighted)
    │       ├── Duration
    │       └── [Copy Input] [Copy Output]
    │
    ├─── Error entry (expanded)
    │       ├── Error message (red text)
    │       ├── Stack trace (monospace, collapsible)
    │       ├── Context: What the agent was doing when the error occurred
    │       └── [Copy Error] [Report Bug]
    │
    └─── Virtual scroll
         ├── Only renders visible entries (for large log sets)
         ├── Smooth scroll with momentum
         └── "Jump to top" / "Jump to bottom" buttons
```

---

## 5. Use Playback Controls

```
[Debug timeline — playback bar at bottom]
    │
    ├─── Playback controls
    │       ├── ◀◀ (Jump to start): Reset cursor to 0s
    │       ├── ◀ (Step back): Move to previous event
    │       ├── ▶ (Play/Pause): Auto-advance cursor through timeline
    │       ├── ▶ (Step forward): Move to next event
    │       ├── ▶▶ (Jump to end): Move cursor to last event
    │       └── Speed selector: 0.5x, 1x, 2x, 4x, 8x
    │
    ├─── During playback
    │       ├── Cursor moves along timeline at selected speed
    │       ├── Current event highlighted on timeline chart
    │       ├── Log viewer auto-scrolls to current event
    │       ├── Canvas (if visible in split view) shows node states at current time
    │       └── Progress: "12.3s / 20.0s" display
    │
    ├─── Step-through mode
    │       ├── ▶ Step forward → Advance to next event
    │       ├── Highlight event on timeline
    │       ├── Expand event in log viewer
    │       └── Useful for debugging — step through each agent action
    │
    └─── RESULT: User can replay execution at their own pace
```

---

## 6. Export and Share Debug Data

```
[Debug timeline]
    │
    ├─── [Export Logs] button in header
    │       ├── Format options:
    │       │   ├── JSON (structured, machine-readable)
    │       │   ├── CSV (spreadsheet-friendly)
    │       │   └── Plain text (human-readable)
    │       ├── Scope: All events or filtered events only
    │       └── [Download] → File saved
    │
    ├─── Share URL
    │       ├── URL contains run ID: /canvas/:wfId/debug/:runId
    │       ├── Filter state encoded in URL params
    │       └── Team members with access can view the same timeline
    │
    └─── Copy event
         ├── Right-click log entry → "Copy as JSON"
         └── Useful for bug reports and discussions
```

---

## 7. Error Investigation Flow

```
[Workflow failed — user wants to debug]
    │
    ├─── Entry point: Toast "Workflow failed" → [View Logs]
    │
    ├─── Timeline shows error markers (rose dots with pulse)
    │
    ├─── Quick actions
    │       ├── Click error marker → Jump to error in log viewer
    │       ├── Filter bar → Click "Errors" chip → Show only errors
    │       └── Search → Type error message text
    │
    ├─── Error context
    │       ├── Expanded error entry shows:
    │       │   ├── Error message
    │       │   ├── Stack trace
    │       │   ├── Previous events (what led to the error)
    │       │   └── Agent state at time of error
    │       └── Timeline highlights the error's agent lane
    │
    ├─── Step back from error
    │       ├── Click ◀ step back from error event
    │       ├── See the LLM call or tool use that preceded the error
    │       └── Inspect prompt/response for issues
    │
    └─── Fix and retry
         ├── [← Back to Canvas] → Modify workflow
         ├── Fix the issue (update node config, change connections)
         └── [▶ Re-run] → Start new run, compare timelines
```

---

## 8. Edge Cases

| Scenario | Behavior |
|----------|----------|
| Very long run (1000+ events) | Virtualized rendering; summary view by default; expand individual lanes on demand |
| Run still in progress | Timeline updates in real-time; auto-scroll enabled by default; [Pause auto-scroll] toggle |
| Empty run (workflow started but no events) | "No events recorded" message; check agent configuration suggestion |
| Run data expired or deleted | "This run data is no longer available" with link to re-run |
| Multiple concurrent agent activities | Overlapping bars on separate lanes; vertical connector lines show causation |

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-04-08 | UX/UI Agent | Initial debugging timeline user flows |
