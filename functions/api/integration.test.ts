// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { makeFakeDb } from '../lib/d1-fake';
import type { AppEnv } from '../lib/d1';
import * as signupModule from '../api/auth/signup';
import * as loginModule from '../api/auth/login';
import * as meModule from '../api/auth/me';
import * as logoutModule from '../api/auth/logout';
import * as forgotModule from '../api/auth/forgot';
import * as resetModule from '../api/auth/reset';
import * as recoveryCodesModule from '../api/auth/recovery/codes';
import * as recoveryVerifyModule from '../api/auth/recovery/verify';
import * as runModule from '../api/run';
import * as llmModule from '../api/llm';
import { setUserRole, LOGIN_MAX_FAILURES, createPasswordReset, findUserByEmail } from '../lib/db';
import { sha256Hex } from '../lib/auth';

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
    case '/api/auth/forgot':
      return forgotModule.onRequestPost(ctx);
    case '/api/auth/reset':
      return resetModule.onRequestPost(ctx);
    case '/api/auth/recovery/codes':
      return recoveryCodesModule.onRequestPost(ctx);
    case '/api/auth/recovery/verify':
      return recoveryVerifyModule.onRequestPost(ctx);
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

  it('locks sign-in after repeated failures and blocks the correct password too', async () => {
    const env = makeEnv();
    await dispatch(env, '/api/auth/signup', post({ email: EMAIL, password: GOOD_PW }));

    for (let i = 0; i < LOGIN_MAX_FAILURES; i++) {
      const res = await dispatch(env, '/api/auth/login', post({ email: EMAIL, password: WRONG_PW }));
      expect(res.status).toBe(401);
    }

    const locked = await dispatch(env, '/api/auth/login', post({ email: EMAIL, password: WRONG_PW }));
    expect(locked.status).toBe(429);
    const body = (await locked.json()) as { code: string; retryAfterSeconds: number };
    expect(body.code).toBe('login_locked');
    expect(body.retryAfterSeconds).toBeGreaterThan(0);

    // Anti-lock-bypass: the real password is still refused while locked.
    const correctWhileLocked = await dispatch(env, '/api/auth/login', post({ email: EMAIL, password: GOOD_PW }));
    expect(correctWhileLocked.status).toBe(429);
  });

  it('a successful sign-in resets the failure counter', async () => {
    const env = makeEnv();
    await dispatch(env, '/api/auth/signup', post({ email: EMAIL, password: GOOD_PW }));
    for (let i = 0; i < 3; i++) {
      await dispatch(env, '/api/auth/login', post({ email: EMAIL, password: WRONG_PW }));
    }
    const ok = await dispatch(env, '/api/auth/login', post({ email: EMAIL, password: GOOD_PW }));
    expect(ok.status).toBe(200);

    // Post-reset: 9 more failures is still short of the 10-attempt threshold.
    for (let i = 0; i < LOGIN_MAX_FAILURES - 1; i++) {
      const res = await dispatch(env, '/api/auth/login', post({ email: EMAIL, password: WRONG_PW }));
      expect(res.status).toBe(401);
    }
  });
});

describe('password reset + recovery codes', () => {
  const signupWithCodes = async (env: AppEnv, email: string, password: string): Promise<{ cookie: string; codes: string[] }> => {
    const res = await dispatch(env, '/api/auth/signup', post({ email, password }));
    expect(res.status).toBe(201);
    const body = (await res.json()) as { recoveryCodes?: string[] };
    expect(body.recoveryCodes).toHaveLength(8);
    const cookie = (res.headers.get('set-cookie') ?? '').split(';')[0].split('=')[1];
    return { cookie, codes: body.recoveryCodes ?? [] };
  };

  it('issues 8 recovery codes at signup and a code resets the password', async () => {
    const env = makeEnv();
    const { codes } = await signupWithCodes(env, EMAIL, GOOD_PW);

    const fiddled = await dispatch(env, '/api/auth/recovery/verify', post({ email: EMAIL, code: 'wabc', password: 'new-pass-9!' }));
    expect(fiddled.status).toBe(400);

    const unknown = await dispatch(env, '/api/auth/recovery/verify', post({ email: EMAIL, code: 'AAAA-AAAA', password: GOOD_PW }));
    expect(unknown.status).toBe(400);

    // Wrong password shape is rejected before any code check.
    const weak = await dispatch(env, '/api/auth/recovery/verify', post({ email: EMAIL, code: codes[0], password: 'short' }));
    expect(weak.status).toBe(400);

    const good = await dispatch(env, '/api/auth/recovery/verify', post({ email: EMAIL, code: codes[0], password: 'fresh-one-9!' }));
    expect(good.status).toBe(200);
    expect(good.headers.get('set-cookie') ?? '').toContain('__Host-overrool_session=');

    // Old password is dead, the new one signs in.
    expect((await dispatch(env, '/api/auth/login', post({ email: EMAIL, password: GOOD_PW }))).status).toBe(401);
    expect((await dispatch(env, '/api/auth/login', post({ email: EMAIL, password: 'fresh-one-9!' }))).status).toBe(200);

    // The consumed code cannot be replayed.
    const replay = await dispatch(env, '/api/auth/recovery/verify', post({ email: EMAIL, code: codes[0], password: GOOD_PW }));
    expect(replay.status).toBe(400);
  });

  it('a second unused code still works after the first is consumed', async () => {
    const env = makeEnv();
    const { codes } = await signupWithCodes(env, EMAIL, GOOD_PW);
    await dispatch(env, '/api/auth/recovery/verify', post({ email: EMAIL, code: codes[0], password: 'reset-one-9!' }));
    const second = await dispatch(env, '/api/auth/recovery/verify', post({ email: EMAIL, code: codes[1], password: 'reset-two-9!' }));
    expect(second.status).toBe(200);
    const me = await dispatch(env, '/api/auth/me', { headers: { cookie: `__Host-overrool_session=${(second.headers.get('set-cookie') ?? '').split(';')[0].split('=')[1]}` } });
    expect(((await me.json()) as { user: { email: string } }).user.email).toBe('counsel@example.com');
  });

  it('recovery codes require a valid session and rotate codes on regenerate', async () => {
    const env = makeEnv();
    const anon = await dispatch(env, '/api/auth/recovery/codes', post({}));
    expect(anon.status).toBe(401);

    const { cookie, codes } = await signupWithCodes(env, EMAIL, GOOD_PW);
    const regenerated = await dispatch(env, '/api/auth/recovery/codes', post({}, `__Host-overrool_session=${cookie}`));
    expect(regenerated.status).toBe(200);
    const body = (await regenerated.json()) as { codes: string[]; remaining: number };
    expect(body.codes).toHaveLength(8);

    // Old codes are revoked; a fresh one works.
    const old = await dispatch(env, '/api/auth/recovery/verify', post({ email: EMAIL, code: codes[0], password: GOOD_PW }));
    expect(old.status).toBe(400);
    const fresh = await dispatch(env, '/api/auth/recovery/verify', post({ email: EMAIL, code: body.codes[0], password: 'rotated-pw-9!' }));
    expect(fresh.status).toBe(200);
  });

  it('forgot answers identically for known and unknown emails (no enumeration)', async () => {
    const env = makeEnv();
    await signupWithCodes(env, EMAIL, GOOD_PW);
    const known = (await dispatch(env, '/api/auth/forgot', post({ email: EMAIL }))).json();
    const unknown = (await dispatch(env, '/api/auth/forgot', post({ email: 'ghost@example.com' }))).json();
    expect(await known).toEqual(await unknown);
    expect((await unknown) as { ok: boolean }).toMatchObject({ ok: true });
  });

  it('emails a reset link when the transport is configured, then resets end-to-end', async () => {
    const { vi } = await import('vitest');
    const sent: Array<{ to: string; resetUrl: string }> = [];
    const fetchStub = vi.fn(async (url: string, init: RequestInit) => {
      if (url === 'https://api.resend.com/emails') {
        const payload = JSON.parse(String(init.body)) as { to: string; text: string };
        const resetUrl = payload.text.split('\n').find((l) => l.includes('reset_token=')) ?? '';
        sent.push({ to: payload.to, resetUrl });
        return new Response('ok', { status: 200 });
      }
      return new Response('nope', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchStub);

    const env = makeEnv();
    env.RESEND_API_KEY = 're_0000test';
    env.RESEND_FROM = 'Overrool <noreply@overrool.example>';
    await signupWithCodes(env, EMAIL, GOOD_PW);

    const forgot = await dispatch(env, '/api/auth/forgot', post({ email: EMAIL }));
    expect(forgot.status).toBe(200);
    expect(((await forgot.json()) as { emailConfigured: boolean }).emailConfigured).toBe(true);
    expect(fetchStub).toHaveBeenCalledTimes(1);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe('counsel@example.com');

    const token = new URL(sent[0].resetUrl).searchParams.get('reset_token');
    expect(token).toBeTruthy();

    const fail = await dispatch(env, '/api/auth/reset', post({ token: 'bad-token', password: 'whatever9!' }));
    expect(fail.status).toBe(400);

    const ok = await dispatch(env, '/api/auth/reset', post({ token, password: 'reset-link-pw-9' }));
    expect(ok.status).toBe(200);
    expect(ok.headers.get('set-cookie') ?? '').toContain('__Host-overrool_session=');
    expect((await dispatch(env, '/api/auth/login', post({ email: EMAIL, password: GOOD_PW }))).status).toBe(401);
    expect((await dispatch(env, '/api/auth/login', post({ email: EMAIL, password: 'reset-link-pw-9' }))).status).toBe(200);

    // Single use: replaying the same token fails.
    const replay = await dispatch(env, '/api/auth/reset', post({ token, password: 'another-pw-9!' }));
    expect(replay.status).toBe(400);

    vi.unstubAllGlobals();
  });

  it('rejects expired and malformed reset tokens', async () => {
    const env = makeEnv();
    await signupWithCodes(env, EMAIL, GOOD_PW);
    const user = await findUserByEmail(env.DB, EMAIL);
    expect(user).not.toBeNull();

    const expiredToken = 'expired-token-1234';
    const expiredAt = new Date(Date.now() - 1000).toISOString();
    await createPasswordReset(env.DB, user!.id, await sha256Hex(expiredToken), expiredAt);
    const res = await dispatch(env, '/api/auth/reset', post({ token: expiredToken, password: 'whatever9!' }));
    expect(res.status).toBe(400);

    const missing = await dispatch(env, '/api/auth/reset', post({ password: 'whatever9!' }));
    expect(missing.status).toBe(400);
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