import { clsx } from 'clsx';
import { type HTMLAttributes, forwardRef } from 'react';
import {
  type KeyboardShortcut,
  formatShortcut,
  groupShortcutsByCategory,
} from '../../hooks/useKeyboardShortcuts.js';

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */

export interface ShortcutHelpDialogProps extends HTMLAttributes<HTMLDivElement> {
  /** Whether the dialog is visible */
  open: boolean;
  /** Callback to close the dialog */
  onClose: () => void;
  /** All registered keyboard shortcuts */
  shortcuts: KeyboardShortcut[];
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function ShortcutRow({ shortcut }: { shortcut: KeyboardShortcut }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-surface-elevated/50">
      <span className="text-sm text-slate-300">{shortcut.description}</span>
      <kbd
        className={clsx(
          'ml-4 inline-flex items-center gap-0.5',
          'rounded border border-slate-600 bg-surface-card px-2 py-0.5',
          'text-xs font-mono text-slate-200',
          'min-w-[2rem] justify-center',
        )}
      >
        {formatShortcut(shortcut)}
      </kbd>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

/**
 * A dialog that displays all available keyboard shortcuts grouped by
 * category. Typically toggled with `?` or `Ctrl+/`.
 */
export const ShortcutHelpDialog = forwardRef<HTMLDivElement, ShortcutHelpDialogProps>(
  ({ open, onClose, shortcuts, className, ...rest }, ref) => {
    if (!open) return null;

    const groups = groupShortcutsByCategory(shortcuts);

    return (
      <>
        {/* Overlay */}
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          role="presentation"
        />

        {/* Dialog */}
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard shortcuts"
          className={clsx(
            'fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-full max-w-md max-h-[80vh] overflow-y-auto',
            'bg-surface-panel rounded-xl shadow-xl',
            'border border-slate-700',
            className,
          )}
          {...rest}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-700 px-5 py-3">
            <h2 className="text-base font-semibold text-slate-100">Keyboard Shortcuts</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-slate-400 hover:bg-surface-elevated hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M4 4l10 10M14 4L4 14" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-5">
            {Array.from(groups.entries()).map(([category, items]) => (
              <section key={category} aria-label={`${category} shortcuts`}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  {category}
                </h3>
                <div className="space-y-0.5">
                  {items.map((s) => (
                    <ShortcutRow key={s.id} shortcut={s} />
                  ))}
                </div>
              </section>
            ))}

            {shortcuts.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">
                No keyboard shortcuts registered.
              </p>
            )}
          </div>
        </div>
      </>
    );
  },
);

ShortcutHelpDialog.displayName = 'ShortcutHelpDialog';
