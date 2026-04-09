# Wireframe: Debug Timeline

**Screen:** `/canvas/:workflowId/debug/:runId`  
**Purpose:** Inspect and replay workflow execution — trace agent actions, LLM calls, tool usage, and errors  
**Task:** TASK-129 — Low-fidelity wireframe  
**References:** TASK-128 (IA), TASK-140 (timeline UI spec), TASK-142 (timeline interactions)

---

## 1. Desktop Layout (xl: ≥1280px)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [☰] Crewspace    Dashboard   Canvas   Templates   Marketplace     [🔔] [👤]   │ ← Global nav (48px)
├─────────────────────────────────────────────────────────────────────────────────┤
│ ← Back to Canvas  │  "Research Workflow" — Run #42  │  [Export ▾] [Re-run ▶]  │ ← Header bar (48px)
├─────────────────────────────────────────────────────────────────────────────────┤
│ FILTER BAR (40px)                                                              │
│ [Agent ▾] [● LLM ● Tool ● Task ● Error] [Level ▾] [🔍 Search logs...]       │
│                                                                                │
│ Active: [Analyst ×] [Errors only ×]              [Clear All Filters]          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│ TIMELINE CHART (60% height, resizable)                                         │
│                                                                                │
│   TIME AXIS (32px, sticky)                                                     │
│   0s        5s        10s       15s       20s       25s                        │
│   ├─────────┼─────────┼─────────┼─────────┼─────────┤                         │
│                                                                                │
│   AGENT LANES (48px each):                                                     │
│   ┌──────────┬─────────────────────────────────────────────────────────────┐   │
│   │ Analyst  │ ◆━━━━━━━━◆    ●━━━━━●        ▲━━━▲                        │   │
│   │ (violet) │ LLM call      Tool use       Task                          │   │
│   ├──────────┼─────────────────────────────────────────────────────────────┤   │
│   │ Writer   │         ◆━━━━━━━━━━━━━━◆            ▲━━━━━━━━━━━━▲        │   │
│   │ (violet) │         LLM call                    Task completion        │   │
│   ├──────────┼─────────────────────────────────────────────────────────────┤   │
│   │Researcher│ ●━━━━●   ◆━━━━◆  ●━━━●   ★                               │   │
│   │ (violet) │ Tool     LLM     Tool    Error                             │   │
│   └──────────┴─────────────────────────────────────────────────────────────┘   │
│                                  ▼                                             │
│                             PLAYHEAD                                           │
│                          (violet line)                                         │
│                                                                                │
│   PLAYBACK: [◀◀] [◀] [▶ Play] [▶] [▶▶]  Speed: [1×▾]  12.3s / 25.0s       │
│                                                                                │
├════════════════════════════════════════════════════════════════════════════════╡ ← Resize handle (6px)
│                                                                                │
│ LOG VIEWER (40% height, resizable)                                             │
│                                                                                │
│ ┌──────────┬────────┬──────────┬───────────────────────────────────────────┐   │
│ │TIMESTAMP │ LEVEL  │  AGENT   │ MESSAGE                                  │   │
│ ├──────────┼────────┼──────────┼───────────────────────────────────────────┤   │
│ │  0.000s  │ [INFO] │ Analyst  │ Starting task: "Analyze market data"     │   │
│ │  0.120s  │ [INFO] │ Analyst  │ ◆ LLM call: GPT-4o (temperature 0.7)    │   │
│ │  3.200s  │ [INFO] │ Analyst  │ ◆ LLM response: 1,240 tokens           │   │
│ │  3.250s  │ [INFO] │ Analyst  │ ● Tool call: search("market trends")    │   │
│ │  4.100s  │ [INFO] │ Analyst  │ ● Tool result: 12 results              │   │
│ │  4.200s  │ [INFO] │ Writer   │ ◆ LLM call: Claude 3.5                 │   │
│ │  8.500s  │ [WARN] │Researcher│ ● Tool timeout: fetch (>5000ms)      │▐ │   │
│ │ 12.300s  │[ERROR] │Researcher│ ★ Error: API rate limit exceeded       │▐ │   │
│ │          │        │          │   ▶ Show stack trace                    │▐ │   │
│ └──────────┴────────┴──────────┴───────────────────────────────────────────┘   │
│                                                                                │
│ Showing 42 of 128 events │ Scroll for more │ [Export: JSON | CSV | TXT]       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Component Zones

| Zone | Size | Position | Notes |
|------|------|----------|-------|
| Global Nav | 100% × 48px | Top | Persistent |
| Header Bar | 100% × 48px | Below nav | Back link, run info, actions |
| Filter Bar | 100% × 40px | Below header | Chips + search + active filter pills |
| Timeline Chart | 100% × 60% | Center upper | Resizable, min 200px height |
| Resize Handle | 100% × 6px | Between chart & logs | Drag to resize split |
| Log Viewer | 100% × 40% | Center lower | Virtualized scroll, resizable, min 120px |
| Playback Controls | 100% × 36px | Bottom of timeline | Transport + speed + time display |

---

## 2. Timeline Chart Detail

### Time Axis
```
  0s        5s        10s       15s       20s       25s       30s
  ├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
  │    │    │    │    │    │    │    │    │    │    │    │    │
  minor ticks (1s)    major ticks (5s)

  Auto-scale:
    Short runs (<30s):  1s minor, 5s major
    Medium (30s–5min):  5s minor, 30s major
    Long (>5min):       30s minor, 5min major
```

### Agent Lane Detail
```
  ┌──────────────────────────────────────────────────────────────────┐
  │                                                                  │
  │  Lane label   Event markers on timeline                         │
  │  (160px)      (positioned by timestamp)                         │
  │                                                                  │
  │  ┌────────┐   ◆━━━━━━━━━━━━◆   ●━━━━━●       ▲                │
  │  │ ◈ Name │   │            │   │     │       │                │
  │  │  agent │   LLM start   LLM  Tool  Tool   Point             │
  │  │ badge  │   (amber)     end  start end    event              │
  │  └────────┘                                                     │
  │     48px      Duration bars (variable width, 28px height)       │
  │               Point events = 12px markers                       │
  └──────────────────────────────────────────────────────────────────┘

  EVENT TYPES (semantic colors):
  ◆ LLM Call    = amber (#d97706)     Duration bar
  ● Tool Use    = emerald (#059669)   Duration bar
  ▲ Task        = sky (#0284c7)       Duration bar
  ★ Error       = rose (#f43f5e)      Point marker (pulsing)
  ◇ Message     = violet (#7c3aed)    Point marker
```

### Playhead
```
        ▼ (12px triangle handle)
        │
        │ (2px violet line, full height)
        │
        │
  ──────┼──────────────────────────
        │
        Drag to scrub
        Click time axis to jump
        Arrow keys to step
```

---

## 3. Log Viewer Detail

### Collapsed Entry
```
┌──────────┬────────┬──────────┬────────────────────────────────────────────┐
│  3.250s  │ [INFO] │ ◈Analyst │ ● Tool call: search("market trends 2024") │
└──────────┴────────┴──────────┴────────────────────────────────────────────┘
  100px      56px     120px      flex (remaining width)
  monospace  badge    truncated  single line, ellipsis on overflow
```

### Expanded Entry (click to expand)
```
┌──────────┬────────┬──────────┬────────────────────────────────────────────┐
│  3.250s  │ [INFO] │ ◈Analyst │ ● Tool call: search("market trends 2024") │
├──────────┴────────┴──────────┴────────────────────────────────────────────┤
│                                                                           │
│  INPUT:                                                                   │
│  ┌─────────────────────────────────────────────────────┐  [Copy]         │
│  │ {                                                    │                 │
│  │   "query": "market trends 2024",                     │                 │
│  │   "maxResults": 10                                   │                 │
│  │ }                                                    │                 │
│  └─────────────────────────────────────────────────────┘                 │
│                                                                           │
│  OUTPUT:                                                                  │
│  ┌─────────────────────────────────────────────────────┐  [Copy]         │
│  │ {                                                    │                 │
│  │   "results": [...12 items],                          │                 │
│  │   "totalHits": 1240                                  │                 │
│  │ }                                                    │                 │
│  └─────────────────────────────────────────────────────┘                 │
│                                                                           │
│  Duration: 850ms  │  Tokens: —                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

### Error Entry (expanded)
```
┌──────────┬────────┬──────────┬────────────────────────────────────────────┐
│ 12.300s  │[ERROR] │◈Research.│ ★ Error: API rate limit exceeded           │
├──────────┴────────┴──────────┴────────────────────────────────────────────┤
│                                                                           │
│  STACK TRACE:                                                ─           │
│  ┌─────────────────────────────────────────────────────┐  [Copy]         │
│  │ RateLimitError: Too many requests (429)              │                 │
│  │   at SearchTool.execute (tools/search.ts:42)        │                 │
│  │   at Agent.runTool (core/agent.ts:156)              │                 │
│  │   at TaskRunner.step (core/runner.ts:89)            │                 │
│  └─────────────────────────────────────────────────────┘                 │
│                                                                           │
│  Context: Attempt 3 of 3  │  Retry exhausted                            │
└───────────────────────────────────────────────────────────────────────────┘
```

### Level Badges
```
  [DEBUG]  slate/gray     │  [INFO]  sky/blue
  [WARN]  amber/yellow   │  [ERROR] rose/red (bold)
   56px pill, 10px font, 600 weight
```

---

## 4. Filter Bar Detail

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Agent ▾]  [● LLM] [● Tool] [● Task] [● Error]  [Level ▾]  [🔍 Search...] │
│                                                                             │
│  Multi-    Toggle chips (filled = active,        Dropdown:   240px input    │
│  select    outline = inactive)                   All         expandable to  │
│  dropdown                                        Error       360px on focus │
│                                                  Warn+                      │
│                                                  Info+                      │
│                                                  Debug                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ Active: [Analyst ×] [Writer ×] [Errors only ×]         [Clear All Filters] │
│                                                                             │
│  Filter pills (shown when any filter active)    Clear button (right-aligned)│
│  Click × to remove individual filter                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Playback Controls

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   [◀◀]  [◀]  [ ▶ Play ]  [▶]  [▶▶]   Speed: [1× ▾]           │
│   Jump   Step  Play/      Step  Jump   0.5×, 1×, 2×, 4×, 8×   │
│   start  back  Pause      fwd   end                             │
│                                                                  │
│   Button: 36×36px, 4px gap                                      │
│   Play button: 48×36px (wider, primary accent)                  │
│                                                                  │
│   Progress:  ━━━━━━━━━━━●━━━━━━━━━━━  12.3s / 25.0s           │
│              Clickable progress bar    Time display              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 6. Cross-Component Sync

```
INTERACTION FLOW:

1. Click event marker in timeline
   ↓
   Log viewer scrolls to matching entry
   Entry auto-expands (250ms animation)
   Agent lane briefly highlights

2. Click log entry
   ↓
   Timeline scrolls to event marker
   Playhead jumps to event timestamp
   Marker gains selection ring (2px violet)

3. Playback advances
   ↓
   Playhead moves across timeline
   Log viewer auto-scrolls to current event
   Active event highlighted in both views

4. Filter applied
   ↓
   Timeline: hidden events fade to 20% opacity
   Hidden agent lanes collapse (smooth animation)
   Log viewer: filtered entries hidden, count updates
   Filter pill appears in active bar
```

---

## 7. Tablet Layout (md: 768–1279px)

```
┌─────────────────────────────────────────────────────┐
│ [☰] Crewspace                           [🔔] [👤] │ ← Nav
├─────────────────────────────────────────────────────┤
│ ← Back │ "Research Workflow" #42 │ [Export] [Re-run]│ ← Header
├─────────────────────────────────────────────────────┤
│ [Agent▾] [●][●][●][●] [Level▾] [🔍]               │ ← Filters (icon-only chips)
├─────────────────────────────────────────────────────┤
│                                                     │
│ TIMELINE (60%)                                      │
│  ┌────┬────────────────────────────────────────┐    │
│  │ 48 │ ◆━━━━━━◆   ●━━━●         ▲            │    │ ← Lane labels: icon-only (48px)
│  │ px │                                        │    │
│  ├────┤                                        │    │
│  │    │     ◆━━━━━━━━━━━━◆   ▲━━━━━━━━▲       │    │
│  └────┴────────────────────────────────────────┘    │
│  [◀◀][◀][▶][▶][▶▶]  [1×▾]  12.3s / 25.0s         │
│                                                     │
├═══════════════════════════════════════════════════╡  │ ← Resize
│                                                     │
│ LOG VIEWER (40%)                                    │
│ ┌────────┬──────┬──────────────────────────────┐    │
│ │ 3.25s  │[INFO]│ ● Tool: search("market...")  │    │
│ │ 4.10s  │[WARN]│ ● Timeout: fetch (>5000ms)  │    │
│ │12.30s  │[ERR] │ ★ API rate limit exceeded    │    │
│ └────────┴──────┴──────────────────────────────┘    │
└─────────────────────────────────────────────────────┘

Agent column hidden in log viewer (space constrained)
```

---

## 8. Mobile Layout (xs: <768px)

```
┌──────────────────────────────┐
│ [←] Run #42          [Export]│ ← Header (48px)
├──────────────────────────────┤
│ [Filters ▾]     [🔍 Search] │ ← Filter drawer trigger
├──────────────────────────────┤
│                              │
│ [Timeline] [Logs]            │ ← Tab switcher (segmented)
│                              │
│ ┌────────────────────────┐   │
│ │ TIMELINE (stacked)     │   │ ← Vertical layout
│ │                        │   │    Lanes stacked vertically
│ │ Analyst:               │   │
│ │ ◆━━━━◆  ●━━●          │   │
│ │                        │   │
│ │ Writer:                │   │
│ │    ◆━━━━━━━━━━━◆       │   │
│ │                        │   │
│ │ Researcher:            │   │
│ │ ●━━●  ◆━━◆  ★         │   │
│ └────────────────────────┘   │
│                              │
│ [◀◀][◀][ ▶ ][▶][▶▶] [1×▾] │ ← Playback (48px)
│ ━━━━━━━●━━━━━━ 12.3s/25.0s │
└──────────────────────────────┘

Filters: Open as bottom sheet drawer
Logs: Separate tab (not split view)
Swipe left/right to switch tabs
```

---

## 9. Event Marker Tooltip

```
  Hover over event marker (200ms delay):

  ┌─────────────────────────────┐
  │ LLM Call: GPT-4o            │
  │ Duration: 3.08s             │
  │ Tokens: 1,240 in / 890 out │
  │ Agent: Analyst              │
  │ Time: 0.120s — 3.200s      │
  │                             │
  │ Click to view details       │
  └─────────────────────────────┘
     Max width: 280px
     Positioned above marker (flip if near top)
```

---

## 10. State Variations

### Empty State (No Runs)
```
┌──────────────────────────────────────────┐
│                                          │
│              📊                          │
│                                          │
│    No debug data available               │
│                                          │
│    Run this workflow to see the          │
│    execution timeline and logs           │
│                                          │
│    [◀ Back to Canvas]  [▶ Run Workflow]  │
│                                          │
└──────────────────────────────────────────┘
```

### Loading State
```
┌──────────────────────────────────────────┐
│ ← Back │ "Research Workflow" — Run #42   │
├──────────────────────────────────────────┤
│                                          │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░         │ ← Skeleton: filter bar
│                                          │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░         │ ← Skeleton: timeline lanes
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░         │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░         │
│                                          │
│  Loading run data...                     │
│                                          │
└──────────────────────────────────────────┘
```

### Filtered (No Results)
```
┌──────────────────────────────────────────┐
│ Active: [Errors only ×]  [Clear All]     │
├──────────────────────────────────────────┤
│                                          │
│              ✅                           │
│                                          │
│    No errors in this run                 │
│    All tasks completed successfully      │
│                                          │
│    [Clear Filters]                       │
│                                          │
└──────────────────────────────────────────┘
```

---

## 11. Keyboard Navigation Map

```
TAB ORDER:
  Back button → Run info → Export → Re-run → Filter chips → Search →
  Timeline chart → Playback controls → Log viewer entries

TIMELINE SHORTCUTS:
  Space          Play / Pause
  ← / →          Step backward / forward (1 event)
  Shift+← / →    Jump 5 events
  Home / End     Jump to start / end
  + / −          Zoom in / out
  0              Reset zoom (fit all)
  F              Focus search

LOG SHORTCUTS:
  ↑ / ↓          Navigate entries
  Enter          Expand / collapse entry
  C              Copy expanded content
  Escape         Collapse entry / clear search

SCREEN READER:
  Timeline: "Workflow timeline with N agents and M events over T seconds"
  Lane: "[Agent name], N events" — events announced by type and timestamp
  Log entry: "[Level] [Agent] [Message] at [Time]"
```
