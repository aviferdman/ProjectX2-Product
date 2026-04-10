/**
 * useTemplateInstantiation — TASK-161
 *
 * React hook that manages the full template instantiation lifecycle:
 * idle → configuring (showing form) → instantiating (API call) → success / error.
 *
 * The actual instantiation logic is injected via `onInstantiate`, keeping the
 * hook decoupled from any particular service or transport layer.
 */
import { useState, useCallback, useRef } from 'react';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** Lifecycle status of an instantiation flow. */
export type InstantiationStatus =
  | 'idle'
  | 'configuring'
  | 'instantiating'
  | 'success'
  | 'error';

/** User-provided options when confirming instantiation. */
export interface InstantiateFormValues {
  readonly workflowName: string;
  readonly workflowDescription?: string;
}

/** Result returned after a successful instantiation. */
export interface InstantiationResult {
  readonly workflowId: string;
  readonly templateId: string;
  readonly workflowName: string;
  readonly instantiatedAt: string;
}

/** Minimal template shape required by the hook. */
export interface InstantiationTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

/** Options accepted by the hook. */
export interface UseTemplateInstantiationOptions {
  /**
   * Async callback that performs the actual instantiation.
   * Called with the template ID and form values entered by the user.
   */
  onInstantiate: (
    templateId: string,
    options: InstantiateFormValues,
  ) => Promise<InstantiationResult>;

  /** Called after a successful instantiation. */
  onSuccess?: (result: InstantiationResult) => void;

  /** Called when instantiation fails. */
  onError?: (error: Error) => void;
}

/** Return value of the hook. */
export interface UseTemplateInstantiationResult {
  /** Current lifecycle status. */
  readonly status: InstantiationStatus;

  /** The template selected for instantiation, or `null` when idle. */
  readonly selectedTemplate: InstantiationTemplate | null;

  /** Instantiation result (available when status === 'success'). */
  readonly result: InstantiationResult | null;

  /** Error message (available when status === 'error'). */
  readonly error: string | null;

  /** Begin the instantiation flow — opens the configuration dialog. */
  startInstantiation: (template: InstantiationTemplate) => void;

  /** Confirm and execute the instantiation with the given form values. */
  confirmInstantiation: (values: InstantiateFormValues) => Promise<void>;

  /** Cancel the current flow and return to idle. */
  cancelInstantiation: () => void;

  /** Reset from success/error back to idle. */
  reset: () => void;
}

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

export function useTemplateInstantiation(
  options: UseTemplateInstantiationOptions,
): UseTemplateInstantiationResult {
  const [status, setStatus] = useState<InstantiationStatus>('idle');
  const [selectedTemplate, setSelectedTemplate] =
    useState<InstantiationTemplate | null>(null);
  const [result, setResult] = useState<InstantiationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Keep callbacks in a ref so closures always use the latest values.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const startInstantiation = useCallback(
    (template: InstantiationTemplate) => {
      setSelectedTemplate(template);
      setResult(null);
      setError(null);
      setStatus('configuring');
    },
    [],
  );

  const confirmInstantiation = useCallback(
    async (values: InstantiateFormValues) => {
      if (!selectedTemplate) return;

      setStatus('instantiating');
      setError(null);

      try {
        const res = await optionsRef.current.onInstantiate(
          selectedTemplate.id,
          values,
        );
        setResult(res);
        setStatus('success');
        optionsRef.current.onSuccess?.(res);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'An unknown error occurred';
        setError(message);
        setStatus('error');
        optionsRef.current.onError?.(
          err instanceof Error ? err : new Error(message),
        );
      }
    },
    [selectedTemplate],
  );

  const cancelInstantiation = useCallback(() => {
    setSelectedTemplate(null);
    setResult(null);
    setError(null);
    setStatus('idle');
  }, []);

  const reset = useCallback(() => {
    setSelectedTemplate(null);
    setResult(null);
    setError(null);
    setStatus('idle');
  }, []);

  return {
    status,
    selectedTemplate,
    result,
    error,
    startInstantiation,
    confirmInstantiation,
    cancelInstantiation,
    reset,
  };
}
