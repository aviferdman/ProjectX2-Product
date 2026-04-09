# Action/Event Cards — Component Specification

**Task:** TASK-141  
**Epic:** 18 — Debugging Timeline UI Design & Implementation  
**Priority:** P1  
**Author:** Designer Agent  
**Status:** Complete  
**Depends on:** TASK-140 (Timeline UI spec — ✅ done)

---

## 1. Overview

Action/event cards are the **detail view** for timeline events. When a user clicks an event block in the timeline swimlane chart (designed in TASK-140), a card slides open in the detail panel showing rich contextual information about that event.

Each event type has a specialized card layout tailored to its data:

| Card Type | Icon | Color | Key Information |
|-----------|------|-------|-----------------|
| **LLM Call** | ⚡ `zap` | Amber | Model, prompt/response, tokens, latency, cost |
| **Tool Use** | 🔧 `wrench` | Emerald | Tool name, input/output, duration, status |
| **Task Start** | ▶ `play` | Sky | Task name, assigned agent, description, dependencies |
| **Task Complete** | ✓ `check-circle-2` | Emerald | Task name, result, duration, output summary |
| **Error** | ⚠ `alert-triangle` | Rose | Error type, message, stack trace, retry info |
| **Message** | 💬 `message-square` | Violet | Sender, recipient, content, delegation context |

---

## 2. Card Anatomy

All cards share a common structural skeleton. Type-specific content slots fill in the body.

```
┌─────────────────────────────────────────┐
│ ┌──────┐                          [✕]   │ ← Header
│ │ Icon │  Title                         │
│ │ (bg) │  Subtitle · Type Badge         │
│ └──────┘                                │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │ ← Divider
│                                         │
│  ┌─────────┬──────────┬──────────┐      │ ← Metrics Row
│  │ Metric  │ Metric   │ Metric   │      │
│  │  1,234  │  2.3s    │  $0.02   │      │
│  │ tokens  │ duration │   cost   │      │
│  └─────────┴──────────┴──────────┘      │
│                                         │
│  SECTION LABEL              [▾ collapse] │ ← Collapsible Section
│  ┌─────────────────────────────────┐    │
│  │  Content (code, text, data)     │    │
│  │  ...                            │    │
│  └─────────────────────────────────┘    │
│                                         │
│  SECTION LABEL              [▾ collapse] │
│  ┌─────────────────────────────────┐    │
│  │  Content                        │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │ ← Divider
│  Timestamp · Agent · Status dot         │ ← Footer
└─────────────────────────────────────────┘
```

### 2.1 Card Container

| Property | Value | Token |
|----------|-------|-------|
| Width | 380px (default) | `--card-w` |
| Min width | 320px | `--card-min-w` |
| Max width | 480px | `--card-max-w` |
| Background | `--cs-surface-card` (slate-800) | `--card-bg` |
| Border | 1px `--cs-border-default` | `--card-border` |
| Border radius | 10px | `--card-radius` |
| Left accent border | 3px solid `--card-accent` | Per-type color |
| Shadow | `0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(148,163,184,0.08)` | `--card-shadow` |
| Padding | 16px | `--card-padding` |
| Section gap | 12px | `--card-gap` |

### 2.2 Header

| Element | Style |
|---------|-------|
| Icon container | 36×36px, `--card-icon-bg` background, 10px border-radius |
| Icon | 20px Lucide, color `--card-icon-color`, stroke-width 1.75 |
| Title | `0.875rem / 600` (14px semibold Inter), color `--cs-text-primary` |
| Subtitle | `0.75rem / 500` (12px medium), color `--cs-text-secondary` |
| Type badge | Pill: `0.625rem / 600` (10px semibold), `letter-spacing: 0.04em`, uppercase. Background `--card-badge-type-bg`, text `--card-badge-text`, padding `2px 8px`, border-radius full |
| Close button | 28×28px, `✕` icon 16px, color `--card-close-icon`, hover: `--card-close-icon-hover` + `--cs-surface-elevated` background, border-radius 6px |
| Layout | Flexbox row, icon left, title block center (flex-grow), close button right |

### 2.3 Metrics Row

A horizontal strip of key metrics, displayed in a rounded container:

| Property | Value |
|----------|-------|
| Background | `rgba(15,23,42,0.4)` |
| Border radius | 8px |
| Padding | 12px |
| Layout | Flexbox row, equal-width items, centered |
| Item gap | 16px with 1px vertical dividers between |
| Metric value | `1.125rem / 700` (18px bold Inter), color `--cs-text-primary` |
| Metric label | `0.625rem / 500` (10px medium), color `--cs-text-tertiary`, uppercase |
| Animation | Values count up with `cs-metric-count` (600ms ease-out) on card open |

### 2.4 Collapsible Sections

| Property | Value |
|----------|-------|
| Label | `0.6875rem / 600` (11px semibold), uppercase, `letter-spacing: 0.04em`, color `--cs-text-tertiary` |
| Chevron | 14px, rotates 90° when expanded |
| Animation | `cs-section-expand` 200ms ease-out |
| Default state | First section expanded, rest collapsed |

### 2.5 Code Blocks

Used for prompts, responses, tool inputs/outputs, and stack traces:

| Property | Value |
|----------|-------|
| Background | `rgba(15,23,42,0.6)` |
| Border | 1px `rgba(51,65,85,0.5)` |
| Border radius | 6px |
| Padding | 12px |
| Max height | 200px (scrollable) |
| Font | `0.75rem / 400` JetBrains Mono |
| Line height | 1.6 |
| Syntax colors | See §2.6 |
| Copy button | Top-right corner, 28×28px, appears on hover |

### 2.6 Syntax Highlighting

Consistent with the log viewer spec (TASK-140):

| Token | Color | Hex |
|-------|-------|-----|
| String | emerald-400 | `#34d399` |
| Number | amber-400 | `#fbbf24` |
| Boolean/null | violet-400 | `#a78bfa` |
| Key | sky-400 | `#38bdf8` |
| Error text | rose-400 | `#fb7185` |
| Comment | slate-500 | `#64748b` |

### 2.7 Footer

| Element | Style |
|---------|-------|
| Layout | Flexbox row, items centered, gap 12px |
| Timestamp | `0.6875rem / 400` monospace, color `--cs-text-tertiary` |
| Agent name | `0.75rem / 500`, with 8px color dot matching agent's canvas color |
| Status dot | 8px circle, color per status (§6), with optional pulse animation |
| Divider | 1px `rgba(51,65,85,0.4)` top border, margin-top 12px, padding-top 12px |

---

## 3. Card Type: LLM Call

**Triggered by:** Clicking an amber LLM event block in the timeline

### Layout

```
┌─────────────────────────────────────────┐
│ ⚡  GPT-4o Inference              [✕]   │
│     Agent: ResearchBot · LLM CALL       │
├─────────────────────────────────────────┤
│  ┌──────────┬──────────┬──────────┐     │
│  │  1,247   │  2.3s    │  $0.018  │     │
│  │  tokens  │ latency  │   cost   │     │
│  └──────────┴──────────┴──────────┘     │
│                                         │
│  PROMPT                      [▾]        │
│  ┌─────────────────────────────────┐    │
│  │ Analyze the quarterly revenue   │    │
│  │ data and identify trends...     │    │
│  └─────────────────────────────────┘    │
│                                         │
│  RESPONSE                    [▾]        │
│  ┌─────────────────────────────────┐    │
│  │ Based on the analysis, the key  │    │
│  │ trends are: 1) Revenue grew...  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  PARAMETERS                  [▾]        │
│  Model: gpt-4o · Temp: 0.7 · Max: 4096 │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│  00:03.120 · ResearchBot · 🟢          │
└─────────────────────────────────────────┘
```

### Sections

| Section | Content | Default |
|---------|---------|---------|
| **Metrics** | Total tokens, Latency (ms), Estimated cost | Always visible |
| **Prompt** | System + user prompt text, syntax highlighted | Expanded |
| **Response** | LLM response text, syntax highlighted | Collapsed |
| **Parameters** | Model name, temperature, max_tokens, top_p, stop sequences | Collapsed |

### Metrics Detail

| Metric | Format | Example |
|--------|--------|---------|
| Tokens | Comma-separated integer | `1,247` |
| Latency | seconds with 1 decimal | `2.3s` |
| Cost | USD with appropriate precision | `$0.018` |

### Additional Elements

- **Token breakdown badge**: `input: 892 / output: 355` displayed below main token count
- **Model badge**: Pill with model name (e.g., "GPT-4O", "CLAUDE-3.5")
- **Streaming indicator**: If streaming, show animated dots in response section during stream

---

## 4. Card Type: Tool Use

**Triggered by:** Clicking an emerald tool event block in the timeline

### Layout

```
┌─────────────────────────────────────────┐
│ 🔧  web_search                    [✕]   │
│     Agent: ResearchBot · TOOL USE       │
├─────────────────────────────────────────┤
│  ┌──────────┬──────────┬──────────┐     │
│  │  1.8s    │  200     │  3.2 KB  │     │
│  │ duration │  status  │  output  │     │
│  └──────────┴──────────┴──────────┘     │
│                                         │
│  INPUT                       [▾]        │
│  ┌─────────────────────────────────┐    │
│  │ {                               │    │
│  │   "query": "Q4 revenue data",  │    │
│  │   "max_results": 5             │    │
│  │ }                               │    │
│  └─────────────────────────────────┘    │
│                                         │
│  OUTPUT                      [▾]        │
│  ┌─────────────────────────────────┐    │
│  │ {                               │    │
│  │   "results": [                  │    │
│  │     { "title": "Q4 Report"... } │    │
│  │   ]                             │    │
│  │ }                               │    │
│  └─────────────────────────────────┘    │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│  00:05.340 · ResearchBot · 🟢          │
└─────────────────────────────────────────┘
```

### Sections

| Section | Content | Default |
|---------|---------|---------|
| **Metrics** | Duration, HTTP status / exit code, Output size | Always visible |
| **Input** | JSON/text input to the tool, syntax highlighted | Expanded |
| **Output** | JSON/text output from the tool, syntax highlighted | Collapsed |

### Metrics Detail

| Metric | Format | Example |
|--------|--------|---------|
| Duration | seconds with 1 decimal | `1.8s` |
| Status | Integer (HTTP) or badge | `200` or `Success` |
| Output size | Human-readable bytes | `3.2 KB` |

### Status Indicators

| Status Code | Badge Color | Background |
|-------------|-------------|------------|
| 2xx | emerald-400 | emerald-400/12% |
| 3xx | sky-400 | sky-400/12% |
| 4xx | amber-400 | amber-400/12% |
| 5xx | rose-400 | rose-400/12% |

---

## 5. Card Type: Task Start

**Triggered by:** Clicking a sky task-start marker in the timeline

### Layout

```
┌─────────────────────────────────────────┐
│ ▶  Analyze Revenue Data           [✕]   │
│     Agent: AnalystBot · TASK STARTED    │
├─────────────────────────────────────────┤
│                                         │
│  DESCRIPTION                 [▾]        │
│  Analyze Q4 revenue data from the       │
│  database and generate a summary        │
│  report with key trends and anomalies.  │
│                                         │
│  DEPENDENCIES                [▾]        │
│  ✓  Fetch database credentials          │
│  ✓  Load revenue schema                 │
│  ●  Waiting: API rate limiter           │
│                                         │
│  METADATA                               │
│  Priority: High · Retry: 0/3           │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│  00:06.100 · AnalystBot · 🔵           │
└─────────────────────────────────────────┘
```

### Sections

| Section | Content | Default |
|---------|---------|---------|
| **Description** | Task description text | Expanded |
| **Dependencies** | List of prerequisite tasks with status indicators | Expanded |
| **Metadata** | Priority level, retry count/limit, timeout | Always visible |

### Dependency Indicators

| Status | Icon | Color |
|--------|------|-------|
| Completed | ✓ checkmark | emerald-400 |
| In progress | ◐ half-circle | amber-400 |
| Waiting | ● filled dot | slate-400 |
| Failed | ✕ cross | rose-400 |

---

## 6. Card Type: Task Complete

**Triggered by:** Clicking an emerald task-complete marker in the timeline

### Layout

```
┌─────────────────────────────────────────┐
│ ✓  Analyze Revenue Data           [✕]   │
│     Agent: AnalystBot · TASK COMPLETED  │
├─────────────────────────────────────────┤
│  ┌──────────┬──────────┬──────────┐     │
│  │  12.4s   │  3       │  1       │     │
│  │ duration │  steps   │  retries │     │
│  └──────────┴──────────┴──────────┘     │
│                                         │
│  RESULT                      [▾]        │
│  ┌─────────────────────────────────┐    │
│  │ Revenue grew 23% YoY in Q4.    │    │
│  │ Key drivers: enterprise deals   │    │
│  │ (+45%), APAC expansion (+31%)   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  OUTPUT ARTIFACTS            [▾]        │
│  📄 revenue-report.md  (2.1 KB)        │
│  📊 trends-chart.json  (890 B)         │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│  00:18.500 · AnalystBot · 🟢           │
└─────────────────────────────────────────┘
```

### Sections

| Section | Content | Default |
|---------|---------|---------|
| **Metrics** | Total duration, Steps count, Retries | Always visible |
| **Result** | Task result summary text | Expanded |
| **Output Artifacts** | List of generated files/data with sizes | Collapsed |

### Success Animation

On card open, the ✓ icon plays `cs-success-pulse` (1.5s scale pulse) to celebrate completion.

---

## 7. Card Type: Error

**Triggered by:** Clicking a rose error event block in the timeline

### Layout

```
┌─────────────────────────────────────────┐
│ ⚠  ConnectionError               [✕]   │
│     Agent: ResearchBot · ERROR          │
├─────────────────────────────────────────┤
│                                         │
│  ERROR MESSAGE                          │
│  Connection refused: API endpoint       │
│  https://api.example.com/v2/data        │
│  returned ECONNREFUSED after 3 retries  │
│                                         │
│  STACK TRACE                 [▾]        │
│  ┌─────────────────────────────────┐    │
│  │ Error: ECONNREFUSED             │    │
│  │   at TCPConnectWrap.afterCon... │    │
│  │   at TCPConnectWrap.callbackF.. │    │
│  │   at Object.fetch (net:321)     │    │
│  └─────────────────────────────────┘    │
│                                         │
│  RECOVERY                    [▾]        │
│  Retries: 3/3 exhausted                 │
│  Fallback: None configured              │
│  Suggestion: Check API endpoint health  │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│  00:05.780 · ResearchBot · 🔴           │
└─────────────────────────────────────────┘
```

### Sections

| Section | Content | Default |
|---------|---------|---------|
| **Error Message** | Error class + human-readable message | Always expanded |
| **Stack Trace** | Monospaced stack trace in code block | Collapsed |
| **Recovery** | Retry count, fallback status, suggested actions | Expanded |

### Error Animation

On card open, the ⚠ icon plays `cs-error-shake` (400ms horizontal shake) to draw attention.

### Error Severity Badges

| Severity | Background | Text |
|----------|------------|------|
| Fatal | `rgba(244,63,94,0.2)` | rose-400 |
| Retryable | `rgba(245,158,11,0.15)` | amber-400 |
| Warning | `rgba(245,158,11,0.1)` | amber-400 |

---

## 8. Card Type: Message

**Triggered by:** Clicking a violet message event block in the timeline

### Layout

```
┌─────────────────────────────────────────┐
│ 💬  Task Delegation               [✕]   │
│     CoordinatorBot → ResearchBot        │
│     · AGENT MESSAGE                     │
├─────────────────────────────────────────┤
│                                         │
│  MESSAGE CONTENT                        │
│  "Please analyze the Q4 revenue data   │
│   from the database. Focus on YoY      │
│   growth trends and identify any        │
│   anomalies in the APAC region."        │
│                                         │
│  CONTEXT                     [▾]        │
│  Delegation type: Sub-task              │
│  Parent task: Generate Board Report     │
│  Priority: High                         │
│                                         │
│  ATTACHMENTS                 [▾]        │
│  📎 revenue-schema.json (1.2 KB)       │
│  📎 previous-analysis.md (3.4 KB)      │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│  00:02.800 · CoordinatorBot · 🟢       │
└─────────────────────────────────────────┘
```

### Sections

| Section | Content | Default |
|---------|---------|---------|
| **Message Content** | The message text, with quote styling | Always expanded |
| **Context** | Delegation type, parent task, priority | Expanded |
| **Attachments** | Files/data passed with the message | Collapsed |

### Message Direction

The header subtitle shows sender → recipient with a right arrow (`→`), using each agent's assigned color dot.

---

## 9. Interaction States

### 9.1 Card States

| State | Visual Treatment |
|-------|-----------------|
| **Default** | Standard card with type accent border |
| **Hover** | Shadow transitions to `--card-shadow-hover`, subtle lift (translateY -1px) |
| **Selected** | 2px violet-500 ring, `rgba(139,92,246,0.2)` glow behind card |
| **Opening** | `cs-card-enter` animation: scale(0.95→1) + translateY(8→0) + fade, 200ms spring |
| **Closing** | `cs-card-exit` animation: reverse of enter, 150ms ease-in |
| **Loading** | Skeleton placeholders for metrics and sections (pulsing `rgba(51,65,85,0.3)` bars) |

### 9.2 Section States

| State | Visual |
|-------|--------|
| Collapsed | Chevron points right, content height 0, overflow hidden |
| Expanding | `cs-section-expand` animation, chevron rotates to downward |
| Expanded | Full content visible, chevron points down |

### 9.3 Code Block States

| State | Visual |
|-------|--------|
| Default | Syntax-highlighted code, scrollable if > 200px |
| Hover | Copy button appears in top-right corner |
| Copied | Copy button shows checkmark + "Copied!" for 2s |
| Truncated | "Show more" link at bottom, faded gradient overlay |

---

## 10. Responsive Behavior

| Breakpoint | Adaptation |
|------------|------------|
| Desktop (≥1280px) | Card at 380px width, docked in right panel alongside timeline |
| Tablet (768–1279px) | Card at 320px width, metrics stack to 2 columns |
| Mobile (<768px) | Card fills screen width as a bottom sheet, sections default collapsed |

### Detail Panel Positioning

| Context | Card Position |
|---------|---------------|
| **Timeline docked below canvas** | Card opens in a right sidebar panel (380px), pushing timeline left |
| **Timeline in dedicated route** | Card opens as an overlay panel sliding from right |
| **Mobile** | Card opens as a bottom sheet (80% viewport height, swipe to dismiss) |

---

## 11. Accessibility

| Feature | Implementation |
|---------|---------------|
| **Focus management** | Card traps focus when open (focus-trap). Close button is first tab stop. |
| **ARIA** | `role="dialog"`, `aria-labelledby` (card title), `aria-describedby` (card subtitle) |
| **Escape** | Closes card and returns focus to the timeline event block |
| **Screen readers** | All metrics have `aria-label` (e.g., "1,247 tokens"), status dot has `aria-label` ("Running") |
| **Color contrast** | All text meets WCAG 2.1 AA (4.5:1 minimum). Type badges use bg tint, not color alone |
| **Reduced motion** | `prefers-reduced-motion`: disable spring/shake/pulse animations, use instant transitions |
| **Focus visible** | Violet-500 ring on all focusable elements within card |
| **Copy to clipboard** | Code blocks have accessible copy button with success feedback |

---

## 12. Keyboard Shortcuts (within card)

| Key | Action |
|-----|--------|
| `Esc` | Close card |
| `Tab` / `Shift+Tab` | Navigate between sections and interactive elements |
| `Enter` / `Space` | Toggle section collapse/expand |
| `C` | Copy selected code block content |
| `←` / `→` | Navigate to previous/next event's card |

---

## 13. Design Token Files

| File | Purpose |
|------|---------|
| `src/design/tokens/action-event-cards.json` | All action card design tokens (colors, sizing, typography, animations) |
| `src/design/css/action-event-cards-variables.css` | CSS custom properties + keyframe animations |
| `src/design/tailwind/action-event-cards-theme.ts` | Tailwind theme extensions + icon mapping + labels |
| `docs/design/component-specs/action-event-cards.md` | This specification |

---

## 14. Integration Points

### 14.1 Timeline ↔ Card Sync

- **Click event block** → Opens corresponding card in detail panel with `cs-card-enter` animation
- **Click different event** → Current card exits (`cs-card-exit`), new card enters
- **Close card** → Detail panel collapses, timeline regains full width
- **Playhead reaches event** → If auto-play enabled, card auto-opens for the event

### 14.2 Log Viewer ↔ Card Sync

- **Click log row** → Opens the card for the event that generated that log entry
- **Card open** → Corresponding log entries highlighted in log viewer with `rgba(139,92,246,0.1)` background

### 14.3 Canvas ↔ Card Sync (future)

- Error cards can link to the canvas node where the error occurred
- Task cards show which canvas node represents the task

---

## 15. Dependencies

This design spec is a prerequisite for:

- **TASK-145:** Implement filters and search — card content must be filterable
- **TASK-146:** Implement timeline playback and step-through — cards auto-open during playback
- **TASK-147:** Design QA: timeline implementation vs specs — includes card review
