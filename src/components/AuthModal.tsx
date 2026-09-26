import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../core/auth';

interface AuthModalProps {
  mode: 'login' | 'signup';
  onClose: () => void;
}

export function AuthModal({ mode: initialMode, onClose }: AuthModalProps) {
  const { user, login, signup, logout, requestReset, setNewsletterOptin, generateRecoveryCodes } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [view, setView] = useState<'form' | 'forgot' | 'codes'>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newsletter, setNewsletter] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, [mode, view]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (mode === 'signup') {
        const res = await signup(email, password, newsletter);
        if (res.recoveryCodes && res.recoveryCodes.length > 0) {
          setCodes(res.recoveryCodes);
          setView('codes');
          return;
        }
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const submitForgot = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await requestReset(email);
      if (res.ok) {
        setNotice(res.emailConfigured ? 'Check your inbox for password reset instructions.' : 'Password reset link generated. Check your email to continue.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const generateCodes = async () => {
    setBusy(true);
    setError(null);
    try {
      const fresh = await generateRecoveryCodes();
      setCodes(fresh.codes);
      setView('codes');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const toggleNewsletter = async () => {
    if (!user) return;
    setBusy(true);
    try {
      await setNewsletterOptin(!user.newsletterOptin);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const title = view === 'codes' ? 'Recovery Codes' : view === 'forgot' ? 'Reset Password' : user ? 'Account & Sync' : mode === 'signup' ? 'Create Account' : 'Sign In';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md selection:bg-amber-400 selection:text-black">
      <div className="w-full max-w-md overflow-hidden liquid-glass-elevated bg-slate-950/95 border border-white/15 shadow-2xl rounded-3xl">
        {/* ── Modal Header ────────────────────────────────────── */}
        <header className="flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/15 text-amber-300 font-serif font-bold text-sm shadow-sm">
              {view === 'codes' ? '§' : '✓'}
            </div>
            <div>
              <h2 className="font-display text-sm font-bold text-white">{title}</h2>
              <p className="font-mono text-[11px] text-slate-400">
                Encrypted Profile &amp; Progress Sync
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setCodes(null);
              setView('form');
              onClose();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-slate-300 hover:text-white font-serif text-sm"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        {/* ── Modal Body ──────────────────────────────────────── */}
        <div className="space-y-4 px-6 py-6">
          {view === 'codes' && codes ? (
            <div className="space-y-4">
              <p className="text-[12px] leading-relaxed text-slate-300">
                Write these recovery codes down. Each code works once if you ever forget your password. We only store cryptographic hashes.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {codes.map((code) => (
                  <div
                    key={code}
                    className="rounded-xl border border-amber-400/30 bg-slate-900 px-3 py-2 text-center font-mono text-[13px] font-bold tracking-[0.15em] text-amber-300"
                  >
                    {code}
                  </div>
                ))}
              </div>
              <button
                aria-label="I have stored my recovery codes somewhere safe"
                type="button"
                onClick={onClose}
                className="m3-btn m3-btn-primary w-full py-2.5 text-xs"
              >
                Saved Safely ✓
              </button>
            </div>
          ) : user ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                <p className="font-display text-xs font-semibold text-amber-300">
                  {user.email}
                </p>
                <p className="mt-1 font-mono text-[10px] text-slate-400">
                  Game run state syncs to this profile. BYOK API keys remain strictly local to this device.
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                <div>
                  <p className="font-mono text-[10px] text-slate-400">Legal Intelligence Briefing</p>
                  <p className="text-[12px] text-slate-200">
                    {user.newsletterOptin ? 'Subscribed to weekly legal analysis.' : 'Not subscribed.'}
                  </p>
                </div>
                <button
                  aria-label={user.newsletterOptin ? 'Unsubscribe from the AI Briefing' : 'Subscribe to the free AI Briefing'}
                  type="button"
                  disabled={busy}
                  onClick={() => void toggleNewsletter()}
                  className={`m3-btn text-[11px] px-3.5 py-1.5 ${
                    user.newsletterOptin ? 'm3-btn-outlined text-slate-400' : 'm3-btn-primary'
                  }`}
                >
                  {user.newsletterOptin ? 'Unsubscribe' : 'Subscribe'}
                </button>
              </div>

              <button
                aria-label="Generate a fresh set of recovery codes"
                type="button"
                disabled={busy}
                onClick={() => void generateCodes()}
                className="m3-btn m3-btn-tonal w-full py-2.5 text-xs text-white"
              >
                {busy ? 'Generating...' : 'Generate Recovery Codes ↺'}
              </button>

              {error && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-950/70 p-3 text-xs font-mono text-rose-200">
                  {error}
                </div>
              )}

              <button
                aria-label="Log out of your account"
                type="button"
                onClick={() => void logout().then(onClose)}
                className="m3-btn m3-btn-destructive w-full py-2.5 text-xs"
              >
                Sign Out ▸
              </button>
            </div>
          ) : view === 'forgot' ? (
            <form onSubmit={(e) => void submitForgot(e)} className="space-y-4">
              <div>
                <label className="mb-1.5 block font-mono text-[10px] text-slate-400">Email Address</label>
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="m3-input px-3.5 font-mono text-xs"
                />
              </div>

              {(error || notice) && (
                <div
                  className={`rounded-xl border p-3 font-mono text-xs ${
                    error ? 'bg-rose-950 text-rose-300 border-rose-500/40' : 'bg-amber-950 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {error ?? notice}
                </div>
              )}

              <button
                aria-label="Email me a reset link"
                type="submit"
                disabled={busy}
                className="m3-btn m3-btn-primary w-full py-2.5 text-xs"
              >
                {busy ? 'Sending...' : 'Send Reset Instructions ▸'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setView('form');
                  setError(null);
                  setNotice(null);
                }}
                className="w-full text-center font-mono text-xs text-amber-400 hover:underline"
              >
                Back to sign in
              </button>
            </form>
          ) : (
            <form onSubmit={(e) => void submit(e)} className="space-y-4">
              <div>
                <label className="mb-1.5 block font-mono text-[10px] text-slate-400">Email Address</label>
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="m3-input px-3.5 font-mono text-xs"
                />
              </div>

              <div>
                <label className="mb-1.5 block font-mono text-[10px] text-slate-400">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
                  className="m3-input px-3.5 font-mono text-xs"
                />
              </div>

              {mode === 'signup' && (
                <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-white/10 bg-slate-900/80 p-3">
                  <input
                    type="checkbox"
                    checked={newsletter}
                    onChange={(e) => setNewsletter(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-amber-400"
                  />
                  <span className="text-[11px] leading-relaxed text-slate-300">
                    <strong className="text-amber-300 font-semibold">Weekly Briefing:</strong> Receive updates on emerging legal technology and precedent analysis.
                  </span>
                </label>
              )}

              {error && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-950/70 p-3 text-xs font-mono text-rose-200">
                  {error}
                </div>
              )}

              <button
                aria-label={mode === 'signup' ? 'Create your free account' : 'Log in to your account'}
                type="submit"
                disabled={busy}
                className="m3-btn m3-btn-primary w-full py-3 text-xs"
              >
                {busy ? 'Processing...' : mode === 'signup' ? 'Create Free Account ▸' : 'Sign In ▸'}
              </button>

              <div className="flex items-center justify-between text-[11px] pt-1">
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setView('forgot');
                      setError(null);
                    }}
                    className="font-mono text-slate-400 hover:text-amber-300"
                  >
                    Forgot password?
                  </button>
                )}
                <button
                  aria-label={mode === 'signup' ? 'Switch to log in' : 'Switch to sign up'}
                  type="button"
                  onClick={() => setMode((m) => (m === 'signup' ? 'login' : 'signup'))}
                  className={mode === 'login' ? 'font-mono text-slate-400 hover:text-amber-300' : 'w-full text-center font-mono text-slate-400 hover:text-amber-300'}
                >
                  {mode === 'signup' ? 'Already have an account? Sign in.' : "Don't have an account? Sign up."}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}