/**
 * TemplatePreviewModal — TASK-160
 *
 * Full-featured preview modal for a template. Shows:
 * - Template metadata (name, description, category, author, usage count)
 * - Badges (featured / popular)
 * - Tags
 * - A read-only WorkflowDiagram showing agents → tasks
 * - "Use Template" CTA
 */
import React, { forwardRef, useMemo, useCallback, useEffect } from 'react';
import { clsx } from 'clsx';
import type { TemplateSummary, TemplateCategory } from './types.js';
import { TemplateCategoryBadge } from './TemplateCategoryBadge.js';
import { TemplateTag } from './TemplateTag.js';
import { FeaturedBadge } from './FeaturedBadge.js';
import {
  WorkflowDiagram,
  type WorkflowDiagramNode,
  type WorkflowDiagramEdge,
} from './WorkflowDiagram.js';

/* ------------------------------------------------------------------ */
/* Public types                                                        */
/* ------------------------------------------------------------------ */

export interface TemplatePreviewModalProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The template to preview. `null` means the modal is closed. */
  template: TemplateSummary | null;
  /** Callback when the modal requests to close. */
  onClose: () => void;
  /** Callback when the user clicks "Use Template". */
  onUseTemplate?: ((id: string) => void) | undefined;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatUsageCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

/** Generate a simple workflow diagram from the agent + task counts. */
function buildDiagram(template: TemplateSummary): {
  nodes: WorkflowDiagramNode[];
  edges: WorkflowDiagramEdge[];
} {
  const nodes: WorkflowDiagramNode[] = [];
  const edges: WorkflowDiagramEdge[] = [];

  for (let i = 0; i < template.agentCount; i++) {
    nodes.push({ id: `agent-${i}`, label: `Agent ${i + 1}`, type: 'agent' });
  }

  for (let i = 0; i < template.taskCount; i++) {
    nodes.push({ id: `task-${i}`, label: `Task ${i + 1}`, type: 'task' });
  }

  // Connect agents to tasks (round-robin assignment)
  if (template.agentCount > 0 && template.taskCount > 0) {
    for (let t = 0; t < template.taskCount; t++) {
      const agentIdx = t % template.agentCount;
      edges.push({ from: `agent-${agentIdx}`, to: `task-${t}` });
    }
  }

  return { nodes, edges };
}

/* ------------------------------------------------------------------ */
/* Overlay                                                             */
/* ------------------------------------------------------------------ */

interface OverlayProps {
  onClose: () => void;
  children: React.ReactNode;
}

function Overlay({ onClose, children }: OverlayProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-black/60 backdrop-blur-sm',
        'animate-in fade-in duration-150',
      )}
      onClick={handleClick}
      role="presentation"
      data-testid="preview-overlay"
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal component                                                     */
/* ------------------------------------------------------------------ */

export const TemplatePreviewModal = forwardRef<
  HTMLDivElement,
  TemplatePreviewModalProps
>(function TemplatePreviewModal(
  { template, onClose, onUseTemplate, className, ...props },
  ref,
) {
  const handleKeyDown = useCallback(
    (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!template) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [template, handleKeyDown]);

  const diagram = useMemo(
    () => (template ? buildDiagram(template) : { nodes: [], edges: [] }),
    [template],
  );

  if (!template) return null;

  return (
    <Overlay onClose={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={`Preview: ${template.name}`}
        className={clsx(
          'w-full max-w-2xl bg-surface-panel shadow-xl',
          'animate-in zoom-in-95 duration-200',
          'h-full rounded-none border-0',
          'md:h-auto md:max-h-[85vh] md:rounded-xl md:border md:border-slate-700',
          'flex flex-col overflow-hidden',
          className,
        )}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-5 py-3">
          <h2 className="text-lg font-semibold text-slate-100 truncate">
            {template.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-surface-elevated hover:text-white transition-colors flex items-center justify-center"
            aria-label="Close preview"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4 4l10 10M14 4L4 14" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Badges + category row */}
          <div className="flex flex-wrap items-center gap-2">
            <TemplateCategoryBadge category={template.category} />
            {template.featured && <FeaturedBadge variant="featured" />}
            {template.popular && <FeaturedBadge variant="popular" />}
          </div>

          {/* Description */}
          <p className="text-sm text-slate-300 leading-relaxed">
            {template.description}
          </p>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span>{template.agentCount} agents</span>
            <span>·</span>
            <span>{template.taskCount} tasks</span>
            <span>·</span>
            <span>{formatUsageCount(template.usageCount)} uses</span>
            <span className="ml-auto">by {template.author}</span>
          </div>

          {/* Tags */}
          {template.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {template.tags.map((tag) => (
                <TemplateTag key={tag} label={tag} />
              ))}
            </div>
          )}

          {/* Workflow diagram */}
          <div>
            <h3 className="text-sm font-medium text-slate-200 mb-2">
              Workflow
            </h3>
            <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
              <WorkflowDiagram
                nodes={diagram.nodes}
                edges={diagram.edges}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 px-5 py-3 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className={clsx(
              'inline-flex items-center justify-center rounded-lg border px-4 py-2',
              'border-slate-600 bg-transparent text-slate-300',
              'text-sm font-medium transition-colors',
              'hover:bg-slate-800 hover:text-white',
            )}
          >
            Close
          </button>
          {onUseTemplate && (
            <button
              type="button"
              onClick={() => onUseTemplate(template.id)}
              className={clsx(
                'inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2',
                'bg-violet-600 text-white shadow-sm',
                'text-sm font-medium transition-all',
                'hover:bg-violet-500 hover:shadow-md',
              )}
              aria-label={`Use template ${template.name}`}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Use Template
            </button>
          )}
        </div>
      </div>
    </Overlay>
  );
});
