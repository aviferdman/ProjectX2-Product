# Drag-and-Drop Interactions & Feedback States

> **TASK-134** · P1 · UX/UI · Phase 2 (Epic 17: Visual Canvas UI)  
> Complete interaction specification for all drag-and-drop behaviors on the Crewspace canvas, including visual feedback states, timing, animations, accessibility, and edge cases.

---

## 1. Overview

The Crewspace canvas supports five drag-and-drop interaction types:

| # | Interaction | Source | Target | Purpose |
|---|------------|--------|--------|---------|
| 1 | **Sidebar → Canvas** | Node palette item | Canvas viewport | Add a new node |
| 2 | **Toolbar → Canvas** | Toolbar "+" button | Canvas viewport (center) | Quick-add node |
| 3 | **Node Move** | Selected node(s) | New canvas position | Reposition nodes |
| 4 | **Handle → Handle** | Output handle | Input handle | Create edge (connection) |
| 5 | **Canvas Pan** | Empty canvas space | — | Navigate viewport |

All interactions follow a **consistent three-phase model**: Initiate → Drag → Release, with clear feedback at each phase.

---

## 2. Sidebar-to-Canvas Drag (Node Creation)

### 2.1 Initiation

| Step | Trigger | Visual Feedback | Timing |
|------|---------|----------------|--------|
| Hover palette item | Mouse enters sidebar item | Item background lightens (`var(--cs-surface-hover)`), cursor → `grab` | Instant |
| Press and hold | `mousedown` / `pointerdown` on item | Item depresses (scale `0.97`, 100ms ease-out) | 0ms |
| Drag threshold | Pointer moves ≥ 4px from press point | **Ghost node** spawns at cursor, sidebar item returns to idle | 0–50ms |

**Ghost node specification:**

| Property | Value |
|----------|-------|
| Content | Simplified node preview: icon + title only (no body/handles) |
| Size | 180 × 48px (compact preview) |
| Opacity | `0.85` |
| Border | 2px dashed, node-type color (e.g., `#7c3aed` for Agent) |
| Background | Node-type tinted background at 15% opacity |
| Shadow | `0 8px 24px rgba(0,0,0,0.4)` (elevated float shadow) |
| Cursor | `grabbing` |
| Position | Centered on cursor (offset: -90px, -24px) |
| Scale entrance | `0 → 1` over 150ms with spring easing (`spring(1, 80, 10)`) |

### 2.2 Drag Phase — Over Sidebar

While the ghost is still over the sidebar area:

- Sidebar items below ghost dim slightly (5% opacity reduction)
- No canvas feedback yet
- Scrolling the sidebar is disabled during drag

### 2.3 Drag Phase — Entering Canvas

| Event | Visual Feedback |
|-------|----------------|
| Ghost crosses sidebar→canvas boundary | Canvas drop zone activates: subtle blue-violet overlay pulse on entire canvas (100ms fade-in, 8% opacity) |
| Ghost over valid canvas space | Grid dots nearest to ghost brighten (`rgba(148,163,184,0.3)`) in a 3×3 area, indicating snap position |
| Ghost near existing node (< 40px) | **Proximity indicator**: thin violet guideline appears showing alignment (horizontal or vertical center alignment) |
| Snap-to-grid active | Ghost position snaps to nearest 10px grid intersection. Snap visualized by dot under ghost glowing violet |

### 2.4 Drag Phase — Invalid Zones

| Zone | Visual Feedback |
|------|----------------|
| Over toolbar area | Ghost cursor → `not-allowed`, ghost opacity → `0.4`, drop zone overlay disappears |
| Over properties panel | Ghost cursor → `not-allowed`, ghost opacity → `0.4` |
| Over minimap | Ghost cursor → `not-allowed`, ghost opacity → `0.4` |
| Outside browser window | Ghost disappears, operation cancels on `pointerup` outside |

### 2.5 Release — Successful Drop

| Step | Visual Feedback | Timing |
|------|----------------|--------|
| Release on valid canvas area | Ghost freezes at drop position | 0ms |
| Ghost → Full node morph | Ghost expands to full node (220px width), gains body + handles, opacity → `1.0` | 250ms (spring easing) |
| Node entrance animation | Node scales `1.05 → 1.0` with subtle bounce, border flashes node-type color | 200ms |
| Selection ring | Violet selection ring + glow appears (node is auto-selected) | 50ms after entrance |
| Properties panel | Panel slides in from right (or updates if already open) | 300ms ease-out |
| Canvas drop zone overlay | Fades out | 150ms |
| Toast (optional) | "Agent added" — subtle inline confirmation in status bar | 0ms, auto-dismiss 2s |

**Post-drop state:**
- New node is selected (violet ring, outer glow)
- Properties panel is open and focused on the "Name" field
- Undo is available (`Ctrl+Z` removes the node)

### 2.6 Release — Cancelled Drop

| Trigger | Visual Feedback | Timing |
|---------|----------------|--------|
| Release on invalid zone | Ghost snaps back to sidebar with spring animation | 300ms |
| Press `Escape` during drag | Ghost fades out | 150ms |
| Release outside window | Ghost fades out (no sidebar snap) | 150ms |

---

## 3. Toolbar Quick-Add (Click-to-Place)

Toolbar "+Agent", "+Task", "+Tool", "+LLM" buttons use a **click-to-place** pattern rather than true drag-and-drop:

| Step | Behavior | Timing |
|------|----------|--------|
| Click toolbar button | Button depresses (active state), node spawns at **viewport center** | Instant |
| Node entrance | Same entrance animation as sidebar drop (scale `1.05 → 1.0`, bounce) | 250ms |
| Auto-select | Node selected, properties panel opens | 50ms after entrance |
| Stacking offset | If viewport center already has a node, offset new node by (+30px, +30px) to avoid overlap | Auto |

### Toolbar button states during add

| State | Visual |
|-------|--------|
| Idle | Icon in node-type color, transparent background |
| Hover | Background → `var(--cs-surface-hover)`, tooltip: "Add Agent" (200ms delay) |
| Active / Pressed | Background → node-type color at 20% opacity, icon brightens |
| After click | Brief flash of node-type color (150ms), then return to idle |

---

## 4. Node Move (Reposition)

### 4.1 Single Node Move

| Step | Trigger | Visual Feedback | Timing |
|------|---------|----------------|--------|
| Hover node | Mouse enters node bounds | Subtle shadow lift (`node-hover` shadow), cursor → `grab` | Instant |
| Press node | `mousedown` on node | Node shadow deepens slightly, cursor → `grabbing` | 0ms |
| Drag threshold (4px) | Movement begins | Node lifts: shadow expands to `0 12px 32px rgba(0,0,0,0.5)`, z-index rises above siblings | 100ms ease-out |
| Dragging | Pointer moves | Node position tracks cursor (snapped to 10px grid). Connected edges redraw in real-time (60fps). Alignment guidelines appear when node center aligns with another node (±2px tolerance) | Continuous |
| Release | `mouseup` / `pointerup` | Node settles: shadow returns to default (`node-shadow`), z-index normalizes | 150ms ease-out |

### 4.2 Multi-Node Move

| Step | Behavior |
|------|----------|
| Select multiple nodes | Via Ctrl+Click, box select, or Ctrl+A |
| Drag any selected node | **All** selected nodes move together, maintaining relative positions |
| Visual: dragged node | Full feedback (shadow lift, z-index) |
| Visual: other selected nodes | Lighter shadow lift (50% of dragged node elevation), dotted violet outline |
| Connected edges | All edges involving selected nodes update in real-time |
| Release | All nodes settle simultaneously |

### 4.3 Alignment Guidelines

Smart alignment guidelines appear during node movement to help users create clean layouts:

| Guideline Type | Trigger | Visual |
|---------------|---------|--------|
| **Horizontal center** | Dragged node center-Y aligns with another node center-Y (±2px) | Dashed violet line across canvas at aligned Y coordinate |
| **Vertical center** | Dragged node center-X aligns with another node center-X (±2px) | Dashed violet line across canvas at aligned X coordinate |
| **Edge alignment** | Dragged node top/bottom/left/right edge aligns with another | Thin solid slate line at aligned coordinate |
| **Equal spacing** | Gap between consecutive aligned nodes matches | Pink distance markers showing gap value (e.g., "40px") |

Guidelines are:
- Color: `var(--cs-violet-400)` at 60% opacity for center guides, `var(--cs-slate-500)` for edge guides
- Line style: 1px dashed (center) or 1px solid (edge)
- Appear/disappear: instant (no animation delay)
- Dismissed immediately when node moves out of alignment range

### 4.4 Canvas Boundary Behavior

| Situation | Behavior |
|-----------|----------|
| Drag node near canvas edge (within 40px of viewport boundary) | **Auto-scroll**: canvas pans in drag direction at 200px/s, accelerating to 600px/s at edge |
| Drag node onto sidebar/panel | Canvas does not scroll; node position clamps at panel boundary |
| Drag node past minimap | Node can overlap minimap (minimap has lower z-index) |

---

## 5. Handle-to-Handle Drag (Edge Creation)

### 5.1 Initiation

| Step | Trigger | Visual Feedback | Timing |
|------|---------|----------------|--------|
| Hover output handle | Mouse within 20px hit area of output handle | Handle fill → `#7c3aed` (violet), handle border brightens, cursor → `crosshair` | 100ms |
| Press handle | `mousedown` on handle | Handle scales `1.3×`, all compatible input handles on **other** nodes begin pulsing (violet glow, 1.5s infinite) | 0ms for scale, 200ms for pulse start |

### 5.2 Drag Phase — Ghost Edge

| Property | Value |
|----------|-------|
| Start point | Center of source output handle |
| End point | Cursor position |
| Style | 2px stroke, `var(--cs-violet-400)`, dashed (`4 4` pattern) |
| Animation | Dashes flow toward cursor (animated dash offset) |
| Curvature | Smoothstep path matching final edge style |

### 5.3 Drag Phase — Target Feedback

| Scenario | Visual Feedback |
|----------|----------------|
| Over empty canvas | Ghost edge follows cursor normally |
| Approaching valid input handle (< 60px) | Target handle glows brighter, magnetic pull — ghost edge snaps to handle center when within 20px |
| Directly over valid input handle | Handle fills solid violet, pulses once (scale `1.4 → 1.0`, 200ms), ghost edge solidifies (dashed → solid) |
| Over invalid target: same node (self-loop) | Ghost edge turns red (`#fb7185`), cursor → `not-allowed`, tooltip: "Cannot connect to self" |
| Over invalid target: already connected | Ghost edge turns red, tooltip: "Already connected" |
| Over invalid target: would create cycle | Ghost edge turns red, tooltip: "Would create a circular dependency" |
| Over node body (not a handle) | No snap; ghost edge follows cursor |

### 5.4 Compatible Handle Discovery

When a drag starts from an output handle, the system highlights all valid drop targets:

| Handle State | Visual |
|-------------|--------|
| **Compatible input (unconnected)** | Violet pulse glow (1.5s ease-in-out infinite), handle border → violet |
| **Compatible input (already has connection)** | Amber pulse glow (indicates will replace existing connection) |
| **Incompatible input** | No change (remains default dark slate) |
| **All output handles** | No change (you can't connect output → output) |

### 5.5 Release — Successful Connection

| Step | Visual Feedback | Timing |
|------|----------------|--------|
| Release on valid input handle | Ghost edge freezes | 0ms |
| Edge creation animation | Ghost morphs to final smoothstep edge with spring animation. Color transitions dashed violet → solid slate. Arrow appears at target. | 300ms (spring easing) |
| Data flow celebration | Brief sky-blue dash flow animation along new edge | 800ms, then stops |
| Handle states reset | All pulsing handles return to default | 200ms fade-out |
| Source handle | Returns to "connected" state (solid violet fill) |
| Target handle | Returns to "connected" state (solid violet fill) |
| Properties panel | Target node's "Connections" section updates to show new input | Instant |
| Undo | `Ctrl+Z` removes the edge | — |

### 5.6 Release — Failed Connection

| Trigger | Visual Feedback | Timing |
|---------|----------------|--------|
| Release on empty canvas | Ghost edge retracts to source handle with spring animation | 250ms |
| Release on invalid target | Ghost edge flashes red once, then retracts | Red flash 100ms + retract 250ms |
| Press `Escape` | Ghost edge fades out immediately | 100ms |

### 5.7 Reverse Connection (Input → Output)

Users may also initiate a connection from an **input** handle:

| Behavior | Description |
|----------|-------------|
| Drag from input handle | Same interaction pattern, but roles are reversed — ghost edge originates from input, compatible **output** handles pulse |
| Valid target | Output handle on another node |
| Edge direction | Always stored as source→target regardless of drag direction |

---

## 6. Canvas Pan (Viewport Navigation)

| Method | Trigger | Visual Feedback |
|--------|---------|----------------|
| **Empty-space drag** | Click+drag on empty canvas | Cursor → `grabbing`, canvas translates smoothly (1:1 with pointer), grid dots flow | Continuous |
| **Space+drag** | Hold Space, then drag anywhere | Cursor → `grab` (on Space press) → `grabbing` (on drag). Overrides node interactions. | Continuous |
| **Middle-click drag** | Middle-mouse-button drag | Same as empty-space drag | Continuous |
| **Minimap drag** | Drag viewport rectangle on minimap | Canvas pans correspondingly, viewport rect follows pointer | Continuous |

### Pan inertia (optional enhancement)

After releasing a fast pan gesture:
- Canvas continues moving with deceleration (friction `0.95` per frame)
- Duration: up to 500ms
- Any new interaction immediately stops inertia

---

## 7. Zoom Interactions

| Method | Trigger | Behavior |
|--------|---------|----------|
| `Ctrl+Scroll` | Scroll wheel with Ctrl held | Zoom centered on cursor position. 10% increments. Range: 10%–200%. |
| Pinch gesture | Two-finger pinch on trackpad | Smooth zoom centered between fingers |
| Toolbar `+`/`-` | Click zoom buttons | 10% increment/decrement, centered on viewport center |
| Fit View (`F` key) | Press `F` | Animated zoom+pan to fit all nodes with 48px padding. 400ms ease-out. |

### Zoom feedback

| State | Visual |
|-------|--------|
| Zoom level < 50% | Node labels hide, nodes become simplified rectangles with type-color fill |
| Zoom level < 25% | Nodes become colored dots (8px), edges become 1px lines |
| Zoom level display | Bottom-right corner shows "75%" label (fades in on zoom change, fades out after 1.5s) |

---

## 8. Feedback State Matrix

Complete visual state reference for all draggable elements:

### 8.1 Node States During Drag Operations

| State | Border | Shadow | Opacity | Scale | Z-Index | Cursor |
|-------|--------|--------|---------|-------|---------|--------|
| **Idle** | 1.5px type-color | `node-shadow` | 1.0 | 1.0 | `auto` | `default` |
| **Hover** | 2px type-color | `node-hover` | 1.0 | 1.0 | `auto` | `grab` |
| **Pressed** | 2px type-color | `node-hover` | 1.0 | 0.98 | `auto` | `grabbing` |
| **Dragging** | 2px violet | `0 12px 32px rgba(0,0,0,0.5)` | 1.0 | 1.0 | `1000` | `grabbing` |
| **Dragging (co-selected)** | 2px violet dashed | `0 8px 16px rgba(0,0,0,0.3)` | 0.9 | 1.0 | `999` | — |
| **Drop target (valid)** | 2px violet pulse | `node-hover` + violet glow | 1.0 | 1.02 | `auto` | — |
| **Drop target (invalid)** | 2px rose | `node-shadow` | 0.6 | 1.0 | `auto` | `not-allowed` |
| **Ghost (sidebar drag)** | 2px dashed type-color | `0 8px 24px rgba(0,0,0,0.4)` | 0.85 | 1.0 | `2000` | `grabbing` |

### 8.2 Handle States During Edge Creation

| State | Fill | Border | Scale | Animation |
|-------|------|--------|-------|-----------|
| **Default (unconnected)** | `#1e293b` | `#64748b` | 1.0 | None |
| **Default (connected)** | `#8b5cf6` | `#a78bfa` | 1.0 | None |
| **Hover** | `#7c3aed` | `#a78bfa` | 1.2 | None |
| **Pressed (drag source)** | `#7c3aed` | `#c4b5fd` | 1.3 | None |
| **Compatible target (pulsing)** | `#7c3aed` (pulsing) | `#a78bfa` | 1.0 → 1.2 (pulse) | 1.5s ease-in-out infinite |
| **Snap target (within 20px)** | `#a78bfa` (solid) | `#c4b5fd` | 1.4 | Single pulse, then hold |
| **Invalid target** | `#fb7185` | `#fda4af` | 1.0 | None |

### 8.3 Edge States During Interactions

| State | Stroke | Width | Style | Animation |
|-------|--------|-------|-------|-----------|
| **Default** | `#64748b` | 2px | Smoothstep solid | None |
| **Hover** | `#94a3b8` | 3px | Smoothstep solid | None |
| **Selected** | `#a78bfa` | 3px | Smoothstep solid | None |
| **Ghost (being created)** | `#a78bfa` | 2px | Smoothstep dashed (`4 4`) | Dash flow toward target |
| **Ghost (invalid target)** | `#fb7185` | 2px | Smoothstep dashed (`4 4`) | None |
| **Data flow (active)** | `#38bdf8` | 2px | Smoothstep dashed (`5 5`) | 1s dash loop |
| **Error** | `#fb7185` | 2px | Smoothstep solid | Pulse opacity 0.6→1.0 |

---

## 9. Animation Timing Reference

All animations use CSS custom properties for easy tuning and reduced-motion overrides.

| Token | Value | Usage |
|-------|-------|-------|
| `--cs-anim-ghost-enter` | `150ms spring(1, 80, 10)` | Ghost node spawn |
| `--cs-anim-node-entrance` | `250ms spring(1, 100, 12)` | New node placed on canvas |
| `--cs-anim-node-lift` | `100ms ease-out` | Node shadow lift on drag start |
| `--cs-anim-node-settle` | `150ms ease-out` | Node shadow return on drag end |
| `--cs-anim-edge-create` | `300ms spring(1, 80, 10)` | Edge creation (ghost → final) |
| `--cs-anim-edge-retract` | `250ms spring(1, 120, 14)` | Edge snap-back on failed connection |
| `--cs-anim-handle-pulse` | `1.5s ease-in-out infinite` | Compatible handle discovery pulse |
| `--cs-anim-snap-flash` | `100ms ease-out` | Grid snap indicator flash |
| `--cs-anim-panel-slide` | `300ms ease-out` | Properties panel entrance |
| `--cs-anim-guideline` | `0ms` (instant) | Alignment guide appear/disappear |
| `--cs-anim-zoom-label` | `1500ms` (display duration) | Zoom level indicator |
| `--cs-anim-auto-scroll` | `200–600px/s` (velocity range) | Edge auto-scroll when dragging near boundary |

---

## 10. Drag Threshold & Sensitivity

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Drag threshold** | 4px from initial press point | Prevents accidental drags on click; standard across drag libraries |
| **Handle hit area** | 20px diameter (10px visual) | Expanded hit area for small targets per Fitts's Law |
| **Snap distance** | 20px from target handle center (edge creation) | Comfortable magnetic snap range |
| **Alignment tolerance** | ±2px | Tight enough for precision, loose enough to trigger reliably |
| **Auto-scroll zone** | 40px from viewport edge | Triggers viewport pan when dragging near edge |
| **Auto-scroll speed** | 200px/s (at zone entry) → 600px/s (at viewport edge) | Linear interpolation based on distance into zone |
| **Double-click timing** | < 300ms between clicks | For quick-add palette activation |

---

## 11. Touch & Trackpad Support

### Touch gestures (tablet/mobile)

| Gesture | Action |
|---------|--------|
| **Tap** | Select node/edge |
| **Long press (300ms)** | Initiate node drag (vibration haptic feedback on supported devices) |
| **Long press on handle** | Initiate edge creation |
| **Two-finger drag** | Pan canvas |
| **Pinch** | Zoom canvas |
| **Two-finger tap** | Undo |

### Touch-specific adaptations

| Adaptation | Description |
|-----------|-------------|
| Larger hit areas | Handle hit area → 32px on touch devices (vs 20px on desktop) |
| Long-press delay | 300ms hold before drag initiates (prevents scroll conflicts) |
| Drag handle affordance | Visible grip indicator on sidebar items (⋮⋮ dots) |
| No hover states | Skip hover feedback on touch (proceed directly to pressed/active) |
| Haptic feedback | Subtle vibration on: drag start, snap to grid, snap to handle, successful drop |

---

## 12. Accessibility Requirements

### 12.1 Keyboard Alternatives to Drag-and-Drop

Every drag-and-drop action must have a keyboard-accessible alternative:

| Drag Action | Keyboard Alternative |
|-------------|---------------------|
| Sidebar → Canvas (add node) | `Tab` to sidebar item → `Enter` to add at viewport center (same as toolbar quick-add) |
| Move node | Select node → `Arrow keys` move 10px per press (hold `Shift` for 1px precision) |
| Create edge | Select source node → `Tab` to output handle → `Enter` to start connection → `Tab` through candidate targets → `Enter` to connect, `Escape` to cancel |
| Pan canvas | `Arrow keys` when no node selected (or `Shift+Arrow` always pans) |
| Zoom | `Ctrl + =` zoom in, `Ctrl + -` zoom out, `Ctrl + 0` reset |
| Box select | Not available via keyboard; use `Ctrl+A` (select all) or `Ctrl+Click` |

### 12.2 Focus Management

| Context | Focus Behavior |
|---------|---------------|
| After node added | Focus moves to new node. Properties panel opens but does not steal focus. |
| After node deleted | Focus moves to nearest remaining node, or to canvas if none remain. |
| After edge created | Focus remains on source node. Screen reader announces connection. |
| During edge creation (keyboard) | Focus ring is visible on candidate target handles; `Tab` cycles through them |
| After panel opens | Focus stays on canvas; user can `Tab` into properties panel explicitly |

### 12.3 Screen Reader Announcements

Use ARIA live regions (`aria-live="polite"`) for drag operation announcements:

| Event | Announcement |
|-------|-------------|
| Drag started (sidebar) | "Dragging [Node Type]. Drop on canvas to add." |
| Node added | "[Node Type] added to canvas. [X] nodes total." |
| Node moved | "[Node Name] moved to position [X], [Y]." |
| Edge creation started | "Connecting from [Source Name] output. Tab to select target." |
| Edge created | "Connected [Source Name] to [Target Name]." |
| Edge creation cancelled | "Connection cancelled." |
| Invalid drop | "Cannot drop here. [Reason]." |
| Node deleted | "[Node Name] removed. [X] nodes remaining." |
| Alignment snap | "Aligned with [Other Node Name]." |

### 12.4 Reduced Motion

When `prefers-reduced-motion: reduce` is active:

| Normal Behavior | Reduced Motion Alternative |
|----------------|---------------------------|
| Ghost node spring animation | Instant appear (opacity `0 → 1`, 100ms) |
| Node entrance bounce | Instant appear (no scale) |
| Edge creation spring | Instant draw (no animation) |
| Edge retraction spring | Instant disappear |
| Handle pulse animation | Static highlight (solid violet, no pulse) |
| Data flow dash animation | Static dashed line (no movement) |
| Auto-scroll | Same speed but no easing (linear) |
| Pan inertia | Disabled (stops immediately on release) |
| Alignment guidelines | Same (already instant) |

### 12.5 High Contrast Mode

| Element | Adjustment |
|---------|-----------|
| Ghost node border | 3px solid (up from 2px dashed) |
| Alignment guidelines | 2px solid with higher opacity (80%) |
| Handle states | Increased color contrast; invalid targets use pattern fill (diagonal stripes) in addition to red color |
| Drop zone indicator | Higher contrast border instead of opacity overlay |

---

## 13. Error Handling & Edge Cases

### 13.1 Drag Interruptions

| Scenario | Behavior |
|----------|----------|
| Browser loses focus during drag | Cancel drag, remove ghost, restore original state |
| `Escape` pressed during any drag | Cancel immediately, animate ghost removal |
| Right-click during drag | Cancel drag (context menu should not appear during active drag) |
| Touch: second finger added during drag | Cancel node drag; if pinch detected, switch to zoom |
| Window resize during drag | Recalculate drop zones; keep node at cursor position |

### 13.2 Performance Safeguards

| Scenario | Behavior |
|----------|----------|
| Canvas has > 100 nodes | Disable alignment guidelines during drag (performance). Show only snap-to-grid. |
| Canvas has > 200 nodes | Simplify node rendering during drag (hide body text, show header only). Disable real-time edge redraw; batch update on drop. |
| Edge creation with > 50 candidate handles | Only pulse nearest 10 handles (sorted by distance to cursor) |
| Slow frame rate detected (< 30fps) | Disable ghost shadow, reduce snap calculations to every other frame |

### 13.3 Undo/Redo Integration

All drag-and-drop operations produce **undoable actions**:

| Action | Undo Effect | Redo Effect |
|--------|-------------|-------------|
| Add node (sidebar/toolbar) | Remove node | Re-add node at same position with same config |
| Move node(s) | Return to previous position(s) | Move to new position(s) |
| Create edge | Remove edge | Re-create edge |

- Undo/redo granularity: Each completed drop is one undo step
- Moving a node to multiple positions during one drag = one undo step (initial → final only)
- Batch operations (e.g., auto-layout) = one undo step

---

## 14. Implementation Notes

### 14.1 Recommended Technical Approach

| Concern | Approach |
|---------|----------|
| Drag engine | Use React Flow's built-in drag handling for node moves and edge creation. Use `@dnd-kit/core` or native HTML Drag API for sidebar → canvas. |
| Ghost rendering | React portal rendered at document body level (avoids clipping by sidebar overflow). |
| Hit testing | Use React Flow's `isValidConnection` callback for edge validation. |
| Snap-to-grid | React Flow's `snapGrid` prop (`[10, 10]`). Alignment guidelines computed in custom `onNodeDrag` handler. |
| Performance | Throttle alignment guide calculations to every 16ms (one frame at 60fps). Use `requestAnimationFrame` for smooth updates. |
| State | Drag state managed via React context: `{ isDragging, dragType, sourceId, ghostPosition, validTargets }` |

### 14.2 CSS Custom Properties for Drag States

```css
/* Drag feedback tokens */
--cs-drag-ghost-opacity: 0.85;
--cs-drag-ghost-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
--cs-drag-node-lift-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
--cs-drag-snap-color: var(--cs-violet-400);
--cs-drag-invalid-color: var(--cs-rose-400);
--cs-drag-guideline-color: rgba(167, 139, 250, 0.6);
--cs-drag-guideline-width: 1px;
--cs-drag-auto-scroll-zone: 40px;
--cs-drag-threshold: 4px;
--cs-drag-handle-hit-area: 20px;
--cs-drag-handle-hit-area-touch: 32px;
```

### 14.3 Testing Checklist

| Test | Method |
|------|--------|
| Drag from each sidebar category → canvas | Manual + E2E (Playwright) |
| Toolbar quick-add for each node type | E2E |
| Multi-select + group move | E2E |
| Edge creation (all valid scenarios) | E2E |
| Edge creation (all invalid scenarios: self, duplicate, cycle) | E2E |
| Keyboard-only node add + move + connect | Manual accessibility audit |
| Screen reader announcements (all events) | NVDA/VoiceOver manual test |
| Reduced motion preference respected | Toggle `prefers-reduced-motion`, verify |
| Touch drag on tablet viewport | Manual + BrowserStack |
| Performance with 100+ / 200+ nodes | Automated performance benchmark |
| Undo/redo for each drag action | E2E |
| Auto-scroll at canvas edge during drag | Manual |
| Alignment guidelines accuracy | Manual |

---

## Appendix: State Diagram

```
                    ┌──────────┐
                    │   IDLE   │
                    └────┬─────┘
                         │ mousedown / pointerdown
                         ▼
                    ┌──────────┐
                    │ PRESSED  │──── < 4px movement ──── click (select)
                    └────┬─────┘
                         │ ≥ 4px movement
                         ▼
          ┌──────────────────────────────┐
          │          DRAGGING            │
          │  ┌────────┐  ┌───────────┐  │
          │  │ Valid   │  │ Invalid   │  │
          │  │ zone    │  │ zone      │  │
          │  └────┬───┘  └─────┬─────┘  │
          └───────┼────────────┼────────┘
                  │            │
         mouseup  │    mouseup │  Escape
                  ▼            ▼    │
          ┌──────────┐  ┌──────────┐│
          │ DROPPED  │  │CANCELLED ││
          │ (success)│  │          │◄┘
          └────┬─────┘  └────┬─────┘
               │             │
               ▼             ▼
          ┌──────────┐  ┌──────────┐
          │ ANIMATE  │  │ RETRACT  │
          │ entrance │  │ / fade   │
          └────┬─────┘  └────┬─────┘
               │             │
               ▼             ▼
          ┌──────────────────────┐
          │        IDLE          │
          └──────────────────────┘
```

---

*Last updated: 2026-04-08 · TASK-134 · UX/UI Agent*
