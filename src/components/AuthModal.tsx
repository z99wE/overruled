import { useEffect, useRef, useState } from 'react';
import { KeyRound, Loader2, LogIn, Mail, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../core/auth';

interface AuthModalProps {
  mode: 'signup' | 'login';
  onClose: () => void;
}

type View = 'form' | 'forgot' | 'codes';

export function AuthModal({ mode: initialMode, onClose }: AuthModalProps) {
  const { user, signup, login, logout, requestReset, generateRecoveryCodes, setNewsletterOptin } = useAuth();
  const [mode, setMode] = useState<'signup' | 'login'>(initialMode);
  const [view, setView] = useState<View>(user ? 'form' : 'form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newsletter, setNewsletter] = useState(true);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, [view]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      let freshCodes: string[] | null = null;
      if (mode === 'signup') {
        const { recoveryCodes } = await signup(email, password, newsletter);
        freshCodes = recoveryCodes;
      } else {
        await login(email, password);
      }
      if (freshCodes && freshCodes.length > 0) {
        setCodes(freshCodes);
        setPassword('');
        setView('codes');
      } else {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const submitForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Enter the email you used to sign up.');
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const { emailConfigured } = await requestReset(email);
      if (emailConfigured) {
        setNotice('If that address has an account, a password-reset link is on its way — it expires in 30 minutes.');
      } else {
        setNotice('Email delivery isn\u2019t configured for this deployment yet. If you saved your one-time recovery codes at sign-up, use them below instead.');
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
      const { codes: fresh } = await generateRecoveryCodes();
      setCodes(fresh);
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
    setError(null);
    try {
      await setNewsletterOptin(!user.newsletterOptin);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const title = view === 'codes' ? 'Recovery codes' : view === 'forgot' ? 'Reset password' : user ? 'Your account' : mode === 'signup' ? 'Sign up' : 'Log in';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-ink bg-felt-900 shadow-2xl">
        <header className="flex items-center justify-between border-b border-ink px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-chip-gold/15 text-chip-gold">
              {view === 'codes' ? <KeyRound className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-cream">{title}</h2>
              <p className="text-[11px] text-cream/50">Cloudflare-hosted · syncs progress across devices</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setCodes(null);
              setView('form');
              onClose();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-ink text-cream/50 hover:text-cream"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-4 px-5 py-5">
          {view === 'codes' && codes ? (
            <div className="space-y-4">
              <p className="text-[11px] leading-relaxed text-cream/60">
                Write these down somewhere safe. Each code works exactly once — if you lose your password you
                redeem a code to set a new one. We only store scrambled hashes, so nobody (including us) can
                restore these after you leave this screen.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {codes.map((code) => (
                  <div
                    key={code}
                    className="rounded-lg border border-chip-gold/30 bg-ink/60 px-3 py-2 text-center font-mono text-[13px] font-bold tracking-[0.15em] text-cream"
                  >
                    {code}
                  </div>
                ))}
              </div>
              <button
                aria-label="I have stored my recovery codes somewhere safe"
                type="button"
                onClick={onClose}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-chip-gold px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-ink hover:brightness-110"
              >
                <ShieldCheck className="h-3.5 w-3.5" /> I've stored these safely
              </button>
            </div>
          ) : user ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-chip-gold/30 bg-chip-gold/5 px-3 py-3">
                <p className="flex items-center gap-2 text-[12px] font-medium text-chip-gold">
                  <Mail className="h-3.5 w-3.5" /> {user.email}
                </p>
                <p className="mt-1 text-[11px] text-cream/60">
                  Game progress syncs to this account; your LLM keys stay on this device and are scoped to this account — another user who signs in here never sees them.
                </p>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-ink bg-ink/40 px-3 py-2.5">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-cream/50">AI Briefing newsletter</p>
                  <p className="text-[11px] text-cream/65">
                    {user.newsletterOptin ? 'Subscribed — the briefing shows on your matter gallery.' : 'Not subscribed yet.'}
                  </p>
                </div>
                <button
                  aria-label={user.newsletterOptin ? 'Unsubscribe from the AI Briefing' : 'Subscribe to the free AI Briefing'}
                  type="button"
                  disabled={busy}
                  onClick={() => void toggleNewsletter()}
                  className={`shrink-0 rounded-lg border-2 border-ink px-3 py-1.5 font-display text-[11px] uppercase tracking-wider transition disabled:opacity-50 ${
                    user.newsletterOptin ? 'bg-felt-600 text-cream' : 'bg-chip-gold text-ink hover:brightness-110'
                  }`}
                >
                  {user.newsletterOptin ? 'Unsubscribe' : 'Subscribe free'}
                </button>
              </div>
              <button
                aria-label="Generate a fresh set of recovery codes"
                type="button"
                disabled={busy}
                onClick={() => void generateCodes()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-chip-gold/40 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-chip-gold hover:bg-chip-gold/10 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />} Generate recovery codes
              </button>
              {error && (
                <div className="rounded-lg border border-poker-red/40 bg-poker-red/5 px-3 py-2 text-[11px] leading-relaxed text-poker-red">{error}</div>
              )}
              <button
                aria-label="Log out of your account"
                type="button"
                onClick={() => void logout().then(onClose)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-poker-red/40 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-poker-red hover:bg-poker-red/10"
              >
                <LogIn className="h-3.5 w-3.5" /> Log out
              </button>
            </div>
          ) : view === 'forgot' ? (
            <form onSubmit={(e) => void submitForgot(e)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-cream/50">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cream/50" />
                  <input
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-ink bg-ink py-2 pl-9 pr-3 font-mono text-[12px] text-cream outline-none focus:border-chip-gold/50"
                  />
                </div>
              </div>

              {(error || notice) && (
                <div
                  className={`rounded-lg border px-3 py-2 text-[11px] leading-relaxed ${
                    error ? 'border-poker-red/40 bg-poker-red/5 text-poker-red' : 'border-chip-gold/30 bg-chip-gold/5 text-cream/70'
                  }`}
                >
                  {error ?? notice}
                </div>
              )}

              <button
                aria-label="Email me a reset link"
                type="submit"
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-chip-gold px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-ink hover:brightness-110 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />} Send reset link
              </button>

              <p className="text-[10px] leading-relaxed text-cream/50">
                Forgot something else? Ask about your account-scoped BYOK keys — those never leave your device.
              </p>

              <button
                type="button"
                onClick={() => {
                  setView('form');
                  setError(null);
                  setNotice(null);
                }}
                className="w-full text-center text-[11px] text-cream/60 hover:text-chip-gold"
              >
                Back to log in
              </button>
            </form>
          ) : (
            <form onSubmit={(e) => void submit(e)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-cream/50">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cream/50" />
                  <input
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-ink bg-ink py-2 pl-9 pr-3 font-mono text-[12px] text-cream outline-none focus:border-chip-gold/50"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-cream/50">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
                  className="w-full rounded-lg border border-ink bg-ink px-3 py-2 font-mono text-[12px] text-cream outline-none focus:border-chip-gold/50"
                />
              </div>

              {mode === 'signup' && (
                <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-chip-gold/25 bg-chip-gold/5 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={newsletter}
                    onChange={(e) => setNewsletter(e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-chip-gold"
                  />
                  <span className="text-[11px] leading-relaxed text-cream/75">
                    <strong className="text-chip-gold">Send me the free AI Briefing</strong> — what's new in law-meets-AI, delivered
                    in-app. No spam, no email sent (it's an in-product feed), unsubscribe anytime.
                  </span>
                </label>
              )}

              {error && (
                <div className="rounded-lg border border-poker-red/40 bg-poker-red/5 px-3 py-2 text-[11px] leading-relaxed text-poker-red">{error}</div>
              )}

              <button
                aria-label={mode === 'signup' ? 'Create your free account' : 'Log in to your account'}
                type="submit"
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-chip-gold px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-ink hover:brightness-110 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : mode === 'signup' ? <RefreshCw className="h-3.5 w-3.5" /> : <LogIn className="h-3.5 w-3.5" />}
                {mode === 'signup' ? 'Create account' : 'Log in'}
              </button>

              <div className="flex items-center justify-between text-[11px]">
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setView('forgot');
                      setError(null);
                    }}
                    className="text-cream/60 hover:text-chip-gold"
                  >
                    Forgot password?
                  </button>
                )}
                <button
                  aria-label={mode === 'signup' ? 'Switch to log in' : 'Switch to sign up'}
                  type="button"
                  onClick={() => setMode((m) => (m === 'signup' ? 'login' : 'signup'))}
                  className={mode === 'login' ? 'text-cream/60 hover:text-chip-gold' : 'w-full text-center text-cream/60 hover:text-chip-gold'}
                >
                  {mode === 'signup' ? 'Already have an account? Log in.' : 'Sign up free.'}
                </button>
              </div>

              <p className="text-[10px] leading-relaxed text-cream/50">
                Accounts live on Cloudflare (D1). Passwords are stored as salted PBKDF2 hashes, sessions are
                short-lived bearer cookies. Sync covers game progress only — your LLM API keys never leave this device.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}