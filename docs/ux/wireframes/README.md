# Crewspace Low-Fidelity Wireframes

**Task:** TASK-129 — Create low-fidelity wireframes (canvas, timeline, dashboard)  
**Priority:** P1  
**Depends on:** TASK-128 (User flows & IA — ✅ complete)  
**Blocks:** TASK-132 (Canvas high-fidelity), TASK-140 (Timeline high-fidelity), TASK-148 (Dashboard high-fidelity)

---

## Overview

These wireframes define the spatial layout, component hierarchy, and interaction zones for the three primary Crewspace screens. They are intentionally low-fidelity — focused on structure, not visual styling — to enable rapid iteration before high-fidelity design work begins.

## Files

| Wireframe | File | Description |
|-----------|------|-------------|
| Canvas Editor | [canvas-editor.md](./canvas-editor.md) | Visual workflow builder with node library, infinite canvas, and properties panel |
| Debug Timeline | [debug-timeline.md](./debug-timeline.md) | Run inspection view with agent swimlanes, event markers, and log viewer |
| Dashboard | [dashboard.md](./dashboard.md) | Workflow management hub with cards/list view, usage stats, and CRUD actions |

## Design Principles Applied

1. **Progressive disclosure** — Show essential controls first, reveal advanced options on interaction
2. **Spatial consistency** — Sidebar left, properties right, primary content center across all screens
3. **Responsive-first** — Each wireframe includes desktop (xl: 1280px+), tablet (md: 768px), and mobile (xs: 375px) layouts
4. **Accessibility** — All interactive zones meet 44×44px minimum touch targets; keyboard navigation paths documented

## Cross-References

- Information Architecture: [`docs/ux/information-architecture.md`](../information-architecture.md)
- User Flows: [`docs/ux/user-flows/`](../user-flows/)
- Design Specs: [`docs/design/`](../../design/)
- Accessibility Requirements: [`docs/ux/accessibility-requirements.md`](../accessibility-requirements.md)
- Responsive Breakpoints: [`docs/design/responsive-breakpoints.md`](../../design/responsive-breakpoints.md)
