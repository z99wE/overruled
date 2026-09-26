import { useEffect, useState } from 'react';
import { Check, Cloud, KeyRound, Loader2, Lock, ShieldCheck, Trash2, X } from 'lucide-react';
import type { LLMConfig, LLMProvider } from '../types/legal';
import { PROVIDERS, HOSTED_ENTRY, createKeyManager, defaultModel, isHostedProvider } from '../core/storage';
import { requestChat } from '../core/providerCall';
import { useAuth } from '../core/auth';
import { CREDIT_COSTS, creditsToday } from '../core/meter';

interface KeySettingsProps {
  onClose: () => void;
}

const labelFor = (p: LLMProvider): string => PROVIDERS.find((x) => x.id === p)?.label ?? HOSTED_ENTRY.label;

export function KeySettings({ onClose }: KeySettingsProps) {
  const { user } = useAuth();
  const admin = user?.role === 'admin';
  const km = createKeyManager();
  const [config, setConfig] = useState<LLMConfig | null>(null);
  const [provider, setProvider] = useState<LLMProvider>('gemini');
  const [model, setModel] = useState(defaultModel('gemini'));
  const [apiKey, setApiKey] = useState('');
  const [persist, setPersist] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

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
      setLoaded(true);
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
      setStatus(isHostedProvider(provider) ? 'ok|Hosted inference enabled. Your trials run through the Overrool server.' : 'ok|Key secured in local vault. Direct HTTPS to provider.');
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
        system: 'You are a connectivity probe. Respond with exactly: ok',
        user: 'Reply with the single word: ok',
        temperature: 0,
        maxTokens: 16,
      });
      const ms = Math.round(performance.now() - t0);
      setStatus(`ok|Provider responded in ${ms} ms. Key is valid.`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm selection:bg-amber-400 selection:text-black">
      <div className="w-full max-w-lg overflow-hidden neo-card-elevated bg-slate-900 border-2 border-black shadow-[8px_8px_0_#000]">
        {/* ── Modal Header ────────────────────────────────────── */}
        <header className="flex items-center justify-between border-b-2 border-black bg-slate-950 px-5 py-4 shadow-[0_2px_0_#000]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-amber-400 text-black shadow-[2px_2px_0_#000]">
              <KeyRound className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="font-display text-sm uppercase tracking-wider text-white">KEY VAULT</h2>
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
                BRING YOUR OWN KEY · ZERO-KNOWLEDGE DIRECT HTTPS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="neo-btn neo-btn-dark px-2 py-1"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* ── Modal Body ──────────────────────────────────────── */}
        <div className="max-h-[80vh] overflow-y-auto space-y-4 px-6 py-5">
          {!loaded && (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
            </div>
          )}
          {loaded && (
            <>
              {/* Provider Selection Grid */}
              <div>
                <label className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Select Provider Engine
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[...PROVIDERS, ...(admin ? [HOSTED_ENTRY] : [])].map((p) => {
                    const selected = provider === p.id;
                    return (
                      <button
                        aria-label={`Use ${p.label} as provider`}
                        key={p.id}
                        type="button"
                        onClick={() => selectProvider(p.id)}
                        aria-pressed={selected}
                        className={`rounded-lg border-2 text-left p-3 transition-all ${
                          selected
                            ? 'border-black bg-amber-400 text-black shadow-[3px_3px_0_#000]'
                            : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-600 shadow-[2px_2px_0_#000]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-display text-xs">
                            {p.label}
                          </span>
                          {p.id === 'gemini' && (
                            <span className="neo-badge neo-badge-chrome text-[7px]">Free Tier</span>
                          )}
                        </div>
                        <span className={`block mt-1 font-mono text-[9px] ${selected ? 'text-black/80 font-bold' : 'text-slate-500'}`}>
                          {p.envHint}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 font-mono text-[10px] leading-relaxed text-slate-400">
                  Zero per-user cost. Direct client-to-API calls. Keys are never logged, proxied, or saved server-side.
                </p>
              </div>

              {/* Model ID Input */}
              <div>
                <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Target Model Override
                </label>
                <input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={defaultModel(provider)}
                  className="neo-input font-mono text-xs"
                />
              </div>

              {/* API Key Input */}
              {!isHostedProvider(provider) && (
                <>
                  <div>
                    <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      API Key
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Paste your provider key (e.g. gsk_… / sk-…)…"
                        autoComplete="off"
                        className="neo-input pl-9 font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* Persist across sessions */}
                  <div className="flex items-center justify-between gap-3 rounded-lg border-2 border-black bg-slate-950 p-3 shadow-[2px_2px_0_#000]">
                    <div>
                      <p className="font-display text-xs text-white">Persist in Local Storage</p>
                      <p className="font-mono text-[10px] text-slate-400">
                        {persist ? 'Stored in encrypted/local client storage' : 'Session-only, wiped on tab close'}
                      </p>
                    </div>
                    <button
                      aria-label="Persist API key across sessions"
                      type="button"
                      role="switch"
                      aria-checked={persist}
                      onClick={() => void togglePersist()}
                      className={`relative h-6 w-11 rounded-full border-2 border-black transition-colors ${
                        persist ? 'bg-amber-400' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-black transition-transform ${
                          persist ? 'translate-x-[20px]' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </>
              )}

              {/* Status Message */}
              {status && (
                <div
                  className={`rounded-lg border-2 border-black p-3 font-mono text-[11px] font-bold shadow-[2px_2px_0_#000] ${
                    statusKind === 'ok'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                      : 'bg-rose-950 text-rose-300 border-rose-500'
                  }`}
                >
                  {statusMsg}
                </div>
              )}

              {/* Active Config Status */}
              {config && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-950/20 p-2.5 font-mono text-xs text-amber-300">
                  <ShieldCheck className="h-4 w-4 text-amber-400" />
                  <span>ARMED: {labelFor(config.provider)} ({config.model})</span>
                </div>
              )}

              {/* Credits Usage */}
              <div className="rounded-lg border-2 border-black bg-slate-950 p-3 shadow-[2px_2px_0_#000]">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase font-bold text-slate-400">
                  <span>Daily Quota Tracker</span>
                  <span className="text-amber-400">{met.used} / {met.cap} credits</span>
                </div>
                <p className="mt-1 font-mono text-[9px] text-slate-500">
                  Trial = {CREDIT_COSTS.trial} credits · Desk Op = {CREDIT_COSTS.deskOp} credits · Local Rules run unlimited &amp; free
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  aria-label="Save key to vault"
                  type="button"
                  onClick={() => void save()}
                  disabled={saving}
                  className="neo-btn neo-btn-primary flex-1 py-2.5 text-xs"
                >
                  {saving ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : isHostedProvider(provider) ? (
                    <Cloud className="mr-1.5 h-3.5 w-3.5" />
                  ) : (
                    <Lock className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {isHostedProvider(provider) ? 'Enable Hosted' : 'Save To Vault'}
                </button>

                <button
                  aria-label="Test API key connection"
                  type="button"
                  onClick={() => void test()}
                  disabled={testing}
                  className="neo-btn neo-btn-chrome px-4 py-2.5 text-xs"
                >
                  {testing ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1 h-3.5 w-3.5" />}
                  Test Connection
                </button>

                <button
                  aria-label="Clear stored API key"
                  type="button"
                  onClick={() => void clear()}
                  className="neo-btn neo-btn-crimson px-3.5 py-2.5 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Security guarantee note */}
              <p className="font-mono text-[9px] leading-relaxed text-slate-500">
                {isHostedProvider(provider)
                  ? 'Hosted inference executes through Cloudflare Workers AI with admin privileges.'
                  : `Direct browser-to-provider HTTPS architecture. Only generative AI requests leaving this client are transmitted to the approved official endpoints of Google, OpenAI, Anthropic, or Groq.`}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}