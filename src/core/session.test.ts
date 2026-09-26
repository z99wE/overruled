/**
 * Tests for session.ts — previously at 0% coverage.
 * The web path (non-native) simply returns null/no-ops from all methods since
 * the secure ring isn't available. These tests validate the graceful fallback.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock @capacitor/core to simulate web (non-native) environment
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
}));

describe('session.ts — web (non-native) path', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('persistSessionToken resolves without throwing on web', async () => {
    const { persistSessionToken } = await import('./session');
    await expect(persistSessionToken('test-token')).resolves.toBeUndefined();
  });

  it('loadSessionToken returns null on web (no secure ring)', async () => {
    const { loadSessionToken } = await import('./session');
    const token = await loadSessionToken();
    expect(token).toBeNull();
  });

  it('clearSessionToken resolves without throwing on web', async () => {
    const { clearSessionToken } = await import('./session');
    await expect(clearSessionToken()).resolves.toBeUndefined();
  });

  it('authHeaders returns null on web when no token is stored', async () => {
    const { authHeaders } = await import('./session');
    const headers = await authHeaders();
    expect(headers).toBeNull();
  });
});
