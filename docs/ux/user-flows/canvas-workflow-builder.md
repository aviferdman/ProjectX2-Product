# User Flow: Visual Canvas — Workflow Builder

> **TASK-128** · P0 · UX/UI · Phase 2 (Epic 17)  
> User flows for creating, editing, and managing workflows on the visual canvas.

---

## 1. Create New Workflow

```
[Dashboard]
    │
    ├─── Click [+ New Workflow]
    │        │
    │        ├─── Modal: "New Workflow"
    │        │       ├── Name field (auto-focus, placeholder: "Untitled Workflow")
    │        │       ├── Description (optional)
    │        │       ├── [Start from scratch] → CREATE → Redirect to /canvas/:newId
    │        │       └── [Use a template] → Redirect to /templates
    │        │
    │        └─── OR: Keyboard shortcut (Ctrl+N from dashboard)
    │
    └─── Import workflow
             ├── Click [Import] on dashboard
             ├── File picker (accept .json, .yaml)
             ├── Validate file format
             ├── Show preview (node count, agent list)
             └── [Import] → CREATE → Redirect to /canvas/:newId

    RESULT: Empty canvas with toolbar, sidebar, and properties panel visible
```

### Error states
- **Name conflict:** "A workflow with this name already exists. Rename or overwrite?"
- **Import invalid:** "This file doesn't appear to be a valid Crewspace workflow. Check the format."
- **Quota exceeded:** "You've reached your workflow limit (X/Y). Upgrade to create more."

---

## 2. Add Nodes to Canvas

### 2a. Via Sidebar Drag-and-Drop

```
[Canvas with sidebar open]
    │
    ├─── Browse node categories in sidebar
    │       ├── Agents (violet section)
    │       ├── Tasks (sky section)
    │       ├── Tools (emerald section)
    │       └── LLM Providers (amber section)
    │
    ├─── Click and hold on a node type
    │       │
    │       ├── Ghost preview appears, attached to cursor
    │       ├── Sidebar shows drop zone indicator on canvas
    │       │
    │       ├── Drag onto canvas
    │       │   ├── Canvas shows valid drop zone highlight
    │       │   ├── Release mouse → Node created at drop position
    │       │   ├── Node snaps to grid (if snap enabled)
    │       │   └── Properties panel opens for the new node
    │       │
    │       └── Drag outside canvas / release early
    │           └── Ghost disappears, no action taken
    │
    └─── RESULT: Node appears on canvas, selected, properties panel open
```

### 2b. Via Toolbar Quick-Add

```
[Canvas]
    │
    ├─── Click [+Agent] / [+Task] / [+Tool] / [+LLM] on toolbar
    │       │
    │       ├── Node created at center of current viewport
    │       ├── Node auto-selected
    │       └── Properties panel opens
    │
    └─── RESULT: Node at viewport center, ready for configuration
```

### 2c. Via Context Menu

```
[Canvas empty area]
    │
    ├─── Right-click on empty canvas space
    │       │
    │       ├── Context menu appears:
    │       │   ├── Add Agent
    │       │   ├── Add Task
    │       │   ├── Add Tool
    │       │   ├── Add LLM Provider
    │       │   ├── ──────────────
    │       │   ├── Paste (if clipboard has nodes)
    │       │   ├── Select All
    │       │   └── Canvas Settings
    │       │
    │       └── Click "Add Agent" → Node created at click position
    │
    └─── RESULT: Node at right-click position
```

### 2d. Via Quick-Add Palette (Double-Click)

```
[Canvas empty area]
    │
    ├─── Double-click on empty space
    │       │
    │       ├── Search popover appears (command-palette style)
    │       │   ├── Text input (auto-focused)
    │       │   ├── Type to filter available node types
    │       │   ├── Up/Down arrows to navigate results
    │       │   ├── Enter to select → Node created at double-click position
    │       │   └── Escape to dismiss
    │       │
    │       └── Example: Type "res" → shows "Research Agent (template)"
    │
    └─── RESULT: Node at double-click position, properties panel open
```

---

## 3. Configure a Node

```
[Node selected on canvas]
    │
    ├─── Properties panel is open (right side, 320px)
    │
    ├─── General section
    │       ├── Name: Edit inline text field
    │       ├── Role: Edit inline text field (agents only)
    │       └── Goal: Edit multiline textarea (agents only)
    │
    ├─── Configuration section
    │       ├── LLM Provider: Dropdown → select from installed providers
    │       │   └── If none: "No LLM configured. [Add from Marketplace]"
    │       ├── Temperature: Slider (0.0 – 2.0, default 0.7)
    │       ├── Tools: [+Add Tool] → dropdown of available tools
    │       │   └── Each tool shows as removable chip
    │       └── Task-specific: Dependencies dropdown (select upstream tasks)
    │
    ├─── Connections section (read-only summary)
    │       ├── Inputs: List of connected source nodes
    │       └── Outputs: List of connected target nodes
    │
    ├─── Advanced section (collapsible)
    │       ├── Max retries: Number input (default 3)
    │       ├── Timeout: Duration input (default 30s)
    │       └── Backstory: Multiline textarea (agents only)
    │
    └─── Changes auto-save (debounced 500ms, no explicit save button)
         └── Status: "Saved" indicator in properties panel header

    RESULT: Node configuration persisted, canvas reflects any visual changes
```

### Validation feedback
- **Missing required field:** Orange warning icon next to field, tooltip: "This field is required"
- **Invalid value:** Red border on input, inline error message below
- **Circular dependency:** Red warning banner: "This would create a circular dependency"

---

## 4. Connect Nodes (Create Edges)

```
[Canvas with 2+ nodes]
    │
    ├─── Hover over output handle (right side of source node)
    │       ├── Handle highlights violet
    │       └── Cursor changes to crosshair
    │
    ├─── Click and drag from output handle
    │       │
    │       ├── Ghost edge appears, following cursor
    │       ├── Valid input handles on other nodes glow/pulse
    │       │
    │       ├── Hover over valid input handle (left side of target node)
    │       │   ├── Handle pulses violet
    │       │   ├── Snap indicator appears
    │       │   └── Release mouse → Edge created with spring animation (300ms)
    │       │
    │       ├── Hover over invalid target (self-loop, duplicate, cycle)
    │       │   ├── Handle shows red indicator
    │       │   ├── Tooltip: "Cannot connect — would create a cycle"
    │       │   └── Release mouse → Edge snaps back (spring animation)
    │       │
    │       └── Release on empty space
    │           └── Ghost edge disappears, no action
    │
    └─── RESULT: Smoothstep edge drawn between nodes, arrow at target

    POST-CONNECTION:
    ├── Properties panel of target node updates "Connections" section
    ├── Data flow animation plays briefly on new edge (sky dash pattern)
    └── Undo available (Ctrl+Z removes the edge)
```

---

## 5. Select, Move, and Arrange Nodes

### 5a. Selection

```
Single select:    Click node → selected (violet ring + glow)
Multi-select:     Ctrl+Click → toggle node in selection
Box select:       Click+drag on empty space → marquee rectangle
                  → All nodes inside are selected
Select all:       Ctrl+A → all nodes selected
Deselect:         Click empty space or press Escape
```

### 5b. Move

```
[Node(s) selected]
    │
    ├─── Click and drag selected node(s)
    │       ├── Nodes follow cursor with snap-to-grid (10px)
    │       ├── Connected edges update in real-time
    │       └── Multi-select: all selected nodes move together (relative positions maintained)
    │
    └─── RESULT: Nodes at new position, edges redrawn
```

### 5c. Arrange / Auto-Layout

```
[Canvas with multiple nodes]
    │
    ├─── Toolbar → Menu → "Auto Layout"
    │       ├── Options: Left-to-Right, Top-to-Bottom, Radial
    │       ├── Preview shown (semi-transparent ghost positions)
    │       ├── [Apply] → Animated transition to new positions (500ms)
    │       └── [Cancel] → Dismiss, no change
    │
    └─── RESULT: Nodes arranged neatly, edges rerouted
```

---

## 6. Delete Nodes and Edges

```
[Node or edge selected]
    │
    ├─── Press Delete/Backspace key
    │       ├── If node: Remove node and all connected edges
    │       ├── If edge: Remove edge only
    │       ├── Confirmation NOT required for single items
    │       └── Undo available (Ctrl+Z)
    │
    ├─── Right-click → "Delete" in context menu
    │       └── Same behavior as Delete key
    │
    ├─── Edge-specific: Click midpoint × button
    │       └── Edge removed immediately
    │
    └─── Bulk delete (multiple items selected)
         ├── "Delete X items?" confirmation dialog
         ├── Lists what will be removed (nodes, edges)
         ├── [Delete] (destructive, red) or [Cancel]
         └── Undo available for bulk operations

    RESULT: Items removed from canvas, properties panel closes if selected item was deleted
```

---

## 7. Run Workflow from Canvas

```
[Canvas with valid workflow]
    │
    ├─── Click [▶ Run Workflow] in toolbar
    │       │
    │       ├── Pre-run validation
    │       │   ├── CHECK: At least one agent and one task exist
    │       │   ├── CHECK: All required fields populated
    │       │   ├── CHECK: No disconnected subgraphs (warning, not blocking)
    │       │   ├── CHECK: LLM provider configured
    │       │   │
    │       │   ├── PASS → Run starts
    │       │   └── FAIL → Validation errors shown:
    │       │       ├── Toast notification: "X issues found"
    │       │       ├── Problem nodes highlighted with red border
    │       │       └── Click toast → scroll to first problem node
    │       │
    │       ├── Running state
    │       │   ├── Toolbar: [▶ Run] → [■ Stop] (changes to stop button)
    │       │   ├── Active nodes pulse emerald
    │       │   ├── Completed nodes flash emerald briefly
    │       │   ├── Failed nodes pulse rose
    │       │   ├── Edges animate data flow (dash pattern on active edges)
    │       │   └── Status bar shows: "Running... 3/7 tasks complete"
    │       │
    │       ├── Completion
    │       │   ├── Success: Toast "Workflow completed in Xs" + green checkmark
    │       │   │   └── [View Debug Timeline] link in toast
    │       │   ├── Partial failure: Toast "Workflow completed with errors"
    │       │   │   └── Failed nodes remain highlighted in rose
    │       │   └── Full failure: Toast "Workflow failed" with error summary
    │       │       └── [View Logs] link
    │       │
    │       └── Stop (user-initiated)
    │           ├── Click [■ Stop]
    │           ├── Confirmation: "Stop running workflow?"
    │           ├── [Stop] → Graceful shutdown, in-progress tasks cancelled
    │           └── Status: "Stopped by user"
    │
    └─── RESULT: Run complete, debug timeline available at /canvas/:id/debug/:runId
```

---

## 8. Save and Export Workflow

### 8a. Auto-Save

```
[Any canvas change]
    │
    ├─── Debounced auto-save (500ms after last change)
    ├─── Status indicator in toolbar: "Saving..." → "Saved ✓"
    ├─── Conflict detection: If workflow was edited elsewhere
    │       ├── Toast: "This workflow was edited in another session"
    │       └── [Reload] or [Keep my changes]
    │
    └─── Manual save: Ctrl+S → Immediate save + "Saved ✓" indicator
```

### 8b. Export

```
[Canvas]
    │
    ├─── Toolbar → Menu → "Export"
    │       ├── Format options:
    │       │   ├── JSON (Crewspace format — re-importable)
    │       │   ├── YAML (human-readable)
    │       │   └── TypeScript (code equivalent — read-only reference)
    │       ├── [Download] → File saved to user's device
    │       └── [Copy to clipboard] → JSON/YAML copied
    │
    └─── RESULT: Workflow exported in chosen format
```

---

## 9. Canvas Zoom and Pan

```
Zoom in:     Ctrl+Scroll Up / Pinch out / Toolbar [+]
Zoom out:    Ctrl+Scroll Down / Pinch in / Toolbar [-]
Fit view:    Toolbar [Fit] or press F → Zoom to fit all nodes
Pan:         Space+Drag / Middle-click drag / Hand tool + drag
Reset:       Double-click Fit button → Reset to 100% centered

Zoom range:  10% – 200% (displayed in status bar)
Zoom steps:  10% increments via toolbar buttons
```

---

## 10. Edge Cases and Error Handling

| Scenario | Behavior |
|----------|----------|
| Empty canvas — click Run | Validation error: "Add at least one agent and one task" |
| Disconnect during auto-save | Queued saves; retry on reconnect; banner "Offline — changes will save when reconnected" |
| Very large workflow (50+ nodes) | Performance mode: reduce animations, simplify edge rendering, suggest auto-layout |
| Undo stack overflow | Keep last 100 operations; older operations silently dropped |
| Browser back from canvas | Prompt: "Leave editor? Unsaved changes will be lost" (only if auto-save failed) |
| Duplicate workflow | Dashboard → right-click → "Duplicate" → New workflow with " (Copy)" suffix |

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-04-08 | UX/UI Agent | Initial canvas workflow builder user flows |
