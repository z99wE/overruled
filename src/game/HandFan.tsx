import type { CSSProperties } from 'react';
import { Layers } from 'lucide-react';
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
 * YOUR HAND — the matter's verified deck dealt out as a fanned hand of playing
 * cards along the bottom of the table. Cards deal in one by one on entry,
 * dead cards flip to their back ("SPENT"), the selected card lifts for the
 * table, and the Clerk reads the pot.
 */
export function HandFan({ cards, playedIds, selectedId, active, onSelect, pot, streak, clientName }: HandFanProps) {
  const n = cards.length;
  const center = (n - 1) / 2;
  const step = 40;
  const maxRot = Math.min(16, Math.max(6, n * 3));

  const pos = (i: number): { x: number; rot: number } => {
    const t = i - center;
    return { x: t * step, rot: center === 0 ? 0 : (t * maxRot) / center };
  };

  return (
    <div className="shrink-0 border-t-2 border-ink/60 bg-felt-950/80 px-3 pb-2 pt-2">
      {/* One flex row, not three absolute labels: the old layout let the Clerk
          line run under the deck counter and rotated cards reach the title. */}
      <div className="mx-auto flex max-w-2xl items-center gap-3 pb-1.5">
        <p className="min-w-0 flex-1 truncate font-mono text-[9px] uppercase tracking-widest text-cream/50">
          Your hand · <span className="text-felt-200">{clientName}</span>
        </p>
        <p className="hidden min-w-0 flex-1 truncate text-center font-mono text-[9px] uppercase tracking-widest text-cream/45 sm:block">
          <span className="text-chip-gold">Clerk</span>
          {streak > 0 ? ` · ${streak} sustained in a row` : ''}
          {pot > 0 ? ` · pot ${pot}` : ' · record open'}
        </p>
        <span className="flex shrink-0 items-center gap-1 rounded-md border-2 border-ink bg-ink/50 px-1.5 py-1 font-mono text-[9px] uppercase tracking-widest text-cream/70">
          <Layers className="h-3 w-3" /> {cards.length - playedIds.size} in hand
        </span>
      </div>

      <div className="relative mx-auto h-40 max-w-2xl">
        {/* Seat outlines, sized to the real card (72x101) so they read as empty
            slots instead of a sliver peeking out from behind each card. */}
        {cards.map((c, i) => {
          const p = pos(i);
          const spent = playedIds.has(c.id);
          return (
            <span
              key={`seat-${c.id}`}
              aria-hidden
              className={`absolute bottom-1 left-1/2 aspect-[5/7] w-[72px] rounded-lg border-2 ${
                spent ? 'border-cream/10 bg-ink/20' : 'border-dashed border-chip-gold/25 bg-ink/10'
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
          const transform = selected ? `${base} translateY(-30px) rotate(0deg) scale(1.1)` : slot;
          // Dimming the whole hand to 55% whenever another mode was active made
          // the cards effectively unreadable. Only spent cards recede now.
          const opacity = burned ? 0.6 : 1;
          const cardStyle = {
            '--hand-slot': slot,
            '--hand-op': opacity,
            transform,
            opacity,
            zIndex: selected ? 20 : 20 - i,
            animation: 'handDeal 0.55s cubic-bezier(0.2, 0.8, 0.2, 1) both',
            animationDelay: `${i * 70}ms`,
          } as CSSProperties;
          return (
            <div
              key={c.id}
              className="absolute bottom-1 left-1/2 transition-all duration-500"
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
                label={playable ? `Play ${c.caseName}` : `${c.caseName} — card spent`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}