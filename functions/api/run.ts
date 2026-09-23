import { json, readJson, methodNotAllowed } from '../lib/http';
import { getSessionUser } from '../lib/guard';
import { getRun, putRun } from '../lib/db';
import type { AppEnv } from '../lib/d1';

const MAX_RUN_BYTES = 400_000;

export async function onRequestGet(context: { request: Request; env: AppEnv }): Promise<Response> {
  const user = await getSessionUser(context.env, context.request);
  if (!user) return json({ error: 'Not signed in.' }, 401);

  const row = await getRun(context.env.DB, user.id);
  let run: unknown = null;
  if (row) {
    try {
      run = JSON.parse(row.data);
    } catch {
      run = null;
    }
  }
  return json({ run, updatedAt: row?.updated_at ?? null });
}

export async function onRequestPut(context: { request: Request; env: AppEnv }): Promise<Response> {
  const user = await getSessionUser(context.env, context.request);
  if (!user) return json({ error: 'Not signed in.' }, 401);

  const body = await readJson(context.request);
  if (!body || body.run === undefined) return json({ error: 'Missing run payload.' }, 400);

  const raw = JSON.stringify(body.run);
  if (raw.length > MAX_RUN_BYTES) return json({ error: 'Save payload too large.' }, 413);

  if (!isPlausibleRun(body.run)) {
    return json({ error: 'Invalid save payload.' }, 400);
  }

  await putRun(context.env.DB, user.id, raw);
  return json({ ok: true });
}

export async function onRequest(context: { request: Request }): Promise<Response> {
  void context;
  return methodNotAllowed();
}

// Structural sanity check only — the client schema is the source of truth.
function isPlausibleRun(run: unknown): boolean {
  if (typeof run !== 'object' || run === null) return false;
  const r = run as Record<string, unknown>;
  return typeof r.version === 'number' && typeof r.chips === 'number' && typeof r.xp === 'number';
}