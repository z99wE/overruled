import type { LLMConfig } from '../types/legal';

export class LLMOrchestratorError extends Error {
  constructor(message: string, readonly provider: string, readonly status?: number) {
    super(message);
    this.name = 'LLMOrchestratorError';
  }
}

/** PRD §6 Network Isolation: BYOK traffic may only target these vetted upstream engines. */
export const PROVIDER_ORIGINS: ReadonlySet<string> = new Set([
  'https://generativelanguage.googleapis.com',
  'https://api.openai.com',
  'https://api.anthropic.com',
  'https://api.groq.com',
]);

const REQUEST_TIMEOUT_MS = 90_000;

/** Signal that aborts after a hard timeout — no dependency on `AbortSignal.timeout` (older Safari/Firefox lack it). */
function timeoutSignal(ms: number): { signal: AbortSignal; clear: () => void } {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, clear: () => clearTimeout(timer) };
}

interface ChatOptions {
  config: LLMConfig;
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  /** Enable structured JSON output. Pass an object to also supply a Gemini response schema. */
  jsonSchema?: unknown;
}

/** Statuses worth retrying: rate limits and transient capacity hiccups. Gemini in
 *  particular returns 503 "high demand" under load, and a single unretryed 503
 *  reads to the user as a broken app. */
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;

/** A server that says "retry in 30s" and is asked again after 8s just earns a
 *  second 429, so honour the ask up to a sane ceiling. */
const BACKOFF_CAP_MS = 30_000;

function backoffMs(res: Response): number {
  const retryAfter = Number(res.headers.get('retry-after'));
  if (Number.isFinite(retryAfter) && retryAfter > 0) return Math.min(retryAfter * 1000, BACKOFF_CAP_MS);
  return 0;
}

/** Gemini advertises no Retry-After header but embeds "Please retry in 9.79s" in
 *  the error body. Honour it so we back off exactly as long as the API asked. */
function parseRetryHint(message: string): number {
  const m = /please retry in\s+([\d.]+)\s*s/i.exec(message);
  if (!m) return 0;
  const seconds = Number(m[1]);
  return Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds * 1000, BACKOFF_CAP_MS) : 0;
}

export async function postRaw(url: string, headers: Record<string, string>, body: unknown, provider: string): Promise<unknown> {
  let origin: string;
  try {
    origin = new URL(url).origin;
  } catch {
    throw new LLMOrchestratorError(`Invalid request URL for ${provider}.`, 'security');
  }
  if (!PROVIDER_ORIGINS.has(origin)) {
    throw new LLMOrchestratorError(`Blocked non-provider origin: ${origin}`, 'security');
  }

  const payload = JSON.stringify(body);
  let lastFailure = '';
  let retryAfterMs = 0;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, retryAfterMs || Math.min(600 * 2 ** (attempt - 1), 6000)));
    }
    let res: Response;
    try {
      const { signal, clear } = timeoutSignal(REQUEST_TIMEOUT_MS);
      try {
        res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: payload, signal });
      } finally {
        clear();
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new LLMOrchestratorError(`Provider timed out after ${REQUEST_TIMEOUT_MS / 1000}s.`, provider);
      }
      lastFailure = `Network failure reaching ${provider}: ${err instanceof Error ? err.message : String(err)}`;
      continue;
    }

    if (res.ok) return await res.json();

    const raw = await res.text().catch(() => '');
    // Parse the FULL body: providers put the actionable text in JSON, and a long
    // message (e.g. Gemini's quota notice) must not be truncated before parsing
    // or the user sees a bare "provider error 429" instead of the real reason.
    let friendly = `${provider} error ${res.status}`;
    try {
      const j = JSON.parse(raw) as { error?: { message?: string; status?: string }; message?: string };
      friendly = j?.error?.message ?? j?.message ?? friendly;
    } catch {
      if (raw.trim()) friendly = raw.trim();
    }
    lastFailure = `Provider rejected the request: ${friendly}`;
    retryAfterMs = backoffMs(res) || parseRetryHint(friendly);
    if (!RETRYABLE_STATUS.has(res.status) || attempt === MAX_ATTEMPTS - 1) {
      throw new LLMOrchestratorError(lastFailure, provider, res.status);
    }
  }

  throw new LLMOrchestratorError(lastFailure || `Provider request failed after ${MAX_ATTEMPTS} attempts.`, provider);
}

function compactRecord<T extends object>(obj: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Record<string, unknown>;
}

/**
 * Single BYOK request path for all providers (Gemini, OpenAI-compatible, Anthropic).
 * Used by the trial orchestrator, the docket refiner and the Key Vault connectivity test.
 */
export async function requestChat(opts: ChatOptions): Promise<string> {
  const { config } = opts;
  const temperature = opts.temperature ?? 0.4;

  switch (config.provider) {
    case 'gemini': {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent`;
      const body = {
        systemInstruction: { parts: [{ text: opts.system }] },
        contents: [{ role: 'user', parts: [{ text: opts.user }] }],
        generationConfig: {
          temperature,
          ...(opts.jsonSchema !== undefined
            ? {
                responseMimeType: 'application/json',
                ...(typeof opts.jsonSchema === 'object' ? { responseSchema: opts.jsonSchema } : {}),
              }
            : {}),
        },
      };
      const headers = { 'x-goog-api-key': config.apiKey };
      const parsed = (await postRaw(url, headers, body, config.provider)) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      if (!text) throw new LLMOrchestratorError('Gemini returned an empty candidate.', config.provider);
      return text;
    }

    case 'openai':
    case 'groq': {
      const base =
        config.provider === 'openai'
          ? 'https://api.openai.com/v1/chat/completions'
          : 'https://api.groq.com/openai/v1/chat/completions';
      const body = compactRecord({
        model: config.model,
        temperature,
        max_tokens: opts.maxTokens,
        response_format: opts.jsonSchema !== undefined ? { type: 'json_object' } : undefined,
        messages: [
          { role: 'system', content: opts.system },
          { role: 'user', content: opts.user },
        ],
      });
      const headers = { Authorization: `Bearer ${config.apiKey}` };
      const parsed = (await postRaw(base, headers, body, config.provider)) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = parsed.choices?.[0]?.message?.content;
      if (!content) throw new LLMOrchestratorError('Provider returned an empty completion.', config.provider);
      return content;
    }

    case 'anthropic': {
      const headers = {
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      };
      const body = {
        model: config.model,
        max_tokens: opts.maxTokens ?? 1024,
        temperature,
        system: opts.system,
        messages: [
          { role: 'user', content: opts.jsonSchema !== undefined ? `${opts.user}\n\nRespond ONLY with the single JSON object.` : opts.user },
        ],
      };
      const parsed = (await postRaw('https://api.anthropic.com/v1/messages', headers, body, config.provider)) as {
        content?: Array<{ type?: string; text?: string }>;
      };
      const content = parsed.content
        ?.filter((b) => b.type === 'text')
        .map((b) => b.text ?? '')
        .join('');
      if (!content) throw new LLMOrchestratorError('Claude returned an empty completion.', config.provider);
      return content;
    }

    case 'hosted': {
      const { signal, clear } = timeoutSignal(REQUEST_TIMEOUT_MS);
      let res: Response;
      try {
        res = await fetch('/api/llm', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            compactRecord({
              system: opts.system,
              user: opts.user,
              temperature,
              maxTokens: opts.maxTokens,
              jsonSchema: opts.jsonSchema,
              model: config.model,
            }),
          ),
          signal,
        });
      } catch (err) {
        if (signal.aborted) {
          throw new LLMOrchestratorError(`Hosted inference timed out after ${REQUEST_TIMEOUT_MS / 1000}s.`, 'hosted');
        }
        throw new LLMOrchestratorError(`Network failure: ${err instanceof Error ? err.message : String(err)}`, 'hosted');
      } finally {
        clear();
      }
      const data = (await res.json().catch(() => ({}))) as { text?: string; error?: { code?: string; message?: string } };
      if (!res.ok) {
        const code = data.error?.code;
        const fallback = data.error?.message ?? `Hosted inference failed (${res.status}).`;
        const friendly =
          code === 'unauthorized'
            ? 'Sign in to use hosted inference.'
            : code === 'forbidden'
              ? 'Hosted inference is reserved for the workspace administrator. Supply your own key instead.'
              : code === 'hosted_quota'
                ? 'Hosted inference quota is exhausted. Contact the administrator or use your own key.'
                : code === 'rate_daily'
                  ? 'Daily hosted-inference allowance reached (100 model calls). It resets at midnight UTC — use your own key meanwhile.'
                  : code === 'rate_burst'
                    ? 'Hosted-inference burst limit reached. Wait a minute and try again.'
                    : code === 'hosted_unconfigured'
                      ? 'Hosted inference is not configured on this deployment yet. Use your own key.'
                      : fallback;
        throw new LLMOrchestratorError(friendly, 'hosted', res.status);
      }
      const text = data.text;
      if (!text) throw new LLMOrchestratorError('Hosted inference returned an empty response.', 'hosted');
      return text;
    }

    default:
      throw new LLMOrchestratorError(`Unsupported provider: ${String(config.provider)}`, String(config.provider));
  }
}