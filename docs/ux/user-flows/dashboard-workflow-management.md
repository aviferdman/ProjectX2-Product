# User Flow: Dashboard & Workflow Management

> **TASK-128** · P0 · UX/UI · Phase 2 (Epic 19)  
> User flows for the main dashboard, workflow CRUD operations, and usage tracking.

---

## 1. Dashboard Landing (Authenticated Home)

```
[User logs in or navigates to /dashboard]
    │
    ├─── Has workflows?
    │       │
    │       ├── YES → Workflow list view
    │       │   ┌─────────────────────────────────────────────────────┐
    │       │   │  My Workflows  [🔍 Search]  [Grid|List]  [+New ▼]  │
    │       │   ├─────────────────────────────────────────────────────┤
    │       │   │  ┌────────┐  ┌────────┐  ┌────────┐               │
    │       │   │  │ WF 1   │  │ WF 2   │  │ WF 3   │  ...         │
    │       │   │  │ thumb  │  │ thumb  │  │ thumb  │               │
    │       │   │  │ 3 agts │  │ 5 agts │  │ 2 agts │               │
    │       │   │  │ 2m ago │  │ 1h ago │  │ 3d ago │               │
    │       │   │  └────────┘  └────────┘  └────────┘               │
    │       │   ├─────────────────────────────────────────────────────┤
    │       │   │  Usage: 42/100 runs this month  │  [Upgrade]       │
    │       │   └─────────────────────────────────────────────────────┘
    │       │
    │       └── NO → Empty state
    │           ┌─────────────────────────────────────────────┐
    │           │        🚀                                    │
    │           │   Create your first workflow                 │
    │           │   Build multi-agent AI workflows visually    │
    │           │                                              │
    │           │   [+ New Workflow]    [Browse Templates]      │
    │           └─────────────────────────────────────────────┘
    │
    └─── RESULT: User sees their workflows or an inviting empty state
```

---

## 2. Workflow Card Interactions

### Grid View (Default)

```
[Workflow card]
    ┌──────────────────────┐
    │  [Canvas thumbnail]  │  ← Auto-generated from workflow nodes
    ├──────────────────────┤
    │  Research Pipeline   │  ← Workflow name
    │  3 agents · 5 tasks  │  ← Summary
    │  Edited 2 min ago    │  ← Relative timestamp
    │  ● Active            │  ← Status badge
    ├──────────────────────┤
    │  [Edit] [Run] [⋮]   │  ← Action buttons (visible on hover)
    └──────────────────────┘

Interactions:
    ├── Click card body → Open in canvas editor
    ├── Click [Edit] → Open in canvas editor (same as click)
    ├── Click [Run] → Start workflow run (redirect to canvas in running state)
    ├── Click [⋮] → Context menu:
    │       ├── Duplicate
    │       ├── Rename
    │       ├── Export (JSON / YAML)
    │       ├── View Run History
    │       ├── ──────────────
    │       └── Delete (red text)
    └── Hover card → Subtle elevation increase, show action buttons
```

### List View

```
┌──────────────────────────────────────────────────────────────────┐
│  Name            │ Agents │ Tasks │ Last Run  │ Status  │ ⋮     │
├──────────────────┼────────┼───────┼───────────┼─────────┼───────┤
│  Research Crew   │ 3      │ 5     │ 2 min ago │ ● Active│ [⋮]  │
│  Content Writer  │ 2      │ 3     │ 1 hr ago  │ ● Draft │ [⋮]  │
│  Data Pipeline   │ 5      │ 8     │ 3 days ago│ ● Error │ [⋮]  │
└──────────────────┴────────┴───────┴───────────┴─────────┴───────┘

Interactions:
    ├── Click row → Open in canvas editor
    ├── Click status badge → View last run's debug timeline
    └── Click [⋮] → Same context menu as grid view
```

---

## 3. Create New Workflow

```
[Dashboard]
    │
    ├─── Click [+ New Workflow]
    │       │
    │       ├── Dropdown:
    │       │   ├── "Blank Workflow" → Modal with name + optional description → Create → Redirect to canvas
    │       │   └── "From Template" → Redirect to /templates
    │       │
    │       └── Keyboard shortcut: Ctrl+N (from dashboard)
    │
    ├─── Default values
    │       ├── Name: "Untitled Workflow" (auto-generated)
    │       ├── Description: empty
    │       └── Immediately editable on canvas
    │
    └─── RESULT: New workflow created, user in canvas editor
```

---

## 4. Search and Filter Workflows

```
[Dashboard — search bar]
    │
    ├─── Type in search input
    │       ├── Real-time filtering (debounced 200ms)
    │       ├── Searches: workflow name, description, agent names
    │       ├── Results update instantly in grid/list
    │       ├── No results → "No workflows match your search" + [Clear Search]
    │       └── Escape → Clear search
    │
    ├─── Sort options (dropdown next to search)
    │       ├── Last edited (default)
    │       ├── Name (A-Z)
    │       ├── Name (Z-A)
    │       ├── Created (newest first)
    │       └── Most runs
    │
    ├─── Filter chips (below search, optional)
    │       ├── Status: All · Active · Draft · Error
    │       └── Tags: User-defined tags (future feature)
    │
    └─── RESULT: Filtered and sorted workflow list
```

---

## 5. Workflow CRUD Operations

### 5a. Rename Workflow

```
[Dashboard — workflow context menu]
    │
    ├─── Click [⋮] → "Rename"
    │       ├── Inline edit: name text becomes editable
    │       ├── Auto-select all text
    │       ├── Enter → Save
    │       ├── Escape → Cancel
    │       └── Click outside → Save
    │
    └─── RESULT: Workflow name updated
```

### 5b. Duplicate Workflow

```
[Dashboard — workflow context menu]
    │
    ├─── Click [⋮] → "Duplicate"
    │       ├── New workflow created: "Original Name (Copy)"
    │       ├── All nodes, edges, and configuration copied
    │       ├── New workflow appears in list with highlight animation
    │       └── Toast: "Workflow duplicated" + [Open] link
    │
    └─── RESULT: Independent copy of workflow created
```

### 5c. Delete Workflow

```
[Dashboard — workflow context menu]
    │
    ├─── Click [⋮] → "Delete"
    │       ├── Confirmation dialog:
    │       │   ├── "Delete 'Research Pipeline'?"
    │       │   ├── "This will also delete 12 run histories."
    │       │   ├── "This action cannot be undone."
    │       │   ├── [Cancel] (default focus)
    │       │   └── [Delete] (red, destructive)
    │       │
    │       ├── Confirm → Workflow removed
    │       │   ├── Card/row removed with fade-out animation
    │       │   └── Toast: "Workflow deleted" + [Undo] (30-second window)
    │       │
    │       └── Cancel → Dialog dismissed, no action
    │
    └─── RESULT: Workflow and associated data removed (soft-delete with 30s undo)
```

---

## 6. Usage Stats Display

```
[Dashboard — usage summary section]
    │
    ├─── Usage card (bottom of dashboard or sidebar)
    │       ┌─────────────────────────────────────┐
    │       │  This Month                          │
    │       │  ████████████░░░░░░  42 / 100 runs   │
    │       │  ███░░░░░░░░░░░░░░  3 / 10 workflows │
    │       │                                      │
    │       │  Resets in 23 days                    │
    │       │  [View Details] [Upgrade Plan]        │
    │       └─────────────────────────────────────┘
    │
    ├─── Near limit (≥80%)
    │       ├── Progress bar turns amber
    │       ├── Banner: "You've used 85% of your monthly runs"
    │       └── [Upgrade] CTA more prominent
    │
    ├─── At limit (100%)
    │       ├── Progress bar turns rose
    │       ├── Banner: "Run limit reached. Upgrade to continue."
    │       ├── [Run] buttons disabled on workflow cards
    │       └── Modal on attempt: "You've used all 100 runs this month. [Upgrade] or wait for reset."
    │
    ├─── Click [View Details]
    │       └── Navigate to /dashboard/usage
    │           ├── Run history chart (bar chart, daily/weekly)
    │           ├── Per-workflow breakdown
    │           ├── Cost tracking (token usage, estimated costs)
    │           └── [Export Usage Report] (CSV)
    │
    └─── RESULT: User understands their usage and upgrade path
```

---

## 7. Workflow Status Lifecycle

```
Status flow:

    Draft ──────► Active ──────► Error
      │              │              │
      │              │              └──► Active (after fix)
      │              │
      │              └──► Archived (manual)
      │
      └──► Deleted (soft delete, 30s undo)

Status definitions:
    ├── Draft: Created but never run (or no successful run)
    ├── Active: Has at least one successful run
    ├── Error: Last run failed
    └── Archived: Manually archived by user (hidden from default view)
```

---

## 8. Edge Cases

| Scenario | Behavior |
|----------|----------|
| Slow network on dashboard load | Skeleton card placeholders while loading |
| Workflow fails to load | Error card: "Unable to load workflow. [Retry]" |
| Concurrent editing (same workflow, two tabs) | "This workflow is open in another tab" warning on save conflict |
| Bulk operations | Multi-select checkbox on cards/rows → bulk delete/export |
| Large number of workflows (100+) | Paginated (20 per page) or infinite scroll with virtualization |
| Workflow name very long | Truncated with ellipsis in card/list; full name in tooltip |

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-04-08 | UX/UI Agent | Initial dashboard and workflow management user flows |
