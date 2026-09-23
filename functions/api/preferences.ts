import { json, methodNotAllowed, readJson } from '../lib/http';
import { getSessionUser } from '../lib/guard';
import { setNewsletterOptin } from '../lib/db';
import type { AppEnv } from '../lib/d1';

// Signed-in only: toggle the in-app AI Briefing subscription. The opt-in is a
// single boolean on the account row — Cloudflare D1 is the only store, no
// external email provider is involved (the briefing is delivered in-app).

export async function onRequestPost(context: { request: Request; env: AppEnv }): Promise<Response> {
  const user = await getSessionUser(context.env, context.request);
  if (!user) return json({ error: 'Not signed in.' }, 401);

  const body = await readJson(context.request);
  const optin = body?.newsletter === true;
  await setNewsletterOptin(context.env.DB, user.id, optin);
  return json({ newsletterOptin: optin });
}

export async function onRequest(context: { request: Request }): Promise<Response> {
  void context;
  return methodNotAllowed();
}