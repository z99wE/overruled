import { useEffect, useRef, useState } from 'react';
import { Loader2, LogIn, Mail, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../core/auth';

interface AuthModalProps {
  mode: 'signup' | 'login';
  onClose: () => void;
}

export function AuthModal({ mode: initialMode, onClose }: AuthModalProps) {
  const { user, signup, login, logout } = useAuth();
  const [mode, setMode] = useState<'signup' | 'login'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (mode === 'signup') await signup(email, password);
      else await login(email, password);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-ink bg-felt-900 shadow-2xl">
        <header className="flex items-center justify-between border-b border-ink px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-chip-gold/15 text-chip-gold">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-cream">
                {user ? 'Your account' : mode === 'signup' ? 'Sign up' : 'Log in'}
              </h2>
              <p className="text-[11px] text-cream/50">Cloudflare-hosted · syncs progress across devices</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-md border border-ink text-cream/50 hover:text-cream" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-4 px-5 py-5">
          {user ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-chip-gold/30 bg-chip-gold/5 px-3 py-3">
                <p className="flex items-center gap-2 text-[12px] font-medium text-chip-gold">
                  <Mail className="h-3.5 w-3.5" /> {user.email}
                </p>
                <p className="mt-1 text-[11px] text-cream/60">
                  Game progress syncs to this account; your LLM keys stay on this device.
                </p>
              </div>
              <button
                aria-label="Log out of your account"
                type="button"
                onClick={() => void logout().then(onClose)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-poker-red/40 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-poker-red hover:bg-poker-red/10"
              >
                <LogIn className="h-3.5 w-3.5" /> Log out
              </button>
            </div>
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

              {error && (
                <div className="rounded-lg border border-poker-red/40 bg-poker-red/5 px-3 py-2 text-[11px] leading-relaxed text-poker-red">
                  {error}
                </div>
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

              <button
                aria-label={mode === 'signup' ? 'Switch to log in' : 'Switch to sign up'}
                type="button"
                onClick={() => setMode((m) => (m === 'signup' ? 'login' : 'signup'))}
                className="w-full text-center text-[11px] text-cream/60 hover:text-chip-gold"
              >
                {mode === 'signup' ? 'Already have an account? Log in.' : 'No account yet? Sign up free.'}
              </button>

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