/**
 * TASK-187: useFormValidation — Hook for managing form field validation state.
 *
 * Tracks per-field validation results, provides validate/clear/reset methods,
 * and computes overall form validity. Supports sync and async validators.
 */
import { useState, useCallback, useRef } from 'react';
import type { ValidationState } from '../components/FormField.js';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** Result of validating a single field */
export interface FieldValidationResult {
  state: ValidationState;
  message?: string;
}

/** Validator function — returns a validation result or a promise of one */
export type FieldValidator = (
  value: string,
) => FieldValidationResult | Promise<FieldValidationResult>;

/** Configuration for a single field */
export interface FieldConfig {
  /** One or more validators to run in order; first non-'none' result wins */
  validators: FieldValidator[];
  /** If true, the field is validated eagerly on change */
  validateOnChange?: boolean;
}

export interface UseFormValidationOptions {
  /** Field configurations keyed by field name */
  fields: Record<string, FieldConfig>;
}

/** Per-field state exposed to consumers */
export interface FieldState {
  state: ValidationState;
  message?: string;
  touched: boolean;
}

export interface UseFormValidationResult {
  /** Current state for each registered field */
  fieldStates: Record<string, FieldState>;
  /** Validate a single field by name and value */
  validateField: (name: string, value: string) => Promise<FieldValidationResult>;
  /** Validate all fields with the supplied values map */
  validateAll: (values: Record<string, string>) => Promise<boolean>;
  /** Clear validation state for a specific field */
  clearField: (name: string) => void;
  /** Reset all fields to untouched/none */
  resetAll: () => void;
  /** True when all touched fields are either 'none' or 'valid' */
  isValid: boolean;
  /** True when any field is currently being validated async */
  isValidating: boolean;
}

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

function buildInitialStates(
  fields: Record<string, FieldConfig>,
): Record<string, FieldState> {
  const out: Record<string, FieldState> = {};
  for (const name of Object.keys(fields)) {
    out[name] = { state: 'none', message: undefined, touched: false };
  }
  return out;
}

export function useFormValidation(
  options: UseFormValidationOptions,
): UseFormValidationResult {
  const { fields } = options;
  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;

  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>(
    () => buildInitialStates(fields),
  );
  const [validatingCount, setValidatingCount] = useState(0);

  const validateField = useCallback(
    async (name: string, value: string): Promise<FieldValidationResult> => {
      const config = fieldsRef.current[name];
      if (!config) {
        return { state: 'none' };
      }

      setValidatingCount((c) => c + 1);
      try {
        let result: FieldValidationResult = { state: 'none' };
        for (const validator of config.validators) {
          const r = await validator(value);
          if (r.state !== 'none') {
            result = r;
            break;
          }
        }
        setFieldStates((prev) => ({
          ...prev,
          [name]: { state: result.state, message: result.message, touched: true },
        }));
        return result;
      } finally {
        setValidatingCount((c) => c - 1);
      }
    },
    [],
  );

  const validateAll = useCallback(
    async (values: Record<string, string>): Promise<boolean> => {
      const names = Object.keys(fieldsRef.current);
      const results = await Promise.all(
        names.map((n) => validateField(n, values[n] ?? '')),
      );
      return results.every((r) => r.state === 'none' || r.state === 'valid');
    },
    [validateField],
  );

  const clearField = useCallback((name: string) => {
    setFieldStates((prev) => ({
      ...prev,
      [name]: { state: 'none', message: undefined, touched: prev[name]?.touched ?? false },
    }));
  }, []);

  const resetAll = useCallback(() => {
    setFieldStates(buildInitialStates(fieldsRef.current));
  }, []);

  const isValid = Object.values(fieldStates).every(
    (s) => !s.touched || s.state === 'none' || s.state === 'valid',
  );

  return {
    fieldStates,
    validateField,
    validateAll,
    clearField,
    resetAll,
    isValid,
    isValidating: validatingCount > 0,
  };
}
