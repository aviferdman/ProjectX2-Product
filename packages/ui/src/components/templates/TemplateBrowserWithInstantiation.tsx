/**
 * TemplateBrowserWithInstantiation — TASK-161
 *
 * Connected container that wires together the template browser, preview modal,
 * and instantiation dialog into a complete "browse → preview → use" flow.
 *
 * Internally uses the {@link useTemplateInstantiation} hook to manage the
 * instantiation state machine.
 */
import React, { forwardRef, useState, useCallback, useMemo } from 'react';
import type { TemplateSummary } from './types.js';
import { TemplateBrowserPage } from './TemplateBrowserPage.js';
import { TemplatePreviewModal } from './TemplatePreviewModal.js';
import { UseTemplateDialog } from './UseTemplateDialog.js';
import {
  useTemplateInstantiation,
  type InstantiationResult,
  type InstantiateFormValues,
  type InstantiationTemplate,
} from '../../hooks/useTemplateInstantiation.js';

/* ------------------------------------------------------------------ */
/* Public types                                                        */
/* ------------------------------------------------------------------ */

export interface TemplateBrowserWithInstantiationProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Templates to display in the browser. */
  templates: TemplateSummary[];

  /** Whether templates are currently loading. */
  loading?: boolean;

  /**
   * Async callback that performs the actual template instantiation.
   * Called with the template ID and user-provided form values.
   * Should return the instantiation result on success.
   */
  onInstantiate: (
    templateId: string,
    options: InstantiateFormValues,
  ) => Promise<InstantiationResult>;

  /** Called after a successful instantiation. */
  onSuccess?: (result: InstantiationResult) => void;

  /** Called when instantiation fails. */
  onError?: (error: Error) => void;

  /** Called to navigate to a newly created workflow (e.g. after success). */
  onGoToWorkflow?: (workflowId: string) => void;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export const TemplateBrowserWithInstantiation = forwardRef<
  HTMLDivElement,
  TemplateBrowserWithInstantiationProps
>(function TemplateBrowserWithInstantiation(
  {
    templates,
    loading = false,
    onInstantiate,
    onSuccess,
    onError,
    onGoToWorkflow,
    ...props
  },
  ref,
) {
  // Preview modal state
  const [previewTemplate, setPreviewTemplate] =
    useState<TemplateSummary | null>(null);

  // Template instantiation hook
  const instantiation = useTemplateInstantiation({
    onInstantiate,
    onSuccess,
    onError,
  });

  // Build a lookup map for quick template access by ID
  const templateMap = useMemo(() => {
    const map = new Map<string, TemplateSummary>();
    for (const t of templates) {
      map.set(t.id, t);
    }
    return map;
  }, [templates]);

  // Open the preview modal
  const handlePreview = useCallback(
    (id: string) => {
      const template = templateMap.get(id);
      if (template) setPreviewTemplate(template);
    },
    [templateMap],
  );

  // Close the preview modal
  const handleClosePreview = useCallback(() => {
    setPreviewTemplate(null);
  }, []);

  // Start the instantiation flow (from browser card or preview modal)
  const handleUseTemplate = useCallback(
    (id: string) => {
      const template = templateMap.get(id);
      if (!template) return;

      // Close preview if open
      setPreviewTemplate(null);

      // Map TemplateSummary to InstantiationTemplate
      const instantiationTemplate: InstantiationTemplate = {
        id: template.id,
        name: template.name,
        description: template.description,
      };

      instantiation.startInstantiation(instantiationTemplate);
    },
    [templateMap, instantiation],
  );

  // The dialog needs the full TemplateSummary for display (category, counts, etc.)
  const dialogTemplate = useMemo(() => {
    if (!instantiation.selectedTemplate) return null;
    return templateMap.get(instantiation.selectedTemplate.id) ?? null;
  }, [instantiation.selectedTemplate, templateMap]);

  // Handle dialog done (reset and optionally navigate)
  const handleDone = useCallback(() => {
    instantiation.reset();
  }, [instantiation]);

  return (
    <div ref={ref} data-testid="template-browser-with-instantiation" {...props}>
      <TemplateBrowserPage
        templates={templates}
        loading={loading}
        onUseTemplate={handleUseTemplate}
        onPreview={handlePreview}
      />

      <TemplatePreviewModal
        template={previewTemplate}
        onClose={handleClosePreview}
        onUseTemplate={handleUseTemplate}
      />

      <UseTemplateDialog
        template={dialogTemplate}
        status={instantiation.status}
        result={instantiation.result}
        error={instantiation.error}
        onConfirm={instantiation.confirmInstantiation}
        onCancel={instantiation.cancelInstantiation}
        onDone={handleDone}
        onGoToWorkflow={onGoToWorkflow}
      />
    </div>
  );
});
