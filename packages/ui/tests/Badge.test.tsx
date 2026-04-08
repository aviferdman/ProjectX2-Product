import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../src/components/Badge.js';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies default variant styles', () => {
    const { container } = render(<Badge>D</Badge>);
    expect(container.firstElementChild?.className).toContain('bg-surface-elevated');
  });

  it('applies brand variant', () => {
    const { container } = render(<Badge variant="brand">B</Badge>);
    expect(container.firstElementChild?.className).toContain('text-violet-300');
  });

  it('applies success variant', () => {
    const { container } = render(<Badge variant="success">S</Badge>);
    expect(container.firstElementChild?.className).toContain('text-emerald-300');
  });

  it('applies warning variant', () => {
    const { container } = render(<Badge variant="warning">W</Badge>);
    expect(container.firstElementChild?.className).toContain('text-amber-300');
  });

  it('applies error variant', () => {
    const { container } = render(<Badge variant="error">E</Badge>);
    expect(container.firstElementChild?.className).toContain('text-rose-300');
  });

  it('applies info variant', () => {
    const { container } = render(<Badge variant="info">I</Badge>);
    expect(container.firstElementChild?.className).toContain('text-sky-300');
  });

  it('is rendered as a span', () => {
    render(<Badge>Tag</Badge>);
    const el = screen.getByText('Tag');
    expect(el.tagName).toBe('SPAN');
  });
});
