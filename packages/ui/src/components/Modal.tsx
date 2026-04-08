import { clsx } from 'clsx';
import {
  type HTMLAttributes,
  type MouseEvent,
  type KeyboardEvent,
  forwardRef,
  useEffect,
  useCallback,
} from 'react';

/* ------------------------------------------------------------------ */
/* Overlay                                                             */
/* ------------------------------------------------------------------ */
interface OverlayProps extends HTMLAttributes<HTMLDivElement> {
  onClose?: () => void;
}

const Overlay = forwardRef<HTMLDivElement, OverlayProps>(
  ({ onClose, className, children, ...rest }, ref) => {
    const handleClick = (e: MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose?.();
    };

    return (
      <div
        ref={ref}
        className={clsx(
          'fixed inset-0 z-50 flex items-center justify-center',
          'bg-black/60 backdrop-blur-sm',
          'animate-in fade-in duration-150',
          className,
        )}
        onClick={handleClick}
        role="presentation"
        {...rest}
      >
        {children}
      </div>
    );
  },
);

Overlay.displayName = 'Overlay';

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */
export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  /** Controls visibility */
  open: boolean;
  /** Callback when the modal requests to close */
  onClose: () => void;
  /** Accessible title (rendered in header) */
  title?: string;
  /** Width preset */
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
} as const;

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ open, onClose, title, size = 'md', className, children, ...rest }, ref) => {
    const handleKeyDown = useCallback(
      (e: globalThis.KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      },
      [onClose],
    );

    useEffect(() => {
      if (!open) return;
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, handleKeyDown]);

    if (!open) return null;

    return (
      <Overlay onClose={onClose}>
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={clsx(
            'w-full rounded-xl border border-slate-700 bg-surface-panel shadow-xl',
            'animate-in zoom-in-95 duration-200',
            sizeStyles[size],
            className,
          )}
          {...rest}
        >
          {title && (
            <div className="flex items-center justify-between border-b border-slate-700 px-5 py-3">
              <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
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
                >
                  <path d="M4 4l10 10M14 4L4 14" />
                </svg>
              </button>
            </div>
          )}
          <div className="p-5">{children}</div>
        </div>
      </Overlay>
    );
  },
);

Modal.displayName = 'Modal';
