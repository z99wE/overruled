import type { PrecedentCard } from '../types/legal';
import { GameCard } from './GameCard';

interface HandFanProps {
  cards: PrecedentCard[];
  playedIds: ReadonlySet<string>;
  selectedId: string | null;
  active: boolean;
  onSelect: (id: string) => void;
  pot: number;
  streak: number;
  clientName: string;
}

/**
 * YOUR HAND — precedent cards laid out in a clean horizontal tray.
 * Cards slide slightly apart from center; selected card rises.
 * No ghost silhouettes, no overflow clipping.
 */
export function HandFan({ cards, playedIds, selectedId, active, onSelect, streak, clientName }: HandFanProps) {
  const unplayed = cards.length - playedIds.size;

  return (
    <div className="shrink-0 border-t border-slate-200 bg-white/95 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
      {/* Header strip */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
          <p className="font-sans text-xs font-bold text-slate-900 truncate">
            Precedent Deck ·{' '}
            <span className="text-blue-700 font-medium">{clientName}</span>
          </p>
          {streak > 0 && (
            <span className="ml-1 shrink-0 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-800">
              {streak}× streak
            </span>
          )}
        </div>
        <span className="shrink-0 flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-[11px] text-slate-700">
          <span className="font-bold text-blue-700">{unplayed}</span>
          <span className="text-slate-500">in hand</span>
        </span>
      </div>

      {/* Card tray — ample top padding so cards never clip when selected or hovering */}
      <div className="overflow-x-auto overflow-y-visible pt-8 pb-4 px-4">
        <div
          className="flex items-end justify-center gap-4 sm:gap-5 px-6 pb-1"
          style={{ minWidth: 'max-content', margin: '0 auto' }}
        >
          {cards.map((c, i) => {
            const spent = playedIds.has(c.id);
            const selected = selectedId === c.id;
            const playable = active && !spent;
            const disabled = !playable || (selectedId !== null && !selected);

            return (
              <div
                key={c.id}
                className="shrink-0 transition-all duration-300"
                style={{
                  transform: selected ? 'translateY(-14px) scale(1.04)' : 'translateY(0px)',
                  zIndex: selected ? 30 : spent ? 1 : 10 - i,
                  opacity: spent ? 0.45 : disabled ? 0.7 : 1,
                  animationDelay: `${i * 60}ms`,
                  animation: 'handDeal 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) both',
                }}
              >
                <GameCard
                  card={c}
                  size="sm"
                  faceDown={spent}
                  burned={spent}
                  selected={selected}
                  playable={playable}
                  disabled={disabled}
                  onClick={() => onSelect(c.id)}
                  flipMode="both"
                  flipDelay={i * 60 + 140}
                  label={playable ? `Play ${c.caseName}` : `${c.caseName} — spent`}
                />
                {selected && (
                  <p className="mt-1.5 text-center font-mono text-[9px] font-bold text-blue-700">
                    Selected ↑
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {cards.length === 0 && (
        <div className="flex items-center justify-center py-8 font-mono text-xs text-slate-400">
          No precedents available for this matter
        </div>
      )}
    </div>
  );
}