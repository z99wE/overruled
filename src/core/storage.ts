import type { LLMConfig, LLMProvider } from '../types/legal';

/**
 * BYOK storage is IDENTITY-SCOPED so keys never bleed across accounts sharing
 * a device. The active scope is either 'anonymous' (signed out — the device
 * default) or a stable hash of the signed-in account's email. A key saved
 * under scoped identity A is never readable or billable by identity B.
 */
const KEY_PERSISTED = 'overrool.byok.persisted';
/** Legacy key from before identity scoping — migrated once into the anonymous
 * (device-owner) scope and then deleted. Never inherited by an account. */
const LEGACY_SESSION = 'overrool.byok.session';
const SCOPE_ANONYMOUS = 'anonymous';

function hashScope(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

/** Stable per-identity storage scope. The email is never stored in the key. */
export function byokScope(email: string | null | undefined): string {
  if (!email) return SCOPE_ANONYMOUS;
  return `email-${hashScope(email.trim().toLowerCase())}`;
}

let activeScope: string = SCOPE_ANONYMOUS;

/** Switch the identity all KeyManagers read/write under. Call on auth change. */
export function setByokScope(scope: string): void {
  activeScope = scope;
}

function configKey(scope: string): string {
  return `overrool.byok.${scope}.config`;
}

interface NativeStore {
  set: (key: string, value: string) => Promise<void>;
  get: (key: string) => Promise<string | null>;
  remove: (key: string) => Promise<void>;
}

let nativeSecure: NativeStore | undefined;

async function loadNativeSecureStorage(): Promise<NativeStore | undefined> {
  if (nativeSecure) return nativeSecure;
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return undefined;
    const { SecureStorage } = await import('@aparajita/capacitor-secure-storage');
    const store = SecureStorage as unknown as {
      set: (key: string, value: string) => Promise<unknown>;
      get: (key: string) => Promise<unknown>;
      remove: (key: string) => Promise<unknown>;
    };
    nativeSecure = {
      set: (k, v) => store.set(k, v) as Promise<void>,
      get: async (k) => {
        const val = await store.get(k);
        return typeof val === 'string' || val === null ? val : val === undefined ? null : String(val);
      },
      remove: (k) => store.remove(k) as Promise<void>,
    };
    return nativeSecure;
  } catch {
    return undefined;
  }
}

function webRead(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function webWrite(key: string, value: string, persist: boolean): void {
  try {
    const target = persist ? localStorage : sessionStorage;
    target.setItem(key, value);
    (persist ? sessionStorage : localStorage).removeItem(key);
  } catch {
    /* storage unavailable — BYOK key stays in memory only */
  }
}

export interface KeyManager {
  saveConfig(config: LLMConfig): Promise<void>;
  loadConfig(): Promise<LLMConfig | null>;
  clearConfig(): Promise<void>;
  setPersist(persist: boolean): Promise<void>;
  getPersist(): boolean;
}

export function createKeyManager(): KeyManager {
  let memory: LLMConfig | null = null;
  let memoryScope: string | null = null;

  return {
    async saveConfig(config) {
      const scope = activeScope;
      memory = config;
      memoryScope = scope;
      const native = await loadNativeSecureStorage();
      if (native) {
        await native.set(configKey(scope), JSON.stringify(config));
        return;
      }
      webWrite(configKey(scope), JSON.stringify(config), this.getPersist());
    },

    async loadConfig() {
      const scope = activeScope;
      if (memoryScope === scope && memory) return memory;
      memory = null;
      memoryScope = null;

      const raw = await readScoped(scope);
      if (!raw) {
        // One-time upgrade: adopt a pre-scoping key into the ANONYMOUS
        // (signed-out) scope only. Accounts never inherit it, so two users
        // signing in on the same device still cannot see each other's key.
        if (scope === SCOPE_ANONYMOUS) {
          const legacy = await readLegacy();
          if (legacy) {
            const native = await loadNativeSecureStorage();
            if (native) {
              await native.set(configKey(scope), legacy);
              await native.remove(LEGACY_SESSION);
            } else {
              const persist = this.getPersist();
              webWrite(configKey(scope), legacy, persist);
              removeBoth(LEGACY_SESSION);
            }
            memory = parseConfig(legacy);
            memoryScope = scope;
            return memory;
          }
        }
        return null;
      }
      memory = parseConfig(raw);
      memoryScope = scope;
      return memory;
    },

    async clearConfig() {
      const scope = activeScope;
      memory = null;
      memoryScope = null;
      const native = await loadNativeSecureStorage();
      if (native) {
        await native.remove(configKey(scope));
        return;
      }
      removeBoth(configKey(scope));
      removeBoth(KEY_PERSISTED);
    },

    async setPersist(persist) {
      try {
        if (persist) {
          localStorage.setItem(KEY_PERSISTED, '1');
        } else {
          localStorage.removeItem(KEY_PERSISTED);
        }
      } catch {
        /* noop */
      }
      if (memory) {
        const native = await loadNativeSecureStorage();
        if (native) {
          await native.set(configKey(memoryScope ?? activeScope), JSON.stringify(memory));
        } else {
          webWrite(configKey(memoryScope ?? activeScope), JSON.stringify(memory), persist);
        }
      }
    },

    getPersist() {
      try {
        return localStorage.getItem(KEY_PERSISTED) === '1';
      } catch {
        return false;
      }
    },
  };
}

function parseConfig(raw: string): LLMConfig | null {
  try {
    return JSON.parse(raw) as LLMConfig;
  } catch {
    return null;
  }
}

function removeBoth(key: string): void {
  try {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  } catch {
    /* noop */
  }
}

async function readScoped(scope: string): Promise<string | null> {
  const native = await loadNativeSecureStorage();
  if (native) {
    const val = await native.get(configKey(scope));
    return val;
  }
  return webRead(configKey(scope));
}

async function readLegacy(): Promise<string | null> {
  const native = await loadNativeSecureStorage();
  if (native) {
    const val = await native.get(LEGACY_SESSION);
    return val;
  }
  return webRead(LEGACY_SESSION);
}

const MODEL_DEFAULTS: Record<LLMProvider, string> = {
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-latest',
  groq: 'llama-3.3-70b-versatile',
  hosted: '@cf/meta/llama-3.1-8b-instruct',
};

export const PROVIDERS: Array<{ id: LLMProvider; label: string; envHint: string }> = [
  { id: 'gemini', label: 'Google Gemini', envHint: 'GEMINI_API_KEY' },
  { id: 'openai', label: 'OpenAI', envHint: 'OPENAI_API_KEY' },
  { id: 'anthropic', label: 'Anthropic Claude', envHint: 'ANTHROPIC_API_KEY' },
  { id: 'groq', label: 'Groq', envHint: 'GROQ_API_KEY' },
];

/** Same-origin server inference (Cloudflare Workers AI). Shown only to the admin. */
export const HOSTED_ENTRY = { id: 'hosted', label: 'Hosted (Cloudflare)', envHint: 'Server-side · no key needed' } as const;

/** True when the given provider never needs a local API key. */
export function isHostedProvider(provider: LLMProvider): boolean {
  return provider === 'hosted';
}

export function defaultModel(provider: LLMProvider): string {
  return MODEL_DEFAULTS[provider];
}