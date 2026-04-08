import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Tooltip } from '../src/components/Tooltip.js';

describe('Tooltip', () => {
  it('renders children', () => {
    render(<Tooltip label="Help text">Hover me</Tooltip>);
    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('renders tooltip label text', () => {
    render(<Tooltip label="Help text">Trigger</Tooltip>);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Help text');
  });

  it('tooltip is hidden by default (opacity-0)', () => {
    render(<Tooltip label="Info">Trigger</Tooltip>);
    expect(screen.getByRole('tooltip').className).toContain('opacity-0');
  });

  it('applies top placement by default', () => {
    render(<Tooltip label="Info">Trigger</Tooltip>);
    expect(screen.getByRole('tooltip').className).toContain('bottom-full');
  });

  it('applies bottom placement', () => {
    render(<Tooltip label="Info" placement="bottom">Trigger</Tooltip>);
    expect(screen.getByRole('tooltip').className).toContain('top-full');
  });

  it('applies left placement', () => {
    render(<Tooltip label="Info" placement="left">Trigger</Tooltip>);
    expect(screen.getByRole('tooltip').className).toContain('right-full');
  });

  it('applies right placement', () => {
    render(<Tooltip label="Info" placement="right">Trigger</Tooltip>);
    expect(screen.getByRole('tooltip').className).toContain('left-full');
  });
});
