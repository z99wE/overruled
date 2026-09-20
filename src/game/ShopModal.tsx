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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border-2 border-ink bg-felt-900 shadow-[0_8px_0_0_var(--color-ink)]">
        <header className="flex items-center justify-between border-b-2 border-ink px-4 py-3">
          <div>
            <h2 className="font-display text-sm uppercase tracking-widest text-chip-gold">Chambers Shop</h2>
            <p className="font-mono text-[9px] uppercase tracking-widest text-cream/40">Jokers reshape how every verdict scores</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-lg border-2 border-ink bg-chip-gold px-2 py-1 font-display text-[11px] text-ink">
              🪙 {chips}
            </span>
            <button
            aria-label="Close shop"
            type="button"
            onClick={onClose}
            className="btn-3d flex h-8 w-8 items-center justify-center rounded-lg border-2 border-ink bg-felt-800 text-cream"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </header>
        <div className="grid max-h-[65vh] gap-2.5 overflow-y-auto p-4 sm:grid-cols-2">
          {JOKERS.map((j) => {
            const isOwned = owned.includes(j.id);
            const afford = chips >= j.cost;
            return (
              <div
                key={j.id}
                className="flex flex-col justify-between rounded-xl border-2 border-ink bg-felt-800/70 p-3"
              >
                <div>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="font-display text-[12px] text-cream">{j.name}{isOwned ? ' ✓' : ''}</p>
                    <span className={`rounded border-2 border-ink px-1.5 py-0.5 font-display text-[8px] uppercase tracking-widest ${rarityCls(j.rarity)}`}>
                      {j.rarity}
                    </span>
                  </div>
                  <p className="text-[11px] leading-snug text-cream/65">{j.blurb}</p>
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
                    'btn-3d mt-2.5 rounded-lg border-2 border-ink px-3 py-1.5 font-display text-[11px] uppercase tracking-wider',
                    isOwned
                      ? 'cursor-default bg-felt-950 text-cream/40'
                      : afford
                        ? 'bg-chip-gold text-ink'
                        : 'cursor-not-allowed bg-felt-950 text-cream/30',
                  ].join(' ')}
                >
                  {isOwned ? 'In play' : `🪙 ${j.cost}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
