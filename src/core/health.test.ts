/**
 * Tests for health.ts — previously at 0% coverage.
 * health.ts provides the runtime readiness probe and is 26 lines of pure logic.
 */
import { describe, expect, it } from 'vitest';
import { reportHealth, bootHealth } from './health';

describe('reportHealth', () => {
  it('sets ready=true when all checks pass', () => {
    const status = reportHealth({ storage: true, transport: true });
    expect(status.ready).toBe(true);
    expect(status.checks).toEqual({ storage: true, transport: true });
  });

  it('sets ready=false when any check fails', () => {
    const status = reportHealth({ storage: true, transport: false });
    expect(status.ready).toBe(false);
  });

  it('sets ready=true for an empty checks object', () => {
    // every() on an empty array returns true
    const status = reportHealth({});
    expect(status.ready).toBe(true);
  });

  it('includes a checkedAt timestamp', () => {
    const before = Date.now();
    const status = reportHealth({ ok: true });
    const after = Date.now();
    expect(status.checkedAt).toBeGreaterThanOrEqual(before);
    expect(status.checkedAt).toBeLessThanOrEqual(after);
  });
});

describe('bootHealth', () => {
  it('returns a HealthStatus with the standard three checks', () => {
    const status = bootHealth();
    expect(typeof status.ready).toBe('boolean');
    expect('storage' in status.checks).toBe(true);
    expect('register' in status.checks).toBe(true);
    expect('transport' in status.checks).toBe(true);
  });

  it('reports storage=true in jsdom (localStorage is available)', () => {
    const status = bootHealth();
    expect(status.checks.storage).toBe(true);
  });

  it('does not throw when called multiple times', () => {
    expect(() => {
      bootHealth();
      bootHealth();
    }).not.toThrow();
  });
});
