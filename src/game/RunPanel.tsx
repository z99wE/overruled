import { rankForXp } from './economy';
import { jokerById, rarityCls } from './jokers';
import type { RunState } from './runStore';
import { isMuted, sfx, toggleMute } from './sfx';
import { useState } from 'react';
import { clearRun } from './runStore';

export function RunPanel({
  run,
  onChange,
  onOpenShop,
}: {
  run: RunState;
  onChange: (next: RunState) => void;
  onOpenShop?: () => void;
}) {
  const [muted, setMuted] = useState(isMuted());
  const rank = rankForXp(run.xp);
  const scalps = run.bossesDefeated
    .map((id) => id.replace('static-', '')[0].toUpperCase())
    .join(' ');

  const reset = () => {
    if (window.confirm('Reset the whole run ledger? Chips, rank, and active advocate tools will reset.')) {
      clearRun();
      onChange({ ...run, ...{ chips: 0, xp: 0, bestStreak: 0, bossesDefeated: [], jokers: [], matterChips: {}, caseOfDay: null } });
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200/90 bg-white/90 p-5 sm:p-6 shadow-xs backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 font-sans text-xs font-black text-amber-950 shadow-2xs">
            Chips: {run.chips}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 font-sans text-xs font-bold text-slate-800">
            {rank.title} · Level {rank.level}
          </span>
          {run.bestStreak > 1 && (
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 font-mono text-xs font-bold text-blue-700">
              Streak: {run.bestStreak}x
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
            type="button"
            onClick={() => setMuted(toggleMute())}
            className="rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            {muted ? 'Audio: Muted' : 'Audio: Active'}
          </button>
          <button
            aria-label="Open shop"
            type="button"
            onClick={() => {
              sfx.shop();
              onOpenShop?.();
            }}
            className="rounded-full bg-amber-400 hover:bg-amber-300 px-4 py-1.5 text-xs font-black text-slate-950 shadow-xs transition-all cursor-pointer"
          >
            Chambers Emporium
          </button>
          <button
            aria-label="Reset run ledger"
            type="button"
            onClick={reset}
            className="rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 px-4 py-1.5 text-xs font-bold text-rose-700 transition-colors cursor-pointer"
          >
            Reset Ledger
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-xs">
        <span className="font-sans font-bold text-slate-500">
          Resolved Benches:
        </span>
        {scalps ? (
          <span className="font-mono text-xs font-bold text-blue-600">{scalps}</span>
        ) : (
          <span className="font-sans text-xs text-slate-400">0 of 6 static matters completed</span>
        )}
        {rank.nextAt != null && (
          <span className="ml-auto font-sans text-xs text-slate-500">
            Next promotion at <strong className="text-slate-800 font-bold">{rank.nextAt} XP</strong>
          </span>
        )}
      </div>
      {run.jokers.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <span className="mr-1 font-sans text-xs font-bold text-slate-500">Active Modifiers:</span>
          {run.jokers.map((id) => {
            const j = jokerById(id);
            if (!j) return null;
            return (
              <span
                key={id}
                title={j.blurb}
                className={`rounded-full border px-3 py-0.5 font-sans text-xs font-bold ${rarityCls(j.rarity)}`}
              >
                {j.name}
              </span>
            );
          })}
        </div>
      )}
    </section>
  );
}
