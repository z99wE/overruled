import { json, readJson, methodNotAllowed } from '../../lib/http';
import { createSessionToken, isValidEmail, RESET_TOKEN_TTL_MS } from '../../lib/auth';
import { createPasswordReset, deletePasswordResetsForUser, findUserByEmail } from '../../lib/db';
import { buildResetUrl, sendPasswordResetEmail } from '../../lib/email';
import type { AppEnv } from '../../lib/d1';

/**
 * Starts a password reset.
 *
 * The response shape is identical for invalid/unknown/existing emails so callers
 * cannot enumerate accounts. `emailConfigured` is server-wide (single-tenant
 * product), not account-specific — the client uses it to fall back to recovery
 * codes when no email transport is bound.
 */
export async function onRequestPost(context: { request: Request; env: AppEnv }): Promise<Response> {
  const configured = Boolean(context.env.RESEND_API_KEY && context.env.RESEND_FROM);

  const body = await readJson(context.request);
  const emailRaw = body && typeof body.email === 'string' ? body.email : '';
  const email = emailRaw.trim().toLowerCase();

  if (!isValidEmail(email)) {
    return json({ ok: true, emailConfigured: configured });
  }

  const user = await findUserByEmail(context.env.DB, email);
  if (!user) return json({ ok: true, emailConfigured: configured });

  const { token, tokenHash } = await createSessionToken();
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();
  await deletePasswordResetsForUser(context.env.DB, user.id);
  await createPasswordReset(context.env.DB, user.id, tokenHash, expiresAt);

  const origin = new URL(context.request.url).origin;
  await sendPasswordResetEmail({
    apiKey: context.env.RESEND_API_KEY,
    from: context.env.RESEND_FROM,
    to: user.email,
    resetUrl: buildResetUrl(origin, token),
  });

  return json({ ok: true, emailConfigured: configured });
}

export async function onRequest(context: { request: Request }): Promise<Response> {
  void context;
  return methodNotAllowed();
}