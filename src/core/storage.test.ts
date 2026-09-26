import { beforeEach, describe, expect, it } from 'vitest';
import { byokScope, createKeyManager, defaultModel, PROVIDERS, setByokScope } from './storage';
import type { LLMConfig } from '../types/legal';

const CONFIG: LLMConfig = { provider: 'gemini', apiKey: 'sk-test-key', model: 'gemini-2.5-flash' };
const CONFIG_B: LLMConfig = { provider: 'openai', apiKey: 'sk-test-key-b', model: 'gpt-4o-mini' };

const ANON_KEY = 'overrool.byok.anonymous.config';
const LEGACY_KEY = 'overrool.byok.session';

describe('createKeyManager (web)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    setByokScope(byokScope(null));
  });

  it('round-trips a config through memory and storage', async () => {
    const km = createKeyManager();
    await km.saveConfig(CONFIG);
    const loaded = await km.loadConfig();
    expect(loaded).toEqual(CONFIG);
  });

  it('persists to localStorage under the anonymous scope when persistence is on', async () => {
    const km = createKeyManager();
    await km.setPersist(true);
    await km.saveConfig(CONFIG);
    expect(localStorage.getItem(ANON_KEY)).toBe(JSON.stringify(CONFIG));
    expect(sessionStorage.getItem(ANON_KEY)).toBeNull();
  });

  it('writes to sessionStorage when persistence is off', async () => {
    const km = createKeyManager();
    await km.saveConfig(CONFIG);
    expect(sessionStorage.getItem(ANON_KEY)).toBe(JSON.stringify(CONFIG));
    expect(localStorage.getItem(ANON_KEY)).toBeNull();
  });

  it('regards the persist flag as a flag, never as config', async () => {
    localStorage.setItem(ANON_KEY, JSON.stringify(CONFIG));
    localStorage.setItem('overrool.byok.persisted', '1');
    const km = createKeyManager();
    const loaded = await km.loadConfig();
    expect(loaded).toEqual(CONFIG);
    expect(km.getPersist()).toBe(true);
  });

  it('does not parse the bare persist marker as config', async () => {
    localStorage.removeItem(ANON_KEY);
    sessionStorage.removeItem(ANON_KEY);
    localStorage.setItem('overrool.byok.persisted', '1');
    const km = createKeyManager();
    expect(await km.loadConfig()).toBeNull();
    expect(km.getPersist()).toBe(true);
  });

  it('returns null for malformed stored JSON', async () => {
    localStorage.setItem(ANON_KEY, '{not json');
    const km = createKeyManager();
    expect(await km.loadConfig()).toBeNull();
  });

  it('clearConfig wipes memory and both stores', async () => {
    const km = createKeyManager();
    await km.setPersist(true);
    await km.saveConfig(CONFIG);
    await km.clearConfig();
    expect(await km.loadConfig()).toBeNull();
    expect(localStorage.getItem(ANON_KEY)).toBeNull();
    expect(localStorage.getItem('overrool.byok.persisted')).toBeNull();
    expect(sessionStorage.getItem(ANON_KEY)).toBeNull();
  });

  it('keeps the session private to local storage even when persistence is toggled', async () => {
    const km = createKeyManager();
    await km.saveConfig(CONFIG);
    await km.setPersist(true);
    expect(localStorage.getItem(ANON_KEY)).toBe(JSON.stringify(CONFIG));
    expect(sessionStorage.getItem(ANON_KEY)).toBeNull();
    await km.setPersist(false);
    expect(localStorage.getItem(ANON_KEY)).toBeNull();
    expect(sessionStorage.getItem(ANON_KEY)).toBe(JSON.stringify(CONFIG));
  });

  it('remembers a config already loaded in memory after storage is cleared externally', async () => {
    const km = createKeyManager();
    await km.saveConfig(CONFIG);
    localStorage.removeItem(ANON_KEY);
    sessionStorage.removeItem(ANON_KEY);
    expect(await km.loadConfig()).toEqual(CONFIG);
  });

  it('stores the four documented providers with default models', () => {
    expect(PROVIDERS.map((p) => p.id)).toEqual(['gemini', 'openai', 'anthropic', 'groq']);
    for (const p of PROVIDERS) {
      expect(typeof defaultModel(p.id)).toBe('string');
      expect(defaultModel(p.id).length).toBeGreaterThan(0);
    }
  });
});

describe('identity-scoped BYOK isolation', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    setByokScope(byokScope(null));
  });

  it('scopes keys per account so user 2 never reads user 1\u2019s key', async () => {
    const alice = byokScope('alice@example.com');
    const bob = byokScope('bob@example.com');

    setByokScope(alice);
    const kmA = createKeyManager();
    await kmA.saveConfig(CONFIG);
    expect(await kmA.loadConfig()).toEqual(CONFIG);

    setByokScope(bob);
    const kmB = createKeyManager();
    expect(await kmB.loadConfig()).toBeNull();
    expect(localStorage.getItem(`overrool.byok.${bob}.config`)).toBeNull();
    await kmB.saveConfig(CONFIG_B);
    expect(await kmB.loadConfig()).toEqual(CONFIG_B);

    // Alice's key is untouched by Bob's save/clear.
    setByokScope(alice);
    const kmA2 = createKeyManager();
    expect(await kmA2.loadConfig()).toEqual(CONFIG);
    expect(sessionStorage.getItem(`overrool.byok.${alice}.config`)).toBe(JSON.stringify(CONFIG));
    expect(sessionStorage.getItem(`overrool.byok.${bob}.config`)).toBe(JSON.stringify(CONFIG_B));

    // Bob clears only his own, under his own scope.
    setByokScope(bob);
    await kmB.clearConfig();
    expect(sessionStorage.getItem(`overrool.byok.${bob}.config`)).toBeNull();
    setByokScope(alice);
    expect(sessionStorage.getItem(`overrool.byok.${alice}.config`)).toBe(JSON.stringify(CONFIG));
  });

  it('a signed-in account never inherits the signed-out device key', async () => {
    setByokScope(byokScope(null));
    const kmAnon = createKeyManager();
    await kmAnon.saveConfig(CONFIG);

    setByokScope(byokScope('carol@example.com'));
    const kmCarol = createKeyManager();
    expect(await kmCarol.loadConfig()).toBeNull();
  });

  it('scoped memory is discarded when the identity switches mid-session', async () => {
    setByokScope(byokScope(null));
    const km = createKeyManager();
    await km.saveConfig(CONFIG);
    expect(await km.loadConfig()).toEqual(CONFIG);

    setByokScope(byokScope('dave@example.com'));
    expect(await km.loadConfig()).toBeNull();

    setByokScope(byokScope(null));
    expect(await km.loadConfig()).toEqual(CONFIG);
  });

  it('migrates a legacy device key into the anonymous scope exactly once', async () => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify(CONFIG));
    const km = createKeyManager();
    expect(await km.loadConfig()).toEqual(CONFIG);
    expect(localStorage.getItem(LEGACY_KEY)).toBeNull();
    expect(sessionStorage.getItem(LEGACY_KEY)).toBeNull();
    // Persistence defaults off, so the migrated copy lands in session storage.
    expect(sessionStorage.getItem(ANON_KEY)).toBe(JSON.stringify(CONFIG));

    // A second, signed-in user does not inherit the migrated device key.
    setByokScope(byokScope('erin@example.com'));
    const kmErin = createKeyManager();
    expect(await kmErin.loadConfig()).toBeNull();
  });
});
describe('provider model defaults', () => {
  // Both of these were silently dead: gemini-2.5-flash 404s for new Google keys
  // ("no longer available to new users") and llama-3.3-70b-versatile 404s on
  // every current Groq account. A retired default fails on a user's FIRST click,
  // so treat any change here as requiring a live re-check:
  //   LIVE_PROVIDER=groq npm run live:check
  it('pins currently-servable defaults for the providers we have keys for', () => {
    expect(defaultModel('gemini')).toBe('gemini-3.8-flash');
    expect(defaultModel('groq')).toBe('openai/gpt-oss-120b');
  });

  it('never ships an empty model id', () => {
    for (const p of PROVIDERS) {
      expect(defaultModel(p.id).trim().length).toBeGreaterThan(0);
    }
  });
});
