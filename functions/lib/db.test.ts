// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { makeFakeDb } from './d1-fake';
import { clearFailedLogins, loginLock, LOGIN_WINDOW_MINUTES, meterCheckAndCharge, METER_BURST_LIMIT, recordFailedLogin } from './db';

const EMAIL = 'deputy@example.com';
const MIN = 60 * 1000;

describe('login backoff helpers', () => {
  it('starts unlocked and records attempts', async () => {
    const { db } = makeFakeDb();
    expect(await loginLock(db, EMAIL)).toEqual({ locked: false, retryAfterSeconds: 0 });
    await recordFailedLogin(db, EMAIL);
    await recordFailedLogin(db, EMAIL);
    const lock = await loginLock(db, EMAIL);
    expect(lock.locked).toBe(false);
  });

  it('locks once LOGIN_MAX_FAILURES attempts land inside the window', async () => {
    const { db } = makeFakeDb();
    const recent = new Date(Date.now() - 1 * MIN).toISOString();
    // Seed one under the threshold.
    for (let i = 0; i < 9; i++) {
      await db.prepare('INSERT INTO login_attempts (email, attempted_at) VALUES (?, ?)').bind(EMAIL, recent).run();
    }
    expect(await loginLock(db, EMAIL)).toEqual({ locked: false, retryAfterSeconds: 0 });

    // Tenth lands at the threshold → locked until the first attempt ages out.
    await db.prepare('INSERT INTO login_attempts (email, attempted_at) VALUES (?, ?)').bind(EMAIL, recent).run();
    const lock = await loginLock(db, EMAIL);
    expect(lock.locked).toBe(true);
    // Oldest attempt is ~1min old, window is LOGIN_WINDOW_MINUTES → roughly (window-1) minutes remain.
    expect(lock.retryAfterSeconds).toBeGreaterThan(LOGIN_WINDOW_MINUTES * 60 - 120);
    expect(lock.retryAfterSeconds).toBeLessThanOrEqual(LOGIN_WINDOW_MINUTES * 60);
  });

  it('ignores attempts older than the window', async () => {
    const { db } = makeFakeDb();
    const old = new Date(Date.now() - (LOGIN_WINDOW_MINUTES + 5) * MIN).toISOString();
    for (let i = 0; i < 12; i++) {
      await db.prepare('INSERT INTO login_attempts (email, attempted_at) VALUES (?, ?)').bind(EMAIL, old).run();
    }
    expect(await loginLock(db, EMAIL)).toEqual({ locked: false, retryAfterSeconds: 0 });
  });

  it('clearFailedLogins resets the counter', async () => {
    const { db } = makeFakeDb();
    const recent = new Date(Date.now() - 1 * MIN).toISOString();
    for (let i = 0; i < 10; i++) {
      await db.prepare('INSERT INTO login_attempts (email, attempted_at) VALUES (?, ?)').bind(EMAIL, recent).run();
    }
    expect((await loginLock(db, EMAIL)).locked).toBe(true);
    await clearFailedLogins(db, EMAIL);
    expect(await loginLock(db, EMAIL)).toEqual({ locked: false, retryAfterSeconds: 0 });
  });
});

describe('hosted-inference credit meter', () => {
  it('allows charged calls up to the cap and then refuses daily', async () => {
    const { db, setOverride } = makeFakeDb();
    setOverride('u-1', 5);
    for (let i = 0; i < 5; i++) {
      const ok = await meterCheckAndCharge(db, 'u-1', 1);
      expect(ok.allowed).toBe(true);
    }
    const capped = await meterCheckAndCharge(db, 'u-1', 1);
    expect(capped.allowed).toBe(false);
    expect(capped.kind).toBe('daily');
  });

  it('enforces a per-minute burst limit regardless of the daily cap', async () => {
    const { db, setOverride } = makeFakeDb();
    setOverride('u-2', 10_000);
    for (let i = 0; i < METER_BURST_LIMIT; i++) {
      expect((await meterCheckAndCharge(db, 'u-2', 1)).allowed).toBe(true);
    }
    const burst = await meterCheckAndCharge(db, 'u-2', 1);
    expect(burst.allowed).toBe(false);
    expect(burst.kind).toBe('burst');
  });

  it('falls back to the default cap when no override exists', async () => {
    const { db } = makeFakeDb();
    const first = await meterCheckAndCharge(db, 'u-3', 1);
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(99);
  });
});