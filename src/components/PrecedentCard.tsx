import { Check, ExternalLink } from 'lucide-react';
import type { Domain, Jurisdiction, PrecedentCard } from '../types/legal';

interface PrecedentCardProps {
  card: PrecedentCard;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  exhaustible?: boolean;
  exhausted?: boolean;
}

const JURISDICTION_TAG: Record<Jurisdiction, string> = {
  US: 'U.S.',
  UK: 'U.K.',
  EU: 'E.U.',
  CA: 'CAN',
  AU: 'AUS',
  ZA: 'RSA',
  IN: 'IND',
};

const DOMAIN_CHIP: Record<Domain, { label: string; cls: string }> = {
  Constitutional: { label: 'CONSTITUTIONAL', cls: 'bg-poker-blue text-cream' },
  Criminal: { label: 'CRIMINAL', cls: 'bg-poker-red text-cream' },
  Administrative: { label: 'ADMIN', cls: 'bg-chip-orange text-ink' },
  Property: { label: 'PROPERTY', cls: 'bg-felt-600 text-cream' },
  Tort: { label: 'TORT', cls: 'bg-felt-700 text-cream' },
  Contract: { label: 'CONTRACT', cls: 'bg-chip-gold text-ink' },
  Digital_Rights: { label: 'DIGITAL', cls: 'bg-poker-blue-deep text-cream' },
  Indigenous: { label: 'INDIGENOUS', cls: 'bg-felt-400 text-ink' },
  Environmental: { label: 'ENVIRONMENTAL', cls: 'bg-felt-600 text-cream' },
  Labor: { label: 'LABOR', cls: 'bg-chip-orange text-ink' },
  Tenancy: { label: 'SHELTER', cls: 'bg-felt-700 text-cream' },
};

export function PrecedentCard({ card, selected, disabled, onSelect, exhaustible, exhausted }: PrecedentCardProps) {
  const chip = DOMAIN_CHIP[card.domain] ?? { label: card.domain.toUpperCase(), cls: 'bg-felt-600 text-cream' };
  const jTag = card.jurisdiction ? JURISDICTION_TAG[card.jurisdiction] : 'LAW';

  return (
    <div className="relative">
      {card.sourceUrl && (
        <a
          href={card.sourceUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Read the full judgment of ${card.caseName}`}
          className="absolute -left-1.5 -top-2 z-10 flex items-center gap-0.5 rounded-full border border-ink bg-paper px-1.5 py-0.5 font-display text-[8px] tracking-wider text-ink transition-colors hover:bg-chip-gold"
        >
          <ExternalLink className="h-2.5 w-2.5" strokeWidth={3} />
          FULL TEXT
        </a>
      )}
    <button
      aria-label={exhausted ? `${card.caseName} already played` : `Play ${card.caseName}`}
      type="button"
      onClick={onSelect}
      disabled={disabled || exhausted}
      aria-pressed={selected}
      className={[
        'group relative w-full rounded-xl border-2 border-ink text-left',
        exhausted
          ? 'cursor-not-allowed opacity-45 saturate-0'
          : selected
            ? 'card-3d -translate-y-1 ring-4 ring-chip-gold'
            : disabled
              ? 'cursor-default'
              : 'card-3d cursor-pointer',
      ].join(' ')}
    >
      <div className="overflow-hidden rounded-[10px] bg-paper">
        <div className="flex items-center justify-between bg-poker-red px-3 py-1.5">
          <span className="font-display text-[10px] tracking-wider text-cream">{card.citation}</span>
          <span className="rounded border border-cream/50 bg-ink/25 px-1 font-mono text-[9px] font-bold text-cream">
            {jTag}
          </span>
        </div>

        <div className="space-y-2 p-3">
          <p className="font-sans text-[14px] font-bold leading-tight text-ink">{card.caseName}</p>
          <p className="font-mono text-[9px] uppercase tracking-wide text-ink/50">
            {card.court} · {card.year}
          </p>
          <p className="line-clamp-3 text-[11px] leading-snug text-ink/70">{card.ratioDecidendi}</p>
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <span className={`rounded-sm px-1.5 py-0.5 font-display text-[8px] tracking-wider ${chip.cls}`}>
              {chip.label}
            </span>
            {exhaustible && !exhausted && (
              <span className="font-display text-[8px] tracking-wider text-poker-red opacity-0 transition-opacity group-hover:opacity-100">
                PLAY ▸
              </span>
            )}
            {exhausted && <span className="font-display text-[8px] tracking-wider text-ink/40">SPENT</span>}
          </div>
        </div>
      </div>

      {selected && (
        <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink bg-chip-gold text-ink">
          <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
        </span>
      )}
    </button>
    </div>
  );
}
