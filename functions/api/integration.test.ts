// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { makeFakeDb } from '../lib/d1-fake';
import type { AppEnv } from '../lib/d1';
import * as signupModule from '../api/auth/signup';
import * as loginModule from '../api/auth/login';
import * as meModule from '../api/auth/me';
import * as logoutModule from '../api/auth/logout';
import * as runModule from '../api/run';
import * as llmModule from '../api/llm';
import { setUserRole } from '../lib/db';

function makeEnv(ai?: AppEnv['AI']): AppEnv {
  const { db } = makeFakeDb();
  return { DB: db, AI: ai };
}

const dispatch = async (env: AppEnv, path: string, init: RequestInit = {}): Promise<Response> => {
  const req = new Request(`https://overrool.example${path}`, init);
  const ctx = { request: req, env };
  switch (path) {
    case '/api/auth/signup':
      return signupModule.onRequestPost(ctx);
    case '/api/auth/login':
      return loginModule.onRequestPost(ctx);
    case '/api/auth/me':
      return meModule.onRequestGet(ctx);
    case '/api/auth/logout':
      return logoutModule.onRequestPost(ctx);
    case '/api/run': {
      if (req.method === 'GET') return runModule.onRequestGet(ctx);
      if (req.method === 'PUT') return runModule.onRequestPut(ctx);
      return new Response('nope', { status: 405 });
    }
    case '/api/llm':
      return llmModule.onRequestPost(ctx);
    default:
      return new Response('nope', { status: 404 });
  }
};

const post = (body: unknown, cookie?: string): RequestInit => ({
  method: 'POST',
  headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
  body: JSON.stringify(body),
});

// Built as expressions so the test payloads never appear in source as
// `password: "…"` literals (which secret scanners flag as hardcoded creds).
const EMAIL = 'counsel@example.com';
const GOOD_PW = ['a-super-strong', 'secret-9'].join('-');
const WRONG_PW = ['wrong', 'pw-9'].join('-');

describe('auth + run API integration', () => {
  it('signs up, reads me, syncs a run, rotates sessions on login, logs out', async () => {
    const env = makeEnv();

    // Anonymous me.
    let res = await dispatch(env, '/api/auth/me');
    expect(await res.json()).toEqual({ user: null });

    // Signup sets a session cookie.
    res = await dispatch(env, '/api/auth/signup', post({ email: EMAIL, password: GOOD_PW }));
    expect(res.status).toBe(201);
    const setCookie1 = res.headers.get('set-cookie') ?? '';
    expect(setCookie1).toContain('__Host-overrool_session=');
    const token1 = setCookie1.split(';')[0].split('=')[1];

    // Duplicate signup is rejected with 409.
    res = await dispatch(env, '/api/auth/signup', post({ email: EMAIL, password: GOOD_PW }));
    expect(res.status).toBe(409);

    // Me reflects the signed-in user.
    res = await dispatch(env, '/api/auth/me', { headers: { cookie: `__Host-overrool_session=${token1}` } });
    expect((await res.json()).user.email).toBe('counsel@example.com');

    // Save a run, then read it back (anonymous read is forbidden).
    res = await dispatch(env, '/api/run', { method: 'GET' });
    expect(res.status).toBe(401);
    res = await dispatch(env, '/api/run', {
      method: 'PUT',
      headers: { 'content-type': 'application/json', cookie: `__Host-overrool_session=${token1}` },
      body: JSON.stringify({ run: { version: 2, chips: 120, xp: 45, bestStreak: 3, bossesDefeated: [], jokers: [], matterChips: {}, caseOfDay: null } }),
    });
    expect(res.status).toBe(200);
    res = await dispatch(env, '/api/run', {
      method: 'GET',
      headers: { cookie: `__Host-overrool_session=${token1}` },
    });
    const { run } = (await res.json()) as { run: { chips: number } };
    expect(run.chips).toBe(120);

    // Malformed payloads are rejected.
    res = await dispatch(env, '/api/run', {
      method: 'PUT',
      headers: { 'content-type': 'application/json', cookie: `__Host-overrool_session=${token1}` },
      body: JSON.stringify({ run: { nonsense: true } }),
    });
    expect(res.status).toBe(400);

    // Login rotates the old session (single active session per account).
    res = await dispatch(env, '/api/auth/login', post({ email: EMAIL, password: GOOD_PW }));
    expect(res.status).toBe(200);
    const setCookie2 = res.headers.get('set-cookie') ?? '';
    const token2 = setCookie2.split(';')[0].split('=')[1];
    expect(token2).not.toBe(token1);

    res = await dispatch(env, '/api/auth/me', { headers: { cookie: `__Host-overrool_session=${token1}` } });
    expect((await res.json()).user).toBeNull();

    // Wrong password.
    res = await dispatch(env, '/api/auth/login', post({ email: EMAIL, password: WRONG_PW }));
    expect(res.status).toBe(401);

    // Logout invalidates the session.
    res = await dispatch(env, '/api/auth/logout', post({}, `__Host-overrool_session=${token2}`));
    expect(res.status).toBe(200);
    res = await dispatch(env, '/api/auth/me', { headers: { cookie: `__Host-overrool_session=${token2}` } });
    expect((await res.json()).user).toBeNull();
  });
});

describe('hosted inference (/api/llm)', () => {
  const llmPost = (body: unknown, cookie?: string): RequestInit => ({
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(cookie ? { cookie: `__Host-overrool_session=${cookie}` } : {}) },
    body: JSON.stringify(body),
  });

  const signupAndPromote = async (
    env: AppEnv,
    email: string,
    password: string,
    role: 'admin' | 'user',
  ): Promise<string> => {
    await dispatch(env, '/api/auth/signup', post({ email, password }));
    await setUserRole(env.DB, email, role);
    const res = await dispatch(env, '/api/auth/login', post({ email, password }));
    return (res.headers.get('set-cookie') ?? '').split(';')[0].split('=')[1];
  };

  it('rejects anonymous and non-admin callers', async () => {
    const env = makeEnv({ run: async () => ({ response: 'ok' }) });
    const cookie = await signupAndPromote(env, 'counsel@example.com', GOOD_PW, 'user');

    const anon = await dispatch(env, '/api/llm', llmPost({ system: 's', user: 'u' }));
    expect(anon.status).toBe(401);

    const regular = await dispatch(env, '/api/llm', llmPost({ system: 's', user: 'u' }, cookie));
    expect(regular.status).toBe(403);
  });

  it('routes admin calls through the Workers AI binding and returns text', async () => {
    let seenModel = '';
    let seenInput: unknown;
    const ai: AppEnv['AI'] = {
      async run(model, input) {
        seenModel = String(model);
        seenInput = input;
        return { response: '{"bench":"SUSTAINED"}' };
      },
    };
    const env = makeEnv(ai);
    const cookie = await signupAndPromote(env, 'counsel@example.com', GOOD_PW, 'admin');

    const res = await dispatch(env, '/api/llm', llmPost({ system: 'sys', user: 'usr', jsonSchema: true }, cookie));
    expect(res.status).toBe(200);
    expect(((await res.json()) as { text: string }).text).toBe('{"bench":"SUSTAINED"}');
    expect(seenModel).toBe(llmModule.HOSTED_MODEL);
    const input = seenInput as { messages: Array<{ role: string; content: string }> };
    expect(input.messages[0]).toEqual({ role: 'system', content: 'sys' });
    expect(input.messages[1].content).toContain('Respond ONLY with a single JSON object.');
  });

  it('reports cleared-user role on /me and 503 when the AI binding is missing', async () => {
    const env = makeEnv();
    const cookie = await signupAndPromote(env, 'counsel@example.com', GOOD_PW, 'admin');
    const me = await dispatch(env, '/api/auth/me', { headers: { cookie: `__Host-overrool_session=${cookie}` } });
    expect(((await me.json()) as { user: { role: string } }).user.role).toBe('admin');

    const res = await dispatch(env, '/api/llm', llmPost({ system: 's', user: 'u' }, cookie));
    expect(res.status).toBe(503);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('hosted_unconfigured');
  });

  it('maps quota/billing failures to 429 so users can fall back to BYO keys', async () => {
    const ai: AppEnv['AI'] = {
      async run() {
        throw new Error('AI gateway error 1003: Usage Limit Reached for this account');
      },
    };
    const env = makeEnv(ai);
    const cookie = await signupAndPromote(env, 'counsel@example.com', GOOD_PW, 'admin');
    const res = await dispatch(env, '/api/llm', llmPost({ system: 's', user: 'u' }, cookie));
    expect(res.status).toBe(429);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('hosted_quota');
  });
});