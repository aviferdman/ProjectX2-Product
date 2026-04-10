/**
 * AppContext (store) tests.
 * TASK-131: Verifies global state management actions.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import React from 'react';
import { AppProvider, useAppStore } from '../src/store/index.js';
import { _resetNotificationCounter } from '../src/store/AppContext.js';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

type StoreCtx = ReturnType<typeof useAppStore>;

function StoreConsumer({ onRender }: { onRender: (ctx: StoreCtx) => void }) {
  const ctx = useAppStore();
  onRender(ctx);
  return null;
}

function renderWithStore(overrides?: Parameters<typeof AppProvider>[0]['initialState']) {
  let captured!: StoreCtx;
  const consumer = React.createElement(StoreConsumer, {
    onRender: (ctx) => {
      captured = ctx;
    },
  });
  const result = render(
    React.createElement(AppProvider, { initialState: overrides }, consumer),
  );
  return { ...result, getContext: () => captured };
}

/* ------------------------------------------------------------------ */
/* Tests                                                               */
/* ------------------------------------------------------------------ */

describe('AppContext', () => {
  beforeEach(() => {
    _resetNotificationCounter();
  });

  it('provides default initial state', () => {
    const { getContext } = renderWithStore();

    expect(getContext().sidebarMode).toBe('expanded');
    expect(getContext().theme).toBe('light');
    expect(getContext().notifications).toEqual([]);
    expect(getContext().activeWorkflowId).toBeNull();
  });

  it('accepts partial initial state overrides', () => {
    const { getContext } = renderWithStore({ theme: 'dark', sidebarMode: 'collapsed' });

    expect(getContext().theme).toBe('dark');
    expect(getContext().sidebarMode).toBe('collapsed');
  });

  it('sets sidebar mode', () => {
    const { getContext } = renderWithStore();

    act(() => getContext().setSidebarMode('collapsed'));
    expect(getContext().sidebarMode).toBe('collapsed');

    act(() => getContext().setSidebarMode('hidden'));
    expect(getContext().sidebarMode).toBe('hidden');
  });

  it('sets theme', () => {
    const { getContext } = renderWithStore();

    act(() => getContext().setTheme('dark'));
    expect(getContext().theme).toBe('dark');

    act(() => getContext().setTheme('light'));
    expect(getContext().theme).toBe('light');
  });

  it('adds and dismisses notifications', () => {
    const { getContext } = renderWithStore();

    act(() => getContext().addNotification('Hello', 'info'));
    expect(getContext().notifications).toHaveLength(1);
    expect(getContext().notifications[0]!.message).toBe('Hello');
    expect(getContext().notifications[0]!.level).toBe('info');
    expect(getContext().notifications[0]!.dismissed).toBe(false);

    const id = getContext().notifications[0]!.id;
    act(() => getContext().dismissNotification(id));
    expect(getContext().notifications[0]!.dismissed).toBe(true);
  });

  it('clears all notifications', () => {
    const { getContext } = renderWithStore();

    act(() => {
      getContext().addNotification('A', 'info');
      getContext().addNotification('B', 'warning');
    });
    expect(getContext().notifications.length).toBeGreaterThanOrEqual(1);

    act(() => getContext().clearNotifications());
    expect(getContext().notifications).toEqual([]);
  });

  it('sets active workflow', () => {
    const { getContext } = renderWithStore();

    act(() => getContext().setActiveWorkflow('wf-42'));
    expect(getContext().activeWorkflowId).toBe('wf-42');

    act(() => getContext().setActiveWorkflow(null));
    expect(getContext().activeWorkflowId).toBeNull();
  });

  it('throws when useAppStore is called outside AppProvider', () => {
    function Orphan() {
      useAppStore();
      return null;
    }

    expect(() => render(React.createElement(Orphan))).toThrow(
      'useAppStore must be used within an <AppProvider>',
    );
  });
});
