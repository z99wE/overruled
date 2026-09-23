import { json, methodNotAllowed } from '../../../lib/http';
import { generateRecoveryCodes, normalizeRecoveryCode, RECOVERY_CODE_COUNT, sha256Hex } from '../../../lib/auth';
import { insertRecoveryCode, revokeRecoveryCodes } from '../../../lib/db';
import { getSessionUser } from '../../../lib/guard';
import type { AppEnv } from '../../../lib/d1';

/**
 * Signed-in only: emits a fresh set of one-time recovery codes. Older codes for
 * the account are revoked the moment the new ones are issued. Plaintext is
 * returned exactly once; only SHA-256 digests are stored.
 */
export async function onRequestPost(context: { request: Request; env: AppEnv }): Promise<Response> {
  const sessionUser = await getSessionUser(context.env, context.request);
  if (!sessionUser) {
    return json({ error: 'Not signed in.' }, 401);
  }

  await revokeRecoveryCodes(context.env.DB, sessionUser.id);

  const codes = generateRecoveryCodes(RECOVERY_CODE_COUNT);
  for (const code of codes) {
    await insertRecoveryCode(context.env.DB, sessionUser.id, await sha256Hex(normalizeRecoveryCode(code)));
  }

  return json({ codes, remaining: RECOVERY_CODE_COUNT });
}

export async function onRequest(context: { request: Request }): Promise<Response> {
  void context;
  return methodNotAllowed();
}