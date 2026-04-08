import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from '../src/components/Spinner.js';

describe('Spinner', () => {
  it('renders an SVG with status role', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has accessible label', () => {
    render(<Spinner />);
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });

  it('applies default size of 20', () => {
    render(<Spinner />);
    const svg = screen.getByRole('status');
    expect(svg).toHaveAttribute('width', '20');
    expect(svg).toHaveAttribute('height', '20');
  });

  it('accepts custom size', () => {
    render(<Spinner size={32} />);
    const svg = screen.getByRole('status');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('has spin animation class', () => {
    render(<Spinner />);
    expect(screen.getByRole('status').getAttribute('class')).toContain('animate-spin');
  });
});
