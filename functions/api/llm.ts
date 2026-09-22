import { json, methodNotAllowed, readJson } from '../lib/http';
import { getSessionUser } from '../lib/guard';
import { meterCheckAndCharge } from '../lib/db';
import { AppEnv } from '../lib/d1';

/** Free-tier Workers AI chat model. Accounts without hosted access keep using BYO keys. */
export const HOSTED_MODEL = '@cf/meta/llama-3.1-8b-instruct';
/** Only these model ids are ever accepted from a client — no model smuggling. */
export const HOSTED_MODEL_ALLOWLIST: ReadonlySet<string> = new Set([
  HOSTED_MODEL,
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
]);
const MAX_TOKENS = 4096;

interface LlmRequest extends Record<string, unknown> {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  jsonSchema?: unknown;
  model?: string;
}

function isValidRequest(body: Record<string, unknown>): body is LlmRequest {
  return (
    typeof body.system === 'string' &&
    body.system.length > 0 &&
    body.system.length <= 12_000 &&
    typeof body.user === 'string' &&
    body.user.length > 0 &&
    body.user.length <= 12_000
  );
}

function compactRecord(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

function pickText(result: unknown): string {
  if (typeof result === 'string') return result;
  if (result && typeof result === 'object') {
    const obj = result as Record<string, unknown>;
    if (typeof obj.response === 'string') return obj.response;
    if (typeof obj.text === 'string') return obj.text;
    const out = obj.outputs;
    if (Array.isArray(out) && typeof out[0] === 'string') return out[0];
  }
  return '';
}

export async function onRequestPost(context: { request: Request; env: AppEnv }): Promise<Response> {
  const user = await getSessionUser(context.env, context.request.headers.get('cookie'));
  if (!user) return json({ error: { code: 'unauthorized', message: 'Sign in to use hosted inference.' } }, 401);
  if (user.role !== 'admin') {
    return json({ error: { code: 'forbidden', message: 'Hosted inference is reserved for the workspace administrator. Provide your own API key instead.' } }, 403);
  }

  const body = await readJson(context.request);
  if (!body || !isValidRequest(body)) {
    return json({ error: { code: 'bad_request', message: 'body.system and body.user (strings) are required.' } }, 400);
  }

  if (!context.env.AI) {
    return json({ error: { code: 'hosted_unconfigured', message: 'Hosted inference is not configured on this deployment yet.' } }, 503);
  }

  // Authoritative capped metering: per-account daily cap + per-minute burst so
  // hosted inference can never be jacked into exhausting the shared queue.
  const meter = await meterCheckAndCharge(context.env.DB, user.id, 1);
  if (!meter.allowed) {
    return json(
      {
        error: {
          code: meter.kind === 'burst' ? 'rate_burst' : 'rate_daily',
          message:
            meter.kind === 'burst'
              ? 'Hosted-inference burst limit reached — wait a minute and try again.'
              : 'Daily hosted-inference allowance reached (100 model calls). It resets at midnight UTC; use your own key meanwhile.',
        },
      },
      429,
    );
  }

  const system = body.system;
  const userContent = body.jsonSchema !== undefined ? `${body.user}\n\nRespond ONLY with a single JSON object.` : body.user;
  const requested = typeof body.model === 'string' ? body.model.trim() : '';
  // No silent fallback: a client asking for a model outside the allowlist is
  // a bug or a probe — answer loudly so it can't smuggle an arbitrary id.
  if (requested && !HOSTED_MODEL_ALLOWLIST.has(requested)) {
    return json({ error: { code: 'bad_model', message: 'That model is not on the hosted allowlist.' } }, 400);
  }
  const model = requested || HOSTED_MODEL;
  const input = compactRecord({
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userContent },
    ],
    max_tokens: Math.min(Math.max(body.maxTokens ?? 1024, 1), MAX_TOKENS),
    temperature: body.temperature,
  });

  try {
    const result = await context.env.AI.run(model, input);
    const text = pickText(result);
    if (!text) return json({ error: { code: 'provider_error', message: 'Hosted model returned an empty response.' } }, 502);
    return json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[llm] hosted inference failed:', message);
    const quotaLike = /insufficient_funds|billing|quota|usage.limit|1007|1003|limit reached/i.test(message);
    if (quotaLike) {
      return json({ error: { code: 'hosted_quota', message: 'Hosted inference quota is exhausted. Add a Cloudflare billing method or switch to your own API key.' } }, 429);
    }
    // Never echo provider internals to the client — log them server-side.
    return json({ error: { code: 'provider_error', message: 'Hosted inference failed. Please try again in a moment.' } }, 502);
  }
}

export async function onRequest(context: { request: Request }): Promise<Response> {
  void context;
  return methodNotAllowed();
}