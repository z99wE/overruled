import { methodNotAllowed } from '../../lib/http';
import { clearSessionCookie, parseCookies, SESSION_COOKIE, sha256Hex } from '../../lib/auth';
import { deleteSession } from '../../lib/db';
import type { AppEnv } from '../../lib/d1';

export async function onRequestPost(context: { request: Request; env: AppEnv }): Promise<Response> {
  const token = parseCookies(context.request.headers.get('cookie')).get(SESSION_COOKIE);
  if (token) {
    const tokenHash = await sha256Hex(token);
    await deleteSession(context.env.DB, tokenHash);
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'set-cookie': clearSessionCookie(),
    },
  });
}

export async function onRequest(context: { request: Request }): Promise<Response> {
  void context;
  return methodNotAllowed();
}