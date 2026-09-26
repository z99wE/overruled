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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div>
            <h2 className="font-display text-base font-extrabold text-slate-900">Chambers Emporium</h2>
            <p className="font-sans text-xs text-slate-500">Advocate privileges &amp; procedural modifiers that reshape court scoring</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-amber-300 bg-amber-50 px-3.5 py-1 font-sans text-xs font-black text-amber-950 shadow-2xs">
              🪙 {chips} chips
            </span>
            <button
              aria-label="Close shop"
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              ✕
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
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-2xs transition-all hover:bg-white hover:shadow-xs"
              >
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <p className="font-display text-sm font-extrabold text-slate-900">{j.name}{isOwned ? ' ✓' : ''}</p>
                    <span className={`rounded-full border px-2 py-0.5 font-sans text-[10px] font-bold ${rarityCls(j.rarity)}`}>
                      {j.rarity}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600">{j.blurb}</p>
                </div>
                <button
                  aria-label={isOwned ? `In play: ${j.name}` : `Buy ${j.name} for ${j.cost} chips`}
                  type="button"
                  disabled={isOwned || !afford}
                  onClick={() => {
                    sfx.chips();
                    onBuy(j.id as JokerId, j.cost);
                  }}
                  className={`mt-3.5 w-full rounded-full py-2 text-xs font-bold transition-all cursor-pointer ${
                    isOwned
                      ? 'cursor-default bg-emerald-100 text-emerald-800'
                      : afford
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                      : 'cursor-not-allowed bg-slate-200 text-slate-400'
                  }`}
                >
                  {isOwned ? 'Admitted to Deck ✓' : `🪙 ${j.cost} Chips`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
