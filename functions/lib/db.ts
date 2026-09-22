import type { D1Database } from './d1';

export interface UserRow {
  id: string;
  email: string;
  pw_hash: string;
  pw_salt: string;
  iterations: number;
  role: string;
  created_at: string;
}

export interface SessionRow {
  token_hash: string;
  user_id: string;
  expires_at: string;
}

export interface RunRow {
  user_id: string;
  data: string;
  updated_at: string;
}

const NOW = () => new Date().toISOString();

export async function findUserByEmail(db: D1Database, email: string): Promise<UserRow | null> {
  return db
    .prepare('SELECT id, email, pw_hash, pw_salt, iterations, role, created_at FROM users WHERE email = ?')
    .bind(email)
    .first<UserRow>();
}

export async function findUserById(db: D1Database, id: string): Promise<UserRow | null> {
  return db
    .prepare('SELECT id, email, pw_hash, pw_salt, iterations, role, created_at FROM users WHERE id = ?')
    .bind(id)
    .first<UserRow>();
}

export async function createUser(
  db: D1Database,
  user: { id: string; email: string; pwHash: string; pwSalt: string; iterations: number; role?: string },
): Promise<boolean> {
  const res = await db
    .prepare('INSERT INTO users (id, email, pw_hash, pw_salt, iterations, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(user.id, user.email, user.pwHash, user.pwSalt, user.iterations, user.role ?? 'user', NOW())
    .run();
  return res.meta.changes === 1;
}

export async function setUserRole(db: D1Database, email: string, role: 'admin' | 'user'): Promise<boolean> {
  const res = await db.prepare('UPDATE users SET role = ? WHERE email = ?').bind(role, email).run();
  return res.meta.changes === 1;
}

export async function deleteSessionsForUser(db: D1Database, userId: string): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();
}

export async function createSession(
  db: D1Database,
  session: { tokenHash: string; userId: string; expiresAt: string },
): Promise<boolean> {
  const res = await db
    .prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .bind(session.tokenHash, session.userId, NOW(), session.expiresAt)
    .run();
  return res.meta.changes === 1;
}

export async function deleteSession(db: D1Database, tokenHash: string): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
}

export async function getUserForSession(db: D1Database, tokenHash: string): Promise<UserRow | null> {
  const row = await db
    .prepare(
      `SELECT u.id, u.email, u.pw_hash, u.pw_salt, u.iterations, u.role, u.created_at
         FROM sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .bind(tokenHash, NOW())
    .first<UserRow>();
  return row ?? null;
}

export async function getRun(db: D1Database, userId: string): Promise<RunRow | null> {
  return db
    .prepare('SELECT user_id, data, updated_at FROM runs WHERE user_id = ?')
    .bind(userId)
    .first<RunRow>();
}

export async function putRun(
  db: D1Database,
  userId: string,
  data: string,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO runs (user_id, data, updated_at) VALUES (?, ?, ?)
       ON CONFLICT (user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
    )
    .bind(userId, data, NOW())
    .run();
}

export const LOGIN_WINDOW_MINUTES = 15;
export const LOGIN_MAX_FAILURES = 10;

export interface LoginLock {
  locked: boolean;
  retryAfterSeconds: number;
}

/**
 * Failed-login backoff: once LOGIN_MAX_FAILURES attempts for an email have
 * landed inside the rolling LOGIN_WINDOW_MINUTES, sign-in is refused until
 * that first attempt ages out of the window. Anti-enumeration friendly: it
 * works for unknown emails too, and a locked account stays locked even with
 * the correct password until the window slides.
 */
export async function loginLock(db: D1Database, email: string): Promise<LoginLock> {
  const cutoff = new Date(Date.now() - LOGIN_WINDOW_MINUTES * 60 * 1000).toISOString();
  const res = await db
    .prepare('SELECT attempted_at FROM login_attempts WHERE email = ? AND attempted_at > ? ORDER BY attempted_at ASC')
    .bind(email, cutoff)
    .all<{ attempted_at: string }>();
  const attempts = res.results ?? [];
  if (attempts.length < LOGIN_MAX_FAILURES) return { locked: false, retryAfterSeconds: 0 };
  const firstAt = new Date(attempts[0].attempted_at).getTime();
  const lockUntil = firstAt + LOGIN_WINDOW_MINUTES * 60 * 1000;
  return { locked: true, retryAfterSeconds: Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000)) };
}

export async function recordFailedLogin(db: D1Database, email: string): Promise<void> {
  await db.prepare('INSERT INTO login_attempts (email, attempted_at) VALUES (?, ?)').bind(email, NOW()).run();
  // Opportunistic pruning keeps the table lean (one-hour retention).
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  await db.prepare('DELETE FROM login_attempts WHERE attempted_at < ?').bind(cutoff).run();
}

export async function clearFailedLogins(db: D1Database, email: string): Promise<void> {
  await db.prepare('DELETE FROM login_attempts WHERE email = ?').bind(email).run();
}

export async function updatePasswordHash(
  db: D1Database,
  userId: string,
  pwHash: string,
  pwSalt: string,
  iterations: number,
): Promise<void> {
  await db
    .prepare('UPDATE users SET pw_hash = ?, pw_salt = ?, iterations = ? WHERE id = ?')
    .bind(pwHash, pwSalt, iterations, userId)
    .run();
}

export async function insertRecoveryCode(db: D1Database, userId: string, codeHash: string): Promise<void> {
  await db.prepare('INSERT INTO recovery_codes (user_id, code_hash, used_at) VALUES (?, ?, NULL)').bind(userId, codeHash).run();
}

export async function revokeRecoveryCodes(db: D1Database, userId: string): Promise<void> {
  await db.prepare('DELETE FROM recovery_codes WHERE user_id = ?').bind(userId).run();
}

export async function unusedRecoveryCodeCount(db: D1Database, userId: string): Promise<number> {
  const res = await db
    .prepare('SELECT COUNT(*) AS n FROM recovery_codes WHERE user_id = ? AND used_at IS NULL')
    .bind(userId)
    .first<{ n: number }>();
  return Number(res?.n ?? 0);
}

/** True if the digest matches an unused code for this user. */
export async function isUnusedRecoveryCode(db: D1Database, userId: string, codeHash: string): Promise<boolean> {
  const row = await db
    .prepare('SELECT user_id FROM recovery_codes WHERE user_id = ? AND code_hash = ? AND used_at IS NULL')
    .bind(userId, codeHash)
    .first();
  return row !== null;
}

export async function useRecoveryCode(db: D1Database, userId: string, codeHash: string): Promise<void> {
  await db.prepare('UPDATE recovery_codes SET used_at = ? WHERE user_id = ? AND code_hash = ?').bind(NOW(), userId, codeHash).run();
}

export async function createPasswordReset(db: D1Database, userId: string, tokenHash: string, expiresAt: string): Promise<void> {
  await db.prepare('INSERT INTO password_resets (token_hash, user_id, created_at, expires_at, used_at) VALUES (?, ?, ?, ?, NULL)').bind(tokenHash, userId, NOW(), expiresAt).run();
}

export async function deletePasswordResetsForUser(db: D1Database, userId: string): Promise<void> {
  await db.prepare('DELETE FROM password_resets WHERE user_id = ?').bind(userId).run();
}

/** Validates a reset token: exists, unused, not expired. Returns the user if usable. */
export async function findUserForPasswordReset(db: D1Database, tokenHash: string): Promise<UserRow | null> {
  const row = await db
    .prepare(
      `SELECT u.id, u.email, u.pw_hash, u.pw_salt, u.iterations, u.role, u.created_at
         FROM password_resets r
         JOIN users u ON u.id = r.user_id
        WHERE r.token_hash = ? AND r.used_at IS NULL AND r.expires_at > ?`,
    )
    .bind(tokenHash, NOW())
    .first<UserRow>();
  return row ?? null;
}

export async function consumePasswordReset(db: D1Database, tokenHash: string): Promise<void> {
  await db.prepare('UPDATE password_resets SET used_at = ? WHERE token_hash = ?').bind(NOW(), tokenHash).run();
}

/* ── Hosted-inference credit meter (authoritative, server-side) ─────────────
 * Protects the admin-owned Workers AI surface against jacking. Enforced in
 * /api/llm: per-account daily cap + per-minute burst, recorded atomically in
 * D1. Rows are keyed (account_id, UTC day). credit_overrides lets an admin
 * raise a specific account's daily cap later — the monetization knob.
 */
export const METER_DAILY_CAP = 100;
export const METER_BURST_LIMIT = 8;
export const METER_BURST_WINDOW_SECONDS = 60;

export interface MeterCheck {
  allowed: boolean;
  kind?: 'daily' | 'burst';
  remaining: number;
}

export async function meterCheckAndCharge(
  db: D1Database,
  accountId: string,
  cost = 1,
): Promise<MeterCheck> {
  const now = Math.floor(Date.now() / 1000);
  const day = new Date().toISOString().slice(0, 10);
  const window = Math.floor(now / METER_BURST_WINDOW_SECONDS);

  const override = await db
    .prepare('SELECT daily_cap FROM credit_overrides WHERE account_id = ?')
    .bind(accountId)
    .first<{ daily_cap: number }>();
  const cap = Number(override?.daily_cap ?? METER_DAILY_CAP);

  const row = await db
    .prepare('SELECT credits, burst_at, burst_count FROM meter WHERE account_id = ? AND day = ?')
    .bind(accountId, day)
    .first<{ credits: number; burst_at: number; burst_count: number }>();

  const credits = Number(row?.credits ?? 0);
  const burstAt = Number(row?.burst_at ?? 0);
  const burstCount = Number(row?.burst_count ?? 0);

  if (credits + cost > cap) return { allowed: false, kind: 'daily', remaining: 0 };
  if (burstAt === window && burstCount >= METER_BURST_LIMIT) {
    return { allowed: false, kind: 'burst', remaining: Math.max(0, cap - credits) };
  }

  const nextBurstCount = burstAt === window ? burstCount + 1 : 1;
  await db
    .prepare(
      `INSERT INTO meter (account_id, day, credits, calls, burst_at, burst_count)
       VALUES (?, ?, ?, 1, ?, ?)
       ON CONFLICT (account_id, day) DO UPDATE SET
         credits = meter.credits + excluded.credits,
         calls = meter.calls + excluded.calls,
         burst_at = excluded.burst_at,
         burst_count = excluded.burst_count`,
    )
    .bind(accountId, day, cost, window, nextBurstCount)
    .run();

  const newCredits = credits + cost;
  return { allowed: true, remaining: Math.max(0, cap - newCredits) };
}