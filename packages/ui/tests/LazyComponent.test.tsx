import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { createLazyComponent, LoadingFallback } from '../src/performance/lazy-component.js';

describe('createLazyComponent', () => {
  it('creates a lazy component that can be rendered with Suspense', async () => {
    const TestComp: React.FC<{ label: string }> = ({ label }) =>
      React.createElement('div', { 'data-testid': 'lazy' }, label);

    const { Component } = createLazyComponent(() =>
      Promise.resolve({ default: TestComp as React.ComponentType<Record<string, unknown>> }),
    );

    render(
      React.createElement(
        React.Suspense,
        { fallback: React.createElement('div', null, 'loading') },
        React.createElement(Component, { label: 'Hello' }),
      ),
    );

    await waitFor(() => {
      expect(screen.getByTestId('lazy')).toBeDefined();
    });
    expect(screen.getByTestId('lazy').textContent).toBe('Hello');
  });

  it('retries on import failure', async () => {
    let attempt = 0;
    const Comp: React.FC = () => React.createElement('span', null, 'ok');

    const { Component } = createLazyComponent(
      () => {
        attempt++;
        if (attempt < 2) return Promise.reject(new Error('network'));
        return Promise.resolve({ default: Comp as React.ComponentType<Record<string, unknown>> });
      },
      { retries: 2, retryDelay: 10 },
    );

    render(
      React.createElement(
        React.Suspense,
        { fallback: React.createElement('div', null, 'loading') },
        React.createElement(Component),
      ),
    );

    await waitFor(() => {
      expect(screen.getByText('ok')).toBeDefined();
    });
    expect(attempt).toBe(2);
  });

  it('prefetch() triggers the import eagerly', async () => {
    const loader = vi.fn(() =>
      Promise.resolve({
        default: (() => null) as unknown as React.ComponentType<Record<string, unknown>>,
      }),
    );

    const { prefetch } = createLazyComponent(loader);

    await prefetch();
    expect(loader).toHaveBeenCalledTimes(1);

    // Second call should not re-trigger
    await prefetch();
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('supports preload option', async () => {
    const loader = vi.fn(() =>
      Promise.resolve({
        default: (() => null) as unknown as React.ComponentType<Record<string, unknown>>,
      }),
    );

    createLazyComponent(loader, { preload: true });

    // Give the microtask queue time to run
    await new Promise((r) => setTimeout(r, 10));
    expect(loader).toHaveBeenCalledTimes(1);
  });
});

describe('LoadingFallback', () => {
  it('renders default loading message', () => {
    render(React.createElement(LoadingFallback));
    expect(screen.getByRole('status').textContent).toBe('Loading…');
  });

  it('renders custom loading message', () => {
    render(React.createElement(LoadingFallback, { message: 'Please wait' }));
    expect(screen.getByRole('status').textContent).toBe('Please wait');
  });
});
