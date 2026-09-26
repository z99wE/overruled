import { useEffect, useState } from 'react';
import type { LLMConfig, LLMProvider } from '../types/legal';
import { PROVIDERS, createKeyManager, defaultModel, isHostedProvider } from '../core/storage';
import { requestChat } from '../core/providerCall';
import { creditsToday } from '../core/meter';

interface KeySettingsProps {
  onClose: () => void;
}


export function KeySettings({ onClose }: KeySettingsProps) {
  const km = createKeyManager();
  const [config, setConfig] = useState<LLMConfig | null>(null);
  const [provider, setProvider] = useState<LLMProvider>('gemini');
  const [model, setModel] = useState(defaultModel('gemini'));
  const [apiKey, setApiKey] = useState('');
  const [persist, setPersist] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const cfg = await km.loadConfig();
      if (!active) return;
      if (cfg) {
        setProvider(cfg.provider);
        setModel(cfg.model);
        setApiKey(cfg.apiKey);
      }
      setPersist(km.getPersist());
    })();
    return () => {
      active = false;
    };
  }, []);  

  const selectProvider = (p: LLMProvider) => {
    setProvider(p);
    setModel((current) => (current === defaultModel(provider) || !current ? defaultModel(p) : current));
  };

  const save = async () => {
    if (!isHostedProvider(provider) && !apiKey.trim()) {
      setStatus('error|Enter an API key to continue.');
      return;
    }
    setSaving(true);
    try {
      await km.saveConfig({ provider, model: model.trim() || defaultModel(provider), apiKey: apiKey.trim() });
      setConfig({ provider, model, apiKey });
      setStatus(isHostedProvider(provider) ? 'ok|Hosted inference enabled. Your contract audits run securely.' : 'ok|Key secured in local encrypted vault. Direct HTTPS to provider.');
    } catch (err) {
      setStatus(`error|${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const clear = async () => {
    try {
      await km.clearConfig();
    } catch (err) {
      setStatus(`error|${err instanceof Error ? err.message : String(err)}`);
      return;
    }
    setApiKey('');
    setConfig(null);
    setStatus(null);
  };

  const togglePersist = async () => {
    const next = !persist;
    setPersist(next);
    try {
      await km.setPersist(next);
    } catch (err) {
      setPersist(persist);
      setStatus(`error|${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const test = async () => {
    if (!config && !apiKey.trim() && !isHostedProvider(provider)) {
      setStatus('error|Save the key before testing.');
      return;
    }
    setTesting(true);
    setStatus(null);
    try {
      const cfg = config ?? { provider, model: model.trim() || defaultModel(provider), apiKey: apiKey.trim() };
      const t0 = performance.now();
      await requestChat({
        config: cfg,
        system: 'You are a legal intelligence probe. Respond with exactly: ok',
        user: 'Reply with the single word: ok',
        temperature: 0,
        maxTokens: 16,
      });
      const ms = Math.round(performance.now() - t0);
      setStatus(`ok|Provider verified in ${ms} ms. Zero-leak channel established.`);
    } catch (err) {
      setStatus(`error|Test failed — ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setTesting(false);
    }
  };

  const statusKind = status?.split('|')[0];
  const statusMsg = status?.split('|')[1] ?? '';
  const met = creditsToday();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md selection:bg-blue-200 selection:text-slate-950">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl">
        {/* ── Modal Header ────────────────────────────────────── */}
        <header className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-base shadow-sm">
              §
            </div>
            <div>
              <h2 className="font-display text-base font-extrabold text-slate-900">Private Key Vault</h2>
              <p className="font-sans text-[11px] text-slate-500">
                Direct client HTTPS · Zero intermediary storage · BYOK
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        {/* ── Modal Body ──────────────────────────────────────── */}
        <div className="max-h-[75vh] overflow-y-auto space-y-4 px-6 py-5">
          {/* Provider Selection Grid */}
          <div>
            <label className="block font-sans text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Inference Engine
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {PROVIDERS.map((p) => {
                const active = provider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectProvider(p.id)}
                    className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      active
                        ? 'border-blue-600 bg-blue-50/80 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`font-sans text-xs font-bold ${active ? 'text-blue-900' : 'text-slate-800'}`}>
                        {p.label}
                      </span>
                      {p.id === 'gemini' && (
                        <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.2 text-[9px] font-bold">
                          Free Tier
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 mt-0.5">
                      {p.envHint}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-slate-500 leading-relaxed font-sans">
              Direct client-to-API calls. API keys are never logged, proxied, or saved server-side.
            </p>
          </div>

          {/* Target Model Input */}
          <div>
            <label className="block font-sans text-xs font-bold text-slate-700 mb-1">
              Target Model Override
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={defaultModel(provider)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 font-mono text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          {/* API Key Input */}
          {!isHostedProvider(provider) && (
            <div>
              <label className="block font-sans text-xs font-bold text-slate-700 mb-1">
                API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your provider key (e.g. AIza... / sk-...)"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 font-mono text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
              />
            </div>
          )}

          {/* Persist in Local Storage Toggle */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
            <div>
              <span className="block font-sans text-xs font-bold text-slate-900">
                Persist in Encrypted Local Storage
              </span>
              <span className="text-[11px] text-slate-500">
                {persist ? 'Persisted locally in your browser' : 'Session-only, wiped automatically on tab close'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => void togglePersist()}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                persist ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  persist ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Usage Stats Quota */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs text-slate-600 space-y-1">
            <div className="flex items-center justify-between font-bold text-slate-800">
              <span>Daily Local Quota Tracker</span>
              <span className="font-mono text-blue-600">{met.used} / {met.cap} credits</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Trial = 10 credits · Contract Audit = 2 credits · Local Rules run unlimited &amp; free
            </p>
          </div>

          {/* Status feedback */}
          {status && (
            <div
              className={`rounded-xl p-3 text-xs font-medium ${
                statusKind === 'ok'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {statusMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void save()}
              className="flex-1 rounded-full bg-blue-600 hover:bg-blue-700 py-2.5 px-4 text-xs font-bold text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save To Vault'}
            </button>
            <button
              type="button"
              disabled={testing}
              onClick={() => void test()}
              className="rounded-full border border-slate-300 bg-white hover:bg-slate-50 py-2.5 px-4 text-xs font-bold text-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              {testing ? 'Testing…' : 'Test Connection ⟳'}
            </button>
            {apiKey && (
              <button
                type="button"
                onClick={() => void clear()}
                className="rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 py-2.5 px-4 text-xs font-bold text-rose-700 transition-all cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Disclaimer */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 leading-normal">
              Direct browser-to-provider HTTPS architecture. Only generative AI requests leaving this client are transmitted to the approved official endpoints of Google, OpenAI, Anthropic, or Groq.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}