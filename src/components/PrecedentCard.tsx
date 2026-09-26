import type { Domain, Jurisdiction, PrecedentCard } from '../types/legal';

interface PrecedentCardProps {
  card: PrecedentCard;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  exhaustible?: boolean;
  exhausted?: boolean;
}

const JURISDICTION_TAG: Record<Jurisdiction, { label: string; bg: string }> = {
  US: { label: 'U.S. Law', bg: 'bg-sky-400/20 text-sky-200 border-sky-400/40' },
  UK: { label: 'U.K. Common', bg: 'bg-indigo-400/20 text-indigo-200 border-indigo-400/40' },
  EU: { label: 'E.U. Law', bg: 'bg-blue-400/20 text-blue-200 border-blue-400/40' },
  CA: { label: 'Canada', bg: 'bg-rose-400/20 text-rose-200 border-rose-400/40' },
  AU: { label: 'Australia', bg: 'bg-emerald-400/20 text-emerald-200 border-emerald-400/40' },
  ZA: { label: 'South Africa', bg: 'bg-amber-400/20 text-amber-200 border-amber-400/40' },
  IN: { label: 'India Supreme', bg: 'bg-orange-400/20 text-orange-200 border-orange-400/40' },
};

const DOMAIN_CHIP: Record<Domain, { label: string; cls: string }> = {
  Constitutional: { label: 'Constitutional', cls: 'm3-chip-cyan' },
  Criminal: { label: 'Criminal', cls: 'm3-chip-rose' },
  Administrative: { label: 'Administrative', cls: 'm3-chip-primary' },
  Property: { label: 'Property', cls: 'm3-chip-emerald' },
  Tort: { label: 'Tort', cls: 'm3-chip-emerald' },
  Contract: { label: 'Contract', cls: 'm3-chip-primary' },
  Digital_Rights: { label: 'Digital Rights', cls: 'm3-chip-lavender' },
  Indigenous: { label: 'Indigenous', cls: 'm3-chip-emerald' },
  Environmental: { label: 'Environmental', cls: 'm3-chip-emerald' },
  Labor: { label: 'Labor', cls: 'm3-chip-primary' },
  Tenancy: { label: 'Tenancy', cls: 'm3-chip-lavender' },
};

export function PrecedentCard({ card, selected, disabled, onSelect, exhaustible, exhausted }: PrecedentCardProps) {
  const chip = DOMAIN_CHIP[card.domain] ?? { label: card.domain, cls: 'm3-chip' };
  const jTag = card.jurisdiction ? JURISDICTION_TAG[card.jurisdiction] : { label: 'Common Law', bg: 'bg-slate-400/20 text-slate-200 border-slate-400/30' };

  return (
    <div className="relative">
      {card.sourceUrl && (
        <a
          href={card.sourceUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Read the full judgment of ${card.caseName}`}
          className="absolute -left-1 -top-2.5 z-10 flex items-center gap-1 rounded-full border border-amber-400/40 bg-slate-900 px-2.5 py-0.5 font-mono text-[9px] font-medium text-amber-300 shadow-md hover:bg-amber-400 hover:text-slate-950 transition-colors"
        >
          <span>Official Text ↗</span>
        </a>
      )}
      <button
        aria-label={exhausted ? `${card.caseName} already played` : `Play ${card.caseName}`}
        type="button"
        onClick={onSelect}
        disabled={disabled || exhausted}
        aria-pressed={selected}
        className={[
          'group relative w-full text-left rounded-2xl border border-white/10 transition-all duration-200',
          exhausted
            ? 'cursor-not-allowed opacity-35 grayscale bg-slate-900 shadow-none'
            : selected
              ? 'bg-slate-900 border-amber-400 ring-4 ring-amber-400/30 -translate-y-1.5 shadow-xl'
              : disabled
                ? 'cursor-default bg-slate-900/90 shadow-md'
                : 'cursor-pointer bg-slate-900/80 shadow-md hover:-translate-y-1 hover:border-amber-400/50 hover:shadow-xl active:translate-y-0 backdrop-blur-md',
        ].join(' ')}
      >
        <div className="overflow-hidden rounded-2xl">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-4 py-2 text-white">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-semibold text-amber-200">
                § {card.citation}
              </span>
            </div>
            <span className={`rounded-full border px-2 py-0.5 font-mono text-[9px] ${jTag.bg}`}>
              {jTag.label}
            </span>
          </div>

          {/* Card Body */}
          <div className="space-y-2 p-4">
            <p className="font-display text-sm font-bold leading-snug text-white">
              {card.caseName}
            </p>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
              <span>{card.court}</span>
              <span>•</span>
              <span className="text-slate-300">{card.year}</span>
            </div>
            <p className="line-clamp-3 text-xs leading-relaxed text-slate-300">
              {card.ratioDecidendi}
            </p>

            {/* Footer tags */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
              <span className={`m3-chip text-[9px] ${chip.cls}`}>
                {chip.label}
              </span>
              {exhaustible && !exhausted && (
                <span className="font-sans text-xs font-semibold text-amber-300 transition-transform group-hover:translate-x-1">
                  Deploy Precedent ▸
                </span>
              )}
              {exhausted && (
                <span className="font-mono text-[10px] text-slate-500">
                  Admitted to Record
                </span>
              )}
            </div>
          </div>
        </div>

        {selected && (
          <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-950 bg-amber-400 font-bold text-xs text-slate-950 shadow-lg">
            ✓
          </span>
        )}
      </button>
    </div>
  );
}
