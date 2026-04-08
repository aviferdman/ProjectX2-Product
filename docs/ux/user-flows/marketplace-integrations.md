# User Flow: Integration Marketplace

> **TASK-128** · P0 · UX/UI · Phase 2 (Epic 21)  
> User flows for discovering, installing, and managing third-party integrations.

---

## 1. Browse Marketplace

```
[Navigate to /marketplace]
    │
    ├─── Page layout
    │   ┌──────────────────────────────────────────────────────────┐
    │   │  Integrations    [🔍 Search integrations...]             │
    │   ├──────────────────────────────────────────────────────────┤
    │   │  [All] [LLM Providers] [Tools] [Data Sources] [Auth]    │
    │   ├──────────────────────────────────────────────────────────┤
    │   │  INSTALLED (3)                                           │
    │   │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
    │   │  │ 🟢 OpenAI   │ │ 🟢 GitHub   │ │ 🟡 Slack    │       │
    │   │  │ Connected   │ │ Connected   │ │ Needs auth  │       │
    │   │  │ [Configure] │ │ [Configure] │ │ [Connect]   │       │
    │   │  └─────────────┘ └─────────────┘ └─────────────┘       │
    │   ├──────────────────────────────────────────────────────────┤
    │   │  AVAILABLE                                               │
    │   │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
    │   │  │ Anthropic   │ │ Google AI   │ │ Notion      │       │
    │   │  │ LLM Provider│ │ LLM Provider│ │ Data Source │       │
    │   │  │ [Install]   │ │ [Install]   │ │ [Install]   │       │
    │   │  └─────────────┘ └─────────────┘ └─────────────┘       │
    │   └──────────────────────────────────────────────────────────┘
    │
    └─── RESULT: Organized view of installed and available integrations
```

---

## 2. Integration Card Anatomy

```
┌──────────────────────────┐
│  [Logo]  Integration Name│  ← Icon (32px) + Name (14px semibold)
│          Category badge   │  ← "LLM Provider" / "Tool" / "Data Source"
│                          │
│  Connect your OpenAI     │  ← Description (12px, 2-line clamp)
│  models for agent LLM    │
│                          │
│  Status: 🟢 Connected    │  ← Status indicator
│  [Configure]             │  ← Context-dependent CTA
└──────────────────────────┘

Status indicators:
    ├── 🟢 Connected — Integration installed and authorized
    ├── 🟡 Needs auth — Installed but OAuth/API key required
    ├── ⚪ Not installed — Available for installation
    └── 🔴 Error — Connection failed, needs re-authorization
```

---

## 3. Install Integration

```
[Marketplace — click "Install" on available integration]
    │
    ├─── Integration type determines flow
    │
    ├─── Type A: API Key (e.g., OpenAI, Anthropic)
    │       ├── Modal: "Connect OpenAI"
    │       │   ├── Description of what the integration provides
    │       │   ├── API Key input (password type, paste-friendly)
    │       │   ├── Optional: Organization ID
    │       │   ├── [Test Connection] → Validates API key
    │       │   │   ├── Success: Green checkmark "Connection successful"
    │       │   │   └── Failure: Red message "Invalid API key. Check and try again."
    │       │   └── [Save & Connect] (enabled after successful test)
    │       │
    │       └── RESULT: Integration installed, status → 🟢 Connected
    │
    ├─── Type B: OAuth (e.g., GitHub, Slack, Notion)
    │       ├── Modal: "Connect [Service]"
    │       │   ├── Description + permissions list
    │       │   ├── "Crewspace will request access to:"
    │       │   │   ├── ✓ Read your repositories
    │       │   │   ├── ✓ Create issues and comments
    │       │   │   └── ✓ Read organization data
    │       │   └── [Authorize with GitHub] → OAuth redirect
    │       │
    │       ├── OAuth redirect flow
    │       │   ├── Redirect to service's authorization page
    │       │   ├── User grants permissions on service's UI
    │       │   ├── Redirect back to Crewspace with auth code
    │       │   ├── Loading: "Connecting to GitHub..."
    │       │   └── Success: "GitHub connected successfully! ✓"
    │       │
    │       └── RESULT: Integration installed with OAuth token, status → 🟢 Connected
    │
    └─── Type C: No Auth (e.g., built-in tools like file, shell)
            ├── Click [Install] → Immediate activation
            ├── Toast: "Web Search tool installed"
            └── RESULT: Integration installed, status → 🟢 Connected
```

---

## 4. Configure Installed Integration

```
[Marketplace — click "Configure" on installed integration]
    │
    ├─── Configuration panel (slide-out drawer, right side, 480px)
    │
    │   ┌──────────────────────────────────────────────────────┐
    │   │  [Logo] OpenAI Configuration                    [×]  │
    │   ├──────────────────────────────────────────────────────┤
    │   │  Status: 🟢 Connected                                │
    │   │  Connected since: April 5, 2026                      │
    │   │                                                      │
    │   │  API Key: ••••••••••••sk-abc    [Show] [Update]      │
    │   │  Organization: org-123456       [Update]             │
    │   │                                                      │
    │   │  Default Model: [gpt-4o          ▾]                  │
    │   │                                                      │
    │   │  Usage this month:                                   │
    │   │  • 1,234 API calls                                   │
    │   │  • 456,789 tokens                                    │
    │   │  • Est. cost: $12.34                                 │
    │   │                                                      │
    │   │  Used by workflows:                                  │
    │   │  • Research Pipeline (3 agents)                      │
    │   │  • Content Writer (2 agents)                         │
    │   │                                                      │
    │   ├──────────────────────────────────────────────────────┤
    │   │  [Test Connection]    [Disconnect] (red, secondary)  │
    │   └──────────────────────────────────────────────────────┘
    │
    └─── RESULT: User can view, update, or remove the integration
```

---

## 5. Disconnect / Uninstall Integration

```
[Integration configuration — click "Disconnect"]
    │
    ├─── Confirmation dialog
    │       ├── "Disconnect OpenAI?"
    │       ├── "This will affect 2 workflows using this integration:"
    │       │   ├── • Research Pipeline
    │       │   └── • Content Writer
    │       ├── "These workflows will not be able to run until a new LLM provider is configured."
    │       ├── [Cancel] (default)
    │       └── [Disconnect] (red)
    │
    ├─── Confirm → Integration removed
    │       ├── Status → ⚪ Not installed (moved to Available section)
    │       ├── API key / OAuth token deleted
    │       ├── Affected workflows marked with warning icon on dashboard
    │       └── Toast: "OpenAI disconnected"
    │
    └─── RESULT: Integration removed, affected workflows warned
```

---

## 6. Integration Detail Page

```
[Click integration card title or "Learn more"]
    │
    ├─── Navigate to /marketplace/:integrationId
    │
    │   ┌──────────────────────────────────────────────────────────┐
    │   │  [Logo]                                                  │
    │   │  OpenAI                                                  │
    │   │  LLM Provider · by OpenAI                                │
    │   │                                           [Install]      │
    │   ├──────────────────────────────────────────────────────────┤
    │   │                                                          │
    │   │  Overview:                                               │
    │   │  Connect OpenAI's GPT models to power your Crewspace    │
    │   │  agents. Supports GPT-4o, GPT-4, and GPT-3.5 Turbo.    │
    │   │                                                          │
    │   │  Supported models:                                       │
    │   │  • gpt-4o (recommended)                                  │
    │   │  • gpt-4-turbo                                           │
    │   │  • gpt-3.5-turbo                                         │
    │   │                                                          │
    │   │  Features:                                               │
    │   │  ✓ Streaming responses                                   │
    │   │  ✓ Function calling                                      │
    │   │  ✓ JSON mode                                             │
    │   │  ✓ Vision (image input)                                  │
    │   │                                                          │
    │   │  Requirements:                                           │
    │   │  • OpenAI API key (get one at platform.openai.com)       │
    │   │                                                          │
    │   │  Documentation:                                          │
    │   │  [OpenAI Docs ↗] [Crewspace Integration Guide ↗]        │
    │   │                                                          │
    │   └──────────────────────────────────────────────────────────┘
    │
    └─── RESULT: Full integration details for informed decision
```

---

## 7. Edge Cases

| Scenario | Behavior |
|----------|----------|
| OAuth redirect fails | Return to Crewspace with error: "Authorization failed. [Try Again]" |
| OAuth token expires | Status → 🟡 Needs re-auth; banner on affected workflows: "Re-authorize [Service] to continue" |
| API key becomes invalid | Status → 🔴 Error; banner with re-connection prompt |
| Integration used by running workflow | Block disconnect: "Cannot disconnect while workflow is running. Stop the workflow first." |
| Rate limited by external service | Toast: "OpenAI rate limit reached. Retrying in Xs..." (handled by core framework's retry logic) |
| Network error during install | Toast: "Connection failed. Check your internet and try again." |

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-04-08 | UX/UI Agent | Initial marketplace user flows |
