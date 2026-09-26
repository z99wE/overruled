/**
 * Extended coverage for providerCall.ts branches not covered in the main test:
 * - parseRetryHint: Gemini-style "please retry in Xs" body parsing
 * - backoffMs: Retry-After header parsing
 * - Non-JSON error body handling (raw text fallback)
 * - The 'default' unsupported-provider path in requestChat
 * - Anthropic empty-content guard (filter + join branch)
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LLMOrchestratorError, postRaw, requestChat } from './providerCall';
import type { LLMConfig } from '../types/legal';

function cfg(provider: LLMConfig['provider'], model = 'model-1'): LLMConfig {
  return { provider, apiKey: 'sk-test', model };
}

function textResponse(body: string, status: number, headers: Record<string, string> = {}): Response {
  return new Response(body, { status, headers: { 'Content-Type': 'text/plain', ...headers } });
}

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

describe('postRaw — error-body and Retry-After handling', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('surfaces a plain-text error body when the response is not JSON', async () => {
    vi.useFakeTimers();
    // Always return a non-retryable 400 with a plain-text body
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => textResponse('Bad request: invalid model name', 400)),
    );
    const pending = expect(
      postRaw('https://api.openai.com/v1/chat/completions', {}, {}, 'openai'),
    ).rejects.toMatchObject({ message: expect.stringContaining('Bad request') });
    await vi.runAllTimersAsync();
    await pending;
  });

  it('honours a Retry-After header and backs off accordingly', async () => {
    vi.useFakeTimers();
    let calls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        calls++;
        if (calls < 3) {
          return new Response(JSON.stringify({ error: { message: 'rate limited' } }), {
            status: 429,
            headers: { 'Content-Type': 'application/json', 'retry-after': '1' },
          });
        }
        return jsonResponse({ ok: true });
      }),
    );
    const promise = postRaw('https://api.openai.com/v1/chat/completions', {}, {}, 'openai');
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toEqual({ ok: true });
    expect(calls).toBe(3);
  });

  it('parses Gemini-style "please retry in Xs" from the error body', async () => {
    vi.useFakeTimers();
    let calls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        calls++;
        if (calls < 3) {
          return jsonResponse(
            { error: { message: 'quota exceeded. Please retry in 2.5s.' } },
            503,
          );
        }
        return jsonResponse({ candidates: [{ content: { parts: [{ text: 'OK' }] } }] });
      }),
    );
    const promise = postRaw(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent',
      {},
      {},
      'gemini',
    );
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBeTruthy();
    expect(calls).toBe(3);
  });

  it('throws after 3 network failures with a descriptive message', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('Network unreachable');
      }),
    );
    const pending = expect(
      postRaw('https://api.openai.com/v1/chat/completions', {}, {}, 'openai'),
    ).rejects.toMatchObject({ message: expect.stringContaining('Network failure') });
    await vi.runAllTimersAsync();
    await pending;
  });
});

describe('requestChat — unsupported provider guard', () => {
  it('throws LLMOrchestratorError for an unrecognised provider', async () => {
    const bad = { provider: 'unknown-llm' as LLMConfig['provider'], apiKey: 'x', model: 'y' };
    await expect(requestChat({ config: bad, system: 'sys', user: 'usr' })).rejects.toThrow(
      LLMOrchestratorError,
    );
  });
});

describe('requestChat — Anthropic provider', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('concatenates multi-part Anthropic content blocks', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({
          content: [
            { type: 'text', text: 'Hello ' },
            { type: 'text', text: 'world' },
          ],
        }),
      ),
    );
    const result = await requestChat({
      config: cfg('anthropic'),
      system: 'sys',
      user: 'usr',
    });
    expect(result).toBe('Hello world');
  });

  it('ignores non-text Anthropic content blocks', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({
          content: [
            { type: 'tool_use', id: 'x' },
            { type: 'text', text: 'Answer' },
          ],
        }),
      ),
    );
    const result = await requestChat({
      config: cfg('anthropic'),
      system: 'sys',
      user: 'usr',
    });
    expect(result).toBe('Answer');
  });

  it('throws when Anthropic content is empty', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ content: [] })));
    await expect(
      requestChat({ config: cfg('anthropic'), system: 'sys', user: 'usr' }),
    ).rejects.toThrow(LLMOrchestratorError);
  });

  it('appends JSON mode instruction to the user prompt when jsonSchema is set', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ content: [{ type: 'text', text: '{"ok":true}' }] }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await requestChat({
      config: cfg('anthropic'),
      system: 'sys',
      user: 'give me json',
      jsonSchema: true,
    });
    const allCalls = (fetchMock.mock.calls as unknown) as Array<[string, RequestInit?]>;
    const body = JSON.parse(allCalls[0][1]?.body as string) as {
      messages: Array<{ content: string }>;
    };
    expect(body.messages[0].content).toContain('Respond ONLY with the single JSON object');
  });
});

describe('requestChat — Groq provider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('routes to the Groq base URL', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ choices: [{ message: { content: 'groq-reply' } }] }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const result = await requestChat({ config: cfg('groq'), system: 's', user: 'u' });
    expect(result).toBe('groq-reply');
    const calls = (fetchMock.mock.calls as unknown) as Array<[string, RequestInit?]>;
    expect(calls[0][0]).toContain('groq.com');
  });

  it('throws when Groq returns an empty completion', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ choices: [{ message: { content: '' } }] })));
    await expect(requestChat({ config: cfg('groq'), system: 's', user: 'u' })).rejects.toThrow(
      LLMOrchestratorError,
    );
  });
});
