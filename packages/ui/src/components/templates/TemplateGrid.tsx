import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import type { TemplateSummary } from './types.js';
import { TemplateCard } from './TemplateCard.js';

export interface TemplateGridProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  templates: TemplateSummary[];
  onUseTemplate?: ((id: string) => void) | undefined;
  onPreview?: ((id: string) => void) | undefined;
}

export const TemplateGrid= forwardRef<HTMLDivElement, TemplateGridProps>(
  function TemplateGrid(
    { templates, onUseTemplate, onPreview, className, ...props },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={clsx(
          'grid gap-tpl-card-gap',
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
          'animate-tpl-grid-reflow',
          className,
        )}
        style={{
          gridTemplateColumns:
            'repeat(auto-fill, minmax(min(var(--tpl-card-min-w, 260px), 100%), 1fr))',
        }}
        {...props}
      >
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onUseTemplate={onUseTemplate}
            onPreview={onPreview}
          />
        ))}
      </div>
    );
  },
);
