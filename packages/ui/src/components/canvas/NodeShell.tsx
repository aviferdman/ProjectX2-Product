/**
 * NodeShell — Shared visual wrapper for all canvas node types.
 * TASK-136: Implement node rendering (agents, tasks, custom styles)
 *
 * Provides consistent border, shadow, selection ring, status animation,
 * and connection handles across all four node types.
 */
import type { ReactNode } from 'react';
import { Handle, Position } from '@xyflow/react';
import { clsx } from 'clsx';
import type { CanvasNodeType, NodeStatus, NodeStyleOverrides } from './types.js';

/* ------------------------------------------------------------------ */
/* Per-type style maps                                                 */
/* ------------------------------------------------------------------ */
const typeStyles: Record<
  CanvasNodeType,
  { bg: string; border: string; iconColor: string; label: string }
> = {
  agent: {
    bg: 'bg-node-agent-bg',
    border: 'border-node-agent-border',
    iconColor: 'text-node-agent-icon',
    label: 'Agent',
  },
  task: {
    bg: 'bg-node-task-bg',
    border: 'border-node-task-border',
    iconColor: 'text-node-task-icon',
    label: 'Task',
  },
  tool: {
    bg: 'bg-node-tool-bg',
    border: 'border-node-tool-border',
    iconColor: 'text-node-tool-icon',
    label: 'Tool',
  },
  llm: {
    bg: 'bg-node-llm-bg',
    border: 'border-node-llm-border',
    iconColor: 'text-node-llm-icon',
    label: 'LLM',
  },
};

const statusClasses: Record<string, string> = {
  running: 'animate-running-flicker',
  error: 'animate-error-pulse',
  disabled: 'opacity-40 pointer-events-none',
};

/* ------------------------------------------------------------------ */
/* Default SVG icons per node type                                     */
/* ------------------------------------------------------------------ */
export const defaultIcons: Record<CanvasNodeType, ReactNode> = {
  agent: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" aria-hidden="true">
      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
    </svg>
  ),
  task: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 011 1v3.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L6 11.586V8a1 1 0 011-1z"
        clipRule="evenodd"
      />
    </svg>
  ),
  tool: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
        clipRule="evenodd"
      />
    </svg>
  ),
  llm: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" aria-hidden="true">
      <path d="M13 7H7v6h6V7z" />
      <path
        fillRule="evenodd"
        d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

/* ------------------------------------------------------------------ */
/* Status badge component                                              */
/* ------------------------------------------------------------------ */
function StatusBadge({ status }: { status: NodeStatus }) {
  if (status === 'idle') return null;
  return (
    <span
      data-testid="node-status-badge"
      className={clsx(
        'ml-auto text-node-badge uppercase tracking-wider px-1.5 py-0.5 rounded-sm',
        status === 'running' && 'bg-status-success/20 text-status-success',
        status === 'success' && 'bg-status-success/20 text-status-success',
        status === 'error' && 'bg-status-error/20 text-status-error',
        status === 'disabled' && 'bg-surface-elevated text-text-tertiary',
      )}
    >
      {status}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */
export interface NodeShellProps {
  nodeType: CanvasNodeType;
  label: string;
  status?: NodeStatus | undefined;
  selected?: boolean | undefined;
  icon?: ReactNode;
  description?: string | undefined;
  styleOverrides?: NodeStyleOverrides | undefined;
  /** Type-specific body content rendered below the header. */
  children?: ReactNode;
  /** Optional footer content (e.g., tag badges, counts). */
  footer?: ReactNode;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export function NodeShell({
  nodeType,
  label,
  status = 'idle',
  selected = false,
  icon,
  description,
  styleOverrides,
  children,
  footer,
}: NodeShellProps) {
  const style = typeStyles[nodeType];
  const resolvedIcon = icon ?? defaultIcons[nodeType];

  return (
    <div
      data-testid={`workflow-node-${nodeType}`}
      className={clsx(
        'relative w-[220px] min-w-[180px] max-w-[280px]',
        'rounded-node border-[1.5px] shadow-node',
        'transition-shadow duration-200 ease-out',
        'animate-node-enter',
        style.bg,
        style.border,
        selected && 'shadow-node-selected ring-2 ring-node-selected-ring',
        !selected && 'hover:shadow-node-hover hover:border-opacity-80',
        statusClasses[status],
        styleOverrides?.headerClassName,
      )}
      style={{
        backgroundColor: styleOverrides?.backgroundColor,
        borderColor: styleOverrides?.borderColor,
      }}
      role="group"
      aria-label={`${style.label} node: ${label}`}
    >
      {/* Target handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className={clsx(
          '!w-[10px] !h-[10px] !rounded-full !border-2',
          '!bg-surface-card !border-border-strong',
          'hover:!bg-brand-primary hover:!border-brand-secondary',
          'transition-colors duration-150',
        )}
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/5">
        <span
          className={clsx('flex-shrink-0', style.iconColor)}
          style={{ color: styleOverrides?.iconColor }}
        >
          {resolvedIcon}
        </span>
        <span className="text-node-title text-text-primary truncate font-semibold">{label}</span>
        <StatusBadge status={status} />
      </div>

      {/* Description */}
      {description && (
        <div
          data-testid="node-description"
          className={clsx(
            'px-3 py-2 text-node-body text-text-secondary leading-relaxed',
            styleOverrides?.bodyClassName,
          )}
        >
          {description}
        </div>
      )}

      {/* Type-specific body */}
      {children && (
        <div data-testid="node-body" className="px-3 py-2 border-t border-white/5">
          {children}
        </div>
      )}

      {/* Footer */}
      {footer && (
        <div
          data-testid="node-footer"
          className="flex items-center gap-1.5 px-3 py-1.5 border-t border-white/5 text-node-badge text-text-tertiary"
        >
          {footer}
        </div>
      )}

      {/* Source handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className={clsx(
          '!w-[10px] !h-[10px] !rounded-full !border-2',
          '!bg-surface-card !border-border-strong',
          'hover:!bg-brand-primary hover:!border-brand-secondary',
          'transition-colors duration-150',
        )}
      />
    </div>
  );
}

NodeShell.displayName = 'NodeShell';
