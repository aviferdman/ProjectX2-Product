# User Flow: Onboarding — First-Time User Experience

> **TASK-128** · P0 · UX/UI · Phase 2 (Epic 19 / Epic 22)  
> User flows for new user registration, initial setup, and guided first workflow creation.

---

## 1. Sign Up Flow

```
[Landing page or /signup]
    │
    ├─── Sign up options
    │       ├── [Sign up with GitHub] ← Primary (most developer users)
    │       ├── [Sign up with Google] ← Secondary
    │       ├── ──── or ────
    │       └── Email + password form
    │           ├── Email input
    │           ├── Password input (show requirements: 8+ chars, etc.)
    │           ├── [Create Account]
    │           └── "Already have an account? [Log in]"
    │
    ├─── OAuth sign up (GitHub/Google)
    │       ├── Redirect to provider
    │       ├── Grant permissions
    │       ├── Redirect back → Account created
    │       └── Skip to onboarding step 2 (profile already populated)
    │
    ├─── Email sign up
    │       ├── Submit form → Verification email sent
    │       ├── "Check your email for a verification link"
    │       ├── Click link → Email verified → Redirect to onboarding
    │       └── Resend option after 60 seconds
    │
    └─── RESULT: Account created, redirect to /onboarding/welcome
```

---

## 2. Onboarding Wizard (4 Steps)

### Overview

```
Step indicator:  ●───────○───────○───────○
                Welcome  Connect  Build   Done
```

The onboarding wizard is a full-screen step-by-step experience that takes new users from sign-up to running their first workflow.

---

### Step 1: Welcome (/onboarding/welcome)

```
┌──────────────────────────────────────────────────────────────┐
│                         🚀                                    │
│              Welcome to Crewspace!                            │
│                                                              │
│   Build multi-agent AI workflows visually.                   │
│   Let's get you set up in 2 minutes.                         │
│                                                              │
│   What best describes you?                                   │
│   ┌─────────────────────────────────────────┐                │
│   │ ○ Developer — Building AI applications   │                │
│   │ ○ Product Manager — Automating tasks     │                │
│   │ ○ Researcher — Analyzing data            │                │
│   │ ○ Just exploring                         │                │
│   └─────────────────────────────────────────┘                │
│                                                              │
│                              [Get Started →]                  │
│                                                              │
│   [Skip onboarding → Go to Dashboard]                        │
└──────────────────────────────────────────────────────────────┘

Interactions:
    ├── Select a role → Personalizes template suggestions later
    ├── [Get Started] → Advance to Step 2
    └── [Skip] → Go to dashboard with "New? [Start guided tour]" banner
```

---

### Step 2: Connect LLM (/onboarding/connect-llm)

```
┌──────────────────────────────────────────────────────────────┐
│  ●━━━━━━━●───────○───────○                                    │
│            Connect an LLM                                     │
│                                                              │
│   Your agents need a brain. Connect an LLM provider:         │
│                                                              │
│   ┌────────────────────────────────────────┐                 │
│   │  [OpenAI logo]  OpenAI                  │                 │
│   │  GPT-4o, GPT-3.5 — Most popular        │                 │
│   │  API Key: [________________________]    │                 │
│   │  [Test Connection ✓]                    │                 │
│   └────────────────────────────────────────┘                 │
│                                                              │
│   ┌────────────────────────────────────────┐                 │
│   │  [Anthropic logo]  Anthropic            │                 │
│   │  Claude 4, Claude 3.5 Sonnet            │                 │
│   │  [Connect →]                            │                 │
│   └────────────────────────────────────────┘                 │
│                                                              │
│   ┌────────────────────────────────────────┐                 │
│   │  [Ollama logo]  Ollama (Local)          │                 │
│   │  Run models locally — Free              │                 │
│   │  [Connect →]                            │                 │
│   └────────────────────────────────────────┘                 │
│                                                              │
│   [← Back]                           [Continue →]            │
│                                                              │
│   [Skip — I'll do this later]                                │
└──────────────────────────────────────────────────────────────┘

Interactions:
    ├── Enter API key → Auto-validates (shows ✓ or ✗)
    ├── [Test Connection] → Sends test request, shows result
    ├── At least one provider connected → [Continue] enabled
    ├── [Skip] → Can still proceed but workflow won't run without LLM
    └── [← Back] → Return to Step 1
```

---

### Step 3: Build First Workflow (/onboarding/first-workflow)

```
┌──────────────────────────────────────────────────────────────┐
│  ●━━━━━━━●━━━━━━━●───────○                                    │
│            Build Your First Workflow                          │
│                                                              │
│   Choose how to start:                                       │
│                                                              │
│   ┌──────────────────────────────────┐                       │
│   │  📋 Use a Template (Recommended)  │                       │
│   │  Start with a pre-built workflow  │                       │
│   │  and customize it                 │                       │
│   │                                   │                       │
│   │  Suggested for you:               │                       │
│   │  ┌──────────────┐ ┌─────────────┐│                       │
│   │  │ Research Crew │ │ Blog Writer ││                       │
│   │  │ [Use →]      │ │ [Use →]     ││                       │
│   │  └──────────────┘ └─────────────┘│                       │
│   │  [Browse all templates →]         │                       │
│   └──────────────────────────────────┘                       │
│                                                              │
│   ┌──────────────────────────────────┐                       │
│   │  ✨ Start from Scratch            │                       │
│   │  Open a blank canvas and build    │                       │
│   │  your own workflow                │                       │
│   │  [Create Blank Workflow →]        │                       │
│   └──────────────────────────────────┘                       │
│                                                              │
│   [← Back]                                                   │
└──────────────────────────────────────────────────────────────┘

Interactions:
    ├── [Use →] on template → Create workflow from template → Step 4
    ├── [Browse all] → Navigate to /templates (exits onboarding)
    ├── [Create Blank] → Create empty workflow → Step 4
    └── Templates are personalized based on Step 1 role selection
```

---

### Step 4: Complete (/onboarding/complete)

```
┌──────────────────────────────────────────────────────────────┐
│  ●━━━━━━━●━━━━━━━●━━━━━━━●                                    │
│                                                              │
│              🎉 You're all set!                               │
│                                                              │
│   Your workflow "Research Pipeline" is ready.                │
│                                                              │
│   Quick tips:                                                │
│   • Drag nodes from the sidebar to add agents and tasks      │
│   • Connect nodes by dragging from output to input handles   │
│   • Click ▶ Run to execute your workflow                     │
│   • Check the Debug Timeline to see what happened            │
│                                                              │
│   ┌──────────────────────────────────────────────┐           │
│   │  Keyboard shortcuts:                          │           │
│   │  Ctrl+K   Search / command palette            │           │
│   │  Space    Hold to pan canvas                  │           │
│   │  Ctrl+Z   Undo                                │           │
│   │  F        Fit view                            │           │
│   └──────────────────────────────────────────────┘           │
│                                                              │
│              [Open My Workflow →]                             │
│                                                              │
│   [Take a tour]    [Go to Dashboard]                         │
└──────────────────────────────────────────────────────────────┘

Interactions:
    ├── [Open My Workflow] → Redirect to /canvas/:workflowId
    ├── [Take a tour] → Start interactive guided tour on canvas
    └── [Go to Dashboard] → Redirect to /dashboard
```

---

## 3. Interactive Guided Tour (Canvas)

```
[Canvas — first visit or "Take a tour" clicked]
    │
    ├─── Tour step 1: Sidebar
    │       ├── Spotlight on sidebar
    │       ├── Tooltip: "This is your node library. Drag agents, tasks, and tools onto the canvas."
    │       └── [Next] or click highlighted area
    │
    ├─── Tour step 2: Canvas area
    │       ├── Spotlight on canvas
    │       ├── Tooltip: "This is your workspace. Pan with Space+drag, zoom with Ctrl+scroll."
    │       └── [Next]
    │
    ├─── Tour step 3: Toolbar
    │       ├── Spotlight on toolbar
    │       ├── Tooltip: "Add nodes, control the canvas, and run your workflow from here."
    │       └── [Next]
    │
    ├─── Tour step 4: Properties panel
    │       ├── Spotlight on properties panel area
    │       ├── Tooltip: "Select a node to configure it here. Set roles, goals, LLM providers, and tools."
    │       └── [Next]
    │
    ├─── Tour step 5: Run button
    │       ├── Spotlight on ▶ Run button
    │       ├── Tooltip: "When you're ready, click Run to execute your workflow. Watch agents work in real-time!"
    │       └── [Got it!]
    │
    └─── Tour complete
         ├── Tour dismissed
         ├── "Tour" option available in Help menu for replay
         └── localStorage flag: onboarding_tour_complete = true
```

---

## 4. Returning User — Contextual Tooltips

For users who skip onboarding or need gentle reminders:

```
First canvas visit (no tour):
    └── Banner: "New to Crewspace? [Take a quick tour] or [Dismiss]"

First time adding a node:
    └── Tooltip on node: "Click the node to configure it in the properties panel →"

First time running workflow:
    └── Tooltip on Run: "Your workflow will execute tasks in dependency order"

First debug timeline view:
    └── Tooltip: "Click any event to see details. Use filters to focus on specific agents."

Each tooltip shown once, tracked in localStorage.
```

---

## 5. Edge Cases

| Scenario | Behavior |
|----------|----------|
| User refreshes during onboarding | Resume at current step (progress stored in localStorage + server) |
| User navigates away | "Leave onboarding? You can always finish later from Settings." |
| OAuth sign-up fails | Clear error: "Could not connect to GitHub. [Try Again] or [Use email instead]" |
| LLM key invalid in Step 2 | Inline error with help link: "Invalid key. [Get an API key ↗]" |
| User skips all steps | Dashboard with persistent "Complete setup" card until onboarding finished |
| User has used CLI before | Detect existing workflows/config → "Welcome back! We imported your 3 existing workflows." |

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-04-08 | UX/UI Agent | Initial onboarding user flow |
