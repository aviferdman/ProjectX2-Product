import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from '../src/components/Input.js';

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('renders a label when provided', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('shows error message and sets aria-invalid', () => {
    render(<Input label="Name" error="Required field" />);
    const input = screen.getByLabelText('Name');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Required field');
  });

  it('shows helper text when no error', () => {
    render(<Input label="Username" helperText="Choose a unique name" />);
    expect(screen.getByText('Choose a unique name')).toBeInTheDocument();
  });

  it('hides helper text when error is present', () => {
    render(
      <Input label="Username" helperText="Choose a unique name" error="Taken" />,
    );
    expect(screen.queryByText('Choose a unique name')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Taken');
  });

  it('applies error border styles', () => {
    render(<Input label="Field" error="Bad" />);
    const input = screen.getByLabelText('Field');
    expect(input.className).toContain('border-status-error');
  });

  it('is disabled when disabled prop is set', () => {
    render(<Input disabled placeholder="disabled" />);
    expect(screen.getByPlaceholderText('disabled')).toBeDisabled();
  });

  it('forwards ref', () => {
    let inputEl: HTMLInputElement | null = null;
    render(<Input ref={(el) => { inputEl = el; }} />);
    expect(inputEl).toBeInstanceOf(HTMLInputElement);
  });
});
