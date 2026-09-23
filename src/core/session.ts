/**
 * Native-shell session bridging.
 *
 * The web path authenticates via the `__Host-overrool_session` HttpOnly cookie
 * (invisible to JavaScript). Native shells — Tauri/Capacitor webviews — have no
 * cookie jar. For those deployments the server echoes the raw `sessionToken` in
 * the auth/me response bodies and accepts it as an `Authorization: Bearer`
 * credential (see functions/lib/guard.ts — bearer-first, cookie fallback).
 *
 * This module captures that token, persists it under the SAME identity-scoped
 * secure ring the BYOK keys use (so user B's token never replays to user A on a
 * shared device), and exposes an `authHeaders()` helper that attaches the bearer
 * to every authenticated fetch.
 */
import { activeByokScope } from './storage';

const TOKEN_KEY = 'sessionToken';

interface NativeStoreLike {
  set: (key: string, value: string) => Promise<void>;
  get: (key: string) => Promise<string | null>;
  remove: (key: string) => Promise<void>;
}

let nativeStore: NativeStoreLike | null | undefined;

async function ring(): Promise<NativeStoreLike | null | undefined> {
  if (nativeStore !== undefined) return nativeStore;
  nativeStore = null;
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return (nativeStore = null);
    const { SecureStorage } = await import('@aparajita/capacitor-secure-storage');
    if (!SecureStorage) return (nativeStore = null);
    nativeStore = {
      set: async (k, v) => {
      await SecureStorage.set(k, v);
    },
      get: async (k) => {
        const v = await SecureStorage.get(k);
        return typeof v === 'string' ? v : null;
      },
      remove: async (k) => {
      await SecureStorage.remove(k);
    },
    };
  } catch {
    nativeStore = null;
  }
  return nativeStore;
}

/** Persists the raw session token for the current identity (secure ring when native; harmless no-op on web, where the cookie is the source of truth). */
export async function persistSessionToken(token: string): Promise<void> {
  const store = nativeStore ?? (await ring());
  if (!store) return;
  try {
    await store.set(`${activeByokScope()}:${TOKEN_KEY}`, token);
  } catch {
    /* secure ring unavailable — token stays in memory only */
  }
}

/** Loads the session token for the current identity, if any. */
export async function loadSessionToken(): Promise<string | null> {
  const store = nativeStore ?? (await ring());
  if (!store) return null;
  try {
    return await store.get(`${activeByokScope()}:${TOKEN_KEY}`);
  } catch {
    return null;
  }
}

/** Removes the session token for the current identity (on logout/account switch). */
export async function clearSessionToken(): Promise<void> {
  const store = nativeStore ?? (await ring());
  if (!store) return;
  try {
    await store.remove(`${activeByokScope()}:${TOKEN_KEY}`);
  } catch {
    /* best effort */
  }
}

/**
 * Returns headers that replay the persisted native token as a bearer. On web
 * (cookie path) this adds nothing — keep HTTP-only cookies as the transport so
 * we never touch the DOM-visible credential.
 */
export async function authHeaders(): Promise<Record<string, string> | null> {
  const token = await loadSessionToken();
  return token ? { authorization: `Bearer ${token}` } : null;
}
