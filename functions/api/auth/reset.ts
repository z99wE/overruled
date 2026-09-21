import { json, readJson, methodNotAllowed } from '../../lib/http';
import {
  buildSessionCookie,
  createSessionToken,
  hashPassword,
  isValidPassword,
  sha256Hex,
} from '../../lib/auth';
import {
  consumePasswordReset,
  createSession,
  deletePasswordResetsForUser,
  deleteSessionsForUser,
  findUserForPasswordReset,
  updatePasswordHash,
} from '../../lib/db';
import type { AppEnv } from '../../lib/d1';

/**
 * Consumes a reset token and sets a new password. Succeeds only when the token
 * is present, unused, and inside its 30-minute window; signs the user in with a
 * fresh session and invalidates every other session for the account.
 */
export async function onRequestPost(context: { request: Request; env: AppEnv }): Promise<Response> {
  const body = await readJson(context.request);
  const token = body && typeof body.token === 'string' ? body.token.trim() : '';
  const password = body && typeof body.password === 'string' ? body.password : '';

  if (!token || !password) {
    return json({ error: 'Missing reset token or password.' }, 400);
  }
  const passwordCheck = isValidPassword(password);
  if (!passwordCheck.ok) {
    return json({ error: passwordCheck.reason }, 400);
  }

  const tokenHash = await sha256Hex(token);
  const user = await findUserForPasswordReset(context.env.DB, tokenHash);
  if (!user) {
    return json({ error: 'This reset link is invalid or has expired.' }, 400);
  }

  const hashed = await hashPassword(password);
  await updatePasswordHash(context.env.DB, user.id, hashed.hash, hashed.salt, hashed.iterations);
  await consumePasswordReset(context.env.DB, tokenHash);
  await deletePasswordResetsForUser(context.env.DB, user.id);
  await deleteSessionsForUser(context.env.DB, user.id);

  const { token: sessionToken, tokenHash: sessionHash } = await createSessionToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await createSession(context.env.DB, { tokenHash: sessionHash, userId: user.id, expiresAt });

  return new Response(
    JSON.stringify({ user: { email: user.email, createdAt: user.created_at, role: user.role } }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'set-cookie': buildSessionCookie(sessionToken),
      },
    },
  );
}

export async function onRequest(context: { request: Request }): Promise<Response> {
  void context;
  return methodNotAllowed();
}