import { BookOpenText, Check, Landmark, Scale } from 'lucide-react';
import type { Domain, PrecedentCard } from '../types/legal';

interface PrecedentCardProps {
  card: PrecedentCard;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  exhaustible?: boolean;
  exhausted?: boolean;
}

const DOMAIN_EMOJI: Record<Domain, string> = {
  Environmental: '⛰',
  Constitutional: '⚖',
  Digital_Rights: '🌐',
  Labor: '🔧',
  Tenancy: '🏠',
};

export function PrecedentCard({ card, selected, disabled, onSelect, exhaustible, exhausted }: PrecedentCardProps) {
  const domainEmoji = DOMAIN_EMOJI[card.domain] ?? '⚖';

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled || exhausted}
      aria-pressed={selected}
      className={[
        'group w-full rounded-lg border bg-noir-900/80 text-left transition-all duration-150',
        exhausted
          ? 'cursor-not-allowed opacity-40 saturate-0'
          : selected
            ? 'border-gold shadow-[0_0_0_1px_#F59E0B,0_8px_24px_-8px_rgba(245,158,11,0.4)]'
            : 'border-noir-700 hover:border-gold/60 hover:shadow-lg',
        disabled ? 'pointer-events-none' : 'cursor-pointer',
      ].join(' ')}
    >
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-noir-800 text-sm text-gold">
              {domainEmoji}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-gold">
                {card.citation}
              </p>
              <p className="text-[10px] text-noir-500">
                {card.court} · {card.year}
              </p>
            </div>
          </div>
          {selected && <Check className="h-4 w-4 shrink-0 text-gold" />}
          {exhaustible && !exhausted && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-noir-500" title="Expends after play" />
          )}
        </div>

        <p className="font-serif text-[13px] font-medium leading-snug text-cream/90">{card.caseName}</p>

        <p className="line-clamp-3 text-[11px] leading-relaxed text-noir-500">{card.ratioDecidendi}</p>

        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="inline-flex items-center gap-1 rounded border border-gold/25 bg-gold/10 px-1.5 py-0.5 text-[9px] font-medium text-gold">
            <Landmark className="h-2.5 w-2.5" /> {card.domain.toUpperCase()}
          </span>
          {card.statutoryProvisions.slice(0, 2).map((s, i) => (
            <span
              key={`${s}-${i}`}
              className="inline-flex items-center gap-1 rounded border border-noir-700 bg-noir-800/70 px-1.5 py-0.5 font-mono text-[9px] text-cream/70"
            >
              <BookOpenText className="h-2.5 w-2.5" /> {s}
            </span>
          ))}
        </div>

        {exhaustible && !exhausted && (
          <div className="flex items-center justify-end pt-1 text-[9px] font-semibold uppercase tracking-wide text-noir-500 transition-colors group-hover:text-gold">
            <Scale className="mr-1 h-3 w-3" /> Play card
          </div>
        )}
      </div>
    </button>
  );
}