import { Check, ExternalLink } from 'lucide-react';
import { authorityWeight, domainSuit, faceOf, JURISDICTION_CODE, type CardFaceLike } from './cardMeta';

export type GameCardSize = 'sm' | 'md' | 'lg';

interface GameCardProps {
  card: CardFaceLike;
  size?: GameCardSize;
  faceDown?: boolean;
  burned?: boolean;
  selected?: boolean;
  playable?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  showSource?: boolean;
  label?: string;
}

const SIZE: Record<GameCardSize, { w: string; hg: string; name: string; ratio: string }> = {
  sm: { w: 'w-[72px]', hg: 'aspect-[5/7]', name: 'text-[10px]', ratio: 'line-clamp-2 text-[8px]' },
  md: { w: 'w-[96px]', hg: 'aspect-[5/7]', name: 'text-[12px]', ratio: 'line-clamp-3 text-[9px]' },
  lg: { w: 'w-28', hg: 'aspect-[5/7]', name: 'text-[13px]', ratio: 'line-clamp-4 text-[10px]' },
};

function BackFace({ size }: { size: GameCardSize }) {
  return (
    <div
      className={`${SIZE[size].w} ${SIZE[size].hg} relative overflow-hidden rounded-lg border-2 border-ink bg-gradient-to-b from-felt-500 via-felt-700 to-felt-900`}
      aria-hidden
    >
      <div
        className="absolute inset-[3px] rounded-md border border-chip-gold/60"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(244,180,27,0.16) 0 5px, rgba(6,19,13,0) 5px 10px)' }}
      />
      <span className="absolute inset-0 flex items-center justify-center font-display text-[2px] text-chip-gold/70 tracking-widest">
        OVERROOL
      </span>
      <span className="absolute left-1 top-1 text-[7px] text-chip-gold/80">▬</span>
      <span className="absolute bottom-1 right-1 rotate-180 text-[7px] text-chip-gold/80">▬</span>
    </div>
  );
}

export function GameCard({
  card,
  size = 'md',
  faceDown = false,
  burned = false,
  selected = false,
  playable = false,
  disabled = false,
  onClick,
  showSource = false,
  label,
}: GameCardProps) {
  const face = faceOf(card);
  const weight = authorityWeight(face.court);
  const suit = face.domain ? domainSuit(face.domain) : '◆';
  const jTag = face.jurisdiction ? JURISDICTION_CODE[face.jurisdiction] : 'LAW';
  const s = SIZE[size];

  if (faceDown || burned) {
    return (
      <div className={`${s.w} ${s.hg} transition-all duration-300 ${burned ? 'grayscale opacity-45' : ''}`}>
        <BackFace size={size} />
        {burned && (
          <p className="mt-0.5 text-center font-mono text-[7px] uppercase tracking-widest text-cream/40">SPENT</p>
        )}
      </div>
    );
  }

  return (
    <div className="relative transition-transform duration-200">
      <button
        type="button"
        aria-label={label ?? `Play ${face.caseName}`}
        aria-pressed={selected}
        disabled={disabled || !playable}
        onClick={onClick}
        className={[
          'group relative block overflow-hidden rounded-lg border-2 border-ink bg-paper text-left shadow-[0_4px_0_0_var(--color-ink)] transition-all duration-200',
          playable && !disabled ? 'cursor-pointer hover:-translate-y-1 hover:shadow-[0_7px_0_0_var(--color-ink)]' : 'cursor-default',
          selected ? 'ring-4 ring-chip-gold shadow-[0_7px_0_0_var(--color-ink)]' : '',
          burned ? 'opacity-40 saturate-0' : '',
        ].join(' ')}
      >
        {/* Corner pips */}
        <span className="pointer-events-none absolute left-1 top-1 flex items-center gap-0.5 font-mono text-[9px] font-bold text-chip-gold" style={{ textShadow: '1px 1px 0 var(--color-ink)' }}>
          {suit}
          <span className="text-[7px]">{jTag}</span>
        </span>
        <span className="pointer-events-none absolute bottom-1 right-1 rotate-180 font-mono text-[9px] font-bold text-chip-gold" style={{ textShadow: '1px 1px 0 var(--color-ink)' }}>
          {suit}
        </span>

        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-1 bg-poker-red px-1.5 py-1">
            <span className="truncate font-mono text-[7px] text-cream">{face.citation}</span>
          </div>
          <div className="flex flex-1 flex-col gap-1 p-1.5">
            <p className={`${s.name} font-sans font-bold leading-tight text-ink`}>{face.caseName}</p>
            <p className="font-mono text-[6px] uppercase tracking-wide text-ink/50">
              {face.court} · {face.year}
            </p>
            <p className={`${s.ratio} leading-snug text-ink/70`}>{face.ratio}</p>
            <div className="mt-auto flex items-center justify-between gap-1 pt-1">
              <span className="flex gap-0.5" aria-label={`Authority weight ${weight} of 5`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className={`h-1 w-2 rounded-sm ${n <= weight ? 'bg-chip-gold' : 'bg-ink/15'}`}
                  />
                ))}
              </span>
              <span className="font-mono text-[7px] text-ink/40">{face.citation.slice(0, 10)}</span>
            </div>
          </div>
        </div>

        {selected && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-ink bg-chip-gold text-ink">
            <Check className="h-3 w-3" strokeWidth={3.5} />
          </span>
        )}
      </button>

      {showSource && card.sourceUrl && (
        <a
          href={card.sourceUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Read the full judgment of ${face.caseName}`}
          className="absolute -right-1.5 -top-2 z-10 flex items-center gap-0.5 rounded-full border border-ink bg-paper px-1.5 py-0.5 font-display text-[7px] tracking-wider text-ink transition-colors hover:bg-chip-gold"
        >
          <ExternalLink className="h-2 w-2" strokeWidth={3} /> FULL
        </a>
      )}
    </div>
  );
}