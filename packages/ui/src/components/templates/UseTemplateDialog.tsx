/**
 * UseTemplateDialog — TASK-161
 *
 * Modal dialog for configuring and executing template instantiation.
 * Handles four visual states: configuring (form), instantiating (loading),
 * success (result summary), and error (retry / cancel).
 */
import React, { forwardRef, useState, useCallback, useEffect } from 'react';
import { clsx } from 'clsx';
import type { TemplateSummary } from './types.js';
import { TemplateCategoryBadge } from './TemplateCategoryBadge.js';
import type {
  InstantiateFormValues,
  InstantiationResult,
  InstantiationStatus,
} from '../../hooks/useTemplateInstantiation.js';

/* ------------------------------------------------------------------ */
/* Public types                                                        */
/* ------------------------------------------------------------------ */

export interface UseTemplateDialogProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children'
> {
  /** The template being instantiated, or `null` to hide the dialog. */
  template: TemplateSummary | null;

  /** Current status of the instantiation flow. */
  status: InstantiationStatus;

  /** Instantiation result (when status === 'success'). */
  result: InstantiationResult | null;

  /** Error message (when status === 'error'). */
  error: string | null;

  /** Called when the user confirms instantiation with form values. */
  onConfirm: (values: InstantiateFormValues) => void;

  /** Called when the user cancels or closes the dialog. */
  onCancel: () => void;

  /** Called after success to reset and close. */
  onDone: () => void;

  /** Optional callback to navigate to the newly created workflow. */
  onGoToWorkflow?: ((workflowId: string) => void) | undefined;
}

/* ------------------------------------------------------------------ */
/* Overlay (local, matches TemplatePreviewModal pattern)               */
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
      data-testid="instantiate-overlay"
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Form view                                                           */
/* ------------------------------------------------------------------ */

interface FormViewProps {
  template: TemplateSummary;
  onSubmit: (values: InstantiateFormValues) => void;
  onCancel: () => void;
}

function FormView({ template, onSubmit, onCancel }: FormViewProps) {
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description);

  // Reset form when template changes
  useEffect(() => {
    setName(template.name);
    setDescription(template.description);
  }, [template.id, template.name, template.description]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({
      workflowName: trimmed,
      ...(description.trim() ? { workflowDescription: description.trim() } : {}),
    });
  };

  const isValid = name.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="instantiate-form">
      {/* Template info summary */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <TemplateCategoryBadge category={template.category} />
        <span>·</span>
        <span>{template.agentCount} agents</span>
        <span>·</span>
        <span>{template.taskCount} tasks</span>
      </div>

      {/* Workflow name */}
      <div>
        <label htmlFor="workflow-name" className="block text-sm font-medium text-slate-300 mb-1">
          Workflow Name
        </label>
        <input
          id="workflow-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter a name for your workflow"
          maxLength={200}
          className={clsx(
            'w-full rounded-lg border px-3 py-2',
            'bg-slate-800/60 text-slate-100',
            'border-slate-600 placeholder:text-slate-500',
            'text-sm transition-colors',
            'focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500',
          )}
          autoFocus
        />
      </div>

      {/* Workflow description */}
      <div>
        <label
          htmlFor="workflow-description"
          className="block text-sm font-medium text-slate-300 mb-1"
        >
          Description <span className="text-slate-500 font-normal">(optional)</span>
        </label>
        <textarea
          id="workflow-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what this workflow does"
          rows={3}
          className={clsx(
            'w-full rounded-lg border px-3 py-2',
            'bg-slate-800/60 text-slate-100',
            'border-slate-600 placeholder:text-slate-500',
            'text-sm transition-colors resize-none',
            'focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500',
          )}
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className={clsx(
            'inline-flex items-center justify-center rounded-lg border px-4 py-2',
            'border-slate-600 bg-transparent text-slate-300',
            'text-sm font-medium transition-colors',
            'hover:bg-slate-800 hover:text-white',
          )}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isValid}
          className={clsx(
            'inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2',
            'text-sm font-medium transition-all',
            isValid
              ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 hover:shadow-md'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed',
          )}
          aria-label="Create workflow from template"
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
          Create Workflow
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Loading view                                                        */
/* ------------------------------------------------------------------ */

function LoadingView() {
  return (
    <div
      className="flex flex-col items-center justify-center py-8 gap-3"
      data-testid="instantiate-loading"
      role="status"
    >
      <svg
        className="h-8 w-8 animate-spin text-indigo-500"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray="31.4 31.4"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-sm text-slate-300">Creating your workflow…</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Success view                                                        */
/* ------------------------------------------------------------------ */

interface SuccessViewProps {
  result: InstantiationResult;
  onDone: () => void;
  onGoToWorkflow?: ((workflowId: string) => void) | undefined;
}

function SuccessView({ result, onDone, onGoToWorkflow }: SuccessViewProps) {
  return (
    <div
      className="flex flex-col items-center text-center py-6 gap-4"
      data-testid="instantiate-success"
    >
      {/* Success icon */}
      <div className="rounded-full bg-emerald-500/10 p-3">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-emerald-400"
          aria-hidden="true"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>

      <div>
        <h3 className="text-base font-semibold text-slate-100">Workflow Created</h3>
        <p className="text-sm text-slate-400 mt-1">
          <span className="text-slate-200 font-medium">{result.workflowName}</span> has been created
          from the template.
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onDone}
          className={clsx(
            'inline-flex items-center justify-center rounded-lg border px-4 py-2',
            'border-slate-600 bg-transparent text-slate-300',
            'text-sm font-medium transition-colors',
            'hover:bg-slate-800 hover:text-white',
          )}
        >
          Close
        </button>
        {onGoToWorkflow && (
          <button
            type="button"
            onClick={() => onGoToWorkflow(result.workflowId)}
            className={clsx(
              'inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2',
              'bg-indigo-600 text-white shadow-sm',
              'text-sm font-medium transition-all',
              'hover:bg-indigo-500 hover:shadow-md',
            )}
            aria-label="Go to workflow"
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
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            Go to Workflow
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Error view                                                          */
/* ------------------------------------------------------------------ */

interface ErrorViewProps {
  message: string;
  onRetry: () => void;
  onCancel: () => void;
}

function ErrorView({ message, onRetry, onCancel }: ErrorViewProps) {
  return (
    <div
      className="flex flex-col items-center text-center py-6 gap-4"
      data-testid="instantiate-error"
    >
      {/* Error icon */}
      <div className="rounded-full bg-red-500/10 p-3">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-red-400"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M15 9l-6 6M9 9l6 6" />
        </svg>
      </div>

      <div>
        <h3 className="text-base font-semibold text-slate-100">Something went wrong</h3>
        <p className="text-sm text-red-400 mt-1">{message}</p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className={clsx(
            'inline-flex items-center justify-center rounded-lg border px-4 py-2',
            'border-slate-600 bg-transparent text-slate-300',
            'text-sm font-medium transition-colors',
            'hover:bg-slate-800 hover:text-white',
          )}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onRetry}
          className={clsx(
            'inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2',
            'bg-indigo-600 text-white shadow-sm',
            'text-sm font-medium transition-all',
            'hover:bg-indigo-500 hover:shadow-md',
          )}
          aria-label="Try again"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dialog title helpers                                                 */
/* ------------------------------------------------------------------ */

function getDialogTitle(status: InstantiationStatus, templateName: string): string {
  switch (status) {
    case 'configuring':
      return `Use Template: ${templateName}`;
    case 'instantiating':
      return 'Creating Workflow…';
    case 'success':
      return 'Success';
    case 'error':
      return 'Error';
    default:
      return 'Use Template';
  }
}

/* ------------------------------------------------------------------ */
/* Main dialog component                                               */
/* ------------------------------------------------------------------ */

export const UseTemplateDialog = forwardRef<HTMLDivElement, UseTemplateDialogProps>(
  function UseTemplateDialog(
    {
      template,
      status,
      result,
      error,
      onConfirm,
      onCancel,
      onDone,
      onGoToWorkflow,
      className,
      ...props
    },
    ref,
  ) {
    const handleKeyDown = useCallback(
      (e: globalThis.KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (status === 'success') {
            onDone();
          } else if (status !== 'instantiating') {
            onCancel();
          }
        }
      },
      [status, onCancel, onDone],
    );

    useEffect(() => {
      if (!template) return;
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [template, handleKeyDown]);

    // Retry from error state goes back to configuring
    const handleRetry = useCallback(() => {
      if (template) {
        onConfirm({
          workflowName: result?.workflowName ?? template.name,
        });
      }
    }, [template, result, onConfirm]);

    if (!template || status === 'idle') return null;

    const title = getDialogTitle(status, template.name);

    return (
      <Overlay onClose={status === 'instantiating' ? () => {} : onCancel}>
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={clsx(
            'w-full max-w-md bg-surface-panel shadow-xl',
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
            <h2 className="text-lg font-semibold text-slate-100 truncate">{title}</h2>
            {status !== 'instantiating' && (
              <button
                type="button"
                onClick={status === 'success' ? onDone : onCancel}
                className="rounded-md p-1 text-slate-400 hover:bg-surface-elevated hover:text-white transition-colors flex items-center justify-center"
                aria-label="Close dialog"
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
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5">
            {status === 'configuring' && (
              <FormView template={template} onSubmit={onConfirm} onCancel={onCancel} />
            )}
            {status === 'instantiating' && <LoadingView />}
            {status === 'success' && result && (
              <SuccessView result={result} onDone={onDone} onGoToWorkflow={onGoToWorkflow} />
            )}
            {status === 'error' && error && (
              <ErrorView message={error} onRetry={handleRetry} onCancel={onCancel} />
            )}
          </div>
        </div>
      </Overlay>
    );
  },
);
