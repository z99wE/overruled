import { json, readJson, methodNotAllowed } from '../../../lib/http';
import {
  buildSessionCookie,
  createSessionToken,
  hashPassword,
  isValidEmail,
  isValidPassword,
  normalizeRecoveryCode,
  sha256Hex,
} from '../../../lib/auth';
import {
  createSession,
  deleteSessionsForUser,
  findUserByEmail,
  isUnusedRecoveryCode,
  updatePasswordHash,
  useRecoveryCode,
} from '../../../lib/db';
import type { AppEnv } from '../../../lib/d1';

/**
 * Public: proves ownership with an unused recovery code and sets a new password.
 * The code is consumed, the user is signed in with a fresh session, and all
 * other sessions are invalidated. Keep the response shape stable for any
 * bad-code input so the endpoint can't be used to enumerate valid codes.
 */
export async function onRequestPost(context: { request: Request; env: AppEnv }): Promise<Response> {
  const body = await readJson(context.request);
  const emailRaw = body && typeof body.email === 'string' ? body.email : '';
  const codeRaw = body && typeof body.code === 'string' ? body.code : '';
  const password = body && typeof body.password === 'string' ? body.password : '';

  const email = emailRaw.trim().toLowerCase();
  const code = normalizeRecoveryCode(codeRaw);

  const passwordCheck = isValidPassword(password);
  if (!isValidEmail(email) || code.length < 8 || !passwordCheck.ok) {
    return json({ error: passwordCheck.ok ? 'Invalid email or recovery code.' : passwordCheck.reason }, 400);
  }

  const user = await findUserByEmail(context.env.DB, email);
  const codeHash = await sha256Hex(code);
  const valid = user ? await isUnusedRecoveryCode(context.env.DB, user.id, codeHash) : false;
  if (!user || !valid) {
    return json({ error: 'That recovery code is invalid or already used.' }, 400);
  }

  const hashed = await hashPassword(password);
  await updatePasswordHash(context.env.DB, user.id, hashed.hash, hashed.salt, hashed.iterations);
  await useRecoveryCode(context.env.DB, user.id, codeHash);
  await deleteSessionsForUser(context.env.DB, user.id);

  const { token, tokenHash } = await createSessionToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await createSession(context.env.DB, { tokenHash, userId: user.id, expiresAt });

  return new Response(
    JSON.stringify({ user: { email: user.email, createdAt: user.created_at, role: user.role } }),
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