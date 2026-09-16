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