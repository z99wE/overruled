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