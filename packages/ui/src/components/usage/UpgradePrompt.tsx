/**
 * UpgradePrompt — CTA card encouraging the user to upgrade their plan.
 * TASK-152
 */

import { clsx } from 'clsx';
import { type HTMLAttributes, forwardRef } from 'react';
import { type PlanTier, PLAN_DISPLAY_NAMES } from './types.js';

const UPGRADE_TARGETS: Record<PlanTier, PlanTier | null> = {
  free: 'pro',
  pro: 'team',
  team: 'enterprise',
  enterprise: null,
};

export interface UpgradePromptProps extends HTMLAttributes<HTMLDivElement> {
  /** Current plan tier. */
  currentTier: PlanTier;
  /** Custom heading text. */
  heading?: string | undefined;
  /** Custom description text. */
  description?: string | undefined;
  /** Label for upgrade button (default: "Upgrade to <tier>"). */
  buttonLabel?: string | undefined;
  /** Callback when upgrade button is clicked. */
  onUpgrade?: (() => void) | undefined;
  /** Callback when dismiss is clicked. */
  onDismiss?: (() => void) | undefined;
}

export const UpgradePrompt = forwardRef<HTMLDivElement, UpgradePromptProps>(
  (
    { currentTier, heading, description, buttonLabel, onUpgrade, onDismiss, className, ...rest },
    ref,
  ) => {
    const targetTier = UPGRADE_TARGETS[currentTier];

    // Enterprise users have no upgrade path
    if (!targetTier) return null;

    const defaultHeading = 'Unlock more with ' + PLAN_DISPLAY_NAMES[targetTier];
    const defaultDescription = `You're on the ${PLAN_DISPLAY_NAMES[currentTier]} plan. Upgrade to ${PLAN_DISPLAY_NAMES[targetTier]} for higher limits and more features.`;
    const defaultButtonLabel = `Upgrade to ${PLAN_DISPLAY_NAMES[targetTier]}`;

    return (
      <div
        ref={ref}
        className={clsx(
          'cs-upgrade-prompt relative overflow-hidden rounded-lg border',
          'border-indigo-700/50 bg-gradient-to-br from-indigo-900/30 to-indigo-900/20 p-5',
          className,
        )}
        {...rest}
      >
        {/* Dismiss */}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="absolute top-3 right-3 rounded p-1 text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Dismiss upgrade prompt"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        )}

        {/* Decorative sparkle */}
        <svg
          className="mb-3 h-8 w-8 text-indigo-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path
            d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <h3 className="text-sm font-semibold text-slate-100">{heading ?? defaultHeading}</h3>

        <p className="mt-1 text-xs text-slate-400 max-w-md">{description ?? defaultDescription}</p>

        {onUpgrade && (
          <button
            type="button"
            onClick={onUpgrade}
            className={clsx(
              'mt-4 inline-flex items-center gap-1.5 rounded-md px-4 py-2',
              'bg-indigo-600 text-sm font-semibold text-white',
              'hover:bg-indigo-500 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app',
            )}
          >
            {buttonLabel ?? defaultButtonLabel}
            <svg
              className="h-4 w-4"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M6 3l5 5-5 5" />
            </svg>
          </button>
        )}
      </div>
    );
  },
);

UpgradePrompt.displayName = 'UpgradePrompt';
