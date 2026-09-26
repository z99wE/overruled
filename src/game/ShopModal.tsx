import { X } from 'lucide-react';
import { JOKERS, rarityCls, type JokerId } from './jokers';
import { sfx } from './sfx';

export function ShopModal({
  chips,
  owned,
  onBuy,
  onClose,
}: {
  chips: number;
  owned: readonly string[];
  onBuy: (id: string, cost: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-2xl rounded-3xl border border-white/15 bg-slate-900/95 shadow-2xl backdrop-blur-2xl">
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="font-display text-base font-bold text-amber-300">Chambers Emporium</h2>
            <p className="font-sans text-xs text-slate-400">Jokers reshape how every precedent and verdict scores</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-1 font-mono text-xs font-semibold text-amber-300">
              🪙 {chips} chips
            </span>
            <button
              aria-label="Close shop"
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-slate-300 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>
        <div className="grid max-h-[65vh] gap-3.5 overflow-y-auto p-6 sm:grid-cols-2">
          {JOKERS.map((j) => {
            const isOwned = owned.includes(j.id);
            const afford = chips >= j.cost;
            return (
              <div
                key={j.id}
                className="flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-sm"
              >
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <p className="font-display text-sm font-bold text-white">{j.name}{isOwned ? ' ✓' : ''}</p>
                    <span className={`rounded-full border px-2 py-0.5 font-mono text-[9px] ${rarityCls(j.rarity)}`}>
                      {j.rarity}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-300">{j.blurb}</p>
                </div>
                <button
                  aria-label={isOwned ? `In play: ${j.name}` : `Buy ${j.name} for ${j.cost} chips`}
                  type="button"
                  disabled={isOwned || !afford}
                  onClick={() => {
                    sfx.chips();
                    onBuy(j.id as JokerId, j.cost);
                  }}
                  className={[
                    'm3-btn mt-3.5 w-full py-2 text-xs',
                    isOwned
                      ? 'cursor-default bg-slate-900 text-slate-500 border border-white/5'
                      : afford
                        ? 'm3-btn-primary'
                        : 'cursor-not-allowed bg-slate-900/50 text-slate-600 border border-white/5',
                  ].join(' ')}
                >
                  {isOwned ? 'Admitted to Deck' : `🪙 ${j.cost} Chips`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
