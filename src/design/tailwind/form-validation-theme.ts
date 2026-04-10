/**
 * TASK-187: Tailwind theme extension for form field validation.
 *
 * Provides semantic color aliases, border radius, and transition utilities
 * for form validation states.
 */
export const formValidationTheme = {
  colors: {
    'form-valid-border': 'var(--cs-form-valid-border)',
    'form-valid-text': 'var(--cs-form-valid-text)',
    'form-valid-icon': 'var(--cs-form-valid-icon)',
    'form-valid-bg': 'var(--cs-form-valid-bg)',
    'form-invalid-border': 'var(--cs-form-invalid-border)',
    'form-invalid-text': 'var(--cs-form-invalid-text)',
    'form-invalid-icon': 'var(--cs-form-invalid-icon)',
    'form-invalid-bg': 'var(--cs-form-invalid-bg)',
    'form-warning-border': 'var(--cs-form-warning-border)',
    'form-warning-text': 'var(--cs-form-warning-text)',
    'form-warning-icon': 'var(--cs-form-warning-icon)',
    'form-warning-bg': 'var(--cs-form-warning-bg)',
    'form-label': 'var(--cs-form-label-color)',
    'form-label-required': 'var(--cs-form-label-required)',
    'form-helper': 'var(--cs-form-helper-color)',
  },
  transitionDuration: {
    'form-validation': 'var(--cs-form-transition-duration)',
  },
} as const;
