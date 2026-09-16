import { beforeEach, describe, expect, it } from 'vitest';
import { createKeyManager, defaultModel, PROVIDERS } from './storage';
import type { LLMConfig } from '../types/legal';

const CONFIG: LLMConfig = { provider: 'gemini', apiKey: 'sk-test-key', model: 'gemini-2.5-flash' };

describe('createKeyManager (web)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('round-trips a config through memory and storage', async () => {
    const km = createKeyManager();
    await km.saveConfig(CONFIG);
    const loaded = await km.loadConfig();
    expect(loaded).toEqual(CONFIG);
  });

  it('persists to localStorage when persistence is on', async () => {
    const km = createKeyManager();
    await km.setPersist(true);
    await km.saveConfig(CONFIG);
    expect(localStorage.getItem('overrool.byok.session')).toBe(JSON.stringify(CONFIG));
    expect(sessionStorage.getItem('overrool.byok.session')).toBeNull();
  });

  it('writes to sessionStorage when persistence is off', async () => {
    const km = createKeyManager();
    await km.saveConfig(CONFIG);
    expect(sessionStorage.getItem('overrool.byok.session')).toBe(JSON.stringify(CONFIG));
    expect(localStorage.getItem('overrool.byok.session')).toBeNull();
  });

  it('regards the persist flag as a flag, never as config', async () => {
    localStorage.setItem('overrool.byok.session', JSON.stringify(CONFIG));
    localStorage.setItem('overrool.byok.persisted', '1');
    const km = createKeyManager();
    const loaded = await km.loadConfig();
    expect(loaded).toEqual(CONFIG);
    expect(km.getPersist()).toBe(true);
  });

  it('does not parse the bare persist marker as config', async () => {
    localStorage.removeItem('overrool.byok.session');
    sessionStorage.removeItem('overrool.byok.session');
    localStorage.setItem('overrool.byok.persisted', '1');
    const km = createKeyManager();
    expect(await km.loadConfig()).toBeNull();
    expect(km.getPersist()).toBe(true);
  });

  it('returns null for malformed stored JSON', async () => {
    localStorage.setItem('overrool.byok.session', '{not json');
    const km = createKeyManager();
    expect(await km.loadConfig()).toBeNull();
  });

  it('clearConfig wipes memory and both stores', async () => {
    const km = createKeyManager();
    await km.setPersist(true);
    await km.saveConfig(CONFIG);
    await km.clearConfig();
    expect(await km.loadConfig()).toBeNull();
    expect(localStorage.getItem('overrool.byok.session')).toBeNull();
    expect(localStorage.getItem('overrool.byok.persisted')).toBeNull();
    expect(sessionStorage.getItem('overrool.byok.session')).toBeNull();
  });

  it('keeps the session private to local storage even when persistence is toggled', async () => {
    const km = createKeyManager();
    await km.saveConfig(CONFIG);
    await km.setPersist(true);
    expect(localStorage.getItem('overrool.byok.session')).toBe(JSON.stringify(CONFIG));
    expect(sessionStorage.getItem('overrool.byok.session')).toBeNull();
    await km.setPersist(false);
    expect(localStorage.getItem('overrool.byok.session')).toBeNull();
    expect(sessionStorage.getItem('overrool.byok.session')).toBe(JSON.stringify(CONFIG));
  });

  it('remembers a config already loaded in memory after storage is cleared externally', async () => {
    const km = createKeyManager();
    await km.saveConfig(CONFIG);
    localStorage.removeItem('overrool.byok.session');
    sessionStorage.removeItem('overrool.byok.session');
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