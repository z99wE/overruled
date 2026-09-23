import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { RunState } from '../game/runStore';
import { byokScope, setByokScope } from './storage';
import { authHeaders, persistSessionToken } from './session';

export interface AuthUser {
  email: string;
  createdAt?: string;
  role?: 'admin' | 'user';
  newsletterOptin?: boolean;
}

type AuthStatus = 'loading' | 'ready';

interface AuthValue {
  user: AuthUser | null;
  status: AuthStatus;
  /** Creates an account; on success the session cookie is set and the user is returned. */
  signup: (email: string, password: string, newsletter?: boolean) => Promise<{ user: AuthUser; recoveryCodes: string[] }>;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  /** Starts an email-based password reset. Resolves `emailConfigured` so the UI can offer recovery codes. */
  requestReset: (email: string) => Promise<{ ok: boolean; emailConfigured: boolean }>;
  /** Consumes a reset token and signs straight in with a fresh session. */
  resetPassword: (token: string, password: string) => Promise<AuthUser>;
  /** Generates a new set of one-time recovery codes (signed in). */
  generateRecoveryCodes: () => Promise<{ codes: string[]; remaining: number }>;
  /** Toggles the in-app AI Briefing subscription (signed in). */
  setNewsletterOptin: (optin: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

const JSON_HEADERS = { 'content-type': 'application/json' };

type ApiResult = {
  user?: AuthUser;
  error?: string;
  retryAfterSeconds?: number;
  sessionToken?: string;
  recoveryCodes?: string[];
  newsletterOptin?: boolean;
  emailConfigured?: boolean;
  codes?: string[];
  remaining?: number;
};

async function postJson(path: string, body: unknown): Promise<ApiResult> {
  const headers = { ...JSON_HEADERS, ...((await authHeaders()) ?? {}) };
  const res = await fetch(path, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as ApiResult;
  const token = data.sessionToken ?? ((data as { sessionToken?: string }).sessionToken);
  if (typeof token === 'string' && token) await persistSessionToken(token);
  if (!res.ok) return { error: data.error ?? `Request failed (${res.status}).`, retryAfterSeconds: data.retryAfterSeconds };
  return data;
}

const CANON = (email: string) => email.trim().toLowerCase();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const booted = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { headers: { accept: 'application/json' } });
      const data = (await res.json().catch(() => ({}))) as { user?: AuthUser | null };
      setUser(data.user ?? null);
      setByokScope(data.user ? byokScope(data.user.email) : byokScope(null));
    } catch {
      setUser(null);
      setByokScope(byokScope(null));
    } finally {
      setStatus('ready');
    }
  }, []);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    void refresh();
  }, [refresh]);

  const signup = useCallback(
    async (email: string, password: string, newsletter = false): Promise<{ user: AuthUser; recoveryCodes: string[] }> => {
      const result = await postJson('/api/auth/signup', { email: CANON(email), password, newsletter });
      if (!result.user) throw new Error(result.error ?? 'Could not create account.');
      setUser(result.user);
      setByokScope(byokScope(result.user.email));
      return { user: result.user, recoveryCodes: result.recoveryCodes ?? [] };
    },
    [],
  );

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    const result = await postJson('/api/auth/login', { email: CANON(email), password });
    if (!result.user) {
      const retry = result.retryAfterSeconds ? `Try again in ${result.retryAfterSeconds}s.` : '';
      throw new Error(result.error ? `${result.error}${retry ? ` ${retry}` : ''}` : 'Sign-in failed.');
    }
    setUser(result.user);
    setByokScope(byokScope(result.user.email));
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      /* best effort — clear locally regardless */
    }
    setUser(null);
    setByokScope(byokScope(null));
  }, []);

  const requestReset = useCallback(async (email: string): Promise<{ ok: boolean; emailConfigured: boolean }> => {
    const result = await postJson('/api/auth/forgot', { email: CANON(email) });
    if (result.error) throw new Error(result.error);
    return { ok: true, emailConfigured: result.emailConfigured ?? false };
  }, []);

  const resetPassword = useCallback(async (token: string, password: string): Promise<AuthUser> => {
    const result = await postJson('/api/auth/reset', { token, password });
    if (!result.user) throw new Error(result.error ?? 'This reset link is invalid or has expired.');
    setUser(result.user);
    setByokScope(byokScope(result.user.email));
    return result.user;
  }, []);

  const generateRecoveryCodes = useCallback(async (): Promise<{ codes: string[]; remaining: number }> => {
    const result = await postJson('/api/auth/recovery/codes', {});
    if (result.error) throw new Error(result.error);
    return { codes: result.codes ?? [], remaining: result.remaining ?? 0 };
  }, []);

  const setNewsletterOptin = useCallback(async (optin: boolean): Promise<void> => {
    const result = await postJson('/api/preferences', { newsletter: optin });
    if (result.error) throw new Error(result.error);
    setUser((prev) => (prev ? { ...prev, newsletterOptin: optin } : prev));
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, signup, login, logout, requestReset, resetPassword, generateRecoveryCodes, setNewsletterOptin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>.');
  return ctx;
}

// ---------------------------------------------------------------------------
// Account-scoped game-progress sync. The BYOK keys never travel here — only
// the portable RunState (chips, XP, jokers, boss progress) crosses the wire.
// ---------------------------------------------------------------------------

export async function pullRemoteRun(): Promise<RunState | null> {
  try {
    const res = await fetch('/api/run', { headers: { accept: 'application/json' } });
    if (!res.ok) return null;
    const data = (await res.json()) as { run?: RunState | null };
    return data.run ?? null;
  } catch {
    return null;
  }
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;

export function enqueueRemoteSave(run: RunState): void {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    void fetch('/api/run', {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify({ run }),
    }).catch(() => undefined);
  }, 800);
}