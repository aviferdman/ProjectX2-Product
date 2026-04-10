/**
 * TemplatesPage — template browser with instantiation support.
 * TASK-131: Protected page scaffold.
 * TASK-161: Wired to TemplateBrowserWithInstantiation container.
 */
import React, { useState, useCallback } from 'react';
import {
  TemplateBrowserWithInstantiation,
  type InstantiationResult,
} from '@crewspace/ui';
import type { TemplateSummary } from '@crewspace/ui';

// Placeholder templates for development — will be replaced by API data
const DEMO_TEMPLATES: TemplateSummary[] = [
  {
    id: 'tpl-research',
    name: 'Research Pipeline',
    description: 'Automated research workflow with web scraping and summarization using GPT-4.',
    category: 'research',
    tags: ['research', 'scraping', 'GPT-4'],
    author: 'Crewspace',
    usageCount: 1250,
    agentCount: 2,
    taskCount: 4,
    featured: true,
    popular: true,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-03-20T14:00:00Z',
  },
  {
    id: 'tpl-codereview',
    name: 'Code Review Bot',
    description: 'Automated code review pipeline that analyzes PRs for quality, security, and style.',
    category: 'code',
    tags: ['code-review', 'automation', 'CI/CD'],
    author: 'DevTeam',
    usageCount: 890,
    agentCount: 3,
    taskCount: 5,
    featured: false,
    popular: true,
    createdAt: '2026-02-01T08:00:00Z',
    updatedAt: '2026-03-25T16:00:00Z',
  },
  {
    id: 'tpl-support',
    name: 'Customer Support Agent',
    description: 'Multi-tier support workflow with ticket classification, response generation, and escalation.',
    category: 'support',
    tags: ['support', 'tickets', 'escalation'],
    author: 'Crewspace',
    usageCount: 650,
    agentCount: 2,
    taskCount: 3,
    featured: true,
    popular: false,
    createdAt: '2026-01-20T12:00:00Z',
    updatedAt: '2026-03-18T10:00:00Z',
  },
];

/** Simulates instantiation — will be replaced with real API call. */
async function simulateInstantiation(
  templateId: string,
  options: { workflowName: string; workflowDescription?: string },
): Promise<InstantiationResult> {
  await new Promise((r) => setTimeout(r, 800));
  return {
    workflowId: `wf-${Date.now()}`,
    templateId,
    workflowName: options.workflowName,
    instantiatedAt: new Date().toISOString(),
  };
}

export function TemplatesPage(): React.JSX.Element {
  const handleGoToWorkflow = useCallback((workflowId: string) => {
    // Will integrate with router navigation
    console.log(`Navigate to workflow: ${workflowId}`);
  }, []);

  return React.createElement(
    'main',
    { 'data-testid': 'templates-page' },
    React.createElement(TemplateBrowserWithInstantiation, {
      templates: DEMO_TEMPLATES,
      onInstantiate: simulateInstantiation,
      onGoToWorkflow: handleGoToWorkflow,
    }),
  );
}
