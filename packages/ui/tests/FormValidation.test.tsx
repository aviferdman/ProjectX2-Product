/**
 * TASK-187: Tests for FormField, Textarea components and useFormValidation hook.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { FormField } from '../src/components/FormField.js';
import { Textarea } from '../src/components/Textarea.js';
import {
  useFormValidation,
  type FieldConfig,
} from '../src/hooks/useFormValidation.js';
import {
  required,
  minLength,
  maxLength,
  maxLengthWarning,
  pattern,
  email,
  showValid,
} from '../src/components/validators.js';

/* ------------------------------------------------------------------ */
/* FormField component                                                 */
/* ------------------------------------------------------------------ */
describe('FormField', () => {
  it('renders children', () => {
    render(
      <FormField>
        <input data-testid="child-input" />
      </FormField>,
    );
    expect(screen.getByTestId('child-input')).toBeInTheDocument();
  });

  it('renders label with htmlFor', () => {
    render(
      <FormField label="Username" inputId="username">
        <input id="username" />
      </FormField>,
    );
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByText('Username')).toHaveAttribute('for', 'username');
  });

  it('shows required asterisk when required', () => {
    render(
      <FormField label="Email" required>
        <input />
      </FormField>,
    );
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('does not show asterisk when not required', () => {
    render(
      <FormField label="Notes">
        <input />
      </FormField>,
    );
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('shows error message when validationState is invalid', () => {
    render(
      <FormField validationState="invalid" errorMessage="Field is required">
        <input />
      </FormField>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Field is required');
  });

  it('shows warning message when validationState is warning', () => {
    render(
      <FormField validationState="warning" warningMessage="Getting long">
        <input />
      </FormField>,
    );
    expect(screen.getByText('Getting long')).toBeInTheDocument();
  });

  it('shows success message when validationState is valid', () => {
    render(
      <FormField validationState="valid" successMessage="Looks good!">
        <input />
      </FormField>,
    );
    expect(screen.getByText('Looks good!')).toBeInTheDocument();
  });

  it('shows helper text when no validation message is active', () => {
    render(
      <FormField helperText="Enter your username">
        <input />
      </FormField>,
    );
    expect(screen.getByText('Enter your username')).toBeInTheDocument();
  });

  it('hides helper text when error is shown', () => {
    render(
      <FormField
        validationState="invalid"
        errorMessage="Bad"
        helperText="Enter your username"
      >
        <input />
      </FormField>,
    );
    expect(screen.queryByText('Enter your username')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Bad');
  });

  it('sets data-validation attribute', () => {
    render(
      <FormField validationState="invalid" errorMessage="Err">
        <input />
      </FormField>,
    );
    expect(screen.getByTestId('form-field')).toHaveAttribute(
      'data-validation',
      'invalid',
    );
  });

  it('applies disabled styling', () => {
    render(
      <FormField disabled>
        <input />
      </FormField>,
    );
    const el = screen.getByTestId('form-field');
    expect(el.className).toContain('opacity-50');
    expect(el.className).toContain('pointer-events-none');
  });

  it('forwards ref', () => {
    let el: HTMLDivElement | null = null;
    render(
      <FormField ref={(r) => { el = r; }}>
        <input />
      </FormField>,
    );
    expect(el).toBeInstanceOf(HTMLDivElement);
  });

  it('merges custom className', () => {
    render(
      <FormField className="my-class">
        <input />
      </FormField>,
    );
    expect(screen.getByTestId('form-field').className).toContain('my-class');
  });

  it('displays validation icons', () => {
    const { rerender } = render(
      <FormField validationState="invalid" errorMessage="Error">
        <input />
      </FormField>,
    );
    expect(screen.getByText('✕')).toBeInTheDocument();

    rerender(
      <FormField validationState="warning" warningMessage="Warn">
        <input />
      </FormField>,
    );
    expect(screen.getByText('⚠')).toBeInTheDocument();

    rerender(
      <FormField validationState="valid" successMessage="OK">
        <input />
      </FormField>,
    );
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('does not show message when validationState is none', () => {
    render(
      <FormField
        validationState="none"
        errorMessage="Should not appear"
        warningMessage="Should not appear"
        successMessage="Should not appear"
      >
        <input />
      </FormField>,
    );
    expect(screen.queryByText('Should not appear')).not.toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/* Textarea component                                                  */
/* ------------------------------------------------------------------ */
describe('Textarea', () => {
  it('renders a textarea element', () => {
    render(<Textarea placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter text').tagName).toBe('TEXTAREA');
  });

  it('renders a label', () => {
    render(<Textarea label="Description" />);
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('shows error message and sets aria-invalid', () => {
    render(<Textarea label="Bio" error="Required" />);
    const textarea = screen.getByLabelText('Bio');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Required');
  });

  it('shows helper text when no error', () => {
    render(<Textarea label="Bio" helperText="Tell us about yourself" />);
    expect(screen.getByText('Tell us about yourself')).toBeInTheDocument();
  });

  it('hides helper text when error is present', () => {
    render(
      <Textarea label="Bio" helperText="Tell us" error="Too short" />,
    );
    expect(screen.queryByText('Tell us')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Too short');
  });

  it('applies validation border classes', () => {
    const { rerender } = render(<Textarea label="Field" validationState="valid" />);
    expect(screen.getByLabelText('Field').className).toContain('border-form-valid-border');

    rerender(<Textarea label="Field" validationState="warning" />);
    expect(screen.getByLabelText('Field').className).toContain('border-form-warning-border');

    rerender(<Textarea label="Field" validationState="invalid" />);
    expect(screen.getByLabelText('Field').className).toContain('border-form-invalid-border');
  });

  it('error prop overrides validationState to invalid', () => {
    render(<Textarea label="Field" validationState="valid" error="Bad" />);
    const textarea = screen.getByLabelText('Field');
    expect(textarea.className).toContain('border-form-invalid-border');
  });

  it('is disabled when disabled prop is set', () => {
    render(<Textarea disabled placeholder="disabled" />);
    expect(screen.getByPlaceholderText('disabled')).toBeDisabled();
  });

  it('forwards ref', () => {
    let el: HTMLTextAreaElement | null = null;
    render(<Textarea ref={(r) => { el = r; }} />);
    expect(el).toBeInstanceOf(HTMLTextAreaElement);
  });
});

/* ------------------------------------------------------------------ */
/* Validators                                                          */
/* ------------------------------------------------------------------ */
describe('Validators', () => {
  it('required: fails on empty', () => {
    const v = required();
    expect(v('')).toEqual({ state: 'invalid', message: 'This field is required' });
    expect(v('   ')).toEqual({ state: 'invalid', message: 'This field is required' });
  });

  it('required: passes on non-empty', () => {
    const v = required();
    expect(v('hello')).toEqual({ state: 'none' });
  });

  it('required: custom message', () => {
    const v = required('Fill this in');
    expect(v('')).toEqual({ state: 'invalid', message: 'Fill this in' });
  });

  it('minLength: fails when too short', () => {
    const v = minLength(3);
    expect(v('ab')).toEqual({ state: 'invalid', message: 'Must be at least 3 characters' });
  });

  it('minLength: passes when empty (no premature error)', () => {
    const v = minLength(3);
    expect(v('')).toEqual({ state: 'none' });
  });

  it('minLength: passes when long enough', () => {
    const v = minLength(3);
    expect(v('abc')).toEqual({ state: 'none' });
  });

  it('maxLength: fails when too long', () => {
    const v = maxLength(5);
    expect(v('abcdef')).toEqual({ state: 'invalid', message: 'Must be at most 5 characters' });
  });

  it('maxLength: passes when within limit', () => {
    const v = maxLength(5);
    expect(v('abc')).toEqual({ state: 'none' });
  });

  it('maxLengthWarning: warns when approaching limit', () => {
    const v = maxLengthWarning(8, 10);
    expect(v('12345678')).toEqual({ state: 'warning', message: '2 characters remaining' });
    expect(v('1234567890')).toEqual({ state: 'warning', message: '0 characters remaining' });
  });

  it('maxLengthWarning: none when below threshold', () => {
    const v = maxLengthWarning(8, 10);
    expect(v('1234567')).toEqual({ state: 'none' });
  });

  it('maxLengthWarning: none when above max (let maxLength validator handle it)', () => {
    const v = maxLengthWarning(8, 10);
    expect(v('12345678901')).toEqual({ state: 'none' });
  });

  it('pattern: fails when no match', () => {
    const v = pattern(/^\d+$/);
    expect(v('abc')).toEqual({ state: 'invalid', message: 'Invalid format' });
  });

  it('pattern: passes when matches', () => {
    const v = pattern(/^\d+$/);
    expect(v('123')).toEqual({ state: 'none' });
  });

  it('pattern: passes when empty', () => {
    const v = pattern(/^\d+$/);
    expect(v('')).toEqual({ state: 'none' });
  });

  it('email: validates email format', () => {
    const v = email();
    expect(v('user@example.com')).toEqual({ state: 'none' });
    expect(v('bad')).toEqual({ state: 'invalid', message: 'Invalid email address' });
    expect(v('')).toEqual({ state: 'none' });
  });

  it('showValid: marks valid when non-empty', () => {
    const v = showValid('Great!');
    expect(v('hello')).toEqual({ state: 'valid', message: 'Great!' });
    expect(v('')).toEqual({ state: 'none' });
  });
});

/* ------------------------------------------------------------------ */
/* useFormValidation hook                                              */
/* ------------------------------------------------------------------ */
describe('useFormValidation', () => {
  const fieldConfigs: Record<string, FieldConfig> = {
    name: {
      validators: [required(), minLength(2)],
    },
    email: {
      validators: [required(), email()],
    },
  };

  it('starts with none state and untouched fields', () => {
    const { result } = renderHook(() =>
      useFormValidation({ fields: fieldConfigs }),
    );
    expect(result.current.fieldStates.name.state).toBe('none');
    expect(result.current.fieldStates.name.touched).toBe(false);
    expect(result.current.fieldStates.email.state).toBe('none');
    expect(result.current.isValid).toBe(true);
  });

  it('validates a single field as invalid', async () => {
    const { result } = renderHook(() =>
      useFormValidation({ fields: fieldConfigs }),
    );

    let res: unknown;
    await act(async () => {
      res = await result.current.validateField('name', '');
    });
    expect(res).toEqual({ state: 'invalid', message: 'This field is required' });
    expect(result.current.fieldStates.name.state).toBe('invalid');
    expect(result.current.fieldStates.name.touched).toBe(true);
    expect(result.current.isValid).toBe(false);
  });

  it('validates a single field as valid (none = passes)', async () => {
    const { result } = renderHook(() =>
      useFormValidation({ fields: fieldConfigs }),
    );

    await act(async () => {
      await result.current.validateField('name', 'Alice');
    });
    expect(result.current.fieldStates.name.state).toBe('none');
    expect(result.current.fieldStates.name.touched).toBe(true);
    expect(result.current.isValid).toBe(true);
  });

  it('runs validators in order, first non-none wins', async () => {
    const { result } = renderHook(() =>
      useFormValidation({ fields: fieldConfigs }),
    );

    await act(async () => {
      await result.current.validateField('name', 'A');
    });
    // 'required' passes, 'minLength(2)' fails
    expect(result.current.fieldStates.name.state).toBe('invalid');
    expect(result.current.fieldStates.name.message).toBe('Must be at least 2 characters');
  });

  it('validateAll returns true when all fields pass', async () => {
    const { result } = renderHook(() =>
      useFormValidation({ fields: fieldConfigs }),
    );

    let valid: boolean | undefined;
    await act(async () => {
      valid = await result.current.validateAll({
        name: 'Alice',
        email: 'alice@example.com',
      });
    });
    expect(valid).toBe(true);
    expect(result.current.isValid).toBe(true);
  });

  it('validateAll returns false when any field fails', async () => {
    const { result } = renderHook(() =>
      useFormValidation({ fields: fieldConfigs }),
    );

    let valid: boolean | undefined;
    await act(async () => {
      valid = await result.current.validateAll({
        name: 'Alice',
        email: 'bad',
      });
    });
    expect(valid).toBe(false);
    expect(result.current.fieldStates.email.state).toBe('invalid');
  });

  it('clearField resets a field state', async () => {
    const { result } = renderHook(() =>
      useFormValidation({ fields: fieldConfigs }),
    );

    await act(async () => {
      await result.current.validateField('name', '');
    });
    expect(result.current.fieldStates.name.state).toBe('invalid');

    act(() => {
      result.current.clearField('name');
    });
    expect(result.current.fieldStates.name.state).toBe('none');
    expect(result.current.fieldStates.name.touched).toBe(true);
  });

  it('resetAll restores all fields to initial state', async () => {
    const { result } = renderHook(() =>
      useFormValidation({ fields: fieldConfigs }),
    );

    await act(async () => {
      await result.current.validateAll({ name: '', email: '' });
    });
    expect(result.current.fieldStates.name.state).toBe('invalid');
    expect(result.current.fieldStates.email.state).toBe('invalid');

    act(() => {
      result.current.resetAll();
    });
    expect(result.current.fieldStates.name.state).toBe('none');
    expect(result.current.fieldStates.name.touched).toBe(false);
    expect(result.current.fieldStates.email.state).toBe('none');
    expect(result.current.fieldStates.email.touched).toBe(false);
  });

  it('handles unknown field name gracefully', async () => {
    const { result } = renderHook(() =>
      useFormValidation({ fields: fieldConfigs }),
    );

    let res: unknown;
    await act(async () => {
      res = await result.current.validateField('unknown', 'val');
    });
    expect(res).toEqual({ state: 'none' });
  });

  it('supports async validators', async () => {
    const asyncValidator = vi.fn(async (value: string) => {
      if (value === 'taken') {
        return { state: 'invalid' as const, message: 'Already taken' };
      }
      return { state: 'none' as const };
    });

    const { result } = renderHook(() =>
      useFormValidation({
        fields: {
          username: { validators: [required(), asyncValidator] },
        },
      }),
    );

    await act(async () => {
      await result.current.validateField('username', 'taken');
    });
    expect(result.current.fieldStates.username.state).toBe('invalid');
    expect(result.current.fieldStates.username.message).toBe('Already taken');

    await act(async () => {
      await result.current.validateField('username', 'available');
    });
    expect(result.current.fieldStates.username.state).toBe('none');
  });
});
