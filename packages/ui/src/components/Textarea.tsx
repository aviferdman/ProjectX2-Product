/**
 * TASK-187: Textarea — Multi-line input with validation state support.
 *
 * Mirrors the Input component API but for multi-line text input, with
 * integrated validation state borders and aria attributes.
 */
import { clsx } from 'clsx';
import { type TextareaHTMLAttributes, forwardRef } from 'react';
import type { ValidationState } from './FormField.js';

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Optional label shown above the textarea */
  label?: string;
  /** Current validation state */
  validationState?: ValidationState;
  /** Error message — shown when validationState is 'invalid' */
  error?: string;
  /** Helper text below the textarea */
  helperText?: string;
}

/* ------------------------------------------------------------------ */
/* Border styles per validation state                                  */
/* ------------------------------------------------------------------ */

const BORDER_CLASSES: Record<ValidationState, string> = {
  none: 'border-slate-700 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary',
  valid: 'border-form-valid-border focus:ring-1 focus:ring-form-valid-border',
  invalid: 'border-form-invalid-border focus:ring-1 focus:ring-form-invalid-border',
  warning: 'border-form-warning-border focus:ring-1 focus:ring-form-warning-border',
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, validationState = 'none', error, helperText, className, id, ...rest }, ref) => {
    const effectiveState: ValidationState = error ? 'invalid' : validationState;
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-xs font-medium text-slate-300">
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          className={clsx(
            'w-full rounded-md px-3 py-2 text-sm',
            'bg-surface-card border outline-none transition-colors duration-150',
            'text-slate-100 placeholder:text-slate-500',
            'resize-y min-h-[80px]',
            BORDER_CLASSES[effectiveState],
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className,
          )}
          aria-invalid={effectiveState === 'invalid' ? true : undefined}
          aria-describedby={
            error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
          }
          {...rest}
        />

        {error && (
          <p id={`${textareaId}-error`} className="text-xs text-form-invalid-text" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${textareaId}-helper`} className="text-xs text-form-helper">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
