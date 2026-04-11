import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import type { IntegrationSummary } from './types.js';
import { IntegrationCategoryBadge } from './IntegrationCategoryBadge.js';
import { VerifiedBadge } from './VerifiedBadge.js';
import { StarRating } from './StarRating.js';

export interface IntegrationCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
  integration: IntegrationSummary;
  onInstall?: ((id: string) => void) | undefined;
  onViewDetails?: ((id: string) => void) | undefined;
}

function formatInstallCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

export const IntegrationCard = forwardRef<HTMLDivElement, IntegrationCardProps>(
  function IntegrationCard(
    { integration, onInstall, onViewDetails, className, ...props },
    ref,
  ) {
    const handleInstall = (e: React.MouseEvent) => {
      e.stopPropagation();
      onInstall?.(integration.id);
    };

    const handleViewDetails = (e: React.MouseEvent) => {
      e.stopPropagation();
      onViewDetails?.(integration.id);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onViewDetails?.(integration.id);
      }
    };

    return (
      <div
        ref={ref}
        role="article"
        tabIndex={0}
        aria-label={`Integration: ${integration.name}`}
        onKeyDown={handleKeyDown}
        className={clsx(
          'group flex flex-col overflow-hidden rounded-xl',
          'border border-[var(--cs-border-default,#18181b)] bg-[var(--cs-bg-card,#111113)]',
          'shadow-sm transition-all duration-150',
          'hover:border-[var(--cs-border-hover,#27272a)] hover:bg-[var(--cs-bg-card-hover,#18181b)] hover:shadow-md',
          'hover:-translate-y-0.5',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
          className,
        )}
        {...props}
      >
        {/* Icon area */}
        <div
          className={clsx(
            'relative flex items-center justify-center overflow-hidden',
            'h-28 bg-[var(--cs-bg-surface,#09090b)]',
            'border-b border-[var(--cs-border-default,#18181b)]',
          )}
        >
          {/* Placeholder integration icon */}
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            className="text-slate-600 opacity-40"
            aria-hidden="true"
          >
            <rect x="8" y="8" width="32" height="32" rx="8" stroke="currentColor" strokeWidth="1.5" />
            <path d="M18 24h12M24 18v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>

          {/* Badge overlays */}
          <div className="absolute left-2 top-2 flex gap-1">
            {integration.verified && <VerifiedBadge />}
          </div>

          {/* Hover overlay with action buttons */}
          <div
            className={clsx(
              'absolute inset-0 flex items-center justify-center gap-2',
              'bg-black/60 opacity-0 transition-opacity duration-150',
              'group-hover:opacity-100',
            )}
          >
            <button
              type="button"
              onClick={handleViewDetails}
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-lg border px-3',
                'h-8',
                'border-slate-500 bg-slate-800/80 text-slate-200',
                'text-xs font-medium',
                'transition-colors duration-150',
                'hover:border-slate-400 hover:bg-slate-700 hover:text-white',
              )}
              aria-label={`View details for ${integration.name}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Details
            </button>
            <button
              type="button"
              onClick={handleInstall}
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-lg px-3',
                'h-8',
                'bg-indigo-600 text-white',
                'shadow-sm',
                'text-xs font-medium',
                'transition-all duration-150',
                'hover:bg-indigo-500 hover:shadow-md',
              )}
              aria-label={`Install ${integration.name}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              Install
            </button>
          </div>
        </div>

        {/* Card body */}
        <div className="flex flex-1 flex-col gap-2 p-4">
          {/* Category + version */}
          <div className="flex items-center justify-between">
            <IntegrationCategoryBadge category={integration.category} />
            <span className="text-[11px] text-[var(--cs-text-secondary,#a1a1aa)]">
              v{integration.version}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-[var(--cs-text-primary,#fafafa)] truncate">
            {integration.name}
          </h3>

          {/* Description */}
          <p className="text-xs text-[var(--cs-text-secondary,#a1a1aa)] line-clamp-2">
            {integration.description}
          </p>

          {/* Tags */}
          {integration.tags.length > 0 && (
            <div className="mt-auto flex flex-wrap gap-1 pt-1">
              {integration.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className={clsx(
                    'inline-flex items-center rounded px-1.5 py-0.5',
                    'text-[10px] font-medium',
                    'bg-slate-800 text-slate-400 border border-slate-700',
                  )}
                >
                  {tag}
                </span>
              ))}
              {integration.tags.length > 3 && (
                <span className="text-[11px] text-[var(--cs-text-secondary,#a1a1aa)] self-center">
                  +{integration.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Footer: rating + install count + author */}
          <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--cs-text-secondary,#a1a1aa)]">
            <StarRating rating={integration.rating} />
            <span className="ml-auto">{formatInstallCount(integration.installCount)} installs</span>
          </div>
          <div className="flex items-center text-[11px] text-[var(--cs-text-secondary,#a1a1aa)]">
            <span>by {integration.author}</span>
          </div>
        </div>
      </div>
    );
  },
);
