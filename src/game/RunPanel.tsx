import { Flame, RotateCcw, ShoppingBag, Trophy, Volume2, VolumeX } from 'lucide-react';
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
    if (window.confirm('Reset the whole run ledger? Chips, rank, and active jokers will reset.')) {
      clearRun();
      onChange({ ...run, ...{ chips: 0, xp: 0, bestStreak: 0, bossesDefeated: [], jokers: [], matterChips: {}, caseOfDay: null } });
    }
  };

  return (
    <section className="m3-card-elevated p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-amber-400/40 bg-amber-400/15 px-3.5 py-1.5 font-mono text-sm font-semibold text-amber-300">
            🪙 {run.chips} chips
          </span>
          <span className="rounded-full border border-white/10 bg-slate-900/80 px-3.5 py-1.5 font-sans text-xs font-medium text-slate-200">
            {rank.title} · Level {rank.level}
          </span>
          {run.bestStreak > 1 && (
            <span className="streak-flame inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-1 font-mono text-xs font-semibold text-amber-300">
              <Flame className="h-3.5 w-3.5" /> Best streak ×{run.bestStreak}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
            type="button"
            onClick={() => setMuted(toggleMute())}
            className="m3-btn m3-btn-tonal px-3.5 py-1.5 text-xs text-slate-300 hover:text-white"
          >
            {muted ? <VolumeX className="h-3.5 w-3.5 mr-1" /> : <Volume2 className="h-3.5 w-3.5 mr-1" />}
            {muted ? 'Muted' : 'Sound On'}
          </button>
          <button
            aria-label="Open shop"
            type="button"
            onClick={() => {
              sfx.shop();
              onOpenShop?.();
            }}
            className="m3-btn m3-btn-primary px-4 py-1.5 text-xs"
          >
            <ShoppingBag className="h-3.5 w-3.5 mr-1" /> Chambers Emporium
          </button>
          <button
            aria-label="Reset run ledger"
            type="button"
            onClick={reset}
            className="m3-btn m3-btn-outlined px-3.5 py-1.5 text-xs text-slate-300 hover:text-rose-300"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-400">
          <Trophy className="h-3.5 w-3.5 text-amber-300" /> Overcome Benches:
        </span>
        {scalps ? (
          <span className="font-mono text-xs font-semibold text-amber-300">{scalps}</span>
        ) : (
          <span className="font-sans text-xs text-slate-500">None yet — select a bench to start</span>
        )}
        {rank.nextAt != null && (
          <span className="ml-auto font-mono text-[11px] text-slate-400">
            Next rank at {rank.nextAt} XP
          </span>
        )}
      </div>
      {run.jokers.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
          <span className="mr-1 font-sans text-xs text-slate-400">Jokers in Play:</span>
          {run.jokers.map((id) => {
            const j = jokerById(id);
            if (!j) return null;
            return (
              <span
                key={id}
                title={j.blurb}
                className={`rounded-full border px-2.5 py-0.5 font-sans text-xs ${rarityCls(j.rarity)}`}
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
