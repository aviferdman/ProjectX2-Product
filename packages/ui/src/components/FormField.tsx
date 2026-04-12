/**
 * TASK-187: FormField — Wrapper component that provides inline validation
 * feedback for form inputs (error messages, validation state indicators).
 *
 * Wraps any input-like child with a label, helper/error text, and visual
 * validation state styling (valid, invalid, warning).
 */
import { clsx } from 'clsx';
import { type ReactNode, type HTMLAttributes, forwardRef, useId } from 'react';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** Validation state for a form field */
export type ValidationState = 'none' | 'valid' | 'invalid' | 'warning';

export interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  /** Field label text */
  label?: string;
  /** Mark field as required (shows asterisk after label) */
  required?: boolean;
  /** Current validation state */
  validationState?: ValidationState;
  /** Error message shown when validationState is 'invalid' */
  errorMessage?: string;
  /** Warning message shown when validationState is 'warning' */
  warningMessage?: string;
  /** Success message shown when validationState is 'valid' */
  successMessage?: string;
  /** Helper text shown below the input when no validation message is active */
  helperText?: string;
  /** Disable the field visually */
  disabled?: boolean;
  /** Optional custom id for the input (used for htmlFor / aria linking) */
  inputId?: string;
  /** Child input elements */
  children: ReactNode;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const VALIDATION_ICON: Record<Exclude<ValidationState, 'none'>, string> = {
  valid: '✓',
  invalid: '✕',
  warning: '⚠',
};

const VALIDATION_TEXT_CLASS: Record<Exclude<ValidationState, 'none'>, string> = {
  valid: 'text-form-valid-text',
  invalid: 'text-form-invalid-text',
  warning: 'text-form-warning-text',
};

const VALIDATION_ICON_CLASS: Record<Exclude<ValidationState, 'none'>, string> = {
  valid: 'text-form-valid-icon',
  invalid: 'text-form-invalid-icon',
  warning: 'text-form-warning-icon',
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  (
    {
      label,
      required = false,
      validationState = 'none',
      errorMessage,
      warningMessage,
      successMessage,
      helperText,
      disabled = false,
      inputId: providedInputId,
      children,
      className,
      ...rest
    },
    ref,
  ) => {
    const autoId = useId();
    const fieldId = providedInputId ?? autoId;
    const messageId = `${fieldId}-message`;
    const helperId = `${fieldId}-helper`;

    const activeMessage =
      validationState === 'invalid'
        ? errorMessage
        : validationState === 'warning'
          ? warningMessage
          : validationState === 'valid'
            ? successMessage
            : undefined;

    const showMessage = activeMessage && validationState !== 'none';
    const showHelper = helperText && !showMessage;

    const ariaDescribedBy = showMessage ? messageId : showHelper ? helperId : undefined;

    return (
      <div
        ref={ref}
        className={clsx(
          'cs-form-field flex flex-col gap-1.5',
          disabled && 'opacity-50 pointer-events-none',
          className,
        )}
        data-validation={validationState}
        data-testid="form-field"
        {...rest}
      >
        {/* Label */}
        {label && (
          <label htmlFor={fieldId} className="text-xs font-medium text-form-label">
            {label}
            {required && (
              <span className="ml-0.5 text-form-label-required" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        {/* Input slot — children should include the actual input */}
        <div
          className="cs-form-field-input"
          data-field-id={fieldId}
          data-aria-describedby={ariaDescribedBy}
        >
          {children}
        </div>

        {/* Validation message */}
        {showMessage && (
          <p
            id={messageId}
            role={validationState === 'invalid' ? 'alert' : undefined}
            className={clsx(
              'flex items-center gap-1 text-xs leading-4 transition-colors',
              VALIDATION_TEXT_CLASS[validationState as Exclude<ValidationState, 'none'>],
            )}
          >
            <span
              className={clsx(
                'inline-flex shrink-0',
                VALIDATION_ICON_CLASS[validationState as Exclude<ValidationState, 'none'>],
              )}
              aria-hidden="true"
            >
              {VALIDATION_ICON[validationState as Exclude<ValidationState, 'none'>]}
            </span>
            {activeMessage}
          </p>
        )}

        {/* Helper text */}
        {showHelper && (
          <p id={helperId} className="text-xs text-form-helper">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

FormField.displayName = 'FormField';
