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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md selection:bg-blue-200 selection:text-slate-950">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-serif font-bold text-sm">
              §
            </div>
            <div>
              <h2 className="font-display text-sm font-extrabold text-slate-900">Choose a New Password</h2>
              <p className="text-[11px] text-slate-500">Secure link · valid for single use</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer" aria-label="Close">
            ✕
          </button>
        </header>

        <form onSubmit={(e) => void submit(e)} className="space-y-4 px-6 py-5">
          <p className="text-xs leading-relaxed text-slate-600">
            Set a new password for your counsel account. The reset link expires in 30 minutes.
          </p>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">New Password</label>
            <input
              ref={pwRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 font-sans text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              placeholder="Repeat your new password"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 font-sans text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs leading-relaxed text-rose-700 font-medium">{error}</div>
          )}

          <button
            aria-label="Save my new password"
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-blue-600 hover:bg-blue-700 py-3 text-xs font-bold text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {busy ? 'Updating...' : 'Set New Password ▸'}
          </button>
        </form>
      </div>
    </div>
  );
}