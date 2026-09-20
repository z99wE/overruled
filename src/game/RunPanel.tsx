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
}: {
  run: RunState;
  onChange: (next: RunState) => void;
}) {
  const [muted, setMuted] = useState(isMuted());
  const rank = rankForXp(run.xp);
  const scalps = run.bossesDefeated
    .map((id) => id.replace('static-', '')[0].toUpperCase())
    .join(' ');

  const reset = () => {
    if (window.confirm('Burn the whole run? Chips, rank, perks — everything goes.')) {
      clearRun();
      onChange({ ...run, ...{ chips: 0, xp: 0, bestStreak: 0, bossesDefeated: [], perks: [], matterChips: {}, caseOfDay: null } });
    }
  };

  return (
    <section className="rounded-2xl border-2 border-ink bg-felt-950/70 p-4 shadow-[0_6px_0_0_var(--color-ink)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-lg border-2 border-ink bg-chip-gold px-2.5 py-1 font-display text-sm text-ink">
            🪙 {run.chips}
          </span>
          <span className="rounded-lg border-2 border-ink bg-felt-800 px-2.5 py-1 font-display text-[11px] uppercase tracking-wider text-cream">
            {rank.title} · LVL {rank.level}
          </span>
          {run.bestStreak > 1 && (
            <span className="streak-flame inline-flex items-center gap-1 rounded-lg border-2 border-ink bg-chip-orange px-2 py-1 font-display text-[11px] text-ink">
              <Flame className="h-3 w-3" /> best ×{run.bestStreak}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
          aria-label={muted ? 'Unmute' : 'Mute'}
            type="button"
            onClick={() => setMuted(toggleMute())}
            className="btn-3d flex h-8 w-8 items-center justify-center rounded-lg border-2 border-ink bg-felt-800 text-cream"

          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button
          aria-label="Open shop"
            type="button"
            onClick={() => sfx.shop()}

            className="btn-3d inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-felt-800 px-3 py-1.5 font-display text-[11px] uppercase tracking-wider text-chip-gold"
          >
            <ShoppingBag className="h-3.5 w-3.5" /> Shop
          </button>
          <button
          aria-label="Reset run"
            type="button"
            onClick={reset}
            className="btn-3d flex h-8 w-8 items-center justify-center rounded-lg border-2 border-ink bg-felt-800 text-cream"

          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t-2 border-ink/40 pt-3">
        <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-cream/40">
          <Trophy className="h-3 w-3" /> boss scalps
        </span>
        {scalps ? (
          <span className="font-display text-[12px] text-chip-gold">{scalps}</span>
        ) : (
          <span className="font-mono text-[10px] text-cream/40">none yet — take a bench</span>
        )}
        {rank.nextAt != null && (
          <span className="ml-auto font-mono text-[10px] text-cream/40">
            next rank at {rank.nextAt} xp
          </span>
        )}
      </div>
      {run.jokers.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t-2 border-ink/40 pt-3">
          <span className="mr-1 font-mono text-[10px] uppercase tracking-widest text-cream/40">jokers in play</span>
          {run.jokers.map((id) => {
            const j = jokerById(id);
            if (!j) return null;
            return (
              <span
                key={id}
                title={j.blurb}
                className={`rounded border-2 border-ink px-1.5 py-0.5 font-display text-[9px] uppercase tracking-wider shadow-[0_2px_0_0_var(--color-ink)] ${rarityCls(j.rarity)}`}
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
