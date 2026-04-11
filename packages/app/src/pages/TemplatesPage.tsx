/**
 * TemplatesPage — Crew & workflow template gallery.
 * Browse pre-built team configurations and spin up new workflows instantly.
 */
import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { crewPath, ROUTES } from '../router/routes.js';
import { useCrewStore } from '../store/index.js';
import { AgentAvatar } from '../components/AgentAvatar.js';

/* ------------------------------------------------------------------ */
/* Template data                                                       */
/* ------------------------------------------------------------------ */

interface TemplateAgent {
  role: string;
  goal: string;
  color: string;
}

interface TemplateTask {
  description: string;
  agentRole: string;
  expectedOutput: string;
  /** Indices of tasks this depends on. If omitted, no dependencies (runs in parallel). */
  dependsOn?: number[];
  /** If present, this is a collaborative discussion task. */
  discussion?: {
    participantRoles: string[];
    maxRounds: number;
    convergenceStrategy: 'unanimous' | 'majority' | 'llm-judge' | 'stable-output';
    topic?: string;
  };
}

interface TemplateWorkflow {
  name: string;
  description: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryColor: string;
  agents: TemplateAgent[];
  tasks: TemplateTask[];
  workflows: TemplateWorkflow[];
  usageCount: number;
  featured: boolean;
  tags: string[];
}

const TEMPLATES: Template[] = [
  {
    id: 'tpl-market-research',
    name: 'Market Research Crew',
    description: 'A team of analysts that researches market trends, competitor strategies, and customer needs — delivering a comprehensive report with actionable insights.',
    category: 'Research',
    categoryColor: '#38bdf8',
    agents: [
      { role: 'Industry Analyst', goal: 'Identify market trends and opportunities', color: '#38bdf8' },
      { role: 'Competitor Researcher', goal: 'Analyze competitor strengths and weaknesses', color: '#a78bfa' },
      { role: 'Customer Insights Specialist', goal: 'Synthesize customer feedback and needs', color: '#34d399' },
      { role: 'Report Writer', goal: 'Compile findings into executive summary', color: '#fbbf24' },
    ],
    tasks: [
      /* 0 */ { description: 'Research industry trends and market size', agentRole: 'Industry Analyst', expectedOutput: 'Market trends report with data points' },
      /* 1 */ { description: 'Identify top 5 competitors and their strategies', agentRole: 'Competitor Researcher', expectedOutput: 'Competitive landscape analysis' },
      /* 2 */ { description: 'Analyze customer surveys and feedback channels', agentRole: 'Customer Insights Specialist', expectedOutput: 'Customer needs summary' },
      /* 3 */ { description: 'Identify market gaps and opportunities', agentRole: 'Industry Analyst', expectedOutput: 'Opportunity matrix', dependsOn: [0] },
      /* 4 */ { description: 'Cross-team debate on strategic priorities and market positioning', agentRole: 'Industry Analyst', expectedOutput: 'Agreed strategic priorities document', dependsOn: [0, 1, 2, 3], discussion: { participantRoles: ['Industry Analyst', 'Competitor Researcher', 'Customer Insights Specialist'], maxRounds: 3, convergenceStrategy: 'majority', topic: 'Which market opportunities should we prioritize?' } },
      /* 5 */ { description: 'Synthesize findings into executive report', agentRole: 'Report Writer', expectedOutput: 'Executive summary with recommendations', dependsOn: [4] },
      /* 6 */ { description: 'Create actionable strategy roadmap', agentRole: 'Report Writer', expectedOutput: 'Strategic roadmap document', dependsOn: [5] },
    ],
    workflows: [
      { name: 'Full Market Analysis', description: 'End-to-end market research with competitor and customer analysis' },
      { name: 'Quick Competitor Scan', description: 'Rapid competitive landscape overview for a specific sector' },
    ],
    usageCount: 2340,
    featured: true,
    tags: ['market analysis', 'competitive intelligence', 'strategy'],
  },
  {
    id: 'tpl-content-marketing',
    name: 'Content Marketing Squad',
    description: 'Plan, write, review, and schedule a full content calendar — from ideation to publish-ready blog posts, social media copy, and email campaigns.',
    category: 'Content',
    categoryColor: '#fbbf24',
    agents: [
      { role: 'Content Strategist', goal: 'Define content themes and editorial calendar', color: '#fbbf24' },
      { role: 'Copywriter', goal: 'Draft blog posts and social media content', color: '#fb7185' },
      { role: 'SEO Specialist', goal: 'Optimize content for search engines', color: '#34d399' },
      { role: 'Editor', goal: 'Review and polish all written content', color: '#a78bfa' },
    ],
    tasks: [
      /* 0 */ { description: 'Define content themes and editorial calendar', agentRole: 'Content Strategist', expectedOutput: 'Monthly content calendar' },
      /* 1 */ { description: 'Draft 4 blog posts based on themes', agentRole: 'Copywriter', expectedOutput: 'Blog post drafts', dependsOn: [0] },
      /* 2 */ { description: 'Create social media copy for each post', agentRole: 'Copywriter', expectedOutput: 'Social media copy pack', dependsOn: [0] },
      /* 3 */ { description: 'Perform keyword research and optimize content', agentRole: 'SEO Specialist', expectedOutput: 'SEO-optimized content', dependsOn: [0] },
      /* 4 */ { description: 'Draft email campaign copy', agentRole: 'Copywriter', expectedOutput: 'Email campaign drafts', dependsOn: [0] },
      /* 5 */ { description: 'Editorial review session — align tone, accuracy, and SEO balance', agentRole: 'Editor', expectedOutput: 'Aligned editorial guidelines', dependsOn: [1, 2, 3, 4], discussion: { participantRoles: ['Editor', 'Copywriter', 'SEO Specialist'], maxRounds: 3, convergenceStrategy: 'stable-output', topic: 'Balance SEO optimization with engaging writing style' } },
      /* 6 */ { description: 'Final quality check and approval', agentRole: 'Editor', expectedOutput: 'Approved content package', dependsOn: [5] },
    ],
    workflows: [
      { name: 'Monthly Blog Pipeline', description: 'Plan, write, and publish a full month of blog content' },
      { name: 'Social Campaign Blitz', description: 'Create and schedule a week of social media content' },
      { name: 'Email Newsletter Flow', description: 'Draft and review a weekly email newsletter' },
    ],
    usageCount: 1870,
    featured: true,
    tags: ['blogging', 'social media', 'SEO', 'campaigns'],
  },
  {
    id: 'tpl-code-review',
    name: 'Code Review Pipeline',
    description: 'Automated multi-pass code review that checks for bugs, security vulnerabilities, performance issues, and style consistency across pull requests.',
    category: 'Engineering',
    categoryColor: '#a78bfa',
    agents: [
      { role: 'Security Auditor', goal: 'Identify security vulnerabilities and injection risks', color: '#fb7185' },
      { role: 'Performance Reviewer', goal: 'Flag performance bottlenecks and inefficiencies', color: '#fbbf24' },
      { role: 'Style Checker', goal: 'Ensure code follows team style guidelines', color: '#a78bfa' },
    ],
    tasks: [
      /* 0 */ { description: 'Scan for security vulnerabilities (OWASP Top 10)', agentRole: 'Security Auditor', expectedOutput: 'Security findings report' },
      /* 1 */ { description: 'Profile performance hotspots and bottlenecks', agentRole: 'Performance Reviewer', expectedOutput: 'Performance analysis' },
      /* 2 */ { description: 'Check style guide compliance', agentRole: 'Style Checker', expectedOutput: 'Style violations list' },
      /* 3 */ { description: 'Joint severity assessment — debate priority of findings', agentRole: 'Security Auditor', expectedOutput: 'Prioritized findings with consensus severity ratings', dependsOn: [0, 1, 2], discussion: { participantRoles: ['Security Auditor', 'Performance Reviewer', 'Style Checker'], maxRounds: 2, convergenceStrategy: 'majority', topic: 'Classify each finding as critical, major, or minor' } },
      /* 4 */ { description: 'Compile all findings into unified review', agentRole: 'Security Auditor', expectedOutput: 'Unified code review report', dependsOn: [3] },
      /* 5 */ { description: 'Generate fix suggestions for critical issues', agentRole: 'Performance Reviewer', expectedOutput: 'Suggested fixes', dependsOn: [3] },
    ],
    workflows: [
      { name: 'Full PR Review', description: 'Complete multi-pass code review for pull requests' },
      { name: 'Security-Only Audit', description: 'Focused security vulnerability scan' },
    ],
    usageCount: 1450,
    featured: false,
    tags: ['code review', 'security', 'CI/CD', 'quality'],
  },
  {
    id: 'tpl-customer-support',
    name: 'Customer Support Crew',
    description: 'Triage incoming tickets, generate contextual responses, and escalate complex issues — reducing response time and improving customer satisfaction.',
    category: 'Support',
    categoryColor: '#34d399',
    agents: [
      { role: 'Ticket Classifier', goal: 'Categorize and prioritize support tickets', color: '#38bdf8' },
      { role: 'Response Generator', goal: 'Draft helpful, empathetic replies', color: '#34d399' },
      { role: 'Escalation Manager', goal: 'Route complex issues to human agents', color: '#fb7185' },
    ],
    tasks: [
      /* 0 */ { description: 'Classify and prioritize incoming tickets', agentRole: 'Ticket Classifier', expectedOutput: 'Categorized ticket queue' },
      /* 1 */ { description: 'Generate contextual response drafts', agentRole: 'Response Generator', expectedOutput: 'Response drafts', dependsOn: [0] },
      /* 2 */ { description: 'Escalation triage discussion — decide which tickets need human intervention', agentRole: 'Escalation Manager', expectedOutput: 'Agreed escalation criteria and routed tickets', dependsOn: [0, 1], discussion: { participantRoles: ['Ticket Classifier', 'Escalation Manager'], maxRounds: 2, convergenceStrategy: 'unanimous', topic: 'Which tickets should be escalated vs auto-resolved?' } },
      /* 3 */ { description: 'Route complex issues to human agents', agentRole: 'Escalation Manager', expectedOutput: 'Escalation queue', dependsOn: [2] },
      /* 4 */ { description: 'Track SLA compliance and response times', agentRole: 'Escalation Manager', expectedOutput: 'SLA dashboard data', dependsOn: [1, 3] },
    ],
    workflows: [
      { name: 'Ticket Triage Pipeline', description: 'Classify, respond, and escalate support tickets automatically' },
      { name: 'SLA Compliance Monitor', description: 'Track and report on support SLA metrics' },
    ],
    usageCount: 980,
    featured: true,
    tags: ['helpdesk', 'automation', 'ticketing', 'SLA'],
  },
  {
    id: 'tpl-data-pipeline',
    name: 'Data Analysis Pipeline',
    description: 'Ingest data from multiple sources, clean and transform it, run statistical analysis, and produce visualization-ready summaries and dashboards.',
    category: 'Data',
    categoryColor: '#fb7185',
    agents: [
      { role: 'Data Engineer', goal: 'Collect and clean data from multiple sources', color: '#38bdf8' },
      { role: 'Data Analyst', goal: 'Run statistical analysis and find patterns', color: '#fb7185' },
      { role: 'Visualization Specialist', goal: 'Create charts and dashboard summaries', color: '#fbbf24' },
    ],
    tasks: [
      /* 0 */ { description: 'Ingest and clean data from multiple sources', agentRole: 'Data Engineer', expectedOutput: 'Clean dataset' },
      /* 1 */ { description: 'Run statistical analysis and find patterns', agentRole: 'Data Analyst', expectedOutput: 'Statistical findings', dependsOn: [0] },
      /* 2 */ { description: 'Data quality review — discuss anomalies and validation rules', agentRole: 'Data Engineer', expectedOutput: 'Validated data quality rules and resolved anomalies', dependsOn: [0, 1], discussion: { participantRoles: ['Data Engineer', 'Data Analyst'], maxRounds: 3, convergenceStrategy: 'stable-output', topic: 'Are the detected anomalies real issues or expected patterns?' } },
      /* 3 */ { description: 'Generate data visualizations and charts', agentRole: 'Visualization Specialist', expectedOutput: 'Chart package', dependsOn: [2] },
      /* 4 */ { description: 'Compile dashboard-ready summaries', agentRole: 'Visualization Specialist', expectedOutput: 'Dashboard summary', dependsOn: [2] },
      /* 5 */ { description: 'Write data insights narrative', agentRole: 'Data Analyst', expectedOutput: 'Insights report', dependsOn: [3, 4] },
    ],
    workflows: [
      { name: 'End-to-End Analytics', description: 'Ingest, analyze, and visualize data from raw sources' },
      { name: 'Quick Insight Report', description: 'Fast statistical analysis on a single dataset' },
    ],
    usageCount: 760,
    featured: false,
    tags: ['analytics', 'ETL', 'dashboards', 'statistics'],
  },
  {
    id: 'tpl-onboarding',
    name: 'Employee Onboarding Crew',
    description: 'Automate new hire onboarding — generate personalized welcome docs, schedule orientation meetings, assign training modules, and track completion.',
    category: 'Automation',
    categoryColor: '#cbd5e1',
    agents: [
      { role: 'Onboarding Coordinator', goal: 'Orchestrate the full onboarding checklist', color: '#a78bfa' },
      { role: 'Document Generator', goal: 'Create personalized welcome materials', color: '#34d399' },
      { role: 'Training Scheduler', goal: 'Assign and schedule training modules', color: '#fbbf24' },
    ],
    tasks: [
      /* 0 */ { description: 'Generate personalized welcome packet', agentRole: 'Document Generator', expectedOutput: 'Welcome documents' },
      /* 1 */ { description: 'Schedule first-week orientation meetings', agentRole: 'Training Scheduler', expectedOutput: 'Orientation calendar' },
      /* 2 */ { description: 'Assign role-specific training modules', agentRole: 'Training Scheduler', expectedOutput: 'Training plan' },
      /* 3 */ { description: 'Set up accounts and access permissions', agentRole: 'Onboarding Coordinator', expectedOutput: 'Access provisioning checklist' },
      /* 4 */ { description: 'Send day-1 welcome email sequence', agentRole: 'Document Generator', expectedOutput: 'Welcome emails', dependsOn: [0, 3] },
      /* 5 */ { description: 'Track onboarding completion and follow up', agentRole: 'Onboarding Coordinator', expectedOutput: 'Completion report', dependsOn: [1, 2, 4] },
    ],
    workflows: [
      { name: 'New Hire Onboarding', description: 'End-to-end onboarding checklist for a new team member' },
      { name: 'Training Assignment Flow', description: 'Assign and track role-specific training modules' },
    ],
    usageCount: 540,
    featured: false,
    tags: ['HR', 'onboarding', 'training', 'automation'],
  },
  {
    id: 'tpl-product-launch',
    name: 'Product Launch Team',
    description: 'Coordinate a product launch across marketing, engineering, and sales — from positioning and messaging to launch-day execution and post-launch analysis.',
    category: 'Content',
    categoryColor: '#fbbf24',
    agents: [
      { role: 'Launch Manager', goal: 'Coordinate cross-functional launch timeline', color: '#fb7185' },
      { role: 'Messaging Strategist', goal: 'Craft positioning and key messaging', color: '#fbbf24' },
      { role: 'Channel Coordinator', goal: 'Prepare assets for each distribution channel', color: '#38bdf8' },
      { role: 'Analytics Lead', goal: 'Track launch KPIs and report results', color: '#34d399' },
    ],
    tasks: [
      /* 0 */ { description: 'Define product positioning and key messages', agentRole: 'Messaging Strategist', expectedOutput: 'Messaging framework' },
      /* 1 */ { description: 'Build launch timeline with milestones', agentRole: 'Launch Manager', expectedOutput: 'Launch timeline' },
      /* 2 */ { description: 'Prepare assets for each channel', agentRole: 'Channel Coordinator', expectedOutput: 'Channel asset kit', dependsOn: [0] },
      /* 3 */ { description: 'Draft press release and media kit', agentRole: 'Messaging Strategist', expectedOutput: 'Press materials', dependsOn: [0] },
      /* 4 */ { description: 'Set up tracking and KPI dashboards', agentRole: 'Analytics Lead', expectedOutput: 'KPI dashboard', dependsOn: [1] },
      /* 5 */ { description: 'Go/no-go launch readiness discussion', agentRole: 'Launch Manager', expectedOutput: 'Launch readiness consensus with risk assessment', dependsOn: [1, 2, 3, 4], discussion: { participantRoles: ['Launch Manager', 'Messaging Strategist', 'Channel Coordinator', 'Analytics Lead'], maxRounds: 2, convergenceStrategy: 'unanimous', topic: 'Are all channels, assets, and tracking ready for launch?' } },
      /* 6 */ { description: 'Coordinate launch-day execution', agentRole: 'Launch Manager', expectedOutput: 'Launch-day checklist', dependsOn: [5] },
      /* 7 */ { description: 'Monitor launch metrics in real-time', agentRole: 'Analytics Lead', expectedOutput: 'Launch metrics report', dependsOn: [5, 4] },
      /* 8 */ { description: 'Compile post-launch analysis', agentRole: 'Launch Manager', expectedOutput: 'Post-launch report', dependsOn: [6, 7] },
    ],
    workflows: [
      { name: 'Full Product Launch', description: 'End-to-end product launch from positioning to post-launch analysis' },
      { name: 'Launch Prep Sprint', description: 'Prepare all assets and messaging before launch day' },
      { name: 'Post-Launch Review', description: 'Analyze launch performance and compile lessons learned' },
    ],
    usageCount: 430,
    featured: true,
    tags: ['GTM', 'launch', 'marketing', 'cross-functional'],
  },
  {
    id: 'tpl-incident-response',
    name: 'Incident Response Crew',
    description: 'Detect, triage, and remediate production incidents — with automated root-cause analysis, stakeholder communication, and post-mortem generation.',
    category: 'Engineering',
    categoryColor: '#a78bfa',
    agents: [
      { role: 'Incident Commander', goal: 'Coordinate response and communication', color: '#fb7185' },
      { role: 'Root Cause Analyst', goal: 'Investigate logs and identify root cause', color: '#a78bfa' },
      { role: 'Comms Lead', goal: 'Draft status updates and stakeholder notifications', color: '#fbbf24' },
    ],
    tasks: [
      /* 0 */ { description: 'Triage incident severity and impact', agentRole: 'Incident Commander', expectedOutput: 'Severity assessment' },
      /* 1 */ { description: 'Investigate logs and traces for root cause', agentRole: 'Root Cause Analyst', expectedOutput: 'Root cause findings', dependsOn: [0] },
      /* 2 */ { description: 'Draft stakeholder status updates', agentRole: 'Comms Lead', expectedOutput: 'Status update communications', dependsOn: [0] },
      /* 3 */ { description: 'Incident war-room discussion — align on root cause and remediation plan', agentRole: 'Incident Commander', expectedOutput: 'Agreed root cause and remediation approach', dependsOn: [0, 1, 2], discussion: { participantRoles: ['Incident Commander', 'Root Cause Analyst', 'Comms Lead'], maxRounds: 3, convergenceStrategy: 'llm-judge', topic: 'What is the root cause and what is the fastest remediation path?' } },
      /* 4 */ { description: 'Coordinate remediation actions', agentRole: 'Incident Commander', expectedOutput: 'Remediation plan', dependsOn: [3] },
      /* 5 */ { description: 'Generate post-mortem document', agentRole: 'Root Cause Analyst', expectedOutput: 'Post-mortem report', dependsOn: [4] },
    ],
    workflows: [
      { name: 'Incident Response Flow', description: 'Detect, triage, remediate, and document production incidents' },
      { name: 'Post-Mortem Generator', description: 'Analyze an incident and auto-generate a post-mortem document' },
    ],
    usageCount: 670,
    featured: false,
    tags: ['SRE', 'incident management', 'post-mortem', 'ops'],
  },
  {
    id: 'tpl-sales-outreach',
    name: 'Sales Outreach Squad',
    description: 'Research prospects, personalize outreach sequences, and follow up — driving pipeline with data-driven, multi-touch engagement campaigns.',
    category: 'Automation',
    categoryColor: '#cbd5e1',
    agents: [
      { role: 'Prospect Researcher', goal: 'Gather intelligence on target accounts', color: '#38bdf8' },
      { role: 'Outreach Writer', goal: 'Craft personalized email sequences', color: '#34d399' },
      { role: 'Follow-up Coordinator', goal: 'Schedule and execute follow-up touchpoints', color: '#fbbf24' },
    ],
    tasks: [
      /* 0 */ { description: 'Research target accounts and contacts', agentRole: 'Prospect Researcher', expectedOutput: 'Prospect profiles' },
      /* 1 */ { description: 'Craft personalized email sequences', agentRole: 'Outreach Writer', expectedOutput: 'Email sequence drafts', dependsOn: [0] },
      /* 2 */ { description: 'Messaging strategy session — align on tone, value props, and personalization level', agentRole: 'Prospect Researcher', expectedOutput: 'Agreed messaging guidelines and personalization strategy', dependsOn: [0, 1], discussion: { participantRoles: ['Prospect Researcher', 'Outreach Writer', 'Follow-up Coordinator'], maxRounds: 2, convergenceStrategy: 'majority', topic: 'What messaging angle and personalization depth will maximize response rates?' } },
      /* 3 */ { description: 'Schedule multi-touch follow-up cadence', agentRole: 'Follow-up Coordinator', expectedOutput: 'Follow-up schedule', dependsOn: [2] },
      /* 4 */ { description: 'Personalize messaging for each account', agentRole: 'Outreach Writer', expectedOutput: 'Personalized messages', dependsOn: [2] },
      /* 5 */ { description: 'Track engagement and adjust cadence', agentRole: 'Follow-up Coordinator', expectedOutput: 'Engagement report', dependsOn: [3, 4] },
    ],
    workflows: [
      { name: 'Outbound Campaign', description: 'Research, write, and execute a multi-touch sales outreach campaign' },
      { name: 'ABM Target Sprint', description: 'Deep-research a set of target accounts and craft personalized outreach' },
    ],
    usageCount: 890,
    featured: false,
    tags: ['sales', 'email', 'outreach', 'prospecting'],
  },
];

const CATEGORIES = ['All', 'Research', 'Content', 'Engineering', 'Support', 'Data', 'Automation'];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function TemplatesPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = useMemo(() => {
    let result = TEMPLATES;
    if (activeCategory !== 'All') {
      result = result.filter((t) => t.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.includes(q)),
      );
    }
    return result;
  }, [search, activeCategory]);

  const { createCrew } = useCrewStore();

  const handleUseTemplate = useCallback(
    (template: Template) => {
      // Build AgentNode[] from template agents
      const agents = template.agents.map((a, i) => ({
        id: `agent-${Date.now()}-${i}`,
        role: a.role,
        goal: a.goal,
        backstory: '',
        tools: [] as string[],
        status: 'idle' as const,
        color: a.color,
        position: { x: 100 + i * 220, y: 120 },
      }));

      // Build TaskNode[] from template tasks, linking to agent by role
      // Use explicit dependsOn indices for parallel + convergence graphs
      const taskIds = template.tasks.map((_, i) => `task-${Date.now()}-${i}`);
      const tasks = template.tasks.map((t, i) => {
        const matchedAgent = agents.find((a) => a.role === t.agentRole);
        const deps = (t.dependsOn ?? []).map((idx) => taskIds[idx]!).filter(Boolean);
        const base = {
          id: taskIds[i]!,
          description: t.description,
          agentId: matchedAgent?.id ?? agents[0]?.id ?? '',
          dependencies: deps,
          expectedOutput: t.expectedOutput,
          status: 'pending' as const,
        };
        if (t.discussion) {
          const participantIds = t.discussion.participantRoles
            .map((role) => agents.find((a) => a.role === role)?.id)
            .filter((id): id is string => id != null);
          return {
            ...base,
            discussion: {
              participantIds,
              maxRounds: t.discussion.maxRounds,
              convergenceStrategy: t.discussion.convergenceStrategy,
              ...(t.discussion.topic ? { topic: t.discussion.topic } : {}),
            },
          };
        }
        return base;
      });

      // Create crew from template (including sample workflows)
      const crew = createCrew({
        name: template.name,
        description: template.description,
        agents,
        tasks,
        workflows: template.workflows,
        color: template.categoryColor,
      });

      navigate(crewPath(crew.id));
    },
    [navigate, createCrew],
  );

  return (
    <div className="min-h-screen bg-[var(--cs-surface-app)] flex flex-col scrollbar-thin" data-testid="templates-page">
      {/* ── Sticky Glass Nav ─────────────────────────────────── */}
      <header className="glass sticky top-0 z-50 border-b border-[var(--cs-border-subtle)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="text-lg font-semibold text-[var(--cs-text-primary)] tracking-tight">
                <span className="gradient-text">Crew</span>Space
              </span>
            </button>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => navigate('/crews')} className="text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring">My Crews</button>
            <button className="text-sm text-violet-400 font-medium">Templates</button>
            <button onClick={() => navigate('/marketplace')} className="text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors focus-ring">Marketplace</button>
          </nav>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all shadow-lg shadow-violet-500/25 focus-ring"
          >
            New Crew
          </button>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="pt-16 pb-10 text-center px-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--cs-text-primary)] tracking-tight mb-3">
          Crew <span className="gradient-text">Templates</span>
        </h1>
        <p className="text-base text-[var(--cs-text-secondary)] max-w-xl mx-auto leading-relaxed">
          Pre-built team configurations with specialized agents and workflows. Pick a template and customize it for your needs.
        </p>
      </section>

      {/* ── Search + Filters ─────────────────────────────────── */}
      <div className="max-w-5xl mx-auto w-full px-6 mb-8">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--cs-text-tertiary)] pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--cs-surface-card)] border border-[var(--cs-border-default)] text-sm text-[var(--cs-text-primary)] placeholder:text-[var(--cs-text-tertiary)] outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-colors"
            />
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeCategory === cat
                    ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
                    : 'text-[var(--cs-text-tertiary)] hover:text-[var(--cs-text-secondary)] border border-transparent hover:border-[var(--cs-border-subtle)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Featured Section ─────────────────────────────────── */}
      {activeCategory === 'All' && !search.trim() && (
        <section className="max-w-5xl mx-auto w-full px-6 mb-10">
          <p className="text-xs uppercase tracking-wider text-[var(--cs-text-tertiary)] mb-4 font-medium">Featured</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TEMPLATES.filter((t) => t.featured).map((template) => (
              <FeaturedCard key={template.id} template={template} onUse={handleUseTemplate} />
            ))}
          </div>
        </section>
      )}

      {/* ── All Templates Grid ───────────────────────────────── */}
      <section className="max-w-5xl mx-auto w-full px-6 pb-20">
        {activeCategory === 'All' && !search.trim() && (
          <p className="text-xs uppercase tracking-wider text-[var(--cs-text-tertiary)] mb-4 font-medium">All templates</p>
        )}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[var(--cs-text-tertiary)] text-sm">No templates found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((template) => (
              <TemplateCard key={template.id} template={template} onUse={handleUseTemplate} />
            ))}
          </div>
        )}
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="mt-auto px-6 py-8 border-t border-[var(--cs-border-subtle)] flex items-center justify-center">
        <p className="text-xs text-[var(--cs-text-tertiary)]">
          © {new Date().getFullYear()} CrewSpace — AI Agent Orchestration Platform
        </p>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Featured card (larger, with agent list)                             */
/* ------------------------------------------------------------------ */

function FeaturedCard({
  template,
  onUse,
}: {
  template: Template;
  onUse: (t: Template) => void;
}): React.JSX.Element {
  return (
    <div className="group relative rounded-2xl border border-[var(--cs-border-default)] bg-white/[0.02] hover:bg-white/[0.05] hover:border-[var(--cs-border-hover)] transition-all duration-200 overflow-hidden">
      {/* Color accent */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: template.categoryColor }} />

      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <span
              className="inline-block text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full mb-2"
              style={{ color: template.categoryColor, backgroundColor: `${template.categoryColor}20` }}
            >
              {template.category}
            </span>
            <h3 className="text-base font-semibold text-[var(--cs-text-primary)] group-hover:text-violet-300 transition-colors">
              {template.name}
            </h3>
          </div>
          <span className="shrink-0 text-[10px] text-[var(--cs-text-tertiary)] tabular-nums mt-1">{template.usageCount.toLocaleString()} uses</span>
        </div>

        <p className="text-sm text-[var(--cs-text-secondary)] leading-relaxed mb-4">
          {template.description}
        </p>

        {/* Agent circles */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex -space-x-1.5">
            {template.agents.map((agent, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full border-2 border-[var(--cs-surface-app)] flex items-center justify-center text-white"
                style={{ backgroundColor: agent.color }}
                title={agent.role}
              >
                <AgentAvatar id={agent.id} size={14} fallback={agent.role} />
              </div>
            ))}
          </div>
          <span className="text-[11px] text-[var(--cs-text-tertiary)]">
            {template.agents.length} agents · {template.tasks.length} tasks · {template.workflows.length} workflows
          </span>
        </div>

        {/* Agent roles */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {template.agents.map((agent, i) => (
            <span
              key={i}
              className="text-[10px] px-2 py-0.5 rounded-full border"
              style={{
                color: agent.color,
                borderColor: `${agent.color}40`,
                backgroundColor: `${agent.color}10`,
              }}
            >
              {agent.role}
            </span>
          ))}
        </div>

        <button
          onClick={() => onUse(template)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all shadow-lg shadow-violet-500/20 focus-ring"
        >
          Use this Crew
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Standard template card                                              */
/* ------------------------------------------------------------------ */

function TemplateCard({
  template,
  onUse,
}: {
  template: Template;
  onUse: (t: Template) => void;
}): React.JSX.Element {
  return (
    <div className="group flex flex-col rounded-xl border border-[var(--cs-border-subtle)] bg-white/[0.02] hover:bg-white/[0.05] hover:border-[var(--cs-border-default)] transition-all duration-200 overflow-hidden">
      {/* Color accent */}
      <div className="h-0.5" style={{ backgroundColor: template.categoryColor }} />

      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full"
            style={{ color: template.categoryColor, backgroundColor: `${template.categoryColor}20` }}
          >
            {template.category}
          </span>
          <span className="text-[10px] text-[var(--cs-text-tertiary)] tabular-nums">{template.usageCount.toLocaleString()} uses</span>
        </div>

        <h3 className="text-sm font-semibold text-[var(--cs-text-primary)] group-hover:text-violet-300 transition-colors mb-1.5">
          {template.name}
        </h3>
        <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed mb-4 line-clamp-2 flex-1">
          {template.description}
        </p>

        {/* Agents preview */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex -space-x-1">
            {template.agents.slice(0, 4).map((agent, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full border-2 border-[var(--cs-surface-app)] flex items-center justify-center text-white"
                style={{ backgroundColor: agent.color }}
                title={agent.role}
              >
                <AgentAvatar id={agent.id} size={12} fallback={agent.role} />
              </div>
            ))}
          </div>
          <span className="text-[11px] text-[var(--cs-text-tertiary)]">
            {template.agents.length} agents · {template.tasks.length} tasks · {template.workflows.length} workflows
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {template.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/[0.04] text-[var(--cs-text-tertiary)] border border-[var(--cs-border-subtle)]">
              {tag}
            </span>
          ))}
        </div>

        <button
          onClick={() => onUse(template)}
          className="mt-auto w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 text-xs font-medium transition-colors focus-ring"
        >
          Use this Crew
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  );
}
