/**
 * Custom error classes for template storage operations.
 *
 * @packageDocumentation
 */

import { CrewspaceError, ErrorCode } from '../errors/base.js';

// ---------------------------------------------------------------------------
// Error codes (extend base ErrorCode enum at usage sites)
// ---------------------------------------------------------------------------

/** Error code for template-specific errors. */
export const TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND' as unknown as ErrorCode;
export const TEMPLATE_VALIDATION = 'TEMPLATE_VALIDATION' as unknown as ErrorCode;

// ---------------------------------------------------------------------------
// Template errors
// ---------------------------------------------------------------------------

/** Thrown when a template is not found by ID. */
export class TemplateNotFoundError extends CrewspaceError {
  public readonly templateId: string;

  constructor(templateId: string) {
    super(`Template "${templateId}" not found`, TEMPLATE_NOT_FOUND);
    this.name = 'TemplateNotFoundError';
    this.templateId = templateId;
  }

  protected override getDetails(): Record<string, unknown> {
    return { templateId: this.templateId };
  }
}

/** Thrown when template input fails validation. */
export class TemplateValidationError extends CrewspaceError {
  constructor(message: string) {
    super(message, TEMPLATE_VALIDATION);
    this.name = 'TemplateValidationError';
  }
}
