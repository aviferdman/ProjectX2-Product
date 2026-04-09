# Crewspace Web App — Usability Testing Plan

> **TASK-178** · P1 · UX/UI · Phase 2 (Epic 23: Polish, Performance & Launch Prep)  
> Final usability testing: 10–12 users, onboarding validation, end-to-end flow verification, and heuristic evaluation across all major screens.  
> **Addendum (C189):** Added founder/startup CEO segment; expanded accessibility sample from 2 to 4 dedicated participants.

---

## Table of Contents

1. [Objectives & Success Criteria](#1-objectives--success-criteria)
2. [Participant Recruitment](#2-participant-recruitment)
3. [Test Environment & Setup](#3-test-environment--setup)
4. [Test Protocol](#4-test-protocol)
5. [Task Scenarios](#5-task-scenarios)
6. [Onboarding Validation (Deep Dive)](#6-onboarding-validation-deep-dive)
7. [Heuristic Evaluation Checklist](#7-heuristic-evaluation-checklist)
8. [Measurement Framework](#8-measurement-framework)
9. [Accessibility Testing Protocol](#9-accessibility-testing-protocol)
10. [Moderator Script](#10-moderator-script)
11. [Data Collection Templates](#11-data-collection-templates)
12. [Reporting Template](#12-reporting-template)

---

## 1. Objectives & Success Criteria

### 1.1 Primary Objectives

| # | Objective | Rationale |
|---|-----------|-----------|
| O1 | Validate onboarding flow (< 3 min to first workflow) | Core KPI from TASK-150 onboarding design |
| O2 | Confirm task completion rates ≥ 85% for critical paths | Industry benchmark for usable software |
| O3 | Identify blocking usability issues before launch | Prevent churn from first-session frustration |
| O4 | Validate information architecture & navigation | Ensure 4 user archetypes can find what they need |
| O5 | Assess canvas editor learnability | Most complex screen; must be intuitive for builders |

### 1.2 Success Criteria (Pass/Fail)

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| **Onboarding completion time** | ≤ 3 minutes (median) | Timer from /onboarding/welcome to first workflow run |
| **Onboarding completion rate** | ≥ 90% (no skips/abandons) | % of participants who finish all 4 wizard steps |
| **Critical task success rate** | ≥ 85% | Unassisted completion of scenarios S1–S5 |
| **SUS score** | ≥ 72 (above average) | System Usability Scale questionnaire |
| **Severity 1 issues** | 0 remaining | No blocking/critical issues at launch |
| **Time to create first workflow** | ≤ 5 minutes | From dashboard → canvas → 2 nodes + 1 edge + run |
| **Navigation success rate** | ≥ 90% | First-click accuracy on navigation tasks |

---

## 2. Participant Recruitment

### 2.1 Target Participants: 10 Users

| Segment | Count | Profile | Archetype |
|---------|-------|---------|-----------|
| **AI/ML engineers** | 3 | Build or use LLM-based applications; familiar with agent patterns | Builder |
| **Founders / startup CEOs** | 2 | Technical or semi-technical founders evaluating tools for their engineering team; budget decision-makers | Evaluator → Operator |
| **Full-stack developers** | 2 | Build web apps; new to multi-agent orchestration | Explorer → Builder |
| **Technical PMs / DevOps** | 2 | Manage developer workflows; evaluate tools for teams | Operator |
| **Non-technical power user** | 1 | Comfortable with no-code tools; no AI/agent background | Explorer |

> **Addendum note:** Founders added per PM review (C189). Founders are critical for validating the product's value proposition, onboarding clarity, and pricing perception since they are the primary purchase decision-makers for the target market (small-to-medium engineering teams). At least 1 founder should have AI/agent experience, 1 should be new to agents.

### 2.2 Screening Criteria

**Include:**
- Active developers or technical professionals
- At least some experience with workflow/automation tools (Zapier, n8n, Airflow, etc.)
- Mix of AI-experienced (5) and AI-new (5)
- Comfortable thinking aloud during tasks
- For founder segment: currently managing or building a product with ≥2 engineers; has evaluated/purchased developer tools in past 12 months

**Exclude:**
- Crewspace team members or close collaborators
- Users who have seen the Crewspace web UI before
- People unfamiliar with basic web application usage
- Founders with no technical background (cannot evaluate developer tooling)

### 2.3 Recruitment Channels

| Channel | Approach |
|---------|----------|
| Developer communities | Post in relevant Discord/Slack (AI/ML, Node.js, TypeScript) |
| Crewspace CLI users | Email existing CLI users who opted into feedback |
| Twitter/X | Reach out to AI-tooling enthusiasts |
| User testing platforms | UserTesting.com or Maze for quick recruitment |
| Founder communities | Indie Hackers, YC alumni Slack, startup-focused Discord servers |
| LinkedIn outreach | Target CTOs/technical founders at seed/Series A startups (2–20 engineers) |

### 2.4 Compensation

- $50 gift card (Amazon or GitHub Sponsors equivalent) per participant
- $75 gift card for founder segment (higher time value, harder to recruit)
- Session duration: 45–60 minutes

---

## 3. Test Environment & Setup

### 3.1 Environment

| Item | Specification |
|------|---------------|
| **Application** | Crewspace Web App — staging environment (pre-launch build) |
| **Browser** | Chrome latest (primary); one session on Firefox, one on Safari |
| **Device** | Desktop/laptop (min 1280px viewport) |
| **Test account** | Pre-created account per participant; LLM provider pre-configured (mock) |
| **Mock data** | 3 pre-built workflows in account for operator/dashboard tasks |
| **Network** | Stable broadband; no simulated degradation (test separately in QA) |

### 3.2 Recording Setup

| Tool | Purpose |
|------|---------|
| **Screen + audio recording** | Loom, OBS, or native screen recorder (with consent) |
| **Think-aloud** | Participant verbalizes thoughts continuously |
| **Observer notes** | Moderator captures timestamps of confusion, errors, recovery |
| **Click heatmaps** | Hotjar or FullStory session replay for post-analysis |
| **Task timer** | Stopwatch started/stopped per scenario |

### 3.3 Pre-Session Checklist

- [ ] Staging environment deployed and stable
- [ ] Test accounts created (fresh, no prior onboarding state)
- [ ] Mock LLM provider configured and responsive
- [ ] Screen recording software tested
- [ ] Consent form prepared and ready to sign
- [ ] Moderator script printed/available
- [ ] Scenario cards prepared (one per task)
- [ ] Post-task questionnaires loaded (SUS + custom)
- [ ] Backup plan if staging goes down (video walkthrough fallback)

---

## 4. Test Protocol

### 4.1 Session Structure (55 minutes)

| Phase | Duration | Activity |
|-------|----------|----------|
| **Welcome & consent** | 5 min | Introduction, consent form, recording permission |
| **Background interview** | 5 min | Role, tool experience, AI/agent familiarity |
| **Onboarding scenario (S1)** | 8 min | Sign up → wizard → first workflow (timed) |
| **Core task scenarios (S2–S5)** | 20 min | Canvas, debug, templates, dashboard tasks |
| **Exploratory scenario (S6)** | 7 min | Free exploration with think-aloud |
| **Post-session questionnaire** | 5 min | SUS + custom satisfaction questions |
| **Debrief interview** | 5 min | Open-ended: likes, frustrations, suggestions |

### 4.2 Moderation Rules

1. **Do not lead.** Never say "click the button in the top right." Use: "How would you do that?"
2. **Probe confusion.** If participant hesitates > 10 seconds: "What are you thinking right now?"
3. **Note recovery.** If participant makes an error, note it and observe how they recover.
4. **Time-box.** If a participant is stuck > 3 minutes on one task, mark as "failed" and provide a hint to move forward.
5. **Think-aloud.** Gently remind: "Please keep telling me what you're thinking."

---

## 5. Task Scenarios

### S1: Onboarding — First-Time User Experience ⭐ (Critical)

**User starts at:** `/signup` page (fresh account)  
**Scenario prompt:**  
> "You've just discovered Crewspace, a tool for building multi-agent AI workflows visually. You want to try it out. Please sign up and follow any setup steps."

**Tasks observed:**
1. Complete sign-up (OAuth or email)
2. Progress through onboarding wizard (all 4 steps)
3. Connect an LLM provider (pre-configured mock)
4. Create first workflow (from wizard or independently)
5. Notice and optionally complete the guided canvas tour

**Success criteria:**
| Metric | Target |
|--------|--------|
| Completion rate | 100% (no abandon) |
| Time to complete wizard | ≤ 3 min |
| Skip rate | < 20% (skip any step) |
| Errors during wizard | 0 blocking |
| First workflow created | Yes |

**Observer checkpoints:**
- [ ] Did user read the welcome screen or skip?
- [ ] How long on the "Connect LLM" step?
- [ ] Did user understand what an "agent" is from onboarding context?
- [ ] Did user accept or dismiss the guided tour?
- [ ] What was the first action after onboarding completed?

---

### S2: Build a Workflow on Canvas ⭐ (Critical)

**User starts at:** `/dashboard` (with empty workflow list OR one pre-built workflow)  
**Scenario prompt:**  
> "You want to create a new workflow with two AI agents: one researcher and one writer. The researcher should gather information, then the writer should create a summary. Set it up visually."

**Tasks observed:**
1. Create new workflow from dashboard
2. Add 2 Agent nodes to canvas (any method: sidebar drag, toolbar, double-click)
3. Configure agent names/roles in properties panel
4. Connect agents with an edge (output → input)
5. Add an LLM provider node and connect it
6. Run the workflow

**Success criteria:**
| Metric | Target |
|--------|--------|
| Completion rate | ≥ 85% |
| Time to complete | ≤ 5 min |
| Node add method discovered | ≥ 1 method |
| Connection created successfully | Yes (first or second attempt) |
| Run initiated | Yes |

**Observer checkpoints:**
- [ ] Which node-add method did user try first? (sidebar, toolbar, double-click, context menu)
- [ ] Did user find the properties panel intuitive?
- [ ] How did user discover edge creation (drag from handle)?
- [ ] Any confusion between Agent, Task, Tool, LLM node types?
- [ ] Did user attempt to run before connecting LLM? (validation check)

---

### S3: Debug a Failed Workflow

**User starts at:** Canvas with a pre-built workflow that has a completed (failed) run  
**Scenario prompt:**  
> "Your workflow ran but one of the agents failed. Find out what went wrong."

**Tasks observed:**
1. Navigate to debug timeline (from toast, toolbar, or dashboard)
2. Identify the failed agent on the timeline
3. Filter events to show only errors
4. Expand a log entry to see the error detail
5. Navigate back to canvas

**Success criteria:**
| Metric | Target |
|--------|--------|
| Completion rate | ≥ 80% |
| Time to identify failure | ≤ 2 min |
| Filter usage | Attempted at least one filter |
| Error message found | Yes |

**Observer checkpoints:**
- [ ] How did user access the debug timeline?
- [ ] Was the failed agent visually obvious (red indicator)?
- [ ] Did user understand the timeline layout (horizontal lanes)?
- [ ] Did user discover the filter bar?
- [ ] Could user interpret the structured log entry?

---

### S4: Browse and Use a Template

**User starts at:** `/dashboard`  
**Scenario prompt:**  
> "You want to create a customer support workflow but don't want to start from scratch. See if there's a template you can use."

**Tasks observed:**
1. Navigate to Template Library
2. Search or browse for a relevant template
3. Preview a template (click to open detail modal)
4. Instantiate the template (click "Use Template")
5. See the workflow appear on their canvas

**Success criteria:**
| Metric | Target |
|--------|--------|
| Completion rate | ≥ 90% |
| Time to find template | ≤ 1.5 min |
| Template preview used | Yes |
| Instantiation understood | Yes (workflow appears in their account) |

**Observer checkpoints:**
- [ ] Did user find the Templates nav link immediately?
- [ ] Did user use search or browse by category?
- [ ] Was the template card info sufficient to make a decision?
- [ ] Did user understand "Use Template" creates a copy?
- [ ] Any surprise at where the workflow appeared after instantiation?

---

### S5: Manage Workflows on Dashboard

**User starts at:** `/dashboard` with 3+ pre-built workflows  
**Scenario prompt:**  
> "You have several workflows. Please duplicate your 'Research Bot' workflow, rename it, and delete the original."

**Tasks observed:**
1. Find the specific workflow by name
2. Duplicate it (right-click or card actions)
3. Rename the duplicate
4. Delete the original
5. Confirm deletion

**Success criteria:**
| Metric | Target |
|--------|--------|
| Completion rate | ≥ 85% |
| Time to complete | ≤ 2 min |
| Duplicate discovered | Yes |
| Delete confirmation handled | Yes |

**Observer checkpoints:**
- [ ] Did user find the workflow quickly (search or scan)?
- [ ] How did user access the duplicate action? (right-click, kebab menu, card action)
- [ ] Was rename inline or did they need to open the workflow?
- [ ] Did the delete confirmation feel appropriate (not too aggressive, not too weak)?

---

### S6: Free Exploration (Unstructured)

**Scenario prompt:**  
> "Take 5 minutes to explore the app freely. Go wherever interests you. Tell me what you notice, what you like, and anything that confuses you."

**Observer focus:**
- Where does the user go first?
- What features do they discover independently?
- What do they try but fail to accomplish?
- What do they verbally comment on (positive or negative)?
- Do they find the Marketplace? Settings? Command palette (Cmd+K)?

---

## 6. Onboarding Validation (Deep Dive)

### 6.1 Wizard Step-by-Step Validation

Test each onboarding layer against its design specification (from TASK-150):

#### Layer 1: Onboarding Wizard

| Step | What to validate | Pass criteria |
|------|-----------------|---------------|
| **Welcome** | User reads and understands value proposition | Proceeds without confusion; can describe what Crewspace does |
| **Connect LLM** | User understands why LLM is needed; can select a provider | Completes within 60s; no wrong-provider errors |
| **First Workflow** | Guided template creation feels natural | User follows along; workflow created successfully |
| **Complete** | Celebration screen feels rewarding; CTA clear | User knows what to do next; clicks primary CTA |

#### Layer 2: Interactive Guided Tour

| Step | What to validate | Pass criteria |
|------|-----------------|---------------|
| **Tour prompt** | "Take a tour?" is noticeable but not annoying | ≥ 50% acceptance rate; dismissal is frictionless |
| **Sidebar spotlight** | User understands sidebar purpose | Can describe node categories after spotlight |
| **Canvas spotlight** | User understands the workspace | Knows this is where workflows are built |
| **Toolbar spotlight** | User understands available actions | Can identify Run and Add buttons |
| **Properties spotlight** | User understands contextual editing | Knows properties appear on node selection |
| **Run spotlight** | User understands how to execute | Can locate and describe the Run button |

#### Layer 3: Contextual Tooltips

| Tooltip trigger | What to validate | Pass criteria |
|-----------------|-----------------|---------------|
| First sidebar hover | Tooltip appears and is helpful | Read and understood; not blocking workflow |
| First node add | Tooltip about connections appears | User learns about connecting nodes |
| First edge attempt | Connection hint is timely | Appears when user needs it most |
| First run attempt | Pre-run checklist tooltip | User understands validation requirements |

### 6.2 Onboarding Anti-Patterns to Watch For

| Anti-Pattern | Signal | Severity |
|-------------|--------|----------|
| **Wizard skipping** | User clicks "Skip" on any step | 🟡 Medium — investigate why |
| **Confusion at LLM step** | User doesn't understand "provider" | 🔴 High — terminology issue |
| **Lost after wizard** | User doesn't know what to do next | 🔴 High — CTA failure |
| **Tour fatigue** | User dismisses tour after 1-2 steps | 🟡 Medium — too many steps? |
| **Tooltip blindness** | User ignores inline hints | 🟡 Medium — positioning/timing issue |
| **Double onboarding** | Wizard + Tour feels repetitive | 🟡 Medium — content overlap |
| **Premature canvas** | User reaches canvas without understanding nodes | 🔴 High — wizard didn't educate enough |

### 6.3 Onboarding Metrics Collection

Track per-participant:

```
participant_id: P01
onboarding_start: 10:02:15
onboarding_end: 10:04:48
wizard_duration: 2m 33s
wizard_steps_completed: 4/4
wizard_steps_skipped: 0
tour_accepted: yes
tour_steps_completed: 5/5
tour_duration: 1m 12s
first_action_after_onboarding: "clicked on sidebar agent"
tooltips_seen: 3/8
tooltips_dismissed_early: 0
first_workflow_run_time: 10:07:22 (5m 07s from signup)
comprehension_score: 4/5 (post-task question)
```

---

## 7. Heuristic Evaluation Checklist

Pre-testing heuristic review using Nielsen's 10 Usability Heuristics, applied to each major screen.

### 7.1 Global Application

| # | Heuristic | Evaluation Area | Questions |
|---|-----------|----------------|-----------|
| H1 | Visibility of system status | All screens | Is current state always visible? Loading indicators present? Save status clear? |
| H2 | Match between system and real world | Terminology | Are "Agent," "Task," "Tool," "LLM Provider" intuitive? Do labels match user mental models? |
| H3 | User control and freedom | Navigation | Can users undo? Go back? Escape modals? Exit onboarding? |
| H4 | Consistency and standards | UI patterns | Are similar actions done the same way everywhere? Button styles consistent? |
| H5 | Error prevention | Forms, canvas | Does the system prevent errors before they happen? Validation before Run? |
| H6 | Recognition rather than recall | Discovery | Can users see options rather than remember commands? Sidebar visible? |
| H7 | Flexibility and efficiency | Power users | Keyboard shortcuts available? Command palette? Batch operations? |
| H8 | Aesthetic and minimalist design | Visual | Is information density appropriate? No unnecessary clutter? |
| H9 | Help users recognize and recover from errors | Error states | Are error messages clear, specific, and actionable? |
| H10 | Help and documentation | Onboarding, tooltips | Is contextual help available? Can users access docs? |

### 7.2 Per-Screen Heuristic Scorecard

Rate each heuristic per screen: ✅ Pass | ⚠️ Minor issue | ❌ Fail

| Heuristic | Dashboard | Canvas | Debug Timeline | Templates | Marketplace | Onboarding | Settings |
|-----------|-----------|--------|---------------|-----------|-------------|------------|----------|
| H1: System status | | | | | | | |
| H2: Real-world match | | | | | | | |
| H3: User control | | | | | | | |
| H4: Consistency | | | | | | | |
| H5: Error prevention | | | | | | | |
| H6: Recognition | | | | | | | |
| H7: Flexibility | | | | | | | |
| H8: Minimalist design | | | | | | | |
| H9: Error recovery | | | | | | | |
| H10: Help/documentation | | | | | | | |

*To be completed during testing sessions — one scorecard per evaluator.*

---

## 8. Measurement Framework

### 8.1 Quantitative Metrics

| Category | Metric | Measurement Method | Target |
|----------|--------|-------------------|--------|
| **Effectiveness** | Task completion rate | % of scenarios completed unassisted | ≥ 85% |
| **Effectiveness** | Error rate | # errors per scenario per participant | < 2 |
| **Effectiveness** | First-click accuracy | % correct first clicks on navigation tasks | ≥ 90% |
| **Efficiency** | Time-on-task | Stopwatch per scenario | Per-scenario targets above |
| **Efficiency** | Steps to completion | # actions to finish each task | ≤ 120% of optimal path |
| **Satisfaction** | SUS score | Post-session questionnaire | ≥ 72 |
| **Satisfaction** | NPS (Net Promoter Score) | "How likely to recommend?" (0–10) | ≥ 30 |
| **Satisfaction** | Ease rating per task | "How easy was this task?" (1–5) | ≥ 4.0 avg |
| **Learnability** | Second attempt improvement | Compare S2 with a repeat task in S6 | Measurable improvement |

### 8.2 Qualitative Data

| Data Type | Collection Method |
|-----------|-----------------|
| Think-aloud transcripts | Audio recording + notes |
| Confusion points | Observer timestamps + description |
| Verbal satisfaction | Debrief quotes |
| Feature requests | Participant suggestions during/after |
| Mental model mismatches | Where user expectation ≠ system behavior |
| Workarounds | When user invents non-standard paths |

### 8.3 Issue Severity Classification

| Severity | Definition | Action |
|----------|-----------|--------|
| **S1 — Critical** | Prevents task completion; no workaround | Must fix before launch |
| **S2 — Major** | Significant delay or confusion; workaround exists | Fix before launch if possible |
| **S3 — Minor** | Noticeable friction; slight delay | Fix in first post-launch update |
| **S4 — Cosmetic** | Visual or wording issue; doesn't impact task | Schedule for later sprint |

### 8.4 Issue Frequency Classification

| Frequency | Definition |
|-----------|-----------|
| **High** | ≥ 50% of participants encountered it |
| **Medium** | 25–49% of participants |
| **Low** | < 25% of participants (1–3 users) |

> **Note:** For accessibility-specific issues, frequency is measured against the 4 a11y participants only. An issue found by ≥2 of 4 a11y participants is classified as "High (a11y)."

---

## 9. Accessibility Testing Protocol

Aligned with TASK-171 accessibility requirements (WCAG 2.1 AA).

> **Addendum (C189):** Accessibility sample increased from 2 to 4 dedicated participants per PM review. This provides statistically meaningful coverage: 2 keyboard-only users and 2 assistive technology users, ensuring issues are reproducible and not participant-specific artifacts.

### 9.0 Dedicated Accessibility Participants: 4 Users

In addition to the 10 core usability participants, recruit 4 dedicated accessibility testers. These participants run the full S1–S5 scenarios using their assistive technology of choice, plus the accessibility-specific checks below.

| # | Assistive Technology | Platform | Recruitment |
|---|---------------------|----------|-------------|
| A1 | Keyboard-only (no mouse) | Windows + Chrome | Any developer comfortable with keyboard-first workflow |
| A2 | Keyboard-only (no mouse) | macOS + Safari | Any developer comfortable with keyboard-first workflow |
| A3 | NVDA screen reader | Windows + Chrome/Firefox | Recruit via accessibility communities (a11y Slack, NFB tech division, AbilityNet) |
| A4 | VoiceOver screen reader | macOS + Safari | Recruit via accessibility communities (AppleVis, MacVisionaries mailing list) |

**Screening for A3/A4:**
- Regular screen reader users (daily or weekly use)
- Comfortable with web applications
- Experience with developer tools preferred but not required
- Compensated at $75 per session (60–75 min for a11y sessions)

### 9.1 Keyboard-Only Test (2 participants: A1, A2)

Run one full session (S1–S5) using keyboard only (no mouse). Observe:

| Check | Area | Pass criteria |
|-------|------|---------------|
| Tab order logical | All screens | Focus moves in expected reading order |
| No keyboard traps | Modals, panels | Escape exits all overlays; no dead ends |
| Focus visible | All interactive elements | Clear focus ring (violet) on every focusable element |
| Skip links work | Page load | "Skip to canvas" / "Skip to main content" present and functional |
| Modal focus trap | Onboarding wizard, delete confirm | Focus stays within modal until dismissed |
| Canvas keyboard nav | Canvas editor | Can add nodes, navigate between them, open properties |
| Shortcuts work | Canvas | Ctrl+Z, Ctrl+N, Cmd+K all functional |

### 9.2 Screen Reader Test (2 participants: A3, A4)

Run key scenarios with NVDA (A3) and VoiceOver (A4):

| Check | Pass criteria |
|-------|---------------|
| Page landmarks | `<main>`, `<nav>`, `<header>` present and announced |
| Button labels | All buttons have accessible names (not just icons) |
| Node announcements | Canvas nodes announced with type, name, and state |
| Live regions | Status changes (save, run, error) announced via `aria-live` |
| Form labels | All inputs associated with `<label>` or `aria-label` |
| Modal announcements | Dialog role and title announced on open |
| Timeline navigation | Debug timeline events readable and navigable |

### 9.3 Visual Accessibility Checks

| Check | Tool | Pass criteria |
|-------|------|---------------|
| Color contrast (text) | axe DevTools / Lighthouse | ≥ 4.5:1 ratio (AA) |
| Color contrast (UI) | axe DevTools | ≥ 3:1 ratio for UI components |
| Color not sole indicator | Manual | Status communicated via text/icon + color |
| Reduced motion | Toggle `prefers-reduced-motion` | All animations disabled; transitions instant |
| Zoom 200% | Browser zoom | Layout usable at 200%; no overflow or clipping |
| High contrast mode | Windows High Contrast | All content visible; no lost elements |

---

## 10. Moderator Script

### 10.1 Welcome (5 min)

```
"Hi [Name], thanks for joining us today. I'm [Moderator], and I'll be guiding 
you through today's session.

We're testing a new web application called Crewspace — a visual tool for building 
multi-agent AI workflows. I want to emphasize: we're testing the software, not 
you. There are no wrong answers, and if something is confusing, that's the 
software's problem, not yours.

I'll ask you to complete some tasks and think out loud as you go — just tell me 
what you're seeing, thinking, and feeling as you work through things. 

This session will take about 45–55 minutes, and with your permission, I'll record 
the screen and audio so our team can review later.

Do you have any questions before we start?"
```

### 10.2 Background Questions (5 min)

```
1. "What's your role? What kind of work do you do day to day?"
2. "Have you used any workflow or automation tools before? (Zapier, n8n, Airflow, etc.)"
3. "Are you familiar with AI agents or multi-agent systems?"
4. "On a scale of 1-5, how comfortable are you with visual/drag-and-drop editors?"
```

### 10.3 Task Introduction Template

```
"For each task, I'll give you a scenario on this card. Please read it out loud, 
then try to accomplish the goal. Remember to think aloud as you work.

I can't help you during the task, but if you're really stuck after a few minutes, 
I'll give you a nudge. Ready?"
```

### 10.4 Post-Task Probe Questions

After each scenario, ask:

```
1. "How easy or difficult was that? (1 = very difficult, 5 = very easy)"
2. "Was anything confusing or unexpected?"
3. "Is there anything you expected to find that wasn't there?"
```

### 10.5 Debrief Questions (5 min)

```
1. "Overall, what was your first impression of Crewspace?"
2. "What was the easiest part? The hardest part?"
3. "If you could change one thing about the experience, what would it be?"
4. "Would you use this tool for your work? Why or why not?"
5. "How does this compare to other tools you've used?"
6. "Anything else you'd like to share?"
```

---

## 11. Data Collection Templates

### 11.1 Per-Participant Task Log

```
Participant: P__
Date: ____-__-__
Moderator: ____________

| Scenario | Start Time | End Time | Duration | Completed | Errors | Ease (1-5) | Notes |
|----------|-----------|----------|----------|-----------|--------|------------|-------|
| S1       |           |          |          | ☐ Y ☐ N   |        |            |       |
| S2       |           |          |          | ☐ Y ☐ N   |        |            |       |
| S3       |           |          |          | ☐ Y ☐ N   |        |            |       |
| S4       |           |          |          | ☐ Y ☐ N   |        |            |       |
| S5       |           |          |          | ☐ Y ☐ N   |        |            |       |
| S6       |           |          | 5 min    | N/A       | N/A    | N/A        |       |
```

### 11.2 Issue Log Template

```
| Issue # | Scenario | Severity | Frequency | Description | Participant(s) | Suggested Fix |
|---------|----------|----------|-----------|-------------|----------------|---------------|
| U001    |          |          |           |             |                |               |
| U002    |          |          |           |             |                |               |
```

### 11.3 System Usability Scale (SUS) Questionnaire

Administered after all tasks. Rate each statement 1 (Strongly Disagree) to 5 (Strongly Agree):

| # | Statement |
|---|-----------|
| 1 | I think that I would like to use Crewspace frequently. |
| 2 | I found Crewspace unnecessarily complex. |
| 3 | I thought Crewspace was easy to use. |
| 4 | I think I would need the support of a technical person to use Crewspace. |
| 5 | I found the various functions in Crewspace were well integrated. |
| 6 | I thought there was too much inconsistency in Crewspace. |
| 7 | I would imagine that most people would learn to use Crewspace very quickly. |
| 8 | I found Crewspace very cumbersome to use. |
| 9 | I felt very confident using Crewspace. |
| 10 | I needed to learn a lot of things before I could get going with Crewspace. |

**SUS Scoring:** `((Sum of odd items - 5) + (25 - Sum of even items)) × 2.5`  
**Scale:** 0–100. Average = 68. Target = ≥ 72.

### 11.4 Onboarding-Specific Post-Task Questions

| # | Question | Scale |
|---|----------|-------|
| 1 | The onboarding steps were clear and easy to follow. | 1–5 Likert |
| 2 | I understood what Crewspace does after onboarding. | 1–5 Likert |
| 3 | The LLM connection step made sense to me. | 1–5 Likert |
| 4 | I knew what to do after the wizard finished. | 1–5 Likert |
| 5 | The guided tour of the canvas was helpful. | 1–5 Likert |
| 6 | How long did onboarding feel? | Too short / Just right / Too long |
| 7 | What would you change about the setup process? | Open text |

---

## 12. Reporting Template

### 12.1 Executive Summary

After testing, produce a report with:

```
# Crewspace Usability Test Report — [Date]

## Executive Summary
- Participants tested: X (core: X, accessibility: X)
- Sessions completed: X  
- Overall SUS score: XX/100
- Critical issues found: X
- Onboarding completion rate: XX%
- Median onboarding time: Xm XXs
- Accessibility issues found: X (keyboard: X, screen reader: X)

## Key Findings (Top 5)
1. [Finding with severity and frequency]
2. ...

## Recommendation Priority
| Priority | Issue | Fix |
|----------|-------|-----|
| P0 (before launch) | ... | ... |
| P1 (first update)  | ... | ... |
| P2 (backlog)       | ... | ... |

## Detailed Scenario Results
[Per-scenario aggregate data]

## Appendices
- Individual participant logs
- Full issue log
- SUS calculation
- Session recordings (links)
```

### 12.2 Output Deliverable

The final usability test report should be saved as:  
`docs/ux/usability-test-report.md` (created as part of TASK-179)

---

## Appendix A: Schedule Template

| Session | Date | Time | Participant | Archetype | Moderator |
|---------|------|------|-------------|-----------|-----------|
| 1 | TBD | 10:00–10:55 | P01 | Builder (AI/ML) | |
| 2 | TBD | 11:00–11:55 | P02 | Explorer (Full-stack) | |
| 3 | TBD | 13:00–13:55 | P03 | Builder (AI/ML) | |
| 4 | TBD | 14:00–14:55 | P04 | Operator (PM) | |
| 5 | TBD | 10:00–10:55 | P05 | Explorer (Full-stack) | |
| 6 | TBD | 11:00–11:55 | P06 | Builder (AI/ML) | |
| 7 | TBD | 13:00–13:55 | P07 | Operator (DevOps) | |
| 8 | TBD | 14:00–14:55 | P08 | Explorer (Non-tech) | |

## Appendix B: Consent Form Template

```
USABILITY TESTING CONSENT FORM

Project: Crewspace Web Application
Conducted by: [Company Name]

I understand that:
- This session will be recorded (screen and audio)
- Recordings will only be used for internal product improvement
- My identity will remain confidential in any reports
- I can stop the session at any time without penalty
- I will receive [compensation] for my participation

Participant signature: ___________________  Date: ____________
Moderator signature:  ___________________  Date: ____________
```

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-04-09 | UX/UI Agent | Initial usability testing plan (TASK-178) |
