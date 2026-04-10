/**
 * TASK-187: Built-in field validators for common validation rules.
 */
import type { FieldValidationResult, FieldValidator } from '../hooks/useFormValidation.js';

/** Creates a validator that fails if the value is empty */
export function required(message = 'This field is required'): FieldValidator {
  return (value: string): FieldValidationResult => {
    if (!value.trim()) {
      return { state: 'invalid', message };
    }
    return { state: 'none' };
  };
}

/** Creates a validator that fails if the value is shorter than minLen */
export function minLength(minLen: number, message?: string): FieldValidator {
  return (value: string): FieldValidationResult => {
    if (value.length > 0 && value.length < minLen) {
      return {
        state: 'invalid',
        message: message ?? `Must be at least ${minLen} characters`,
      };
    }
    return { state: 'none' };
  };
}

/** Creates a validator that fails if the value is longer than maxLen */
export function maxLength(maxLen: number, message?: string): FieldValidator {
  return (value: string): FieldValidationResult => {
    if (value.length > maxLen) {
      return {
        state: 'invalid',
        message: message ?? `Must be at most ${maxLen} characters`,
      };
    }
    return { state: 'none' };
  };
}

/** Creates a validator that warns when value approaches maxLen */
export function maxLengthWarning(
  warnAt: number,
  maxLen: number,
  message?: string,
): FieldValidator {
  return (value: string): FieldValidationResult => {
    if (value.length >= warnAt && value.length <= maxLen) {
      return {
        state: 'warning',
        message: message ?? `${maxLen - value.length} characters remaining`,
      };
    }
    return { state: 'none' };
  };
}

/** Creates a validator that fails if the value doesn't match the pattern */
export function pattern(regex: RegExp, message = 'Invalid format'): FieldValidator {
  return (value: string): FieldValidationResult => {
    if (value.length > 0 && !regex.test(value)) {
      return { state: 'invalid', message };
    }
    return { state: 'none' };
  };
}

/** Email pattern validator */
export function email(message = 'Invalid email address'): FieldValidator {
  return pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, message);
}

/** Creates a validator that marks valid when value is non-empty and passes all prior validators */
export function showValid(message?: string): FieldValidator {
  return (value: string): FieldValidationResult => {
    if (value.trim().length > 0) {
      return { state: 'valid', message };
    }
    return { state: 'none' };
  };
}
