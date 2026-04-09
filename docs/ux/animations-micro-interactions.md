# Animations & Micro-Interactions Specification

> **TASK-170** · P1 · UX/UI · Phase 2 (Epic 22: Responsive Layouts & Animations)  
> Complete specification of all animations and micro-interactions across Crewspace, including page transitions, hover states, loading feedback, state changes, and canvas interactions. Defines timing tokens, easing curves, and Framer Motion implementation patterns.

---

## 1. Design Principles

| Principle | Description |
|-----------|-------------|
| **Purposeful motion** | Every animation communicates something — spatial origin, state change, or user confirmation. No gratuitous movement. |
| **Fast by default** | Micro-interactions ≤ 200ms. Page transitions ≤ 400ms. Nothing should feel slow. |
| **Spring-natural** | Use spring-based easing for entries and emphasis. Linear or ease-out for exits and background motion. |
| **Reduced-motion safe** | All animations respect `prefers-reduced-motion: reduce`. Provide instant alternatives. |
| **GPU-friendly** | Animate only `transform` and `opacity` wherever possible. Avoid layout-triggering properties (`width`, `height`, `top`, `left`). |
| **Consistent vocabulary** | Reuse the same easing curves and durations across all screens. A card entering the dashboard should feel the same as a card entering the template library. |

---

## 2. Timing & Easing Tokens

All animation values are defined as design tokens for consistency. These map to CSS custom properties and Framer Motion presets.

### 2.1 Duration Tokens

| Token | Value | Use Case |
|-------|-------|----------|
| `--cs-duration-instant` | `0ms` | Reduced-motion fallback |
| `--cs-duration-micro` | `100ms` | Hover highlights, focus rings, icon color changes |
| `--cs-duration-fast` | `150ms` | Button press, chip toggle, tooltip show, border/shadow transitions |
| `--cs-duration-normal` | `200ms` | Panel slide, dropdown open, tab switch, view mode crossfade |
| `--cs-duration-moderate` | `300ms` | Modal enter, card stagger, empty state reveal, edge creation |
| `--cs-duration-slow` | `400ms` | Page transition, progress bar fill, complex layout shift |
| `--cs-duration-emphasis` | `600ms` | Celebration confetti, success checkmark draw, onboarding spotlight |

### 2.2 Easing Curves

| Token | Value | Use Case |
|-------|-------|----------|
| `--cs-ease-out` | `cubic-bezier(0.33, 1, 0.68, 1)` | Default exit / settle motion |
| `--cs-ease-in` | `cubic-bezier(0.32, 0, 0.67, 0)` | Element leaving (fade out, slide out) |
| `--cs-ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Symmetric motion (crossfade, toggle) |
| `--cs-ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Overshoot entries (cards, modals, nodes) |
| `--cs-ease-spring-heavy` | `cubic-bezier(0.22, 1.8, 0.36, 1)` | Strong overshoot (celebrations, drop confirm) |
| `--cs-ease-linear` | `linear` | Continuous motion (progress bar, edge flow, loading spinner) |

### 2.3 Framer Motion Spring Presets

For Framer Motion `spring` type animations (preferred over CSS bezier where available):

| Preset Name | Config | Use Case |
|-------------|--------|----------|
| `gentle` | `{ stiffness: 120, damping: 14, mass: 1 }` | Card enter, modal enter, node appear |
| `snappy` | `{ stiffness: 300, damping: 20, mass: 0.8 }` | Button press, tooltip, small elements |
| `bouncy` | `{ stiffness: 200, damping: 10, mass: 1 }` | Celebration, drop confirmation, success |
| `stiff` | `{ stiffness: 400, damping: 30, mass: 0.6 }` | Snap-back, cancel, error shake |

---

## 3. Page Transitions

Route changes use a shared layout animation pattern: the outgoing page fades/slides out while the incoming page fades/slides in.

### 3.1 Default Page Transition

| Phase | Property | From | To | Duration | Easing |
|-------|----------|------|----|----------|--------|
| **Exit** | `opacity` | `1` | `0` | 150ms | `--cs-ease-in` |
| **Exit** | `translateY` | `0` | `-8px` | 150ms | `--cs-ease-in` |
| **Enter** | `opacity` | `0` | `1` | 300ms | `--cs-ease-out` |
| **Enter** | `translateY` | `12px` | `0` | 300ms | `--cs-ease-spring` |

**Stagger:** Child elements stagger by 40ms (max 5 elements, then batch).

### 3.2 Canvas ↔ Dashboard Transition

The canvas is a spatial environment. Transitions to/from it use a zoom metaphor:

| Direction | Animation | Duration | Easing |
|-----------|-----------|----------|--------|
| Dashboard → Canvas | Scale `0.95 → 1.0`, opacity `0 → 1` (canvas viewport expands in) | 350ms | `gentle` spring |
| Canvas → Dashboard | Scale `1.0 → 0.98`, opacity `1 → 0` (canvas viewport contracts out) | 250ms | `--cs-ease-in` |

### 3.3 Canvas ↔ Timeline Transition

| Direction | Animation | Duration | Easing |
|-----------|-----------|----------|--------|
| Canvas → Timeline | Timeline slides up from bottom, canvas fades to 50% opacity then replaced | 400ms | `--cs-ease-out` |
| Timeline → Canvas | Timeline slides down, canvas fades in | 300ms | `--cs-ease-out` |

---

## 4. Component Enter / Exit Animations

### 4.1 Cards (Dashboard, Templates, Marketplace)

| Event | Animation | Duration | Easing | Notes |
|-------|-----------|----------|--------|-------|
| **Enter viewport** | `scale(0.92) translateY(8px) → identity` + `opacity 0 → 1` | 250ms | `gentle` spring | Stagger 50ms per card, max 12 |
| **Exit (delete)** | `scale(1) → scale(0.92)` + `opacity 1 → 0` | 200ms | `--cs-ease-in` | Remaining cards reflow with 300ms `--cs-ease-out` |
| **Hover** | Border color → `--cs-border-active`, shadow → `--cs-shadow-lg`, `scale(1.01)` | 150ms | `--cs-ease-out` | Thumbnail scales to `1.02` independently |
| **Press** | `scale(0.98)` | 100ms | `--cs-ease-out` | Immediate tactile feedback |

### 4.2 Modals & Dialogs

| Event | Animation | Duration | Easing |
|-------|-----------|----------|--------|
| **Overlay enter** | `opacity 0 → 1` (backdrop `rgba(0,0,0,0.7)`) | 200ms | `--cs-ease-out` |
| **Modal enter** | `scale(0.95) translateY(12px) → identity` + `opacity 0 → 1` | 300ms | `gentle` spring |
| **Modal exit** | Reverse of enter | 200ms | `--cs-ease-in` |
| **Overlay exit** | `opacity 1 → 0` | 200ms | `--cs-ease-in` |

**Sequence:** Overlay enters first → modal enters 50ms later. On close: modal exits first → overlay exits 100ms later.

### 4.3 Dropdowns & Menus

| Event | Animation | Duration | Easing |
|-------|-----------|----------|--------|
| **Open** | `scaleY(0.9) → 1`, `opacity 0 → 1`, origin = top-left | 150ms | `snappy` spring |
| **Close** | `scaleY(1) → 0.9`, `opacity 1 → 0` | 100ms | `--cs-ease-in` |
| **Item hover** | Background → `--cs-surface-hover` | 100ms | `--cs-ease-out` |
| **Item select** | Brief flash of `--cs-brand-violet/20%` then close | 100ms | `--cs-ease-out` |

### 4.4 Tooltips

| Event | Animation | Duration | Easing | Notes |
|-------|-----------|----------|--------|-------|
| **Show** | `translateY(4px) → 0`, `opacity 0 → 1` | 150ms | `snappy` spring | 500ms hover delay before showing |
| **Hide** | `opacity 1 → 0` | 100ms | `--cs-ease-in` | Instant on mouse leave (no delay) |

### 4.5 Toast Notifications

| Event | Animation | Duration | Easing |
|-------|-----------|----------|--------|
| **Enter** | Slide in from right: `translateX(100%) → 0` + `opacity 0 → 1` | 300ms | `gentle` spring |
| **Exit** | `translateX(0) → translateX(100%)` + `opacity 1 → 0` | 200ms | `--cs-ease-in` |
| **Stack shift** | Existing toasts shift down by toast height | 200ms | `--cs-ease-out` |

**Auto-dismiss:** 5s default. Progress bar shrinks linearly along bottom edge.

### 4.6 Sidebar & Panels

| Event | Animation | Duration | Easing |
|-------|-----------|----------|--------|
| **Sidebar collapse** (desktop) | Width `280px → 48px` (icon rail) | 200ms | `--cs-ease-out` |
| **Sidebar expand** (desktop) | Width `48px → 280px` | 200ms | `--cs-ease-out` |
| **Sidebar overlay** (mobile) | `translateX(-100%) → 0` + backdrop fade | 250ms | `--cs-ease-out` |
| **Properties panel open** | `translateX(100%) → 0` (slide from right) | 200ms | `--cs-ease-out` |
| **Properties panel close** | `translateX(0) → translateX(100%)` | 200ms | `--cs-ease-in` |
| **Section collapse/expand** | Height animation with `overflow: hidden` | 200ms | `--cs-ease-out` |

---

## 5. Hover & Focus Micro-Interactions

### 5.1 Buttons

| Variant | Hover | Press | Focus | Disabled |
|---------|-------|-------|-------|----------|
| **Primary** (filled) | Lighten bg 8%, shadow `--cs-shadow-md` | `scale(0.97)`, darken bg 4% | 2px ring `--cs-brand-violet` at 50% opacity, 2px offset | 40% opacity, no transitions |
| **Secondary** (outline) | Bg → `--cs-surface-hover`, border brighten | `scale(0.97)` | Same focus ring | 40% opacity |
| **Ghost** (text only) | Bg → `--cs-surface-hover` | `scale(0.97)` | Same focus ring | 40% opacity |
| **Icon** (circle/square) | Bg → `--cs-surface-hover`, icon color brighten | `scale(0.9)` | Same focus ring | 40% opacity |

**All transitions:** 100ms `--cs-ease-out` for hover, instant for press.

### 5.2 Form Inputs

| State | Visual Change | Duration | Easing |
|-------|--------------|----------|--------|
| **Focus** | Border → `--cs-brand-violet`, outer ring glow `--cs-brand-violet/30%`, label floats up | 150ms | `--cs-ease-out` |
| **Blur** | Border → `--cs-border-default`, ring fades | 150ms | `--cs-ease-out` |
| **Error** | Border → `--cs-error-red`, shake animation (`translateX` ±4px, 3 oscillations) | 300ms | `stiff` spring |
| **Valid** | Border → `--cs-success-green`, checkmark icon fades in | 200ms | `--cs-ease-out` |

### 5.3 Links & Interactive Text

| Event | Visual | Duration |
|-------|--------|----------|
| **Hover** | Color → `--cs-brand-violet-light`, underline slides in from left (`scaleX(0) → 1`) | 150ms |
| **Press** | Color → `--cs-brand-violet-dark` | instant |
| **Focus** | Dotted outline, 2px offset | instant |

### 5.4 Toggle Switches

| Event | Animation | Duration | Easing |
|-------|-----------|----------|--------|
| **Off → On** | Thumb slides right, track fills with `--cs-brand-violet` (left to right wipe) | 200ms | `snappy` spring |
| **On → Off** | Thumb slides left, track drains to `--cs-surface-muted` | 200ms | `--cs-ease-out` |
| **Thumb hover** | Thumb grows 2px, gains subtle shadow | 100ms | `--cs-ease-out` |

### 5.5 Tabs

| Event | Animation | Duration | Easing |
|-------|-----------|----------|--------|
| **Tab switch** | Active indicator bar slides to new tab (shared layout animation), content crossfade | 200ms | `snappy` spring (indicator), `--cs-ease-in-out` (content) |
| **Tab hover** | Background → `--cs-surface-hover` | 100ms | `--cs-ease-out` |

---

## 6. Loading & Progress States

### 6.1 Skeleton Screens

| Property | Value |
|----------|-------|
| **Base color** | `--cs-surface-elevated` (`#1e293b`) |
| **Shimmer highlight** | `--cs-surface-hover` (`#334155`) |
| **Animation** | Gradient sweep left-to-right, repeating | 
| **Duration** | 1.5s per sweep |
| **Easing** | `linear` |
| **Gradient** | `linear-gradient(90deg, transparent 0%, highlight 50%, transparent 100%)` |
| **Background-size** | `200% 100%` |

Skeleton shapes mirror the actual content layout: rectangles for text lines, circles for avatars, rounded rectangles for cards.

### 6.2 Spinner

| Property | Value |
|----------|-------|
| **Size** | 16px (inline), 24px (button), 40px (page-level) |
| **Stroke** | 2px `--cs-brand-violet` on `--cs-surface-muted` track |
| **Animation** | `rotate(0deg → 360deg)` + dash offset cycle |
| **Duration** | 1s rotation, 1.5s dash cycle |
| **Easing** | `linear` (rotation), `--cs-ease-in-out` (dash) |

### 6.3 Progress Bar

| Event | Animation | Duration | Easing |
|-------|-----------|----------|--------|
| **Determinate fill** | Width `0% → N%` | 400ms | `--cs-ease-out` |
| **Indeterminate** | Sliding gradient (left to right, repeating) | 1.5s | `--cs-ease-in-out` |
| **Complete** | Fill to 100% → flash `--cs-success-green` → fade out | 400ms + 300ms | `--cs-ease-out` |

### 6.4 Button Loading State

| Phase | Visual | Duration |
|-------|--------|----------|
| **Click** | Button text fades to 40%, spinner fades in at center | 150ms |
| **Loading** | Spinner rotates, button is disabled (no hover effects) | indefinite |
| **Complete** | Spinner → checkmark morph, then restore button text | 400ms |
| **Error** | Spinner → ✕ icon, button briefly flashes error bg, restore | 400ms |

---

## 7. State Change Animations

### 7.1 Canvas Node States

| State Transition | Animation | Duration | Easing |
|-----------------|-----------|----------|--------|
| **Idle → Running** | Border color transitions to `--cs-success-green`, pulse glow begins (alternates 40%–80% opacity) | 300ms (transition), 1.5s (pulse cycle) | `--cs-ease-out`, `--cs-ease-in-out` (pulse) |
| **Running → Complete** | Pulse stops, border stays green, checkmark badge scales in | 300ms | `gentle` spring |
| **Running → Error** | Pulse turns red (`--cs-error-rose`), error badge shakes in (±3px, 2 oscillations) | 300ms | `stiff` spring |
| **Any → Selected** | Blue selection ring (`--cs-brand-violet`) fades in, node lifts (`scale(1.02)`, shadow increases) | 150ms | `--cs-ease-out` |
| **Node enter** (new node placed on canvas) | `scale(0) → 1`, `opacity 0 → 1` | 300ms | `bouncy` spring |
| **Node delete** | `scale(1) → 0.8`, `opacity 1 → 0`, connected edges fade simultaneously | 200ms | `--cs-ease-in` |

### 7.2 Canvas Edge States

| State Transition | Animation | Duration | Easing |
|-----------------|-----------|----------|--------|
| **Edge created** | Path draws from source to target (stroke-dashoffset animation) | 300ms | `--cs-ease-out` |
| **Edge deleted** | Opacity `1 → 0`, stroke width `2 → 0` | 200ms | `--cs-ease-in` |
| **Data flowing** | Animated dash pattern (`stroke-dashoffset` cycle, moves source → target) | 1s per cycle | `linear` |
| **Edge hover** | Stroke width `2 → 3`, color brightens, tooltip shows | 100ms | `--cs-ease-out` |
| **Invalid connection** | Edge snaps back with spring, red flash on target handle | 300ms | `stiff` spring |

### 7.3 Workflow Run Status

| Transition | Dashboard Card Animation | Duration |
|------------|-------------------------|----------|
| **Queued → Running** | Status dot begins pulsing green, progress bar appears | 300ms |
| **Running → Complete** | Pulse stops, dot solid green, progress bar fills to 100% + flash | 400ms |
| **Running → Failed** | Dot turns red with shake, error count badge scales in | 300ms |
| **Any → Cancelled** | Dot turns amber, strikethrough slides across title | 300ms |

---

## 8. Drag & Drop Animations

These extend the patterns defined in `docs/ux/drag-drop-interactions.md`:

### 8.1 Drag Initiation

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| **Drag ghost** | Original element stays in place at 30% opacity. Ghost appears at cursor with `scale(1.05)`, elevated shadow | 100ms | `--cs-ease-out` |
| **Canvas drop zones** | Valid targets pulse border briefly, invalid zones dim slightly | 200ms | `--cs-ease-out` |

### 8.2 During Drag

| Feedback | Animation | Duration | Easing |
|----------|-----------|----------|--------|
| **Ghost follows cursor** | Position updates at 60fps, no easing (immediate tracking) | per frame | none |
| **Snap preview** | Ghost snaps to grid position with `gentle` spring | 150ms | `gentle` spring |
| **Over valid target** | Target highlights (`--cs-brand-violet/20%` bg), border brightens | 100ms | `--cs-ease-out` |
| **Over invalid target** | Cursor → `not-allowed`, ghost tints red at 20% | 100ms | `--cs-ease-out` |

### 8.3 Drop & Cancel

| Event | Animation | Duration | Easing |
|-------|-----------|----------|--------|
| **Successful drop** | Ghost → final position, scales `1.05 → 1.0`, shadow reduces, brief `--cs-brand-violet` flash on target | 200ms | `bouncy` spring |
| **Cancel (no target)** | Ghost springs back to origin, fades out | 300ms | `stiff` spring |
| **Cancel (invalid target)** | Ghost shakes (±6px, 2x), then springs back | 300ms + 200ms | `stiff` spring |

---

## 9. Onboarding & First-Time Animations

### 9.1 Welcome Wizard

| Step | Enter Animation | Duration | Easing |
|------|----------------|----------|--------|
| **Step content** | Slide in from right: `translateX(40px) → 0` + `opacity 0 → 1` | 300ms | `gentle` spring |
| **Step indicator dots** | Active dot scales `1 → 1.3`, fills with `--cs-brand-violet`; previous dot scales back | 200ms | `snappy` spring |
| **Progress bar** | Width expands to match step progress | 400ms | `--cs-ease-out` |
| **CTA button** | Subtle pulse on idle (scale `1.0 → 1.02 → 1.0`, infinite) to draw attention | 2s per cycle | `--cs-ease-in-out` |

### 9.2 Tooltip & Spotlight System

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| **Spotlight overlay** | `opacity 0 → 1`, spotlight circle cuts out around target element | 300ms | `--cs-ease-out` |
| **Tooltip bubble** | `scale(0.9) translateY(8px) → identity` + `opacity 0 → 1`, tail points to target | 200ms | `gentle` spring |
| **Target element pulse** | Ring expands from element edge outward, fades at 40px | 1.5s per cycle | `--cs-ease-out` |
| **Dismiss** | Spotlight fades, tooltip collapses | 200ms | `--cs-ease-in` |

### 9.3 Celebration (Milestone Complete)

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| **Confetti burst** | 30–50 particles from center, randomized colors, fall with gravity simulation | 1.5s | physics-based |
| **Checkmark draw** | SVG path stroke draws clockwise | 400ms | `--cs-ease-out` |
| **Success message** | `scale(0.8) → 1.0` + `opacity 0 → 1` | 300ms | `bouncy` spring |
| **Auto-advance delay** | Pause 1.5s after celebration, then auto-advance to next step | — | — |

---

## 10. Canvas-Specific Micro-Interactions

### 10.1 Minimap

| Event | Animation | Duration | Easing |
|-------|-----------|----------|--------|
| **Viewport rectangle move** | Tracks main canvas position at 30fps, no easing (responsive feel) | per frame | none |
| **Hover minimap** | Minimap border brightens, opacity `0.7 → 1.0` | 150ms | `--cs-ease-out` |
| **Click to navigate** | Viewport rectangle slides to click position, main canvas follows | 300ms | `--cs-ease-out` |

### 10.2 Zoom Controls

| Event | Animation | Duration | Easing |
|-------|-----------|----------|--------|
| **Scroll zoom** | Scale adjusts per frame, centered on cursor | per frame | none (immediate) |
| **Button zoom (+/−)** | Scale steps by 10%, centered on viewport center | 200ms | `--cs-ease-out` |
| **Fit All / Fit Selection** | Viewport animates to encompass all/selected nodes | 400ms | `gentle` spring |
| **Zoom level badge** | Fade in at top-center, show "125%", fade out after 1s idle | 150ms in, 150ms out | `--cs-ease-out` |

### 10.3 Multi-Select

| Event | Animation | Duration | Easing |
|-------|-----------|----------|--------|
| **Selection rectangle draw** | Dashed border rectangle follows cursor from origin | per frame | none |
| **Nodes enter selection** | Selected nodes get blue tint ring, batch transition | 100ms | `--cs-ease-out` |
| **Selection clear** | All rings fade out simultaneously | 100ms | `--cs-ease-in` |

### 10.4 Canvas Context Menu

| Event | Animation | Duration | Easing |
|-------|-----------|----------|--------|
| **Open** (right-click) | `scale(0.9) → 1.0` + `opacity 0 → 1`, origin at click point | 150ms | `snappy` spring |
| **Close** | `opacity 1 → 0` | 100ms | `--cs-ease-in` |
| **Item hover** | Background → `--cs-surface-hover`, icon color → `--cs-text-primary` | 100ms | `--cs-ease-out` |

---

## 11. Timeline-Specific Animations

### 11.1 Playback

| Event | Animation | Duration | Easing |
|-------|-----------|----------|--------|
| **Playhead move** | Smooth horizontal translation tracking current time | per frame | none (real-time) |
| **Playhead pulse** | Vertical line + dot pulses (opacity `0.6 → 1.0 → 0.6`) | 2s per cycle | `--cs-ease-in-out` |
| **Speed change** | Brief flash on speed indicator | 150ms | `--cs-ease-out` |

### 11.2 Event Markers

| Event | Animation | Duration | Easing |
|-------|-----------|----------|--------|
| **Hover** | Marker scales `1.0 → 1.3`, outer glow in event-type color at 40% | 100ms | `--cs-ease-out` |
| **Click (select)** | Ring appears, marker stays at `1.3` scale, detail panel opens | 150ms | `snappy` spring |
| **Error marker enter** | Red pulse for 3 cycles, then steady glow | 300ms × 3 | `--cs-ease-in-out` |

### 11.3 Filter Animations

| Event | Animation | Duration | Easing |
|-------|-----------|----------|--------|
| **Filter chip toggle** | Background + border transition, filtered events fade `1.0 → 0.15` | 200ms | `--cs-ease-out` |
| **No results** | Events fade out, "No matching events" fades in at center | 300ms | `--cs-ease-out` |
| **Clear all filters** | All events fade back to `1.0` simultaneously | 200ms | `--cs-ease-out` |

---

## 12. Scroll & Viewport Animations

### 12.1 Scroll-Linked Effects

| Effect | Behavior | Implementation |
|--------|----------|----------------|
| **Header shrink** | Top nav bar height `56px → 48px` as user scrolls past 100px | CSS `scroll-driven-animation` or `IntersectionObserver` with `transform: scaleY()` |
| **Parallax backgrounds** | Subtle parallax on hero/marketing sections only (not in-app) | `translateY` at 0.3× scroll rate |
| **Sticky headers** | Section headers stick at top, cross-dissolve on section change | `position: sticky` + opacity transition |

### 12.2 Infinite Scroll / Pagination

| Event | Animation | Duration | Easing |
|-------|-----------|----------|--------|
| **New items load** | Fade in + slide up, staggered 50ms per item | 250ms | `gentle` spring |
| **Loading indicator** | Spinner at bottom of list, 3 bouncing dots | 800ms per cycle | `--cs-ease-in-out` |
| **End of list** | "No more items" fades in, divider line extends from center outward | 300ms | `--cs-ease-out` |

---

## 13. Reduced Motion & Accessibility

### 13.1 `prefers-reduced-motion: reduce` Behavior

When the user has reduced motion enabled, ALL animations must degrade gracefully:

| Normal Behavior | Reduced Motion Replacement |
|-----------------|---------------------------|
| Spring / slide / scale entries | Instant `opacity 0 → 1` (150ms max, no transform) |
| Continuous pulses (running, playhead) | Static indicator (solid color, no animation) |
| Page transitions (slide + fade) | Simple crossfade (150ms) |
| Confetti / celebration | Static checkmark with success color (no particles) |
| Skeleton shimmer | Static skeleton color (no gradient animation) |
| Drag ghost follows cursor | Ghost still follows cursor (required for functionality) |
| Edge flow animation | Static dashed line (no dash-offset cycle) |
| Stagger delays | All items enter simultaneously |

### 13.2 Implementation Pattern

```typescript
// Framer Motion: global reduced motion support
import { useReducedMotion } from 'framer-motion';

function AnimatedCard({ children }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8, scale: shouldReduceMotion ? 1 : 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={shouldReduceMotion
        ? { duration: 0.15 }
        : { type: 'spring', stiffness: 120, damping: 14 }
      }
    >
      {children}
    </motion.div>
  );
}
```

```css
/* CSS fallback for non-Framer components */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.15s !important;
    scroll-behavior: auto !important;
  }
}
```

### 13.3 Focus Visible States

All interactive elements must have visible focus indicators for keyboard navigation:

| Element | Focus Style |
|---------|-------------|
| **Buttons** | 2px ring, `--cs-brand-violet` at 50%, 2px offset from edge |
| **Cards** | 2px ring, `--cs-brand-violet` at 50%, 4px offset (larger target) |
| **Inputs** | Border → `--cs-brand-violet`, outer glow ring |
| **Links** | Dotted underline + color change |
| **Canvas nodes** | Blue selection ring (same as click-select) |
| **Tabs** | Active indicator + focus ring |

Transition: `box-shadow` with `150ms --cs-ease-out`. Use `:focus-visible` (not `:focus`) to avoid showing on mouse click.

---

## 14. Performance Guidelines

### 14.1 Animation Budget

| Metric | Target | Ceiling |
|--------|--------|---------|
| **Frame rate** | 60fps | Never drop below 30fps |
| **Concurrent animations** | ≤ 8 simultaneous | 12 max (degrade gracefully) |
| **JS animation overhead** | ≤ 4ms per frame | 8ms max |
| **Layout thrashing** | 0 forced reflows per animation | — |

### 14.2 Optimization Rules

1. **Composite-only properties:** Animate only `transform` and `opacity`. Use `will-change` sparingly and remove after animation completes.
2. **Framer Motion `layout` prop:** Use for shared layout animations (tab indicators, grid reflows). Avoid on large lists (> 50 items).
3. **`requestAnimationFrame`:** All imperative canvas animations (zoom, pan, playhead) must use `rAF`, not `setInterval`.
4. **Batch DOM reads/writes:** When measuring for animation (e.g., scroll position, element bounds), batch reads before writes.
5. **Offscreen animations:** Pause animations for elements outside the viewport. Use `IntersectionObserver` to toggle.
6. **Stagger limits:** Cap stagger at 12 items (600ms total). Beyond that, batch-enter remaining items.

### 14.3 Animation Cleanup

```typescript
// Always clean up will-change after animation
<motion.div
  onAnimationStart={() => el.style.willChange = 'transform, opacity'}
  onAnimationComplete={() => el.style.willChange = 'auto'}
/>
```

---

## 15. Implementation Reference

### 15.1 Token File Mapping

| Token File | Contents |
|------------|----------|
| `src/design/tokens/animation.json` | All duration, easing, and spring preset tokens |
| `src/design/tokens/motion-presets.ts` | Framer Motion spring configs and variant factories |

### 15.2 Shared Animation Variants (Framer Motion)

```typescript
// File: src/design/motion-presets.ts

export const fadeSlideUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { type: 'spring', stiffness: 120, damping: 14 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { type: 'spring', stiffness: 120, damping: 14 },
};

export const modalVariants = {
  overlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  },
  content: {
    initial: { opacity: 0, scale: 0.95, y: 12 },
    animate: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 14, delay: 0.05 } },
    exit: { opacity: 0, scale: 0.95, y: 12, transition: { duration: 0.2 } },
  },
};

export const stagger = (delay = 0.05) => ({
  animate: { transition: { staggerChildren: delay } },
});

export const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 14, staggerChildren: 0.04 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};
```

### 15.3 CSS Custom Properties Export

```css
:root {
  /* Duration tokens */
  --cs-duration-instant: 0ms;
  --cs-duration-micro: 100ms;
  --cs-duration-fast: 150ms;
  --cs-duration-normal: 200ms;
  --cs-duration-moderate: 300ms;
  --cs-duration-slow: 400ms;
  --cs-duration-emphasis: 600ms;

  /* Easing tokens */
  --cs-ease-out: cubic-bezier(0.33, 1, 0.68, 1);
  --cs-ease-in: cubic-bezier(0.32, 0, 0.67, 0);
  --cs-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --cs-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --cs-ease-spring-heavy: cubic-bezier(0.22, 1.8, 0.36, 1);
}
```

---

## 16. Animation Inventory — Quick Reference

Complete lookup table of every animation in the application:

| # | Context | Trigger | Animation | Duration | Easing |
|---|---------|---------|-----------|----------|--------|
| 1 | Page | Route change (enter) | Fade + slide up | 300ms | `gentle` spring |
| 2 | Page | Route change (exit) | Fade + slide up (reverse) | 150ms | ease-in |
| 3 | Page | Dashboard → Canvas | Zoom in | 350ms | `gentle` spring |
| 4 | Page | Canvas → Timeline | Slide up | 400ms | ease-out |
| 5 | Card | Enter viewport | Scale + fade in | 250ms | `gentle` spring |
| 6 | Card | Hover | Border, shadow, scale | 150ms | ease-out |
| 7 | Card | Press | Scale down | 100ms | ease-out |
| 8 | Card | Delete | Scale down + fade | 200ms | ease-in |
| 9 | Modal | Open (overlay) | Fade in | 200ms | ease-out |
| 10 | Modal | Open (content) | Scale + slide up | 300ms | `gentle` spring |
| 11 | Modal | Close | Reverse of open | 200ms | ease-in |
| 12 | Dropdown | Open | ScaleY + fade | 150ms | `snappy` spring |
| 13 | Dropdown | Close | ScaleY + fade | 100ms | ease-in |
| 14 | Tooltip | Show | Slide up + fade | 150ms | `snappy` spring |
| 15 | Tooltip | Hide | Fade out | 100ms | ease-in |
| 16 | Toast | Enter | Slide from right | 300ms | `gentle` spring |
| 17 | Toast | Exit | Slide to right | 200ms | ease-in |
| 18 | Sidebar | Collapse/Expand | Width transition | 200ms | ease-out |
| 19 | Properties | Open/Close | Slide from right | 200ms | ease-out |
| 20 | Button | Hover | Lighten, shadow | 100ms | ease-out |
| 21 | Button | Press | Scale down | instant | — |
| 22 | Button | Loading | Text fade, spinner in | 150ms | ease-out |
| 23 | Input | Focus | Border, ring glow | 150ms | ease-out |
| 24 | Input | Error | Border red, shake | 300ms | `stiff` spring |
| 25 | Toggle | Switch | Thumb slide, track fill | 200ms | `snappy` spring |
| 26 | Tab | Switch | Indicator slide, crossfade | 200ms | `snappy` spring |
| 27 | Skeleton | Shimmer | Gradient sweep | 1.5s | linear |
| 28 | Spinner | Rotate | 360° + dash offset | 1s / 1.5s | linear / ease-in-out |
| 29 | Progress | Fill | Width increase | 400ms | ease-out |
| 30 | Node | Enter canvas | Scale + fade | 300ms | `bouncy` spring |
| 31 | Node | Delete | Scale down + fade | 200ms | ease-in |
| 32 | Node | Idle → Running | Border color, pulse glow | 300ms + 1.5s cycle | ease-out |
| 33 | Node | Running → Complete | Pulse stop, checkmark in | 300ms | `gentle` spring |
| 34 | Node | Running → Error | Red pulse, error shake | 300ms | `stiff` spring |
| 35 | Edge | Created | Stroke draw | 300ms | ease-out |
| 36 | Edge | Data flowing | Dash offset cycle | 1s cycle | linear |
| 37 | Edge | Invalid snap-back | Spring return + red flash | 300ms | `stiff` spring |
| 38 | Drag | Initiate | Ghost + shadow | 100ms | ease-out |
| 39 | Drag | Drop success | Scale down + flash | 200ms | `bouncy` spring |
| 40 | Drag | Cancel | Spring back | 300ms | `stiff` spring |
| 41 | Minimap | Click navigate | Viewport slides | 300ms | ease-out |
| 42 | Zoom | Fit All | Viewport animate | 400ms | `gentle` spring |
| 43 | Onboarding | Step enter | Slide from right | 300ms | `gentle` spring |
| 44 | Onboarding | Spotlight | Overlay + ring pulse | 300ms + 1.5s cycle | ease-out |
| 45 | Onboarding | Celebration | Confetti + checkmark draw | 1.5s | physics / ease-out |
| 46 | Timeline | Playhead pulse | Opacity cycle | 2s cycle | ease-in-out |
| 47 | Timeline | Event hover | Scale up + glow | 100ms | ease-out |
| 48 | Timeline | Filter toggle | Fade filtered events | 200ms | ease-out |
| 49 | Scroll | Header shrink | Height + scale | scroll-linked | — |
| 50 | Scroll | New items load | Fade + slide, staggered | 250ms | `gentle` spring |

---

## 17. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-04-09 | UX/UI Agent | Initial specification — TASK-170 |
