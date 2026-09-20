import { json, methodNotAllowed } from '../../lib/http';
import { getSessionUser } from '../../lib/guard';
import type { AppEnv } from '../../lib/d1';

export async function onRequestGet(context: { request: Request; env: AppEnv }): Promise<Response> {
  const user = await getSessionUser(context.env, context.request.headers.get('cookie'));
  return json({ user: user ? { email: user.email, createdAt: user.created_at } : null });
}

export async function onRequest(context: { request: Request }): Promise<Response> {
  void context;
  return methodNotAllowed();
}