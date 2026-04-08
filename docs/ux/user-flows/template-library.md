# User Flow: Template Library

> **TASK-128** · P0 · UX/UI · Phase 2 (Epic 20)  
> User flows for browsing, previewing, and instantiating workflow templates.

---

## 1. Browse Templates

```
[Navigate to /templates]
    │
    ├─── Page layout
    │   ┌──────────────────────────────────────────────────────────┐
    │   │  Template Library    [🔍 Search templates...]            │
    │   ├──────────────────────────────────────────────────────────┤
    │   │  [All] [Research] [Content] [Data] [Customer] [DevOps]  │  ← Category chips
    │   ├──────────────────────────────────────────────────────────┤
    │   │  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
    │   │  │ [diagram]  │  │ [diagram]  │  │ [diagram]  │        │
    │   │  │ Research   │  │ Blog Post  │  │ Data ETL   │        │
    │   │  │ Pipeline   │  │ Generator  │  │ Pipeline   │        │
    │   │  │ 3 agents   │  │ 2 agents   │  │ 4 agents   │        │
    │   │  │ ⭐ Official│  │ Community  │  │ ⭐ Official│        │
    │   │  │[Use Template]│[Use Template]│[Use Template]│        │
    │   │  └────────────┘  └────────────┘  └────────────┘        │
    │   │                                                         │
    │   │  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
    │   │  │ ...more    │  │ ...more    │  │ ...more    │        │
    │   │  └────────────┘  └────────────┘  └────────────┘        │
    │   └──────────────────────────────────────────────────────────┘
    │
    └─── RESULT: Paginated grid of template cards
```

---

## 2. Search and Filter Templates

```
[Templates page — search and filter]
    │
    ├─── Search
    │       ├── Type in search input (auto-focused on page load)
    │       ├── Real-time filtering (debounced 200ms)
    │       ├── Searches: template name, description, tags, agent roles
    │       ├── Results update instantly in grid
    │       └── No results → "No templates match. Try different keywords."
    │
    ├─── Category filter chips
    │       ├── Horizontal scrollable row of chips
    │       ├── Categories: All, Research, Content, Data, Customer Support, DevOps, Custom
    │       ├── Click chip → Filter to category (single-select, "All" deselects)
    │       └── Chip count badge: "Research (5)"
    │
    ├─── Sort (dropdown, right side)
    │       ├── Popular (default — by usage count)
    │       ├── Newest
    │       ├── Name (A-Z)
    │       └── Agent count
    │
    └─── RESULT: Filtered template grid
```

---

## 3. Preview Template

```
[Templates grid — click a template card]
    │
    ├─── Template preview modal opens (centered, 80vw × 80vh)
    │
    │   ┌──────────────────────────────────────────────────────────┐
    │   │  Research Pipeline                              [×]      │
    │   │  ⭐ Official · Research · 3 agents · 5 tasks              │
    │   ├──────────────────────────────────────────────────────────┤
    │   │                                                          │
    │   │  ┌──────────────────────────────────────────────────┐    │
    │   │  │         Interactive workflow diagram              │    │
    │   │  │                                                  │    │
    │   │  │   [Researcher] ──► [Analyst] ──► [Writer]        │    │
    │   │  │       │                              │           │    │
    │   │  │       └──────► [Fact Checker] ───────┘           │    │
    │   │  │                                                  │    │
    │   │  └──────────────────────────────────────────────────┘    │
    │   │                                                          │
    │   │  Description:                                            │
    │   │  A research pipeline that searches the web, analyzes     │
    │   │  findings, fact-checks claims, and produces a summary    │
    │   │  report. Ideal for competitive analysis and market       │
    │   │  research tasks.                                         │
    │   │                                                          │
    │   │  Agents:                                                 │
    │   │  • Researcher — Searches web for relevant information    │
    │   │  • Analyst — Synthesizes research into insights          │
    │   │  • Writer — Produces final report                        │
    │   │                                                          │
    │   │  Required integrations:                                  │
    │   │  • OpenAI (or any LLM provider)                         │
    │   │  • Web search tool                                       │
    │   │                                                          │
    │   │  Estimated run time: 2-5 minutes                         │
    │   │                                                          │
    │   ├──────────────────────────────────────────────────────────┤
    │   │           [Use This Template]    [Cancel]                 │
    │   └──────────────────────────────────────────────────────────┘
    │
    ├─── Interactions within modal
    │       ├── Workflow diagram is interactive (hover nodes for details, zoom/pan)
    │       ├── Click agent name → Expand to show configuration
    │       └── Click outside modal or × → Close modal
    │
    └─── RESULT: User sees full template details before committing
```

---

## 4. Instantiate Template (Use Template)

```
[Template preview modal — click "Use This Template"]
    │
    ├─── Step 1: Configure
    │       ├── Modal transitions to configuration step:
    │       │   ├── Workflow name: "[Template Name] — My Copy" (editable)
    │       │   ├── Description: Pre-filled from template (editable)
    │       │   └── LLM Provider: Dropdown of user's installed providers
    │       │       └── If none: "You need an LLM provider. [Go to Marketplace]"
    │       │
    │       └── [Create Workflow] or [Back]
    │
    ├─── Step 2: Create
    │       ├── Loading state: "Creating your workflow..."
    │       ├── Copy all nodes, edges, and configuration
    │       ├── Apply user's selected LLM provider
    │       └── Redirect to /canvas/:newWorkflowId
    │
    ├─── On canvas
    │       ├── Workflow loaded with all template nodes and edges
    │       ├── Welcome tooltip: "This workflow was created from the Research Pipeline template. Customize it to your needs!"
    │       ├── All nodes fully configured and ready to run
    │       └── User can immediately [▶ Run Workflow] or customize first
    │
    └─── RESULT: User has a fully functional workflow based on the template
```

---

## 5. Template Card Anatomy

```
┌──────────────────────────┐
│  ┌──────────────────────┐│
│  │  [Workflow diagram   ││  ← Mini canvas preview (static, auto-generated)
│  │   thumbnail]         ││     Shows node layout at a glance
│  └──────────────────────┘│
│                          │
│  Research Pipeline       │  ← Template name (14px semibold)
│  Search, analyze, and    │  ← Description (12px, 2-line clamp)
│  summarize web content   │
│                          │
│  🤖 3 agents · 📋 5 tasks│  ← Metadata line
│  ⭐ Official · Research  │  ← Badge + category
│                          │
│  [Use Template]          │  ← Primary CTA (violet, full-width)
└──────────────────────────┘

Card states:
    ├── Default: Subtle border, standard shadow
    ├── Hover: Elevated shadow, border brightens, CTA appears
    └── Click: Opens preview modal (not immediate instantiation)
```

---

## 6. Edge Cases

| Scenario | Behavior |
|----------|----------|
| Template requires integration user doesn't have | Warning in preview: "This template uses [Web Search]. Install it from Marketplace to use this template." + [Go to Marketplace] link |
| Template instantiation fails | Error toast: "Failed to create workflow. [Try Again]" |
| User tries to edit a template directly | Templates are read-only. Users always get a copy. |
| Template version updated | Existing copies are not affected. "New version available" badge on template card. |
| No templates available | "No templates yet. Check back soon or [create your own workflow]." |
| Template search — no results | "No templates match your search. [Clear search] or [browse all]" |

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-04-08 | UX/UI Agent | Initial template library user flows |
