import type { LLMConfig, LLMProvider } from '../types/legal';

const KEY_SESSION = 'overrool.byok.session';
const KEY_PERSISTED = 'overrool.byok.persisted';

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

  return {
    async saveConfig(config) {
      memory = config;
      const native = await loadNativeSecureStorage();
      if (native) {
        await native.set(KEY_SESSION, JSON.stringify(config));
        return;
      }
      webWrite(KEY_SESSION, JSON.stringify(config), this.getPersist());
    },

    async loadConfig() {
      if (memory) return memory;
      const native = await loadNativeSecureStorage();
      if (native) {
        const raw = await native.get(KEY_SESSION);
        if (!raw) return null;
        try {
          memory = JSON.parse(raw) as LLMConfig;
          return memory;
        } catch {
          return null;
        }
      }
      const raw = webRead(KEY_SESSION);
      if (!raw) return null;
      try {
        memory = JSON.parse(raw) as LLMConfig;
        return memory;
      } catch {
        return null;
      }
    },

    async clearConfig() {
      memory = null;
      const native = await loadNativeSecureStorage();
      if (native) {
        await native.remove(KEY_SESSION);
        return;
      }
      try {
        sessionStorage.removeItem(KEY_SESSION);
        localStorage.removeItem(KEY_SESSION);
        localStorage.removeItem(KEY_PERSISTED);
      } catch {
        /* noop */
      }
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
          await native.set(KEY_SESSION, JSON.stringify(memory));
        } else {
          webWrite(KEY_SESSION, JSON.stringify(memory), persist);
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