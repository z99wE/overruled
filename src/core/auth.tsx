import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { RunState } from '../game/runStore';
import { byokScope, setByokScope } from './storage';

export interface AuthUser {
  email: string;
  createdAt?: string;
  role?: 'admin' | 'user';
}

type AuthStatus = 'loading' | 'ready';

interface AuthValue {
  user: AuthUser | null;
  status: AuthStatus;
  /** Creates an account; on success the session cookie is set and the user is returned. */
  signup: (email: string, password: string) => Promise<AuthUser>;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

const JSON_HEADERS = { 'content-type': 'application/json' };

async function postJson(path: string, body: unknown): Promise<{ user?: AuthUser; error?: string }> {
  const res = await fetch(path, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as { user?: AuthUser; error?: string };
  if (!res.ok) return { error: data.error ?? `Request failed (${res.status}).` };
  return { user: data.user };
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

  const signup = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    const result = await postJson('/api/auth/signup', { email: CANON(email), password });
    if (!result.user) throw new Error(result.error ?? 'Could not create account.');
    setUser(result.user);
    setByokScope(byokScope(result.user.email));
    return result.user;
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    const result = await postJson('/api/auth/login', { email: CANON(email), password });
    if (!result.user) throw new Error(result.error ?? 'Sign-in failed.');
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

  return (
    <AuthContext.Provider value={{ user, status, signup, login, logout }}>{children}</AuthContext.Provider>
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