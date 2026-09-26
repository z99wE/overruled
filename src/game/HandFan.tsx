import type { CSSProperties } from 'react';
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
 * YOUR HAND — the matter's verified precedent deck dealt out in giant, tactile,
 * legible cards along the bottom chamber tray.
 */
export function HandFan({ cards, playedIds, selectedId, active, onSelect, pot, streak, clientName }: HandFanProps) {
  const n = cards.length;
  const center = (n - 1) / 2;
  const step = 85; // generous spread for giant legible cards
  const maxRot = Math.min(8, Math.max(3, n * 1.5));

  const pos = (i: number): { x: number; rot: number } => {
    const t = i - center;
    return { x: t * step, rot: center === 0 ? 0 : (t * maxRot) / center };
  };

  return (
    <div className="shrink-0 border-t border-slate-200/80 bg-white/80 backdrop-blur-xl px-4 pb-4 pt-3 shadow-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 pb-2">
        <div className="flex items-center gap-2">
          <p className="font-sans text-xs font-bold text-slate-900">
            Precedent Deck · <span className="text-blue-700">{clientName}</span>
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-slate-500">
          <span className="text-slate-700 font-bold">Clerk</span>
          {streak > 0 && <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">· {streak} sustained streak</span>}
          {pot > 0 ? <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">· pot {pot}</span> : <span>· record open</span>}
        </div>

        <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-3.5 py-1 font-mono text-[11px] text-slate-700 shadow-xs">
          <span className="font-bold text-blue-700">{cards.length - playedIds.size}</span> in hand
        </span>
      </div>

      <div className="relative mx-auto h-64 sm:h-76 max-w-5xl flex items-end justify-center overflow-x-auto overflow-y-visible px-4 pb-3">
        {/* Seat silhouettes */}
        {cards.map((c, i) => {
          const p = pos(i);
          const spent = playedIds.has(c.id);
          return (
            <span
              key={`seat-${c.id}`}
              aria-hidden
              className={`absolute bottom-2 left-1/2 aspect-[5/7.2] w-[150px] sm:w-[175px] rounded-xl border ${
                spent ? 'border-slate-200/60 bg-slate-100/50' : 'border-dashed border-blue-300 bg-blue-50/40'
              }`}
              style={{ transform: `translateX(calc(-50% + ${p.x}px)) rotate(${p.rot}deg)` }}
            />
          );
        })}

        {cards.map((c, i) => {
          const p = pos(i);
          const burned = playedIds.has(c.id);
          const selected = selectedId === c.id;
          const playable = active && !burned;
          const base = `translateX(calc(-50% + ${p.x}px))`;
          const rot = `rotate(${p.rot}deg)`;
          const slot = `${base} translateY(0px) ${rot}`;
          const transform = selected ? `${base} translateY(-36px) rotate(0deg) scale(1.12)` : slot;
          const opacity = burned ? 0.5 : 1;
          const cardStyle = {
            '--hand-slot': slot,
            '--hand-op': opacity,
            transform,
            opacity,
            zIndex: selected ? 30 : 20 - i,
            animation: 'handDeal 0.55s cubic-bezier(0.2, 0.8, 0.2, 1) both',
            animationDelay: `${i * 70}ms`,
          } as CSSProperties;

          return (
            <div
              key={c.id}
              className="absolute bottom-2 left-1/2 transition-all duration-300 hover:z-40"
              style={cardStyle}
            >
              <GameCard
                card={c}
                size="sm"
                faceDown={burned}
                burned={burned}
                selected={selected}
                playable={playable}
                disabled={!playable || (selectedId !== null && !selected)}
                onClick={() => onSelect(c.id)}
                flipMode="both"
                flipDelay={i * 70 + 160}
                label={playable ? `Play ${c.caseName}` : `${c.caseName} — spent`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}