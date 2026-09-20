import { useEffect, useState } from 'react';
import { Check, Cloud, KeyRound, Loader2, Lock, Trash2, X } from 'lucide-react';
import type { LLMConfig, LLMProvider } from '../types/legal';
import { PROVIDERS, HOSTED_ENTRY, createKeyManager, defaultModel, isHostedProvider } from '../core/storage';
import { requestChat } from '../core/providerCall';
import { useAuth } from '../core/auth';

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
      setStatus(isHostedProvider(provider) ? 'ok|Hosted inference enabled. Your trials run through the Overrool server.' : 'ok|Key secured in the local key vault. Requests go direct to the provider.');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-ink bg-felt-900 shadow-2xl">
        <header className="flex items-center justify-between border-b border-ink px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-chip-gold/15 text-chip-gold">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-cream">Key Vault</h2>
              <p className="text-[11px] text-cream/50">Bring Your Own Key · zero-knowledge, direct HTTPS</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-md border border-ink text-cream/50 hover:text-cream" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-4 px-5 py-5">
          {!loaded && <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-chip-gold" /></div>}
          {loaded && (
            <>
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-cream/50">Provider engine</label>
                <div className="grid grid-cols-2 gap-2">
                  {[...PROVIDERS, ...(admin ? [HOSTED_ENTRY] : [])].map((p) => (
                    <button
                      aria-label={`Use ${p.label} as provider`}
                      key={p.id}
                      type="button"
                      onClick={() => selectProvider(p.id)}
                      aria-pressed={provider === p.id}
                      className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                        provider === p.id ? 'border-chip-gold bg-chip-gold/10' : 'border-ink hover:border-cream/30'
                      }`}
                    >
                      <span className={`block text-[12px] font-semibold ${provider === p.id ? 'text-chip-gold' : 'text-cream/80'}`}>{p.label}</span>
                      <span className="block font-mono text-[9px] text-cream/50">{p.envHint}</span>
                    </button>
                  ))}
                </div>
                {!admin && (
                  <p className="mt-1.5 text-[10px] text-cream/50">Hosted inference is available to the workspace administrator — everyone else brings their own key.</p>
                )}
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-cream/50">Model id</label>
                  <input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder={defaultModel(provider)}
                    className="w-full rounded-lg border border-ink bg-ink px-3 py-2 font-mono text-[12px] text-cream outline-none focus:border-chip-gold/50"
                  />
                </div>
              </div>

              {!isHostedProvider(provider) && (
                <>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-cream/50">API key</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cream/50" />
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-…"
                        autoComplete="off"
                        className="w-full rounded-lg border border-ink bg-ink py-2 pl-9 pr-3 font-mono text-[12px] text-cream outline-none focus:border-chip-gold/50"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-lg border border-ink bg-ink/50 px-3 py-2.5">
                    <div>
                      <p className="text-[12px] font-medium text-cream/80">Persist across sessions</p>
                      <p className="text-[10px] text-cream/50">{persist ? 'Web: stored in your browser storage' : 'Web: session-only, wiped on tab close'}</p>
                    </div>
                    <button
                      aria-label="Persist API key across sessions"
                      type="button"
                      role="switch"
                      aria-checked={persist}
                      onClick={() => void togglePersist()}
                      className={`relative h-5 w-9 rounded-full transition-colors ${persist ? 'bg-chip-gold' : 'bg-felt-700'}`}
                    >
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-ink transition-transform ${persist ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </>
              )}

              {status && (
                <div className={`rounded-lg border px-3 py-2 text-[11px] leading-relaxed ${
                  statusKind === 'ok' ? 'border-chip-gold/40 bg-chip-gold/5 text-chip-gold' : 'border-poker-red/40 bg-poker-red/5 text-poker-red'
                }`}>
                  {statusMsg}
                </div>
              )}

              {config && (
                <p className="flex items-center gap-1.5 text-[11px] text-chip-gold">
                  <Check className="h-3.5 w-3.5" /> Active: {labelFor(config.provider)} · {config.model}
                </p>
              )}

              <div className="flex gap-2">
                <button
          aria-label="Save key to vault"
                  type="button"
                  onClick={() => void save()}
                  disabled={saving}

                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-chip-gold px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-ink hover:brightness-110 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isHostedProvider(provider) ? <Cloud className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />} {isHostedProvider(provider) ? 'Enable hosted' : 'Save to vault'}
                </button>
                <button
          aria-label="Test API key connection"
                  type="button"
                  onClick={() => void test()}
                  disabled={testing}

                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-cream/30 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-cream/70 hover:border-chip-gold/40 hover:text-chip-gold disabled:opacity-50"
                >
                  {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Test
                </button>
                <button
          aria-label="Clear stored API key"
                  type="button"
                  onClick={() => void clear()}

                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-poker-red/40 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-poker-red hover:bg-poker-red/10"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Clear
                </button>
              </div>

              <p className="text-[10px] leading-relaxed text-cream/50">
                {isHostedProvider(provider)
                  ? 'Hosted inference runs on the Overrool server via Cloudflare Workers AI — no key on this device. The workspace administrator can reach the model anywhere without a billing card; everyone else brings their own key.'
                  : `Your key never leaves this device. Simulated trials call ${provider === 'gemini' ? 'Google Gemini' : provider.toUpperCase()} directly over HTTPS from your client. No chat history or case details are transmitted to any intermediary server. On the web your key rests unencrypted in browser storage — anyone using this device can read it; clear it when you're done.`}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}