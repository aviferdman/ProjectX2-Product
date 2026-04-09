# Wireframe: Dashboard (Workflow Management)

**Screen:** `/dashboard`  
**Purpose:** Central hub for managing workflows — create, browse, run, and monitor usage  
**Task:** TASK-129 — Low-fidelity wireframe  
**References:** TASK-128 (IA), TASK-148 (dashboard UI spec), TASK-150 (onboarding design)

---

## 1. Desktop Layout (xl: ≥1280px)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [☰] Crewspace    Dashboard   Canvas   Templates   Marketplace     [🔔] [👤]   │ ← Global nav (48px)
├──────────┬──────────────────────────────────────────────────────────────────────┤
│          │  HEADER (56px)                                                      │
│          │  My Workflows          [🔍 Search workflows...]    [+ New ▼]       │
│          ├──────────────────────────────────────────────────────────────────────┤
│          │                                                                     │
│ SIDEBAR  │  STAT CARDS (100px height, flex row)                                │
│ (240px)  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐      │
│          │  │ Workflows  │ │ Total Runs │ │ Active     │ │ Error Rate │      │
│ ┌──────┐ │  │     12     │ │     42     │ │ Agents: 8  │ │   2.4%    │      │
│ │ Logo │ │  │ ↑3 this mo │ │ ↑15 vs avg │ │ 3 running  │ │ ↓0.5%    │      │
│ ├──────┤ │  └────────────┘ └────────────┘ └────────────┘ └────────────┘      │
│ │──────│ │                                                                     │
│ │📊Dash│ │  TOOLBAR (40px)                                                    │
│ │📁Work│ │  [All▾] [Active] [Draft] [Error]  │  Sort: [Last edited ▾]        │
│ │📋Temp│ │                                    │  View: [▦ Grid] [≡ List]      │
│ │🎨Canv│ │                                                                     │
│ │──────│ │  WORKFLOW GRID                                                      │
│ │📚Agen│ │  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐   │
│ │──────│ │  │ ┌──────────────┐ │ │ ┌──────────────┐ │ │ ┌──────────────┐ │   │
│ │📈Runs│ │  │ │   Canvas     │ │ │ │   Canvas     │ │ │ │   Canvas     │ │   │
│ │📝Logs│ │  │ │  thumbnail   │ │ │ │  thumbnail   │ │ │ │  thumbnail   │ │   │
│ │──────│ │  │ │  (160px h)   │ │ │ │  (160px h)   │ │ │ │  (160px h)   │ │   │
│ │⚙Sett│ │  │ └──────────────┘ │ │ └──────────────┘ │ │ └──────────────┘ │   │
│ └──────┘ │  │ Research Flow    │ │ Content Pipeline │ │ Data Analysis    │   │
│          │  │ 3 agents · 5 tasks│ │ 2 agents · 3 tasks│ │ 4 agents · 8 tasks│   │
│          │  │ Edited 2 min ago │ │ Edited 1 hr ago  │ │ Edited yesterday │   │
│          │  │ ● Active         │ │ ● Active         │ │ ○ Draft          │   │
│          │  │                  │ │                  │ │                  │   │
│          │  │ [Edit] [Run] [⋮]│ │ [Edit] [Run] [⋮]│ │ [Edit] [Run] [⋮]│   │
│          │  └──────────────────┘ └──────────────────┘ └──────────────────┘   │
│          │                                                                     │
│          │  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐   │
│          │  │ ┌──────────────┐ │ │ ┌──────────────┐ │ │ ┌──────────────┐ │   │
│          │  │ │   Canvas     │ │ │ │   Canvas     │ │ │ │   Canvas     │ │   │
│          │  │ │  thumbnail   │ │ │ │  thumbnail   │ │ │ │  thumbnail   │ │   │
│          │  │ └──────────────┘ │ │ └──────────────┘ │ │ └──────────────┘ │   │
│          │  │ Email Outreach   │ │ Code Review Bot  │ │ Support Triage   │   │
│          │  │ ● Error          │ │ ○ Draft          │ │ ● Active         │   │
│          │  │ [Edit] [Run] [⋮]│ │ [Edit] [Run] [⋮]│ │ [Edit] [Run] [⋮]│   │
│          │  └──────────────────┘ └──────────────────┘ └──────────────────┘   │
│          │                                                                     │
│          │  USAGE CARD (bottom)                                               │
│          │  ┌──────────────────────────────────────────────────────────────┐   │
│          │  │ This Month                                    Resets: 23d   │   │
│          │  │ Runs:       ████████████░░░░░░░░  42 / 100                  │   │
│          │  │ Workflows:  ███░░░░░░░░░░░░░░░░░   3 / 10                   │   │
│          │  │                                      [View Details] [Upgrade]│   │
│          │  └──────────────────────────────────────────────────────────────┘   │
│          │                                                                     │
├──────────┴──────────────────────────────────────────────────────────────────────┤
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

### Component Zones

| Zone | Size | Position | Notes |
|------|------|----------|-------|
| Global Nav | 100% × 48px | Top | Persistent across screens |
| Sidebar | 240px × viewport | Left | Collapsible to 64px icon rail |
| Header | Content area × 56px | Top of content | Title + search + create button |
| Stat Cards | 4 cards × 100px | Below header | Flex row, 200px min each, 16px gap |
| Toolbar | Content width × 40px | Below stats | Filters + sort + view toggle |
| Workflow Grid | Content width × flex | Main area | `auto-fill, minmax(280px, 1fr)`, 16px gap |
| Usage Card | Content width × ~80px | Bottom | Progress bars + upgrade CTA |

---

## 2. Sidebar Detail

```
┌──────────────────────┐
│      CREWSPACE       │ ← Logo / brand (48px)
├──────────────────────┤
│ MAIN                 │ ← Section label (12px, uppercase, muted)
│                      │
│ 📊 Dashboard      ← │ ← Active indicator (violet left border)
│ 📁 Workflows        │
│ 📋 Templates         │
│ 🎨 Canvas Editor     │
├──────────────────────┤
│ BUILD                │
│                      │
│ 📚 Agent Library     │
├──────────────────────┤
│ MONITOR              │
│                      │
│ 📈 Run History       │
│ 📝 Logs              │
├──────────────────────┤
│ ──────────────────   │ ← Divider
│ ⚙ Settings           │
├──────────────────────┤
│                      │
│ ┌──────────────────┐ │
│ │ Free Plan        │ │ ← Plan badge (bottom)
│ │ 42/100 runs      │ │
│ │ [Upgrade →]      │ │
│ └──────────────────┘ │
└──────────────────────┘
  240px wide
  Nav items: 40px height, 12px left padding
  Active: violet left border (3px), bg tint
  Hover: subtle bg change
```

---

## 3. Stat Card Detail

```
┌─────────────────────────────────┐
│  ┌──┐                          │
│  │●●│  Total Workflows         │ ← 12px label, muted color
│  └──┘                          │
│       12                       │ ← 24px / 700 weight, primary color
│       ↑ 3 this month           │ ← 11px trend, green = up, red = down
└─────────────────────────────────┘
  200px min-width, 100px height
  16px padding
  Icon: colored dot (matches category)
  Border: 1px subtle, 8px radius
  Hover: subtle shadow lift
```

---

## 4. Workflow Card Detail

```
┌──────────────────────────────────┐
│ ┌──────────────────────────────┐ │
│ │                              │ │ ← Canvas thumbnail (auto-generated)
│ │    ┌───┐     ┌───┐          │ │    160px height
│ │    │ A │────▶│ T │          │ │    Shows miniature of workflow graph
│ │    └───┘     └───┘          │ │    Gray bg if no nodes
│ │                              │ │
│ └──────────────────────────────┘ │
│                                  │
│  Research Flow                   │ ← Title: 14px / 600
│  3 agents · 5 tasks              │ ← Metadata: 12px / 400, muted
│  Edited 2 min ago                │ ← Relative timestamp: 11px / 400
│  ● Active                        │ ← Status badge (colored dot + text)
│                                  │
│  ┌────────────────────────────┐  │ ← Action row (visible on hover)
│  │  [Edit]   [▶ Run]   [⋮]  │  │    Buttons: 32px height
│  └────────────────────────────┘  │
└──────────────────────────────────┘
  280px min-width (auto-fill grid)
  8px border-radius
  Hover: translateY(-2px), shadow increase
  Click (card body): navigate to canvas editor

STATUS BADGES:
  ● Active   = emerald dot + text
  ○ Draft    = slate dot + text
  ● Error    = rose dot + text
  ◐ Archived = muted dot + text (hidden by default)
```

---

## 5. List View (Alternative)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  NAME              │ STATUS  │ AGENTS │ LAST RUN       │ CREATED  │ ⋮  │
├──────────────────────────────────────────────────────────────────────────┤
│  Research Flow     │ ●Active │   3    │ 2 min ago ✓    │ Apr 1    │ ⋮  │
│  Content Pipeline  │ ●Active │   2    │ 1 hr ago ✓     │ Mar 28   │ ⋮  │
│  Data Analysis     │ ○Draft  │   4    │ Never          │ Apr 5    │ ⋮  │
│  Email Outreach    │ ●Error  │   2    │ 3 hr ago ✗     │ Mar 15   │ ⋮  │
│  Code Review Bot   │ ○Draft  │   1    │ Never          │ Apr 8    │ ⋮  │
│  Support Triage    │ ●Active │   3    │ 30 min ago ✓   │ Feb 20   │ ⋮  │
└──────────────────────────────────────────────────────────────────────────┘
  Columns: Name (flex), Status (80px), Agents (60px), Last Run (120px), Created (80px), Actions (40px)
  Row height: 48px
  Hover: row background highlight
  Click row: navigate to canvas editor
  ⋮ menu: Duplicate, Rename, Export, View History, Delete
```

---

## 6. Context Menu (⋮)

```
┌────────────────────────┐
│ ✏ Rename               │ ← Inline edit
│ 📋 Duplicate            │ ← Creates "Name (Copy)"
├────────────────────────┤
│ ▶ Run Workflow         │
│ 📊 View Run History     │
├────────────────────────┤
│ ↓ Export            →  │ ← Submenu: JSON, YAML, TypeScript
├────────────────────────┤
│ 🗑 Delete               │ ← Red text, confirmation dialog
└────────────────────────┘
  Min width: 200px
  Item height: 36px
  8px border-radius, shadow
```

---

## 7. Create Workflow Modal

```
┌─────────────────────────────────────────────┐
│  Create New Workflow                    [×]  │
├─────────────────────────────────────────────┤
│                                             │
│  Name                                       │
│  ┌─────────────────────────────────────┐    │
│  │ Untitled Workflow                    │    │ ← Auto-focused, placeholder
│  └─────────────────────────────────────┘    │    Select-all on focus
│                                             │
│  Description (optional)                     │
│  ┌─────────────────────────────────────┐    │
│  │                                     │    │ ← Textarea, 3 rows
│  │                                     │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Start from:                                │
│  ┌─────────────┐  ┌─────────────┐          │
│  │     📄      │  │     📋      │          │
│  │   Blank     │  │  Template   │          │ ← Radio card selection
│  │  Workflow   │  │  Library    │          │    Blank = default
│  └─────────────┘  └─────────────┘          │
│                                             │
│             [Cancel]   [Create Workflow]     │ ← Primary action right
│                                             │
└─────────────────────────────────────────────┘
  Width: 480px (desktop), full-width (mobile)
  Escape or Cancel to close
  Enter submits (when name field focused)
```

---

## 8. Usage Card Detail

```
┌──────────────────────────────────────────────────────────────────┐
│  📊 Usage This Month                              Resets: 23 days│
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Workflow Runs                                                   │
│  ████████████████████████░░░░░░░░░░░░░░░░  42 / 100 runs       │
│  ← emerald fill                          (42%)                  │
│                                                                  │
│  Workflows                                                       │
│  ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   3 / 10 workflows   │
│  ← emerald fill                          (30%)                  │
│                                                                  │
│  Agents                                                          │
│  ████████████████████████████░░░░░░░░░░░░   8 / 15 agents      │
│  ← amber fill (approaching limit)       (53%)                  │
│                                                                  │
│  [View Detailed Usage]                         [Upgrade Plan →] │
└──────────────────────────────────────────────────────────────────┘

PROGRESS BAR COLORS:
  0–79%:   emerald (#10b981)
  80–99%:  amber (#f59e0b)
  100%:    rose (#f43f5e) + "Limit reached" label
  Bar height: 6px, full border-radius
```

---

## 9. Tablet Layout (md: 768–1023px)

```
┌─────────────────────────────────────────────────────┐
│ [☰] Crewspace                           [🔔] [👤] │ ← Nav
├─────────────────────────────────────────────────────┤
│ My Workflows      [🔍 Search...]     [+ New ▼]    │ ← Header
├─────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │ ← Stats (4-col, compact)
│ │Workflows │ │  Runs    │ │ Agents   │ │ Errors │ │
│ │    12    │ │   42     │ │    8     │ │  2.4%  │ │
│ └──────────┘ └──────────┘ └──────────┘ └────────┘ │
├─────────────────────────────────────────────────────┤
│ [All] [Active] [Draft] [Error] │ [Sort▾] [▦][≡]  │ ← Toolbar
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌───────────────────┐ ┌───────────────────┐        │ ← 2-column grid
│ │ [thumbnail]       │ │ [thumbnail]       │        │
│ │ Research Flow     │ │ Content Pipeline  │        │
│ │ 3 agents · 5 tasks│ │ 2 agents · 3 tasks│        │
│ │ ● Active          │ │ ● Active          │        │
│ └───────────────────┘ └───────────────────┘        │
│                                                     │
│ ┌───────────────────┐ ┌───────────────────┐        │
│ │ [thumbnail]       │ │ [thumbnail]       │        │
│ │ Data Analysis     │ │ Email Outreach    │        │
│ │ ○ Draft           │ │ ● Error           │        │
│ └───────────────────┘ └───────────────────┘        │
│                                                     │
│ ┌─ Usage ────────────────────────────────────┐     │
│ │ Runs: ████████████░░░░  42/100  [Upgrade] │     │
│ └────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────┘

Sidebar: Hidden, opens as slide-over (280px) from left via [☰]
Action buttons: Always visible on cards (no hover state on touch)
```

---

## 10. Mobile Layout (xs: 375–639px)

```
┌──────────────────────────────┐
│ [☰]  Crewspace     [🔔][👤]│ ← Nav (48px)
├──────────────────────────────┤
│ My Workflows    [+ New]      │ ← Header (compact)
├──────────────────────────────┤
│ ┌────────────┐ ┌────────────┐│ ← Stats (2-col)
│ │Workflows:12│ │  Runs: 42  ││
│ └────────────┘ └────────────┘│
│ ┌────────────┐ ┌────────────┐│
│ │ Agents: 8  │ │ Errors:2.4%││
│ └────────────┘ └────────────┘│
├──────────────────────────────┤
│ [🔍] [All▾] [Sort▾]        │ ← Compact toolbar
├──────────────────────────────┤
│                              │
│ ┌──────────────────────────┐ │ ← Single column cards
│ │ Research Flow            │ │    (no thumbnail on mobile)
│ │ 3 agents · 5 tasks       │ │
│ │ Edited 2 min ago         │ │
│ │ ● Active    [▶][⋮]      │ │ ← Inline actions
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ Content Pipeline         │ │
│ │ 2 agents · 3 tasks       │ │
│ │ Edited 1 hr ago          │ │
│ │ ● Active    [▶][⋮]      │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ Data Analysis            │ │
│ │ 4 agents · 8 tasks       │ │
│ │ ○ Draft     [▶][⋮]      │ │
│ └──────────────────────────┘ │
│                              │
│ ┌─ Usage ──────────────────┐ │
│ │ ████████░░░ 42/100 runs  │ │
│ │          [Upgrade Plan →]│ │
│ └──────────────────────────┘ │
└──────────────────────────────┘

Sidebar: Full-screen overlay via [☰]
Cards: Simplified (no thumbnails), always show actions
Search: Expandable (tap 🔍 → full-width input)
Create: Bottom sheet instead of modal
```

---

## 11. State Variations

### Empty State (New User)
```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│                          🚀                                      │
│                                                                  │
│               Create your first workflow                         │
│                                                                  │
│     Build multi-agent AI workflows visually.                    │
│     Drag agents, tasks, and tools onto the canvas              │
│     to orchestrate powerful AI automations.                     │
│                                                                  │
│         [+ New Workflow]     [Browse Templates]                  │
│                                                                  │
│     ┌────────────────────────────────────────┐                  │
│     │  Quick Start:                          │                  │
│     │  1. Create a workflow                  │                  │
│     │  2. Add agents and tasks               │                  │
│     │  3. Connect them together              │                  │
│     │  4. Hit Run ▶                          │                  │
│     └────────────────────────────────────────┘                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Search — No Results
```
┌──────────────────────────────────────────┐
│  🔍 "machine learning pipeline"          │
├──────────────────────────────────────────┤
│                                          │
│              🔍                           │
│                                          │
│   No workflows match your search         │
│                                          │
│   Try different keywords or              │
│   [Clear search] to see all workflows    │
│                                          │
└──────────────────────────────────────────┘
```

### Usage Limit Reached
```
┌──────────────────────────────────────────────────────────────────┐
│  ⚠ You've reached your monthly run limit                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Runs:       ████████████████████████████████  100 / 100 runs   │
│              ← rose fill                      (100%)            │
│                                                                  │
│  Upgrade to Pro for unlimited runs            [Upgrade Plan →]  │
│  Resets in 23 days                                              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

[▶ Run] buttons disabled across all workflow cards
Tooltip on disabled Run: "Monthly run limit reached. Upgrade or wait for reset."
```

### Delete Confirmation
```
┌───────────────────────────────────────────┐
│  Delete "Research Flow"?             [×]  │
├───────────────────────────────────────────┤
│                                           │
│  ⚠ This action cannot be undone.          │
│                                           │
│  This will permanently delete:            │
│  • The workflow and all its nodes         │
│  • 12 run history records                 │
│  • Associated debug timelines             │
│                                           │
│            [Cancel]   [🗑 Delete]          │
│            (focused)   (red/destructive)   │
│                                           │
└───────────────────────────────────────────┘
  Width: 440px
  Cancel has default focus (safety)
  30-second undo toast after deletion
```

---

## 12. Notification Bell

```
┌──────────────────────────────────┐
│  Notifications              [×]  │
├──────────────────────────────────┤
│  ● Workflow "Research Flow"      │ ← Unread (bold, dot)
│    completed successfully        │
│    2 min ago                     │
├──────────────────────────────────┤
│  ● Workflow "Email Outreach"     │
│    failed: API rate limit        │
│    3 hrs ago          [View Logs]│
├──────────────────────────────────┤
│    New version available: v1.2.0 │ ← Read (normal weight)
│    yesterday          [Details]  │
├──────────────────────────────────┤
│  [Mark all read]    [View all →] │
└──────────────────────────────────┘
  Width: 360px
  Max height: 400px (scroll)
  Position: Below bell icon, right-aligned
  Badge on bell: unread count (red circle)
```

---

## 13. Keyboard Navigation Map

```
TAB ORDER:
  Global Nav → Sidebar Nav Items → Search → Create Button →
  Filter Chips → Sort → View Toggle → Workflow Cards → Usage Card

DASHBOARD SHORTCUTS:
  / or Cmd+K      Focus search
  N               Open create workflow modal
  G then D        Go to Dashboard
  G then C        Go to Canvas
  G then T        Go to Templates
  Escape          Close modal / clear search / close notification
  Enter           Open focused workflow in canvas

CARD NAVIGATION:
  Tab             Move to next card
  Shift+Tab       Move to previous card
  Enter           Open workflow (= click card)
  Space           Quick-run workflow (= click Run)
  Delete          Open delete confirmation

SCREEN READER:
  Page: "Dashboard — N workflows, M active"
  Stat card: "[Label]: [Value], trend [up/down] [amount]"
  Workflow card: "[Name], [status], [agents] agents, [tasks] tasks, last edited [time]"
  Usage: "Usage: [X] of [Y] runs used this month, [Z] days until reset"
```
