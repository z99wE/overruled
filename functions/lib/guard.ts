import type { D1Database, AppEnv } from './d1';
import { getUserForSession } from './db';
import type { UserRow } from './db';
import { SESSION_COOKIE, parseCookies, sha256Hex } from './auth';

export interface SessionContext {
  env: AppEnv;
  user: UserRow | null;
}

/** Resolves the authenticated user (if any) from the request cookie. Never throws. */
export async function getSessionUser(
  env: AppEnv,
  cookieHeader: string | null,
): Promise<UserRow | null> {
  const token = parseCookies(cookieHeader).get(SESSION_COOKIE);
  if (!token) return null;
  try {
    const tokenHash = await sha256Hex(token);
    return await getUserForSession(env.DB, tokenHash);
  } catch {
    return null;
  }
}

export async function withSession(db: D1Database, cookieHeader: string | null): Promise<SessionContext> {
  const user = await getSessionUser({ DB: db }, cookieHeader);
  return { env: { DB: db }, user };
}