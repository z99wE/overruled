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

interface ChatOptions {
  config: LLMConfig;
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  /** Enable structured JSON output. Pass an object to also supply a Gemini response schema. */
  jsonSchema?: unknown;
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
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      throw new LLMOrchestratorError(`Provider timed out after ${REQUEST_TIMEOUT_MS / 1000}s.`, provider);
    }
    throw new LLMOrchestratorError(`Network failure reaching ${provider}: ${err instanceof Error ? err.message : String(err)}`, provider);
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    let friendly = `${provider} error ${res.status}`;
    try {
      const j = JSON.parse(detail) as { error?: { message?: string }; message?: string };
      friendly = j?.error?.message ?? j?.message ?? friendly;
    } catch {
      /* keep status friendly string */
    }
    throw new LLMOrchestratorError(`Provider rejected the request: ${friendly}`, provider, res.status);
  }
  try {
    return await res.json();
  } catch {
    throw new LLMOrchestratorError('Provider returned non-JSON output.', provider);
  }
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
      const res = await fetch('/api/llm', {
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
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
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