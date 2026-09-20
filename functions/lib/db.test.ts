// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { makeFakeDb } from './d1-fake';
import {
  createSession,
  createUser,
  deleteSession,
  deleteSessionsForUser,
  findUserByEmail,
  getUserForSession,
  putRun,
  getRun,
} from './db';

const USER = {
  id: 'u-1',
  email: 'counsel@example.com',
  pwHash: '0'.repeat(64),
  pwSalt: '1'.repeat(32),
  iterations: 210_000,
};

describe('db layer', () => {
  it('creates users and finds them by email', async () => {
    const { db } = makeFakeDb();
    await createUser(db, USER);
    expect((await findUserByEmail(db, 'counsel@example.com'))?.id).toBe('u-1');
    expect(await findUserByEmail(db, 'missing@example.com')).toBeNull();
  });

  it('creates, reads, rotates, and invalidates sessions', async () => {
    const { db, counts } = makeFakeDb();
    await createUser(db, USER);
    await createSession(db, { tokenHash: 'h1', userId: 'u-1', expiresAt: '2999-01-01T00:00:00Z' });
    expect(await getUserForSession(db, 'h1')).toMatchObject({ email: 'counsel@example.com' });

    await deleteSessionsForUser(db, 'u-1');
    expect(counts().sessions).toBe(0);

    await createSession(db, { tokenHash: 'h2', userId: 'u-1', expiresAt: '2999-01-01T00:00:00Z' });
    await deleteSession(db, 'h2');
    expect(await getUserForSession(db, 'h2')).toBeNull();
  });

  it('rejects expired sessions', async () => {
    const { db } = makeFakeDb();
    await createUser(db, USER);
    await createSession(db, { tokenHash: 'expired', userId: 'u-1', expiresAt: '2000-01-01T00:00:00Z' });
    expect(await getUserForSession(db, 'expired')).toBeNull();
  });

  it('upserts and reads account runs', async () => {
    const { db, counts } = makeFakeDb();
    await putRun(db, 'u-1', '{"chips": 5}');
    expect((await getRun(db, 'u-1'))?.data).toBe('{"chips": 5}');
    await putRun(db, 'u-1', '{"chips": 9}');
    expect((await getRun(db, 'u-1'))?.data).toBe('{"chips": 9}');
    expect(counts().runs).toBe(1);
    expect(await getRun(db, 'nobody')).toBeNull();
  });
});