import { useEffect, useRef, useState } from 'react';
import { KeyRound, Loader2, LogIn, X } from 'lucide-react';
import { useAuth } from '../core/auth';

export function ResetPasswordModal({ token, onClose }: { token: string; onClose: () => void }) {
  const { resetPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pwRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    pwRef.current?.focus();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await resetPassword(token, password);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-ink bg-felt-900 shadow-2xl">
        <header className="flex items-center justify-between border-b border-ink px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-chip-gold/15 text-chip-gold">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-cream">Choose a new password</h2>
              <p className="text-[11px] text-cream/50">Cloudflare-hosted · this link works once</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-md border border-ink text-cream/50 hover:text-cream" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={(e) => void submit(e)} className="space-y-4 px-5 py-5">
          <p className="text-[11px] leading-relaxed text-cream/60">
            Set a new password for your account. The reset link in your email expires in 30 minutes and can only be
            used once — all other sessions on this account are signed out when you continue.
          </p>

          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-cream/50">New password</label>
            <input
              ref={pwRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="w-full rounded-lg border border-ink bg-ink px-3 py-2 font-mono text-[12px] text-cream outline-none focus:border-chip-gold/50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-cream/50">Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              placeholder="Repeat your new password"
              className="w-full rounded-lg border border-ink bg-ink px-3 py-2 font-mono text-[12px] text-cream outline-none focus:border-chip-gold/50"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-poker-red/40 bg-poker-red/5 px-3 py-2 text-[11px] leading-relaxed text-poker-red">{error}</div>
          )}

          <button
            aria-label="Save my new password"
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-chip-gold px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-ink hover:brightness-110 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogIn className="h-3.5 w-3.5" />} Set new password
          </button>
        </form>
      </div>
    </div>
  );
}