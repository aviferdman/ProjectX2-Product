/**
 * CanvasToolbar — Draggable node palette for the workflow canvas.
 * TASK-137: Implement toolbar and sidebar (add nodes, properties panel)
 *
 * Provides a vertical palette of node types (agent, task, tool, llm) that
 * users can drag onto the canvas. Uses the HTML5 drag-and-drop API with
 * the `application/crewspace-node-type` MIME type consumed by WorkflowCanvas.
 */
import { type DragEvent, useCallback } from 'react';
import { clsx } from 'clsx';
import type { CanvasNodeType } from './types.js';
import { Z_INDEX } from './types.js';
import { defaultIcons } from './NodeShell.js';

/* ------------------------------------------------------------------ */
/* Node palette definitions                                            */
/* ------------------------------------------------------------------ */
export interface ToolbarNodeEntry {
  type: CanvasNodeType;
  label: string;
  description: string;
}

export const DEFAULT_NODE_ENTRIES: readonly ToolbarNodeEntry[] = [
  { type: 'agent', label: 'Agent', description: 'AI agent with role & goal' },
  { type: 'task', label: 'Task', description: 'Unit of work to execute' },
  { type: 'tool', label: 'Tool', description: 'External capability' },
  { type: 'llm', label: 'LLM', description: 'Language model provider' },
] as const;

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */
export interface CanvasToolbarProps {
  /** Node entries to display. Defaults to all four types. */
  entries?: readonly ToolbarNodeEntry[];
  /** Callback when a node entry is clicked (alternative to drag). */
  onAddNode?: (nodeType: CanvasNodeType) => void;
  /** Position of the toolbar relative to the canvas. */
  position?: 'left' | 'top';
  /** Additional class names on the toolbar root. */
  className?: string;
  /** Whether the toolbar is disabled (read-only mode). */
  disabled?: boolean;
}

/* ------------------------------------------------------------------ */
/* Draggable item                                                      */
/* ------------------------------------------------------------------ */
interface ToolbarItemProps {
  entry: ToolbarNodeEntry;
  onAddNode?: (nodeType: CanvasNodeType) => void;
  disabled?: boolean;
  horizontal?: boolean;
}

function ToolbarItem({ entry, onAddNode, disabled, horizontal }: ToolbarItemProps) {
  const handleDragStart = useCallback(
    (event: DragEvent) => {
      event.dataTransfer.setData('application/crewspace-node-type', entry.type);
      event.dataTransfer.effectAllowed = 'move';
    },
    [entry.type],
  );

  const handleClick = useCallback(() => {
    if (!disabled && onAddNode) {
      onAddNode(entry.type);
    }
  }, [disabled, onAddNode, entry.type]);

  return (
    <button
      type="button"
      data-testid={`toolbar-item-${entry.type}`}
      draggable={!disabled}
      onDragStart={handleDragStart}
      onClick={handleClick}
      disabled={disabled}
      className={clsx(
        'group flex items-center gap-2 rounded-md px-3 py-2',
        'border border-transparent',
        'text-text-secondary text-sm',
        'transition-all duration-150 cursor-grab active:cursor-grabbing',
        !disabled && [
          'hover:bg-surface-elevated hover:text-text-primary hover:border-border-default',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1 focus-visible:ring-offset-surface-card',
        ],
        disabled && 'opacity-40 cursor-not-allowed',
        horizontal ? 'flex-col text-center min-w-[72px]' : 'w-full',
      )}
      aria-label={`Add ${entry.label} node`}
      title={entry.description}
    >
      <span
        className={clsx(
          'flex-shrink-0',
          `text-node-${entry.type}-icon`,
          'group-hover:scale-110 transition-transform duration-150',
        )}
      >
        {defaultIcons[entry.type]}
      </span>
      <span className="truncate font-medium">{entry.label}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export function CanvasToolbar({
  entries = DEFAULT_NODE_ENTRIES,
  onAddNode,
  position = 'left',
  className,
  disabled = false,
}: CanvasToolbarProps) {
  const isHorizontal = position === 'top';

  return (
    <div
      data-testid="canvas-toolbar"
      role="toolbar"
      aria-label="Node palette"
      aria-orientation={isHorizontal ? 'horizontal' : 'vertical'}
      className={clsx(
        'cs-canvas-toolbar',
        'bg-surface-card border border-border-default rounded-lg shadow-lg',
        'p-1.5',
        isHorizontal ? 'flex flex-row gap-1' : 'flex flex-col gap-0.5 w-[180px]',
        className,
      )}
      style={{ zIndex: Z_INDEX.toolbar }}
    >
      <div
        className={clsx(
          'px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-text-tertiary',
          isHorizontal ? 'flex items-center' : '',
        )}
      >
        Nodes
      </div>
      {entries.map((entry) => (
        <ToolbarItem
          key={entry.type}
          entry={entry}
          onAddNode={onAddNode}
          disabled={disabled}
          horizontal={isHorizontal}
        />
      ))}
    </div>
  );
}

CanvasToolbar.displayName = 'CanvasToolbar';
