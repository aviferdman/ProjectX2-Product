import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardBody } from '../src/components/Card.js';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies default padding (md)', () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.firstElementChild?.className).toContain('p-4');
  });

  it('applies no padding', () => {
    const { container } = render(<Card padding="none">Content</Card>);
    expect(container.firstElementChild?.className).not.toContain('p-4');
  });

  it('applies hover styles when hoverable', () => {
    const { container } = render(<Card hoverable>Content</Card>);
    expect(container.firstElementChild?.className).toContain('hover:shadow-node-hover');
  });

  it('does not apply hover styles by default', () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.firstElementChild?.className).not.toContain('hover:shadow-node-hover');
  });

  it('merges custom className', () => {
    const { container } = render(<Card className="my-class">C</Card>);
    expect(container.firstElementChild?.className).toContain('my-class');
  });
});

describe('CardHeader', () => {
  it('renders header content', () => {
    render(<CardHeader>Header</CardHeader>);
    expect(screen.getByText('Header')).toBeInTheDocument();
  });

  it('has bottom border', () => {
    const { container } = render(<CardHeader>H</CardHeader>);
    expect(container.firstElementChild?.className).toContain('border-b');
  });
});

describe('CardBody', () => {
  it('renders body content', () => {
    render(<CardBody>Body</CardBody>);
    expect(screen.getByText('Body')).toBeInTheDocument();
  });
});
