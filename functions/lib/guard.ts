import { SESSION_COOKIE, parseCookies, sha256Hex } from './auth';
import { getUserForSession } from './db';
import type { D1Database } from './d1';
import type { UserRow } from './db';
import type { AppEnv } from './d1';

export interface SessionContext {
  env: AppEnv;
  user: UserRow | null;
}

/** Preferred auth credential for this deployment. */
const AUTH_HEADER = 'authorization';
const BEARER_PREFIX = 'bearer ';

/**
 * Extracts the session token from a request, preferring the `Authorization:
 * Bearer` header (native shells — Tauri/Capacitor webviews have no cookie jar,
 * so the shell persists the token and replays it as a bearer) and falling back
 * to the `__Host-overrool_session` cookie (the browser path). Never throws.
 */
export function getSessionToken(request: { headers: Headers }): string | null {
  void SESSION_COOKIE; // SESSION_COOKIE is used by parseCookies path below.
  const authorization = request.headers.get(AUTH_HEADER);
  if (authorization?.toLowerCase().startsWith(BEARER_PREFIX)) {
    const token = authorization.slice(BEARER_PREFIX.length).trim();
    if (token) return token;
  }
  return parseCookies(request.headers.get('cookie')).get(SESSION_COOKIE) ?? null;
}

/**
 * Resolves the authenticated user (if any) from the request — reading the
 * session token from either the Authorization bearer header or the cookie.
 * Never throws.
 */
export async function getSessionUser(env: AppEnv, request: { headers: Headers }): Promise<UserRow | null> {
  const token = getSessionToken(request);
  if (!token) return null;
  try {
    const tokenHash = await sha256Hex(token);
    return await getUserForSession(env.DB, tokenHash);
  } catch {
    return null;
  }
}

/** Back-compat: cookie-only resolution for tests/callers that have the header string. */
export async function getSessionUserFromCookieHeader(env: AppEnv, cookieHeader: string | null): Promise<UserRow | null> {
  return getSessionUser(env, { headers: new Headers(cookieHeader ? { cookie: cookieHeader } : {}) });
}

export async function withSession(db: D1Database, cookieHeader: string | null): Promise<SessionContext> {
  const user = await getSessionUserFromCookieHeader({ DB: db }, cookieHeader);
  return { env: { DB: db }, user };
}
