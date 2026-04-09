import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import type { TemplateSummary } from './types.js';
import { TemplateCategoryBadge } from './TemplateCategoryBadge.js';
import { TemplateTag } from './TemplateTag.js';
import { FeaturedBadge } from './FeaturedBadge.js';

export interface TemplateCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
  template: TemplateSummary;
  onUseTemplate?: ((id: string) => void) | undefined;
  onPreview?: ((id: string) => void) | undefined;
}

function formatUsageCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

export const TemplateCard = forwardRef<HTMLDivElement, TemplateCardProps>(
  function TemplateCard(
    { template, onUseTemplate, onPreview, className, ...props },
    ref,
  ) {
    const handleUse = (e: React.MouseEvent) => {
      e.stopPropagation();
      onUseTemplate?.(template.id);
    };

    const handlePreview = (e: React.MouseEvent) => {
      e.stopPropagation();
      onPreview?.(template.id);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onPreview?.(template.id);
      }
    };

    return (
      <div
        ref={ref}
        role="article"
        tabIndex={0}
        aria-label={`Template: ${template.name}`}
        onKeyDown={handleKeyDown}
        className={clsx(
          'group flex flex-col overflow-hidden rounded-xl',
          'border border-tpl-card-border bg-tpl-card-bg',
          'shadow-tpl-card transition-all duration-150',
          'hover:border-tpl-card-border-hover hover:bg-tpl-card-bg-hover hover:shadow-tpl-card-hover',
          'hover:-translate-y-0.5',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
          'animate-tpl-card-enter',
          className,
        )}
        {...props}
      >
        {/* Thumbnail */}
        <div
          className={clsx(
            'relative flex items-center justify-center overflow-hidden',
            'h-tpl-card-thumb-h bg-tpl-card-thumb-bg',
            'border-b border-tpl-card-border',
          )}
        >
          {/* Placeholder workflow diagram icon */}
          <svg
            width="64"
            height="48"
            viewBox="0 0 64 48"
            fill="none"
            className="text-slate-600 opacity-40"
            aria-hidden="true"
          >
            <rect x="4" y="8" width="16" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <rect x="24" y="18" width="16" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <rect x="44" y="8" width="16" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M20 14h4M40 24h4" stroke="currentColor" strokeWidth="1.5" />
            <path d="M32 18V14h-8M32 30V34h8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
          </svg>

          {/* Badge overlays */}
          <div className="absolute left-2 top-2 flex gap-1">
            {template.featured && <FeaturedBadge variant="featured" />}
            {template.popular && <FeaturedBadge variant="popular" />}
          </div>

          {/* Hover overlay with action buttons */}
          <div
            className={clsx(
              'absolute inset-0 flex items-center justify-center gap-2',
              'bg-tpl-card-thumb-overlay opacity-0 transition-opacity duration-150',
              'group-hover:opacity-100',
            )}
          >
            <button
              type="button"
              onClick={handlePreview}
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-lg border px-3',
                'h-tpl-preview-btn-h',
                'border-tpl-preview-btn-border bg-tpl-preview-btn-bg text-tpl-preview-btn-text',
                'text-xs font-medium',
                'transition-colors duration-150',
                'hover:border-tpl-preview-btn-border-hover hover:bg-tpl-preview-btn-bg-hover hover:text-tpl-preview-btn-text-hover',
              )}
              aria-label={`Preview ${template.name}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Preview
            </button>
            <button
              type="button"
              onClick={handleUse}
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-lg px-3',
                'h-tpl-use-btn-h',
                'bg-tpl-use-btn-bg text-tpl-use-btn-text',
                'shadow-tpl-use-btn',
                'text-xs font-medium',
                'transition-all duration-150',
                'hover:bg-tpl-use-btn-bg-hover hover:shadow-tpl-use-btn-hover',
              )}
              aria-label={`Use template ${template.name}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Use
            </button>
          </div>
        </div>

        {/* Card body */}
        <div className="flex flex-1 flex-col gap-2 p-tpl-card-body-p">
          {/* Category + meta row */}
          <div className="flex items-center justify-between">
            <TemplateCategoryBadge category={template.category} />
            <span className="text-tpl-card-meta text-tpl-card-meta">
              {formatUsageCount(template.usageCount)} uses
            </span>
          </div>

          {/* Title */}
          <h3 className="text-tpl-card-title text-tpl-card-title truncate">
            {template.name}
          </h3>

          {/* Description */}
          <p className="text-tpl-card-desc text-tpl-card-desc line-clamp-2">
            {template.description}
          </p>

          {/* Tags */}
          {template.tags.length > 0 && (
            <div className="mt-auto flex flex-wrap gap-tpl-tag-gap pt-1">
              {template.tags.slice(0, 3).map((tag) => (
                <TemplateTag key={tag} label={tag} />
              ))}
              {template.tags.length > 3 && (
                <span className="text-tpl-card-meta text-tpl-card-meta self-center">
                  +{template.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Footer meta */}
          <div className="mt-1 flex items-center gap-3 text-tpl-card-meta text-tpl-card-meta">
            <span>{template.agentCount} agents</span>
            <span>·</span>
            <span>{template.taskCount} tasks</span>
            <span className="ml-auto">by {template.author}</span>
          </div>
        </div>
      </div>
    );
  },
);
