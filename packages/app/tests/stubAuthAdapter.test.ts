/**
 * Tests for the stub auth adapter used in dev mode.
 */
import { describe, it, expect } from 'vitest';
import { stubAuthAdapter } from '../src/dev/stubAuthAdapter.js';

describe('stubAuthAdapter', () => {
  it('login returns a dev user regardless of credentials', async () => {
    const user = await stubAuthAdapter.login({ email: 'any@example.com', password: 'pw' });
    expect(user).toEqual({
      id: 'dev-user-1',
      email: 'dev@crewspace.local',
      name: 'Dev User',
      role: 'owner',
    });
  });

  it('logout resolves without error', async () => {
    await expect(stubAuthAdapter.logout()).resolves.toBeUndefined();
  });

  it('refreshSession returns the same dev user', async () => {
    const user = await stubAuthAdapter.refreshSession();
    expect(user.id).toBe('dev-user-1');
    expect(user.email).toBe('dev@crewspace.local');
  });
});
