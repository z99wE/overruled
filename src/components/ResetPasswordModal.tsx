import { useEffect, useRef, useState } from 'react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-slate-900/95 shadow-2xl backdrop-blur-2xl">
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300 font-serif font-bold text-sm">
              §
            </div>
            <div>
              <h2 className="font-display text-sm font-bold text-white">Choose a New Password</h2>
              <p className="text-[11px] text-slate-400">Secure link · valid for single use</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-slate-300 hover:text-white font-serif text-sm" aria-label="Close">
            ✕
          </button>
        </header>

        <form onSubmit={(e) => void submit(e)} className="space-y-4 px-6 py-5">
          <p className="text-xs leading-relaxed text-slate-300">
            Set a new password for your account. The reset link in your email expires in 30 minutes and can only be
            used once.
          </p>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">New Password</label>
            <input
              ref={pwRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="w-full rounded-xl border border-white/15 bg-slate-950/80 px-3.5 py-2.5 font-mono text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-400/60"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              placeholder="Repeat your new password"
              className="w-full rounded-xl border border-white/15 bg-slate-950/80 px-3.5 py-2.5 font-mono text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-400/60"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2 text-xs leading-relaxed text-rose-300">{error}</div>
          )}

          <button
            aria-label="Save my new password"
            type="submit"
            disabled={busy}
            className="m3-btn m3-btn-primary w-full py-2.5 text-xs font-bold"
          >
            {busy ? 'Updating...' : 'Set New Password ▸'}
          </button>
        </form>
      </div>
    </div>
  );
}