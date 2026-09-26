import { useState } from 'react';
import { NEWS_ITEMS } from '../core/news';
import { useAuth } from '../core/auth';

interface NewsFeedProps {
  /** Opens the sign-up dialog (signed-out visitors can't subscribe without an account). */
  onNeedAccount: () => void;
}

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
    <section className="mb-6 rounded-3xl border border-slate-200/90 bg-white/90 p-5 sm:p-6 shadow-xs backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-base font-extrabold text-slate-900">
          The Legal Intelligence Briefing
          {subscribed && (
            <span className="ml-2.5 inline-flex items-center rounded-full bg-emerald-100 px-3 py-0.5 font-sans text-[10px] font-bold text-emerald-800">
              Subscribed
            </span>
          )}
        </h2>
        {!subscribed && (
          <button
            aria-label="Subscribe free to the AI Briefing"
            type="button"
            disabled={busy}
            onClick={() => void subscribe()}
            className="rounded-full bg-blue-600 hover:bg-blue-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            Subscribe Free
          </button>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </p>
      )}

      {subscribed ? (
        <ul className="mt-4 space-y-4">
          {NEWS_ITEMS.map((item) => (
            <li key={item.id} className="border-l-2 border-blue-500 pl-3.5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {item.date} · {item.tag}
              </p>
              <p className="mt-0.5 font-display text-sm font-extrabold text-slate-900">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.body}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs leading-relaxed text-slate-600">
          What's new in contract risk and AI law: <strong className="text-slate-900">{latest.title}</strong> — {latest.body.split('.')[0]}.
          <span className="text-slate-500"> Subscribe free to receive weekly precedent ratios and contract risk updates.</span>
        </p>
      )}
    </section>
  );
}