import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LLMOrchestratorError, postRaw, PROVIDER_ORIGINS, requestChat } from './providerCall';
import type { LLMConfig } from '../types/legal';

function config(provider: LLMConfig['provider'], model = 'model-1'): LLMConfig {
  return { provider, apiKey: 'secret-key', model };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('postRaw', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ ok: true })));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('rejects a malformed URL before any network call', async () => {
    await expect(postRaw('not a url', {}, {}, 'gemini')).rejects.toThrow(LLMOrchestratorError);
    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('blocks non-provider origins (SSRF guard)', async () => {
    await expect(postRaw('https://evil.example.com/api', {}, {}, 'gemini')).rejects.toMatchObject({
      provider: 'security',
    });
    expect(PROVIDER_ORIGINS.has('https://evil.example.com')).toBe(false);
  });

  it('retries a transient 503 and succeeds', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async () =>
      fetchMock.mock.calls.length < 3
        ? jsonResponse({ error: { message: 'high demand' } }, 503)
        : jsonResponse({ ok: true }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const promise = postRaw('https://api.openai.com/v1/chat/completions', {}, {}, 'openai');
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('gives up after the retry budget and surfaces the status', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async () => jsonResponse({ error: { message: 'still overloaded' } }, 503));
    vi.stubGlobal('fetch', fetchMock);
    const pending = expect(
      postRaw('https://api.openai.com/v1/chat/completions', {}, {}, 'openai'),
    ).rejects.toMatchObject({ status: 503 });
    await vi.runAllTimersAsync();
    await pending;
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not retry a non-retryable status', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ error: { message: 'bad request' } }, 400));
    vi.stubGlobal('fetch', fetchMock);
    await expect(postRaw('https://api.openai.com/v1/chat/completions', {}, {}, 'openai')).rejects.toMatchObject({
      status: 400,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('surfaces a long provider message that would break a truncate-then-parse', async () => {
    vi.useFakeTimers();
    const long = `You exceeded your current quota. ${'padding '.repeat(60)}Please retry in 9.7s.`;
    expect(long.length).toBeGreaterThan(300);
    const fetchMock = vi.fn(async () => jsonResponse({ error: { message: long } }, 429));
    vi.stubGlobal('fetch', fetchMock);
    const pending = expect(
      postRaw('https://generativelanguage.googleapis.com/v1beta/models/m:generateContent', {}, {}, 'gemini'),
    ).rejects.toThrow(/exceeded your current quota/);
    await vi.runAllTimersAsync();
    await pending;
  });

  it('honours a "please retry in Ns" hint embedded in the error body', async () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(globalThis, 'setTimeout');
    const fetchMock = vi.fn(async () =>
      fetchMock.mock.calls.length === 1
        ? jsonResponse({ error: { message: 'Quota exceeded. Please retry in 9s.' } }, 429)
        : jsonResponse({ ok: true }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const promise = postRaw('https://generativelanguage.googleapis.com/v1beta/models/m:generateContent', {}, {}, 'gemini');
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toEqual({ ok: true });
    expect(spy).toHaveBeenCalledWith(expect.any(Function), 9000);
  });

  it('honours a Retry-After header instead of escalating', async () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(globalThis, 'setTimeout');
    const fetchMock = vi.fn(async () =>
      fetchMock.mock.calls.length === 1
        ? new Response(JSON.stringify({ error: { message: 'slow down' } }), { status: 429, headers: { 'Retry-After': '1' } })
        : jsonResponse({ ok: true }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const promise = postRaw('https://api.openai.com/v1/chat/completions', {}, {}, 'openai');
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toEqual({ ok: true });
    expect(spy).toHaveBeenCalledWith(expect.any(Function), 1000);
  });

  it('surfaces the provider status and friendly error body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({ error: { message: 'rate limited' } }, 429),
      ),
    );
    await expect(postRaw('https://api.openai.com/v1/chat/completions', {}, {}, 'openai')).rejects.toMatchObject({
      provider: 'openai',
      status: 429,
      message: expect.stringContaining('rate limited'),
    });
  });

  it('throws a non-JSON error when the provider body is unparseable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse('<html>gateway error</html>', 502)));
    await expect(postRaw('https://api.anthropic.com/v1/messages', {}, {}, 'anthropic')).rejects.toMatchObject({
      status: 502,
    });
  });
});

describe('requestChat', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('Gemini: sends the key as a header (never in the URL) and returns the candidate text', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
      expect(String(input)).not.toContain('key=');
      return jsonResponse({ candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }] });
    });
    vi.stubGlobal('fetch', fetchMock);
    const text = await requestChat({
      config: config('gemini'),
      system: 'sys',
      user: 'usr',
      jsonSchema: { type: 'object' },
    });
    expect(text).toBe('{"ok":true}');
    expect((fetchMock.mock.calls[0][1]?.headers as Record<string, string>)['x-goog-api-key']).toBe('secret-key');
  });

  it('Gemini: throws on an empty candidate set', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ candidates: [] })));
    await expect(requestChat({ config: config('gemini'), system: 's', user: 'u' })).rejects.toThrow(
      /empty candidate/i,
    );
  });

  it('OpenAI-compatible: extracts the first completion choice', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      jsonResponse({ choices: [{ message: { content: '{"x":1}' } }] }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const text = await requestChat({ config: config('openai'), system: 's', user: 'u' });
    expect(text).toBe('{"x":1}');
    expect((fetchMock.mock.calls[0][1]?.headers as Record<string, string>).Authorization).toBe('Bearer secret-key');
  });

  it('Groq: routes to the Groq origin', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      jsonResponse({ choices: [{ message: { content: 'ok' } }] }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await requestChat({ config: config('groq'), system: 's', user: 'u' });
    expect(String(fetchMock.mock.calls[0][0])).toContain('api.groq.com');
  });

  it('OpenAI-compatible: throws when the completion is empty', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ choices: [{ message: { content: '' } }] })));
    await expect(requestChat({ config: config('openai'), system: 's', user: 'u' })).rejects.toThrow(/empty completion/i);
  });

  it('Anthropic: joins text blocks and enforces the JSON directive in JSON mode', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      jsonResponse({ content: [{ type: 'text', text: '{"y":2}' }] }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const text = await requestChat({ config: config('anthropic'), system: 's', user: 'payload', jsonSchema: true });
    expect(text).toBe('{"y":2}');
    expect(String(fetchMock.mock.calls[0][1]?.body)).toContain('Respond ONLY with the single JSON object.');
  });

  it('Anthropic: throws when no text content is returned', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ content: [{ type: 'tool_use' }] })));
    await expect(requestChat({ config: config('anthropic'), system: 's', user: 'u' })).rejects.toThrow(/empty completion/i);
  });

  it('throws a typed error for an unsupported provider', async () => {
    await expect(
      requestChat({ config: { provider: 'unknown' as LLMConfig['provider'], apiKey: 'k', model: 'm' }, system: 's', user: 'u' }),
    ).rejects.toThrow('Unsupported provider');
  });
});