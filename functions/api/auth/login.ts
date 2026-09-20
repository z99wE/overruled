import { json, readJson, methodNotAllowed } from '../../lib/http';
import { buildSessionCookie, createSessionToken, isValidEmail, verifyPassword } from '../../lib/auth';
import { clearFailedLogins, createSession, deleteSessionsForUser, findUserByEmail, loginLock, recordFailedLogin } from '../../lib/db';
import type { AppEnv } from '../../lib/d1';

export async function onRequestPost(context: { request: Request; env: AppEnv }): Promise<Response> {
  const body = await readJson(context.request);
  if (!body) return json({ error: 'Invalid request body.' }, 400);

  const emailRaw = typeof body.email === 'string' ? body.email : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const email = emailRaw.trim().toLowerCase();

  if (!isValidEmail(email)) {
    return json({ error: 'Invalid email or password.' }, 401);
  }

  const lock = await loginLock(context.env.DB, email);
  if (lock.locked) {
    return json(
      {
        error: `Too many sign-in attempts. Try again in ${lock.retryAfterSeconds}s.`,
        code: 'login_locked',
        retryAfterSeconds: lock.retryAfterSeconds,
      },
      429,
    );
  }

  const user = await findUserByEmail(context.env.DB, email);
  if (!user) {
    await recordFailedLogin(context.env.DB, email);
    return json({ error: 'Invalid email or password.' }, 401);
  }

  const ok = await verifyPassword(password, user.pw_salt, user.iterations, user.pw_hash);
  if (!ok) {
    await recordFailedLogin(context.env.DB, email);
    return json({ error: 'Invalid email or password.' }, 401);
  }

  // Correct password clears the backoff counter.
  await clearFailedLogins(context.env.DB, email);

  // Rotate: one active session per account.
  await deleteSessionsForUser(context.env.DB, user.id);

  const { token, tokenHash } = await createSessionToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await createSession(context.env.DB, { tokenHash, userId: user.id, expiresAt });

  return new Response(
    JSON.stringify({ user: { email: user.email, createdAt: user.created_at } }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'set-cookie': buildSessionCookie(token),
      },
    },
  );
}

export async function onRequest(context: { request: Request }): Promise<Response> {
  void context;
  return methodNotAllowed();
}