import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import type { IntegrationCategory } from './types.js';

export interface IntegrationCategoryBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  category: IntegrationCategory;
}

const categoryStyles: Record<
  IntegrationCategory,
  { bg: string; text: string; border: string }
> = {
  llm: {
    bg: 'bg-violet-500/10',
    text: 'text-violet-400',
    border: 'border-violet-400/30',
  },
  tool: {
    bg: 'bg-sky-500/10',
    text: 'text-sky-400',
    border: 'border-sky-400/30',
  },
  storage: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-400/30',
  },
  communication: {
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    border: 'border-green-400/30',
  },
  analytics: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-400/30',
  },
  monitoring: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-400/30',
  },
};

const categoryLabels: Record<IntegrationCategory, string> = {
  llm: 'LLM Provider',
  tool: 'Tool',
  storage: 'Storage',
  communication: 'Communication',
  analytics: 'Analytics',
  monitoring: 'Monitoring',
};

export const IntegrationCategoryBadge = forwardRef<
  HTMLSpanElement,
  IntegrationCategoryBadgeProps
>(function IntegrationCategoryBadge({ category, className, ...props }, ref) {
  const style = categoryStyles[category];
  return (
    <span
      ref={ref}
      className={clsx(
        'inline-flex items-center rounded-sm border px-1.5',
        'text-[10px] font-semibold uppercase tracking-wider',
        'h-5',
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
