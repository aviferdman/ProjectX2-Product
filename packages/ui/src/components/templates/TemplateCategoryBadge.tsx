import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import type { TemplateCategory } from './types.js';

export interface TemplateCategoryBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  category: TemplateCategory;
}

const categoryStyles: Record<
  TemplateCategory,
  { bg: string; text: string; border: string }
> = {
  research: {
    bg: 'bg-tpl-category-research-bg',
    text: 'text-tpl-category-research',
    border: 'border-tpl-category-research/30',
  },
  code: {
    bg: 'bg-tpl-category-code-bg',
    text: 'text-tpl-category-code',
    border: 'border-tpl-category-code/30',
  },
  support: {
    bg: 'bg-tpl-category-support-bg',
    text: 'text-tpl-category-support',
    border: 'border-tpl-category-support/30',
  },
  content: {
    bg: 'bg-tpl-category-content-bg',
    text: 'text-tpl-category-content',
    border: 'border-tpl-category-content/30',
  },
  data: {
    bg: 'bg-tpl-category-data-bg',
    text: 'text-tpl-category-data',
    border: 'border-tpl-category-data/30',
  },
  automation: {
    bg: 'bg-tpl-category-automation-bg',
    text: 'text-tpl-category-automation',
    border: 'border-tpl-category-automation/30',
  },
};

const categoryLabels: Record<TemplateCategory, string> = {
  research: 'Research',
  code: 'Code & Dev',
  support: 'Support',
  content: 'Content',
  data: 'Data & Analytics',
  automation: 'Automation',
};

export const TemplateCategoryBadge = forwardRef<
  HTMLSpanElement,
  TemplateCategoryBadgeProps
>(function TemplateCategoryBadge({ category, className, ...props }, ref) {
  const style = categoryStyles[category];
  return (
    <span
      ref={ref}
      className={clsx(
        'inline-flex items-center rounded-sm border px-1.5',
        'text-tpl-badge font-semibold uppercase tracking-wider',
        'h-tpl-badge-h',
        style.bg,
        style.text,
        style.border,
        className,
      )}
      {...props}
    >
      {categoryLabels[category]}
    </span>
  );
});
