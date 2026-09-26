import { useState } from 'react';
import { NEWS_ITEMS } from '../core/news';
import { useAuth } from '../core/auth';

interface NewsFeedProps {
  /** Opens the sign-up dialog (signed-out visitors can't subscribe without an account). */
  onNeedAccount: () => void;
}

/**
 * The in-app AI Briefing — the free newsletter surface. Subscribers see the
 * full feed; everyone else gets a one-line pitch and a free subscribe button.
 * Pure client content, zero external services (Cloudflare-only delivery).
 */
export function NewsFeed({ onNeedAccount }: NewsFeedProps) {
  const { user, setNewsletterOptin } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscribed = !!user?.newsletterOptin;

  const subscribe = async () => {
    if (!user) {
      onNeedAccount();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await setNewsletterOptin(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const latest = NEWS_ITEMS[0];

  return (
    <section className="mb-6 rounded-2xl border border-white/10 bg-slate-900/70 p-5 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-base font-bold text-amber-300">
          The AI Legal Briefing
          {subscribed && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 font-mono text-[9px] text-amber-300">
              Subscribed ✓
            </span>
          )}
        </h2>
        {!subscribed && (
          <button
            aria-label="Subscribe free to the AI Briefing"
            type="button"
            disabled={busy}
            onClick={() => void subscribe()}
            className="m3-btn m3-btn-primary px-4 py-1.5 text-xs font-semibold disabled:opacity-50"
          >
            Subscribe Free
          </button>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-poker-red/40 bg-poker-red/5 px-3 py-2 text-[11px] leading-relaxed text-poker-red">
          {error}
        </p>
      )}

      {subscribed ? (
        <ul className="mt-4 space-y-4">
          {NEWS_ITEMS.map((item) => (
            <li key={item.id} className="border-l-2 border-chip-gold/40 pl-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-cream/45">
                {item.date} · {item.tag}
              </p>
              <p className="mt-0.5 font-display text-sm uppercase tracking-wide text-cream">{item.title}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-cream/70">{item.body}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[13px] leading-relaxed text-cream/75">
          What's new in law-meets-AI, in one short read: <span className="text-cream">{latest.title}</span> — {latest.body.split('.')[0]}.
          <span className="text-cream/50"> Subscribe free to see every update here (no email, no spam).</span>
        </p>
      )}
    </section>
  );
}