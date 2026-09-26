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

  const title = view === 'codes' ? 'Recovery Codes' : view === 'forgot' ? 'Reset Password' : user ? 'Counsel Workspace' : mode === 'signup' ? 'Create Counsel Account' : 'Sign In to Overrool';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md selection:bg-blue-200 selection:text-slate-950">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl">
        {/* ── Modal Header ────────────────────────────────────── */}
        <header className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm shadow-sm">
              {view === 'codes' ? '§' : '⚖️'}
            </div>
            <div>
              <h2 className="font-display text-sm sm:text-base font-extrabold text-slate-900">{title}</h2>
              <p className="font-sans text-[11px] text-slate-500">
                Encrypted Workspace & Precedent Sync
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
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        {/* ── Modal Body ──────────────────────────────────────── */}
        <div className="space-y-4 px-6 py-6">
          {view === 'codes' && codes ? (
            <div className="space-y-4">
              <p className="text-xs leading-relaxed text-slate-600">
                Store these recovery codes in a secure location. Each code works once if you ever lose your password. We only store cryptographic one-way hashes.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {codes.map((code) => (
                  <code key={code} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center font-mono text-xs font-bold text-slate-800 select-all">
                    {code}
                  </code>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setCodes(null);
                  setView('form');
                  onClose();
                }}
                className="w-full rounded-full bg-blue-600 hover:bg-blue-700 py-3 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
              >
                I Have Saved My Codes →
              </button>
            </div>
          ) : user ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-blue-50/80 border border-blue-200/80 p-4 space-y-1">
                <span className="font-sans text-[10px] font-bold text-blue-700 uppercase tracking-wider">Signed In Counsel</span>
                <p className="font-mono text-xs font-bold text-slate-900 break-all">{user.email}</p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Your audited dockets and common law precedent chips sync automatically to your secure vault.
                </p>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 bg-slate-50">
                <div>
                  <p className="font-sans text-xs font-bold text-slate-900">Weekly Precedent Briefing</p>
                  <p className="font-sans text-[11px] text-slate-500">Curated landmark analyses and ratio updates.</p>
                </div>
                <button
                  type="button"
                  onClick={() => void toggleNewsletter()}
                  disabled={busy}
                  className={`rounded-full px-3.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                    user.newsletterOptin
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {user.newsletterOptin ? 'Active' : 'Enable'}
                </button>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => void generateCodes()}
                  disabled={busy}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Generate Backup Recovery Codes
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    onClose();
                  }}
                  className="w-full rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : view === 'forgot' ? (
            <form onSubmit={(e) => void submitForgot(e)} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your counsel email address. We will generate a secure reset link.
              </p>
              <div>
                <label className="block font-sans text-xs font-bold text-slate-700 mb-1">
                  Counsel Email
                </label>
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="counsel@firm.com"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs font-sans text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
                  required
                />
              </div>

              {notice && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium">
                  {notice}
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-blue-600 hover:bg-blue-700 py-3 text-xs font-bold text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {busy ? 'Generating link…' : 'Send Reset Link →'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setView('form');
                    setError(null);
                    setNotice(null);
                  }}
                  className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={(e) => void submit(e)} className="space-y-4">
              <div>
                <label className="block font-sans text-xs font-bold text-slate-700 mb-1">
                  Work Email Address
                </label>
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="counsel@firm.com"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs font-sans text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-sans text-xs font-bold text-slate-700">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setView('forgot');
                        setError(null);
                      }}
                      className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 8 characters' : 'Enter password'}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs font-sans text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
                  required
                />
              </div>

              {mode === 'signup' && (
                <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={newsletter}
                    onChange={(e) => setNewsletter(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    <strong className="text-slate-900 font-bold">Weekly Legal Briefing:</strong> Receive updates on contract risk analysis and landmark precedent ratios.
                  </span>
                </label>
              )}

              {error && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-blue-600 hover:bg-blue-700 py-3 text-xs font-bold text-white shadow-md hover:scale-102 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
              >
                {busy ? 'Authenticating…' : mode === 'signup' ? 'Create Free Counsel Account →' : 'Sign In →'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'signup' ? 'login' : 'signup');
                    setError(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                >
                  {mode === 'signup' ? 'Already have an account? Sign in.' : "Don't have an account? Create one."}
                </button>
              </div>

              {/* Zero-Leak Security Badge */}
              <div className="pt-2 border-t border-slate-100 text-center">
                <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                  <span>🔒</span>
                  <span>Zero-Leak Guarantee · Document drafts stay private on-device</span>
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}