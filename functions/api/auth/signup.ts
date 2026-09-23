import { json, readJson, methodNotAllowed } from '../../lib/http';
import {
  buildSessionCookie,
  createSessionToken,
  generateRecoveryCodes,
  hashPassword,
  isValidEmail,
  isValidPassword,
  normalizeRecoveryCode,
  RECOVERY_CODE_COUNT,
  sha256Hex,
} from '../../lib/auth';
import { createSession, createUser, findUserByEmail, insertRecoveryCode } from '../../lib/db';
import type { AppEnv } from '../../lib/d1';

export async function onRequestPost(context: { request: Request; env: AppEnv }): Promise<Response> {
  const body = await readJson(context.request);
  if (!body) return json({ error: 'Invalid request body.' }, 400);

  const emailRaw = typeof body.email === 'string' ? body.email : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const newsletter = body.newsletter === true;
  const email = emailRaw.trim().toLowerCase();

  if (!isValidEmail(email)) {
    return json({ error: 'Enter a valid email address.' }, 400);
  }
  const passwordCheck = isValidPassword(password);
  if (!passwordCheck.ok) {
    return json({ error: passwordCheck.reason }, 400);
  }
  const existing = await findUserByEmail(context.env.DB, email);
  if (existing) {
    return json({ error: 'An account with this email already exists. Log in instead.' }, 409);
  }

  const hashed = await hashPassword(password);
  const id = crypto.randomUUID();
  const created = await createUser(context.env.DB, {
    id,
    email,
    pwHash: hashed.hash,
    pwSalt: hashed.salt,
    iterations: hashed.iterations,
    newsletterOptin: newsletter,
  });
  if (!created) {
    return json({ error: 'Could not create account. Try again.' }, 500);
  }

  const { token, tokenHash } = await createSessionToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await createSession(context.env.DB, { tokenHash, userId: id, expiresAt });

  // One-time recovery codes, shown exactly once. Only the digests are stored.
  const recoveryCodes = generateRecoveryCodes(RECOVERY_CODE_COUNT);
  for (const code of recoveryCodes) {
    await insertRecoveryCode(context.env.DB, id, await sha256Hex(normalizeRecoveryCode(code)));
  }

  return new Response(
    JSON.stringify({
      user: { email, createdAt: new Date().toISOString(), role: 'user' },
      recoveryCodes,
      sessionToken: token,
    }),
    {
      status: 201,
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