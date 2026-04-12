/**
 * PropertiesPanel — Sidebar panel for viewing/editing selected node properties.
 * TASK-137: Implement toolbar and sidebar (add nodes, properties panel)
 *
 * Shows a detail panel when a node is selected on the canvas. Displays
 * common fields (label, description, status) and type-specific metadata.
 * Fires callbacks when properties change so the parent can update the node.
 */
import { useCallback, type ChangeEvent, type ReactNode } from 'react';
import { clsx } from 'clsx';
import {
  Z_INDEX,
  type CanvasNodeType,
  type NodeStatus,
  type WorkflowNodeData,
  type AgentNodeMeta,
  type TaskNodeMeta,
  type ToolNodeMeta,
  type LLMNodeMeta,
} from './types.js';
import { defaultIcons } from './NodeShell.js';

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */
export interface PropertiesPanelProps {
  /** The selected node's ID, or null when nothing is selected. */
  selectedNodeId: string | null;
  /** The selected node's data payload. */
  nodeData: WorkflowNodeData | null;
  /** Callback when a property value changes. */
  onPropertyChange?: (
    nodeId: string,
    field: string,
    value: string | number | boolean | string[],
  ) => void;
  /** Callback when the delete button is pressed. */
  onDeleteNode?: (nodeId: string) => void;
  /** Whether the panel is read-only (no editing). */
  readOnly?: boolean;
  /** Additional class names. */
  className?: string;
  /** Width of the panel. */
  width?: number;
}

/* ------------------------------------------------------------------ */
/* Status options                                                       */
/* ------------------------------------------------------------------ */
const STATUS_OPTIONS: NodeStatus[] = ['idle', 'running', 'success', 'error', 'disabled'];

/* ------------------------------------------------------------------ */
/* Field helpers                                                       */
/* ------------------------------------------------------------------ */
interface FieldRowProps {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}

function FieldRow({ label, htmlFor, children }: FieldRowProps) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium uppercase tracking-wider text-text-tertiary"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section helpers                                                     */
/* ------------------------------------------------------------------ */
interface SectionProps {
  title: string;
  children: ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div
      className="space-y-3"
      data-testid={`properties-section-${title.toLowerCase().replace(/\s/g, '-')}`}
    >
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary border-b border-border-default pb-1">
        {title}
      </h3>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Type-specific metadata panels                                       */
/* ------------------------------------------------------------------ */
function AgentMetaFields({
  meta,
  nodeId,
  readOnly,
  onChange,
}: {
  meta: AgentNodeMeta;
  nodeId: string;
  readOnly: boolean;
  onChange: (field: string, value: string | number | string[]) => void;
}) {
  return (
    <Section title="Agent Config">
      <FieldRow label="Model" htmlFor="agent-model">
        <input
          id="agent-model"
          data-testid="property-agent-model"
          type="text"
          value={meta.model ?? ''}
          readOnly={readOnly}
          onChange={(e) => onChange('agentMeta.model', e.target.value)}
          className="cs-prop-input"
          placeholder="e.g. gpt-4o"
        />
      </FieldRow>
      {meta.tools && (
        <FieldRow label="Tools">
          <div className="flex flex-wrap gap-1" data-testid="property-agent-tools">
            {meta.tools.map((tool) => (
              <span
                key={tool}
                className="inline-block px-1.5 py-0.5 rounded bg-surface-elevated/50 text-text-secondary text-[10px]"
              >
                {tool}
              </span>
            ))}
          </div>
        </FieldRow>
      )}
      <FieldRow label="Max Iterations" htmlFor="agent-max-iter">
        <input
          id="agent-max-iter"
          data-testid="property-agent-max-iterations"
          type="number"
          min={1}
          value={meta.maxIterations ?? ''}
          readOnly={readOnly}
          onChange={(e) => onChange('agentMeta.maxIterations', parseInt(e.target.value, 10))}
          className="cs-prop-input"
        />
      </FieldRow>
    </Section>
  );
}

function TaskMetaFields({
  meta,
  nodeId,
  readOnly,
  onChange,
}: {
  meta: TaskNodeMeta;
  nodeId: string;
  readOnly: boolean;
  onChange: (field: string, value: string | number | string[]) => void;
}) {
  return (
    <Section title="Task Config">
      {meta.expectedOutput && (
        <FieldRow label="Expected Output">
          <p className="text-sm text-text-secondary" data-testid="property-task-expected-output">
            {meta.expectedOutput}
          </p>
        </FieldRow>
      )}
      {meta.progress != null && (
        <FieldRow label="Progress">
          <div className="flex items-center gap-2" data-testid="property-task-progress">
            <div className="flex-1 h-2 rounded bg-surface-elevated overflow-hidden">
              <div
                className="h-full rounded bg-brand-primary transition-all"
                style={{ width: `${Math.min(100, Math.max(0, meta.progress))}%` }}
              />
            </div>
            <span className="text-xs text-text-secondary w-8 text-right">{meta.progress}%</span>
          </div>
        </FieldRow>
      )}
      {meta.inputs && meta.inputs.length > 0 && (
        <FieldRow label="Inputs">
          <div className="flex flex-wrap gap-1" data-testid="property-task-inputs">
            {meta.inputs.map((input) => (
              <span
                key={input}
                className="inline-block px-1.5 py-0.5 rounded bg-surface-elevated/50 text-text-secondary text-[10px]"
              >
                {input}
              </span>
            ))}
          </div>
        </FieldRow>
      )}
      {meta.outputs && meta.outputs.length > 0 && (
        <FieldRow label="Outputs">
          <div className="flex flex-wrap gap-1" data-testid="property-task-outputs">
            {meta.outputs.map((output) => (
              <span
                key={output}
                className="inline-block px-1.5 py-0.5 rounded bg-surface-elevated/50 text-text-secondary text-[10px]"
              >
                {output}
              </span>
            ))}
          </div>
        </FieldRow>
      )}
    </Section>
  );
}

function ToolMetaFields({ meta }: { meta: ToolNodeMeta }) {
  return (
    <Section title="Tool Config">
      {meta.parameters && meta.parameters.length > 0 && (
        <FieldRow label="Parameters">
          <div className="space-y-1" data-testid="property-tool-parameters">
            {meta.parameters.map((param) => (
              <div key={param.name} className="flex items-center gap-1 text-xs">
                <span className="text-text-primary font-mono">{param.name}</span>
                <span className="text-text-tertiary">:</span>
                <span className="text-text-secondary font-mono">{param.type}</span>
              </div>
            ))}
          </div>
        </FieldRow>
      )}
      {meta.executionCount != null && (
        <FieldRow label="Executions">
          <span className="text-sm text-text-secondary" data-testid="property-tool-executions">
            {meta.executionCount}
          </span>
        </FieldRow>
      )}
      {meta.avgDuration && (
        <FieldRow label="Avg Duration">
          <span className="text-sm text-text-secondary" data-testid="property-tool-duration">
            {meta.avgDuration}
          </span>
        </FieldRow>
      )}
    </Section>
  );
}

function LLMMetaFields({
  meta,
  nodeId,
  readOnly,
  onChange,
}: {
  meta: LLMNodeMeta;
  nodeId: string;
  readOnly: boolean;
  onChange: (field: string, value: string | number) => void;
}) {
  return (
    <Section title="LLM Config">
      <FieldRow label="Provider" htmlFor="llm-provider">
        <input
          id="llm-provider"
          data-testid="property-llm-provider"
          type="text"
          value={meta.provider ?? ''}
          readOnly={readOnly}
          onChange={(e) => onChange('llmMeta.provider', e.target.value)}
          className="cs-prop-input"
          placeholder="e.g. openai"
        />
      </FieldRow>
      <FieldRow label="Model" htmlFor="llm-model">
        <input
          id="llm-model"
          data-testid="property-llm-model"
          type="text"
          value={meta.model ?? ''}
          readOnly={readOnly}
          onChange={(e) => onChange('llmMeta.model', e.target.value)}
          className="cs-prop-input"
          placeholder="e.g. gpt-4o"
        />
      </FieldRow>
      <FieldRow label="Temperature" htmlFor="llm-temperature">
        <input
          id="llm-temperature"
          data-testid="property-llm-temperature"
          type="number"
          min={0}
          max={2}
          step={0.1}
          value={meta.temperature ?? ''}
          readOnly={readOnly}
          onChange={(e) => onChange('llmMeta.temperature', parseFloat(e.target.value))}
          className="cs-prop-input"
        />
      </FieldRow>
      {meta.tokenUsage && (
        <FieldRow label="Token Usage">
          <div className="flex gap-3 text-xs" data-testid="property-llm-token-usage">
            <span className="text-text-secondary">
              In: <span className="text-text-primary font-mono">{meta.tokenUsage.input}</span>
            </span>
            <span className="text-text-secondary">
              Out: <span className="text-text-primary font-mono">{meta.tokenUsage.output}</span>
            </span>
          </div>
        </FieldRow>
      )}
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */
function EmptyPanel() {
  return (
    <div
      data-testid="properties-empty"
      className="flex flex-col items-center justify-center h-full text-center px-4 py-8"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        className="w-10 h-10 text-text-tertiary mb-3"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
        />
      </svg>
      <p className="text-sm text-text-tertiary">Select a node to view its properties</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export function PropertiesPanel({
  selectedNodeId,
  nodeData,
  onPropertyChange,
  onDeleteNode,
  readOnly = false,
  className,
  width = 280,
}: PropertiesPanelProps) {
  const handleChange = useCallback(
    (field: string, value: string | number | boolean | string[]) => {
      if (selectedNodeId && onPropertyChange) {
        onPropertyChange(selectedNodeId, field, value);
      }
    },
    [selectedNodeId, onPropertyChange],
  );

  const handleLabelChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => handleChange('label', e.target.value),
    [handleChange],
  );

  const handleDescriptionChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => handleChange('description', e.target.value),
    [handleChange],
  );

  const handleStatusChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => handleChange('status', e.target.value),
    [handleChange],
  );

  const handleDelete = useCallback(() => {
    if (selectedNodeId && onDeleteNode) {
      onDeleteNode(selectedNodeId);
    }
  }, [selectedNodeId, onDeleteNode]);

  const hasSelection = selectedNodeId != null && nodeData != null;

  return (
    <div
      data-testid="properties-panel"
      role="complementary"
      aria-label="Node properties"
      className={clsx(
        'cs-properties-panel',
        'bg-surface-card border-l border-border-default',
        'flex flex-col h-full overflow-hidden',
        className,
      )}
      style={{ width, zIndex: Z_INDEX.properties }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
        <h2 className="text-sm font-semibold text-text-primary">Properties</h2>
        {hasSelection && !readOnly && onDeleteNode && (
          <button
            type="button"
            data-testid="properties-delete-btn"
            onClick={handleDelete}
            className={clsx(
              'text-xs px-2 py-1 rounded',
              'text-status-error hover:bg-status-error/10',
              'transition-colors duration-150',
            )}
            aria-label={`Delete node ${selectedNodeId}`}
          >
            Delete
          </button>
        )}
      </div>

      {/* Body */}
      {!hasSelection ? (
        <EmptyPanel />
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {/* Node type indicator */}
          <div className="flex items-center gap-2" data-testid="properties-node-type">
            <span className={`text-node-${nodeData.nodeType}-icon`}>
              {defaultIcons[nodeData.nodeType]}
            </span>
            <span className="text-sm font-medium text-text-primary capitalize">
              {nodeData.nodeType}
            </span>
            <span className="text-xs text-text-tertiary ml-auto font-mono">{selectedNodeId}</span>
          </div>

          {/* Common fields */}
          <Section title="General">
            <FieldRow label="Label" htmlFor="prop-label">
              <input
                id="prop-label"
                data-testid="property-label"
                type="text"
                value={nodeData.label}
                readOnly={readOnly}
                onChange={handleLabelChange}
                className="cs-prop-input"
              />
            </FieldRow>
            <FieldRow label="Description" htmlFor="prop-description">
              <textarea
                id="prop-description"
                data-testid="property-description"
                value={nodeData.description ?? ''}
                readOnly={readOnly}
                onChange={handleDescriptionChange}
                rows={3}
                className="cs-prop-input resize-y min-h-[60px]"
                placeholder="Describe this node..."
              />
            </FieldRow>
            <FieldRow label="Status" htmlFor="prop-status">
              <select
                id="prop-status"
                data-testid="property-status"
                value={nodeData.status ?? 'idle'}
                disabled={readOnly}
                onChange={handleStatusChange}
                className="cs-prop-input"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </FieldRow>
          </Section>

          {/* Type-specific metadata */}
          {nodeData.nodeType === 'agent' && nodeData.agentMeta && (
            <AgentMetaFields
              meta={nodeData.agentMeta}
              nodeId={selectedNodeId}
              readOnly={readOnly}
              onChange={handleChange}
            />
          )}
          {nodeData.nodeType === 'task' && nodeData.taskMeta && (
            <TaskMetaFields
              meta={nodeData.taskMeta}
              nodeId={selectedNodeId}
              readOnly={readOnly}
              onChange={handleChange}
            />
          )}
          {nodeData.nodeType === 'tool' && nodeData.toolMeta && (
            <ToolMetaFields meta={nodeData.toolMeta} />
          )}
          {nodeData.nodeType === 'llm' && nodeData.llmMeta && (
            <LLMMetaFields
              meta={nodeData.llmMeta}
              nodeId={selectedNodeId}
              readOnly={readOnly}
              onChange={handleChange}
            />
          )}
        </div>
      )}
    </div>
  );
}

PropertiesPanel.displayName = 'PropertiesPanel';
